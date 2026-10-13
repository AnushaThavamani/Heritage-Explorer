require('dotenv').config({ path: 'd:/Heritage Explorer/backend/.env' });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const HeritageSite = require('../models/HeritageSite');
const north = require('../data/regions/north');
const central = require('../data/regions/central');
const west = require('../data/regions/west');
const south = require('../data/regions/south');

const USER_AGENT = 'HeritageExplorerDataPipeline/1.0 (Cultural Heritage Discovery; contact: info@heritageexplorer.org)';
const CACHE_FILE = path.join(__dirname, '../data/image_cache.json');

async function verifyUrl(url) {
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

function isRelevantTitle(candTitle, siteName, alternateNames = []) {
  const normCand = (candTitle || '').toLowerCase();
  const normSite = (siteName || '').toLowerCase();

  // Forbid non-monument pages if site is not about them
  const forbiddenKeywords = ['railway station', 'metro station', 'bus station', 'airport', 'university', 'college', 'school', 'hospital', 'constituency', 'electoral', 'cinema', 'film'];
  for (const fk of forbiddenKeywords) {
    if (normCand.includes(fk) && !normSite.includes(fk)) {
      return false;
    }
  }

  const stopWords = new Set(['temple', 'temples', 'fort', 'forts', 'palace', 'cave', 'caves', 'monument', 'memorial', 'heritage', 'tamil', 'nadu', 'india', 'district', 'town', 'village', 'ancient', 'historic', 'historical', 'stone', 'rock', 'site', 'hall', 'church', 'mosque', 'museum', 'ruins', 'complex', 'hill', 'hills']);
  
  const extractWords = text => (text || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(w => w.length >= 4 && !stopWords.has(w));
  
  const siteWords = new Set([
    ...extractWords(siteName),
    ...alternateNames.flatMap(extractWords)
  ]);
  
  const candWords = extractWords(candTitle);
  return candWords.some(w => siteWords.has(w));
}

async function findWikipediaThumbnail(siteName, district, alternateNames = []) {
  // Clean names of parentheses and slashes for search
  const cleanName = siteName.replace(/\(.*?\)/g, '').replace(/[\/\\-]/g, ' ').trim();
  const queries = [
    cleanName,
    ...alternateNames,
    `${cleanName} ${district}`
  ];

  for (const q of queries) {
    if (!q || q.length < 3) continue;
    try {
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&origin=*`;
      const res = await fetch(searchUrl, { headers: { 'User-Agent': USER_AGENT } });
      if (!res.ok) continue;
      const data = await res.json();
      if (!data.query?.search?.length) continue;

      const candidates = data.query.search.slice(0, 3);
      for (const cand of candidates) {
        // Exclude generic disambiguation or list pages
        if (cand.snippet?.toLowerCase().includes('may refer to:') || cand.title.toLowerCase().startsWith('list of')) continue;

        // CRITICAL: Strict relevance validation against site name
        if (!isRelevantTitle(cand.title, siteName, alternateNames)) {
          continue;
        }

        const sumUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cand.title)}`;
        const sumRes = await fetch(sumUrl, { headers: { 'User-Agent': USER_AGENT } });
        if (!sumRes.ok) continue;
        const sumData = await sumRes.json();
        
        if (sumData.thumbnail?.source) {
          const thumbUrl = sumData.thumbnail.source;
          const isValid = await verifyUrl(thumbUrl);
          if (isValid) {
            return {
              url: thumbUrl,
              attribution: 'Wikimedia Commons Contributor',
              sourcePage: sumData.content_urls?.desktop?.page || null,
              title: cand.title
            };
          }
        }
      }
    } catch (e) {
      // Continue to next query
    }
  }
  return null;
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB.');

  let cache = {};
  if (fs.existsSync(CACHE_FILE)) {
    try { cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')); } catch(e) {}
  }

  const allSites = [...north, ...central, ...west, ...south];
  console.log(`Processing ${allSites.length} sites...`);

  let verifiedExisting = 0;
  let resolvedNew = 0;
  let markedMissing = 0;

  for (let i = 0; i < allSites.length; i++) {
    const site = allSites[i];
    const logPrefix = `[${i + 1}/${allSites.length}] ${site.siteId} (${site.name}):`;

    // 1. Check if current image_url is already valid
    let workingUrl = null;
    let attribution = site.image_attribution || 'Wikimedia Commons';
    let sourcePage = site.source_urls?.[0] || null;

    if (site.image_url) {
      const isCurrentValid = await verifyUrl(site.image_url);
      if (isCurrentValid) {
        workingUrl = site.image_url;
        verifiedExisting++;
        console.log(`${logPrefix} Existing URL verified (HTTP 200).`);
      }
    }

    // 2. If not valid, search Wikipedia for genuine thumbnail
    if (!workingUrl) {
      const found = await findWikipediaThumbnail(site.name, site.district, site.alternate_names || []);
      if (found) {
        workingUrl = found.url;
        attribution = found.attribution;
        sourcePage = found.sourcePage;
        resolvedNew++;
        console.log(`${logPrefix} Resolved NEW verified thumbnail from Wikipedia (${found.title}).`);
      } else {
        markedMissing++;
        console.log(`${logPrefix} No authentic image found on Wikipedia -> set to authentic fallback.`);
      }
    }

    // 3. Update memory site object
    site.image_url = workingUrl;
    site.image_status = workingUrl ? 'resolved' : 'missing';
    if (workingUrl) {
      site.image_attribution = attribution;
      site.image_source_page = sourcePage;
    } else {
      site.image_attribution = null;
      site.image_source_page = null;
    }

    // 4. Update cache
    cache[site.siteId] = {
      imageUrl: workingUrl,
      imageStatus: site.image_status,
      imageAttribution: site.image_attribution,
      imageSourcePage: site.image_source_page,
      lastChecked: new Date().toISOString()
    };

    // 5. Update MongoDB
    await HeritageSite.updateOne(
      { siteId: site.siteId },
      {
        $set: {
          image_url: workingUrl,
          image_status: site.image_status,
          image_attribution: site.image_attribution,
          image_source_page: site.image_source_page
        }
      }
    );

    // Minor throttle to be respectful of Wikipedia API
    await new Promise(r => setTimeout(r, 150));
  }

  // Save updated cache
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');

  // Save updated regional files
  fs.writeFileSync(path.join(__dirname, '../data/regions/north.js'), 'module.exports = ' + JSON.stringify(north, null, 2) + ';\n', 'utf8');
  fs.writeFileSync(path.join(__dirname, '../data/regions/central.js'), 'module.exports = ' + JSON.stringify(central, null, 2) + ';\n', 'utf8');
  fs.writeFileSync(path.join(__dirname, '../data/regions/west.js'), 'module.exports = ' + JSON.stringify(west, null, 2) + ';\n', 'utf8');
  fs.writeFileSync(path.join(__dirname, '../data/regions/south.js'), 'module.exports = ' + JSON.stringify(south, null, 2) + ';\n', 'utf8');

  console.log('========================================');
  console.log('Image Resolution Summary:');
  console.log(`- Verified Existing URLs: ${verifiedExisting}`);
  console.log(`- Resolved New Verified URLs: ${resolvedNew}`);
  console.log(`- Clean Architectural Fallbacks (No Fake URLs): ${markedMissing}`);
  console.log(`- Total Sites: ${allSites.length}`);
  console.log('========================================');

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Fatal error in resolver:', err);
  process.exit(1);
});
