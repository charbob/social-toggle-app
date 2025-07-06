const User = require('../models/User');

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  // Maximum PIN requests per hour
  MAX_REQUESTS_PER_HOUR: 5,
  // Maximum PIN requests per day
  MAX_REQUESTS_PER_DAY: 20,
  // Cooldown period between requests (in minutes)
  COOLDOWN_MINUTES: 2,
  // Block duration for violations (in hours)
  BLOCK_DURATION_HOURS: 24,
  // Clean up old requests older than this (in days)
  CLEANUP_DAYS: 7
};

class RateLimiter {
  static async checkRateLimit(phone, ipAddress) {
    try {
      let user = await User.findOne({ phone });
      
      if (!user) {
        // New user, create with initial rate limit data
        user = new User({ 
          phone, 
          pinRequests: [{ timestamp: new Date(), ipAddress }],
          lastPinRequest: new Date(),
          pinRequestCount: 1
        });
        await user.save();
        return { allowed: true, reason: 'First request' };
      }

      // Check if user is blocked
      if (user.isBlocked && user.blockExpiresAt && user.blockExpiresAt > new Date()) {
        const remainingTime = Math.ceil((user.blockExpiresAt - new Date()) / (1000 * 60 * 60));
        return { 
          allowed: false, 
          reason: `Account temporarily blocked. Try again in ${remainingTime} hours.`,
          remainingTime
        };
      }

      // Clear block if expired
      if (user.isBlocked && user.blockExpiresAt && user.blockExpiresAt <= new Date()) {
        user.isBlocked = false;
        user.blockExpiresAt = null;
      }

      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const cooldownTime = new Date(now.getTime() - RATE_LIMIT_CONFIG.COOLDOWN_MINUTES * 60 * 1000);

      // Check cooldown period
      if (user.lastPinRequest && user.lastPinRequest > cooldownTime) {
        const remainingCooldown = Math.ceil((user.lastPinRequest.getTime() + RATE_LIMIT_CONFIG.COOLDOWN_MINUTES * 60 * 1000 - now.getTime()) / (1000 * 60));
        return { 
          allowed: false, 
          reason: `Please wait ${remainingCooldown} minutes before requesting another PIN.`,
          remainingCooldown
        };
      }

      // Count recent requests
      const recentHourRequests = user.pinRequests.filter(req => req.timestamp > oneHourAgo);
      const recentDayRequests = user.pinRequests.filter(req => req.timestamp > oneDayAgo);

      // Check hourly limit
      if (recentHourRequests.length >= RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_HOUR) {
        // Block user for violating hourly limit
        user.isBlocked = true;
        user.blockExpiresAt = new Date(now.getTime() + RATE_LIMIT_CONFIG.BLOCK_DURATION_HOURS * 60 * 60 * 1000);
        await user.save();
        
        return { 
          allowed: false, 
          reason: `Too many requests. Account blocked for ${RATE_LIMIT_CONFIG.BLOCK_DURATION_HOURS} hours.`,
          blockDuration: RATE_LIMIT_CONFIG.BLOCK_DURATION_HOURS
        };
      }

      // Check daily limit
      if (recentDayRequests.length >= RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_DAY) {
        // Block user for violating daily limit
        user.isBlocked = true;
        user.blockExpiresAt = new Date(now.getTime() + RATE_LIMIT_CONFIG.BLOCK_DURATION_HOURS * 60 * 60 * 1000);
        await user.save();
        
        return { 
          allowed: false, 
          reason: `Daily limit exceeded. Account blocked for ${RATE_LIMIT_CONFIG.BLOCK_DURATION_HOURS} hours.`,
          blockDuration: RATE_LIMIT_CONFIG.BLOCK_DURATION_HOURS
        };
      }

      // Clean up old requests
      const cleanupTime = new Date(now.getTime() - RATE_LIMIT_CONFIG.CLEANUP_DAYS * 24 * 60 * 60 * 1000);
      user.pinRequests = user.pinRequests.filter(req => req.timestamp > cleanupTime);

      // Add new request
      user.pinRequests.push({ timestamp: now, ipAddress });
      user.lastPinRequest = now;
      user.pinRequestCount = (user.pinRequestCount || 0) + 1;

      await user.save();

      return { 
        allowed: true, 
        reason: 'Request allowed',
        remainingHourly: RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_HOUR - recentHourRequests.length - 1,
        remainingDaily: RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_DAY - recentDayRequests.length - 1
      };

    } catch (error) {
      console.error('Rate limit check error:', error);
      // In case of error, allow the request but log it
      return { allowed: true, reason: 'Rate limit check failed, allowing request' };
    }
  }

  static async getRateLimitStatus(phone) {
    try {
      const user = await User.findOne({ phone });
      if (!user) {
        return { 
          isBlocked: false, 
          remainingHourly: RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_HOUR,
          remainingDaily: RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_DAY
        };
      }

      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const recentHourRequests = user.pinRequests.filter(req => req.timestamp > oneHourAgo);
      const recentDayRequests = user.pinRequests.filter(req => req.timestamp > oneDayAgo);

      return {
        isBlocked: user.isBlocked && user.blockExpiresAt && user.blockExpiresAt > now,
        blockExpiresAt: user.blockExpiresAt,
        remainingHourly: Math.max(0, RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_HOUR - recentHourRequests.length),
        remainingDaily: Math.max(0, RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_DAY - recentDayRequests.length),
        lastRequest: user.lastPinRequest
      };
    } catch (error) {
      console.error('Rate limit status error:', error);
      return { isBlocked: false, remainingHourly: 0, remainingDaily: 0 };
    }
  }
}

module.exports = RateLimiter; 