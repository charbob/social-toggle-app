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
  if (!res.ok) throw new Error('Failed to request PIN');
  return await res.json();
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