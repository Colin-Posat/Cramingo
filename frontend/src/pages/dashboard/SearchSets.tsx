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
import { useAuth } from '../../context/AuthContext'; 

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
  const { user } = useAuth();

  const slugifyUniversityName = (universityName: string): string => {
    return universityName
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')     // Replace spaces with hyphens
      .replace(/-+/g, '-')      // Replace multiple hyphens with a single hyphen
      .trim();                  // Trim leading/trailing hyphens
  };

  // Load class codes from CSV
  useEffect(() => {
    const fetchClassCodes = async () => {
      try {
        setIsLoadingCodes(true);
        
        let csvPath = '/data/class_codes.csv'; // Default path
        
        if (user && user.university) {
          // Convert university name to a slugified format
          const slugifiedUniName = slugifyUniversityName(user.university);
          const uniSpecificPath = `/data/${slugifiedUniName}-class-codes.csv`;
          
          // Try to load the university-specific CSV first
          try {
            const uniResponse = await fetch(uniSpecificPath);
            if (uniResponse.ok) {
              csvPath = uniSpecificPath; // Use university-specific path
              console.log(`✅ Using class codes for: ${user.university}`);
            } else {
              console.warn(`⚠️ No specific class codes found for ${user.university}, using default`);
            }
          } catch (err) {
            console.warn(`⚠️ Error loading university-specific codes:`, err);
          }
        }
        
        // Load from either the university-specific path or the default path
        const response = await fetch(csvPath);
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
  }, [user]); // Add user to dependency array

  // Enhanced handleInputChange function with more flexible search
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim().toUpperCase();
    setSearchTerm(value);
    setErrorMessage('');
    
    if (value.length > 0) {
      // More flexible filtering that matches in different ways:
      const filteredResults = allClassCodes.filter(code => {
        const codeUpper = code.toUpperCase();
        
        // 1. Exact prefix match (original behavior)
        if (codeUpper.startsWith(value)) return true;
        
        // 2. Match without spaces (so "CS101" matches "CS 101")
        const valueNoSpace = value.replace(/\s+/g, '');
        const codeNoSpace = codeUpper.replace(/\s+/g, '');
        if (codeNoSpace.startsWith(valueNoSpace)) return true;
        
        // 3. Match just the number part (so "101" matches "CS 101", "MATH 101", etc.)
        const numberMatch = value.match(/^\d+$/);
        if (numberMatch) {
          const codeNumberMatch = codeUpper.match(/\d+/);
          if (codeNumberMatch && codeNumberMatch[0] === value) return true;
        }
        
        // 4. Match department without number (so "CS" matches "CS 101", "CS 201", etc.)
        const deptMatch = value.match(/^[A-Z]+$/);
        if (deptMatch) {
          const codeDeptMatch = codeUpper.match(/^([A-Z]+)/);
          if (codeDeptMatch && codeDeptMatch[0] === value) return true;
        }
        
        return false;
      }).slice(0, 8); // Show more results since we have more flexible matching
      
      setAutocompleteResults(filteredResults);
    } else {
      setAutocompleteResults([]);
    }
  }, [allClassCodes]);

  // Helper function to highlight matched text in search results
  const highlightMatch = useCallback((code: string, searchValue: string) => {
    if (!searchValue) return code;
    
    const codeUpper = code.toUpperCase();
    const valueUpper = searchValue.toUpperCase();
    
    // Check for direct prefix match
    if (codeUpper.startsWith(valueUpper)) {
      return (
        <>
          <span className="bg-blue-100">{code.substring(0, searchValue.length)}</span>
          {code.substring(searchValue.length)}
        </>
      );
    }
    
    // Check for no-space match
    const valueNoSpace = valueUpper.replace(/\s+/g, '');
    const codeNoSpace = codeUpper.replace(/\s+/g, '');
    if (codeNoSpace.startsWith(valueNoSpace)) {
      // This is more complex - we need to highlight the corresponding parts
      let remaining = valueNoSpace.length;
      let highlighted = '';
      let i = 0;
      
      for (const char of code) {
        if (remaining > 0 && char.toUpperCase() !== ' ') {
          highlighted += `<span class="bg-blue-100">${char}</span>`;
          remaining--;
        } else {
          highlighted += char;
        }
        i++;
      }
      
      return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
    }
    
    // Check for number-only match
    const numberMatch = valueUpper.match(/^\d+$/);
    if (numberMatch) {
      const codeNumberMatch = codeUpper.match(/(\d+)/);
      if (codeNumberMatch && codeNumberMatch[1] === valueUpper) {
        const index = code.indexOf(codeNumberMatch[1]);
        return (
          <>
            {code.substring(0, index)}
            <span className="bg-blue-100">{codeNumberMatch[1]}</span>
            {code.substring(index + codeNumberMatch[1].length)}
          </>
        );
      }
    }
    
    // Check for department code match
    const deptMatch = valueUpper.match(/^[A-Z]+$/);
    if (deptMatch) {
      const codeDeptMatch = codeUpper.match(/^([A-Z]+)/);
      if (codeDeptMatch && codeDeptMatch[0] === valueUpper) {
        const deptLength = codeDeptMatch[0].length;
        return (
          <>
            <span className="bg-blue-100">{code.substring(0, deptLength)}</span>
            {code.substring(deptLength)}
          </>
        );
      }
    }
    
    // Default case - just return the code
    return code;
  }, []);

  // Updated handleSearch function with fuzzy matching
  const handleSearch = useCallback(() => {
    if (!searchTerm.trim()) return;
    
    // Find the closest matching code
    const exactMatch = allClassCodes.find(
      code => code.toUpperCase() === searchTerm.trim().toUpperCase()
    );
    
    if (exactMatch) {
      // Use the exact match for search
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        navigate(`/search-results?q=${encodeURIComponent(exactMatch)}`);
      }, 500);
      return;
    }
    
    // Try to find a fuzzy match
    const fuzzyMatches = allClassCodes.filter(code => {
      const codeUpper = code.toUpperCase();
      const valueUpper = searchTerm.trim().toUpperCase();
      
      // Match without spaces
      const valueNoSpace = valueUpper.replace(/\s+/g, '');
      const codeNoSpace = codeUpper.replace(/\s+/g, '');
      if (codeNoSpace.startsWith(valueNoSpace)) return true;
      
      // Match just numbers
      const numberMatch = valueUpper.match(/^\d+$/);
      if (numberMatch) {
        const codeNumberMatch = codeUpper.match(/\d+/);
        if (codeNumberMatch && codeNumberMatch[0] === valueUpper) return true;
      }
      
      // Match just department code
      const deptMatch = valueUpper.match(/^[A-Z]+$/);
      if (deptMatch) {
        const codeDeptMatch = codeUpper.match(/^([A-Z]+)/);
        if (codeDeptMatch && codeDeptMatch[0] === valueUpper) return true;
      }
      
      return false;
    });
    
    if (fuzzyMatches.length > 0) {
      // Use the first fuzzy match
      setIsLoading(true);
      console.log(`Using fuzzy match: ${fuzzyMatches[0]} for input: ${searchTerm}`);
      setTimeout(() => {
        setIsLoading(false);
        navigate(`/search-results?q=${encodeURIComponent(fuzzyMatches[0])}`);
      }, 500);
      return;
    }
    
    // No matches found
    setErrorMessage('Please select a valid class code from the list');
    
  }, [searchTerm, allClassCodes, navigate]);

  // Handle autocomplete selection - unchanged
  const handleAutocompleteSelect = useCallback((code: string) => {
    setSearchTerm(code);
    setAutocompleteResults([]);
    setErrorMessage('');
    // Focus on input after selection for better UX
    inputRef.current?.focus();
  }, []);

  // Close autocomplete when clicking outside - unchanged
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

  // Updated handleBlur function - more lenient with fuzzy matches
  const handleBlur = useCallback(() => {
    setTimeout(() => {
      if (!searchTerm.trim()) return;
      
      // Check for exact match
      const exactMatch = allClassCodes.find(
        code => code.toUpperCase() === searchTerm.trim().toUpperCase()
      );
      
      if (exactMatch) return; // Valid exact match
      
      // Check for fuzzy matches
      const fuzzyMatches = allClassCodes.filter(code => {
        const codeUpper = code.toUpperCase();
        const valueUpper = searchTerm.trim().toUpperCase();
        
        // Match without spaces
        const valueNoSpace = valueUpper.replace(/\s+/g, '');
        const codeNoSpace = codeUpper.replace(/\s+/g, '');
        if (codeNoSpace.startsWith(valueNoSpace)) return true;
        
        // Match just numbers
        const numberMatch = valueUpper.match(/^\d+$/);
        if (numberMatch) {
          const codeNumberMatch = codeUpper.match(/\d+/);
          if (codeNumberMatch && codeNumberMatch[0] === valueUpper) return true;
        }
        
        // Match just department code
        const deptMatch = valueUpper.match(/^[A-Z]+$/);
        if (deptMatch) {
          const codeDeptMatch = codeUpper.match(/^([A-Z]+)/);
          if (codeDeptMatch && codeDeptMatch[0] === valueUpper) return true;
        }
        
        return false;
      });
      
      if (fuzzyMatches.length === 0) {
        // No matches found - show error and clear
        setErrorMessage('Please select a valid class code from the list');
        setTimeout(() => {
          setSearchTerm('');
          setTimeout(() => {
            setErrorMessage('');
          }, 3000);
        }, 1500);
      } else if (fuzzyMatches.length === 1) {
        // Only one match - auto-select it
        setSearchTerm(fuzzyMatches[0]);
      }
      // If multiple matches, leave as is for user to select
    }, 100);
  }, [searchTerm, allClassCodes]);

  // Handle Enter key press - unchanged
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      handleSearch();
    }
  }, [searchTerm, handleSearch]);

  // Navigate to set creator - unchanged
  const navigateToSetCreator = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/set-creator');
  }, [navigate]);

  // Loading state component - unchanged
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
                  placeholder="Enter Class Code (e.g. PSYCH1 or ENG101)"
                  value={searchTerm}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onBlur={handleBlur}
                  autoComplete="off"
                  aria-label="Class code search"
                />
                
                {/* Autocomplete with improved styling and highlighting */}
                {autocompleteResults.length > 0 && (
                  <ul 
                    ref={autocompleteRef}
                    className="absolute left-0 right-0 z-[1000] mt-1 bg-white border border-gray-100 rounded-xl shadow-lg"
                    style={{
                      maxHeight: '296px', // Increased height for more results
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
                        {highlightMatch(code, searchTerm)}
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