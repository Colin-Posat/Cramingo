import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookmarkIcon, 
  XIcon,
  SearchIcon,
  AlertCircleIcon,
  BookIcon,
  UsersIcon,
  TrashIcon,
  HeartIcon  // Added HeartIcon import
} from 'lucide-react';
import NavBar from '../../components/NavBar';

// Type for Flashcard Set
type FlashcardSet = {
  id: string;
  title: string;
  description?: string;
  classCode?: string;
  numCards: number;
  isPublic?: boolean;
  icon?: string;
  userId?: string;
  username?: string;
  originalSetId?: string;
  originalCreatorId?: string;
  originalCreatorUsername?: string;
  isDerived?: boolean;
  savedByUsername?: string;
  likes?: number;  // Added likes property to type
  createdAt: { 
    seconds: number, 
    nanoseconds: number 
  } | string;
  createdBy?: string;
  flashcards?: Array<{question: string, answer: string}>;
};

const SavedSets: React.FC = () => {
  const navigate = useNavigate();
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showHelper, setShowHelper] = useState<boolean>(false);
  const [showUnsaveModal, setShowUnsaveModal] = useState(false);
  const [setToUnsave, setSetToUnsave] = useState<string | null>(null);

  // Get user data from localStorage
  const getUserData = () => {
    try {
      const userString = localStorage.getItem('user');
      
      if (!userString) {
        console.error('No user data found in localStorage');
        return null;
      }

      const userData = JSON.parse(userString);
      const userId = userData.uid || userData.id;
      
      if (!userId) {
        console.error('Invalid user data - no user ID found:', userData);
        return null;
      }

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
      try {
        setLoading(true);
        setError(null);
        
        // Get user data
        const user = getUserData();

        // If no user data, redirect to login
        if (!user) {
          console.error('No user found, redirecting to login');
          navigate('/login');
          return;
        }

        // Use environment variable or fallback
        const apiUrl = import.meta.env.VITE_API_URL || 'https://fliply-backend.onrender.com/api';
        
        console.log('Fetching saved sets for user:', user.id);

        const response = await fetch(`${apiUrl}/sets/saved/${user.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include' // Include cookies for authentication
        });

        console.log('Response status:', response.status);
        
        // First try to get the response as text to see what's happening
        const responseText = await response.text();
        console.log('Response text:', responseText);
        
        // Now try to parse as JSON if possible
        let data;
        try {
          data = JSON.parse(responseText);
          console.log('Parsed data:', data);
          
          // Update state with the parsed data
          setSets(Array.isArray(data) ? data : []);
          
          // Show helper only if no sets and first visit
          if (Array.isArray(data) && data.length === 0) {
            const hasSeenHelper = localStorage.getItem('hasSeenSavedSetsHelper');
            if (!hasSeenHelper) {
              setShowHelper(true);
              localStorage.setItem('hasSeenSavedSetsHelper', 'true');
            }
          }
        } catch (parseError) {
          console.error('Error parsing response as JSON:', parseError);
          setError(`Server returned invalid data. Please try again later.`);
        }
      } catch (error) {
        console.error('Error in fetchSavedSets function:', error);
        setError("An unexpected error occurred. Please try again later.");
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
    navigate(`/study/${setId}`);
  };

  // Navigate to the search page
  const goToSearch = () => {
    navigate('/search-sets');
  };

  // Handler for confirming unsave action
  const confirmUnsave = (e: React.MouseEvent, setId: string) => {
    e.stopPropagation(); // Prevent navigation to set details
    setSetToUnsave(setId);
    setShowUnsaveModal(true);
  };

  // Handle actual unsave operation
  const unsaveSet = async () => {
    if (!setToUnsave) return;
    
    try {
      const user = getUserData();
      
      if (!user) {
        setError("User not authenticated");
        return;
      }
      
      const apiUrl = import.meta.env.VITE_API_URL || 'https://fliply-backend.onrender.com/api';
      
      const response = await fetch(`${apiUrl}/sets/unsave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          setId: setToUnsave,
          userId: user.id
        })
      });
      
      if (response.ok) {
        // Remove the unsaved set from the state
        setSets(sets.filter(set => set.id !== setToUnsave));
        setShowUnsaveModal(false);
        setSetToUnsave(null);
      } else {
        console.error('Failed to unsave set:', await response.text());
        alert('Failed to unsave the set. Please try again.');
      }
    } catch (error) {
      console.error('Error unsaving set:', error);
      alert('Failed to unsave the set. Please check your connection.');
    }
  };

  // Format date with Firestore Timestamp handling
  const formatDate = (dateValue: any) => {
    if (!dateValue) return '';
    
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
      }
      
      console.log('Could not format date value:', dateValue);
      return 'Recently saved'; // Fallback text
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Recently saved';
    }
  };

  // Helper to get the most appropriate creator display name
  const getCreatorName = (set: FlashcardSet) => {
    // First prioritize the original creator username
    if (set.originalCreatorUsername) {
      return `Created by ${set.originalCreatorUsername}`;
    }
    // If original creator is not available but we have the createdBy field
    if (set.createdBy) {
      return `Created by ${set.createdBy}`;
    }
    // Fall back to other fields if needed
    if (set.username) {
      return `Created by ${set.username}`;
    }
    // If we have the original creator ID but not username
    if (set.originalCreatorId) {
      return `User ${set.originalCreatorId.substring(0, 6)}`;
    }
    // Last fallback to userId
    if (set.userId) {
      return `User ${set.userId.substring(0, 6)}`;
    }
    // Default if nothing else is available
    return 'Public set';
  };

  // --- Render Logic ---

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <NavBar />
        <div className="pt-24 px-6 pb-6 flex items-center justify-center h-[calc(100vh-9rem)]">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004a74]"></div>
            <p className="mt-4 text-[#004a74] font-medium">Loading your saved sets...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <NavBar />

      {/* Search Button - Top Left */}
      <button 
        onClick={goToSearch}
        className="fixed top-20 left-6 bg-[#004a74] text-white font-bold 
          py-4 px-6 rounded-xl hover:bg-[#00659f] active:scale-[0.98] 
          transition-all flex items-center justify-center gap-3 
          shadow-md z-10 text-xl"
      >
        <SearchIcon className="w-5 h-5" />
        <span>Find Sets</span>
      </button>

      {/* Sets Container */}
      <div className="pt-32 px-6 pb-6">
        
        {/* Error message */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded flex items-start">
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

        {/* Show grid of sets if there are any */}
        {sets.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-10">
            {sets.map((set) => (
              <div
                key={set.id}
                className="bg-blue-50 rounded-2xl shadow-lg hover:shadow-2xl
                  transition-all duration-300 relative overflow-hidden 
                  cursor-pointer group border-2 border-transparent 
                  hover:border-[#004a74]/20 flex flex-col w-full min-h-[250px]"
                onClick={() => handleSetClick(set.id)}
              >
                {/* Card Header */}
                <div className="bg-[#004a74]/10 p-3">
                  <div className="text-sm font-medium text-[#004a74]">Saved Set</div>
                </div>
                
                {/* Card content */}
                <div className="p-4 flex-grow flex flex-row">
                  <div className="flex-grow flex flex-col justify-between h-full">
                    <div>
                      <h3 className="text-xl font-bold text-[#004a74] mb-2 line-clamp-2">
                        {set.title}
                      </h3>
                      
                      <div className="text-sm text-gray-700 font-medium mb-2">
                        {set.classCode && (
                          <div className="mb-1">
                            <span className="text-[#004a74]">Class:</span> {set.classCode}
                          </div>
                        )}
                      </div>
                      
                      {set.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                          {set.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-end mt-3">
                      <div className="flex items-center space-x-4">
                        {/* Cards count with singular/plural handling */}
                        <div className="flex items-center">
                          <BookIcon className="w-4 h-4 mr-1 text-[#004a74]" />
                          <span className="text-sm font-semibold text-[#004a74]">
                            {set.numCards || 0} {set.numCards === 1 ? 'card' : 'cards'}
                          </span>
                        </div>
                        
                        {/* Likes count with singular/plural handling */}
                        <div className="flex items-center">
                          <HeartIcon className="w-4 h-4 mr-1 text-rose-500 fill-rose-500" />
                          <span className="text-sm font-semibold text-rose-500">
                            {set.likes || 0} {(set.likes === 1) ? 'like' : 'likes'}
                          </span>
                        </div>
                      </div>
                      
                      {set.createdAt && (
                        <div className="text-xs text-gray-500">
                          Saved: {formatDate(set.createdAt)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Action buttons footer */}
                <div className="bg-[#004a74] p-4 flex justify-between items-center">
                  <div className="text-white text-sm font-medium">Click to study</div>
                  
                  {/* Add the Unsave button here */}
                  <div className="flex items-center gap-2">
                    <div className="text-white text-xs flex items-center mr-3">
                      <UsersIcon className="w-3 h-3 mr-1" />
                      {getCreatorName(set)}
                    </div>
                    
                    <button 
                      onClick={(e) => confirmUnsave(e, set.id)}
                      className="bg-white text-red-500 p-2 rounded-full hover:bg-red-100 transition"
                      aria-label="Unsave set"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Empty State - Shows when no sets are present
          <div className="flex items-center justify-center h-[calc(100vh-9rem)] w-full">
            <div className="bg-blue-50 rounded-xl p-10 shadow-lg max-w-lg w-full text-center">
              <BookmarkIcon className="mx-auto w-24 h-24 text-[#004a74] mb-8" />
              <h2 className="text-3xl font-bold text-[#004a74] mb-6">
                No Saved Sets Yet
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                You haven't saved any flashcard sets yet. Click the button below to search for sets and save your favorites.
              </p>
              <button 
                onClick={goToSearch}
                className="mx-auto flex items-center justify-center gap-3 bg-[#004a74] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#00659f] active:scale-[0.98] transition-all shadow-md text-xl"
              >
                <SearchIcon className="w-6 h-6" />
                <span>Find Sets</span>
              </button>
            </div>
          </div>
        )}

        {/* No Sets Helper */}
        {showHelper && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="relative bg-white rounded-xl max-w-2xl w-full shadow-2xl">
              <div className="p-8 text-center">
                <BookmarkIcon className="mx-auto w-20 h-20 text-[#004a74] mb-6" />
                <h2 className="text-3xl font-bold text-[#004a74] mb-6">
                  Welcome to Your Saved Sets!
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  This is where you'll find flashcard sets you've saved from other users. Search for public sets and save them to study later!
                </p>
                <button 
                  onClick={closeHelper}
                  className="bg-[#004a74] text-white px-8 py-4 rounded-full 
                    hover:bg-[#00659f] transition-colors flex items-center 
                    justify-center mx-auto gap-3 text-lg"
                >
                  <XIcon className="w-6 h-6" />
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Unsave Confirmation Modal */}
        {showUnsaveModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full shadow-xl p-8">
              <h2 className="text-2xl font-bold text-[#004a74] mb-6">Unsave Flashcard Set?</h2>
              <p className="text-lg text-gray-600 mb-8">
                Are you sure you want to unsave this flashcard set? You'll no longer have access to it in your saved sets.
              </p>
              <div className="flex justify-end gap-4">
                <button 
                  onClick={() => setShowUnsaveModal(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition text-lg"
                >
                  Cancel
                </button>
                <button 
                  onClick={unsaveSet}
                  className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-lg"
                >
                  Unsave
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedSets;