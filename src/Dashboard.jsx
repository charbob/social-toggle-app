import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { fetchFriends, updateAvailability, addFriend } from "./api";

function Dashboard() {
  const { user, logout } = useAuth();
  const [available, setAvailable] = useState(user?.isAvailable || false);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [addFriendError, setAddFriendError] = useState("");

  useEffect(() => {
    async function loadFriends() {
      setLoading(true);
      setError("");
      try {
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
      await updateAvailability(user.phone, newAvailable);
      // Optionally, refetch friends or update UI
    } catch (err) {
      setError("Failed to update availability.");
    }
  };

  const handleAddFriend = async (e) => {
    e.preventDefault();
    setAddFriendError("");
    if (!addPhone) return;
    try {
      const res = await addFriend(addPhone);
      if (res.success) {
        // Refetch friends list after adding
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
      <h2>Welcome, {user?.phone}</h2>
      <button onClick={logout}>Logout</button>
      <div style={{ marginTop: 20 }}>
        <label>
          <input
            type="checkbox"
            checked={available}
            onChange={handleToggle}
          />
          {" "}
          {available ? "Available" : "Unavailable"}
        </label>
      </div>
      <div style={{ marginTop: 30 }}>
        <h3>Friends List</h3>
        {loading ? (
          <p>Loading friends...</p>
        ) : error ? (
          <p style={{ color: "red" }}>{error}</p>
        ) : (
          <ul>
            {friends.map((friend) => (
              <li key={friend.phone}>
                {friend.phone} - {friend.isAvailable ? "Available" : "Unavailable"}
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={handleAddFriend} style={{ marginTop: 20 }}>
          <input
            type="tel"
            placeholder="Friend's phone number"
            value={addPhone}
            onChange={(e) => setAddPhone(e.target.value)}
            required
          />
          <button type="submit" style={{ marginLeft: 10 }}>Add Friend</button>
        </form>
        {addFriendError && <p style={{ color: "red" }}>{addFriendError}</p>}
      </div>
    </div>
  );
}

export default Dashboard; 