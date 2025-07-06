const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  pin: { type: String }, // Store hashed PIN in production
  isAvailable: { type: Boolean, default: false },
  friends: [{ type: String }], // Array of phone numbers
  name: { type: String, default: '' },
  // Rate limiting fields
  pinRequests: [{
    timestamp: { type: Date, default: Date.now },
    ipAddress: String
  }],
  lastPinRequest: { type: Date },
  pinRequestCount: { type: Number, default: 0 },
  isBlocked: { type: Boolean, default: false },
  blockExpiresAt: { type: Date }
});

// Index for rate limiting queries
userSchema.index({ phone: 1, lastPinRequest: 1 });
userSchema.index({ isBlocked: 1, blockExpiresAt: 1 });

module.exports = mongoose.model('User', userSchema); 