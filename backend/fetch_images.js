const fs = require('fs');
const axios = require('axios');
const sites = require('./data/tamilnadu_heritage_sites.js');

const CACHE_FILE = './data/image_cache.json';

const USER_AGENT = 'HeritageExplorerDataPipeline/1.0 (Student Project; contact: student@example.com)';

const rejectKeywords = ['map', 'logo', 'night', 'festival', 'crowd', 'event', 'flag', 'banner', 'plan', 'sketch', 'drawing', 'model', 'painting'];

const variants = {
  'kanniyakumari': ['kanniyakumari', 'kanyakumari'],
  'kanyakumari': ['kanniyakumari', 'kanyakumari'],
  'tiruchirappalli': ['tiruchirappalli', 'trichy'],
  'trichy': ['tiruchirappalli', 'trichy'],
  'thanjavur': ['thanjavur', 'tanjore'],
  'madurai': ['madurai'],
  'chennai': ['chennai', 'madras'],
  'kanchipuram': ['kanchipuram', 'kanchi'],
  'srirangam': ['srirangam'],
  'rameshwaram': ['rameswaram', 'rameshwaram'],
  'rameswaram': ['rameswaram', 'rameshwaram']
};

function normalize(text) {
  return (text || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function containsSiteName(text, siteName) {
  const normText = (text || '').toLowerCase();
  
  // Extract main parts of the site name
  const nameParts = siteName.toLowerCase().replace(/[^\w\s]/g, '').split(' ').filter(p => p.length > 3);
  
  let matches = 0;
  for (const part of nameParts) {
    if (normText.includes(part)) {
      matches++;
    }
  }
  
  if (nameParts.length > 0 && matches >= Math.ceil(nameParts.length / 2)) {
      return true;
  }
  
  // Also check explicit spelling variants for district/city if part of name
  for (const [key, vars] of Object.entries(variants)) {
    if (siteName.toLowerCase().includes(key)) {
      for (const v of vars) {
        if (normText.includes(v)) return true;
      }
    }
  }
  
  return false;
}

function isValidImage(page, siteName) {
  const title = page.title.toLowerCase();
  const extmetadata = page.imageinfo[0].extmetadata || {};
  const description = extmetadata.ImageDescription ? extmetadata.ImageDescription.value.toLowerCase() : '';
  
  // Reject bad keywords
  const combinedText = title + ' ' + description;
  for (const kw of rejectKeywords) {
    if (combinedText.includes(kw)) return false;
  }
  
  // Must contain site name
  if (!containsSiteName(title, siteName) && !containsSiteName(description, siteName)) {
    return false;
  }
  
  return true;
}

async function searchCommons(query, siteName) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=10&gsrsearch=${encodeURIComponent(query)}&prop=imageinfo&iiprop=url|extmetadata`;
  try {
    const res = await axios.get(url, { headers: { 'User-Agent': USER_AGENT } });
    const pages = res.data.query ? res.data.query.pages : {};
    
    for (const pageId in pages) {
      const page = pages[pageId];
      if (page.imageinfo && page.imageinfo.length > 0) {
        if (isValidImage(page, siteName)) {
          const info = page.imageinfo[0];
          const attribution = info.extmetadata.Artist ? info.extmetadata.Artist.value : 'Wikimedia Commons';
          // Clean up HTML tags from attribution if any
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

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runPipeline() {
  let cache = {};
  if (fs.existsSync(CACHE_FILE)) {
    cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  }

  const report = {
    clean: [],
    fallback: [],
    unresolved: []
  };

  for (const site of sites) {
    if (cache[site.id] && cache[site.id].imageStatus === 'resolved') {
      console.log(`[CACHED] ${site.name}`);
      report.clean.push(site.name);
      continue;
    }

    console.log(`[FETCHING] ${site.name}...`);
    
    let result = await searchCommons(site.name, site.name);
    
    if (result) {
      cache[site.id] = result;
      report.clean.push(site.name);
    } else {
      // Fallback to imageQuery
      console.log(`  -> Falling back to imageQuery for: ${site.name}`);
      result = await searchCommons(site.imageQuery, site.name);
      
      if (result) {
        cache[site.id] = result;
        report.fallback.push(site.name);
      } else {
        console.log(`  -> Unresolved: ${site.name}`);
        cache[site.id] = {
          imageUrl: null,
          imageAttribution: null,
          imageSourcePage: null,
          imageStatus: 'unresolved'
        };
        report.unresolved.push(site.name);
      }
    }
    
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
    
    // Respect API limits
    await delay(1000);
  }

  console.log('\n--- PIPELINE REPORT ---');
  console.log(`Clean Resolutions: ${report.clean.length}`);
  console.log(`Resolved via Fallback: ${report.fallback.length}`);
  console.log(`Unresolved (Needs Manual Review): ${report.unresolved.length}`);
  
  if (report.fallback.length > 0) {
    console.log('\nFallback Sites:');
    report.fallback.forEach(s => console.log(` - ${s}`));
  }
  
  if (report.unresolved.length > 0) {
    console.log('\nUnresolved Sites:');
    report.unresolved.forEach(s => console.log(` - ${s}`));
  }
}

runPipeline();
