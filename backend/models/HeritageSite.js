const mongoose = require('mongoose');

const heritageSiteSchema = new mongoose.Schema({
  siteId: { type: String, required: true, unique: true, trim: true },
  state: { type: String, required: true },
  district: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true },
  description: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  image_url: { type: String },
  image_status: { type: String }, // e.g. "missing", "valid"
  location: { type: String },
  timings: { type: String },
  estimated_visit_time: { type: String },
  wikidata_qid: { type: String },
  osm_id: { type: String },
  category_status: { type: String }, // e.g. "ambiguous", "valid"
  source: { type: String } // e.g. "wikidata", "osm", "merged"
}, { timestamps: true });

module.exports = mongoose.model('HeritageSite', heritageSiteSchema);
