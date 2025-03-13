import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../../styles/login_signup/Login.css";
import "../../styles/index.css";
import ParticlesBackground from "../../components/ParticlesBackground";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Clear error when user starts typing again
  useEffect(() => {
    if (error) setError("");
  }, [email, password]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!email || !password) {
      setError("All fields are required");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("http://localhost:6500/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log("User logged in successfully:", data);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/dashboard");
      } else {
        setError(data.message || "Invalid email or password");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <ParticlesBackground />
      <div className="login-content">
        <h1 className="login-title">Welcome Back</h1>
        {error && <p className="error-message">{error}</p>}

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-label="Email"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            aria-label="Password"
          />
          <button
            type="submit"
            className="login-btn"
            disabled={loading}
          >
            {loading ? "Processing..." : "Log In"}
          </button>
        </form>
        
        <p className="forgot-password">
          <Link to="/forgot-password">Forgot Password?</Link>
        </p>
        
        <p className="signup-link">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;