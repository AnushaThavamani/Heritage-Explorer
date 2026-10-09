const fs = require('fs');
const axios = require('axios');
const sites = require('./data/tamilnadu_heritage_sites.js');

const CACHE_FILE = './data/image_cache.json';
const USER_AGENT = 'HeritageExplorerDataPipeline/1.0 (Student Project; contact: student@example.com)';
const rejectKeywords = ['map', 'logo', 'night', 'festival', 'crowd', 'event', 'flag', 'banner', 'plan', 'sketch', 'drawing', 'model', 'painting'];

let cache = {};
if (fs.existsSync(CACHE_FILE)) {
  cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
}

function containsNameParts(text, requiredParts) {
  const normText = (text || '').toLowerCase();
  for (const part of requiredParts) {
    if (!normText.includes(part.toLowerCase())) return false;
  }
  return true;
}

function isValidImage(page, validationParts) {
  const title = page.title.toLowerCase();
  const extmetadata = page.imageinfo[0].extmetadata || {};
  const description = extmetadata.ImageDescription ? extmetadata.ImageDescription.value.toLowerCase() : '';
  
  const combinedText = title + ' ' + description;
  for (const kw of rejectKeywords) {
    if (combinedText.includes(kw)) return false;
  }
  
  if (validationParts) {
    if (!containsNameParts(title, validationParts) && !containsNameParts(description, validationParts)) {
      return false;
    }
  }
  
  return true;
}

async function searchCommons(query, validationParts) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=10&gsrsearch=${encodeURIComponent(query)}&prop=imageinfo&iiprop=url|extmetadata`;
  try {
    const res = await axios.get(url, { headers: { 'User-Agent': USER_AGENT } });
    const pages = res.data.query ? res.data.query.pages : {};
    
    for (const pageId in pages) {
      const page = pages[pageId];
      if (page.imageinfo && page.imageinfo.length > 0) {
        if (isValidImage(page, validationParts)) {
          const info = page.imageinfo[0];
          const attribution = info.extmetadata.Artist ? info.extmetadata.Artist.value : 'Wikimedia Commons';
          const cleanAttribution = attribution.replace(/<[^>]*>?/gm, '');
          return {
            imageUrl: info.url,
            imageAttribution: cleanAttribution,
            imageSourcePage: info.descriptionurl,
            imageStatus: 'resolved'
          };
        }
      }
    }
  } catch (err) {
    console.error(`Error querying ${query}:`, err.message);
  }
  return null;
}

async function runUpdates() {
  console.log("1. Deduplicating Kallanai");
  cache['tn-arl-05'] = { ...cache['tn-try-05'] };

  console.log("2. Targeted Retries");
  
  const retries = [
    { id: 'tn-mdu-03', query: "Tamukkam Palace", validation: ["Tamukkam"] },
    { id: 'tn-vlr-05', query: "Voorhees College", validation: ["Voorhees"] },
    { id: 'tn-try-04', query: "St John's Church Tiruchirappalli", validation: ["St", "John"] },
    { id: 'tn-vlr-04', query: "Arcot Delhi Gate", validation: ["Arcot", "Gate"] }
  ];

  for (const r of retries) {
    console.log(`Retrying ${r.id} with "${r.query}"...`);
    const res = await searchCommons(r.query, r.validation);
    if (res) {
      cache[r.id] = res;
      console.log(` -> Resolved!`);
    } else {
      console.log(` -> Still unresolved.`);
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Papanasam is special because it has two queries to try
  console.log(`Retrying tn-tvl-04 with "Papanasam Falls Tirunelveli"...`);
  let papRes = await searchCommons("Papanasam Falls Tirunelveli", ["Papanasam"]);
  if (!papRes) {
    console.log(`Retrying tn-tvl-04 with "Papanasam Shiva Temple"...`);
    papRes = await searchCommons("Papanasam Shiva Temple", ["Papanasam"]);
  }
  
  if (papRes) {
    cache['tn-tvl-04'] = papRes;
    console.log(` -> Resolved!`);
  } else {
    console.log(` -> Still unresolved.`);
  }
  
  console.log("3. Mark remaining unresolved as manual-review-pending");
  let manualReviewCount = 0;
  let resolvedCount = 0;
  for (const site of sites) {
    if (cache[site.id] && cache[site.id].imageStatus === 'resolved') {
      resolvedCount++;
    } else {
      cache[site.id] = {
        imageUrl: null,
        imageAttribution: null,
        imageSourcePage: null,
        imageStatus: 'manual-review-pending'
      };
      manualReviewCount++;
    }
  }

  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));

  console.log('\n--- FINAL REPORT ---');
  console.log(`Total Resolved: ${resolvedCount}`);
  console.log(`Manual Backlog: ${manualReviewCount}`);
}

runUpdates();
