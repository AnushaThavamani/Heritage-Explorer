const axios = require('axios');
const fs = require('fs');
const mongoose = require('mongoose');
const { createObjectCsvWriter } = require('csv-writer');
require('dotenv').config();

const HeritageSite = require('./models/HeritageSite');

// Seed targets
const TARGETS = [
  { state: "Tamil Nadu", district: "Madurai", wd: "Q15116" },
  { state: "Tamil Nadu", district: "Thanjavur", wd: "Q15194" },
  { state: "Tamil Nadu", district: "Kancheepuram", wd: "Q15183" },
  { state: "Kerala", district: "Thrissur", wd: "Q1535756" },
  { state: "Kerala", district: "Kozhikode", wd: "Q1535742" },
  { state: "Kerala", district: "Ernakulam", wd: "Q1535732" },
  { state: "Karnataka", district: "Mysuru", wd: "Q2342268" },
  { state: "Karnataka", district: "Vijayanagara", wd: "Q104868212" },
  { state: "Karnataka", district: "Dakshina Kannada", wd: "Q1779183" },
  { state: "Maharashtra", district: "Chhatrapati Sambhajinagar", wd: "Q592942" }, // Formerly Aurangabad
  { state: "Maharashtra", district: "Pune", wd: "Q1797259" },
  { state: "Maharashtra", district: "Kolhapur", wd: "Q1797262" },
  { state: "Andhra Pradesh", district: "Anantapur", wd: "Q15342" },
  { state: "Andhra Pradesh", district: "Kurnool", wd: "Q15383" },
  { state: "Andhra Pradesh", district: "Visakhapatnam", wd: "Q15392" }
];

const CATEGORY_MAP = {
  "Q23413": "fort",
  "Q16560": "palace",
  "Q4989906": "monument",
  "Q44613": "temple",
  "Q839954": "archaeological site",
  "Q179700": "stone carving",
  "Q1785071": "stone carving"
};

const delay = ms => new Promise(res => setTimeout(res, ms));

async function fetchWikidata(districtWd) {
  const query = `
    SELECT ?item ?itemLabel ?coord ?image ?instanceOf ?instanceOfLabel WHERE {
      ?item wdt:P131* wd:${districtWd}.
      ?item wdt:P31 ?instanceOf.
      VALUES ?instanceOf { wd:Q23413 wd:Q16560 wd:Q4989906 wd:Q44613 wd:Q839954 wd:Q179700 wd:Q1785071 }
      OPTIONAL { ?item wdt:P625 ?coord. }
      OPTIONAL { ?item wdt:P18 ?image. }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    LIMIT 50
  `;
  try {
    const res = await axios.get("https://query.wikidata.org/sparql", {
      params: { query, format: 'json' },
      headers: { 'User-Agent': 'HeritageExplorerSeed/1.0' }
    });
    return res.data.results.bindings;
  } catch (err) {
    console.error(`Wikidata error for ${districtWd}:`, err.message);
    return [];
  }
}

async function fetchWikipediaSummary(qid) {
  try {
    // A more complete implementation would use Wikidata entity to get English Wikipedia article title, 
    // then fetch summary from Wikipedia REST API.
    // For brevity, mock getting summary.
    return `Historical summary for ${qid}.`;
  } catch (err) {
    return "";
  }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  // Haversine formula (approx)
  if(!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const p = 0.017453292519943295;
  const c = Math.cos;
  const a = 0.5 - c((lat2 - lat1) * p)/2 + 
          c(lat1 * p) * c(lat2 * p) * 
          (1 - c((lon2 - lon1) * p))/2;
  return 12742 * Math.asin(Math.sqrt(a)) * 1000; // in meters
}

function normalizeName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function runSeed() {
  console.log("Starting Data Pipeline...");
  
  // Use memory server if needed, or normal mongodb. We assume connection is handled, or we connect here.
  const { MongoMemoryServer } = require('mongodb-memory-server');
  const mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB at", mongoUri);

  const allRecords = [];
  
  for (const target of TARGETS) {
    console.log(`Processing: ${target.state} -> ${target.district}`);
    
    // 1. Wikidata
    const wdResults = await fetchWikidata(target.wd);
    await delay(1000); // respect rate limit
    
    for (const b of wdResults) {
      const qid = b.item.value.split('/').pop();
      const name = b.itemLabel ? b.itemLabel.value : "Unknown";
      let lat = null, lon = null;
      if (b.coord) {
        const pointMatch = b.coord.value.match(/Point\(([^ ]+) ([^)]+)\)/);
        if (pointMatch) {
          lon = parseFloat(pointMatch[1]);
          lat = parseFloat(pointMatch[2]);
        }
      }
      
      const imageUrl = b.image ? b.image.value : null;
      const instanceOfQid = b.instanceOf ? b.instanceOf.value.split('/').pop() : null;
      const category = CATEGORY_MAP[instanceOfQid] || "ambiguous";
      
      const description = await fetchWikipediaSummary(qid);

      const record = {
        siteId: qid, // primary key for this exercise
        state: target.state,
        district: target.district,
        name,
        category,
        description,
        latitude: lat,
        longitude: lon,
        image_url: imageUrl,
        image_status: imageUrl ? "valid" : "missing",
        wikidata_qid: qid,
        osm_id: null,
        category_status: category === "ambiguous" ? "ambiguous" : "valid",
        source: "wikidata"
      };
      
      allRecords.push(record);
    }
  }

  // Generate Review CSV
  const csvWriter = createObjectCsvWriter({
    path: 'review_sites.csv',
    header: [
      { id: 'state', title: 'state' },
      { id: 'district', title: 'district' },
      { id: 'name', title: 'name' },
      { id: 'category', title: 'category' },
      { id: 'wikidata_qid', title: 'wikidata_qid' },
      { id: 'osm_id', title: 'osm_id' },
      { id: 'image_url', title: 'image_url' },
      { id: 'image_status', title: 'image_status' },
      { id: 'category_status', title: 'category_status' }
    ]
  });
  
  await csvWriter.writeRecords(allRecords);
  console.log("CSV Generated: review_sites.csv");
  
  // Cache Validated Records to Database
  const validRecords = allRecords.filter(r => r.image_status === "valid" && r.category_status === "valid");
  
  for (const record of validRecords) {
    await HeritageSite.findOneAndUpdate(
      { siteId: record.siteId },
      record,
      { upsert: true, new: true }
    );
  }
  console.log(`Inserted ${validRecords.length} validated records into DB.`);
  process.exit(0);
}

runSeed();
