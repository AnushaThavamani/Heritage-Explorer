const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  mobile: { type: String, trim: true, default: '' },
  category: { type: String, trim: true, default: 'All' },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
