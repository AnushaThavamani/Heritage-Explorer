/**
 * Canonical Heritage Category Taxonomy
 * 
 * Defines standard heritage discovery categories with stable slugs, display labels,
 * descriptions, and legacy alias mappings to ensure seamless backward compatibility.
 */

const CATEGORIES = [
  {
    id: 'temples',
    name: 'Temples & Religious Architecture',
    shortName: 'Temples',
    description: 'Ancient and historic Hindu temples, gopurams, mandapams, and rock-cut shrines.',
    legacyMatches: ['temple', 'temples', 'cave temple', 'hindu temple']
  },
  {
    id: 'caves_rock_cut',
    name: 'Caves & Rock-Cut Heritage',
    shortName: 'Caves & Rock-Cut',
    description: 'Ancient rock-cut cave shrines, bas-relief carvings, Jain stone beds, and natural caverns with rock art.',
    legacyMatches: ['caves & rock-cut heritage', 'caves & rock-cut', 'rock-cut', 'rock-cut cave', 'caves', 'cave', 'jain cave', 'rock-cut shrine']
  },
  {
    id: 'churches_mosques_shrines',
    name: 'Churches, Mosques & Religious Heritage',
    shortName: 'Religious Heritage',
    description: 'Colonial and indigenous churches, historical mosques, dargahs, and interfaith shrines.',
    legacyMatches: ['church', 'mosque', 'dargah', 'basilica', 'shrine', 'synagogue']
  },
  {
    id: 'forts_palaces',
    name: 'Forts, Palaces & Historic Buildings',
    shortName: 'Forts & Palaces',
    description: 'Medieval fortifications, royal residences, durbar halls, and royal defense structures.',
    legacyMatches: ['fort', 'forts', 'palace', 'palaces', 'granite fort', 'royal residence', 'fortification']
  },
  {
    id: 'archaeological',
    name: 'Archaeological Sites & Excavations',
    shortName: 'Archaeology',
    description: 'Prehistoric, iron-age, Sangam era, and excavated ancient settlement grounds.',
    legacyMatches: ['archaeological site', 'excavation site', 'archaeology', 'stone beds', 'burial site', 'ancient site']
  },
  {
    id: 'rock_art_inscriptions',
    name: 'Inscriptions, Rock Art & Prehistoric Sites',
    shortName: 'Rock Art & Inscriptions',
    description: 'Tamil-Brahmi rock-cut edicts, megalithic dolmens, stone carvings, and petroglyphs.',
    legacyMatches: ['stone carving', 'inscription', 'rock art', 'petroglyph', 'megalithic', 'dolmen']
  },
  {
    id: 'museums_galleries',
    name: 'Museums, Sculpture & Art',
    shortName: 'Museums',
    description: 'Government museums, memorial galleries, palm-leaf libraries, and artifact storehouses.',
    legacyMatches: ['museum', 'museums', 'library', 'gallery', 'manuscript library']
  },
  {
    id: 'monuments_memorials',
    name: 'Memorials & Historic Monuments',
    shortName: 'Monuments',
    description: 'Statues, memorial mandapams, historical milestones, and commemorative structures.',
    legacyMatches: ['monument', 'monuments', 'memorial', 'statue', 'mandapam']
  },
  {
    id: 'natural_cultural',
    name: 'Heritage Settlements & Cultural Landscapes',
    shortName: 'Cultural Landscapes',
    description: 'Traditional heritage settlements, historic canals, heritage railways, and sacred groves.',
    legacyMatches: ['natural heritage', 'biodiversity heritage', 'settlement', 'traditional settlement', 'canal']
  },
  {
    id: 'unesco',
    name: 'UNESCO World Heritage Properties',
    shortName: 'UNESCO Sites',
    description: 'Globally recognized monuments and temples designated as World Heritage.',
    legacyMatches: ['unesco', 'unesco site', 'unesco sites', 'world heritage']
  }
];

const categoryById = new Map();
const categoryByName = new Map();
const categoryByMatch = new Map();

CATEGORIES.forEach(cat => {
  categoryById.set(cat.id, cat);
  categoryByName.set(cat.name.toLowerCase(), cat);
  categoryByName.set(cat.shortName.toLowerCase(), cat);
  cat.legacyMatches.forEach(match => {
    categoryByMatch.set(match.toLowerCase(), cat);
  });
});

/**
 * Get category by canonical ID slug.
 * @param {string} id
 * @returns {object|null}
 */
function getCategoryById(id) {
  if (!id || typeof id !== 'string') return null;
  return categoryById.get(id.trim().toLowerCase()) || null;
}

/**
 * Resolve any category string (legacy, slug, plural, singular) to canonical category object.
 * @param {string} input
 * @returns {object|null}
 */
function resolveCategory(input) {
  if (!input || typeof input !== 'string') return null;
  const clean = input.trim().toLowerCase();

  // 1. Direct ID match
  if (categoryById.has(clean)) return categoryById.get(clean);

  // 2. Direct name or shortName match
  if (categoryByName.has(clean)) return categoryByName.get(clean);

  // 3. Direct legacy match
  if (categoryByMatch.has(clean)) return categoryByMatch.get(clean);

  // 4. Fuzzy / word containment match
  for (const [matchKey, cat] of categoryByMatch.entries()) {
    if (clean.includes(matchKey) || matchKey.includes(clean)) {
      return cat;
    }
  }

  return null;
}

/**
 * Normalize an input into an array of canonical category slugs.
 * Preserves secondary tags if unmapped.
 * @param {string|string[]} input
 * @returns {string[]}
 */
function normalizeCategories(input) {
  if (!input) return [];
  const rawList = Array.isArray(input) ? input : [input];
  const resolvedSlugs = new Set();

  rawList.forEach(item => {
    const resolved = resolveCategory(item);
    if (resolved) {
      resolvedSlugs.add(resolved.id);
    } else if (typeof item === 'string' && item.trim()) {
      resolvedSlugs.add(item.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'));
    }
  });

  return Array.from(resolvedSlugs);
}

module.exports = {
  CATEGORIES,
  getCategoryById,
  resolveCategory,
  normalizeCategories
};
