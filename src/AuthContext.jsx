import React, { createContext, useContext, useState, useEffect } from "react";
import { requestPin, verifyPin as apiVerifyPin } from "./api";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

const USER_KEY = "authUser";
const TOKEN_KEY = "authUserToken";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [phone, setPhone] = useState("");
  const [pinSent, setPinSent] = useState(false);

  // Restore user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

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
        setPinSent(false);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setPhone("");
    setPinSent(false);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, sendPin, verifyPin, logout, phone, pinSent }}>
      {children}
    </AuthContext.Provider>
  );
} 