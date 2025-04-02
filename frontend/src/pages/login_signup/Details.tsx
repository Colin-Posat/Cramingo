import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ParticlesBackground from "../../components/ParticlesBackground";

const Details: React.FC = () => {
  const navigate = useNavigate();
  const [university, setUniversity] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
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

  // Debug logging for page load and email check
  useEffect(() => {
    console.log('Details Page Mounted');
    const pendingEmail = localStorage.getItem("pendingEmail");
    console.log('Pending Email:', pendingEmail);
    
    if (!pendingEmail) {
      console.warn('No pending email found in localStorage');
    }
  }, []);

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

  // Handle input blur - validate input exactly like in SearchSetsPage
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

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

    const email = localStorage.getItem("pendingEmail");
    if (!email) {
      setError("Signup session expired. Please try again.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("http://localhost:6500/api/auth/complete-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          university, 
          fieldOfStudy 
        }),
      });

      const data = await response.json();
      if (response.ok) {
        console.log("User signed up successfully:", data);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.removeItem("pendingEmail");

        navigate("/created-sets");
      } else {
        setError(data.message || "Signup failed");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex justify-center items-center min-h-screen w-full bg-[#004a74] overflow-hidden">
      {/* Absolute positioned background with fixed z-index */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <ParticlesBackground 
          key="details-particles"
          {...particleProps}
        />
      </div>
      
      {/* Content with higher z-index and pointer events */}
      <div className="relative z-10 bg-white p-12 rounded-xl shadow-lg w-[min(550px,90vw)] max-h-[90vh] overflow-y-auto text-center">
        <h1 className="text-[#004a74] text-[min(3.5rem,8vw)] font-bold mb-3 mt-0 leading-tight">
          Just a Few More Details!
        </h1>

        {error && (
          <div className="text-[#e53935] text-sm mb-4 p-3 bg-[rgba(229,57,53,0.1)] rounded-md w-full animate-fadeIn">
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full">
          {/* University dropdown with autocomplete */}
          <div className="relative w-full mb-3">
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
              className={`w-full p-4 border ${error.includes('university') ? 'border-[#e53935]' : 'border-[#e0e0e0]'} rounded-lg text-lg 
                outline-none transition-all duration-300 
                focus:border-[#004a74] focus:shadow-[0_0_0_3px_rgba(0,74,116,0.1)]`}
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
          
          <input
            type="text"
            placeholder="Enter Your Field of Study (Optional)"
            value={fieldOfStudy}
            onChange={(e) => setFieldOfStudy(e.target.value)}
            aria-label="Field of Study"
            className="w-full p-4 my-3 border border-[#e0e0e0] rounded-lg text-lg 
              outline-none transition-all duration-300 
              focus:border-[#004a74] focus:shadow-[0_0_0_3px_rgba(0,74,116,0.1)]"
          />
          
          <button
            type="submit"
            disabled={loading || isLoadingUniversities}
            className="mt-7 w-full p-4 bg-[#004a74] text-white text-lg font-medium 
              rounded-lg cursor-pointer transition-all duration-300 
              hover:bg-[#00659f] active:scale-[0.98] 
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : "Done"}
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

export default Details;