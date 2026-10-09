const fs = require('fs');

const sites = require('./data/tamilnadu_heritage_sites.js');

const updates = {
  'Muthu Mandapam': {
    name: "St. John's Church, Vellore",
    description: "One of the oldest churches in the region with significant colonial history.",
    image: "https://upload.wikimedia.org/wikipedia/commons/e/ea/St_John%27s_Church_Vellore.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original"
  },
  'Thenparankundram': {
    image: 'https://upload.wikimedia.org/wikipedia/commons/7/73/Thiruparamkundram_%281%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original'
  },
  'Vellore Fort': {
    image: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Vellorefort.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original'
  },
  'Jalakandeswarar Temple': {
    image: 'https://upload.wikimedia.org/wikipedia/commons/0/07/Jalakandeswari_Temple_Vellore%2C_Tamil_Nadu.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original'
  },
  'Government Museum, Vellore': {
    image: 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Javadi_Hills.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original'
  },
  'Brihadeeswarar Temple': {
    image: 'https://upload.wikimedia.org/wikipedia/commons/d/dd/Brihadisvara_Temple_during_Maha_Shivaratri-WUS03611_%28edit%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original'
  },
  'Kailasanathar Temple': {
    image: 'https://upload.wikimedia.org/wikipedia/commons/1/19/7th_century_Sri_Kailashnathar_Temple_Kanchipuram_Tamil_Nadu_India_01_%2811%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original'
  },
  'Ekambareswarar Temple': {
    image: 'https://upload.wikimedia.org/wikipedia/commons/0/06/Ekambareswarar5.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original'
  },
  'Marudamalai Temple': {
    image: 'https://upload.wikimedia.org/wikipedia/commons/4/46/Maruthamalai_Rajagopuram_1.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original'
  },
  'Perur Pateeswarar Temple': {
    image: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/PERUR_PATTEESHWARAR_TEMPLE.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original'
  },
  'Ramalinga Vilasam Palace': {
    image: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Thanjavur_temple.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original'
  },
  'Panchalankurichi Fort': {
    image: 'https://upload.wikimedia.org/wikipedia/commons/5/55/Veerapandiya_Kattabomman_1999_stamp_of_India.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original'
  }
};

sites.forEach(site => {
  if (updates[site.name]) {
    Object.assign(site, updates[site.name]);
  }
});

fs.writeFileSync('./data/tamilnadu_heritage_sites.js', `const heritageSites = ${JSON.stringify(sites, null, 2)};\n\nmodule.exports = heritageSites;`);
console.log('Fixed dataset images.');
