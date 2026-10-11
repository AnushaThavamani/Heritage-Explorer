require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('./models/User');
const sites = require('./data/tamilnadu_heritage_sites');
const { importHeritageRecords } = require('./pipelines/importPipeline');

async function seed() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGO_URI / MONGODB_URI is not configured in .env');

  const isDryRun = process.argv.includes('--dry-run');

  await mongoose.connect(uri);
  console.log('Connected to MongoDB at', uri);
  if (isDryRun) {
    console.log('*** RUNNING IN DRY-RUN MODE (No database writes will occur) ***');
  }

  // 1. Run safe, idempotent import pipeline
  console.log(`Processing ${sites.length} heritage sites through the safe import pipeline...`);
  const report = await importHeritageRecords(sites, {
    dryRun: isDryRun,
    sourceName: 'seed'
  });

  console.log('========================================');
  console.log('Import Pipeline Summary:');
  console.log(`- Total Records Evaluated : ${report.summary.total}`);
  console.log(`- Inserted (New)          : ${report.summary.inserted}`);
  console.log(`- Updated (Safe Merge)    : ${report.summary.updated}`);
  console.log(`- Skipped (Identical)     : ${report.summary.skipped}`);
  console.log(`- Rejected (Invalid)      : ${report.summary.rejected}`);
  console.log('========================================');

  if (report.errors.length > 0) {
    console.warn(`Encountered ${report.errors.length} validation errors:`);
    report.errors.forEach(e => console.warn(`  [${e.siteId}] ${e.name}: ${e.reason}`));
  }

  // 2. Ensure development admin user exists (idempotently)
  const name = process.env.ADMIN_NAME || 'Heritage Explorer Admin';
  const email = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'change-this-development-password';

  const existing = await User.findOne({ email });
  if (!existing && !isDryRun) {
    await User.create({ name, email, password: await bcrypt.hash(password, 12), role: 'admin' });
    console.log(`Created development admin: ${email}`);
  } else if (existing) {
    console.log(`Admin account verified: ${email}`);
  }
}

seed()
  .catch(error => {
    console.error('Database seed error:', error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
