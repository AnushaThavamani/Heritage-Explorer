const Trail = require('../models/Trail');
const HeritageSite = require('../models/HeritageSite');
const own = (req, id) => req.user.id === id.toString();
const validSites = async siteIds => (await HeritageSite.countDocuments({ siteId: { $in: siteIds } })) === new Set(siteIds).size;
exports.create = async (req, res, next) => {
  try {
    if (!(await validSites(req.body.siteIds))) return res.status(400).json({ message: 'One or more selected heritage sites are invalid.' });
    res.status(201).json(await Trail.create({ userId: req.user.id, trailName: req.body.trailName, description: req.body.description || '', siteIds: req.body.siteIds }));
  } catch (error) { next(error); }
};
exports.list = async (req, res, next) => { try { res.json(await Trail.find({ userId: req.user.id }).sort({ updatedAt: -1 })); } catch (error) { next(error); } };
exports.get = async (req, res, next) => { try { const trail = await Trail.findById(req.params.id); if (!trail) return res.status(404).json({ message: 'Trail not found.' }); if (!own(req, trail.userId)) return res.status(403).json({ message: 'Access denied.' }); res.json(trail); } catch (error) { next(error); } };
exports.update = async (req, res, next) => {
  try {
    const trail = await Trail.findById(req.params.id);
    if (!trail) return res.status(404).json({ message: 'Trail not found.' });
    if (!own(req, trail.userId)) return res.status(403).json({ message: 'Access denied.' });
    if (req.body.siteIds && !(await validSites(req.body.siteIds))) return res.status(400).json({ message: 'One or more selected heritage sites are invalid.' });
    ['trailName', 'description', 'siteIds'].forEach(key => { if (req.body[key] !== undefined) trail[key] = req.body[key]; });
    res.json(await trail.save());
  } catch (error) { next(error); }
};
exports.remove = async (req, res, next) => { try { const trail = await Trail.findById(req.params.id); if (!trail) return res.status(404).json({ message: 'Trail not found.' }); if (!own(req, trail.userId)) return res.status(403).json({ message: 'Access denied.' }); await trail.deleteOne(); res.json({ message: 'Trail deleted successfully.' }); } catch (error) { next(error); } };
