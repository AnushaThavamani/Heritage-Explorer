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

app.get('/api/image-proxy', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send('URL required');
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    if (!response.ok) {
      throw new Error(`Wikimedia responded with ${response.status} ${response.statusText}`);
    }
    const contentType = response.headers.get('content-type');
    if (contentType) res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=31536000');
    
    // Convert Web ReadableStream to Node Readable stream
    const { Readable } = require('stream');
    try {
      const sharp = require('sharp');
      res.set('Content-Type', 'image/jpeg');
      Readable.fromWeb(response.body)
        .pipe(sharp().resize({ width: 600, withoutEnlargement: true }).jpeg({ quality: 80 }))
        .pipe(res);
    } catch (e) {
      // fallback if sharp is not installed
      if (contentType) res.set('Content-Type', contentType);
      Readable.fromWeb(response.body).pipe(res);
    }
  } catch (err) {
    console.error('Image proxy error:', err.message);
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

