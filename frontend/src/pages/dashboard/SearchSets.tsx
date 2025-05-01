import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookIcon, 
  SearchIcon,
  BookOpenIcon,
  FolderIcon,
  CheckCircleIcon
} from 'lucide-react';
import NavBar from '../../components/NavBar';
import PopularSets from '../../components/PopularSets';

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
        .slice(0, 4);
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

  // Loading state component - matching CreatedSets style
  const LoadingState = () => (
    <div className="min-h-screen bg-white">
      <NavBar />
      <div className="pt-24 px-6 pb-6 flex items-center justify-center h-[calc(100vh-9rem)]">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="animate-ping absolute inset-0 rounded-full bg-blue-400 opacity-30"></div>
            <div className="animate-spin relative rounded-full h-16 w-16 border-4 border-transparent border-t-4 border-t-[#004a74] border-b-4 border-b-[#004a74]"></div>
          </div>
          <div className="mt-6 bg-blue-50 px-6 py-3 rounded-lg shadow-sm">
            <p className="text-[#004a74] font-medium text-lg">Loading class codes...</p>
          </div>
          <p className="mt-3 text-gray-500 text-sm">This may take a moment</p>
        </div>
      </div>
    </div>
  );

  if (isLoadingCodes) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50/50">
      <NavBar />
      
      {/* Main content area with matching padding/styling to CreatedSets */}
      <div className="pt-24 px-4 sm:px-6 pb-16 max-w-7xl mx-auto">
        <div className="max-w-4xl mx-auto">
          {/* Card with styling that matches the CreatedSets cards */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 
            transform-gpu hover:scale-[1.01] hover:border-[#004a74]/30
            transition-all duration-300 overflow-hidden mb-10">
            
            {/* Card Header - matching header styles from CreatedSets */}
            <div className="p-4 flex justify-between items-center bg-gradient-to-r from-blue-50 to-blue-50 border-b">
              <div className="flex items-center gap-2">
                <FolderIcon className="w-5 h-5 text-[#004a74]" />
                <div className="text-sm font-medium text-[#004a74]">Find Flashcards</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-3 py-1 rounded-full flex items-center gap-1 bg-green-100 text-green-800">
                  <CheckCircleIcon className="w-3 h-3" /> Search by Class Code
                </span>
              </div>
            </div>
            
            {/* Content area with increased padding */}
            <div className="p-8">
              <h1 className="text-3xl font-bold mb-6 tracking-tight text-[#004a74]">
                Find Flashcard Sets
              </h1>
              <p className="text-gray-600 font-light mb-8">
                Discover study materials created by your classmates
              </p>
              
              {/* Error message with matching style to CreatedSets */}
              {errorMessage && (
                <div className="text-[#e53935] mb-6 p-4 bg-red-50 rounded-xl flex items-center gap-3 border-l-4 border-[#e53935] animate-fadeIn">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{errorMessage}</span>
                </div>
              )}
              
              {/* Search container */}
              <div className="relative mb-6 transition-all duration-200">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <SearchIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  className={`w-full pl-12 pr-4 py-4 text-base bg-gray-50 border ${
                    errorMessage ? 'border-[#e53935]' : 'border-gray-200'
                  } rounded-xl focus:outline-none focus:ring-3 transition-all ${
                    errorMessage ? 'focus:ring-[#e53935]/20' : 'focus:ring-[#004a74]/20'
                  } focus:border-[#004a74] focus:bg-white shadow-sm`}
                  placeholder="Enter class code (e.g. CSE101)"
                  value={searchTerm}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onBlur={handleBlur}
                  autoComplete="off"
                  aria-label="Class code search"
                />
                
                {/* Autocomplete with improved styling matching CreatedSets */}
                {autocompleteResults.length > 0 && (
                  <ul 
                    ref={autocompleteRef}
                    className="absolute left-0 right-0 z-[1000] mt-1 bg-white border border-gray-100 rounded-xl shadow-lg"
                    style={{
                      maxHeight: '196px',
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
              
              {/* Button with matching style to CreatedSets */}
              <button
                onClick={handleSearch}
                disabled={isLoading || !searchTerm.trim()}
                className="w-full bg-[#004a74] text-white font-bold py-4 px-6 rounded-xl 
                  hover:bg-[#00659f] active:bg-[#00395c] focus:ring-4 focus:ring-[#004a74]/30 
                  focus:outline-none active:scale-[0.98] transition-all flex items-center 
                  justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                aria-label="Search for flashcards"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" aria-hidden="true"></div>
                ) : (
                  <>
                    <span>Find Flashcards</span>
                    <BookOpenIcon className="w-5 h-5" />
                  </>
                )}
              </button>
              
              {/* Divider with consistent styling */}
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
          
          {/* PopularSets component */}
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