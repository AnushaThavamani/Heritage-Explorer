const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const seedDataPath = path.join(__dirname, '../data/tamilnadu_heritage_sites.js');
const cachePath = path.join(__dirname, '../data/image_cache.json');

let mergedDataCache = null;

function getMergedData() {
  // Clean module cache for seed data just in case it's updated manually
  delete require.cache[require.resolve(seedDataPath)];
  mergedDataCache = require(seedDataPath);
  
  return mergedDataCache;
}

router.get('/', (req, res) => {
  try {
    let data = getMergedData();
    if (req.query.state) {
      data = data.filter(s => s.state === req.query.state);
    }
    if (req.query.district) {
      data = data.filter(s => s.district === req.query.district);
    }
    res.json(data);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const data = getMergedData();
    const site = data.find(s => s.id === req.params.id);
    if (!site) return res.status(404).json({ error: 'Site not found' });
    res.json(site);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
