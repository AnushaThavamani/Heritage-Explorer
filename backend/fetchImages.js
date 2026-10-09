const fs = require('fs');

const sites = [
  // Madurai (7) - Already mostly working, but let's re-verify the broken ones
  { district: 'Madurai', name: 'Muthu Mandapam', search: 'Muthu Mandapam' },
  { district: 'Madurai', name: 'Thenparankundram', search: 'Thiruparankundram Murugan Temple' },

  // Vellore (3)
  { district: 'Vellore', name: 'Vellore Fort', search: 'Vellore Fort' },
  { district: 'Vellore', name: 'Jalakandeswarar Temple', search: 'Jalakandeswarar Temple, Vellore' },
  { district: 'Vellore', name: 'Government Museum, Vellore', search: 'Government Museum, Vellore' },

  // Thanjavur (3)
  { district: 'Thanjavur', name: 'Brihadeeswarar Temple', search: 'Brihadisvara Temple, Thanjavur' },
  { district: 'Thanjavur', name: 'Thanjavur Maratha Palace', search: 'Thanjavur Maratha Palace' },
  { district: 'Thanjavur', name: 'Saraswathi Mahal Library', search: 'Saraswathi Mahal Library' },

  // Kancheepuram (3)
  { district: 'Kancheepuram', name: 'Kailasanathar Temple', search: 'Kanchi Kailasanathar Temple' },
  { district: 'Kancheepuram', name: 'Ekambareswarar Temple', search: 'Ekambareswarar Temple' },
  { district: 'Kancheepuram', name: 'Varadharaja Perumal Temple', search: 'Varadharaja Perumal Temple, Kanchipuram' },

  // Coimbatore (3)
  { district: 'Coimbatore', name: 'Marudamalai Temple', search: 'Marudamalai' },
  { district: 'Coimbatore', name: 'Perur Pateeswarar Temple', search: 'Perur Pateeswarar Temple' },
  { district: 'Coimbatore', name: 'Gass Forest Museum', search: 'Gass Forest Museum' },

  // Ramanathapuram (3)
  { district: 'Ramanathapuram', name: 'Ramanathaswamy Temple', search: 'Ramanathaswamy Temple' },
  { district: 'Ramanathapuram', name: 'Ramalinga Vilasam Palace', search: 'Ramalinga Vilasam' },
  { district: 'Ramanathapuram', name: 'Uthirakosamangai Temple', search: 'Uthirakosamangai' },

  // Thoothukudi (3)
  { district: 'Thoothukudi', name: 'Adichanallur Archaeological Site', search: 'Adichanallur' },
  { district: 'Thoothukudi', name: 'Kazhugumalai (Vettuvankoil)', search: 'Vettuvan Koil' },
  { district: 'Thoothukudi', name: 'Panchalankurichi Fort', search: 'Panchalankurichi' },

  // Tiruchirappalli (3)
  { district: 'Tiruchirappalli', name: 'Rockfort Temple', search: 'Tiruchirappalli Rock Fort' },
  { district: 'Tiruchirappalli', name: 'Sri Ranganathaswamy Temple', search: 'Ranganathaswamy Temple, Srirangam' },
  { district: 'Tiruchirappalli', name: 'Jambukeswarar Temple', search: 'Jambukeswarar Temple, Thiruvanaikaval' },

  // Kanyakumari (3)
  { district: 'Kanyakumari', name: 'Vivekananda Rock Memorial', search: 'Vivekananda Rock Memorial' },
  { district: 'Kanyakumari', name: 'Thiruvalluvar Statue', search: 'Thiruvalluvar Statue' },
  { district: 'Kanyakumari', name: 'Suchindram Thanumalayan Temple', search: 'Thanumalayan Temple' },

  // Pudukkottai (3)
  { district: 'Pudukkottai', name: 'Thirumayam Fort', search: 'Thirumayam Fort' },
  { district: 'Pudukkottai', name: 'Sittannavasal Cave', search: 'Sittanavasal Cave' },
  { district: 'Pudukkottai', name: 'Narthamalai', search: 'Narthamalai' },
];

async function run() {
  const results = [];
  for (const s of sites) {
    try {
      const r = await fetch('https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=' + encodeURIComponent(s.search), {
        headers: { 'User-Agent': 'HeritageExplorer/1.0 (contact@example.com)' }
      });
      const d = await r.json();
      const pages = d.query?.pages;
      if (pages) {
        const p = Object.values(pages)[0];
        s.image_url = p.original ? p.original.source : 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=600&q=80'; // fallback
      } else {
        s.image_url = 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=600&q=80';
      }
    } catch(e) {
      s.image_url = 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=600&q=80';
    }
    console.log(s.name, s.image_url);
    results.push(s);
    await new Promise(res => setTimeout(res, 800)); // wait to avoid rate limit
  }
  fs.writeFileSync('./data/new_sites.json', JSON.stringify(results, null, 2));
}

run();
