# Social Toggle App

A React-based social availability app that allows users to toggle their availability status and see their friends' availability in real-time.

## Features

### 🔐 Persistent Authentication
- **Automatic Login**: Users stay logged in between browser sessions
- **Remember Me**: Option to remember phone number for faster login
- **Token Validation**: Automatic validation of stored authentication tokens
- **Quick Login**: One-click PIN sending for remembered phone numbers

### 🛡️ Anti-Spam Protection
- **Rate Limiting**: Prevents PIN request spam with configurable limits
- **Cooldown Periods**: 2-minute cooldown between PIN requests
- **Hourly Limits**: Maximum 5 PIN requests per hour per phone number
- **Daily Limits**: Maximum 20 PIN requests per day per phone number
- **Automatic Blocking**: Accounts blocked for 24 hours when limits exceeded
- **Real-time Status**: Users see remaining attempts and block status
- **IP Tracking**: Rate limiting includes IP address tracking for security

### 📱 Phone Number Management
- **Pre-filled Forms**: Phone numbers are automatically filled when remembered
- **Secure Storage**: Phone numbers are stored locally with user consent
- **Easy Toggle**: Users can enable/disable "Remember Me" from the dashboard

### 👥 Social Features
- **Availability Toggle**: Users can mark themselves as available/unavailable
- **Friends List**: View all friends and their current availability status
- **Add Friends**: Add new friends by phone number
- **Real-time Updates**: See friends' availability changes instantly

## How Persistent Authentication Works

1. **First Login**: User enters phone number and verifies PIN
2. **Remember Me**: User can choose to remember their phone number
3. **Automatic Restoration**: On app restart, authentication is automatically restored
4. **Token Validation**: Stored tokens are validated against the backend
5. **Quick Access**: Remembered users can send new PINs without re-entering phone

## Rate Limiting Configuration

The app implements comprehensive rate limiting to prevent SMS spam:

### Limits
- **Cooldown**: 2 minutes between PIN requests
- **Hourly Limit**: 5 PIN requests per hour
- **Daily Limit**: 20 PIN requests per day
- **Block Duration**: 24 hours when limits exceeded

### User Experience
- **Real-time Feedback**: Users see remaining attempts
- **Block Notifications**: Clear messages when accounts are blocked
- **Countdown Timers**: Shows time remaining on blocks
- **Graceful Degradation**: Test accounts bypass rate limiting

## Local Storage Keys

The app uses the following localStorage keys for persistence:
- `authUser`: User object data
- `authUserToken`: Authentication token
- `authUserPhone`: Remembered phone number (if enabled)
- `authRememberMe`: Remember me preference

## Admin Features

### Rate Limiting Management
- **View Statistics**: Monitor PIN request patterns
- **Blocked Users**: List and manage blocked accounts
- **Manual Unblock**: Admin can unblock users when needed
- **Reset Limits**: Reset rate limiting for testing
- **Data Cleanup**: Automatic cleanup of old rate limiting data

### Admin API Endpoints
- `GET /api/admin/stats` - Get rate limiting statistics
- `GET /api/admin/blocked-users` - List blocked users
- `POST /api/admin/unblock-user` - Unblock a specific user
- `POST /api/admin/reset-rate-limit` - Reset rate limits for testing
- `POST /api/admin/cleanup` - Clean up old data

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Backend API

The app connects to a deployed backend at `https://social-toggle-app-backend.onrender.com/api` for:
- User authentication (PIN-based)
- Friend management
- Availability status updates
- User profile management
- Rate limiting and anti-spam protection

## Security Features

- **Token-based Authentication**: JWT tokens for secure API access
- **Automatic Token Validation**: Invalid tokens are cleared automatically
- **Consent-based Storage**: Phone numbers are only stored with explicit user consent
- **Secure Logout**: Proper cleanup of stored authentication data
- **Rate Limiting**: Comprehensive anti-spam protection
- **IP Tracking**: Additional security layer for rate limiting
- **Admin Controls**: Secure admin interface for managing rate limits
