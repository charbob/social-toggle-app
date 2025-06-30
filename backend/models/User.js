const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  pin: { type: String }, // Store hashed PIN in production
  isAvailable: { type: Boolean, default: false },
  friends: [{ type: String }], // Array of phone numbers
});

module.exports = mongoose.model('User', userSchema); 