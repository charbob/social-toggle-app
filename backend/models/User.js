const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  pin: { type: String }, // Store hashed PIN in production
  isAvailable: { type: Boolean, default: false },
  friends: [{ type: String }], // Array of phone numbers
  name: { type: String, default: '' },
});

module.exports = mongoose.model('User', userSchema); 