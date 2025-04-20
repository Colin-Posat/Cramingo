import React, { useState, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import ParticlesBackground from "../../components/ParticlesBackground";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // Memoize particle background props to prevent unnecessary re-renders
  const particleProps = useMemo(() => ({
    particleCount: 150,
    primaryColor: "rgba(255, 255, 255, 0.5)",
    secondaryColor: "rgba(173, 216, 230, 0.5)",
    accentColor: "rgba(135, 206, 250, 0.7)",
    particleSize: { min: 2, max: 6 },
    particleSpeed: 0.1
  }), []);

  // Memoize handlers to prevent unnecessary re-renders
  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError("");
  }, [error]);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) setError("");
  }, [error]);

  const handleLogin = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!email || !password) {
      setError("All fields are required");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("https://fliply-backend.onrender.com/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/created-sets");;
      } else {
        setError(data.message || "Login failed. Please try again.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [email, password, navigate]);

  return (
    <div className="flex justify-center items-center h-screen w-screen overflow-hidden relative bg-[#004a74]">
      <ParticlesBackground {...particleProps} />
      <div className="bg-white p-12 rounded-xl shadow-xl w-[min(550px,90vw)] max-h-[90vh] overflow-y-auto text-center relative z-10 scrollbar-thin scrollbar-thumb-[#004a74] scrollbar-track-gray-100">
        <h1 className="text-[#004a74] text-[min(3.5rem,8vw)] font-bold mb-3 leading-tight">
          Welcome Back
        </h1>
        
        {error && (
          <p className="text-[#e53935] text-sm my-2 p-2 bg-[rgba(229,57,53,0.1)] rounded-md w-full">
            {error}
          </p>
        )}

        <form onSubmit={handleLogin} noValidate className="w-full">
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={handleEmailChange}
            required
            aria-label="Email"
            autoComplete="email"
            className="w-full p-4 my-3 border border-gray-200 rounded-lg text-base focus:border-[#004a74] focus:ring-4 focus:ring-[#004a74]/10 transition-all"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={handlePasswordChange}
            required
            aria-label="Password"
            autoComplete="current-password"
            className="w-full p-4 my-3 border border-gray-200 rounded-lg text-base focus:border-[#004a74] focus:ring-4 focus:ring-[#004a74]/10 transition-all"
          />
          <button
            type="submit"
            disabled={loading}
            className="mt-7 w-full p-4 bg-[#004a74] text-white text-lg font-medium rounded-lg hover:bg-[#00659f] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : "Log In"}
          </button>
        </form>
        
        <p className="mt-4 text-sm">
          <Link 
            to="/forgot-password" 
            className="text-[#004a74] hover:text-[#00659f] hover:underline transition-colors"
          >
            Forgot Password?
          </Link>
        </p>
        
        <p className="mt-6 text-base text-gray-600">
          Don't have an account? <Link 
            to="/signup" 
            className="text-[#004a74] font-medium hover:text-[#00659f] hover:underline transition-colors"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;