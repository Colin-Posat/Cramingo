import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ParticlesBackground from "../../components/ParticlesBackground";

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Memoize particle background props to prevent re-rendering
  const particleProps = useMemo(() => ({
    particleCount: 150,
    primaryColor: "rgba(255, 255, 255, 0.5)",
    secondaryColor: "rgba(173, 216, 230, 0.5)",
    accentColor: "rgba(135, 206, 250, 0.7)",
    particleSize: { min: 2, max: 6 },
    particleSpeed: 0.1
  }), []);

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
  
      const data = await response.json();
  
      if (response.ok) {
        console.log("User credentials stored, proceeding to details page");
        
        // IMPORTANT: Ensure the username is properly stored
        const initialUserData = {
          username: username.trim(), // Make sure to trim whitespace
          email: email,
          likes: 0,
          university: '',
          fieldOfStudy: '',
          uid: data.uid || '' // If your API returns a user ID
        };
        
        console.log("Saving initial user data:", initialUserData);
        
        // Store both pendingEmail (for backward compatibility) and the user object
        localStorage.setItem("pendingEmail", email);
        localStorage.setItem("user", JSON.stringify(initialUserData));
        
        navigate("/details");
      } else {
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
    <div className="flex justify-center items-center h-screen w-screen overflow-hidden relative bg-[#004a74]">
      <ParticlesBackground {...particleProps} />
      <div className="bg-white p-12 rounded-xl shadow-xl w-[min(550px,90vw)] max-h-[90vh] overflow-y-auto text-center relative z-10 scrollbar-thin scrollbar-thumb-[#004a74] scrollbar-track-gray-100">
        <h1 className="text-[#004a74] text-[min(3.5rem,8vw)] font-bold mb-3 leading-tight">
          Welcome!
        </h1>
        
        {error && (
          <p className="text-[#e53935] text-sm my-2 p-2 bg-[rgba(229,57,53,0.1)] rounded-md w-full">
            {error}
          </p>
        )}
        
        <p className="p-2 text-gray-600 text-base">
          Already have an account? <a 
            href="/login" 
            className="text-[#004a74] font-medium hover:text-[#00659f] hover:underline transition-colors"
          >
            Sign In
          </a>
        </p>

        <form onSubmit={handleSignup} className="w-full">
          <input 
            type="email" 
            placeholder="Enter Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            aria-label="Email"
            className="w-full p-4 my-3 border border-gray-200 rounded-lg text-base focus:border-[#004a74] focus:ring-4 focus:ring-[#004a74]/10 transition-all"
          />
          <input 
            type="text" 
            placeholder="Create Username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
            aria-label="Username"
            className="w-full p-4 my-3 border border-gray-200 rounded-lg text-base focus:border-[#004a74] focus:ring-4 focus:ring-[#004a74]/10 transition-all"
          />
          <input 
            type="password" 
            placeholder="Create Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            aria-label="Password"
            className="w-full p-4 my-3 border border-gray-200 rounded-lg text-base focus:border-[#004a74] focus:ring-4 focus:ring-[#004a74]/10 transition-all"
          />
          <input 
            type="password" 
            placeholder="Confirm Password" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            required 
            aria-label="Confirm Password"
            className="w-full p-4 my-3 border border-gray-200 rounded-lg text-base focus:border-[#004a74] focus:ring-4 focus:ring-[#004a74]/10 transition-all"
          />
          <button 
            type="submit" 
            disabled={loading}
            className="mt-7 w-full p-4 bg-[#004a74] text-white text-lg font-medium rounded-lg hover:bg-[#00659f] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : "Sign Up"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Signup;