import React, { useState, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import ParticlesBackground from "../../components/ParticlesBackground";
import { API_BASE_URL, getApiUrl } from '../../config/api';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
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

  // Memoize handler to prevent unnecessary re-renders
  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError("");
    if (success) setSuccess("");
  }, [error, success]);

  const handleResetRequest = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("Email address is required");
      return;
    }

    try {
      setLoading(true);
      
      // Using your backend API for password reset
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      // Show a success message regardless of whether the email exists or not (for security reasons)
      setSuccess("If your email is registered, you will receive reset instructions");
      setEmail(""); // Clear email field after successful request
      
    } catch (err: any) {
      console.error("Password reset request error:", err);
      
      // Generic error message that doesn't reveal if the email exists
      setError("Failed to process request. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [email]);

  return (
    <div className="flex flex-col justify-center items-center min-h-screen w-screen overflow-hidden relative bg-gradient-to-br from-[#004a74] to-[#001f3f]">
      {/* Particle Background */}
      <ParticlesBackground {...particleProps} />
      
      {/* Fixed Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-8 py-4 
                     bg-black/5 backdrop-blur-md border-b border-white/5">
        <Link to="/" className="flex items-center space-x-3">
          <img 
            src="/images/fliply_logo.png" 
            alt="Fliply Logo" 
            className="h-8 w-auto" 
          />
          <span className="text-white text-xl font-medium tracking-wide">Fliply</span>
        </Link>
        <nav className="flex items-center space-x-8">
          <Link 
            to="/signup" 
            className="text-white/80 hover:text-white transition-colors text-sm font-medium"
          >
            Sign Up
          </Link>
          <Link 
            to="/login" 
            className="text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full 
                   transition-colors text-sm font-medium border border-white/10"
          >
            Sign In
          </Link>
        </nav>
      </header>
      
      {/* Main Content with spacing for the fixed header */}
      <div className="bg-white p-12 rounded-xl shadow-xl w-[min(550px,90vw)] max-h-[90vh] overflow-y-auto text-center relative z-10 scrollbar-thin scrollbar-thumb-[#004a74] scrollbar-track-gray-100 mt-20">
        <h1 className="text-[#004a74] text-[min(3.5rem,8vw)] font-bold mb-3 leading-tight">
          Reset Password
        </h1>
        <p className="text-gray-600 mb-8">
          Enter your email address and we'll send you instructions to reset your password.
        </p>
        
        {error && (
          <p className="text-[#e53935] text-sm my-2 p-2 bg-[rgba(229,57,53,0.1)] rounded-md w-full">
            {error}
          </p>
        )}

        {success && (
          <p className="text-green-600 text-sm my-2 p-2 bg-green-50 rounded-md w-full">
            {success}
          </p>
        )}

        <form onSubmit={handleResetRequest} noValidate className="w-full">
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
          <button
            type="submit"
            disabled={loading}
            className="mt-7 w-full p-4 bg-[#004a74] text-white text-lg font-medium rounded-lg hover:bg-[#00659f] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : "Send Reset Instructions"}
          </button>
        </form>
        
        <p className="mt-8 text-base text-gray-600">
          Remember your password? <Link 
            to="/login" 
            className="text-[#004a74] font-medium hover:text-[#00659f] hover:underline transition-colors"
          >
            Sign In
          </Link>
        </p>
        
        <p className="mt-4 text-base text-gray-600">
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

export default ForgotPassword;