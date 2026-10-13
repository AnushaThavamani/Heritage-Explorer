require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');
const HeritageSite = require('../models/HeritageSite');
const { importHeritageRecords } = require('../pipelines/importPipeline');

async function run() {
  const batchName = process.argv[2] || 'batch_01';
  const isDryRun = process.argv.includes('--dry-run');

  const batchPath = path.resolve(__dirname, `../data/batches/${batchName.replace(/\.js$/, '')}.js`);
  console.log(`Loading batch from: ${batchPath}`);
  
  let records;
  try {
    records = require(batchPath);
  } catch (err) {
    console.error(`Failed to load batch "${batchName}":`, err.message);
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not configured in .env');

  await mongoose.connect(uri);
  console.log('Connected to MongoDB at', uri);
  if (isDryRun) {
    console.log('*** DRY-RUN MODE: No database changes will be committed ***');
  }

  const report = await importHeritageRecords(records, {
    dryRun: isDryRun,
    sourceName: `batch:${batchName}`,
    model: HeritageSite
  });

  console.log('----------------------------------------------------');
  console.log(`Batch "${batchName}" Import Results:`);
  console.log(`  Total Evaluated : ${report.summary.total}`);
  console.log(`  Inserted        : ${report.summary.inserted}`);
  console.log(`  Updated         : ${report.summary.updated}`);
  console.log(`  Skipped         : ${report.summary.skipped}`);
  console.log(`  Rejected        : ${report.summary.rejected}`);
  console.log('----------------------------------------------------');

  if (report.actions.length > 0) {
    console.log('Record Actions:');
    report.actions.forEach(a => {
      const detail = a.reason || (a.diff ? JSON.stringify(a.diff) : '');
      console.log(`  [${a.action.toUpperCase()}] ${a.siteId} - ${a.name} ${detail ? `(${detail})` : ''}`);
    });
  }

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Fatal batch import error:', err);
  process.exit(1);
});
