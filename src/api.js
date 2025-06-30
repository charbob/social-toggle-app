// src/api.js

// Temporary mock API functions until backend is deployed
// Replace with real API calls when backend is live

function getToken() {
  return localStorage.getItem('authUserToken');
}

// Mock friends data
export async function fetchFriends() {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return [
    { phone: "+1234567890", isAvailable: true },
    { phone: "+1987654321", isAvailable: false },
    { phone: "+1555123456", isAvailable: true },
  ];
}

export async function updateAvailability(phone, available) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  return { success: true };
}

export async function addFriend(phone) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  return { success: true };
}

// Mock auth functions
export async function requestPin(phone) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log(`Mock: PIN sent to ${phone}`);
  return { success: true };
}

export async function verifyPin(phone, pin) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  // Mock successful verification
  return { 
    success: true, 
    token: 'mock-jwt-token',
    user: { phone, isAvailable: false, friends: [] }
  };
} 