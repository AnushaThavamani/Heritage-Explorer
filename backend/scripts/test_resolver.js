require('dotenv').config({ path: 'd:/Heritage Explorer/backend/.env' });
const fs = require('fs');
const path = require('path');

const USER_AGENT = 'HeritageExplorerDataPipeline/1.0 (Cultural Heritage Discovery; contact: info@heritageexplorer.org)';

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

async function findWikipediaThumbnail(siteName, district, alternateNames = []) {
  const queries = [
    siteName,
    ...alternateNames,
    `${siteName} ${district}`,
    `${siteName} Tamil Nadu`
  ];

  for (const q of queries) {
    try {
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&origin=*`;
      const res = await fetch(searchUrl, { headers: { 'User-Agent': USER_AGENT } });
      if (!res.ok) continue;
      const data = await res.json();
      if (!data.query?.search?.length) continue;

      // Check first 2 search hits
      const candidates = data.query.search.slice(0, 2);
      for (const cand of candidates) {
        const sumUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cand.title)}`;
        const sumRes = await fetch(sumUrl, { headers: { 'User-Agent': USER_AGENT } });
        if (!sumRes.ok) continue;
        const sumData = await sumRes.json();
        
        // Ensure thumbnail exists
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

(async () => {
  const testSites = [
    { siteId: 'kailasanathar-temple', name: 'Kailasanathar Temple', district: 'Kanchipuram' },
    { siteId: 'ekambareswarar-temple', name: 'Ekambareswarar Temple', district: 'Kanchipuram' },
    { siteId: 'namakkal-rock-fort', name: 'Namakkal Rock Fort', district: 'Namakkal' },
    { siteId: 'namakkal-narasimhaswamy-cave', name: 'Narasimhaswamy Rock-Cut Cave Temple, Namakkal', district: 'Namakkal' },
    { siteId: 'gingee-fort', name: 'Gingee Fort (Senji Fort)', district: 'Viluppuram' }
  ];

  for (const s of testSites) {
    console.log(`Resolving for ${s.name}...`);
    const found = await findWikipediaThumbnail(s.name, s.district);
    console.log(`  -> Result: ${found ? found.url : 'NONE'}`);
  }
})();
