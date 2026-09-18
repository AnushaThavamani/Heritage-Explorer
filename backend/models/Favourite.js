const mongoose = require('mongoose');

const favouriteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  siteId: { type: String, ref: 'HeritageSite', required: true },
}, { timestamps: true });
favouriteSchema.index({ userId: 1, siteId: 1 }, { unique: true });
module.exports = mongoose.model('Favourite', favouriteSchema);
