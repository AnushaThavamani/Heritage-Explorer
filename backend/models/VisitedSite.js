const mongoose = require('mongoose');

const visitedSiteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  siteId: { type: String, required: true },
  visitedAt: { type: Date, default: Date.now },
}, { timestamps: true });
visitedSiteSchema.index({ userId: 1, siteId: 1 }, { unique: true });
module.exports = mongoose.model('VisitedSite', visitedSiteSchema);
