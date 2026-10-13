const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const HeritageSite = require('../models/HeritageSite');
const { validateIncomingRecord, calculateSafeMerge } = require('../pipelines/importPipeline');

test('Phase 6 — Image Provenance, Licensing & Model Schema Compatibility', () => {
  const doc = new HeritageSite({
    siteId: 'test-site-provenance',
    name: 'Sample Provenance Shrine',
    district: 'Thanjavur',
    category: 'Temples',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/a/a4/Brihadeeswarar_Temple_2006118_2.jpg',
    image_attribution: 'John Kingsley',
    image_license: 'CC BY-SA 3.0',
    image_source_page: 'https://commons.wikimedia.org/wiki/File:Brihadeeswarar_Temple_2006118_2.jpg',
    latitude: 10.7828,
    longitude: 79.1318
  });

  const err = doc.validateSync();
  assert.equal(err, undefined, 'Schema should accept image provenance and licensing fields without error');
  assert.equal(doc.image_attribution, 'John Kingsley');
  assert.equal(doc.image_license, 'CC BY-SA 3.0');
  assert.equal(doc.image_source_page, 'https://commons.wikimedia.org/wiki/File:Brihadeeswarar_Temple_2006118_2.jpg');
});

test('Phase 6 — Never Construct Fake Image URLs for Missing Images', () => {
  const incoming = {
    name: 'Unimaged Heritage Site',
    district: 'Madurai',
    category: 'Archaeological Site',
    description: 'An ancient mound without published photographs.'
  };

  const { valid, normalized } = validateIncomingRecord(incoming, 'test-survey');
  assert.equal(valid, true);
  assert.equal(normalized.image_url, null, 'Must NEVER fabricate fake image URLs (e.g. Unsplash placeholders)');
  assert.equal(normalized.image_status, 'missing');
});

test('Phase 6 — Never Infer Coordinates from District Centroids When Missing', () => {
  const incoming = {
    name: 'Site With Unsurveyed Coordinates',
    district: 'Tirunelveli',
    category: 'Forts & Palaces'
  };

  const { valid, normalized } = validateIncomingRecord(incoming, 'test-survey');
  assert.equal(valid, true);
  assert.equal(normalized.latitude, null, 'Latitude must remain null when unsurveyed');
  assert.equal(normalized.longitude, null, 'Longitude must remain null when unsurveyed');
});

test('Phase 6 — Pipeline Safe Merge Supports Non-Destructive Image Provenance Enrichment', () => {
  const existing = {
    siteId: 'tn-tnj-sample',
    name: 'Thanjavur Palace',
    district: 'Thanjavur',
    category: 'Palaces',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/8/82/Thanjavur_Aranmanai_Urkoodam.JPG',
    image_attribution: null,
    image_license: null
  };

  const incoming = {
    siteId: 'tn-tnj-sample',
    name: 'Thanjavur Palace',
    district: 'Thanjavur',
    category: 'Palaces',
    image_attribution: 'Portvp',
    image_license: 'CC BY-SA 4.0',
    image_source_page: 'https://commons.wikimedia.org/wiki/File:Thanjavur_Aranmanai_Urkoodam.JPG'
  };

  const { changed, updateDoc } = calculateSafeMerge(existing, incoming);
  assert.equal(changed, true);
  assert.equal(updateDoc.image_attribution, 'Portvp');
  assert.equal(updateDoc.image_license, 'CC BY-SA 4.0');
  assert.equal(updateDoc.image_source_page, 'https://commons.wikimedia.org/wiki/File:Thanjavur_Aranmanai_Urkoodam.JPG');
  // Must preserve existing image_url without overwrite
  assert.equal(updateDoc.image_url, undefined);
});

test('Phase 6 — Geographic Boundary Verification for Tamil Nadu Coordinates', () => {
  // Valid coordinates inside Tamil Nadu (e.g., Meenakshi Temple, Madurai)
  const validLat = 9.9195;
  const validLng = 78.1193;

  const isVerifiedTamilNadu = (lat, lng) => (
    lat != null && lng != null &&
    !isNaN(lat) && !isNaN(lng) &&
    lat >= 8.0 && lat <= 14.0 &&
    lng >= 76.0 && lng <= 81.0
  );

  assert.equal(isVerifiedTamilNadu(validLat, validLng), true, 'Valid Tamil Nadu coordinates must pass verification');
  assert.equal(isVerifiedTamilNadu(null, null), false, 'Null coordinates must fail verification');
  assert.equal(isVerifiedTamilNadu(0, 0), false, 'Origin (0,0) must fail verification');
  assert.equal(isVerifiedTamilNadu(28.6139, 77.2090), false, 'Delhi coordinates must fail Tamil Nadu bounding box');
});
