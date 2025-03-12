import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/login_signup/Signup.css";
import "../../styles/index.css";
import ParticlesBackground from "../../components/ParticlesBackground";

const Signup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Clear error when user starts typing again
  useEffect(() => {
    if (error) setError("");
  }, [email, username, password, confirmPassword]);

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    
    // Form validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch("http://localhost:6500/api/auth/signup-init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
      });
      
      if (response.ok) {
        console.log("User credentials stored, proceeding to details page");
        localStorage.setItem("pendingEmail", email);
        navigate("/details");
      } else {
        const data = await response.json();
        setError(data.message || "Signup failed");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <ParticlesBackground />
      <div className="signup-content">
        <h1 className="signup-title">Welcome!</h1>
        {error && <p className="error-message">{error}</p>}
        <p className="already-have-account">
          Already have an account? <a className="sign-in-link" href="/login">Sign In</a>
        </p>
        
        <form onSubmit={handleSignup}>
          <input 
            type="email" 
            placeholder="Enter Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            aria-label="Email"
          />
          <input 
            type="text" 
            placeholder="Create Username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
            aria-label="Username"
          />
          <input 
            type="password" 
            placeholder="Create Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            aria-label="Password"
          />
          <input 
            type="password" 
            placeholder="Confirm Password" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            required 
            aria-label="Confirm Password"
          />
          <button 
            type="submit" 
            className="signup-btn" 
            disabled={loading}
          >
            {loading ? "Processing..." : "Sign Up"}
          </button>
        </form>
        
      </div>
    </div>
  );
};

export default Signup;