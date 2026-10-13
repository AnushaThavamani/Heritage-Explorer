const mongoose = require('mongoose');
const HeritageSite = require('../models/HeritageSite');
const { resolveDistrict } = require('../data/districts');
const { resolveCategory } = require('../data/categories');

/**
 * Escape special characters in string for safe regular expressions
 */
function escapeRegex(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * Sanitize query input into clean string, mitigating NoSQL operator injection
 */
function sanitizeInput(val) {
  if (typeof val === 'string') return val.trim();
  if (Array.isArray(val)) return val.map(sanitizeInput).filter(Boolean).join(',');
  return '';
}

/**
 * Convert a Wikimedia Commons thumbnail URL to the direct full-resolution upload URL.
 * thumb.wikimedia.org/wikipedia/commons/thumb/X/YY/File.jpg/330px-File.jpg
 * -> upload.wikimedia.org/wikipedia/commons/X/YY/File.jpg
 */
function wikiThumbToUpload(url) {
  if (!url || typeof url !== 'string') return null;
  const thumbMatch = url.match(
    /(?:thumb|upload)\.wikimedia\.org\/(wikipedia\/[^/]+\/)thumb\/([^/]+\/[^/]+\/)([^/?#]+)(?:\/[^/?#]+)?/
  );
  if (!thumbMatch) return null;
  return `https://upload.wikimedia.org/${thumbMatch[1]}${thumbMatch[2]}${thumbMatch[3]}`;
}

/**
 * Normalise an image URL:
 * 1. Wikimedia thumb -> direct upload URL
 * 2. Strip UTM/tracking query parameters
 * 3. Force HTTPS
 */
function normalizeImageUrl(url) {
  if (!url || typeof url !== 'string') return url;
  let result = url.trim();

  // Convert Wikimedia thumb to direct upload URL
  const uploadUrl = wikiThumbToUpload(result);
  if (uploadUrl) {
    result = uploadUrl;
  } else {
    // Strip UTM/tracking parameters from non-thumb URLs
    try {
      const parsed = new URL(result);
      ['utm_source', 'utm_campaign', 'utm_content', 'utm_medium', 'utm_term'].forEach(
        k => parsed.searchParams.delete(k)
      );
      result = parsed.toString();
      if (result.endsWith('?')) result = result.slice(0, -1);
    } catch {
      // Leave as-is if URL is not parseable
    }
  }

  // Force HTTPS
  if (result.startsWith('http://')) {
    result = 'https://' + result.slice(7);
  }

  return result || null;
}

const fs = require('fs');
const path = require('path');

let imageCache = {};
let lastCacheMtime = 0;
const CACHE_PATH = path.join(__dirname, '../data/image_cache.json');

function getImageCache() {
  try {
    if (fs.existsSync(CACHE_PATH)) {
      const stats = fs.statSync(CACHE_PATH);
      if (stats.mtimeMs !== lastCacheMtime) {
        imageCache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
        lastCacheMtime = stats.mtimeMs;
      }
    }
  } catch (e) {
    if (!imageCache) imageCache = {};
  }
  return imageCache;
}
getImageCache();

/**
 * Ensure raw lean/aggregated documents contain canonical districtId, categories,
 * image attribution, and coordinate verification flags.
 */
function formatSiteDocument(site) {
  if (!site) return site;
  const doc = typeof site.toObject === 'function' ? site.toObject() : { ...site };
  if (!doc.districtId && doc.district) {
    const resolved = resolveDistrict(doc.district);
    doc.districtId = resolved ? resolved.id : doc.district.toLowerCase().replace(/[^a-z0-9]/g, '');
  }
  if ((!doc.categories || doc.categories.length === 0) && doc.category) {
    const canonical = resolveCategory(doc.category);
    doc.categories = canonical ? [canonical.id] : [doc.category.toLowerCase().replace(/[^a-z0-9_]/g, '_')];
  }

  // Enrich image attribution and source page from image_cache if missing
  const cache = getImageCache();
  const siteKey = doc.siteId || doc.id;
  if (siteKey && cache[siteKey]) {
    const cached = cache[siteKey];
    if (!doc.image_attribution && cached.imageAttribution) {
      doc.image_attribution = typeof cached.imageAttribution === 'string' ? cached.imageAttribution.trim() : null;
    }
    if (!doc.image_source_page && cached.imageSourcePage) {
      doc.image_source_page = typeof cached.imageSourcePage === 'string' ? cached.imageSourcePage.trim() : null;
    }
    if (!doc.image_url && (cached.imageUrl || cached.resolvedUrl)) {
      doc.image_url = cached.imageUrl || cached.resolvedUrl;
      doc.image_status = 'resolved';
    }
  }

  // Fallback between image_url and legacy image field
  if (!doc.image_url && doc.image) {
    doc.image_url = doc.image;
  }

  // Normalise image_url: convert wiki thumb URLs, strip UTM params, force HTTPS
  if (doc.image_url) {
    doc.image_url = normalizeImageUrl(doc.image_url);
    doc.image = doc.image_url;
  }

  // Ensure image license is explicitly marked for Wikimedia Commons assets
  if (doc.image_url) {
    const isWiki = doc.image_url.includes('wikimedia.org') || doc.image_url.includes('wikipedia.org');
    if (isWiki && !doc.image_license) {
      doc.image_license = 'Creative Commons / Wikimedia Commons';
    }
  }

  // Coordinate verification check: Authentic Tamil Nadu envelope (~8.0°–14.0° N, 76.0°–81.0° E)
  const lat = Number(doc.latitude);
  const lng = Number(doc.longitude);
  doc.coordinates_verified = (
    doc.latitude != null &&
    doc.longitude != null &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= 8.0 &&
    lat <= 14.0 &&
    lng >= 76.0 &&
    lng <= 81.0
  );

  return doc;
}

/**
 * GET /api/heritage-sites & GET /api/heritagesites
 * 
 * Supports:
 * - district filtering (canonical slug, official name, or alias)
 * - category / multi-category filtering (slugs, legacy names, comma-separated)
 * - text search (q or search across name, alternate_names, description, location)
 * - bounded pagination (page, limit capped between 1 and 100)
 * - 100% backward compatible: returns Array by default, supports ?paginate=true
 */
exports.list = async (req, res, next) => {
  try {
    const rawState = sanitizeInput(req.query.state);
    const rawDistrict = sanitizeInput(req.query.district || req.query.districtId);
    const rawCategory = sanitizeInput(req.query.category || req.query.categories);
    const rawSearch = sanitizeInput(req.query.q || req.query.search);
    const rawUnesco = sanitizeInput(req.query.unesco);

    const conditions = [];

    // State filter
    if (rawState) {
      conditions.push({ state: { $regex: new RegExp(`^${escapeRegex(rawState)}$`, 'i') } });
    }

    // District filter: matches canonical districtId OR district name/aliases
    if (rawDistrict) {
      const resolved = resolveDistrict(rawDistrict);
      if (resolved) {
        const distPatterns = [resolved.name, resolved.id, ...(resolved.aliases || [])].map(escapeRegex).join('|');
        conditions.push({
          $or: [
            { districtId: resolved.id },
            { district: { $regex: new RegExp(`^(${distPatterns})$`, 'i') } }
          ]
        });
      } else {
        conditions.push({
          district: { $regex: new RegExp(`^${escapeRegex(rawDistrict)}$`, 'i') }
        });
      }
    }

    // Category / multi-category filter
    if (rawCategory) {
      const catItems = rawCategory.split(',').map(c => c.trim()).filter(Boolean);
      const catOrGroup = [];

      catItems.forEach(item => {
        const canonical = resolveCategory(item);
        if (canonical) {
          const catPatterns = [canonical.name, canonical.id, ...(canonical.legacyMatches || [])].map(escapeRegex).join('|');
          catOrGroup.push({ categories: canonical.id });
          catOrGroup.push({ category: { $regex: new RegExp(`^(${catPatterns})$`, 'i') } });
        } else {
          catOrGroup.push({ categories: item.toLowerCase() });
          catOrGroup.push({ category: { $regex: new RegExp(escapeRegex(item), 'i') } });
        }
      });

      if (catOrGroup.length > 0) {
        conditions.push({ $or: catOrGroup });
      }
    }

    // UNESCO filter
    if (rawUnesco === 'true' || rawUnesco === '1') {
      conditions.push({
        $or: [
          { unesco: true },
          { categories: 'unesco' }
        ]
      });
    }

    // Text search filter
    if (rawSearch) {
      const escapedSearch = escapeRegex(rawSearch);
      conditions.push({
        $or: [
          { name: { $regex: escapedSearch, $options: 'i' } },
          { alternate_names: { $regex: escapedSearch, $options: 'i' } },
          { description: { $regex: escapedSearch, $options: 'i' } },
          { location: { $regex: escapedSearch, $options: 'i' } }
        ]
      });
    }

    // Build final Mongoose query
    const mongoQuery = conditions.length === 0
      ? {}
      : (conditions.length === 1 ? conditions[0] : { $and: conditions });

    // Bounded Pagination
    const pageProvided = req.query.page !== undefined;
    const limitProvided = req.query.limit !== undefined;

    let page = parseInt(req.query.page, 10);
    let limit = parseInt(req.query.limit, 10);

    page = isNaN(page) || page < 1 ? 1 : page;
    limit = isNaN(limit) || limit < 1 ? 50 : Math.min(limit, 100); // Bounded to max 100

    const total = await HeritageSite.countDocuments(mongoQuery);
    let queryExec = HeritageSite.find(mongoQuery).sort({ name: 1 });

    if (pageProvided || limitProvided) {
      queryExec = queryExec.skip((page - 1) * limit).limit(limit);
    }

    const rawSites = await queryExec;
    const sites = rawSites.map(formatSiteDocument);

    // Set standard pagination headers
    res.set('X-Total-Count', String(total));
    res.set('X-Page', String(page));
    res.set('X-Limit', String(limit));
    res.set('X-Total-Pages', String(Math.ceil(total / limit) || 1));

    // Support optional structured envelope if ?paginate=true, otherwise return Array (client contract)
    if (req.query.paginate === 'true') {
      return res.json({
        data: sites,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      });
    }

    return res.json(sites);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/heritage-sites/explore
 * Random discovery feed with category filtering and bounded sample limit
 */
exports.explore = async (req, res, next) => {
  try {
    const rawCategory = sanitizeInput(req.query.category);
    let limit = parseInt(req.query.limit, 10);
    if (isNaN(limit) || limit < 1) limit = 10;
    limit = Math.min(limit, 50); // Bound sample limit

    let matchStage = {};

    if (rawCategory) {
      const canonical = resolveCategory(rawCategory);
      if (canonical) {
        const catPatterns = [canonical.name, canonical.id, ...(canonical.legacyMatches || [])].map(escapeRegex).join('|');
        matchStage = {
          $match: {
            $or: [
              { categories: canonical.id },
              { category: { $regex: new RegExp(`^(${catPatterns})$`, 'i') } }
            ]
          }
        };
      } else {
        matchStage = {
          $match: {
            $or: [
              { categories: rawCategory.toLowerCase() },
              { category: { $regex: new RegExp(escapeRegex(rawCategory), 'i') } }
            ]
          }
        };
      }
    } else {
      matchStage = { $match: {} };
    }

    const rawSites = await HeritageSite.aggregate([
      matchStage,
      { $sample: { size: limit } }
    ]);

    const sites = rawSites.map(formatSiteDocument);
    res.json(sites);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/heritage-sites/:id
 * Retrieve site by stable siteId, with ObjectId fallback
 */
exports.get = async (req, res, next) => {
  try {
    const idParam = sanitizeInput(req.params.id);
    if (!idParam) {
      return res.status(400).json({ message: 'Site ID is required.' });
    }

    // 1. Primary lookup by stable siteId
    let site = await HeritageSite.findOne({ siteId: idParam });

    // 2. Secondary fallback lookup by MongoDB _id if idParam is valid ObjectId
    if (!site && mongoose.Types.ObjectId.isValid(idParam) && idParam.length === 24) {
      site = await HeritageSite.findById(idParam);
    }

    if (!site) {
      return res.status(404).json({ message: 'Heritage site not found.' });
    }

    res.json(formatSiteDocument(site));
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/heritage-sites (Admin Only)
 */
exports.create = async (req, res, next) => {
  try {
    const site = await HeritageSite.create(req.body);
    res.status(201).json(formatSiteDocument(site));
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/heritage-sites/:id (Admin Only)
 */
exports.update = async (req, res, next) => {
  try {
    const idParam = sanitizeInput(req.params.id);
    let site = await HeritageSite.findOneAndUpdate(
      { siteId: idParam },
      req.body,
      { new: true, runValidators: true }
    );

    // Fallback update by _id if needed
    if (!site && mongoose.Types.ObjectId.isValid(idParam) && idParam.length === 24) {
      site = await HeritageSite.findByIdAndUpdate(
        idParam,
        req.body,
        { new: true, runValidators: true }
      );
    }

    if (!site) {
      return res.status(404).json({ message: 'Heritage site not found.' });
    }

    res.json(formatSiteDocument(site));
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/heritage-sites/:id (Admin Only)
 */
exports.remove = async (req, res, next) => {
  try {
    const idParam = sanitizeInput(req.params.id);
    let site = await HeritageSite.findOneAndDelete({ siteId: idParam });

    // Fallback delete by _id if needed
    if (!site && mongoose.Types.ObjectId.isValid(idParam) && idParam.length === 24) {
      site = await HeritageSite.findByIdAndDelete(idParam);
    }

    if (!site) {
      return res.status(404).json({ message: 'Heritage site not found.' });
    }

    res.json({ message: 'Heritage site deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
