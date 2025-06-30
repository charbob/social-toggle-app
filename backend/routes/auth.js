const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { sendSMS } = require('../utils/sms');
const jwt = require('jsonwebtoken');

// Generate a random 4-digit PIN
function generatePin() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Request PIN (send SMS)
router.post('/request-pin', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone required' });
  let user = await User.findOne({ phone });
  const pin = generatePin();
  if (!user) {
    user = new User({ phone, pin });
  } else {
    user.pin = pin;
  }
  await user.save();
  await sendSMS(phone, `Your SocialToggleApp PIN is: ${pin}`);
  res.json({ success: true });
});

// Verify PIN
router.post('/verify-pin', async (req, res) => {
  const { phone, pin } = req.body;
  if (!phone || !pin) return res.status(400).json({ error: 'Phone and PIN required' });
  const user = await User.findOne({ phone });
  if (!user || user.pin !== pin) {
    return res.status(401).json({ error: 'Invalid PIN' });
  }
  user.pin = undefined; // Clear PIN after use
  await user.save();
  // Issue JWT
  const token = jwt.sign({ phone: user.phone }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });
  res.json({ success: true, token, user: { phone: user.phone, isAvailable: user.isAvailable, friends: user.friends } });
});

module.exports = router; 