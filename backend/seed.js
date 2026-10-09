require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const HeritageSite = require('./models/HeritageSite');
const User = require('./models/User');
const sites = require('./data/tamilnadu_heritage_sites');

const defaultIllustrations = {
  temple: 'https://cdn-icons-png.flaticon.com/512/3233/3233483.png',
  fort: 'https://cdn-icons-png.flaticon.com/512/3211/3211285.png',
  palace: 'https://cdn-icons-png.flaticon.com/512/2809/2809795.png',
  monument: 'https://cdn-icons-png.flaticon.com/512/3211/3211244.png',
  cave: 'https://cdn-icons-png.flaticon.com/512/4836/4836643.png',
  church: 'https://cdn-icons-png.flaticon.com/512/107/107873.png',
  mosque: 'https://cdn-icons-png.flaticon.com/512/1004/1004499.png',
  library: 'https://cdn-icons-png.flaticon.com/512/2232/2232688.png',
  museum: 'https://cdn-icons-png.flaticon.com/512/2232/2232688.png',
  default: 'https://cdn-icons-png.flaticon.com/512/3211/3211244.png'
};

async function seed() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGO_URI is not configured. Copy .env.example to .env and set it first.');
  await mongoose.connect(uri);
  console.log('MongoDB connected successfully');

  console.log('Dropping old HeritageSite collection...');
  await HeritageSite.deleteMany({});
  
  const mappedSites = sites.map(site => {
    const imageUrl = site.image_url || null;
    
    // Restore details for UI display (mocking if missing)
    const timings = site.openingTime && site.closingTime ? `${site.openingTime} - ${site.closingTime}` : '06:00 - 18:00';
    const city = site.district || site.city || site.state;
    
    return {
      siteId: site.siteId || site.id,
      state: site.state,
      district: site.district,
      name: site.name,
      category: site.category || site.type || 'monument',
      description: site.description,
      latitude: site.latitude || site.location?.lat,
      longitude: site.longitude || site.location?.lng,
      image_url: imageUrl,
      image_status: imageUrl ? 'resolved' : 'missing',
      location: (typeof site.location === 'string') ? site.location : (site.location?.name || `${site.name}, ${city}`),
      timings: site.timings || timings,
      estimated_visit_time: site.estimated_visit_time || '1-2 hours'
    };
  });

  await HeritageSite.bulkWrite(mappedSites.map(site => ({
    insertOne: {
      document: site
    },
  })));

  const name = process.env.ADMIN_NAME || 'Heritage Explorer Admin';
  const email = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'change-this-development-password';
  const existing = await User.findOne({ email });
  if (!existing) {
    await User.create({ name, email, password: await bcrypt.hash(password, 12), role: 'admin' });
    console.log(`Created development admin: ${email}`);
  } else {
    existing.name = name;
    existing.role = 'admin';
    await existing.save();
    console.log(`Updated seeded admin role: ${email}`);
  }
  console.log(`Seeded ${mappedSites.length} heritage sites from tamilnadu_heritage_sites.js`);
}

seed().catch(error => { console.error('Database seed failed:', error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
