import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import ParticlesBackground from "../../components/ParticlesBackground";
import { AlertCircle as AlertCircleIcon, Eye, EyeOff, CheckCircle } from "lucide-react";
import { API_BASE_URL, getApiUrl } from '../../config/api'; // Adjust path as needed

const CombinedSignup: React.FC = () => {
  const navigate = useNavigate();
  
  // Basic user information
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Additional details
  const [university, setUniversity] = useState("");
  
  // UI state
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Username validation state
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  const usernameTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // University autocomplete states
  const [autocompleteResults, setAutocompleteResults] = useState<string[]>([]);
  const [allUniversities, setAllUniversities] = useState<string[]>([]);
  const [isLoadingUniversities, setIsLoadingUniversities] = useState<boolean>(true);
  const autocompleteRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Memoize particle background props to prevent re-rendering
  const particleProps = useMemo(() => ({
    particleCount: 150,
    primaryColor: "rgba(255, 255, 255, 0.5)",
    secondaryColor: "rgba(173, 216, 230, 0.5)",
    accentColor: "rgba(135, 206, 250, 0.7)",
    particleSize: { min: 2, max: 6 },
    particleSpeed: 0.1
  }), []);

  // Load universities from CSV
  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        setIsLoadingUniversities(true);
        
        // Fetch the CSV file
        const response = await fetch('/data/schools.csv'); 
        const text = await response.text();
        
        // Parse CSV - simple split by new line
        const universities = text.split('\n')
          .map(school => school.trim())
          .filter(school => 
            school.length > 0 && 
            !school.includes('<!doctype') && 
            !school.includes('<script') &&
            !school.includes('import')
          );
        
        console.log('✅ Loaded universities:', universities);
        setAllUniversities(universities);
        setIsLoadingUniversities(false);
      } catch (error) {
        console.error('❌ Error loading universities:', error);
        setIsLoadingUniversities(false);
      }
    };

    fetchUniversities();
  }, []);

  // Check if username is available
  const checkUsername = useCallback(async (usernameToCheck: string) => {
    if (!usernameToCheck || usernameToCheck.length < 3) {
      setUsernameAvailable(false);
      setUsernameError(usernameToCheck ? "Username must be at least 3 characters" : "");
      return;
    }
    
    try {
      setIsCheckingUsername(true);
      setUsernameError("");
      
      const response = await fetch(`${API_BASE_URL}/auth/check-username`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameToCheck }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        if (data.available) {
          setUsernameAvailable(true);
          setUsernameError("");
        } else {
          setUsernameAvailable(false);
          setUsernameError("Username already taken");
        }
      } else {
        console.error("Error checking username:", data);
        setUsernameError("Error checking username availability");
        setUsernameAvailable(false);
      }
    } catch (err) {
      console.error("Username check error:", err);
      setUsernameError("Connection error. Please try again.");
      setUsernameAvailable(false);
    } finally {
      setIsCheckingUsername(false);
    }
  }, []);

  // Debounced username check
  useEffect(() => {
    // Clear the error when user starts typing
    if (error) setError("");
    
    // Clear any existing timeout
    if (usernameTimeoutRef.current) {
      clearTimeout(usernameTimeoutRef.current);
    }
    
    // Reset username availability when editing
    if (username) {
      setUsernameAvailable(false);
      setUsernameError("");
    }
    
    // Set a new timeout for the username check (500ms debounce)
    if (username.trim().length >= 3) {
      usernameTimeoutRef.current = setTimeout(() => {
        checkUsername(username.trim());
      }, 500);
    }
    
    return () => {
      if (usernameTimeoutRef.current) {
        clearTimeout(usernameTimeoutRef.current);
      }
    };
  }, [username, checkUsername]);

  // Clear general error when user starts typing again
  useEffect(() => {
    if (error) setError("");
  }, [email, password, university]);

  // Filter universities - only show matches that START WITH or INCLUDE the input
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUniversity(value);
    setError("");
    
    if (value.length > 0) {
      // Filter universities that START WITH or INCLUDE the input value
      const filteredResults = allUniversities
        .filter(school => 
          school.toLowerCase().startsWith(value.toLowerCase()) || 
          school.toLowerCase().includes(value.toLowerCase())
        )
        .slice(0, 5); // Limit to 5 results
      
      setAutocompleteResults(filteredResults);
    } else {
      setAutocompleteResults([]);
    }
  }, [allUniversities]);

  // Handle username input
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow alphanumeric and underscore
    const sanitizedValue = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
    setUsername(sanitizedValue);
  };

  // Handle autocomplete item selection
  const handleAutocompleteSelect = useCallback((school: string) => {
    setUniversity(school);
    setAutocompleteResults([]);
    setError("");
  }, []);

  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        autocompleteRef.current && 
        !autocompleteRef.current.contains(event.target as Node) &&
        inputRef.current !== event.target
      ) {
        setAutocompleteResults([]);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Handle input blur - validate university input
  const handleBlur = useCallback(() => {
    // Small timeout to allow click on autocomplete item to register first
    setTimeout(() => {
      if (university.trim() !== '' && !allUniversities.some(school => 
        school.toLowerCase() === university.trim().toLowerCase()
      )) {
        setError('Please select a valid university from the list');
        // Don't clear right away
        setTimeout(() => {
          setUniversity('');
          // Clear error message after a delay
          setTimeout(() => {
            setError('');
          }, 3000);
        }, 1500);
      }
    }, 100);
  }, [university, allUniversities]);

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    // Form validation
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (!username.trim() || username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    
    // Check if username is available
    if (!usernameAvailable && !isCheckingUsername) {
      // Perform one final check for the username
      await checkUsername(username);
      if (!usernameAvailable) {
        setError(usernameError || "Username unavailable");
        return;
      }
    }

    // Validate university selection
    if (university.trim() === '') {
      setError("Please enter your university");
      return;
    }

    // Check if the university is valid (case-insensitive)
    const isValidUniversity = allUniversities.some(school => 
      school.toLowerCase() === university.trim().toLowerCase()
    );
    
    if (!isValidUniversity) {
      setError("Please select a valid university from the list");
      return;
    }
  
    try {
      setLoading(true);
      
      // First call signup-init endpoint
      const initResponse = await fetch(`${API_BASE_URL}/auth/signup-init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
      });
  
      const initData = await initResponse.json();
  
      if (!initResponse.ok) {
        // Handle specific error cases
        if (initData.code === "USERNAME_TAKEN") {
          setUsernameAvailable(false);
          setError("Username already taken");
          return;
        }
        
        setError(initData.message || "Signup failed");
        setLoading(false);
        return;
      }
      
      console.log("User credentials stored, proceeding to completion");
      
      // Then immediately call complete-signup endpoint
      const completeResponse = await fetch(`${API_BASE_URL}/auth/complete-signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          university, 
          fieldOfStudy: "" // Empty string as we removed this field
        }),
      });

      const completeData = await completeResponse.json();
      
      if (completeResponse.ok) {
        console.log("User signed up successfully:", completeData);
        
        // Save user data to localStorage
        localStorage.setItem("user", JSON.stringify(completeData.user));
        
        // Navigate to created-sets page
        navigate("/created-sets");
      } else {
        setError(completeData.message || "Signup completion failed");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col justify-center items-center min-h-screen w-screen overflow-hidden relative bg-gradient-to-br from-[#004a74] to-[#001f3f]">
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
            className="text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full 
                   transition-colors text-sm font-medium border border-white/10"
          >
            Sign Up
          </Link>
          <Link 
            to="/login" 
            className="text-white/80 hover:text-white transition-colors text-sm font-medium"
          >
            Sign In
          </Link>
        </nav>
      </header>
      
      {/* Main Content with spacing for the fixed header */}
      <div className="bg-white p-12 rounded-xl shadow-xl w-[min(550px,90vw)] max-h-[90vh] overflow-y-auto text-center relative z-10 scrollbar-thin scrollbar-thumb-[#004a74] scrollbar-track-gray-100 mt-20">
        <h1 className="text-[#004a74] text-[min(3.5rem,8vw)] font-bold mb-3 leading-tight">
        Welcome!
        </h1>
        
        {error && (
          <p className="text-[#e53935] text-sm my-2 p-2 bg-[rgba(229,57,53,0.1)] rounded-md w-full flex items-center">
            <AlertCircleIcon className="w-4 h-4 mr-2 flex-shrink-0" />
            {error}
          </p>
        )}
        
        <p className="mt-2 mb-4 text-base text-gray-600">
          Already have an account? <Link 
            to="/login" 
            className="text-[#004a74] font-medium hover:text-[#00659f] hover:underline transition-colors"
          >
            Sign In
          </Link>
        </p>

        <form onSubmit={handleSignup} className="w-full">
          <div className="mb-4">
            <input 
              type="email" 
              placeholder="Enter Email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              aria-label="Email"
              autoComplete="email"
              className="w-full p-4 my-3 border border-gray-200 rounded-lg text-base focus:border-[#004a74] focus:ring-4 focus:ring-[#004a74]/10 transition-all"
            />
            
            {/* Username field with validation status */}
            <div className="relative my-3">
              <input 
                type="text" 
                placeholder="Create Username" 
                value={username} 
                onChange={handleUsernameChange}
                required 
                aria-label="Username"
                className={`w-full p-4 border ${usernameError ? 'border-[#e53935]' : usernameAvailable && username.length >= 3 ? 'border-green-500' : 'border-gray-200'} 
                          rounded-lg text-base focus:border-[#004a74] focus:ring-4 focus:ring-[#004a74]/10 transition-all pr-12`}
              />
              
              {/* Username validation indicator */}
              {username.length >= 3 && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  {isCheckingUsername ? (
                    <div className="h-5 w-5 border-2 border-[#004a74] border-t-transparent rounded-full animate-spin"></div>
                  ) : usernameAvailable ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircleIcon className="h-5 w-5 text-[#e53935]" />
                  )}
                </div>
              )}
            </div>
            
            {/* Username validation message */}
            {usernameError && (
              <p className="text-[#e53935] text-xs mt-1 ml-1 text-left">
                {usernameError}
              </p>
            )}
            
            {/* Username available message */}
            {usernameAvailable && username.length >= 3 && (
              <p className="text-green-500 text-xs mt-1 ml-1 text-left">
                Username available
              </p>
            )}
            
            {/* Password field with toggle */}
            <div className="relative mt-6">
              <input 
                type={showPassword ? "text" : "password"}
                placeholder="Create Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                aria-label="Password"
                autoComplete="new-password"
                className="w-full p-4 border border-gray-200 rounded-lg text-base focus:border-[#004a74] focus:ring-4 focus:ring-[#004a74]/10 transition-all pr-12"
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
            
            {/* University dropdown with autocomplete */}
            <div className="relative w-full mt-6">
              <input
                ref={inputRef}
                type="text"
                placeholder={isLoadingUniversities ? "Loading universities..." : "Enter Your University"}
                value={university}
                onChange={handleInputChange}
                onBlur={handleBlur}
                required
                disabled={isLoadingUniversities}
                aria-label="University"
                className={`w-full p-4 border ${error.includes('university') ? 'border-[#e53935]' : 'border-gray-200'} rounded-lg text-base 
                  outline-none transition-all duration-300 
                  focus:border-[#004a74] focus:ring-4 focus:ring-[#004a74]/10`}
                autoComplete="off"
              />
              
              {/* Autocomplete dropdown list */}
              {autocompleteResults.length > 0 && (
                <ul 
                  ref={autocompleteRef}
                  className="absolute left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg"
                  style={{
                    width: '100%',
                    maxHeight: '240px',
                    overflowY: 'auto',
                    overscrollBehavior: 'contain',
                    zIndex: 1000
                  }}
                >
                  {autocompleteResults.map((school, index) => (
                    <li 
                      key={index}
                      className="p-3 hover:bg-[#e3f3ff] cursor-pointer border-b border-gray-100 text-left font-medium"
                      onMouseDown={() => handleAutocompleteSelect(school)}
                    >
                      {school}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading || isLoadingUniversities || isCheckingUsername || (username.length >= 3 && !usernameAvailable)}
            className="mt-7 w-full p-4 bg-[#004a74] text-white text-lg font-medium rounded-lg hover:bg-[#00659f] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
};

// Add CSS for animation
const fadeInAnimation = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn {
  animation: fadeIn 0.2s ease-in-out forwards;
}
`;

// Add the animation styles to the document
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = fadeInAnimation;
  document.head.appendChild(style);
}

export default CombinedSignup;