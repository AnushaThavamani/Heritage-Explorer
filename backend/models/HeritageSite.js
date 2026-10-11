const mongoose = require('mongoose');
const { resolveDistrict } = require('../data/districts');
const { resolveCategory, normalizeCategories } = require('../data/categories');

const heritageSiteSchema = new mongoose.Schema({
  // ==========================================
  // Core Identifiers & Existing Fields (Preserved)
  // ==========================================
  siteId: {
    type: String,
    required: [true, 'siteId is required'],
    unique: true,
    trim: true,
    index: true
  },
  state: {
    type: String,
    required: [true, 'state is required'],
    default: 'Tamil Nadu'
  },
  district: {
    type: String,
    required: [true, 'district is required'],
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'name is required'],
    trim: true,
    index: true
  },
  category: {
    type: String,
    required: [true, 'category is required'],
    trim: true,
    index: true
  },
  description: {
    type: String,
    default: ''
  },
  latitude: {
    type: Number,
    validate: {
      validator: v => v === null || v === undefined || (v >= -90 && v <= 90),
      message: 'Latitude must be between -90 and 90'
    }
  },
  longitude: {
    type: Number,
    validate: {
      validator: v => v === null || v === undefined || (v >= -180 && v <= 180),
      message: 'Longitude must be between -180 and 180'
    }
  },
  image_url: {
    type: String,
    default: null
  },
  image_status: {
    type: String, // e.g. "missing", "valid", "resolved", "flagged-for-review"
    default: null
  },
  image_attribution: {
    type: String,
    default: null
  },
  image_license: {
    type: String,
    default: null
  },
  image_source_page: {
    type: String,
    default: null
  },
  location: {
    type: String,
    default: ''
  },
  timings: {
    type: String,
    default: ''
  },
  estimated_visit_time: {
    type: String,
    default: ''
  },
  wikidata_qid: {
    type: String,
    default: null
  },
  osm_id: {
    type: String,
    default: null
  },
  category_status: {
    type: String, // e.g. "ambiguous", "valid"
    default: null
  },
  source: {
    type: String, // e.g. "wikidata", "osm", "merged", "manual"
    default: null
  },

  // ==========================================
  // Additive Fields (Phase 1 Enhancements)
  // ==========================================
  districtId: {
    type: String,
    trim: true,
    lowercase: true,
    index: true,
    default: function() {
      if (!this.district) return undefined;
      const resolved = resolveDistrict(this.district);
      return resolved ? resolved.id : this.district.toLowerCase().replace(/[^a-z0-9]/g, '');
    }
  },
  categories: {
    type: [String],
    default: function() {
      if (!this.category) return [];
      const canonical = resolveCategory(this.category);
      const list = canonical ? [canonical.id] : [this.category.toLowerCase().replace(/[^a-z0-9_]/g, '_')];
      if (this.unesco && !list.includes('unesco')) list.push('unesco');
      return list;
    },
    index: true
  },
  tags: {
    type: [String],
    default: []
  },
  unesco: {
    type: Boolean,
    default: false
  },
  verification_status: {
    type: String,
    enum: ['verified', 'documented', 'candidate', 'unverified'],
    default: 'documented'
  },
  alternate_names: {
    type: [String],
    default: []
  },
  historical_significance: {
    type: String,
    default: ''
  },
  period: {
    type: String,
    default: ''
  },
  source_urls: {
    type: [String],
    default: []
  },
  last_reviewed: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Auto-infer canonical districtId and categories if not explicitly supplied
heritageSiteSchema.pre('validate', function() {
  // Populate canonical districtId from district name
  if (this.district && !this.districtId) {
    const resolved = resolveDistrict(this.district);
    this.districtId = resolved ? resolved.id : this.district.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  // Populate canonical categories array from primary category
  if (this.category && (!this.categories || this.categories.length === 0)) {
    const canonical = resolveCategory(this.category);
    this.categories = canonical ? [canonical.id] : [this.category.toLowerCase().replace(/[^a-z0-9_]/g, '_')];
  }

  // If unesco flag is set, ensure unesco is present in categories
  if (this.unesco && !this.categories.includes('unesco')) {
    this.categories.push('unesco');
  }

  // Ensure image_status reflects image_url presence if not explicitly set
  if (!this.image_status) {
    this.image_status = this.image_url ? 'resolved' : 'missing';
  }
});

module.exports = mongoose.model('HeritageSite', heritageSiteSchema);
