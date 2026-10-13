require('dotenv').config();
const mongoose = require('mongoose');
const HeritageSite = require('../models/HeritageSite');
const { DISTRICTS } = require('../data/districts');
const { CATEGORIES } = require('../data/categories');

async function generateReport() {
  const uri = process.env.MONGODB_URI;
  await mongoose.connect(uri);

  const sites = await HeritageSite.find({});
  const districtMap = {};
  
  DISTRICTS.forEach(d => {
    districtMap[d.id] = {
      name: d.name,
      region: d.region,
      total: 0,
      sites: [],
      categories: {}
    };
  });

  const unmapped = [];

  sites.forEach(site => {
    const dId = site.districtId;
    if (dId && districtMap[dId]) {
      districtMap[dId].total++;
      const cat = (site.categories && site.categories[0]) || site.category || 'other';
      districtMap[dId].categories[cat] = (districtMap[dId].categories[cat] || 0) + 1;
      districtMap[dId].sites.push({ siteId: site.siteId, name: site.name, category: cat });
    } else {
      unmapped.push({ siteId: site.siteId, name: site.name, district: site.district, districtId: site.districtId });
    }
  });

  const covered = [];
  const empty = [];

  DISTRICTS.forEach(d => {
    const data = districtMap[d.id];
    if (data.total > 0) {
      covered.push(data);
    } else {
      empty.push(data);
    }
  });

  console.log('=== TAMIL NADU HERITAGE DISTRICT COVERAGE REPORT ===');
  console.log(`Total Sites in DB: ${sites.length}`);
  console.log(`Districts with Coverage: ${covered.length} / 38`);
  console.log(`Districts with Zero Coverage: ${empty.length} / 38`);
  console.log('----------------------------------------------------');
  
  if (unmapped.length > 0) {
    console.log(`Unmapped / Legacy District Records (${unmapped.length}):`);
    unmapped.forEach(u => console.log(`  - [${u.siteId}] ${u.name} (raw district: "${u.district}", districtId: "${u.districtId}")`));
    console.log('----------------------------------------------------');
  }

  console.log('Covered Districts Summary:');
  covered.forEach(c => {
    const catBreakdown = Object.entries(c.categories).map(([cat, count]) => `${cat}: ${count}`).join(', ');
    console.log(`  - ${c.name} (${c.region}): ${c.total} site(s) [${catBreakdown}]`);
  });

  console.log('----------------------------------------------------');
  console.log(`Districts with 0 Sites (${empty.length}):`);
  const emptyNames = empty.map(e => e.name).join(', ');
  console.log(`  ${emptyNames}`);

  await mongoose.disconnect();
}

generateReport().catch(err => {
  console.error('Error generating report:', err);
  process.exit(1);
});
