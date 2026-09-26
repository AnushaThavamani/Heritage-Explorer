require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const HeritageSite = require('./models/HeritageSite');
const User = require('./models/User');
const sites = require('./data/heritageSites');

async function seed() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGO_URI is not configured. Copy .env.example to .env and set it first.');
  await mongoose.connect(uri);
  console.log('MongoDB connected successfully');

  await HeritageSite.bulkWrite(sites.map(site => ({
    updateOne: {
      filter: { siteId: site.siteId },
      update: { $set: { ...site, coordinates: { latitude: site.latitude, longitude: site.longitude }, images: site.images?.length ? site.images : [site.image].filter(Boolean) } },
      upsert: true,
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
  console.log(`Seeded or updated ${sites.length} heritage sites without duplicates.`);
}

seed().catch(error => { console.error('Database seed failed:', error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
