import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { requestPin, verifyPin as apiVerifyPin, fetchMe } from "./api";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

const USER_KEY = "authUser";
const TOKEN_KEY = "authUserToken";
const PHONE_KEY = "authUserPhone";
const REMEMBER_ME_KEY = "authRememberMe";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [phone, setPhone] = useState("");
  const [pinSent, setPinSent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);

  const logout = useCallback(() => {
    setUser(null);
    setPhone("");
    setPinSent(false);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    
    // Only clear phone if remember me is disabled
    if (!rememberMe) {
      localStorage.removeItem(PHONE_KEY);
      localStorage.removeItem(REMEMBER_ME_KEY);
    }
  }, [rememberMe]);

  // Restore user from localStorage and validate token on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem(USER_KEY);
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedPhone = localStorage.getItem(PHONE_KEY);
      const storedRememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
      
      setRememberMe(storedRememberMe);
      
      if (storedUser && storedToken) {
        try {
          // Validate token by fetching user data
          const userData = await fetchMe();
          setUser(userData);
          setPhone(storedPhone || "");
          console.log("✅ Authentication restored successfully");
        } catch (error) {
          console.log("❌ Token validation failed, clearing stored auth");
          // Token is invalid, clear stored data
          logout();
        }
      } else if (storedPhone && storedRememberMe) {
        // If we have a remembered phone but no valid session, pre-fill the phone
        setPhone(storedPhone);
      }
      setLoading(false);
    };

    initializeAuth();
  }, [logout]);

  // Send PIN using backend
  const sendPin = async (phoneNumber) => {
    setPhone(phoneNumber);
    try {
      await requestPin(phoneNumber);
      setPinSent(true);
      return true;
    } catch {
      setPinSent(false);
      return false;
    }
  };

  // Verify PIN using backend
  const verifyPin = async (pin) => {
    try {
      const res = await apiVerifyPin(phone, pin);
      if (res.success && res.token) {
        setUser(res.user);
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
        localStorage.setItem(TOKEN_KEY, res.token);
        
        // Store phone number if remember me is enabled
        if (rememberMe) {
          localStorage.setItem(PHONE_KEY, phone);
          localStorage.setItem(REMEMBER_ME_KEY, 'true');
        }
        
        setPinSent(false);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const updateRememberMe = (value) => {
    setRememberMe(value);
    if (value) {
      localStorage.setItem(REMEMBER_ME_KEY, 'true');
      if (phone) {
        localStorage.setItem(PHONE_KEY, phone);
      }
    } else {
      localStorage.removeItem(REMEMBER_ME_KEY);
      localStorage.removeItem(PHONE_KEY);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      sendPin, 
      verifyPin, 
      logout, 
      phone, 
      pinSent, 
      loading,
      rememberMe,
      updateRememberMe
    }}>
      {children}
    </AuthContext.Provider>
  );
} 