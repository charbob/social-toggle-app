import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import { updateUserName } from "./api";

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

function App() {
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState(user ? (user.name ? 'dashboard' : 'name') : 'login');
  const [pendingUser, setPendingUser] = useState(null);

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
  const [rawPhone, setRawPhone] = useState(""); // Only digits after +1
  const [pinInput, setPinInput] = useState("");
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const { sendPin, verifyPin, pinSent } = useAuth();

  // Format as (XXX) XXX-XXXX for display
  const formatPhone = (digits) => {
    if (!digits) return "";
    let formatted = "";
    if (digits.length > 0) formatted += "(" + digits.slice(0, 3);
    if (digits.length >= 4) formatted += ") " + digits.slice(3, 6);
    if (digits.length >= 7) formatted += "-" + digits.slice(6, 10);
    return formatted;
  };

  // Only allow digits, max 10 after +1, and prevent deleting +1
  const handlePhoneChange = (e) => {
    let value = e.target.value;
    // Remove everything except digits and format
    value = value.replace(/[^\d]/g, "");
    if (value.length > 10) value = value.slice(0, 10);
    setRawPhone(value);
  };

  const getE164Phone = () => "+1" + rawPhone;
  const isValidPhone = (digits) => digits.length === 10;

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setPhoneError("");
    if (!isValidPhone(rawPhone)) {
      setPhoneError("Please enter a valid US phone number (10 digits).");
      return;
    }
    const success = await sendPin(getE164Phone());
    if (!success) {
      setError("Failed to send PIN. Try again.");
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

  return (
    <div>
      <h2>Welcome to Social Toggle</h2>
      
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
        <form onSubmit={handlePhoneSubmit}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '16px', marginRight: '4px' }}>+1</span>
            <input
              type="tel"
              placeholder="(555) 123-4567"
              value={formatPhone(rawPhone)}
              onChange={handlePhoneChange}
              required
              style={{ width: '100%', padding: '10px' }}
              maxLength={14}
            />
          </div>
          <button type="submit" style={{ width: '100%', padding: '10px' }}>Send PIN</button>
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
  const { user } = useAuth();
  const [available, setAvailable] = useState(user?.isAvailable || false);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [addFriendError, setAddFriendError] = useState("");
  const [addFriendSuccess, setAddFriendSuccess] = useState("");
  const [availabilityStatus, setAvailabilityStatus] = useState("");

  React.useEffect(() => {
    async function loadFriends() {
      setLoading(true);
      setError("");
      try {
        const { fetchFriends, updateAvailability, addFriend } = await import('./api');
        const data = await fetchFriends();
        setFriends(data);
      } catch (err) {
        setError("Failed to load friends.");
      } finally {
        setLoading(false);
      }
    }
    loadFriends();
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

  const handleAddFriend = async (e) => {
    e.preventDefault();
    setAddFriendError("");
    setAddFriendSuccess("");
    if (!addPhone) return;
    try {
      const { addFriend, fetchFriends } = await import('./api');
      const res = await addFriend(addPhone);
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
        <button onClick={onLogout} style={{ padding: '8px 16px' }}>Logout</button>
      </div>
      
      <div style={{ marginBottom: '30px' }}>
        <h3>Welcome, {user?.phone}</h3>
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
          <input
            type="tel"
            placeholder="Friend's phone number"
            value={addPhone}
            onChange={(e) => setAddPhone(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
          />
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
