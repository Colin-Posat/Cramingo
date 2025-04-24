import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../../components/NavBar';
import PopularSets from '../../components/PopularSets'; // Import the new component

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
        const response = await fetch('/data/class_codes.csv'); 
        const text = await response.text();
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
      } catch (error) {
        console.error('❌ Error loading class codes:', error);
      } finally {
        setIsLoadingCodes(false);
      }
    };
    fetchClassCodes();
  }, []);

  // Filter class codes - only show results that START WITH the input
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim().toUpperCase();
    setSearchTerm(value);
    setErrorMessage('');
    
    if (value.length > 0) {
      const filteredResults = allClassCodes
        .filter(code => code.toUpperCase().startsWith(value))
        .slice(0, 4); // Changed from 5 to 4 rows
      setAutocompleteResults(filteredResults);
    } else {
      setAutocompleteResults([]);
    }
  }, [allClassCodes]);

  // Handle search button click
  const handleSearch = useCallback(() => {
    if (!searchTerm.trim()) return;
    
    if (!allClassCodes.includes(searchTerm.trim().toUpperCase())) {
      setErrorMessage('Please select a valid class code from the list');
      return;
    }
    
    setIsLoading(true);
    console.log(`Searching for: ${searchTerm}`);
    
    // Navigate to results page with the search term
    setTimeout(() => {
      setIsLoading(false);
      navigate(`/search-results?q=${encodeURIComponent(searchTerm)}`);
    }, 500);
  }, [searchTerm, allClassCodes, navigate]);

  // Handle autocomplete selection
  const handleAutocompleteSelect = useCallback((code: string) => {
    setSearchTerm(code);
    setAutocompleteResults([]);
    setErrorMessage('');
    // Focus on input after selection for better UX
    inputRef.current?.focus();
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
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Validate input on blur
  const handleBlur = useCallback(() => {
    setTimeout(() => {
      if (searchTerm.trim() && !allClassCodes.includes(searchTerm.trim().toUpperCase())) {
        setErrorMessage('Please select a valid class code from the list');
        setTimeout(() => {
          setSearchTerm('');
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

  // Navigate to set creator
  const navigateToSetCreator = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/set-creator');
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      
      {/* Hero section with background pattern */}
      <div className="container mx-auto px-4 pt-20 pb-16">
        <div className="max-w-4xl mx-auto">
          {/* Card with subtle shadow and elegant border */}
          <div className="bg-white backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 transition-all duration-300 hover:shadow-2xl overflow-hidden">
            {/* Flat header with solid color */}
            <div className="bg-[#004a74] text-white p-8">              
              <h1 className="text-3xl font-bold mb-2 tracking-tight">Find Flashcard Sets</h1>
              <p className="text-blue-100 font-light">Discover study materials created by your classmates</p>
            </div>
            
            {/* Content area with increased padding for better spacing */}
            <div className="p-8">
              {/* Error message with smooth animation */}
              {errorMessage && (
                <div className="text-[#e53935] mb-6 p-4 bg-[rgba(229,57,53,0.08)] rounded-xl flex items-center gap-3 border-l-4 border-[#e53935] animate-fadeIn">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{errorMessage}</span>
                </div>
              )}
              
              {/* Search container with subtle inner shadow */}
              <div className="relative mb-6 transition-all duration-200">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  className={`w-full pl-12 pr-4 py-4 text-base bg-gray-50 border ${
                    errorMessage ? 'border-[#e53935]' : 'border-gray-200'
                  } rounded-xl focus:outline-none focus:ring-3 transition-all ${
                    errorMessage ? 'focus:ring-[#e53935]/20' : 'focus:ring-[#004a74]/20'
                  } focus:border-[#004a74] focus:bg-white shadow-sm`}
                  placeholder={isLoadingCodes ? "Loading class codes..." : "Enter class code (e.g. CSE101)"}
                  value={searchTerm}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onBlur={handleBlur}
                  disabled={isLoadingCodes}
                  autoComplete="off"
                  aria-label="Class code search"
                />
                
                {/* Autocomplete with improved styling */}
                {autocompleteResults.length > 0 && (
                  <ul 
                    ref={autocompleteRef}
                    className="absolute left-0 right-0 z-[1000] mt-1 bg-white border border-gray-100 rounded-xl shadow-lg"
                    style={{
                      maxHeight: '196px', // Adjusted to fit 4 rows (~49px per row)
                      overflowY: 'auto',
                      overscrollBehavior: 'contain',
                      position: 'absolute'
                    }}
                    role="listbox"
                    aria-label="Suggested class codes"
                  >
                    {autocompleteResults.map((code, index) => (
                      <li 
                        key={index}
                        className={`p-4 hover:bg-[#e3f3ff] cursor-pointer transition-colors text-left font-medium ${
                          index !== autocompleteResults.length - 1 ? 'border-b border-gray-50' : ''
                        }`}
                        onMouseDown={() => handleAutocompleteSelect(code)}
                        role="option"
                      >
                        {code}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              {/* Button with better hover/active states */}
              <button
                onClick={handleSearch}
                disabled={isLoading || isLoadingCodes || !searchTerm.trim()}
                className="w-full bg-[#004a74] text-white font-bold py-4 px-6 rounded-xl hover:bg-[#00659f] active:bg-[#00395c] focus:ring-4 focus:ring-[#004a74]/30 focus:outline-none active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                aria-label="Search for flashcards"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" aria-hidden="true"></div>
                ) : (
                  <>
                    <span>Find Flashcards</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
              
              {/* Footer with improved styling */}
              <div className="mt-8 text-center">
                <p className="text-gray-500 flex items-center justify-center gap-2 text-sm">
                  <span className="w-12 h-px bg-gray-200"></span>
                  <span>OR</span>
                  <span className="w-12 h-px bg-gray-200"></span>
                </p>
                <a 
                  href="/set-creator" 
                  className="mt-4 inline-flex items-center gap-2 text-[#004a74] font-medium hover:text-[#00659f] transition-colors group"
                  onClick={navigateToSetCreator}
                >
                  <span>Create your own flashcard set</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          {/* Replace Popular Classes with PopularSets component */}
          <PopularSets />
        </div>
      </div>
    </div>
  );
};

// CSS for animations
const animations = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn {
  animation: fadeIn 0.3s ease-out forwards;
}
`;

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = animations;
  document.head.appendChild(style);
}

export default SearchSetsPage;