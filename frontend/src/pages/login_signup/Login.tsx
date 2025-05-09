import React, { useState, useCallback, useMemo, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import ParticlesBackground from "../../components/ParticlesBackground";
import { AlertCircle as AlertCircleIcon, Eye, EyeOff, Menu, X } from "lucide-react";
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { 
  GoogleAuthProvider, 
  signInWithPopup
} from "firebase/auth";
import { auth } from '../../config/firebase';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle, error: authError, loading: authLoading, isAuthenticated } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Mobile menu state

  // Redirect if already logged in
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/created-sets");
    }
  }, [isAuthenticated, navigate]);

  // Memoize particle background props to prevent unnecessary re-renders
  const particleProps = useMemo(() => ({
    particleCount: 150,
    primaryColor: "rgba(255, 255, 255, 0.5)",
    secondaryColor: "rgba(173, 216, 230, 0.5)",
    accentColor: "rgba(135, 206, 250, 0.7)",
    particleSize: { min: 2, max: 6 },
    particleSpeed: 0.1
  }), []);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(prev => !prev);
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  // Handle input changes
  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError("");
  }, [error]);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) setError("");
  }, [error]);

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setError("");
      
      // Create a Google Auth Provider
      const provider = new GoogleAuthProvider();
      
      // Optional: Set custom parameters
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      // Sign in with popup
      const result = await signInWithPopup(auth, provider);
      
      // Get the Firebase ID token
      const firebaseToken = await result.user.getIdToken();
      
      // The signed-in user info
      const user = result.user;
      
      try {
        // Use the correct endpoint from your routes: /auth/google-login
        const response = await fetch(`${API_BASE_URL}/auth/google-login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: user.email,
            token: firebaseToken
          })
        });
        
        // Handle any errors
        if (!response.ok) {
          // Try to parse as JSON, but be prepared for non-JSON responses
          try {
            const errorData = await response.json();
            
            // Check for specific error types and provide user-friendly messages
            if (errorData.message && errorData.message.includes("User not found") || 
                errorData.message && errorData.message.includes("signup process")) {
              setError("No account found with this Google email. Please sign up first or try a different account.");
              return;
            } else if (errorData.message) {
              setError(errorData.message);
              return;
            } else {
              setError("Failed to authenticate");
              return;
            }
          } catch (parseError) {
            console.error("Response parsing error:", parseError);
            setError(`Server error: ${response.status} ${response.statusText}`);
            return;
          }
        }
        
        const data = await response.json();
        
        // Store the backend JWT token
        if (data.token) {
          // Use the loginWithGoogle function from context
          await loginWithGoogle(user.email || '', data.token);
          
          // No need to navigate, the useEffect will handle this when isAuthenticated becomes true
        } else {
          throw new Error("No authentication token received from server");
        }
      } catch (backendError: any) {
        console.error("Google authentication error:", backendError);
        setError("Failed to authenticate with Google. Please try again.");
      }
    } catch (error: any) {
      console.error("Google Sign In Error:", error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        setError("Sign in was cancelled");
      } else if (error.code === 'auth/popup-blocked') {
        setError("Popup was blocked by the browser. Please allow popups for this site.");
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        setError("An account already exists with the same email address but different sign-in credentials.");
      } else {
        setError(`Sign in failed: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!email || !password) {
      setError("All fields are required");
      return;
    }

    try {
      // Use the login function from AuthContext
      await login(email, password);
      // No need to navigate - the useEffect will handle this when isAuthenticated becomes true
    } catch (err) {
      // The error handling is done in the context, but we can add additional error handling here if needed
      setError(authError || "Login failed. Please try again.");
    }
  }, [email, password, login, authError]);

  return (
    <div className="flex flex-col justify-center items-center min-h-screen w-screen overflow-hidden relative bg-gradient-to-br from-[#004a74] to-[#001f3f]">
      {/* Particle Background */}
      <ParticlesBackground {...particleProps} />
      
      {/* Fixed Navigation Header - Mobile Responsive */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 sm:px-8 py-3 sm:py-4 
                     bg-black/5 backdrop-blur-md border-b border-white/5">
        <Link to="/" className="flex items-center space-x-2 sm:space-x-3">
          <div className="flex items-center justify-center bg-gray-200 bg-opacity-10 rounded-xl h-9 w-9 sm:h-11 sm:w-12">
            <img 
              src="/images/fliply_logo.png" 
              alt="Fliply Logo" 
              className="h-7 sm:h-9 w-auto"
            />
          </div>
          <span className="text-white text-lg sm:text-xl font-medium tracking-wide hidden sm:inline"></span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden sm:flex items-center space-x-8">
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
        
        {/* Mobile Menu Button */}
        <button 
          className="sm:hidden text-white p-2"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>
      
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="sm:hidden fixed inset-0 z-40 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center animate-fadeIn">
          <button 
            className="absolute top-4 right-4 text-white p-2"
            onClick={toggleMobileMenu}
            aria-label="Close mobile menu"
          >
            <X size={24} />
          </button>
          <nav className="flex flex-col items-center space-y-6">
            <Link 
              to="/signup" 
              className="text-white/80 hover:text-white text-xl font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign Up
            </Link>
            <Link 
              to="/login" 
              className="text-white text-xl font-medium py-2 px-8 border-b-2 border-white/10"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign In
            </Link>
          </nav>
        </div>
      )}
      
      {/* Main Content - Mobile Responsive */}
      <div className="bg-white p-6 sm:p-10 rounded-xl shadow-xl w-[92%] sm:w-[min(550px,90vw)] max-h-[90vh] overflow-y-auto text-center relative z-10 scrollbar-thin scrollbar-thumb-[#004a74] scrollbar-track-gray-100 mt-16 sm:mt-20 mb-4">
        <h1 className="text-[#004a74] text-3xl sm:text-[min(3.5rem,8vw)] font-bold mb-2 sm:mb-3 leading-tight">
          Welcome Back
        </h1>
        
        {(error || authError) && (
          <p className="text-[#e53935] text-sm my-2 p-2 bg-[rgba(229,57,53,0.1)] rounded-md w-full flex items-center">
            <AlertCircleIcon className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="text-left">{error || authError}</span>
          </p>
        )}

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="w-full p-3 sm:p-4 my-4 flex items-center justify-center space-x-3 border border-gray-300 rounded-lg hover:bg-gray-50 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {googleLoading ? (
            <div className="h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
            </svg>
          )}
          <span className="text-gray-700 font-medium text-sm sm:text-base">Continue with Google</span>
        </button>

        {/* Or separator */}
        <div className="flex items-center mt-4 mb-4">
          <div className="flex-grow h-px bg-gray-200"></div>
          <span className="px-4 text-gray-400 text-xs sm:text-sm font-medium">OR</span>
          <div className="flex-grow h-px bg-gray-200"></div>
        </div>

        <form onSubmit={handleLogin} noValidate className="w-full">
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={handleEmailChange}
            required
            aria-label="Email"
            autoComplete="email"
            className="w-full p-3 sm:p-4 my-2 sm:my-3 border border-gray-200 rounded-lg text-sm sm:text-base focus:border-[#004a74] focus:ring-2 focus:ring-[#004a74]/10 transition-all"
          />
          
          {/* Password field with toggle */}
          <div className="relative my-2 sm:my-3">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={handlePasswordChange}
              required
              aria-label="Password"
              autoComplete="current-password"
              className="w-full p-3 sm:p-4 border border-gray-200 rounded-lg text-sm sm:text-base focus:border-[#004a74] focus:ring-2 focus:ring-[#004a74]/10 transition-all pr-12"
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          
          <button
            type="submit"
            disabled={authLoading}
            className="mt-4 sm:mt-5 w-full p-3 sm:p-4 bg-[#004a74] text-white text-base sm:text-lg font-medium rounded-lg hover:bg-[#00659f] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {authLoading ? "Processing..." : "Log In"}
          </button>
        </form>
        
        <p className="mt-4 text-xs sm:text-sm">
          <Link 
            to="/forgot-password" 
            className="text-[#004a74] hover:text-[#00659f] hover:underline transition-colors"
          >
            Forgot Password?
          </Link>
        </p>
        
        <p className="mt-4 sm:mt-6 text-sm sm:text-base text-gray-600">
          Don't have an account? <Link 
            to="/signup" 
            className="text-[#004a74] font-medium hover:text-[#00659f] hover:underline transition-colors"
          >
            Sign Up
          </Link>
        </p>
      </div>
      
      {/* Add CSS for animation - this will be added to document head in the component */}
      {typeof document !== 'undefined' && (() => {
        const style = document.createElement('style');
        style.innerHTML = `
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-5px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.2s ease-in-out forwards;
          }
        `;
        if (!document.head.contains(style)) {
          document.head.appendChild(style);
        }
        return null;
      })()}
    </div>
  );
};

export default Login;