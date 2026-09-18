require('dotenv').config();
const mongoose = require('mongoose');
const HeritageSite = require('./models/HeritageSite');
const sites = require('./data/heritageSites');

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
		const query = encodeURIComponent(`${record.name} ${record.city}`);
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
	let summary = await summaryFor(record.name);
	if (!summary?.originalimage?.source && !summary?.thumbnail?.source) {
		try {
			const searchResponse = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(record.name)}&format=json&origin=*`, { headers: { 'User-Agent': 'HeritageExplorer/1.0 (educational project)' } });
			const search = await searchResponse.json();
			const bestTitle = search.query?.search?.[0]?.title;
			if (bestTitle) summary = await summaryFor(bestTitle);
		} catch (error) {
			summary = null;
		}
	}
	const image = summary?.originalimage?.source || summary?.thumbnail?.source || await commonsImageFor(record);
	return image ? { ...record, image, imageUrl: image, wikipediaUrl: summary.content_urls?.desktop?.page || '' } : record;
}));

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/heritage_explorer').then(async () => {
	const enrichedSites = await enrichImages(sites);
	await HeritageSite.deleteMany({});
	await HeritageSite.insertMany(enrichedSites);
	const commonsImages = enrichedSites.filter(site => site.image.includes('wikimedia.org')).length;
	console.log(`Seeded ${enrichedSites.length} heritage sites with ${commonsImages} Wikimedia place-specific images.`);
	await mongoose.disconnect();
}).catch(error => { console.error(error); process.exit(1); });
