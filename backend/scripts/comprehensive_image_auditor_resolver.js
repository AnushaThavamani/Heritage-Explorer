require('dotenv').config({ path: 'd:/Heritage Explorer/backend/.env' });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const HeritageSite = require('../models/HeritageSite');
const north = require('../data/regions/north');
const central = require('../data/regions/central');
const west = require('../data/regions/west');
const south = require('../data/regions/south');

const USER_AGENT = 'HeritageExplorer/2.0 (Cultural Heritage Discovery; contact: info@heritageexplorer.org)';
const CACHE_FILE = path.join(__dirname, '../data/image_cache.json');
const REPORT_FILE = path.join(__dirname, '../data/image_audit_report.json');

const FORBIDDEN_WORDS = [
  'falcon', 'bird', 'avian', 'frog', 'butterfly', 'snake', 'lizard', 'insect', 'flora',
  'locomotive', 'railway station', 'train', 'bus station', 'airport', 'hospital', 'college', 'school',
  'map of', 'locator map', 'diagram', 'chart', 'flag', 'coat of arms', 'seal of',
  'logo', 'screenshot', 'stamp of', 'banknote', 'postal', 'constituency', 'electoral',
  'cinema', 'film', 'actor', 'actress', 'politician'
];

function isForbiddenFile(title, desc) {
  const text = `${title} ${desc}`.toLowerCase();
  return FORBIDDEN_WORDS.some(w => text.includes(w));
}

function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function verifyImageUrl(url) {
  if (!url) return false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal
    });
    clearTimeout(timeout);
    const ct = res.headers.get('content-type') || '';
    return res.ok && ct.startsWith('image/');
  } catch (e) {
    return false;
  }
}

function generateSearchQueries(site) {
  const cleanName = site.name.replace(/\(.*?\)/g, '').replace(/[\/\\-]/g, ' ').trim();
  const altNames = (site.alternate_names || []).map(a => a.replace(/\(.*?\)/g, '').replace(/[\/\\-]/g, ' ').trim());

  const queries = [
    cleanName,
    ...altNames,
    `${cleanName} ${site.district}`
  ];

  // Tamil transliteration variants
  if (cleanName.toLowerCase().startsWith('thiru')) {
    queries.push(cleanName.replace(/^thiru/i, 'Tiru'));
    queries.push(cleanName.replace(/^thiru/i, 'Thirumee'));
  } else if (cleanName.toLowerCase().startsWith('tiru')) {
    queries.push(cleanName.replace(/^tiru/i, 'Thiru'));
  }

  // Parenthetical parts (e.g. "Samanar Malai (Keelakuyilkudi)" -> "Keelakuyilkudi")
  const matches = site.name.match(/\((.*?)\)/g);
  if (matches) {
    for (const m of matches) {
      const inner = m.replace(/[()]/g, '').trim();
      if (inner.length >= 4) {
        queries.push(inner);
        queries.push(`${inner} ${site.district}`);
      }
    }
  }

  // Deduplicate and filter out short queries
  return [...new Set(queries.filter(q => q && q.length >= 3))];
}

const STOP_WORDS = new Set([
  'temple', 'temples', 'fort', 'forts', 'palace', 'palaces', 'cave', 'caves',
  'monument', 'memorial', 'heritage', 'tamil', 'nadu', 'india', 'district',
  'town', 'village', 'ancient', 'historic', 'historical', 'stone', 'rock',
  'site', 'hall', 'church', 'mosque', 'museum', 'ruins', 'complex', 'hill',
  'hills', 'shiva', 'perumal', 'swamy', 'swami', 'amman', 'kovil', 'koil'
]);

function extractKeywords(text) {
  return (text || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(w => w.length >= 4 && !STOP_WORDS.has(w));
}

// 1. Search Wikimedia Commons Media Files
async function searchCommonsMedia(site) {
  const queries = generateSearchQueries(site);
  const siteKeywords = [
    ...extractKeywords(site.name),
    ...(site.alternate_names || []).flatMap(extractKeywords)
  ];

  for (const q of queries) {
    try {
      const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrnamespace=6&prop=imageinfo&iiprop=url|mime|extmetadata&iiurlwidth=800&format=json&origin=*`;
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
      if (!res.ok) continue;
      const data = await res.json();
      if (!data.query?.pages) continue;

      const pages = Object.values(data.query.pages);
      for (const page of pages) {
        const info = page.imageinfo?.[0];
        if (!info || !info.thumburl) continue;
        const mime = info.mime || '';
        if (!mime.startsWith('image/') || mime.includes('svg')) continue;

        const title = page.title || '';
        const meta = info.extmetadata || {};
        const desc = meta.ImageDescription?.value || meta.ObjectName?.value || '';

        if (isForbiddenFile(title, desc)) continue;

        const textToMatch = `${title} ${desc}`.toLowerCase();
        const hasKeyMatch = siteKeywords.some(k => textToMatch.includes(k));
        if (!hasKeyMatch) continue;

        // GPS Check
        const lat = parseFloat(meta.GPSLatitude?.value);
        const lon = parseFloat(meta.GPSLongitude?.value);
        if (!isNaN(lat) && !isNaN(lon) && site.latitude && site.longitude) {
          const dist = haversineDistanceMeters(site.latitude, site.longitude, lat, lon);
          if (dist > 15000) continue; // too far from site
        }

        const valid = await verifyImageUrl(info.thumburl);
        if (!valid) continue;

        const artist = (meta.Artist?.value || 'Wikimedia Commons Contributor')
          .replace(/<[^>]*>/g, '').trim();
        const license = meta.LicenseShortName?.value || 'Creative Commons';

        return {
          url: info.thumburl,
          attribution: artist,
          license: license,
          sourcePage: info.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(title)}`,
          title: title,
          source: 'Wikimedia Commons MediaWiki API'
        };
      }
    } catch (e) {
      // Continue next query
    }
  }
  return null;
}

// 2. Search English Wikipedia Article Leads
async function searchWikipediaArticle(site) {
  const queries = generateSearchQueries(site);
  const siteKeywords = [
    ...extractKeywords(site.name),
    ...(site.alternate_names || []).flatMap(extractKeywords)
  ];

  for (const q of queries) {
    try {
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&origin=*`;
      const res = await fetch(searchUrl, { headers: { 'User-Agent': USER_AGENT } });
      if (!res.ok) continue;
      const data = await res.json();
      if (!data.query?.search?.length) continue;

      const candidates = data.query.search.slice(0, 3);
      for (const cand of candidates) {
        if (cand.snippet?.toLowerCase().includes('may refer to:') || cand.title.toLowerCase().startsWith('list of')) continue;

        const candKeywords = extractKeywords(cand.title);
        const hasRelevance = candKeywords.some(k => siteKeywords.includes(k));
        if (!hasRelevance) continue;

        // Reject articles that are whole districts or whole towns unless the monument name is exactly that
        const candNorm = cand.title.toLowerCase().trim();
        if (candNorm === site.district.toLowerCase() || candNorm === `${site.district.toLowerCase()} district`) {
          continue;
        }

        const sumUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cand.title)}`;
        const sumRes = await fetch(sumUrl, { headers: { 'User-Agent': USER_AGENT } });
        if (!sumRes.ok) continue;
        const sumData = await sumRes.json();

        if (sumData.thumbnail?.source) {
          const thumbUrl = sumData.thumbnail.source;
          const valid = await verifyImageUrl(thumbUrl);
          if (valid) {
            return {
              url: thumbUrl,
              attribution: 'Wikimedia Commons Contributor',
              license: 'CC BY-SA 4.0 / Public Domain',
              sourcePage: sumData.content_urls?.desktop?.page || null,
              title: cand.title,
              source: 'Wikipedia REST API'
            };
          }
        }
      }
    } catch (e) {
      // Continue
    }
  }
  return null;
}

// Check if existing image is already genuine and matching
async function verifyExistingMatch(site) {
  if (!site.image_url) return null;
  const valid = await verifyImageUrl(site.image_url);
  if (!valid) return null;

  // Verify that the URL or sourcePage actually corresponds to this monument
  const urlLower = (site.image_url + ' ' + (site.image_source_page || '')).toLowerCase();
  const siteKeywords = [
    ...extractKeywords(site.name),
    ...(site.alternate_names || []).flatMap(extractKeywords)
  ];

  // If the image URL or source page contains at least one distinctive keyword of the monument, it's valid
  const hasKeyword = siteKeywords.some(k => urlLower.includes(k));
  if (hasKeyword) {
    return {
      url: site.image_url,
      attribution: site.image_attribution || 'Wikimedia Commons Contributor',
      license: site.image_license || 'Creative Commons',
      sourcePage: site.image_source_page || null,
      title: site.name,
      source: 'Verified Existing'
    };
  }

  // If existing URL is unrelated (e.g. Noyyal River for Kodumanal), return null to force re-search!
  return null;
}

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/heritage_explorer');

  let cache = {};
  if (fs.existsSync(CACHE_FILE)) {
    try {
      cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    } catch (e) {}
  }

  const allSites = [...north, ...central, ...west, ...south];
  console.log(`Starting Comprehensive Image Audit & Resolution for ${allSites.length} Heritage Sites...`);

  const auditReport = {
    totalAudited: allSites.length,
    verifiedExisting: 0,
    replacedOrUpdated: 0,
    newlyFound: 0,
    unresolvedCount: 0,
    unresolvedList: [],
    auditRecords: []
  };

  for (let i = 0; i < allSites.length; i++) {
    const site = allSites[i];
    const prefix = `[${i + 1}/${allSites.length}] ${site.siteId} (${site.name}):`;

    // 1. Check existing image for genuine match
    let match = await verifyExistingMatch(site);
    let action = 'retained';

    if (match) {
      auditReport.verifiedExisting++;
      console.log(`${prefix} Existing image verified authentic.`);
    } else {
      // 2. Search Commons MediaWiki API
      match = await searchCommonsMedia(site);
      if (match) {
        action = site.image_url ? 'replaced_unrelated_or_broken' : 'newly_found';
        if (action === 'replaced_unrelated_or_broken') auditReport.replacedOrUpdated++;
        else auditReport.newlyFound++;
        console.log(`${prefix} Found genuine photograph via ${match.source}: ${match.title}`);
      } else {
        // 3. Search Wikipedia Articles
        match = await searchWikipediaArticle(site);
        if (match) {
          action = site.image_url ? 'replaced_unrelated_or_broken' : 'newly_found';
          if (action === 'replaced_unrelated_or_broken') auditReport.replacedOrUpdated++;
          else auditReport.newlyFound++;
          console.log(`${prefix} Found genuine photograph via ${match.source}: ${match.title}`);
        } else {
          // 4. Truly unresolved
          action = 'marked_missing_no_fake';
          auditReport.unresolvedCount++;
          auditReport.unresolvedList.push({
            siteId: site.siteId,
            name: site.name,
            district: site.district,
            category: site.category
          });
          console.log(`${prefix} No authentic image found anywhere -> Safe missing state.`);
        }
      }
    }

    const finalUrl = match ? match.url : null;
    const finalAttribution = match ? match.attribution : null;
    const finalLicense = match ? match.license : null;
    const finalSourcePage = match ? match.sourcePage : null;
    const finalStatus = match ? 'resolved' : 'missing';

    // Update in-memory site object
    site.image_url = finalUrl;
    site.image_attribution = finalAttribution;
    site.image_license = finalLicense;
    site.image_source_page = finalSourcePage;
    site.image_status = finalStatus;

    // Update cache
    cache[site.siteId] = {
      imageUrl: finalUrl,
      imageStatus: finalStatus,
      imageAttribution: finalAttribution,
      imageLicense: finalLicense,
      imageSourcePage: finalSourcePage,
      lastChecked: new Date().toISOString()
    };

    // Update MongoDB
    await HeritageSite.updateOne(
      { siteId: site.siteId },
      {
        $set: {
          image_url: finalUrl,
          image_status: finalStatus,
          image_attribution: finalAttribution,
          image_license: finalLicense,
          image_source_page: finalSourcePage
        }
      }
    );

    auditReport.auditRecords.push({
      siteId: site.siteId,
      name: site.name,
      district: site.district,
      action: action,
      imageUrl: finalUrl,
      source: match?.source || 'None',
      imageTitle: match?.title || 'None'
    });

    // Small delay to respect rate limits
    await new Promise(r => setTimeout(r, 120));
  }

  // Save Cache File
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');

  // Save Regional Files
  fs.writeFileSync(path.join(__dirname, '../data/regions/north.js'), 'module.exports = ' + JSON.stringify(north, null, 2) + ';\n', 'utf8');
  fs.writeFileSync(path.join(__dirname, '../data/regions/central.js'), 'module.exports = ' + JSON.stringify(central, null, 2) + ';\n', 'utf8');
  fs.writeFileSync(path.join(__dirname, '../data/regions/west.js'), 'module.exports = ' + JSON.stringify(west, null, 2) + ';\n', 'utf8');
  fs.writeFileSync(path.join(__dirname, '../data/regions/south.js'), 'module.exports = ' + JSON.stringify(south, null, 2) + ';\n', 'utf8');

  // Save Audit Report
  fs.writeFileSync(REPORT_FILE, JSON.stringify(auditReport, null, 2), 'utf8');

  console.log('====================================================');
  console.log('AUDIT & RESOLUTION SUMMARY:');
  console.log(`- Total Heritage Sites Audited    : ${auditReport.totalAudited}`);
  console.log(`- Verified Authentic (Retained)   : ${auditReport.verifiedExisting}`);
  console.log(`- Broken / Unrelated Replaced     : ${auditReport.replacedOrUpdated}`);
  console.log(`- Newly Discovered & Verified     : ${auditReport.newlyFound}`);
  console.log(`- Total Sites With Real Photos    : ${auditReport.verifiedExisting + auditReport.replacedOrUpdated + auditReport.newlyFound}`);
  console.log(`- Unresolved (No Fake Assigned)   : ${auditReport.unresolvedCount}`);
  console.log('====================================================');

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Fatal error in comprehensive resolver:', err);
  process.exit(1);
});
