import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronLeft as ChevronLeftIcon,
  AlertCircle as AlertCircleIcon,
  BookOpen as BookOpenIcon,
  Search as SearchIcon,
  Users as UsersIcon
} from 'lucide-react';
import NavBar from '../../components/NavBar';

// Type definitions
type Flashcard = {
  question: string;
  answer: string;
};

type FlashcardSet = {
  id: string;
  title: string;
  classCode: string;
  numCards?: number;
  flashcards: Flashcard[];
  isPublic: boolean;
  icon?: string;
  createdAt?: string | object;
  description?: string;
  userId?: string;
  username?: string;
  createdBy?: string;
};

const SearchResultsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchResults, setSearchResults] = useState<FlashcardSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get the search query from URL
  const query = new URLSearchParams(location.search).get('q') || '';
  
  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`http://localhost:6500/api/sets/search?classCode=${encodeURIComponent(query)}`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Search results:', data);
        setSearchResults(data);
      } catch (error) {
        console.error('Error fetching search results:', error);
        setError("Failed to load search results. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchResults();
  }, [query]);

  // Format date with Firestore Timestamp handling
  const formatDate = (dateValue: any) => {
    if (!dateValue) return 'Recently created';
    
    try {
      // For Firestore Timestamp objects - standard format
      if (typeof dateValue === 'object' && 'seconds' in dateValue && 'nanoseconds' in dateValue) {
        console.log('Firestore Timestamp detected:', dateValue);
        // Convert Firestore timestamp to milliseconds
        const milliseconds = dateValue.seconds * 1000 + dateValue.nanoseconds / 1000000;
        const date = new Date(milliseconds);
        
        return new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }).format(date);
      }
      
      // For Firestore Timestamp objects with underscore prefix - serialized format
      if (typeof dateValue === 'object' && '_seconds' in dateValue && '_nanoseconds' in dateValue) {
        console.log('Serialized Firestore Timestamp detected:', dateValue);
        // Convert Firestore timestamp to milliseconds
        const milliseconds = dateValue._seconds * 1000 + dateValue._nanoseconds / 1000000;
        const date = new Date(milliseconds);
        
        return new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }).format(date);
      }
      
      // Regular Date objects
      if (dateValue instanceof Date) {
        return new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }).format(dateValue);
      }
      
      // String or number handling for ISO dates or timestamps
      if (typeof dateValue === 'string' || typeof dateValue === 'number') {
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }).format(date);
        }
        
        // Try to handle numeric strings (Unix timestamps)
        if (typeof dateValue === 'string' && /^\d+$/.test(dateValue)) {
          const timestamp = parseInt(dateValue);
          const timestampDate = new Date(timestamp);
          if (!isNaN(timestampDate.getTime())) {
            return new Intl.DateTimeFormat('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            }).format(timestampDate);
          }
        }
      }
      
      // Log data for debugging
      if (typeof dateValue === 'object') {
        console.log('Unknown date object format:', dateValue);
        try {
          console.log('JSON representation:', JSON.stringify(dateValue));
          
          // Try some common properties that might contain date information
          const possibleDateProps = ['date', 'time', 'timestamp', 'value', '_seconds', '_nanoseconds'];
          for (const prop of possibleDateProps) {
            if (prop in dateValue) {
              console.log(`Found property ${prop}:`, dateValue[prop]);
            }
          }
        } catch (jsonError) {
          console.log('Failed to stringify date object');
        }
      }
      
      console.log('Could not format date value:', dateValue);
      return 'Recently created'; // Fallback text
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Recently created';
    }
  };

  // Navigate to set viewing page
  const viewSet = (setId: string) => {
    // Pass the search query as state parameter with the navigation
    navigate(`/study/${setId}`, {
      state: { fromSearch: true, searchQuery: query }
    });
  };

  // Navigate back to search page
  const navigateToSearch = () => {
    navigate('/search-sets');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="pt-24 px-6 pb-6 flex items-center justify-center h-[calc(100vh-9rem)]">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004a74]"></div>
            <p className="mt-4 text-[#004a74] font-medium">Searching for flashcard sets...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* Header with back button and search info */}
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={navigateToSearch}
            className="flex items-center text-sm bg-white px-3 py-2 rounded-lg shadow-sm border border-[#004a74]/20 text-[#004a74] hover:bg-[#e3f3ff] transition-colors"
          >
            <ChevronLeftIcon className="w-4 h-4 mr-1" /> Back to Search
          </button>
          
          <div className="px-4 py-2 bg-[#e3f3ff] rounded-lg text-[#004a74] font-medium flex items-center">
            <SearchIcon className="w-4 h-4 mr-2" />
            Searched for: {query}
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded flex items-start mb-6">
            <AlertCircleIcon className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold">Error</p>
              <p>{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 bg-red-700 text-white px-4 py-1 rounded text-sm hover:bg-red-800 transition"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
        
        {/* Results section */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="bg-[#004a74] text-white p-6">
            <h1 className="text-2xl font-bold">Search Results for {query}</h1>
            <p className="mt-2 text-sm">
              Found {searchResults.length} public flashcard set{searchResults.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="p-6">
            {searchResults.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-gray-100 rounded-full">
                  <SearchIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No flashcard sets found</h3>
                <p className="text-gray-500 mb-6">
                  No one has created any public flashcard sets for {query} yet.
                </p>
                <button
                  onClick={() => navigate('/set-creator')}
                  className="bg-[#004a74] text-white px-6 py-3 rounded-lg hover:bg-[#00659f] transition-all"
                >
                  Create a Set for {query}
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {searchResults.map((set) => (
                  <div 
                    key={set.id}
                    className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => viewSet(set.id)}
                  >
                    <div className="bg-[#e3f3ff] p-4 flex gap-4 items-center">
                      <div className="w-12 h-12 bg-[#004a74] rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpenIcon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[#004a74] truncate">{set.title}</h3>
                        <div className="flex items-center mt-1">
                          <span className="bg-[#004a74]/10 text-[#004a74] px-2 py-0.5 rounded text-xs font-medium">
                            {set.classCode}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            {set.numCards || set.flashcards.length} card{(set.numCards || set.flashcards.length) !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-white">
                      {set.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{set.description}</p>
                      )}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center text-xs text-gray-500">
                          <UsersIcon className="w-3 h-3 mr-1" />
                          {set.createdBy ? `Created by ${set.createdBy}` : 
                           set.username ? `Created by ${set.username}` : 
                           set.userId ? `User ${set.userId.substring(0, 6)}` : 
                           'Public set'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {set.createdAt ? `Created ${formatDate(set.createdAt)}` : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResultsPage;