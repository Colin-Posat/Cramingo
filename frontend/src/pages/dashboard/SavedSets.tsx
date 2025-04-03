import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookmarkIcon,
  XIcon,
  SearchIcon,
  Loader2,
  AlertCircle
} from 'lucide-react';
import NavBar from '../../components/NavBar';

// Type for user data stored in localStorage
type UserData = {
  id: string;
  email: string;
  username?: string;
};

// Type for Flashcard Set matching backend return
type FlashcardSet = {
  id: string;
  title: string;
  description?: string;
  classCode?: string;
  numCards: number;
  icon?: string;
  userId: string;
  originalSetId?: string;
  isDerived: boolean;
  createdAt: { 
    seconds: number, 
    nanoseconds: number 
  } | string;
  createdBy?: string;
};

const SavedSets: React.FC = () => {
  const navigate = useNavigate();
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showHelper, setShowHelper] = useState<boolean>(false);

  // Comprehensive user data retrieval and validation
  const getUserData = (): UserData | null => {
    try {
      // Log all localStorage contents for debugging
      console.log('Full localStorage contents:', {
        ...localStorage
      });

      // Retrieve user data from localStorage
      const userString = localStorage.getItem('user');
      console.log('Raw user string:', userString);

      if (!userString) {
        console.error('No user data found in localStorage');
        return null;
      }

      // Parse user data
      const userData = JSON.parse(userString);
      console.log('Parsed user data:', userData);

      // Validate user data - check for uid or id
      const userId = userData.uid || userData.id;
      if (!userId) {
        console.error('Invalid user data - no user ID found:', userData);
        return null;
      }

      // Return a standardized user data object
      return {
        id: userId,
        email: userData.email,
        username: userData.username
      };
    } catch (err) {
      console.error('Error retrieving user data:', err);
      return null;
    }
  };

  useEffect(() => {
    const fetchSavedSets = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get user data
        const user = getUserData();

        // If no user data, redirect to login
        if (!user) {
          console.error('No user found, redirecting to login');
          navigate('/login');
          return;
        }

        // Use environment variable or fallback
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:6500/api';
        
        console.log('Fetching saved sets for user:', user.id);
        console.log('API URL:', `${apiUrl}/sets/saved/${user.id}`);

        const response = await fetch(`${apiUrl}/sets/saved/${user.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Add authentication token if you're using one
            // 'Authorization': `Bearer ${user.token}`
          }
        });

        console.log('Fetch response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ 
            message: 'Failed to fetch saved sets' 
          }));
          
          console.error('Error response:', errorData);
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data: FlashcardSet[] = await response.json();
        console.log('Fetched saved sets:', data);

        setSets(data);

        // Helper logic
        if (data.length === 0 && !localStorage.getItem('hasSeenSavedSetsHelper')) {
          setShowHelper(true);
          localStorage.setItem('hasSeenSavedSetsHelper', 'true');
        }

      } catch (err: any) {
        console.error('Full error in fetchSavedSets:', err);
        setError(err.message || 'An unexpected error occurred while fetching saved sets');
        setSets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSavedSets();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Close helper popup
  const closeHelper = () => {
    setShowHelper(false);
  };

  // Navigate to view/study a specific set
  const handleSetClick = (setId: string) => {
    navigate(`/set/${setId}`);
  };

  // Navigate to the search page
  const goToSearch = () => {
    navigate('/search-sets');
  };

  // --- Render Logic ---

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <NavBar />
        <div className="pt-24 px-6 pb-6 flex items-center justify-center h-[calc(100vh-6rem)]">
          <Loader2 className="w-16 h-16 text-[#004a74] animate-spin" />
        </div>
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <NavBar />
        <div className="pt-24 px-6 pb-6 flex items-center justify-center h-[calc(100vh-6rem)]">
          <div className="bg-red-50 rounded-xl p-10 shadow-lg max-w-lg w-full text-center border border-red-200">
             <AlertCircle className="mx-auto w-16 h-16 text-red-600 mb-6" />
             <h2 className="text-2xl font-bold text-red-800 mb-4">Error Fetching Sets</h2>
             <p className="text-lg text-red-700">{error}</p>
             <button 
               onClick={() => window.location.reload()}
               className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
             >
               Retry
             </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Main Content (Sets List or Empty State)
  return (
    <div className="min-h-screen bg-white">
      <NavBar />

      <div className="pt-24 px-6 pb-6">
        {/* Show grid of sets if there are any */}
        {sets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {sets.map((set) => (
              <div
                key={set.id}
                className="bg-blue-50 rounded-xl p-6 shadow-md hover:shadow-lg
                           transition-all duration-300 transform hover:-translate-y-1
                           cursor-pointer flex flex-col justify-between border border-blue-100"
                onClick={() => handleSetClick(set.id)}
                title={`View set: ${set.title}`}
              >
                <div>
                  <h3 className="text-xl font-semibold text-[#004a74] mb-2 truncate">
                    {set.title}
                  </h3>
                  {set.description && (
                    <p className="text-gray-600 mb-4 text-sm line-clamp-2">
                      {set.description}
                    </p>
                  )}
                </div>
                <div>
                  <div className="border-t border-blue-200 pt-3 mt-3 flex justify-between items-center text-xs text-gray-500">
                    <span>
                      {set.numCards || 0} card{set.numCards !== 1 ? 's' : ''}
                    </span>
                    {set.classCode && (
                       <span className="font-medium bg-blue-100 text-[#004a74] px-2 py-0.5 rounded">
                         {set.classCode}
                       </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Empty State - Shows when no sets are present (and no error)
          <div className="flex items-center justify-center h-[calc(100vh-9rem)] w-full">
            <div className="bg-blue-50 rounded-xl p-10 shadow-lg max-w-lg w-full text-center border border-blue-200">
              <BookmarkIcon className="mx-auto w-20 h-20 text-[#004a74] mb-6" />
              <h2 className="text-2xl font-bold text-[#004a74] mb-4">
                No Saved Sets Yet
              </h2>
              <p className="text-base text-gray-600 mb-6">
                You haven't saved any flashcard sets yet. Click the button below to search for public sets and save your favorites.
              </p>
              <button
                onClick={goToSearch}
                className="mx-auto flex items-center justify-center gap-2 bg-[#004a74] text-white font-semibold py-2.5 px-5 rounded-lg hover:bg-[#005b8f] active:scale-[0.98] transition-all shadow-md text-lg"
              >
                <SearchIcon className="w-5 h-5" />
                <span>Search Sets</span>
              </button>
            </div>
          </div>
        )}

        {/* No Sets Helper Popup */}
        {showHelper && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="relative bg-white rounded-xl max-w-md w-full shadow-2xl mx-4">
              <div className="p-8 text-center">
                <BookmarkIcon className="mx-auto w-16 h-16 text-[#004a74] mb-6" />
                <h2 className="text-2xl font-bold text-[#004a74] mb-4">
                  Welcome to Your Saved Sets!
                </h2>
                <p className="text-base text-gray-600 mb-6">
                  This is where you'll find flashcard sets you've saved from others. Use the 'Search Sets' button or the search bar in the navigation to find and save sets for your classes.
                </p>
                <button
                  onClick={closeHelper}
                  className="bg-[#004a74] text-white px-6 py-2.5 rounded-lg
                    hover:bg-[#005b8f] transition-colors flex items-center
                    justify-center mx-auto gap-2 text-base font-semibold"
                >
                  <XIcon className="w-5 h-5" />
                  Got it!
                </button>
              </div>
              <button
                onClick={closeHelper}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close helper popup"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedSets;