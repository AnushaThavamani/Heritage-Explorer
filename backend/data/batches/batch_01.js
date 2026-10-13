/**
 * Phase 3 — Verified Heritage Dataset Batch 01
 * 
 * Target: High-confidence baseline for previously unrepresented districts
 * Sources: Archaeological Survey of India (ASI), UNESCO World Heritage Centre,
 *          Tamil Nadu State Department of Archaeology (TNDA)
 */

const BATCH_01 = [
  {
    siteId: 'gangaikonda-cholapuram',
    name: 'Brihadisvara Temple, Gangaikonda Cholapuram',
    alternate_names: ['Gangaikonda Choleswarar Temple', 'Gangaikonda Cholapuram Temple'],
    state: 'Tamil Nadu',
    district: 'Ariyalur',
    category: 'Temples',
    categories: ['temples', 'unesco'],
    description: 'Built by Chola Emperor Rajendra I to commemorate his victorious military expedition to the Ganges River. Featuring exquisite stone sculptures and a concave vimana, it forms part of the UNESCO World Heritage site "Great Living Chola Temples".',
    historical_significance: '11th-century Chola imperial capital monument with monumental Dravidian architecture.',
    period: 'Early 11th Century (c. 1035 CE)',
    latitude: 11.2057,
    longitude: 79.4561,
    location: 'Gangaikonda Cholapuram, Ariyalur District, Tamil Nadu',
    unesco: true,
    verification_status: 'verified',
    source: 'ASI / UNESCO',
    source_urls: [
      'https://whc.unesco.org/en/list/250/',
      'https://asi.nic.in/monuments-tamil-nadu/'
    ],
    tags: ['great_living_chola_temples', 'chola_architecture', 'unesco_world_heritage', 'asi_protected']
  },
  {
    siteId: 'mahabalipuram-monuments',
    name: 'Group of Monuments at Mahabalipuram (Shore Temple & Pancha Rathas)',
    alternate_names: ['Mamallapuram Monuments', 'Seven Pagodas'],
    state: 'Tamil Nadu',
    district: 'Chengalpattu',
    category: 'Monuments',
    categories: ['monuments_memorials', 'unesco'],
    description: 'A 7th- and 8th-century Pallava coastal sanctuary featuring the Shore Temple overlooking the Bay of Bengal, monolithic rock-cut rathas (chariots), mandapas (cave sanctuaries), and the colossal relief "Descent of the Ganges".',
    historical_significance: 'Pallava dynasty port city exhibiting the transition from rock-cut to structural temple architecture.',
    period: '7th–8th Century CE (Pallava)',
    latitude: 12.6163,
    longitude: 80.1927,
    location: 'Mamallapuram, Chengalpattu District, Tamil Nadu',
    unesco: true,
    verification_status: 'verified',
    source: 'ASI / UNESCO',
    source_urls: [
      'https://whc.unesco.org/en/list/249/',
      'https://asi.nic.in/monuments-tamil-nadu/'
    ],
    tags: ['pallava_architecture', 'rock_cut', 'unesco_world_heritage', 'asi_protected']
  },
  {
    siteId: 'fort-st-george-chennai',
    name: 'Fort St. George & St. Mary\'s Church',
    alternate_names: ['White Town', 'Fort Museum Chennai'],
    state: 'Tamil Nadu',
    district: 'Chennai',
    category: 'Forts',
    categories: ['forts_palaces', 'museums_galleries'],
    description: 'The first English fortress in India, founded in 1644 on the Coromandel Coast. The complex includes St. Mary\'s Church (the oldest surviving Anglican church in India, consecrated in 1680) and the Fort Museum maintained by the Archaeological Survey of India.',
    historical_significance: 'Colonial administrative headquarters that laid the foundation for modern Chennai (Madras).',
    period: '17th Century (1644 CE)',
    latitude: 13.0797,
    longitude: 80.2872,
    location: 'Rajaji Salai, Chennai, Tamil Nadu',
    unesco: false,
    verification_status: 'verified',
    source: 'ASI Chennai Circle',
    source_urls: [
      'https://asichennaicircle.gov.in/monuments_fortstgeorge.html'
    ],
    tags: ['colonial_heritage', 'fortress', 'asi_museum', 'asi_protected']
  },
  {
    siteId: 'annamalaiyar-temple-tiruvannamalai',
    name: 'Annamalaiyar Temple (Arunachaleswarar Temple)',
    alternate_names: ['Arunachaleswara Temple', 'Tiruvannamalai Temple'],
    state: 'Tamil Nadu',
    district: 'Tiruvannamalai',
    category: 'Temples',
    categories: ['temples'],
    description: 'An expansive Hindu temple complex dedicated to Lord Shiva situated at the base of the sacred Annamalai hills. Representing the Agni (fire) element of the Pancha Bhoota Stalas, it features an Eastern gopuram soaring 66 meters with Chola, Hoysala, and Vijayanagara architectural endowments.',
    historical_significance: 'Major Saivite pilgrimage centre documented in 7th-century Tevaram literature with inscriptions from multiple dynasties.',
    period: '9th–16th Century CE',
    latitude: 12.2253,
    longitude: 79.0677,
    location: 'Tiruvannamalai, Tamil Nadu',
    unesco: false,
    verification_status: 'verified',
    source: 'Tamil Nadu HR&CE / Tourism',
    source_urls: [
      'https://arunachaleswarartemple.tnhrce.in/'
    ],
    tags: ['pancha_bhoota_stala', 'saivite_temple', 'dravidian_architecture']
  },
  {
    siteId: 'nilgiri-mountain-railway',
    name: 'Nilgiri Mountain Railway',
    alternate_names: ['Toy Train', 'NMR'],
    state: 'Tamil Nadu',
    district: 'Nilgiris',
    category: 'Heritage Settlements & Cultural Landscapes',
    categories: ['natural_cultural', 'unesco'],
    description: 'A 46-kilometre metre-gauge railway connecting Mettupalayam to Udhagamandalam (Ooty) through the Nilgiri Hills. Utilizing the Abt rack-and-pinion system on steep gradients, it is an engineering marvel recognized as part of the UNESCO World Heritage "Mountain Railways of India".',
    historical_significance: 'Historic hill railway built between 1891 and 1908 representing landmark mountain rail engineering.',
    period: 'Late 19th – Early 20th Century (1908 CE)',
    latitude: 11.3414,
    longitude: 76.7972,
    location: 'Coonoor & Udhagamandalam, The Nilgiris, Tamil Nadu',
    unesco: true,
    verification_status: 'verified',
    source: 'UNESCO World Heritage Centre / Indian Railways',
    source_urls: [
      'https://whc.unesco.org/en/list/944/'
    ],
    tags: ['unesco_world_heritage', 'mountain_railway', 'industrial_heritage']
  },
  {
    siteId: 'kottai-mariamman-salem',
    name: 'Kottai Mariamman Temple, Salem',
    alternate_names: ['Salem Fort Mariamman Temple'],
    state: 'Tamil Nadu',
    district: 'Salem',
    category: 'Temples',
    categories: ['temples'],
    description: 'An ancient temple located in the heart of old Salem fort on the northern bank of the Thirumanimutharu River. Associated with the local chieftains and Nayaks, it is the focal point of the historic annual Salem car festival.',
    historical_significance: 'Ancient religious sanctuary associated with the defensive settlement of the Salem Nayaks.',
    period: 'Medieval Nayak Era',
    latitude: 11.6538,
    longitude: 78.1582,
    location: 'Kottai, Salem, Tamil Nadu',
    unesco: false,
    verification_status: 'verified',
    source: 'Tamil Nadu State Department of Archaeology / HR&CE',
    source_urls: [
      'https://www.tnarch.gov.in/'
    ],
    tags: ['nayak_era', 'historic_shrine']
  },
  {
    siteId: 'dindigul-rock-fort',
    name: 'Dindigul Rock Fort',
    alternate_names: ['Dindigul Fort', 'Padmagiri Fort'],
    state: 'Tamil Nadu',
    district: 'Dindigul',
    category: 'Forts',
    categories: ['forts_palaces'],
    description: 'A 17th-century hill fortress constructed on a prominent 280-foot granite rock by Muthu Krishnappa Nayak of Madurai and subsequently reinforced by Chikka Deva Raya and Tipu Sultan. It features robust stone ramparts and an ancient hill-top temple.',
    historical_significance: 'Strategic military stronghold in South Tamil Nadu contested across Nayak, Maratha, and Mysore wars.',
    period: '17th–18th Century CE',
    latitude: 10.3607,
    longitude: 77.9654,
    location: 'Dindigul, Tamil Nadu',
    unesco: false,
    verification_status: 'verified',
    source: 'ASI Chennai Circle',
    source_urls: [
      'https://asichennaicircle.gov.in/monuments_dindigul.html'
    ],
    tags: ['hill_fort', 'military_architecture', 'asi_protected']
  },
  {
    siteId: 'nellaiappar-temple-tirunelveli',
    name: 'Swami Nellaiappar & Kanthimathi Ambal Temple',
    alternate_names: ['Nellaiappar Temple', 'Tirunelveli Shiva Temple'],
    state: 'Tamil Nadu',
    district: 'Tirunelveli',
    category: 'Temples',
    categories: ['temples'],
    description: 'A sprawling 14-acre temple complex dedicated to Lord Shiva and Parvati, celebrated in 7th-century Sangam-age Tevaram literature. It is renowned for its Thamira Sabha (Copper Hall of Nataraja) and exquisite musical pillars carved from single granite blocks.',
    historical_significance: 'One of the Pancha Sabhas of Nataraja with extensive Pandya and early Chola architectural additions.',
    period: '7th–16th Century CE',
    latitude: 8.7275,
    longitude: 77.6897,
    location: 'Tirunelveli Town, Tamil Nadu',
    unesco: false,
    verification_status: 'verified',
    source: 'Tamil Nadu HR&CE / TNDA',
    source_urls: [
      'https://nellaiappartemple.tnhrce.in/'
    ],
    tags: ['pancha_sabha', 'musical_pillars', 'pandya_architecture']
  }
];

module.exports = BATCH_01;
