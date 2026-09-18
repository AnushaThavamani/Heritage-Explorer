const QuizScore = require('../models/QuizScore');
exports.create = async (req, res, next) => { try { if (req.user.id !== req.body.userId) return res.status(403).json({ message: 'You can only save your own scores.' }); res.status(201).json(await QuizScore.create(req.body)); } catch (error) { next(error); } };
exports.list = async (req, res, next) => { try { if (req.user.id !== req.params.userId) return res.status(403).json({ message: 'Access denied.' }); res.json(await QuizScore.find({ userId: req.params.userId }).sort({ dateTaken: -1 })); } catch (error) { next(error); } };
