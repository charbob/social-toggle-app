const express = require('express');
const router = express.Router();
const AdminUtils = require('../utils/admin');

// Simple admin authentication (in production, use proper JWT admin tokens)
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin-secret-123';

const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${ADMIN_SECRET}`) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }
  next();
};

// Get rate limiting statistics
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const stats = await AdminUtils.getRateLimitStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// Get all blocked users
router.get('/blocked-users', authenticateAdmin, async (req, res) => {
  try {
    const blockedUsers = await AdminUtils.getBlockedUsers();
    res.json(blockedUsers);
  } catch (error) {
    console.error('Error getting blocked users:', error);
    res.status(500).json({ error: 'Failed to get blocked users' });
  }
});

// Unblock a specific user
router.post('/unblock-user', authenticateAdmin, async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Phone number required' });
  }

  try {
    const result = await AdminUtils.unblockUser(phone);
    res.json(result);
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reset rate limiting for a user (for testing)
router.post('/reset-rate-limit', authenticateAdmin, async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Phone number required' });
  }

  try {
    const result = await AdminUtils.resetUserRateLimit(phone);
    res.json(result);
  } catch (error) {
    console.error('Error resetting rate limit:', error);
    res.status(500).json({ error: error.message });
  }
});

// Clean up old rate limiting data
router.post('/cleanup', authenticateAdmin, async (req, res) => {
  try {
    const result = await AdminUtils.cleanupOldData();
    res.json(result);
  } catch (error) {
    console.error('Error cleaning up data:', error);
    res.status(500).json({ error: 'Failed to cleanup data' });
  }
});

module.exports = router; 