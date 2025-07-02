const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Middleware to check JWT
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Get user info
router.get('/me', auth, async (req, res) => {
  const user = await User.findOne({ phone: req.user.phone });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ phone: user.phone, isAvailable: user.isAvailable, friends: user.friends, name: user.name });
});

// Update availability
router.post('/availability', auth, async (req, res) => {
  const { isAvailable } = req.body;
  const user = await User.findOne({ phone: req.user.phone });
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.isAvailable = !!isAvailable;
  await user.save();
  res.json({ success: true });
});

// Add friend by phone
router.post('/add-friend', auth, async (req, res) => {
  const { friendPhone } = req.body;
  if (!friendPhone) return res.status(400).json({ error: 'Friend phone required' });
  const user = await User.findOne({ phone: req.user.phone });
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (!user.friends.includes(friendPhone)) {
    user.friends.push(friendPhone);
    await user.save();
  }
  res.json({ success: true });
});

// Get friends list with availability
router.get('/friends', auth, async (req, res) => {
  const user = await User.findOne({ phone: req.user.phone });
  if (!user) return res.status(404).json({ error: 'User not found' });
  const friends = await User.find({ phone: { $in: user.friends } });
  res.json(friends.map(f => ({ phone: f.phone, isAvailable: f.isAvailable })));
});

// Update user name
router.post('/name', auth, async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }
  const user = await User.findOne({ phone: req.user.phone });
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.name = name.trim();
  await user.save();
  res.json({ success: true, name: user.name });
});

module.exports = router; 