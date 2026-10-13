require('dotenv').config({ path: 'd:/Heritage Explorer/backend/.env' });
const mongoose = require('mongoose');
const Site = require('../models/HeritageSite');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const allSites = await Site.find({});
  const missing = allSites.filter(s => !s.image_url || s.image_url.trim() === '');
  console.log(`Total sites in DB: ${allSites.length}`);
  console.log(`Total missing image_url: ${missing.length}`);
  console.log('--------------------------------------------------');
  missing.forEach((s, idx) => {
    console.log(`[${idx + 1}/${missing.length}] ${s.siteId} | ${s.name} | ${s.district} | ${s.category}`);
  });
  await mongoose.disconnect();
})();
