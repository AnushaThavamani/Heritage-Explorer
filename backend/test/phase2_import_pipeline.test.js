const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const {
  validateIncomingRecord,
  calculateSafeMerge,
  importHeritageRecords,
  haversineDistanceMeters
} = require('../pipelines/importPipeline');
const HeritageSite = require('../models/HeritageSite');

const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/heritage_explorer_test_phase2';

describe('Phase 2 — Heritage Data Import Pipeline Validation & Safety', () => {

  test('validateIncomingRecord accepts valid record and attaches canonical references', () => {
    const raw = {
      siteId: 'test-thanjavur-temple',
      name: 'Thanjavur Royal Temple',
      district: 'Thanjavur',
      category: 'Temples',
      latitude: 10.78,
      longitude: 79.13,
      description: 'Chola heritage temple'
    };

    const res = validateIncomingRecord(raw, 'test-feed');
    assert.equal(res.valid, true);
    assert.equal(res.normalized.siteId, 'test-thanjavur-temple');
    assert.equal(res.normalized.districtId, 'thanjavur');
    assert.deepEqual(res.normalized.categories, ['temples']);
    assert.equal(res.normalized.source, 'test-feed');
  });

  test('validateIncomingRecord generates deterministic slug if siteId is omitted', () => {
    const raw = {
      name: 'Papanasam Waterfall Shrines',
      district: 'Tirunelveli',
      category: 'temple'
    };

    const res = validateIncomingRecord(raw, 'test');
    assert.equal(res.valid, true);
    assert.equal(res.normalized.siteId, 'tn-tirunelveli-papanasam-waterfall-shrines');
  });

  test('validateIncomingRecord rejects records with missing required fields or invalid district/coordinates', () => {
    // Missing name
    const noName = validateIncomingRecord({ district: 'Madurai', category: 'Temples' });
    assert.equal(noName.valid, false);
    assert.ok(noName.errors.some(e => e.includes('name')));

    // Unresolvable district
    const badDistrict = validateIncomingRecord({ name: 'Site', district: 'NonExistentLand', category: 'Temples' });
    assert.equal(badDistrict.valid, false);
    assert.ok(badDistrict.errors.some(e => e.includes('district')));

    // Latitude out of range
    const badLat = validateIncomingRecord({ name: 'Site', district: 'Madurai', category: 'Temples', latitude: 120 });
    assert.equal(badLat.valid, false);
    assert.ok(badLat.errors.some(e => e.includes('Latitude out of range')));
  });

  test('calculateSafeMerge NEVER overwrites valid existing data with empty/null incoming values', () => {
    const existing = {
      siteId: 'site-01',
      name: 'Existing Temple',
      description: 'Rich historic 10-line description with proven citations.',
      latitude: 9.92,
      longitude: 78.12,
      image_url: 'https://example.com/verified-image.jpg',
      categories: ['temples'],
      tags: ['heritage_monument']
    };

    const incomingEmpty = {
      siteId: 'site-01',
      name: 'Existing Temple',
      description: '', // Empty description
      latitude: null, // Null latitude
      longitude: null, // Null longitude
      image_url: null, // Null image
      categories: ['temples'],
      tags: []
    };

    const merge = calculateSafeMerge(existing, incomingEmpty);
    assert.equal(merge.changed, false, 'No fields should be modified when incoming has empty/null values');
    assert.deepEqual(merge.updateDoc, {}, 'Update document must be empty');
  });

  test('calculateSafeMerge correctly merges non-destructive enrichments', () => {
    const existing = {
      siteId: 'site-02',
      name: 'Ancient Fort',
      description: '', // Missing
      image_url: null, // Missing
      categories: ['forts_palaces'],
      tags: ['fort'],
      source_urls: ['https://source1.org']
    };

    const incomingEnriched = {
      siteId: 'site-02',
      description: 'Newly discovered colonial bastion.',
      image_url: 'https://commons.wikimedia.org/fort.jpg',
      categories: ['forts_palaces'],
      tags: ['fort', 'bastion'],
      source_urls: ['https://source2.org']
    };

    const merge = calculateSafeMerge(existing, incomingEnriched);
    assert.equal(merge.changed, true);
    assert.equal(merge.updateDoc.description, 'Newly discovered colonial bastion.');
    assert.equal(merge.updateDoc.image_url, 'https://commons.wikimedia.org/fort.jpg');
    assert.deepEqual(merge.updateDoc.tags, ['fort', 'bastion']);
    assert.deepEqual(merge.updateDoc.source_urls, ['https://source1.org', 'https://source2.org']);
  });
});

describe('Phase 2 — Isolated Database Import & Duplicate Prevention (Double Execution Test)', () => {
  let testConnection;
  let TestModel;

  before(async () => {
    testConnection = await mongoose.createConnection(TEST_DB_URI).asPromise();
    TestModel = testConnection.model('TestHeritageSite', HeritageSite.schema);
    // Ensure clean state in the test-only collection
    await TestModel.deleteMany({});
  });

  after(async () => {
    if (testConnection) {
      // Clean up test collection and close test connection
      await TestModel.deleteMany({});
      await testConnection.destroy();
    }
  });

  const fixtureBatch = [
    {
      siteId: 'tn-mdu-test-01',
      name: 'Madurai Nayak Mahal Test',
      district: 'Madurai',
      category: 'Palaces',
      description: '17th-century palace built by King Tirumala Nayaka.',
      latitude: 9.915,
      longitude: 78.123,
      image_url: 'https://example.com/nayak.jpg'
    },
    {
      siteId: 'tn-vlr-test-02',
      name: 'Vellore Ramparts Test',
      district: 'Vellore',
      category: 'Forts',
      description: 'Stone masonry military fortifications.',
      latitude: 12.922,
      longitude: 79.128
    },
    {
      siteId: 'tn-thj-test-03',
      name: 'Maratha Durbar Hall Test',
      district: 'Thanjavur',
      category: 'Palaces',
      latitude: 10.790,
      longitude: 79.135
    },
    {
      // Invalid record: missing required district
      siteId: 'tn-invalid-04',
      name: 'Invalid Test Site',
      district: 'Mars',
      category: 'Monuments'
    }
  ];

  test('Dry-Run execution simulates without modifying database', async () => {
    const report = await importHeritageRecords(fixtureBatch, {
      dryRun: true,
      sourceName: 'test-fixture',
      model: TestModel
    });

    assert.equal(report.dryRun, true);
    assert.equal(report.summary.total, 4);
    assert.equal(report.summary.inserted, 3);
    assert.equal(report.summary.rejected, 1);
    assert.equal(report.summary.updated, 0);
    assert.equal(report.summary.skipped, 0);

    // Verify DB count is still 0
    const countInDb = await TestModel.countDocuments();
    assert.equal(countInDb, 0, 'Dry-run must not create any documents in database');
  });

  test('First Execution: inserts valid records and reports rejections', async () => {
    const report1 = await importHeritageRecords(fixtureBatch, {
      dryRun: false,
      sourceName: 'test-fixture',
      model: TestModel
    });

    assert.equal(report1.summary.total, 4);
    assert.equal(report1.summary.inserted, 3, 'Expected 3 records inserted');
    assert.equal(report1.summary.rejected, 1, 'Expected 1 record rejected');
    assert.equal(report1.summary.updated, 0);
    assert.equal(report1.summary.skipped, 0);

    const countInDb = await TestModel.countDocuments();
    assert.equal(countInDb, 3, 'Database must contain exactly 3 inserted records');
  });

  test('Second Execution: 100% IDEMPOTENT (Zero duplicates created, all existing records skipped)', async () => {
    // Re-run with EXACT same batch
    const report2 = await importHeritageRecords(fixtureBatch, {
      dryRun: false,
      sourceName: 'test-fixture',
      model: TestModel
    });

    assert.equal(report2.summary.total, 4);
    assert.equal(report2.summary.inserted, 0, 'Zero duplicates should be inserted on second execution');
    assert.equal(report2.summary.skipped, 3, 'All 3 existing records must be skipped');
    assert.equal(report2.summary.rejected, 1, 'Invalid record remains rejected');
    assert.equal(report2.summary.updated, 0);

    // Crucial check: verify database count remained strictly 3!
    const countInDb = await TestModel.countDocuments();
    assert.equal(countInDb, 3, 'Database count must remain strictly 3 without any duplicate records');
  });

  test('Enrichment Execution: safely updates only missing fields without overwriting existing data', async () => {
    const enrichmentBatch = [
      {
        siteId: 'tn-thj-test-03',
        name: 'Maratha Durbar Hall Test',
        district: 'Thanjavur',
        category: 'Palaces',
        description: 'Newly provided historical description of the durbar hall murals.',
        image_url: 'https://example.com/durbar.jpg'
      }
    ];

    const report3 = await importHeritageRecords(enrichmentBatch, {
      dryRun: false,
      sourceName: 'test-enrichment',
      model: TestModel
    });

    assert.equal(report3.summary.total, 1);
    assert.equal(report3.summary.inserted, 0);
    assert.equal(report3.summary.updated, 1);
    assert.equal(report3.summary.skipped, 0);

    // Verify the record was enriched
    const updatedRecord = await TestModel.findOne({ siteId: 'tn-thj-test-03' });
    assert.equal(updatedRecord.description, 'Newly provided historical description of the durbar hall murals.');
    assert.equal(updatedRecord.image_url, 'https://example.com/durbar.jpg');
    // Ensure coordinates from first execution were preserved!
    assert.equal(updatedRecord.latitude, 10.790);
    assert.equal(updatedRecord.longitude, 79.135);
  });
});
