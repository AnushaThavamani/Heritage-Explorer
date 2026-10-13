require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const HeritageSite = require('../models/HeritageSite');
const CACHE_FILE = path.join(__dirname, '../data/image_cache.json');
const north = require('../data/regions/north');
const west = require('../data/regions/west');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));

  const updates = [
    {
      siteId: 'nedungunam-ramar-temple',
      url: 'https://upload.wikimedia.org/wikipedia/commons/e/ee/RAMACHANDRA_PERUMAL_TEMPLE.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled',
      attribution: 'Wikimedia Commons Contributor',
      license: 'CC BY-SA 4.0',
      sourcePage: 'https://commons.wikimedia.org/wiki/File:RAMACHANDRA_PERUMAL_TEMPLE.jpg'
    },
    {
      siteId: 'kottai-eswaran-temple-cbe',
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5c/Sangameswarar_Temple_1.jpg/960px-Sangameswarar_Temple_1.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      attribution: 'Wikimedia Commons Contributor',
      license: 'CC BY-SA 3.0',
      sourcePage: 'https://commons.wikimedia.org/wiki/File:Sangameswarar_Temple_1.jpg'
    }
  ];

  for (const u of updates) {
    await HeritageSite.updateOne({ siteId: u.siteId }, {
      $set: {
        image_url: u.url,
        image_status: 'resolved',
        image_attribution: u.attribution,
        image_license: u.license,
        image_source_page: u.sourcePage
      }
    });
    cache[u.siteId] = {
      imageUrl: u.url,
      imageStatus: 'resolved',
      imageAttribution: u.attribution,
      imageLicense: u.license,
      imageSourcePage: u.sourcePage,
      lastChecked: new Date().toISOString()
    };
    for (const arr of [north, west]) {
      const found = arr.find(x => x.siteId === u.siteId);
      if (found) {
        found.image_url = u.url;
        found.image_status = 'resolved';
        found.image_attribution = u.attribution;
        found.image_license = u.license;
        found.image_source_page = u.sourcePage;
      }
    }
    console.log('Updated:', u.siteId);
  }

  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
  fs.writeFileSync(path.join(__dirname, '../data/regions/north.js'), 'module.exports = ' + JSON.stringify(north, null, 2) + ';\n', 'utf8');
  fs.writeFileSync(path.join(__dirname, '../data/regions/west.js'), 'module.exports = ' + JSON.stringify(west, null, 2) + ';\n', 'utf8');
  console.log('DONE!');
  await mongoose.disconnect();
})();
