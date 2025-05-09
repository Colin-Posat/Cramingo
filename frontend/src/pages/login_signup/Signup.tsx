import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import ParticlesBackground from "../../components/ParticlesBackground";
import { AlertCircle as AlertCircleIcon, Eye, EyeOff, CheckCircle, Menu, X } from "lucide-react";
import { API_BASE_URL, getApiUrl } from '../../config/api';
import TermsOfServicePopup from "../../components/TermsOfServicePopup";
import PrivacyPolicyPopup from "../../components/PrivacyPolicyPopup";
import AccountFoundPopup from "../../components/AccountFoundPopup";
import { useAuth } from "../../context/AuthContext"; // Import the auth hook
import { universityAcronyms, enhanceUniversitySearch } from "../../utils/universitySearch";
import { 
  GoogleAuthProvider, 
  signInWithPopup,
  createUserWithEmailAndPassword,
  updateProfile,
  getRedirectResult
} from "firebase/auth";
import { auth } from '../../config/firebase';
import ContactPopup from "../../components/FeedbackModal";

const CombinedSignup: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle, setDelayedNavigationAfterLogin } = useAuth(); // Use the auth context

  const handleAccountLinkSuccess = () => {
    setShowAccountLinkModal(false);
    setPendingGoogleAuth(null);
    setGoogleLoading(false);
    navigate('/created-sets');
  };
  
  const handleAccountLinkCancel = () => {
    setShowAccountLinkModal(false);
    setPendingGoogleAuth(null);
    setGoogleLoading(false);
  };

const [showAccountLinkModal, setShowAccountLinkModal] = useState(false);
const [pendingGoogleAuth, setPendingGoogleAuth] = useState<{
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  university: string;
  token: string;
} | null>(null);


  
  // Basic user information
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Retrieve university from localStorage if available, otherwise use default
  const [university, setUniversity] = useState("");
  
  // UI state
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false); // State for Google loading
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Mobile menu state
  const [showAccountFoundPopup, setShowAccountFoundPopup] = useState(false);
  const [foundAccountEmail, setFoundAccountEmail] = useState("");
  
  // Username validation state
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  const usernameTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // University autocomplete states
  const [autocompleteResults, setAutocompleteResults] = useState<string[]>([]);
  const [allUniversities, setAllUniversities] = useState<string[]>([]);
  const [isLoadingUniversities, setIsLoadingUniversities] = useState<boolean>(true);
  const autocompleteRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [isContactOpen, setIsContactOpen] = useState<boolean>(false);

  // Add this with your other popup handlers like openTermsPopup, closeTermsPopup
  const openContactPopup = () => setIsContactOpen(true);
  const closeContactPopup = () => setIsContactOpen(false);

  const handleAccountFoundPopupClose = () => {
    setShowAccountFoundPopup(false);
    
    // Now we can navigate to the created-sets page
    navigate('/created-sets');
    
    // Reset the flag in our auth context
    setDelayedNavigationAfterLogin(false);
  };

  // Memoize particle background props to prevent re-rendering
  const particleProps = useMemo(() => ({
    particleCount: 150,
    primaryColor: "rgba(255, 255, 255, 0.5)",
    secondaryColor: "rgba(173, 216, 230, 0.5)",
    accentColor: "rgba(135, 206, 250, 0.7)",
    particleSize: { min: 2, max: 6 },
    particleSpeed: 0.1
  }), []);

  // Functions to handle opening and closing the terms popup
  const openTermsPopup = () => setIsTermsOpen(true);
  const closeTermsPopup = () => setIsTermsOpen(false);
  
  // Functions to handle opening and closing the privacy popup
  const openPrivacyPopup = () => setIsPrivacyOpen(true);
  const closePrivacyPopup = () => setIsPrivacyOpen(false);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(prev => !prev);
  };

  const handleGoogleSignIn = async () => {
    try {
      // Validate university input first
      if (!university.trim()) {
        setError("Please select your university before continuing with Google");
        return;
      }
      
      // Check if the university is valid
      const isValidUniversity = allUniversities.some(school =>
        school.toLowerCase() === university.trim().toLowerCase()
      );
        
      if (!isValidUniversity) {
        setError("Please select a valid university from the list");
        return;
      }
      
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
      
      // Save university to localStorage
      localStorage.setItem('selectedSchool', university);
      
      try {
        // First, check if this email already has an account
        const checkResponse = await fetch(`${API_BASE_URL}/auth/check-existing-account`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: user.email
          })
        });
        
        const checkData = await checkResponse.json();
        
        // If account exists and has Google provider, show the account found popup
        if (checkData.accountExists) {
          // Tell our auth context that a delayed navigation is happening
          setDelayedNavigationAfterLogin(true);
          
          // Show the custom popup
          setFoundAccountEmail(user.email || '');
          setShowAccountFoundPopup(true);
          
          // Process the login in the background while the popup is showing
          const loginResponse = await fetch(`${API_BASE_URL}/auth/google-login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: user.email,
              token: firebaseToken
            })
          });
          
          if (!loginResponse.ok) {
            const errorData = await loginResponse.json();
            throw new Error(errorData.message || "Failed to login with Google");
          }
          
          const loginData = await loginResponse.json();
          
          // Store the backend JWT token
          if (loginData.token) {
            // Use the loginWithGoogle function - but don't navigate yet
            // The navigation will happen when the popup closes
            await loginWithGoogle(user.email || '', loginData.token);
          } else {
            throw new Error("No authentication token received from server");
          }
          
          return;
        }
        
        // For new users or non-Google accounts, proceed with signup
        const response = await fetch(`${API_BASE_URL}/auth/google-signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
            university: university,
            token: firebaseToken,
            isNewSignup: !checkData.accountExists // Flag indicating this is a new signup
          })
        });
        
        // Handle any errors
        if (!response.ok) {
          const errorData = await response.json();
          if (errorData.emailInUse) {
            setError("This email is already registered with a different authentication method. Please use a different email or sign in with your existing account.");
            setGoogleLoading(false);
            return;
          }
          throw new Error(errorData.message || "Failed to complete signup");
        }
        
        const data = await response.json();
        
        // Store the backend JWT token
        if (data.token) {
          // Use the loginWithGoogle function
          await loginWithGoogle(user.email || '', data.token);
          
          // Now that AuthContext is updated, navigate to created-sets
          navigate('/created-sets');
        } else {
          throw new Error("No authentication token received from server");
        }
      } catch (backendError) {
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
  useEffect(() => {
    // Only set the university from localStorage if it exists
    const storedUniversity = localStorage.getItem('selectedSchool');
    if (storedUniversity && storedUniversity.trim() !== '') {
      setUniversity(storedUniversity);
    }
    
    // Check for successful Google auth callback
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      // Exchange the token for user info
      const exchangeToken = async () => {
        try {
          setLoading(true);
          
          const response = await fetch(`${API_BASE_URL}/auth/exchange-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
          });
          
          const data = await response.json();
          
          if (response.ok) {
            // Save token to localStorage or context
            localStorage.setItem('authToken', data.token);
            
            // Clean up URL parameters
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Redirect to created-sets or dashboard
            navigate('/created-sets');
          } else {
            setError(data.message || "Token exchange failed");
          }
        } catch (err) {
          console.error("Token exchange error:", err);
          setError("Failed to complete Google authentication");
        } finally {
          setLoading(false);
        }
      };
      
      exchangeToken();
    }
  }, []); 

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
        
        // If the autofilled university from localStorage exists, validate it
        if (university && universities.length > 0) {
          const isValidUniversity = universities.some(
            school => school.toLowerCase() === university.toLowerCase()
          );
          
          if (!isValidUniversity) {
            console.log('❌ Autofilled university not found in list, resetting');
            setUniversity("");
          }
        }
      } catch (error) {
        console.error('❌ Error loading universities:', error);
        setIsLoadingUniversities(false);
      }
    };

    fetchUniversities();
  }, []);

  // Inside your CombinedSignup component, add this function to check if a school is recognized
const isSchoolRecognized = (searchInput: any) => {
  if (!searchInput.trim()) return false;
  
  // Check for acronym match first
  const lowerSearchInput = searchInput.trim().toLowerCase();
  for (const [acronym, fullName] of Object.entries(universityAcronyms)) {
    if (acronym.toLowerCase() === lowerSearchInput) {
      return allUniversities.some(
        school => school.toLowerCase() === fullName.toLowerCase()
      );
    }
  }
  
  // If no acronym match, check for direct school match
  return allUniversities.some(
    school => school.toLowerCase() === searchInput.trim().toLowerCase()
  );
};


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
      // Use the enhanced search function instead of simple filtering
      const enhancedResults = enhanceUniversitySearch(value, allUniversities);
      setAutocompleteResults(enhancedResults.slice(0, 5)); // Limit to 5 results
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
    
    // On mobile, scroll to next input or button
    if (window.innerWidth <= 768) {
      if (formRef.current) {
        const submitButton = formRef.current.querySelector('button[type="submit"]');
        if (submitButton) {
          setTimeout(() => {
            submitButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        }
      }
    }
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
  
    // Check if the university is valid
    const isValidUniversity = allUniversities.some(school => 
      school.toLowerCase() === university.trim().toLowerCase()
    );
    
    if (!isValidUniversity) {
      setError("Please select a valid university from the list");
      return;
    }
  
    try {
      setLoading(true);
      
      // Step 1: Initialize signup - store user credentials in Firestore temporarily
      const initResponse = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
          username
        })
      });
      
      const initData = await initResponse.json();
      
      if (!initResponse.ok) {
        throw new Error(initData.message || "Failed to initialize signup");
      }
      
      // Step 2: Complete signup - create user in Firebase Auth and Firestore
      const completeResponse = await fetch(`${API_BASE_URL}/auth/signup/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          university,
          fieldOfStudy: '' // Add a field of study if you collect it, or leave empty
        })
      });
      
      const completeData = await completeResponse.json();
      
      if (!completeResponse.ok) {
        throw new Error(completeData.message || "Failed to complete signup");
      }
      
      // If signup was successful, we should have received a token
      if (completeData.token) {
        // Store token in localStorage
        localStorage.setItem('token', completeData.token);
        
        // Use your auth context's login function with the token
        await login(email, '', completeData.token);
        
        // Clean up localStorage after successful signup
        localStorage.removeItem('selectedSchool');
        localStorage.removeItem('searchSchool');
        
        // Navigate to created-sets page after successful signup
        navigate("/created-sets");
      } else {
        throw new Error("No authentication token received from server");
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      setError(error.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col justify-center items-center min-h-screen w-screen overflow-hidden relative bg-gradient-to-br from-[#004a74] to-[#001f3f]">
      <ParticlesBackground {...particleProps} />
      
      {/* Fixed Navigation Header - Mobile Responsive */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 sm:px-8 py-3 sm:py-4 
                     bg-black/5 backdrop-blur-md border-b border-white/5">
        <Link to="/" className="flex items-center space-x-2 sm:space-x-3">
          <div className="flex items-center justify-center bg-white bg-opacity-100 rounded-xl h-9 w-9 sm:h-11 sm:w-12">
            <img 
              src="/images/cramingo_logo.png" 
              alt="Fliply Logo" 
              className="h-8 sm:h-11 w-auto"
            />
          </div>
          <span className="text-white hidden lg:block ml-3 font-bold text-xl tracking-wide"></span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden sm:flex items-center space-x-8">
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
              className="text-white text-xl font-medium py-2 px-8 border-b-2 border-white/10"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign Up
            </Link>
            <Link 
              to="/login" 
              className="text-white/80 hover:text-white text-xl font-medium"
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
          Welcome!
        </h1>
        
        {error && (
          <p className="text-[#e53935] text-sm my-2 p-2 bg-[rgba(229,57,53,0.1)] rounded-md w-full flex items-center">
            <AlertCircleIcon className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="text-left">{error}</span>
          </p>
        )}
        
        <p className="mt-2 mb-4 text-sm sm:text-base text-gray-600">
          Already have an account? <Link 
            to="/login" 
            className="text-[#004a74] font-medium hover:text-[#00659f] hover:underline transition-colors"
          >
            Sign In
          </Link>
        </p>

        {/* University dropdown with autocomplete - We need to get this BEFORE Google Sign In */}
        <div className="relative w-full mb-4">
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
            className={`w-full p-3 sm:p-4 border ${error.includes('university') ? 'border-[#e53935]' : 'border-gray-200'} rounded-lg text-sm sm:text-base 
              outline-none transition-all duration-300 
              focus:border-[#004a74] focus:ring-2 focus:ring-[#004a74]/10`}
            autoComplete="off"
          />
          
          {/* Autocomplete dropdown list - Mobile friendly */}
          {autocompleteResults.length > 0 && (
            <ul 
              ref={autocompleteRef}
              className="absolute left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg"
              style={{
                width: '100%',
                maxHeight: '200px',
                overflowY: 'auto',
                overscrollBehavior: 'contain',
                zIndex: 1000
              }}
            >
              {autocompleteResults.map((school, index) => (
                <li 
                  key={index}
                  className="p-2.5 sm:p-3 hover:bg-[#e3f3ff] cursor-pointer border-b border-gray-100 text-left font-medium text-sm sm:text-base"
                  onMouseDown={() => handleAutocompleteSelect(school)}
                  // For mobile touch
                  onTouchStart={() => {}}
                >
                  {school}
                </li>
              ))}
            </ul>
          )}
        </div>
        {university.trim() && !isSchoolRecognized(university) && !autocompleteResults.length && (
        <div className="text-[#004a74] text-xs mt-1 mb-2">
          Don't see your university? <button 
            onClick={openContactPopup}
            className="text-[#00659f] hover:text-[#004a74] underline transition-colors"
          >
            Request it to be added
          </button>
        </div>
      )}


        
{/* Google Sign In Button */}
<button
  type="button"
  onClick={handleGoogleSignIn}
  disabled={googleLoading || isLoadingUniversities || !university}
  className="w-full p-3 sm:p-4 mb-4 flex items-center justify-center space-x-3 border border-gray-300 rounded-lg hover:bg-gray-50 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="flex items-center mt-4 sm:mt-6 mb-4">
          <div className="flex-grow h-px bg-gray-200"></div>
          <span className="px-4 text-gray-400 text-xs sm:text-sm font-medium">OR</span>
          <div className="flex-grow h-px bg-gray-200"></div>
        </div>

        <form ref={formRef} onSubmit={handleSignup} className="w-full">
          <div className="mb-4">
            <input 
              type="email" 
              placeholder="Enter Email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              aria-label="Email"
              autoComplete="email"
              className="w-full p-3 sm:p-4 my-2 sm:my-3 border border-gray-200 rounded-lg text-sm sm:text-base focus:border-[#004a74] focus:ring-2 focus:ring-[#004a74]/10 transition-all"
            />
            
            {/* Username field with validation status */}
            <div className="relative my-2 sm:my-3">
              <input 
                type="text" 
                placeholder="Create Username" 
                value={username} 
                onChange={handleUsernameChange}
                required 
                aria-label="Username"
                className={`w-full p-3 sm:p-4 border ${usernameError ? 'border-[#e53935]' : usernameAvailable && username.length >= 3 ? 'border-green-500' : 'border-gray-200'} 
                          rounded-lg text-sm sm:text-base focus:border-[#004a74] focus:ring-2 focus:ring-[#004a74]/10 transition-all pr-12`}
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
            <div className="relative mt-4 sm:mt-6">
              <input 
                type={showPassword ? "text" : "password"}
                placeholder="Create Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                aria-label="Password"
                autoComplete="new-password"
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
            
            
            {/* Terms of Service Statement */}
            <div className="mt-5 sm:mt-6 text-center">
              <p className="text-xs sm:text-sm text-gray-600">
                By using Fliply, you agree to our {" "}
                <button
                  type="button"
                  onClick={openPrivacyPopup}
                  className="text-[#004a74] font-medium hover:text-[#00659f] hover:underline transition-colors inline"
                >
                  Privacy Policy
                </button>
                {" "} and {" "}
                <button
                  type="button"
                  onClick={openTermsPopup}
                  className="text-[#004a74] font-medium hover:text-[#00659f] hover:underline transition-colors inline"
                >
                  Terms of Service
                </button>
              </p>
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading || isLoadingUniversities || isCheckingUsername || (username.length >= 3 && !usernameAvailable)}
            className="mt-4 sm:mt-5 w-full p-3 sm:p-4 bg-[#004a74] text-white text-base sm:text-lg font-medium rounded-lg hover:bg-[#00659f] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>
      </div>
      
      {/* Terms of Service Popup */}
      <TermsOfServicePopup isOpen={isTermsOpen} onClose={closeTermsPopup} />
      
      {/* Privacy Policy Popup */}
      <PrivacyPolicyPopup isOpen={isPrivacyOpen} onClose={closePrivacyPopup} />
      
      {/* Account Found Popup */}
      <AccountFoundPopup 
        isOpen={showAccountFoundPopup} 
        onClose={handleAccountFoundPopupClose} 
        email={foundAccountEmail}
      />
      {/* Contact Popup */}
<ContactPopup isOpen={isContactOpen} onClose={closeContactPopup} />

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