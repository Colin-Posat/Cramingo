import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../../components/NavBar';

const SearchSetsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [autocompleteResults, setAutocompleteResults] = useState<string[]>([]);
  const [allClassCodes, setAllClassCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingCodes, setIsLoadingCodes] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const autocompleteRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Load class codes from CSV
  useEffect(() => {
    const fetchClassCodes = async () => {
      try {
        setIsLoadingCodes(true);
        
        // Fetch the CSV file
        const response = await fetch('/data/class_codes.csv'); 
        const text = await response.text();
        
        // Parse CSV - simple split by new line
        const classCodes = text.split('\n')
          .map(code => code.trim())
          .filter(code => 
            code.length > 0 && 
            !code.includes('<!doctype') && 
            !code.includes('<script') &&
            !code.includes('import')
          );
        
        console.log('✅ Loaded class codes:', classCodes);
        setAllClassCodes(classCodes);
        setIsLoadingCodes(false);
      } catch (error) {
        console.error('❌ Error loading class codes:', error);
        setIsLoadingCodes(false);
      }
    };

    fetchClassCodes();
  }, []);

  // Filter class codes - only show exact matches that START WITH the input
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim().toUpperCase();
    setSearchTerm(value);
    setErrorMessage('');
    
    if (value.length > 0) {
      // Filter codes that START WITH the input value
      const filteredResults = allClassCodes
        .filter(code => code.toUpperCase().startsWith(value))
        .slice(0, 5); // Limit to 5 results
      
      setAutocompleteResults(filteredResults);
    } else {
      setAutocompleteResults([]);
    }
  }, [allClassCodes]);

  // Handle search button click
  const handleSearch = useCallback(() => {
    if (searchTerm.trim()) {
      // Validate that the input is a valid class code
      if (!allClassCodes.includes(searchTerm.trim().toUpperCase())) {
        setErrorMessage('Please select a valid class code from the list');
        return;
      }
      
      setIsLoading(true);
      console.log(`Searching for: ${searchTerm}`);
      setTimeout(() => {
        setIsLoading(false);
        // Navigate to results page
        // navigate(`/search-results?q=${encodeURIComponent(searchTerm)}`);
      }, 500);
    }
  }, [searchTerm, allClassCodes]);

  // Handle autocomplete item selection
  const handleAutocompleteSelect = useCallback((code: string) => {
    setSearchTerm(code);
    setAutocompleteResults([]);
    setErrorMessage('');
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

  // Handle input blur - validate input
  const handleBlur = useCallback(() => {
    // Small timeout to allow click on autocomplete item to register first
    setTimeout(() => {
      if (searchTerm.trim() !== '' && !allClassCodes.includes(searchTerm.trim().toUpperCase())) {
        setErrorMessage('Please select a valid class code from the list');
        // Don't clear right away
        setTimeout(() => {
          setSearchTerm('');
          // Clear error message after a delay
          setTimeout(() => {
            setErrorMessage('');
          }, 3000);
        }, 1500);
      }
    }, 100);
  }, [searchTerm, allClassCodes]);

  // Handle Enter key press
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      handleSearch();
    }
  }, [searchTerm, handleSearch]);

  return (
    <div className="bg-white flex flex-col items-center min-h-screen p-8">
      {/* Navigation Bar */}
      <NavBar />

      {/* Search Container - removed overflow-hidden */}
      <div className="w-full max-w-3xl bg-[#e3f3ff] rounded-2xl shadow-md p-0 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        {/* Header Section - Added rounded-t-2xl to match parent container */}
        <div className="bg-[#004a74] text-white p-8 text-center rounded-t-2xl">
          <h1 className="text-3xl font-bold">Find Study Sets for Your Class!</h1>
        </div>
        
        {/* Content Section */}
        <div className="p-8">
          {/* Error Message */}
          {errorMessage && (
            <div className="text-[#e53935] text-sm mb-4 p-3 bg-[rgba(229,57,53,0.1)] rounded-md w-full animate-fadeIn">
              ❌ {errorMessage}
            </div>
          )}
          
          {/* Search Bar - using an outer div with relative positioning */}
          <div className="relative w-full mb-6">
            <input
              ref={inputRef}
              id="class-code-input"
              type="text"
              className={`w-full p-4 text-lg border ${errorMessage ? 'border-[#e53935]' : 'border-[#004a74]'} rounded-xl focus:outline-none focus:ring-2 ${errorMessage ? 'focus:ring-[#e53935]/20' : 'focus:ring-[#004a74]/20'} transition-all`}
              placeholder={isLoadingCodes ? "Loading class codes..." : "Enter Class Code"}
              value={searchTerm}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              disabled={isLoadingCodes}
              autoComplete="off"
            />
            
            {/* Autocomplete List - Fixed positioning with specific z-index */}
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
                {autocompleteResults.map((code, index) => (
                  <li 
                    key={index}
                    className="p-3 hover:bg-[#e3f3ff] cursor-pointer border-b border-gray-100 text-left font-medium"
                    onMouseDown={() => handleAutocompleteSelect(code)}
                  >
                    {code}
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {/* Search Button */}
          <button
            onClick={handleSearch}
            disabled={isLoading || isLoadingCodes || !searchTerm.trim()}
            className="w-full bg-[#004a74] text-white font-bold py-4 px-6 rounded-xl hover:bg-[#00659f] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Find Flashcards</span>
              </>
            )}
          </button>
          
          {/* Optional: Add a "Create your own" link */}
          <p className="mt-4 text-center text-gray-600">
            Can't find your class? <a 
              href="/si" 
              className="text-[#004a74] font-medium hover:text-[#00659f] hover:underline transition-colors"
              onClick={(e) => {
                e.preventDefault();
                navigate('/si'); // Using navigate to go to the created sets page
              }}
            >
              Create your own set
            </a>
          </p>
        </div>
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

export default SearchSetsPage;