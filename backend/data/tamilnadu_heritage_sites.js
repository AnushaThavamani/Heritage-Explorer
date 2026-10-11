/**
 * Tamil Nadu Heritage Sites Dataset (All 38 Districts)
 * Combines verified historical and archaeological heritage records across 4 administrative regions:
 * - North: 8 Districts (48 sites)
 * - Central: 12 Districts (72 sites)
 * - West: 8 Districts (48 sites)
 * - South: 10 Districts (62 sites)
 * Total: 230 verified historical sites covering all 38 districts (>= 6 per district).
 */

const northSites = require('./regions/north');
const centralSites = require('./regions/central');
const westSites = require('./regions/west');
const southSites = require('./regions/south');

const heritageSites = [
  ...northSites,
  ...centralSites,
  ...westSites,
  ...southSites
];

module.exports = heritageSites;