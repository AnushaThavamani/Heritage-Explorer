require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/heritage-sites', require('./routes/heritageSites'));
app.use('/api/favourites', require('./routes/favourites'));
app.use('/api/trails', require('./routes/trails'));
app.use('/api/quiz-scores', require('./routes/quizScores'));
app.use('/api/visited-sites', require('./routes/visitedSites'));
app.use((error, req, res, next) => {
  if (error.code === 11000) return res.status(409).json({ message: 'That record already exists.' });
  console.error(error);
  res.status(500).json({ message: 'Internal server error.' });
});

const port = process.env.PORT || 5000;
if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/heritage_explorer')
    .then(() => app.listen(port, () => console.log(`Heritage API listening on port ${port}`)))
    .catch(error => { console.error('MongoDB connection failed:', error.message); process.exit(1); });
}
module.exports = app;
