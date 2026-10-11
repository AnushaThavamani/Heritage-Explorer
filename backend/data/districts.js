/**
 * Canonical 38-District Catalogue of Tamil Nadu
 * 
 * Defines all 38 revenue districts with stable identifiers, official names,
 * administrative metadata, regional zones, and historical name aliases.
 */

const DISTRICTS = [
  {
    id: 'ariyalur',
    name: 'Ariyalur',
    state: 'Tamil Nadu',
    headquarters: 'Ariyalur',
    region: 'Central',
    aliases: ['ariyalur']
  },
  {
    id: 'chengalpattu',
    name: 'Chengalpattu',
    state: 'Tamil Nadu',
    headquarters: 'Chengalpattu',
    region: 'North',
    aliases: ['chengalpattu', 'chengalpet', 'chingelput']
  },
  {
    id: 'chennai',
    name: 'Chennai',
    state: 'Tamil Nadu',
    headquarters: 'Chennai',
    region: 'North',
    aliases: ['chennai', 'madras']
  },
  {
    id: 'coimbatore',
    name: 'Coimbatore',
    state: 'Tamil Nadu',
    headquarters: 'Coimbatore',
    region: 'West',
    aliases: ['coimbatore', 'kovai']
  },
  {
    id: 'cuddalore',
    name: 'Cuddalore',
    state: 'Tamil Nadu',
    headquarters: 'Cuddalore',
    region: 'Central',
    aliases: ['cuddalore']
  },
  {
    id: 'dharmapuri',
    name: 'Dharmapuri',
    state: 'Tamil Nadu',
    headquarters: 'Dharmapuri',
    region: 'West',
    aliases: ['dharmapuri']
  },
  {
    id: 'dindigul',
    name: 'Dindigul',
    state: 'Tamil Nadu',
    headquarters: 'Dindigul',
    region: 'South',
    aliases: ['dindigul', 'dindigul district']
  },
  {
    id: 'erode',
    name: 'Erode',
    state: 'Tamil Nadu',
    headquarters: 'Erode',
    region: 'West',
    aliases: ['erode']
  },
  {
    id: 'kallakurichi',
    name: 'Kallakurichi',
    state: 'Tamil Nadu',
    headquarters: 'Kallakurichi',
    region: 'Central',
    aliases: ['kallakurichi']
  },
  {
    id: 'kanchipuram',
    name: 'Kanchipuram',
    state: 'Tamil Nadu',
    headquarters: 'Kanchipuram',
    region: 'North',
    aliases: ['kanchipuram', 'kancheepuram', 'kanchi', 'conjeevaram']
  },
  {
    id: 'kanyakumari',
    name: 'Kanyakumari',
    state: 'Tamil Nadu',
    headquarters: 'Nagercoil',
    region: 'South',
    aliases: ['kanyakumari', 'kanniyakumari', 'cape comorin']
  },
  {
    id: 'karur',
    name: 'Karur',
    state: 'Tamil Nadu',
    headquarters: 'Karur',
    region: 'Central',
    aliases: ['karur']
  },
  {
    id: 'krishnagiri',
    name: 'Krishnagiri',
    state: 'Tamil Nadu',
    headquarters: 'Krishnagiri',
    region: 'West',
    aliases: ['krishnagiri']
  },
  {
    id: 'madurai',
    name: 'Madurai',
    state: 'Tamil Nadu',
    headquarters: 'Madurai',
    region: 'South',
    aliases: ['madurai']
  },
  {
    id: 'mayiladuthurai',
    name: 'Mayiladuthurai',
    state: 'Tamil Nadu',
    headquarters: 'Mayiladuthurai',
    region: 'Central',
    aliases: ['mayiladuthurai', 'mayavaram']
  },
  {
    id: 'nagapattinam',
    name: 'Nagapattinam',
    state: 'Tamil Nadu',
    headquarters: 'Nagapattinam',
    region: 'Central',
    aliases: ['nagapattinam', 'negapatam']
  },
  {
    id: 'namakkal',
    name: 'Namakkal',
    state: 'Tamil Nadu',
    headquarters: 'Namakkal',
    region: 'West',
    aliases: ['namakkal']
  },
  {
    id: 'nilgiris',
    name: 'Nilgiris',
    state: 'Tamil Nadu',
    headquarters: 'Udhagamandalam',
    region: 'West',
    aliases: ['nilgiris', 'the nilgiris', 'ooty', 'udhagamandalam']
  },
  {
    id: 'perambalur',
    name: 'Perambalur',
    state: 'Tamil Nadu',
    headquarters: 'Perambalur',
    region: 'Central',
    aliases: ['perambalur']
  },
  {
    id: 'pudukkottai',
    name: 'Pudukkottai',
    state: 'Tamil Nadu',
    headquarters: 'Pudukkottai',
    region: 'Central',
    aliases: ['pudukkottai', 'pudukottai']
  },
  {
    id: 'ramanathapuram',
    name: 'Ramanathapuram',
    state: 'Tamil Nadu',
    headquarters: 'Ramanathapuram',
    region: 'South',
    aliases: ['ramanathapuram', 'ramnad']
  },
  {
    id: 'ranipet',
    name: 'Ranipet',
    state: 'Tamil Nadu',
    headquarters: 'Ranipet',
    region: 'North',
    aliases: ['ranipet']
  },
  {
    id: 'salem',
    name: 'Salem',
    state: 'Tamil Nadu',
    headquarters: 'Salem',
    region: 'West',
    aliases: ['salem']
  },
  {
    id: 'sivaganga',
    name: 'Sivaganga',
    state: 'Tamil Nadu',
    headquarters: 'Sivaganga',
    region: 'South',
    aliases: ['sivaganga', 'sivagangai']
  },
  {
    id: 'tenkasi',
    name: 'Tenkasi',
    state: 'Tamil Nadu',
    headquarters: 'Tenkasi',
    region: 'South',
    aliases: ['tenkasi']
  },
  {
    id: 'thanjavur',
    name: 'Thanjavur',
    state: 'Tamil Nadu',
    headquarters: 'Thanjavur',
    region: 'Central',
    aliases: ['thanjavur', 'tanjore']
  },
  {
    id: 'theni',
    name: 'Theni',
    state: 'Tamil Nadu',
    headquarters: 'Theni',
    region: 'South',
    aliases: ['theni']
  },
  {
    id: 'thoothukudi',
    name: 'Thoothukudi',
    state: 'Tamil Nadu',
    headquarters: 'Thoothukudi',
    region: 'South',
    aliases: ['thoothukudi', 'tuticorin', 'thoothukudi district', 'adichanallur']
  },
  {
    id: 'tiruchirappalli',
    name: 'Tiruchirappalli',
    state: 'Tamil Nadu',
    headquarters: 'Tiruchirappalli',
    region: 'Central',
    aliases: ['tiruchirappalli', 'trichy', 'tiruchirapalli', 'tiruchi']
  },
  {
    id: 'tirunelveli',
    name: 'Tirunelveli',
    state: 'Tamil Nadu',
    headquarters: 'Tirunelveli',
    region: 'South',
    aliases: ['tirunelveli', 'nellai', 'tinnevelly']
  },
  {
    id: 'tirupathur',
    name: 'Tirupathur',
    state: 'Tamil Nadu',
    headquarters: 'Tirupathur',
    region: 'North',
    aliases: ['tirupathur', 'tirupattur']
  },
  {
    id: 'tiruppur',
    name: 'Tiruppur',
    state: 'Tamil Nadu',
    headquarters: 'Tiruppur',
    region: 'West',
    aliases: ['tiruppur', 'tirupur']
  },
  {
    id: 'tiruvallur',
    name: 'Tiruvallur',
    state: 'Tamil Nadu',
    headquarters: 'Tiruvallur',
    region: 'North',
    aliases: ['tiruvallur', 'thiruvallur']
  },
  {
    id: 'tiruvannamalai',
    name: 'Tiruvannamalai',
    state: 'Tamil Nadu',
    headquarters: 'Tiruvannamalai',
    region: 'North',
    aliases: ['tiruvannamalai', 'thiruvannamalai', 'trannamalai']
  },
  {
    id: 'tiruvarur',
    name: 'Tiruvarur',
    state: 'Tamil Nadu',
    headquarters: 'Tiruvarur',
    region: 'Central',
    aliases: ['tiruvarur', 'thiruvarur']
  },
  {
    id: 'vellore',
    name: 'Vellore',
    state: 'Tamil Nadu',
    headquarters: 'Vellore',
    region: 'North',
    aliases: ['vellore']
  },
  {
    id: 'viluppuram',
    name: 'Viluppuram',
    state: 'Tamil Nadu',
    headquarters: 'Viluppuram',
    region: 'Central',
    aliases: ['viluppuram', 'villupuram']
  },
  {
    id: 'virudhunagar',
    name: 'Virudhunagar',
    state: 'Tamil Nadu',
    headquarters: 'Virudhunagar',
    region: 'South',
    aliases: ['virudhunagar', 'kamarajar district']
  }
];

const districtById = new Map();
const districtByName = new Map();
const districtByAlias = new Map();

DISTRICTS.forEach(district => {
  districtById.set(district.id, district);
  districtByName.set(district.name.toLowerCase(), district);
  district.aliases.forEach(alias => {
    districtByAlias.set(alias.toLowerCase(), district);
  });
});

/**
 * Get a district by its canonical ID slug (e.g. 'madurai', 'kanchipuram').
 * @param {string} id
 * @returns {object|null}
 */
function getDistrictById(id) {
  if (!id || typeof id !== 'string') return null;
  return districtById.get(id.trim().toLowerCase()) || null;
}

/**
 * Resolve any district string representation (official name, alias, location string)
 * to its canonical district record.
 * 
 * Handles cases like:
 * - "Kancheepuram" -> Kanchipuram
 * - "Trichy" -> Tiruchirappalli
 * - "Adichanallur, Tamil Nadu" -> null or contextual
 * - "Kanyakumari" / "Kanniyakumari" -> Kanyakumari
 * 
 * @param {string} input
 * @returns {object|null}
 */
function resolveDistrict(input) {
  if (!input || typeof input !== 'string') return null;
  const clean = input.trim().toLowerCase();

  // 1. Direct ID match
  if (districtById.has(clean)) return districtById.get(clean);

  // 2. Direct Name match
  if (districtByName.has(clean)) return districtByName.get(clean);

  // 3. Direct Alias match
  if (districtByAlias.has(clean)) return districtByAlias.get(clean);

  // 4. Substring / compound string check (e.g. "Madurai District", "Vellore, Tamil Nadu")
  const sanitized = clean.replace(/[^a-z\s]/g, ' ');
  const words = sanitized.split(/\s+/).filter(w => w.length > 2 && w !== 'district' && w !== 'tamil' && w !== 'nadu');

  for (const word of words) {
    if (districtByAlias.has(word)) {
      return districtByAlias.get(word);
    }
  }

  return null;
}

/**
 * Return all 38 district names in alphabetical order.
 * @returns {string[]}
 */
function getAllDistrictNames() {
  return DISTRICTS.map(d => d.name).sort((a, b) => a.localeCompare(b));
}

module.exports = {
  DISTRICTS,
  getDistrictById,
  resolveDistrict,
  getAllDistrictNames
};
