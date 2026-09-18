const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const tokenFor = user => jwt.sign({ id: user._id.toString(), email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
const publicUser = user => ({ id: user._id, name: user.name, email: user.email });

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ message: 'An account with this email already exists.' });
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 12) });
    res.status(201).json({ token: tokenFor(user), user: publicUser(user) });
  } catch (error) { next(error); }
};

exports.login = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email.toLowerCase() });
    if (!user || !(await bcrypt.compare(req.body.password, user.password))) return res.status(401).json({ message: 'Invalid email or password.' });
    res.json({ token: tokenFor(user), user: publicUser(user) });
  } catch (error) { next(error); }
};
