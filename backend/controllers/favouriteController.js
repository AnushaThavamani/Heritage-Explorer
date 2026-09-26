const Favourite = require('../models/Favourite');
const HeritageSite = require('../models/HeritageSite');

exports.add = async (req, res, next) => {
  try {
    if (!(await HeritageSite.exists({ siteId: req.body.siteId }))) return res.status(404).json({ message: 'Heritage site not found.' });
    if (await Favourite.exists({ userId: req.user.id, siteId: req.body.siteId })) return res.status(409).json({ message: 'This site is already in your favourites.' });
    const item = await Favourite.create({ userId: req.user.id, siteId: req.body.siteId });
    res.status(201).json(item);
  } catch (error) { next(error); }
};
exports.list = async (req, res, next) => { try { res.json(await Favourite.find({ userId: req.user.id }).sort({ createdAt: -1 })); } catch (error) { next(error); } };
exports.remove = async (req, res, next) => {
  try {
    const item = await Favourite.findOneAndDelete({ userId: req.user.id, siteId: req.params.siteId });
    if (!item) return res.status(404).json({ message: 'Favourite not found.' });
    res.json({ message: 'Favourite removed successfully.' });
  } catch (error) { next(error); }
};
