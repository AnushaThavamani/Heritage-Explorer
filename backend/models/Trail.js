const mongoose = require('mongoose');

const trailSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  trailName: { type: String, required: true, trim: true, minlength: 2 },
  siteIds: { type: [String], default: [] },
}, { timestamps: true });
module.exports = mongoose.model('Trail', trailSchema);
