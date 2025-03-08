import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Signup.css"; 
import "../styles/index.css";
import ParticlesBackground from "../components/ParticlesBackground";

const Signup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");  // ✅ Added username
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
  
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
  
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
  
    try {
      const response = await fetch("http://localhost:6500/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }), // ✅ Include username
      });
  
      const data = await response.json();
      if (response.ok) {
        console.log("User signed up:", data);
        localStorage.setItem("user", JSON.stringify(data.user)); // ✅ Store user info
        navigate("/dashboard"); // Redirect after successful signup
      } else {
        setError(data.message || "Signup failed");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("Something went wrong. Try again.");
    }
  };
  

  return (
    <div className="signup-container">
      <ParticlesBackground />
      <div className="signup-content">
        <h1>Welcome!</h1>
        {error && <p className="error-message">{error}</p>}
        <p className="already-have-account">
          Already have an account? <a href="/login">Sign In</a>
        </p>

        <form onSubmit={handleSignup}>
          <input
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Create Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)} // ✅ Added username field
            required
          />
          <input
            type="password"
            placeholder="Create Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button type="submit" className="signup-btn">Sign Up</button>
        </form>

        <img src="/images/fliply_logo.png" alt="Fliply Logo" className="signup-logo" />
      </div>
    </div>
  );
};

export default Signup;
