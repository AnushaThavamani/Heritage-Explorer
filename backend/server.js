require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const morgan = require('morgan');
const app = express();
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve local images from public/
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/heritage-sites', require('./routes/heritageSites'));
app.use('/api/heritagesites', require('./routes/heritageSites'));
app.use('/api/sites', require('./routes/sites'));
app.use('/api/favourites', require('./routes/favourites'));
app.use('/api/trails', require('./routes/trails'));
app.use('/api/quiz-scores', require('./routes/quizScores'));
app.use('/api/visited-sites', require('./routes/visitedSites'));
app.use('/api/visitedsites', require('./routes/visitedSites'));

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const imageCacheDir = path.join(__dirname, 'cache', 'images');
try {
  if (!fs.existsSync(imageCacheDir)) {
    fs.mkdirSync(imageCacheDir, { recursive: true });
  }
} catch (e) {}

app.get('/api/image-proxy', async (req, res) => {
  let url = req.query.url;
  if (!url) return res.status(400).send('URL required');

  // Normalise: convert Wikimedia thumb URL to direct upload URL if needed
  const thumbMatch = url.match(
    /(?:thumb|upload)\.wikimedia\.org\/(wikipedia\/[^/]+\/)thumb\/([^/]+\/[^/]+\/)([^/?#]+)(?:\/[^/?#]+)?/
  );
  if (thumbMatch) {
    url = `https://upload.wikimedia.org/${thumbMatch[1]}${thumbMatch[2]}${thumbMatch[3]}`;
  }

  // Strip tracking params
  try {
    const parsed = new URL(url);
    ['utm_source', 'utm_campaign', 'utm_content', 'utm_medium', 'utm_term'].forEach(
      k => parsed.searchParams.delete(k)
    );
    url = parsed.toString().replace(/\?$/, '');
  } catch { /* leave as-is */ }

  // Force HTTPS
  if (url.startsWith('http://')) url = 'https://' + url.slice(7);

  // Check disk cache first
  const cacheKey = crypto.createHash('md5').update(url).digest('hex') + '.jpg';
  const cachedFilePath = path.join(imageCacheDir, cacheKey);
  try {
    if (fs.existsSync(cachedFilePath)) {
      res.set('Content-Type', 'image/jpeg');
      res.set('Cache-Control', 'public, max-age=2592000'); // 30 days
      res.set('Access-Control-Allow-Origin', '*');
      return res.sendFile(cachedFilePath);
    }
  } catch (e) {}

  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'HeritageExplorer/1.0 (https://github.com/AnushaThavamani/Heritage-Explorer; developer@heritageexplorer.app) Node/22.11',
        'Accept': 'image/webp,image/jpeg,image/png,image/*,*/*;q=0.8',
        'Referer': 'https://commons.wikimedia.org/',
      }
    });

    if (!response.ok) {
      console.error(`Image proxy: upstream ${response.status} for ${url}`);
      return res.status(502).send(`Upstream error ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Reject non-image responses (e.g. HTML error pages)
    if (!contentType.startsWith('image/') && !contentType.startsWith('application/octet')) {
      return res.status(502).send('Upstream returned non-image content');
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.set('Cache-Control', 'public, max-age=2592000'); // 30 days
    res.set('Access-Control-Allow-Origin', '*');

    try {
      const sharp = require('sharp');
      const processed = await sharp(buffer)
        .resize({ width: 800, withoutEnlargement: true })
        .jpeg({ quality: 82 })
        .toBuffer();

      // Write to disk cache asynchronously
      fs.promises.writeFile(cachedFilePath, processed).catch(() => {});

      res.set('Content-Type', 'image/jpeg');
      return res.send(processed);
    } catch (sharpErr) {
      // If sharp cannot process format, stream original buffer
      res.set('Content-Type', contentType);
      return res.send(buffer);
    }
  } catch (err) {
    console.error('Image proxy error:', err.message, 'URL:', url);
    res.status(500).send('Failed to fetch image');
  }
});


app.use((error, req, res, next) => {
  if (error.code === 11000) return res.status(409).json({ message: 'That record already exists.' });
  console.error(error);
  res.status(500).json({ message: 'Internal server error.' });
});

const port = process.env.PORT || 5000;
if (require.main === module) {
  if (!process.env.JWT_SECRET) { console.error('Server configuration failed: JWT_SECRET is not configured.'); process.exit(1); }
  const startServer = async () => {
    try {
      const mongoUri = process.env.MONGODB_URI;
      if (!mongoUri) throw new Error('MONGODB_URI is not defined in .env');
      await mongoose.connect(mongoUri);
      console.log('MongoDB connected successfully at ' + mongoUri);
      
      // Seeding should now be done via the seedPipeline.js script
      console.log('Database ready for data-driven heritage sites');

      app.listen(port, () => console.log(`Heritage API listening on port ${port}`));
    } catch (error) {
      console.error('MongoDB connection failed:', error.message);
      process.exit(1);
    }
  };
  startServer();
}
module.exports = app;

