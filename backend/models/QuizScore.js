const mongoose = require('mongoose');

const quizScoreSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quizId: { type: String, required: true, trim: true },
  score: { type: Number, required: true, min: 0 },
  dateTaken: { type: Date, default: Date.now },
}, { timestamps: true });
module.exports = mongoose.model('QuizScore', quizScoreSchema);
