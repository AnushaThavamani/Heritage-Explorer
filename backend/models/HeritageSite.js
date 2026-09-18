const mongoose = require('mongoose');

const heritageSiteSchema = new mongoose.Schema({
  siteId: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  title: String,
  location: { type: String, required: true },
  city: String,
  district: String,
  state: String,
  stateCode: String,
  image: String,
  imageUrl: String,
  timings: String,
  visitorTimings: String,
  duration: String,
  description: { type: String, required: true },
  category: { type: String, required: true },
  type: String,
  unesco: Boolean,
  latitude: Number,
  longitude: Number,
  wikipediaUrl: String,
}, { timestamps: true });

module.exports = mongoose.model('HeritageSite', heritageSiteSchema);
