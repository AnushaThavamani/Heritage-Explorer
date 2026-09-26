const HeritageSite = require('../models/HeritageSite');

exports.list = async (req, res, next) => {
  try {
    const { state, district, category } = req.query;
    if (!state || !district) {
      return res.status(400).json({ message: 'State and district are required.' });
    }

    const query = { state, district };
    if (category) {
      query.category = category;
    }

    const sites = await HeritageSite.find(query).sort({ name: 1 });
    res.json(sites);
  } catch (error) {
    next(error);
  }
};

exports.explore = async (req, res, next) => {
  try {
    const { category } = req.query;
    let limit = parseInt(req.query.limit, 10);
    if (isNaN(limit) || limit < 1) limit = 10;
    
    // Support pagination cursor or just simple random for infinite scroll.
    // We'll use MongoDB's aggregation to get random sites.
    const matchStage = category ? { $match: { category } } : { $match: {} };
    
    const sites = await HeritageSite.aggregate([
      matchStage,
      { $sample: { size: limit } }
    ]);
    
    res.json(sites);
  } catch (error) {
    next(error);
  }
};

exports.get = async (req, res, next) => {
  try {
    const site = await HeritageSite.findOne({ siteId: req.params.id });
    if (!site) return res.status(404).json({ message: 'Heritage site not found.' });
    res.json(site);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const site = await HeritageSite.create(req.body);
    res.status(201).json(site);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const site = await HeritageSite.findOneAndUpdate({ siteId: req.params.id }, req.body, { new: true, runValidators: true });
    if (!site) return res.status(404).json({ message: 'Heritage site not found.' });
    res.json(site);
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const site = await HeritageSite.findOneAndDelete({ siteId: req.params.id });
    if (!site) return res.status(404).json({ message: 'Heritage site not found.' });
    res.json({ message: 'Heritage site deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
