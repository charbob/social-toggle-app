import React, { useState } from "react";
import { useAuth } from "./AuthContext";

function App() {
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState(user ? 'dashboard' : 'login');

  const renderContent = () => {
    switch (currentView) {
      case 'login':
        return <LoginView onLoginSuccess={() => setCurrentView('dashboard')} />;
      case 'signup':
        return <SignupView onSignupSuccess={() => setCurrentView('dashboard')} />;
      case 'dashboard':
        return <DashboardView onLogout={() => setCurrentView('login')} />;
      default:
        return <LoginView onLoginSuccess={() => setCurrentView('dashboard')} />;
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: '0 auto' }}>
      {renderContent()}
    </div>
  );
}

// Login Component
function LoginView({ onLoginSuccess }) {
  const [phoneInput, setPhoneInput] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [error, setError] = useState("");
  const { sendPin, verifyPin, pinSent } = useAuth();

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const success = await sendPin(phoneInput);
    if (!success) {
      setError("Failed to send PIN. Try again.");
    }
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const success = await verifyPin(pinInput);
    if (success) {
      onLoginSuccess();
    } else {
      setError("Invalid PIN. Try again.");
    }
  };

  return (
    <div>
      <h2>Welcome to Social Toggle</h2>
      {!pinSent ? (
        <form onSubmit={handlePhoneSubmit}>
          <input
            type="tel"
            placeholder="Phone number"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
          />
          <br />
          <button type="submit" style={{ width: '100%', padding: '10px' }}>Send PIN</button>
          <p style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
            By clicking "Send PIN", you consent to receive text messages from Social Toggle App for authentication purposes.
          </p>
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
    try {
      const { updateAvailability } = await import('./api');
      await updateAvailability(user.phone, newAvailable);
    } catch (err) {
      setError("Failed to update availability.");
    }
  };

  const handleAddFriend = async (e) => {
    e.preventDefault();
    setAddFriendError("");
    if (!addPhone) return;
    try {
      const { addFriend, fetchFriends } = await import('./api');
      const res = await addFriend(addPhone);
      if (res.success) {
        const data = await fetchFriends();
        setFriends(data);
        setAddPhone("");
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
              <li key={friend.phone} style={{ padding: '10px', border: '1px solid #ddd', marginBottom: '5px', borderRadius: '4px' }}>
                {friend.phone} - {friend.isAvailable ? "Available" : "Unavailable"}
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
        {addFriendError && <p style={{ color: "red" }}>{addFriendError}</p>}
      </div>
    </div>
  );
}

export default App;
