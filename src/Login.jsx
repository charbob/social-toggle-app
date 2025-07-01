import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

function Login() {
  const [phoneInput, setPhoneInput] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
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
      navigate("/dashboard");
    } else {
      setError("Invalid PIN. Try again.");
    }
  };

  return (
    <div>
      <h2>Login</h2>
      {!pinSent ? (
        <form onSubmit={handlePhoneSubmit}>
          <input
            type="tel"
            placeholder="Phone number"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            required
          />
          <br />
          <button type="submit">Send PIN</button>
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
          />
          <br />
          <button type="submit">Verify PIN</button>
        </form>
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

export default Login; 