const VisitedSite = require('../models/VisitedSite');
const HeritageSite = require('../models/HeritageSite');
exports.add = async (req, res, next) => {
  try {
    if (!(await HeritageSite.exists({ siteId: req.body.siteId }))) return res.status(404).json({ message: 'Heritage site not found.' });
    if (await VisitedSite.exists({ userId: req.user.id, siteId: req.body.siteId })) return res.status(409).json({ message: 'This site has already been marked as visited.' });
    const item = await VisitedSite.create({ userId: req.user.id, siteId: req.body.siteId, visitedAt: req.body.visitedAt || new Date() });
    res.status(201).json(item);
  } catch (error) { next(error); }
};
exports.list = async (req, res, next) => { try { res.json(await VisitedSite.find({ userId: req.user.id }).sort({ visitedAt: -1 })); } catch (error) { next(error); } };
exports.remove = async (req, res, next) => {
  try {
    const item = await VisitedSite.findOneAndDelete({ userId: req.user.id, siteId: req.params.siteId });
    if (!item) return res.status(404).json({ message: 'Visited site not found.' });
    res.json({ message: 'Visited status removed successfully.' });
  } catch (error) { next(error); }
};
