const HeritageSite = require('../models/HeritageSite');
exports.list = async (req, res, next) => { try { res.json(await HeritageSite.find().sort({ name: 1 })); } catch (error) { next(error); } };
exports.get = async (req, res, next) => { try { const site = await HeritageSite.findOne({ siteId: req.params.id }); if (!site) return res.status(404).json({ message: 'Heritage site not found.' }); res.json(site); } catch (error) { next(error); } };
