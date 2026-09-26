const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const tokenFor = user => jwt.sign({ id: user._id.toString(), email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
const publicUser = user => ({ id: user._id.toString(), name: user.name, email: user.email, role: user.role, mobile: user.mobile || '', category: user.category || 'All' });

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, mobile = '', category = 'All' } = req.body;
    if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ message: 'An account with this email already exists.' });
    const user = await User.create({ name, email, mobile, category, password: await bcrypt.hash(password, 12) });
    res.status(201).json({ token: tokenFor(user), user: publicUser(user) });
  } catch (error) { next(error); }
};

exports.profile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ user: publicUser(user) });
  } catch (error) { next(error); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = ['name', 'mobile', 'category'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ message: 'Profile updated successfully.', user: publicUser(user) });
  } catch (error) { next(error); }
};

exports.login = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email.toLowerCase() });
    if (!user || !(await bcrypt.compare(req.body.password, user.password))) return res.status(401).json({ message: 'Invalid email or password.' });
    res.json({ token: tokenFor(user), user: publicUser(user) });
  } catch (error) { next(error); }
};
