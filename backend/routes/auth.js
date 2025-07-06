const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { sendSMS } = require('../utils/sms');
const RateLimiter = require('../utils/rateLimiter');
const jwt = require('jsonwebtoken');

// Generate a random 4-digit PIN
function generatePin() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Helper to get client IP
function getClientIP(req) {
  return req.headers['x-forwarded-for'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         'unknown';
}

// Request PIN (send SMS) with rate limiting
router.post('/request-pin', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone required' });

  // Skip rate limiting for test user
  if (phone === '+12345678900') {
    let user = await User.findOne({ phone });
    const pin = generatePin();
    if (!user) {
      user = new User({ phone, pin });
    } else {
      user.pin = pin;
    }
    await user.save();
    res.json({ success: true, message: 'Test PIN: 1234' });
    return;
  }

  try {
    const clientIP = getClientIP(req);
    
    // Check rate limits
    const rateLimitResult = await RateLimiter.checkRateLimit(phone, clientIP);
    
    if (!rateLimitResult.allowed) {
      return res.status(429).json({ 
        error: rateLimitResult.reason,
        remainingTime: rateLimitResult.remainingTime,
        blockDuration: rateLimitResult.blockDuration
      });
    }

    // Generate and send PIN
    let user = await User.findOne({ phone });
    const pin = generatePin();
    
    if (!user) {
      user = new User({ phone, pin });
    } else {
      user.pin = pin;
    }
    
    await user.save();

    // Send SMS
    try {
      await sendSMS(phone, `Your SocialToggleApp PIN is: ${pin}`);
      res.json({ 
        success: true, 
        message: 'PIN sent successfully',
        remainingHourly: rateLimitResult.remainingHourly,
        remainingDaily: rateLimitResult.remainingDaily
      });
    } catch (smsError) {
      console.error('SMS sending failed:', smsError);
      res.status(500).json({ error: 'Failed to send SMS. Please try again later.' });
    }

  } catch (error) {
    console.error('PIN request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check rate limit status
router.get('/rate-limit-status/:phone', async (req, res) => {
  const { phone } = req.params;
  if (!phone) return res.status(400).json({ error: 'Phone required' });

  try {
    const status = await RateLimiter.getRateLimitStatus(phone);
    res.json(status);
  } catch (error) {
    console.error('Rate limit status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify PIN
router.post('/verify-pin', async (req, res) => {
  const { phone, pin } = req.body;
  if (!phone || !pin) return res.status(400).json({ error: 'Phone and PIN required' });

  let user = await User.findOne({ phone });
  if (!user) {
    // Create user if not exists
    user = new User({ phone });
  }
  // Allow PIN '1234' for +12345678900, otherwise check normal PIN
  if (phone === '+12345678900' && pin === '1234') {
    // pass
  } else if (user.pin !== pin) {
    return res.status(401).json({ error: 'Invalid PIN' });
  }
  user.pin = undefined; // Clear PIN after use
  await user.save();
  // Re-fetch the user to ensure we have the latest data (including name)
  const freshUser = await User.findOne({ phone });
  const token = jwt.sign({ phone: freshUser.phone }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });
  res.json({ success: true, token, user: { phone: freshUser.phone, isAvailable: freshUser.isAvailable, friends: freshUser.friends, name: freshUser.name } });
});

module.exports = router; 