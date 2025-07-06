const User = require('../models/User');

class AdminUtils {
  // Get all blocked users
  static async getBlockedUsers() {
    try {
      const now = new Date();
      const blockedUsers = await User.find({
        isBlocked: true,
        blockExpiresAt: { $gt: now }
      }).select('phone isBlocked blockExpiresAt pinRequestCount lastPinRequest');
      
      return blockedUsers.map(user => ({
        phone: user.phone,
        isBlocked: user.isBlocked,
        blockExpiresAt: user.blockExpiresAt,
        pinRequestCount: user.pinRequestCount,
        lastPinRequest: user.lastPinRequest,
        remainingBlockTime: Math.ceil((user.blockExpiresAt - now) / (1000 * 60 * 60))
      }));
    } catch (error) {
      console.error('Error getting blocked users:', error);
      throw error;
    }
  }

  // Unblock a specific user
  static async unblockUser(phone) {
    try {
      const user = await User.findOne({ phone });
      if (!user) {
        throw new Error('User not found');
      }
      
      user.isBlocked = false;
      user.blockExpiresAt = null;
      await user.save();
      
      return { success: true, message: `User ${phone} unblocked successfully` };
    } catch (error) {
      console.error('Error unblocking user:', error);
      throw error;
    }
  }

  // Reset rate limiting for a user (for testing)
  static async resetUserRateLimit(phone) {
    try {
      const user = await User.findOne({ phone });
      if (!user) {
        throw new Error('User not found');
      }
      
      user.pinRequests = [];
      user.lastPinRequest = null;
      user.pinRequestCount = 0;
      user.isBlocked = false;
      user.blockExpiresAt = null;
      await user.save();
      
      return { success: true, message: `Rate limit reset for ${phone}` };
    } catch (error) {
      console.error('Error resetting rate limit:', error);
      throw error;
    }
  }

  // Get rate limiting statistics
  static async getRateLimitStats() {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const totalUsers = await User.countDocuments();
      const blockedUsers = await User.countDocuments({
        isBlocked: true,
        blockExpiresAt: { $gt: now }
      });
      
      const recentRequests = await User.aggregate([
        {
          $unwind: '$pinRequests'
        },
        {
          $match: {
            'pinRequests.timestamp': { $gt: oneDayAgo }
          }
        },
        {
          $group: {
            _id: null,
            totalRequests: { $sum: 1 },
            uniqueUsers: { $addToSet: '$phone' }
          }
        }
      ]);
      
      const hourlyRequests = await User.aggregate([
        {
          $unwind: '$pinRequests'
        },
        {
          $match: {
            'pinRequests.timestamp': { $gt: oneHourAgo }
          }
        },
        {
          $group: {
            _id: null,
            totalRequests: { $sum: 1 },
            uniqueUsers: { $addToSet: '$phone' }
          }
        }
      ]);
      
      return {
        totalUsers,
        blockedUsers,
        dailyRequests: recentRequests[0]?.totalRequests || 0,
        dailyUniqueUsers: recentRequests[0]?.uniqueUsers?.length || 0,
        hourlyRequests: hourlyRequests[0]?.totalRequests || 0,
        hourlyUniqueUsers: hourlyRequests[0]?.uniqueUsers?.length || 0
      };
    } catch (error) {
      console.error('Error getting rate limit stats:', error);
      throw error;
    }
  }

  // Clean up old rate limiting data
  static async cleanupOldData() {
    try {
      const cleanupTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      
      const result = await User.updateMany(
        {},
        {
          $pull: {
            pinRequests: {
              timestamp: { $lt: cleanupTime }
            }
          }
        }
      );
      
      return {
        success: true,
        message: `Cleaned up old rate limiting data`,
        modifiedCount: result.modifiedCount
      };
    } catch (error) {
      console.error('Error cleaning up old data:', error);
      throw error;
    }
  }
}

module.exports = AdminUtils; 