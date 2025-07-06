// src/api.js

const API_URL = 'https://social-toggle-app-backend.onrender.com/api';

// Temporary mock API functions until backend is deployed
// Replace with real API calls when backend is live

function getToken() {
  return localStorage.getItem('authUserToken');
}

// Real API calls to deployed backend
export async function fetchFriends() {
  const res = await fetch(`${API_URL}/users/friends`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to fetch friends');
  return await res.json();
}

export async function updateAvailability(phone, available) {
  const res = await fetch(`${API_URL}/users/availability`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ isAvailable: available }),
  });
  if (!res.ok) throw new Error('Failed to update availability');
  return await res.json();
}

export async function addFriend(phone) {
  const res = await fetch(`${API_URL}/users/add-friend`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ friendPhone: phone }),
  });
  if (!res.ok) throw new Error('Failed to add friend');
  return await res.json();
}

// Auth endpoints
export async function requestPin(phone) {
  const res = await fetch(`${API_URL}/auth/request-pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  
  const data = await res.json();
  
  if (!res.ok) {
    // Handle rate limiting specifically
    if (res.status === 429) {
      throw new Error(data.error || 'Rate limit exceeded');
    }
    throw new Error(data.error || 'Failed to request PIN');
  }
  
  return data;
}

export async function verifyPin(phone, pin) {
  const res = await fetch(`${API_URL}/auth/verify-pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, pin }),
  });
  if (!res.ok) throw new Error('Invalid PIN');
  return await res.json();
}

export async function updateUserName(name) {
  const res = await fetch(`${API_URL}/users/name`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to update name');
  return await res.json();
}

export async function fetchMe() {
  const res = await fetch(`${API_URL}/users/me`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to fetch user info');
  return await res.json();
}

// Rate limiting functions
export async function getRateLimitStatus(phone) {
  const res = await fetch(`${API_URL}/auth/rate-limit-status/${phone}`);
  if (!res.ok) throw new Error('Failed to fetch rate limit status');
  return await res.json();
} 