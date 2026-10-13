require('dotenv').config({ path: 'd:/Heritage Explorer/backend/.env' });
const mongoose = require('mongoose');

const USER_AGENT = 'HeritageExplorer/2.0 (Cultural Heritage Discovery; contact: info@heritageexplorer.org)';

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

const FORBIDDEN_FILE_WORDS = [
  'falcon', 'bird', 'avian', 'frog', 'butterfly', 'snake', 'lizard', 'insect', 'flora',
  'locomotive', 'railway station', 'train', 'bus', 'airport', 'hospital', 'college',
  'map of', 'locator map', 'diagram', 'chart', 'flag', 'coat of arms', 'seal of',
  'logo', 'screenshot', 'stamp of', 'banknote', 'postal'
];

function isForbiddenFile(title, desc) {
  const text = `${title} ${desc}`.toLowerCase();
  return FORBIDDEN_FILE_WORDS.some(w => text.includes(w));
}

async function searchCommonsForSite(site) {
  const cleanName = site.name.replace(/\(.*?\)/g, '').replace(/[\/\\-]/g, ' ').trim();
  const searchQueries = [
    cleanName,
    ...(site.alternate_names || []),
    `${cleanName} ${site.district}`,
    `${site.district} ${cleanName}`
  ];

  for (const q of searchQueries) {
    if (!q || q.length < 3) continue;
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

        // Check relevance
        const textToMatch = `${title} ${desc}`.toLowerCase();
        
        // Extract key terms from site name (words of 4+ chars)
        const stopWords = new Set(['temple', 'temples', 'fort', 'forts', 'palace', 'cave', 'caves', 'monument', 'memorial', 'heritage', 'tamil', 'nadu', 'india', 'district', 'town', 'village', 'ancient', 'historic', 'historical', 'stone', 'rock', 'site', 'hall', 'church', 'mosque', 'museum', 'ruins', 'complex', 'hill', 'hills', 'shiva', 'perumal', 'swamy']);
        const siteKeywords = cleanName.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(w => w.length >= 4 && !stopWords.has(w));
        
        const hasKeyMatch = siteKeywords.some(k => textToMatch.includes(k));
        if (!hasKeyMatch) continue;

        // Check distance if GPS coords are available in file
        const lat = parseFloat(meta.GPSLatitude?.value);
        const lon = parseFloat(meta.GPSLongitude?.value);
        if (!isNaN(lat) && !isNaN(lon) && site.latitude && site.longitude) {
          const dist = haversineDistanceMeters(site.latitude, site.longitude, lat, lon);
          if (dist > 15000) {
            // Geotagged too far (>15km) from actual site
            continue;
          }
        }

        // Clean artist text
        const artist = (meta.Artist?.value || 'Wikimedia Commons Contributor')
          .replace(/<[^>]*>/g, '').trim();
        const license = meta.LicenseShortName?.value || 'Creative Commons';

        return {
          url: info.thumburl,
          attribution: artist,
          license: license,
          sourcePage: info.descriptionurl || null,
          title: title
        };
      }
    } catch (e) {
      // Continue next query
    }
  }
  return null;
}

(async () => {
  const testSites = [
    {
      siteId: 'tn-mdu-04',
      name: 'Arittapatti Rock-Cut Shiva Temple',
      alternate_names: ['Arittapatti Sivankoil', 'Idaichchi Mandapam Cave Temple'],
      district: 'Madurai',
      latitude: 10.0403,
      longitude: 78.2760
    },
    {
      siteId: 'thirumeyachur-lalithambika-temple',
      name: 'Thirumeyachur Meganatha Swamy & Lalithambika Temple',
      alternate_names: ['Thirumeyachur Temple', 'Lalithambika Temple'],
      district: 'Tiruvarur'
    },
    {
      siteId: 'rayakottai-fort',
      name: 'Rayakottai Fort',
      alternate_names: ['Rayakottai Hill Fort', 'Raikotta Fort'],
      district: 'Krishnagiri'
    },
    {
      siteId: 'kudumiyanmalai-shikhanathar-temple',
      name: 'Kudumiyanmalai Shikhanathar Temple & Musical Inscription',
      alternate_names: ['Sikharagiriswara Temple', 'Kudumiyamalai Temple'],
      district: 'Pudukkottai'
    }
  ];

  for (const s of testSites) {
    console.log(`Searching Commons for: ${s.name}...`);
    const res = await searchCommonsForSite(s);
    if (res) {
      console.log(`  -> FOUND: ${res.title}`);
      console.log(`     URL: ${res.url}`);
      console.log(`     Attribution: ${res.attribution} (${res.license})`);
    } else {
      console.log('  -> NOT FOUND');
    }
  }
})();
