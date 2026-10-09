const fs = require('fs');
const axios = require('axios');
const sites = require('./data/tamilnadu_heritage_sites.js');
const cache = require('./data/image_cache.json');

const USER_AGENT = 'HeritageExplorerAudit/1.0 (Student Project; contact: student@example.com)';

function haversineDist(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

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

function containsSiteName(text, siteName) {
  const normText = (text || '').toLowerCase();
  const nameParts = siteName.toLowerCase().replace(/[^\w\s]/g, '').split(' ').filter(p => p.length > 3);
  let matches = 0;
  for (const part of nameParts) {
    if (normText.includes(part)) matches++;
  }
  if (nameParts.length > 0 && matches >= Math.ceil(nameParts.length / 2)) {
      return true;
  }
  for (const [key, vars] of Object.entries(variants)) {
    if (siteName.toLowerCase().includes(key)) {
      for (const v of vars) {
        if (normText.includes(v)) return true;
      }
    }
  }
  return false;
}

async function audit() {
  const report = {};
  sites.forEach(s => {
    report[s.id] = {
      id: s.id,
      name: s.name,
      imageStatus: cache[s.id] ? cache[s.id].imageStatus : 'unresolved',
      duplicateImageOf: null,
      duplicateSeedOf: null
    };
  });

  // 1. Duplicate Image Check
  const urlToIds = {};
  for (const id in cache) {
    if (cache[id].imageStatus === 'resolved' && cache[id].imageUrl) {
      const url = cache[id].imageUrl;
      if (!urlToIds[url]) urlToIds[url] = [];
      urlToIds[url].push(id);
    }
  }

  for (const url in urlToIds) {
    const ids = urlToIds[url];
    if (ids.length > 1) {
      // Filter out the known Kallanai pair
      const isKallanaiPair = ids.length === 2 && ids.includes('tn-arl-05') && ids.includes('tn-try-05');
      if (!isKallanaiPair) {
        // Mark duplicates
        for (let i = 0; i < ids.length; i++) {
          const id = ids[i];
          const otherIds = ids.filter(x => x !== id);
          report[id].duplicateImageOf = otherIds.join(', ');
        }
      }
    }
  }

  // 2. Duplicate Seed Data Check
  for (let i = 0; i < sites.length; i++) {
    for (let j = i + 1; j < sites.length; j++) {
      const s1 = sites[i];
      const s2 = sites[j];
      
      const isKallanaiPair = (s1.id === 'tn-arl-05' && s2.id === 'tn-try-05') || (s1.id === 'tn-try-05' && s2.id === 'tn-arl-05');
      if (isKallanaiPair) continue;

      const dist = haversineDist(s1.location.lat, s1.location.lng, s2.location.lat, s2.location.lng);
      
      // If within 10km, check name similarity, OR if name is super similar
      const name1 = s1.name.toLowerCase().replace(/[^a-z]/g, '');
      const name2 = s2.name.toLowerCase().replace(/[^a-z]/g, '');
      
      let duplicateFound = false;
      
      if (name1 === name2) {
        duplicateFound = true;
      } else if (dist < 5) {
         // Same general area, do they share 2 long words?
         const words1 = s1.name.toLowerCase().replace(/[^\w\s]/g, '').split(' ').filter(p => p.length > 3);
         const words2 = s2.name.toLowerCase().replace(/[^\w\s]/g, '').split(' ').filter(p => p.length > 3);
         let overlap = 0;
         for(const w1 of words1) {
            if (words2.includes(w1)) overlap++;
         }
         if (overlap >= 2 && words1.length <= 4 && words2.length <= 4) {
             duplicateFound = true;
         }
         // Special case for Gangaikonda Cholapuram
         if ((s1.name.includes("Gangaikonda") && s2.name.includes("Gangaikonda"))) duplicateFound = true;
      }
      
      if (duplicateFound) {
        report[s1.id].duplicateSeedOf = report[s1.id].duplicateSeedOf ? report[s1.id].duplicateSeedOf + ', ' + s2.id : s2.id;
        report[s2.id].duplicateSeedOf = report[s2.id].duplicateSeedOf ? report[s2.id].duplicateSeedOf + ', ' + s1.id : s1.id;
      }
    }
  }

  // 3. Relevance check on all 45 resolved entries
  const resolvedSites = sites.filter(s => cache[s.id] && cache[s.id].imageStatus === 'resolved');
  const fileTitles = [];
  const idToFile = {};
  
  resolvedSites.forEach(s => {
     let pageUrl = cache[s.id].imageSourcePage;
     let match = pageUrl.match(/wiki\/(File:.*)$/);
     if (match) {
        let title = decodeURIComponent(match[1]).replace(/_/g, ' ');
        fileTitles.push({ id: s.id, title });
     }
  });
  
  // Batch query to Wikimedia API (Max 50 titles per request)
  const titlesParam = fileTitles.map(f => f.title).join('|');
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(titlesParam)}&prop=imageinfo|categories&iiprop=extmetadata`;
  
  try {
     const res = await axios.get(url, { headers: { 'User-Agent': USER_AGENT } });
     const pages = res.data.query ? res.data.query.pages : {};
     
     // Match responses back to sites
     for (const pageId in pages) {
        const page = pages[pageId];
        const title = page.title;
        // Find which sites this title belongs to
        const matchedItems = fileTitles.filter(f => f.title === title);
        
        for (const item of matchedItems) {
            const siteId = item.id;
            const site = sites.find(s => s.id === siteId);
            
            let extmetadata = {};
            if (page.imageinfo && page.imageinfo.length > 0 && page.imageinfo[0].extmetadata) {
                extmetadata = page.imageinfo[0].extmetadata;
            }
            const description = extmetadata.ImageDescription ? extmetadata.ImageDescription.value : '';
            const categories = page.categories ? page.categories.map(c => c.title).join(' ') : '';
            
            const combinedText = title + ' ' + description + ' ' + categories;
            
            // Check relevance
            if (!containsSiteName(combinedText, site.name)) {
                report[siteId].imageStatus = 'flagged-for-review';
            } else {
                report[siteId].imageStatus = 'clean';
            }
        }
     }
  } catch (err) {
     console.error("Error querying wiki API", err.message);
  }

  // Generate output table
  console.log('| ID | Name | Image Status | Duplicate Image Of | Duplicate Seed Of |');
  console.log('|---|---|---|---|---|');
  let cleanCount = 0;
  let flaggedCount = 0;
  let manualCount = 0;

  sites.forEach(s => {
    let r = report[s.id];
    if (r.imageStatus === 'clean') cleanCount++;
    else if (r.imageStatus === 'flagged-for-review') flaggedCount++;
    else if (r.imageStatus === 'manual-review-pending') manualCount++;
    
    // For manual-review-pending, ensure status is exactly that string.
    if (r.imageStatus !== 'clean' && r.imageStatus !== 'flagged-for-review' && r.imageStatus !== 'manual-review-pending') {
       r.imageStatus = 'manual-review-pending';
       manualCount++;
    }
    
    console.log(`| ${r.id} | ${r.name} | ${r.imageStatus} | ${r.duplicateImageOf || 'null'} | ${r.duplicateSeedOf || 'null'} |`);
  });

  console.log(`\n**Summary:** Clean: ${cleanCount}, Flagged-for-review: ${flaggedCount}, Manual-backlog: ${manualCount}`);
}

audit();
