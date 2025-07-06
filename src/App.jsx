import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { updateUserName, fetchMe } from "./api";
import { IMaskInput } from 'react-imask';

const LAST_UPDATED = typeof __LAST_UPDATED__ !== 'undefined' ? __LAST_UPDATED__ : '';

// Helper to format relative time
function formatRelativeTime(dateString) {
  if (!dateString) return 'unknown';
  const now = new Date();
  const updated = new Date(dateString);
  const diff = Math.floor((now - updated) / 1000); // seconds
  if (isNaN(diff)) return 'unknown';
  if (diff < 60) return `${diff} second${diff !== 1 ? 's' : ''} ago`;
  if (diff < 3600) {
    const min = Math.floor(diff / 60);
    return `${min} minute${min !== 1 ? 's' : ''} ago`;
  }
  if (diff < 86400) {
    const hr = Math.floor(diff / 3600);
    return `${hr} hour${hr !== 1 ? 's' : ''} ago`;
  }
  const days = Math.floor(diff / 86400);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

// Phone number formatting utility
const formatPhoneNumber = (digits) => {
  if (!digits) return '';
  const cleaned = digits.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
  if (match) {
    const parts = [match[1], match[2], match[3]].filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return `(${parts[0]}`;
    if (parts.length === 2) return `(${parts[0]}) ${parts[1]}`;
    if (parts.length === 3) return `(${parts[0]}) ${parts[1]}-${parts[2]}`;
  }
  return digits;
};

// Phone number input using react-imask for robust masking
const PhoneInput = ({ value, onChange, placeholder = "(123) 456-7890" }) => {
  // Only allow digits in state
  const handleAccept = (val, mask) => {
    const digitsOnly = (val || '').replace(/\D/g, '');
    if (digitsOnly.length <= 10) {
      onChange(digitsOnly);
    }
  };
  return (
    <IMaskInput
      mask="(000) 000-0000"
      value={value}
      unmask={false}
      onAccept={handleAccept}
      placeholder={placeholder}
      type="tel"
      className="phone-input"
      style={{
        width: '100%',
        padding: '10px',
        color: '#000',
        background: 'transparent',
        border: '1px solid #ccc',
        borderRadius: '4px',
        fontFamily: 'inherit',
        fontSize: 'inherit',
        letterSpacing: '1px',
      }}
    />
  );
};

function App() {
  const { user, logout, loading } = useAuth();
  const [currentView, setCurrentView] = useState(user ? (user.name ? 'dashboard' : 'name') : 'login');
  const [pendingUser, setPendingUser] = useState(null);

  // Update current view when user state changes
  useEffect(() => {
    if (!loading) {
      if (user) {
        setCurrentView(user.name ? 'dashboard' : 'name');
      } else {
        setCurrentView('login');
      }
    }
  }, [user, loading]);

  const handleLoginSuccess = (userObj) => {
    if (userObj && !userObj.name) {
      setPendingUser(userObj);
      setCurrentView('name');
    } else {
      setCurrentView('dashboard');
    }
  };

  const handleNameSet = () => {
    setCurrentView('dashboard');
    setPendingUser(null);
  };

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="app-panel">
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case 'login':
        return <LoginView onLoginSuccess={handleLoginSuccess} />;
      case 'signup':
        return <SignupView onSignupSuccess={handleLoginSuccess} />;
      case 'name':
        return <NamePromptView user={pendingUser || user} onNameSet={handleNameSet} />;
      case 'dashboard':
        return <DashboardView onLogout={() => setCurrentView('login')} />;
      default:
        return <LoginView onLoginSuccess={handleLoginSuccess} />;
    }
  };

  return (
    <div className="app-panel">
      <div style={{ textAlign: 'center', fontSize: 13, color: '#888', marginBottom: 10 }}>
        Last updated: {formatRelativeTime(LAST_UPDATED)}
      </div>
      {renderContent()}
    </div>
  );
}

// Login Component
function LoginView({ onLoginSuccess }) {
  const { sendPin, verifyPin, pinSent, phone: storedPhone, rememberMe, updateRememberMe, addLogoutCallback, removeLogoutCallback } = useAuth();
  const [rawPhone, setRawPhone] = useState(storedPhone ? storedPhone.replace('+1', '') : ""); // Pre-fill with stored phone
  const [pinInput, setPinInput] = useState("");
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [rateLimitInfo, setRateLimitInfo] = useState(null);
  const [isCheckingRateLimit, setIsCheckingRateLimit] = useState(false);
  const [justLoggedOut, setJustLoggedOut] = useState(false);

  // Clear rate limit cache on logout
  const clearRateLimitCache = useCallback(() => {
    setRateLimitInfo(null);
    setIsCheckingRateLimit(false);
    setError("");
    setPhoneError("");
    setPinInput("");
    setJustLoggedOut(true);
    
    // Reset the just logged out flag after a short delay
    setTimeout(() => setJustLoggedOut(false), 1000);
  }, []);

  // Register logout callback
  useEffect(() => {
    addLogoutCallback(clearRateLimitCache);
    return () => removeLogoutCallback(clearRateLimitCache);
  }, [addLogoutCallback, removeLogoutCallback, clearRateLimitCache]);

  // Update rawPhone when storedPhone changes (e.g., on first load)
  useEffect(() => {
    if (storedPhone && !rawPhone) {
      setRawPhone(storedPhone.replace('+1', ''));
    }
  }, [storedPhone, rawPhone]);

  // Check rate limit status when phone number changes
  useEffect(() => {
    // Don't check rate limits immediately after logout
    if (justLoggedOut) {
      console.log("🚫 Skipping rate limit check - just logged out");
      return;
    }

    const checkRateLimit = async () => {
      if (rawPhone && rawPhone.length === 10) {
        console.log("🔍 Checking rate limit for:", `+1${rawPhone}`);
        setIsCheckingRateLimit(true);
        try {
          const { getRateLimitStatus } = await import('./api');
          const status = await getRateLimitStatus(`+1${rawPhone}`);
          console.log("📊 Rate limit status:", status);
          setRateLimitInfo(status);
        } catch (error) {
          console.log('Rate limit check failed:', error);
          setRateLimitInfo(null);
        } finally {
          setIsCheckingRateLimit(false);
        }
      } else {
        setRateLimitInfo(null);
      }
    };

    // Debounce the rate limit check
    const timeoutId = setTimeout(checkRateLimit, 500);
    return () => clearTimeout(timeoutId);
  }, [rawPhone, justLoggedOut]);

  const getE164Phone = () => "+1" + rawPhone;
  const isValidPhone = (digits) => digits.length === 10;

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setPhoneError("");
    console.log("🔍 handlePhoneSubmit called with rawPhone:", rawPhone);
    
    if (!isValidPhone(rawPhone)) {
      setPhoneError("Please enter a valid US phone number (10 digits).");
      return;
    }
    
    try {
      console.log("📞 Calling sendPin with:", getE164Phone());
      const result = await sendPin(getE164Phone());
      console.log("✅ sendPin result:", result);
      
      // Update rate limit info with remaining attempts
      if (result && result.remainingHourly !== undefined && result.remainingDaily !== undefined) {
        setRateLimitInfo(prev => ({
          ...prev,
          remainingHourly: result.remainingHourly,
          remainingDaily: result.remainingDaily
        }));
      }
    } catch (err) {
      console.error("❌ sendPin error:", err);
      setError(err.message);
    }
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const success = await verifyPin(pinInput);
    if (success) {
      // Get the user from localStorage (set by AuthContext)
      const userObj = JSON.parse(localStorage.getItem("authUser"));
      onLoginSuccess(userObj);
    } else {
      setError("Invalid PIN. Try again.");
    }
  };

  const handleQuickLogin = async () => {
    setError("");
    try {
      const result = await sendPin(storedPhone);
      // Update rate limit info
      if (result && result.remainingHourly !== undefined && result.remainingDaily !== undefined) {
        setRateLimitInfo(prev => ({
          ...prev,
          remainingHourly: result.remainingHourly,
          remainingDaily: result.remainingDaily
        }));
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const formatTimeRemaining = (dateString) => {
    if (!dateString) return '';
    const now = new Date();
    const blockTime = new Date(dateString);
    const diffMs = blockTime - now;
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    return diffHours > 0 ? `${diffHours} hour${diffHours !== 1 ? 's' : ''}` : 'Less than 1 hour';
  };

  return (
    <div>
      <h2>Welcome to Social Toggle</h2>
      
      {/* Rate Limit Warning */}
      {rateLimitInfo && rateLimitInfo.isBlocked && (
        <div style={{ 
          background: '#fff3cd', 
          border: '1px solid #ffeaa7', 
          padding: '15px', 
          marginBottom: '20px', 
          borderRadius: '5px' 
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>⚠️ Account Temporarily Blocked</h4>
          <p style={{ margin: '5px 0', fontSize: '14px', color: '#856404' }}>
            Your account is blocked due to too many PIN requests.
          </p>
          <p style={{ margin: '5px 0', fontSize: '14px', color: '#856404' }}>
            <strong>Block expires:</strong> {formatTimeRemaining(rateLimitInfo.blockExpiresAt)}
          </p>
        </div>
      )}

      {/* Rate Limit Info */}
      {rateLimitInfo && !rateLimitInfo.isBlocked && (
        <div style={{ 
          background: '#d1ecf1', 
          border: '1px solid #bee5eb', 
          padding: '10px', 
          marginBottom: '20px', 
          borderRadius: '5px',
          fontSize: '12px',
          color: '#0c5460'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>📊 Rate Limit Status:</span>
            {isCheckingRateLimit ? (
              <span>Checking...</span>
            ) : (
              <span>
                {rateLimitInfo.remainingHourly} hourly, {rateLimitInfo.remainingDaily} daily remaining
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Quick Login Section - Show when phone is remembered */}
      {storedPhone && rememberMe && !pinSent && (
        <div style={{ 
          background: '#e8f5e8', 
          border: '1px solid #4caf50', 
          padding: '15px', 
          marginBottom: '20px', 
          borderRadius: '5px' 
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>🚀 Quick Login</h4>
          <p style={{ margin: '5px 0', fontSize: '14px', color: '#2e7d32' }}>
            <strong>Phone:</strong> {storedPhone}
          </p>
          <button 
            onClick={handleQuickLogin}
            style={{ 
              background: '#4caf50', 
              color: 'white', 
              border: 'none', 
              padding: '8px 16px', 
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              marginTop: '8px'
            }}
          >
            Send PIN to {storedPhone.replace('+1', '')}
          </button>
          <p style={{ fontSize: "12px", color: "#666", marginTop: "8px", marginBottom: "0" }}>
            Or enter a different phone number below
          </p>
        </div>
      )}
      
      {/* Debug Section */}
      <div style={{ 
        background: '#f0f8ff', 
        border: '1px solid #ccc', 
        padding: '15px', 
        marginBottom: '20px', 
        borderRadius: '5px' 
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>🧪 Debug Mode</h4>
        <p style={{ margin: '5px 0', fontSize: '14px' }}>
          <strong>Test Phone:</strong> +12345678900
        </p>
        <p style={{ margin: '5px 0', fontSize: '14px' }}>
          <strong>Test PIN:</strong> 1234
        </p>
        <button 
          onClick={() => {
            setRawPhone("2345678900");
            setPinInput("1234");
          }}
          style={{ 
            background: '#007bff', 
            color: 'white', 
            border: 'none', 
            padding: '5px 10px', 
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Fill Test Data
        </button>
      </div>

      {!pinSent ? (
        <form onSubmit={(e) => {
          console.log("📝 Form submitted!");
          handlePhoneSubmit(e);
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '16px', marginRight: '4px' }}>+1</span>
            <PhoneInput
              value={rawPhone}
              onChange={setRawPhone}
              placeholder="(555) 123-4567"
            />
          </div>
          
          {/* Remember Me checkbox */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => updateRememberMe(e.target.checked)}
              />
              Remember my phone number
            </label>
          </div>
          
          <button 
            type="submit" 
            style={{ width: '100%', padding: '10px' }}
            disabled={rateLimitInfo && rateLimitInfo.isBlocked}
            onClick={() => console.log("🔘 Send PIN button clicked!")}
          >
            {rateLimitInfo && rateLimitInfo.isBlocked ? 'Account Blocked' : 'Send PIN'}
          </button>
          <p style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
            By clicking "Send PIN", you consent to receive text messages from Social Toggle App for authentication and notification purposes.
          </p>
          {phoneError && <p style={{ color: "red", fontSize: "13px" }}>{phoneError}</p>}
        </form>
      ) : (
        <form onSubmit={handlePinSubmit}>
          <input
            type="text"
            placeholder="Enter PIN code"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
          />
          <br />
          <button type="submit" style={{ width: '100%', padding: '10px' }}>Verify PIN</button>
        </form>
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

// Signup Component (same as login for now)
function SignupView({ onSignupSuccess }) {
  return <LoginView onLoginSuccess={onSignupSuccess} />;
}

// Dashboard Component
function DashboardView({ onLogout }) {
  const { user, rememberMe, updateRememberMe } = useAuth();
  const [available, setAvailable] = useState(false);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [addFriendError, setAddFriendError] = useState("");
  const [addFriendSuccess, setAddFriendSuccess] = useState("");
  const [availabilityStatus, setAvailabilityStatus] = useState("");

  React.useEffect(() => {
    async function loadUserAndFriends() {
      setLoading(true);
      setError("");
      try {
        const { fetchFriends } = await import('./api');
        // Fetch user info from backend using API helper
        try {
          const userData = await fetchMe();
          setAvailable(!!userData.isAvailable);
        } catch {
          setAvailable(false);
        }
        const data = await fetchFriends();
        setFriends(data);
      } catch (err) {
        setError("Failed to load friends.");
      } finally {
        setLoading(false);
      }
    }
    loadUserAndFriends();
  }, []);

  const handleToggle = async () => {
    const newAvailable = !available;
    setAvailable(newAvailable);
    setAvailabilityStatus("Updating...");
    try {
      const { updateAvailability } = await import('./api');
      await updateAvailability(user.phone, newAvailable);
      setAvailabilityStatus(newAvailable ? "You are now available!" : "You are now unavailable!");
      setTimeout(() => setAvailabilityStatus(""), 3000);
    } catch (err) {
      setError("Failed to update availability.");
      setAvailabilityStatus("Update failed!");
      setTimeout(() => setAvailabilityStatus(""), 3000);
    }
  };

  const getAddE164Phone = () => "+1" + addPhone;
  const isValidAddPhone = (digits) => digits.length === 10;

  const handleAddFriend = async (e) => {
    e.preventDefault();
    setAddFriendError("");
    setAddFriendSuccess("");
    if (!isValidAddPhone(addPhone)) {
      setAddFriendError("Please enter a valid US phone number (10 digits).");
      return;
    }
    try {
      const { addFriend, fetchFriends } = await import('./api');
      const res = await addFriend(getAddE164Phone());
      if (res.success) {
        const data = await fetchFriends();
        setFriends(data);
        setAddPhone("");
        setAddFriendSuccess(`Friend ${addPhone} added successfully!`);
        setTimeout(() => setAddFriendSuccess(""), 3000);
      } else {
        setAddFriendError("Failed to add friend.");
      }
    } catch (err) {
      setAddFriendError("Failed to add friend.");
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Dashboard</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => updateRememberMe(e.target.checked)}
            />
            Remember me
          </label>
          <button onClick={onLogout} style={{ padding: '8px 16px' }}>Logout</button>
        </div>
      </div>
      
      <div style={{ marginBottom: '30px' }}>
        <h3>Welcome, {user?.name ? user.name : user?.phone}</h3>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="checkbox"
            checked={available}
            onChange={handleToggle}
          />
          {available ? "Available" : "Unavailable"}
        </label>
        {availabilityStatus && (
          <p style={{ 
            color: availabilityStatus.includes('failed') ? 'red' : 'green', 
            fontSize: '14px', 
            marginTop: '5px' 
          }}>
            {availabilityStatus}
          </p>
        )}
      </div>

      <div>
        <h3>Friends List</h3>
        {loading ? (
          <p>Loading friends...</p>
        ) : error ? (
          <p style={{ color: "red" }}>{error}</p>
        ) : friends.length === 0 ? (
          <p style={{ color: '#888', fontStyle: 'italic', margin: '20px 0' }}>No friends found :(</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {friends.map((friend) => (
              <li key={friend.phone} style={{ 
                padding: '15px', 
                border: '1px solid #ddd', 
                marginBottom: '8px', 
                borderRadius: '6px',
                backgroundColor: '#f9f9f9',
                color: '#333',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontWeight: 'bold' }}>{friend.phone}</span>
                <span style={{ 
                  color: friend.isAvailable ? '#28a745' : '#dc3545',
                  fontWeight: 'bold'
                }}>
                  {friend.isAvailable ? "🟢 Available" : "🔴 Unavailable"}
                </span>
              </li>
            ))}
          </ul>
        )}
        
        <form onSubmit={handleAddFriend} style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '16px', marginRight: '4px' }}>+1</span>
            <PhoneInput
              value={addPhone}
              onChange={setAddPhone}
              placeholder="(555) 123-4567"
            />
          </div>
          <button type="submit" style={{ width: '100%', padding: '10px' }}>Add Friend</button>
        </form>
        {addFriendError && <p style={{ color: "red", marginTop: '10px' }}>{addFriendError}</p>}
        {addFriendSuccess && <p style={{ color: "green", marginTop: '10px' }}>{addFriendSuccess}</p>}
      </div>
    </div>
  );
}

// Name Prompt Component
function NamePromptView({ user, onNameSet }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    setLoading(true);
    try {
      await updateUserName(name.trim());
      // Update localStorage user
      const userObj = JSON.parse(localStorage.getItem("authUser"));
      userObj.name = name.trim();
      localStorage.setItem("authUser", JSON.stringify(userObj));
      onNameSet();
    } catch {
      setError("Failed to update name. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Welcome!</h2>
      <p>Please enter your name to continue:</p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
          disabled={loading}
        />
        <button type="submit" style={{ width: '100%', padding: '10px' }} disabled={loading}>
          {loading ? 'Saving...' : 'Continue'}
        </button>
      </form>
      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
    </div>
  );
}

export default App;
