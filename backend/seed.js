require('dotenv').config();
const mongoose = require('mongoose');
const HeritageSite = require('./models/HeritageSite');
const sites = require('./data/heritageSites');
const imageOverrides = {
	'akbars-tomb': "https://commons.wikimedia.org/wiki/Special:Redirect/file/Akbar's_Tomb_in_Sikandra_15.jpg",
	'itmad-ud-daulah': "https://commons.wikimedia.org/wiki/Special:Redirect/file/I'timad-ud-Daulah,_Agra.jpg",
	'national-museum-delhi': 'https://commons.wikimedia.org/wiki/Special:Redirect/file/National_Museum,_New_Delhi_main_reception_hall.jpg',
	pattadakal: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Pattadakal_000.JPG',
	'thirumalai-nayakkar-palace': 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Madurai_Nayak_Palace_Collage.jpg',
};

const summaryFor = async title => {
	try {
		const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/[’]/g, "'"))}`, { headers: { 'User-Agent': 'HeritageExplorer/1.0 (educational project)' } });
		if (!response.ok) return null;
		const summary = await response.json();
		return summary;
	} catch (error) {
		return null;
	}
};

const commonsImageFor = async record => {
	try {
		const query = encodeURIComponent(`"${record.wikipediaTitle || record.name}"`);
		const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${query}&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url&iiurlwidth=1200&format=json&origin=*`;
		const response = await fetch(url, { headers: { 'User-Agent': 'HeritageExplorer/1.0 (educational project)' } });
		const data = await response.json();
		const pages = Object.values(data.query?.pages || {});
		const page = pages.find(candidate => candidate.imageinfo?.[0]?.thumburl || candidate.imageinfo?.[0]?.url);
		return page?.imageinfo?.[0]?.thumburl || page?.imageinfo?.[0]?.url || '';
	} catch (error) {
		return '';
	}
};

const enrichImages = async records => Promise.all(records.map(async record => {
	const summary = await summaryFor(record.wikipediaTitle || record.name);
	const image = imageOverrides[record.siteId] || summary?.originalimage?.source || summary?.thumbnail?.source || await commonsImageFor(record);
	return image ? { ...record, image, imageUrl: image, wikipediaUrl: summary?.content_urls?.desktop?.page || '' } : record;
}));

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/heritage_explorer').then(async () => {
	const enrichedSites = await enrichImages(sites);
	await HeritageSite.deleteMany({});
	await HeritageSite.insertMany(enrichedSites);
	const commonsImages = enrichedSites.filter(site => site.image.includes('wikimedia.org')).length;
	console.log(`Seeded ${enrichedSites.length} heritage sites with ${commonsImages} Wikimedia place-specific images.`);
	await mongoose.disconnect();
}).catch(error => { console.error(error); process.exit(1); });
