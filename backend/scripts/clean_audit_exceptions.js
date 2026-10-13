require('dotenv').config({ path: 'd:/Heritage Explorer/backend/.env' });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const HeritageSite = require('../models/HeritageSite');
const north = require('../data/regions/north');
const central = require('../data/regions/central');
const west = require('../data/regions/west');
const south = require('../data/regions/south');

const CACHE_FILE = path.join(__dirname, '../data/image_cache.json');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));

  const corrections = [
    {
      siteId: 'thally-venugopala-swamy-temple',
      url: null,
      status: 'missing',
      attribution: null,
      license: null,
      sourcePage: null,
      reason: 'Rejected unrelated film poster match'
    },
    {
      siteId: 'ambur-fort-battlegrounds',
      url: null,
      status: 'missing',
      attribution: null,
      license: null,
      sourcePage: null,
      reason: 'Rejected railway station photo for historical fort'
    },
    {
      siteId: 'jolarpet-historic-railway-junction',
      url: null,
      status: 'missing',
      attribution: null,
      license: null,
      sourcePage: null,
      reason: 'Rejected Nilgiri train photo for Jolarpet junction'
    },
    {
      siteId: 'ilanji-kumarar-temple',
      url: null,
      status: 'missing',
      attribution: null,
      license: null,
      sourcePage: null,
      reason: 'Rejected Sanjeevi Raya Hanuman photo for Ilanji Kumarar Temple'
    },
    {
      siteId: 'bhagavathi-amman-temple-kanyakumari',
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c5/Kanyakumari_temple.jpg/800px-Kanyakumari_temple.jpg',
      status: 'resolved',
      attribution: 'Kannan (Wikimedia Commons)',
      license: 'CC BY-SA 3.0',
      sourcePage: 'https://commons.wikimedia.org/wiki/File:Kanyakumari_temple.jpg',
      reason: 'Assigned genuine photograph of Kanyakumari Bhagavathi Amman Temple'
    }
  ];

  for (const c of corrections) {
    console.log(`Applying strict correction for ${c.siteId}: ${c.reason}`);
    
    // 1. Update cache
    cache[c.siteId] = {
      imageUrl: c.url,
      imageStatus: c.status,
      imageAttribution: c.attribution,
      imageLicense: c.license,
      imageSourcePage: c.sourcePage,
      lastChecked: new Date().toISOString()
    };

    // 2. Update DB
    await HeritageSite.updateOne(
      { siteId: c.siteId },
      {
        $set: {
          image_url: c.url,
          image_status: c.status,
          image_attribution: c.attribution,
          image_license: c.license,
          image_source_page: c.sourcePage
        }
      }
    );

    // 3. Update regional in-memory files
    for (const arr of [north, central, west, south]) {
      const found = arr.find(s => s.siteId === c.siteId);
      if (found) {
        found.image_url = c.url;
        found.image_status = c.status;
        found.image_attribution = c.attribution;
        found.image_license = c.license;
        found.image_source_page = c.sourcePage;
      }
    }
  }

  // Save updated cache
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');

  // Save regional files
  fs.writeFileSync(path.join(__dirname, '../data/regions/north.js'), 'module.exports = ' + JSON.stringify(north, null, 2) + ';\n', 'utf8');
  fs.writeFileSync(path.join(__dirname, '../data/regions/central.js'), 'module.exports = ' + JSON.stringify(central, null, 2) + ';\n', 'utf8');
  fs.writeFileSync(path.join(__dirname, '../data/regions/west.js'), 'module.exports = ' + JSON.stringify(west, null, 2) + ';\n', 'utf8');
  fs.writeFileSync(path.join(__dirname, '../data/regions/south.js'), 'module.exports = ' + JSON.stringify(south, null, 2) + ';\n', 'utf8');

  console.log('Strict audit corrections applied successfully.');
  await mongoose.disconnect();
})();
