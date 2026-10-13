const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const app = require('../server');

describe('Phase 4 — Heritage API Enhancement & Validation Tests', () => {
  let server;
  let baseUrl;

  before(async () => {
    // Ensure DB connection if not already connected
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/heritage_explorer');
    }
    // Start ephemeral server
    await new Promise(resolve => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}/api/heritage-sites`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
    await mongoose.disconnect();
  });

  // 1. Response shape backward compatibility
  test('GET /api/heritage-sites returns JSON array by default', async () => {
    const res = await fetch(baseUrl);
    assert.equal(res.status, 200);
    assert.ok(res.headers.get('content-type').includes('application/json'));
    const data = await res.json();
    assert.ok(Array.isArray(data), 'Default response must be an Array to protect existing mobile app contract');
    assert.ok(data.length > 0, 'Should return heritage sites');
  });

  // 2. District filtering & alias resolution
  test('District filtering resolves official name and variant aliases', async () => {
    // Official name: Madurai
    const res1 = await fetch(`${baseUrl}?district=Madurai`);
    const data1 = await res1.json();
    assert.ok(Array.isArray(data1));
    assert.ok(data1.length > 0);
    assert.ok(data1.every(s => s.district === 'Madurai' || s.districtId === 'madurai'));

    // Alias: Kancheepuram -> resolves to kanchipuram
    const res2 = await fetch(`${baseUrl}?district=Kancheepuram`);
    const data2 = await res2.json();
    assert.ok(Array.isArray(data2));
    assert.ok(data2.length > 0);
    assert.ok(data2.every(s => s.districtId === 'kanchipuram' || s.district.toLowerCase().includes('kanch')));

    // Verified district with coverage: Ariyalur (now fully covered with >= 6 sites)
    const res3 = await fetch(`${baseUrl}?district=Ariyalur`);
    const data3 = await res3.json();
    assert.equal(res3.status, 200);
    assert.ok(Array.isArray(data3));
    assert.ok(data3.length >= 6, 'Ariyalur must be covered with verified sites');
    assert.ok(data3.every(s => s.districtId === 'ariyalur' || s.district === 'Ariyalur'));

    // Non-existent / empty district
    const res4 = await fetch(`${baseUrl}?district=NonExistentDistrict`);
    const data4 = await res4.json();
    assert.equal(res4.status, 200);
    assert.deepEqual(data4, [], 'Non-existent district must return empty array without error');
  });

  // 3. Category & Multi-Category filtering
  test('Category filtering supports canonical slugs, plural/singular, and legacy strings', async () => {
    // Canonical slug: temples
    const res1 = await fetch(`${baseUrl}?category=temples`);
    const data1 = await res1.json();
    assert.ok(data1.length > 0);
    assert.ok(data1.every(s => s.categories.includes('temples') || s.category.toLowerCase().includes('temple')));

    // Lowercase singular from ExploreScreen: fort
    const res2 = await fetch(`${baseUrl}?category=fort`);
    const data2 = await res2.json();
    assert.ok(data2.length > 0);
    assert.ok(data2.every(s => s.categories.includes('forts_palaces') || s.category.toLowerCase().includes('fort')));

    // Multi-category comma separated: temples,forts_palaces
    const res3 = await fetch(`${baseUrl}?categories=temples,forts_palaces`);
    const data3 = await res3.json();
    assert.ok(data3.length >= data1.length);
  });

  // 4. Combined filters (District + Category)
  test('Combined filters (District + Category) narrow results accurately', async () => {
    const res = await fetch(`${baseUrl}?district=Madurai&category=archaeological`);
    const data = await res.json();
    assert.ok(Array.isArray(data));
    assert.ok(data.length > 0);
    assert.ok(data.every(s => s.districtId === 'madurai' && (s.categories.includes('archaeological') || s.category.toLowerCase().includes('archaeolog'))));
  });

  // 5. Text search & ReDoS protection
  test('Text search matches keywords across fields and safely escapes regex special characters', async () => {
    // Normal keyword search
    const res1 = await fetch(`${baseUrl}?q=Vellore`);
    const data1 = await res1.json();
    assert.ok(data1.length > 0);
    assert.ok(data1.some(s => s.name.toLowerCase().includes('vellore') || s.location.toLowerCase().includes('vellore')));

    // Special regex characters (must not crash with syntax error or ReDoS)
    const res2 = await fetch(`${baseUrl}?q=Temple+(Shiva)`);
    assert.equal(res2.status, 200);
    const data2 = await res2.json();
    assert.ok(Array.isArray(data2));

    // Search with no matches
    const res3 = await fetch(`${baseUrl}?q=UnmatchedGibberishXYZ98765`);
    const data3 = await res3.json();
    assert.deepEqual(data3, []);
  });

  // 6. Bounded Pagination & Headers
  test('Pagination handles boundaries, caps max limit, and exposes headers', async () => {
    const res = await fetch(`${baseUrl}?page=1&limit=2`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.length, 2);

    // Verify pagination headers
    assert.ok(Number(res.headers.get('x-total-count')) >= 33);
    assert.equal(res.headers.get('x-page'), '1');
    assert.equal(res.headers.get('x-limit'), '2');
    assert.ok(Number(res.headers.get('x-total-pages')) >= 17);

    // Boundary check: high limit is capped at 100
    const resCapped = await fetch(`${baseUrl}?limit=500`);
    assert.equal(resCapped.headers.get('x-limit'), '100');

    // Page out of bounds returns empty array
    const resOob = await fetch(`${baseUrl}?page=999&limit=10`);
    const dataOob = await resOob.json();
    assert.deepEqual(dataOob, []);

    // Explicit envelope when ?paginate=true
    const resEnvelope = await fetch(`${baseUrl}?page=1&limit=3&paginate=true`);
    const envelope = await resEnvelope.json();
    assert.ok(envelope.pagination, 'Should include pagination object');
    assert.equal(envelope.pagination.page, 1);
    assert.equal(envelope.pagination.limit, 3);
    assert.equal(envelope.data.length, 3);
  });

  // 7. Site details by ID & 404 handling
  test('GET /api/heritage-sites/:id retrieves site by siteId and returns 404 for invalid IDs', async () => {
    // Valid stable siteId
    const res1 = await fetch(`${baseUrl}/brihadeeswarar-temple`);
    assert.equal(res1.status, 200);
    const site1 = await res1.json();
    assert.equal(site1.siteId, 'brihadeeswarar-temple');
    assert.equal(site1.name, 'Brihadeeswarar Temple');

    // Non-existent ID returns clean 404 JSON (not 500)
    const res2 = await fetch(`${baseUrl}/non-existent-site-slug-404`);
    assert.equal(res2.status, 404);
    const err2 = await res2.json();
    assert.equal(err2.message, 'Heritage site not found.');

    // Malformed 24-character hex ID returns 404 (not 500)
    const res3 = await fetch(`${baseUrl}/000000000000000000000000`);
    assert.equal(res3.status, 404);
    const err3 = await res3.json();
    assert.equal(err3.message, 'Heritage site not found.');
  });

  // 8. Explore endpoint
  test('GET /api/heritage-sites/explore returns sampled feed and respects category filter', async () => {
    const res = await fetch(`${baseUrl}/explore?limit=5`);
    assert.equal(res.status, 200);
    const sites = await res.json();
    assert.ok(Array.isArray(sites));
    assert.ok(sites.length <= 5);

    // Filter by category in explore
    const resCat = await fetch(`${baseUrl}/explore?category=temple&limit=5`);
    const catSites = await resCat.json();
    assert.ok(Array.isArray(catSites));
    assert.ok(catSites.every(s => s.categories.includes('temples') || s.category.toLowerCase().includes('temple')));
  });

  // 9. Aliased route compatibility (/api/heritagesites)
  test('Aliased route /api/heritagesites works identically', async () => {
    const port = server.address().port;
    const aliasUrl = `http://127.0.0.1:${port}/api/heritagesites`;
    const res = await fetch(aliasUrl);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data));
    assert.ok(data.length > 0);
  });
});
