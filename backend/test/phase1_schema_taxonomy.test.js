const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const { DISTRICTS, getDistrictById, resolveDistrict, getAllDistrictNames } = require('../data/districts');
const { CATEGORIES, getCategoryById, resolveCategory, normalizeCategories } = require('../data/categories');
const HeritageSite = require('../models/HeritageSite');
const legacySites = require('../data/tamilnadu_heritage_sites');

describe('Phase 1 — Canonical 38-District Catalogue', () => {
  test('catalogue must contain exactly 38 districts of Tamil Nadu', () => {
    assert.equal(DISTRICTS.length, 38, `Expected exactly 38 districts, got ${DISTRICTS.length}`);
  });

  test('all district IDs must be unique, non-empty lowercase slugs', () => {
    const ids = new Set();
    DISTRICTS.forEach(d => {
      assert.ok(d.id, 'District must have an ID');
      assert.match(d.id, /^[a-z0-9-]+$/, `ID ${d.id} must be a lowercase slug`);
      assert.ok(!ids.has(d.id), `Duplicate district ID: ${d.id}`);
      ids.add(d.id);
    });
  });

  test('all districts must belong to Tamil Nadu and have headquarters and region', () => {
    DISTRICTS.forEach(d => {
      assert.equal(d.state, 'Tamil Nadu');
      assert.ok(d.name && d.name.trim().length > 0, `District ${d.id} must have a name`);
      assert.ok(d.headquarters, `District ${d.id} must have headquarters`);
      assert.ok(['North', 'South', 'Central', 'West'].includes(d.region), `District ${d.id} must have valid region zone`);
    });
  });

  test('getDistrictById retrieves district accurately', () => {
    const madurai = getDistrictById('madurai');
    assert.ok(madurai);
    assert.equal(madurai.name, 'Madurai');
    assert.equal(madurai.region, 'South');

    assert.equal(getDistrictById('non-existent'), null);
    assert.equal(getDistrictById(null), null);
  });

  test('resolveDistrict handles standard names, case insensitivity, and historical aliases', () => {
    // Exact official names
    assert.equal(resolveDistrict('Madurai')?.id, 'madurai');
    assert.equal(resolveDistrict('Thanjavur')?.id, 'thanjavur');
    assert.equal(resolveDistrict('Vellore')?.id, 'vellore');

    // Historical & variant spellings
    assert.equal(resolveDistrict('Kancheepuram')?.id, 'kanchipuram');
    assert.equal(resolveDistrict('Kanchi')?.id, 'kanchipuram');
    assert.equal(resolveDistrict('Trichy')?.id, 'tiruchirappalli');
    assert.equal(resolveDistrict('Tiruchirapalli')?.id, 'tiruchirappalli');
    assert.equal(resolveDistrict('Tuticorin')?.id, 'thoothukudi');
    assert.equal(resolveDistrict('Kanniyakumari')?.id, 'kanyakumari');
    assert.equal(resolveDistrict('The Nilgiris')?.id, 'nilgiris');
    assert.equal(resolveDistrict('Ooty')?.id, 'nilgiris');
    assert.equal(resolveDistrict('Tanjore')?.id, 'thanjavur');
    assert.equal(resolveDistrict('Madras')?.id, 'chennai');

    // Complex strings
    assert.equal(resolveDistrict('Madurai District')?.id, 'madurai');
    assert.equal(resolveDistrict('Vellore, Tamil Nadu')?.id, 'vellore');
  });

  test('getAllDistrictNames returns 38 sorted names', () => {
    const names = getAllDistrictNames();
    assert.equal(names.length, 38);
    assert.equal(names[0], 'Ariyalur');
    assert.equal(names[names.length - 1], 'Virudhunagar');
  });
});

describe('Phase 1 — Canonical Category Taxonomy', () => {
  test('all category IDs must be unique slugs', () => {
    const ids = new Set();
    CATEGORIES.forEach(c => {
      assert.ok(c.id, 'Category must have an ID');
      assert.match(c.id, /^[a-z0-9_]+$/, `ID ${c.id} must be slug`);
      assert.ok(!ids.has(c.id), `Duplicate category ID: ${c.id}`);
      ids.add(c.id);
    });
  });

  test('categories must cover all required architectural & cultural domains', () => {
    const ids = CATEGORIES.map(c => c.id);
    assert.ok(ids.includes('temples'));
    assert.ok(ids.includes('churches_mosques_shrines'));
    assert.ok(ids.includes('forts_palaces'));
    assert.ok(ids.includes('archaeological'));
    assert.ok(ids.includes('rock_art_inscriptions'));
    assert.ok(ids.includes('museums_galleries'));
    assert.ok(ids.includes('monuments_memorials'));
    assert.ok(ids.includes('natural_cultural'));
    assert.ok(ids.includes('unesco'));
  });

  test('resolveCategory accurately maps legacy categories', () => {
    assert.equal(resolveCategory('Temples')?.id, 'temples');
    assert.equal(resolveCategory('temple')?.id, 'temples');
    assert.equal(resolveCategory('Cave Temple')?.id, 'temples');

    assert.equal(resolveCategory('Forts')?.id, 'forts_palaces');
    assert.equal(resolveCategory('fort')?.id, 'forts_palaces');
    assert.equal(resolveCategory('Palaces')?.id, 'forts_palaces');
    assert.equal(resolveCategory('palace')?.id, 'forts_palaces');

    assert.equal(resolveCategory('Archaeological Site')?.id, 'archaeological');
    assert.equal(resolveCategory('Excavation Site')?.id, 'archaeological');

    assert.equal(resolveCategory('Museums')?.id, 'museums_galleries');
    assert.equal(resolveCategory('museum')?.id, 'museums_galleries');

    assert.equal(resolveCategory('Monuments')?.id, 'monuments_memorials');
    assert.equal(resolveCategory('monument')?.id, 'monuments_memorials');

    assert.equal(resolveCategory('UNESCO Sites')?.id, 'unesco');
  });

  test('normalizeCategories handles arrays and unmapped tags', () => {
    const res = normalizeCategories(['Temples', 'UNESCO Sites', 'custom_tag']);
    assert.ok(res.includes('temples'));
    assert.ok(res.includes('unesco'));
    assert.ok(res.includes('custom_tag'));
  });
});

describe('Phase 1 — HeritageSite Schema Validation & Backward Compatibility', () => {
  test('schema accepts minimal legacy format and populates additive defaults', async () => {
    const legacyDoc = new HeritageSite({
      siteId: 'test-site-001',
      name: 'Test Heritage Temple',
      state: 'Tamil Nadu',
      district: 'Madurai',
      category: 'Cave Temple'
    });

    const error = legacyDoc.validateSync();
    assert.equal(error, undefined, 'Legacy document should validate without error');

    // Verify auto-inference hooks
    assert.equal(legacyDoc.districtId, 'madurai', 'Should auto-populate districtId from district');
    assert.deepEqual(legacyDoc.categories, ['temples'], 'Should auto-populate categories array from category');
    assert.equal(legacyDoc.verification_status, 'documented', 'Should default verification_status');
    assert.equal(legacyDoc.unesco, false, 'Should default unesco to false');
  });

  test('schema rejects documents missing required fields', () => {
    const invalidDoc = new HeritageSite({
      name: 'Site with missing IDs'
    });

    const error = invalidDoc.validateSync();
    assert.ok(error, 'Should fail validation');
    assert.ok(error.errors.siteId, 'siteId must be required');
    assert.ok(error.errors.district, 'district must be required');
    assert.ok(error.errors.category, 'category must be required');
  });

  test('schema enforces coordinate validation', () => {
    const outOfBoundsDoc = new HeritageSite({
      siteId: 'test-oob',
      name: 'Out of bounds site',
      state: 'Tamil Nadu',
      district: 'Chennai',
      category: 'Monuments',
      latitude: 195.0,
      longitude: 80.0
    });

    const error = outOfBoundsDoc.validateSync();
    assert.ok(error, 'Should fail when latitude is out of bounds');
    assert.ok(error.errors.latitude);
  });

  test('schema properly handles unesco flag and additive metadata', () => {
    const unescoDoc = new HeritageSite({
      siteId: 'brihadeeswarar-test',
      name: 'Brihadeeswarar Temple',
      state: 'Tamil Nadu',
      district: 'Thanjavur',
      category: 'Temples',
      unesco: true,
      verification_status: 'verified',
      period: '11th Century Chola',
      tags: ['chola_architecture', 'great_living_chola_temples']
    });

    const error = unescoDoc.validateSync();
    assert.equal(error, undefined);
    assert.ok(unescoDoc.categories.includes('temples'));
    assert.ok(unescoDoc.categories.includes('unesco'), 'UNESCO flag should be included in categories array');
    assert.equal(unescoDoc.districtId, 'thanjavur');
  });

  test('every single record in existing seed data validates against the new schema', () => {
    legacySites.forEach(site => {
      const doc = new HeritageSite({
        siteId: site.siteId || site.id,
        name: site.name || site.title,
        state: site.state || 'Tamil Nadu',
        district: site.district || (typeof site.location === 'string' ? site.location.split(',')[0].trim() : 'Tamil Nadu'),
        category: site.category || site.type || 'monument',
        description: site.description,
        latitude: site.latitude || site.location?.lat,
        longitude: site.longitude || site.location?.lng,
        image_url: site.image_url || site.image,
        location: typeof site.location === 'string' ? site.location : site.name,
        timings: site.timings || site.visitorTimings,
        estimated_visit_time: site.estimated_visit_time || site.duration
      });

      const error = doc.validateSync();
      assert.equal(error, undefined, `Legacy site "${site.name || site.id}" failed validation: ${error?.message}`);
      assert.ok(doc.districtId, `Site "${doc.name}" must have districtId`);
      assert.ok(doc.categories.length > 0, `Site "${doc.name}" must have at least one category`);
    });
  });
});
