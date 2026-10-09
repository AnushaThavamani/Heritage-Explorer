const fs = require('fs');
const google = require('googlethis');

const queries = {
  'Muthu Mandapam': 'Muthu Mandapam Vellore monument image',
  'Thenparankundram': 'Thenparankundram rock cut cave temple madurai image',
  'Brihadeeswarar Temple': 'Brihadeeswarar Temple Thanjavur image',
  'Kailasanathar Temple': 'Kailasanathar Temple Kancheepuram image',
  'Ekambareswarar Temple': 'Ekambareswarar Temple Kancheepuram image',
  'Marudamalai Temple': 'Marudamalai Temple Coimbatore image',
  'Perur Pateeswarar Temple': 'Perur Pateeswarar Temple Coimbatore image',
  'Ramalinga Vilasam Palace': 'Ramalinga Vilasam Palace Ramanathapuram image',
  'Panchalankurichi Fort': 'Kattabomman Memorial Fort Panchalankurichi image'
};

const knownUrls = {
  'Vellore Fort': 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Vellorefort.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
  'Jalakandeswarar Temple': 'https://upload.wikimedia.org/wikipedia/commons/0/07/Jalakandeswari_Temple_Vellore%2C_Tamil_Nadu.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original',
  'Government Museum, Vellore': 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Javadi_Hills.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=original'
};

async function fetchGoogleImages() {
  const sites = require('./data/tamilnadu_heritage_sites.js');

  for (let i = 0; i < sites.length; i++) {
    const site = sites[i];
    
    if (knownUrls[site.name]) {
      console.log(`Setting known URL for ${site.name}`);
      site.image = knownUrls[site.name];
      continue;
    }
    
    if (queries[site.name] || (site.image && (site.image.includes('unsplash') || site.image.includes('tripadvisor') || site.image.includes('wikipedia')))) {
      const q = queries[site.name] || `${site.name} ${site.district} Tamil Nadu heritage image`;
      try {
        console.log(`Searching Google Images for: ${q}`);
        const images = await google.image(q, { safe: false });
        if (images && images.length > 0) {
          // Find the first Wikipedia or reliable URL, or just the first URL
          let selected = images.find(img => img.url.includes('wikimedia') || img.url.includes('wikipedia'));
          if (!selected) selected = images[0];
          
          site.image = selected.url;
          console.log(`Found image for ${site.name}: ${site.image}`);
        } else {
          console.log(`No images found for ${site.name}`);
        }
      } catch (e) {
        console.error(`Error searching for ${site.name}:`, e.message);
      }
      
      // Delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  fs.writeFileSync('./data/tamilnadu_heritage_sites_updated.js', `const heritageSites = ${JSON.stringify(sites, null, 2)};\n\nmodule.exports = heritageSites;`);
  console.log('Saved to ./data/tamilnadu_heritage_sites_updated.js');
}

fetchGoogleImages();
