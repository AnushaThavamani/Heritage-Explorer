require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const morgan = require('morgan');
const app = express();
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/heritage-sites', require('./routes/heritageSites'));
app.use('/api/heritagesites', require('./routes/heritageSites'));
app.use('/api/favourites', require('./routes/favourites'));
app.use('/api/trails', require('./routes/trails'));
app.use('/api/quiz-scores', require('./routes/quizScores'));
app.use('/api/visited-sites', require('./routes/visitedSites'));
app.use('/api/visitedsites', require('./routes/visitedSites'));
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
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
      console.log('MongoDB Memory Server connected successfully at ' + mongoUri);
      
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

