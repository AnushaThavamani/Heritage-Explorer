/**
 * Safe, Idempotent Heritage Data Import Pipeline
 * 
 * Features:
 * - Dry-run mode: preview actions without DB mutations
 * - Strict schema validation: checks required fields, coordinate ranges, district & category references
 * - Non-destructive merge: NEVER overwrites valid existing data with empty/null incoming values
 * - Duplicate detection: matches by siteId, and checks name/location collisions
 * - Source attribution: attaches source identifier, verification metadata, and audit timestamps
 * - Detailed reporting: per-record error reports, action log, and summary counts
 */

const { resolveDistrict } = require('../data/districts');
const { resolveCategory } = require('../data/categories');
const HeritageSite = require('../models/HeritageSite');

/**
 * Calculate geographical distance in meters using Haversine formula
 */
function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity;
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Validate an incoming raw record against Phase 1 schema requirements.
 * Returns { valid: boolean, errors: string[], normalized: object|null }
 */
function validateIncomingRecord(raw, defaultSource = 'import') {
  const errors = [];

  if (!raw || typeof raw !== 'object') {
    return { valid: false, errors: ['Record must be a non-null object'], normalized: null };
  }

  // 1. Name validation
  const name = (raw.name || raw.title || '').trim();
  if (!name) {
    errors.push('Missing required field: name');
  }

  // 2. District validation
  const rawDistrict = raw.district || (typeof raw.location === 'string' ? raw.location.split(',')[0].trim() : '') || raw.city;
  const resolvedDistrict = resolveDistrict(rawDistrict);
  if (!resolvedDistrict) {
    errors.push(`Invalid or unresolvable district: "${rawDistrict || 'undefined'}"`);
  }

  // 3. Category validation
  const rawCategory = raw.category || raw.type || 'monument';
  const resolvedCategory = resolveCategory(rawCategory);
  if (!resolvedCategory) {
    errors.push(`Invalid or unresolvable category: "${rawCategory || 'undefined'}"`);
  }

  // 4. Stable Site ID
  let siteId = (raw.siteId || raw.id || '').trim();
  if (!siteId && name && resolvedDistrict) {
    // Generate deterministic fallback slug if siteId not provided
    const nameSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    siteId = `tn-${resolvedDistrict.id}-${nameSlug}`;
  } else if (!siteId) {
    errors.push('Missing required field: siteId');
  }

  // 5. Coordinates validation
  const latitude = raw.latitude != null ? Number(raw.latitude) : (raw.location?.lat != null ? Number(raw.location.lat) : null);
  const longitude = raw.longitude != null ? Number(raw.longitude) : (raw.location?.lng != null ? Number(raw.location.lng) : null);

  if (latitude != null) {
    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      errors.push(`Latitude out of range [-90, 90]: ${latitude}`);
    }
  }

  if (longitude != null) {
    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      errors.push(`Longitude out of range [-180, 180]: ${longitude}`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, normalized: null };
  }

  // Construct normalized record
  const categories = [resolvedCategory.id];
  if (raw.unesco === true && !categories.includes('unesco')) {
    categories.push('unesco');
  }

  const normalized = {
    siteId,
    name,
    state: 'Tamil Nadu',
    district: resolvedDistrict.name,
    districtId: resolvedDistrict.id,
    category: raw.category || resolvedCategory.name,
    categories,
    description: (raw.description || '').trim(),
    latitude,
    longitude,
    image_url: raw.image_url || raw.image || raw.imageUrl || null,
    image_status: (raw.image_url || raw.image || raw.imageUrl) ? 'resolved' : 'missing',
    image_attribution: raw.image_attribution || raw.imageAttribution || null,
    image_license: raw.image_license || raw.imageLicense || null,
    image_source_page: raw.image_source_page || raw.imageSourcePage || null,
    location: (typeof raw.location === 'string' && raw.location.trim()) ? raw.location.trim() : `${name}, ${resolvedDistrict.name}`,
    timings: (raw.timings || raw.visitorTimings || '').trim(),
    estimated_visit_time: (raw.estimated_visit_time || raw.duration || '').trim(),
    wikidata_qid: raw.wikidata_qid || null,
    osm_id: raw.osm_id || null,
    source: raw.source || defaultSource,
    source_urls: Array.isArray(raw.source_urls) ? raw.source_urls : (raw.source_url ? [raw.source_url] : []),
    verification_status: raw.verification_status || 'documented',
    unesco: Boolean(raw.unesco),
    alternate_names: Array.isArray(raw.alternate_names) ? raw.alternate_names : [],
    historical_significance: (raw.historical_significance || '').trim(),
    period: (raw.period || '').trim(),
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    last_reviewed: new Date()
  };

  return { valid: true, errors: [], normalized };
}

/**
 * Merge an incoming record with an existing record safely.
 * Non-destructive rule: NEVER overwrite existing valid non-empty fields with empty/null.
 * Returns { changed: boolean, updateDoc: object, fieldDiffs: object }
 */
function calculateSafeMerge(existing, incoming) {
  const updateDoc = {};
  const fieldDiffs = {};
  let changed = false;

  // Scalar text fields: only update if existing is blank/missing and incoming is provided
  const fillableText = [
    'description', 'timings', 'estimated_visit_time', 'location',
    'historical_significance', 'period', 'wikidata_qid', 'osm_id',
    'image_attribution', 'image_license', 'image_source_page'
  ];
  for (const field of fillableText) {
    const existingVal = existing[field];
    const incomingVal = incoming[field];
    if ((!existingVal || existingVal === '') && incomingVal && incomingVal !== '') {
      updateDoc[field] = incomingVal;
      fieldDiffs[field] = { old: existingVal, new: incomingVal };
      changed = true;
    }
  }

  // Coordinates: only fill if existing has none and incoming has valid numbers
  if ((existing.latitude == null || existing.longitude == null) && incoming.latitude != null && incoming.longitude != null) {
    updateDoc.latitude = incoming.latitude;
    updateDoc.longitude = incoming.longitude;
    fieldDiffs.coordinates = { old: { lat: existing.latitude, lng: existing.longitude }, new: { lat: incoming.latitude, lng: incoming.longitude } };
    changed = true;
  }

  // Image: only fill if existing has no image and incoming does
  if (!existing.image_url && incoming.image_url) {
    updateDoc.image_url = incoming.image_url;
    updateDoc.image_status = 'resolved';
    fieldDiffs.image_url = { old: null, new: incoming.image_url };
    changed = true;
  }

  // Canonical districtId: fill if missing
  if (!existing.districtId && incoming.districtId) {
    updateDoc.districtId = incoming.districtId;
    fieldDiffs.districtId = { old: null, new: incoming.districtId };
    changed = true;
  }

  // Canonical categories: union of arrays
  const existingCategories = Array.isArray(existing.categories) ? existing.categories : [];
  const incomingCategories = Array.isArray(incoming.categories) ? incoming.categories : [];
  const mergedCategories = Array.from(new Set([...existingCategories, ...incomingCategories]));
  if (mergedCategories.length > existingCategories.length) {
    updateDoc.categories = mergedCategories;
    fieldDiffs.categories = { old: existingCategories, new: mergedCategories };
    changed = true;
  }

  // Tags: union
  const existingTags = Array.isArray(existing.tags) ? existing.tags : [];
  const incomingTags = Array.isArray(incoming.tags) ? incoming.tags : [];
  const mergedTags = Array.from(new Set([...existingTags, ...incomingTags]));
  if (mergedTags.length > existingTags.length) {
    updateDoc.tags = mergedTags;
    fieldDiffs.tags = { old: existingTags, new: mergedTags };
    changed = true;
  }

  // Source URLs: union
  const existingUrls = Array.isArray(existing.source_urls) ? existing.source_urls : [];
  const incomingUrls = Array.isArray(incoming.source_urls) ? incoming.source_urls : [];
  const mergedUrls = Array.from(new Set([...existingUrls, ...incomingUrls]));
  if (mergedUrls.length > existingUrls.length) {
    updateDoc.source_urls = mergedUrls;
    fieldDiffs.source_urls = { old: existingUrls, new: mergedUrls };
    changed = true;
  }

  // UNESCO flag: promote to true if incoming is true
  if (!existing.unesco && incoming.unesco) {
    updateDoc.unesco = true;
    fieldDiffs.unesco = { old: false, new: true };
    changed = true;
  }

  // Verification status: upgrade if incoming is verified
  if (existing.verification_status !== 'verified' && incoming.verification_status === 'verified') {
    updateDoc.verification_status = 'verified';
    fieldDiffs.verification_status = { old: existing.verification_status, new: 'verified' };
    changed = true;
  }

  if (changed) {
    updateDoc.last_reviewed = new Date();
  }

  return { changed, updateDoc, fieldDiffs };
}

/**
 * Main Pipeline Function: Import heritage records idempotently.
 * 
 * @param {Array<object>} records - Array of raw incoming records
 * @param {object} options
 * @param {boolean} options.dryRun - When true, simulate operations without DB writes
 * @param {string} options.sourceName - Identifier for the data source
 * @param {Model} options.model - Mongoose HeritageSite model (or mock)
 * @returns {Promise<object>} Report with summary and detailed actions
 */
async function importHeritageRecords(records, options = {}) {
  const {
    dryRun = false,
    sourceName = 'import',
    model = HeritageSite
  } = options;

  const report = {
    dryRun,
    sourceName,
    summary: {
      total: Array.isArray(records) ? records.length : 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      rejected: 0
    },
    actions: [],
    errors: []
  };

  if (!Array.isArray(records) || records.length === 0) {
    return report;
  }

  for (let i = 0; i < records.length; i++) {
    const raw = records[i];
    const indexLabel = `Record #${i + 1}`;

    // 1. Validate & Normalize
    const validation = validateIncomingRecord(raw, sourceName);
    if (!validation.valid) {
      report.summary.rejected++;
      const errorEntry = {
        index: i,
        siteId: raw?.siteId || raw?.id || 'unknown',
        name: raw?.name || raw?.title || 'unknown',
        action: 'rejected',
        reason: validation.errors.join('; ')
      };
      report.actions.push(errorEntry);
      report.errors.push(errorEntry);
      continue;
    }

    const normalized = validation.normalized;

    // 2. Duplicate Detection
    // Check by siteId
    let existing = await model.findOne({ siteId: normalized.siteId });

    // Fallback: check by exact name + district
    if (!existing) {
      existing = await model.findOne({
        name: { $regex: new RegExp(`^${normalized.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        districtId: normalized.districtId
      });
    }

    // Fallback 2: check by coordinate proximity (< 300 meters) AND name similarity
    if (!existing && normalized.latitude != null && normalized.longitude != null) {
      const candidates = await model.find({
        districtId: normalized.districtId,
        latitude: { $gte: normalized.latitude - 0.005, $lte: normalized.latitude + 0.005 },
        longitude: { $gte: normalized.longitude - 0.005, $lte: normalized.longitude + 0.005 }
      });

      for (const cand of candidates) {
        const dist = haversineDistanceMeters(normalized.latitude, normalized.longitude, cand.latitude, cand.longitude);
        if (dist < 300) {
          // If both records specify explicit different siteIds, they are distinct entities co-located in the same historic complex
          if (raw.siteId && cand.siteId && raw.siteId !== cand.siteId) {
            continue;
          }
          const stopWords = new Set(['temple', 'temples', 'fort', 'forts', 'cave', 'caves', 'rock', 'palace', 'monument', 'shrine', 'hills', 'tamil', 'nadu', normalized.districtId]);
          const normWords = normalized.name.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));
          const candWords = cand.name.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));
          const sharesNameWord = normWords.some(w => candWords.includes(w));
          if (sharesNameWord || !raw.siteId) {
            existing = cand;
            break;
          }
        }
      }
    }

    // 3. Insert or Safe Update
    if (!existing) {
      // Record does not exist: INSERT
      if (!dryRun) {
        await model.create(normalized);
      }
      report.summary.inserted++;
      report.actions.push({
        siteId: normalized.siteId,
        name: normalized.name,
        district: normalized.district,
        action: 'inserted',
        dryRun
      });
    } else {
      // Record exists: check if non-destructive update is needed
      const merge = calculateSafeMerge(existing, normalized);
      if (merge.changed) {
        if (!dryRun) {
          await model.updateOne({ siteId: existing.siteId }, { $set: merge.updateDoc });
        }
        report.summary.updated++;
        report.actions.push({
          siteId: existing.siteId,
          name: existing.name,
          district: existing.district,
          action: 'updated',
          diff: merge.fieldDiffs,
          dryRun
        });
      } else {
        // Idempotent: record already exists and has all data
        report.summary.skipped++;
        report.actions.push({
          siteId: existing.siteId,
          name: existing.name,
          district: existing.district,
          action: 'skipped',
          reason: 'Duplicate identical record; no new information to merge',
          dryRun
        });
      }
    }
  }

  return report;
}

module.exports = {
  validateIncomingRecord,
  calculateSafeMerge,
  importHeritageRecords,
  haversineDistanceMeters
};
