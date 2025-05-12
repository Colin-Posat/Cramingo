import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookmarkIcon, 
  XIcon,
  SearchIcon,
  AlertCircleIcon,
  BookIcon,
  UsersIcon,
  BookmarkX,
  HeartIcon,
  CheckCircleIcon,
  BookOpenIcon,
  FolderIcon
} from 'lucide-react';
import NavBar from '../../components/NavBar';
import { API_BASE_URL, getApiUrl } from '../../config/api'; // Adjust path as needed
import { useAuth } from '../../context/AuthContext'; // Import the auth context hook

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
  likes?: number;
  popularity?: number; // Added popularity for backward compatibility
  createdAt: { 
    seconds: number, 
    nanoseconds: number 
  } | string;
  createdBy?: string;
  flashcards?: Array<{question: string, answer: string}>;
};

const SavedSets: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAuthenticated } = useAuth(); // Use auth context
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showHelper, setShowHelper] = useState<boolean>(false);
  const [showUnsaveModal, setShowUnsaveModal] = useState(false);
  const [setToUnsave, setSetToUnsave] = useState<string | null>(null);

  useEffect(() => {
    // Check if auth is still loading
    if (authLoading) {
      return; // Wait for auth to finish loading
    }
  
    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      console.error('No user found, redirecting to login');
      navigate('/login');
      return;
    }
  
    const fetchSavedSets = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching saved sets for user:', user.uid);
  
        const response = await fetch(`${API_BASE_URL}/sets/saved/${user.uid}`, {
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
          
          // The data structure should already include the likes count from the original set
          // since we're no longer creating copies with separate like counts
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
  }, [user, authLoading, isAuthenticated, navigate]);

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
    if (!setToUnsave || !user) return;
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://fliply-backend.onrender.com/api';
      
      const response = await fetch(`${API_BASE_URL}/sets/unsave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          setId: setToUnsave,
          userId: user.uid
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

  // Format date with robust handling for different date formats
  const formatDate = (dateValue: any): string => {
    if (!dateValue) return 'Recently saved';
    
    try {
      // Handle Firestore timestamp objects
      if (typeof dateValue === 'object') {
        // Standard format
        if ('seconds' in dateValue && 'nanoseconds' in dateValue) {
          const milliseconds = dateValue.seconds * 1000 + dateValue.nanoseconds / 1000000;
          return formatDateFromMillis(milliseconds);
        }
        
        // Serialized format
        if ('_seconds' in dateValue && '_nanoseconds' in dateValue) {
          const milliseconds = dateValue._seconds * 1000 + dateValue._nanoseconds / 1000000;
          return formatDateFromMillis(milliseconds);
        }
        
        // Regular Date objects
        if (dateValue instanceof Date) {
          return formatDateFromDate(dateValue);
        }
      }
      
      // Handle string or number input
      if (typeof dateValue === 'string' || typeof dateValue === 'number') {
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          return formatDateFromDate(date);
        }
        
        // Try to parse numeric strings as Unix timestamps
        if (typeof dateValue === 'string' && /^\d+$/.test(dateValue)) {
          const timestamp = parseInt(dateValue);
          return formatDateFromMillis(timestamp);
        }
      }
      
      return 'Recently saved'; // Fallback text
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Recently saved';
    }
  };
  
  // Helper functions for date formatting
  const formatDateFromMillis = (milliseconds: number): string => {
    const date = new Date(milliseconds);
    return formatDateFromDate(date);
  };
  
  const formatDateFromDate = (date: Date): string => {
    if (isNaN(date.getTime())) return 'Recently saved';
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
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

  // Render card component for a single saved flashcard set
const FlashcardSetCard = ({ set }: { set: FlashcardSet }) => {
  // Calculate card count
  const cardCount = set.numCards || set.flashcards?.length || 0;
  const likeCount = set.likes || 0;
  
  return (
    <div
      className="bg-white rounded-2xl shadow-md 
      transform-gpu hover:scale-[1.02] hover:-translate-y-1
      hover:shadow-xl
      transition-all duration-300 ease-out relative overflow-hidden 
      cursor-pointer group border border-gray-200
      hover:border-[#004a74]/50 flex flex-col w-full min-h-[250px]"
      onClick={() => handleSetClick(set.id)}
    >
      {/* Card Header with Status Badge */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-50 p-4 flex justify-between items-center border-b">
        <div className="flex items-center gap-2">
          <FolderIcon className="w-5 h-5 text-[#004a74]" />
          <div className="text-sm font-medium text-[#004a74]">Saved Set</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 rounded-full flex items-center gap-1 bg-green-100 text-green-800">
            <CheckCircleIcon className="w-3 h-3" /> Saved
          </span>
        </div>
      </div>
      
      {/* Card content */}
      <div className="p-5 flex-grow flex flex-col">
        <div className="flex-grow">
          <h3 className="text-xl font-bold text-[#004a74] mb-3 line-clamp-2 transition-colors duration-300">
            {set.title}
          </h3>
          
          {set.classCode && (
            <div className="px-3 py-2 bg-blue-50 rounded-lg inline-block mb-4">
              <span className="text-sm font-medium text-[#004a74]">{set.classCode}</span>
            </div>
          )}

          
          {/* Stats row */}
          <div className="flex flex-wrap gap-4 mt-2">
            {/* Cards count */}
            <div className="bg-white border border-blue-100 rounded-lg px-3 py-1.5 flex items-center">
              <BookOpenIcon className="w-4 h-4 mr-2 text-[#004a74]" />
              <span className="text-sm font-medium text-gray-700">
                {cardCount} {cardCount === 1 ? 'card' : 'cards'}
              </span>
            </div>
            
            {/* Likes count */}
            <div className="bg-white border border-rose-100 rounded-lg px-3 py-1.5 flex items-center">
              <HeartIcon className={`w-4 h-4 mr-2 ${likeCount > 0 ? 'text-rose-500 fill-rose-500' : 'text-gray-400'}`} />
              <span className="text-sm font-medium text-gray-700">
                {likeCount} {likeCount === 1 ? 'like' : 'likes'}
              </span>
            </div>
          </div>
        </div>
        
        {set.createdAt && (
          <div className="text-xs text-gray-500 mt-4">
            Saved: {formatDate(set.createdAt)}
          </div>
        )}
      </div>
      
      {/* Action buttons footer */}
      <div className="bg-gradient-to-r from-[#004a74] to-[#0060a1] p-4 flex justify-between items-center 
        transition-colors duration-300 group-hover:from-[#00395c] group-hover:to-[#0074c2]">
        <div className="text-white text-sm font-medium flex items-center gap-2">
          <BookOpenIcon className="w-4 h-4 group-hover:animate-pulse" />
          <span>Click to study</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-white text-xs flex items-center mr-3">
            <UsersIcon className="w-3 h-3 mr-1" />
            {getCreatorName(set)}
          </div>
          
          <button 
            onClick={(e) => confirmUnsave(e, set.id)}
            className="bg-white/90 text-red-500 p-2 rounded-lg hover:bg-white transition-colors duration-150"
            aria-label="Unsave set"
          >
            <BookmarkX className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

  // --- Render Logic ---

  // Loading State - Check both auth loading and data loading
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white">
        <NavBar />
        <div className="md:pl-16 lg:pl-48 pt-24 md:pt-8 px-6 pb-6 flex items-center justify-center h-[calc(100vh-9rem)]">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="animate-ping absolute inset-0 rounded-full bg-blue-400 opacity-30"></div>
              <div className="animate-spin relative rounded-full h-16 w-16 border-4 border-transparent border-t-4 border-t-[#004a74] border-b-4 border-b-[#004a74]"></div>
            </div>
            <div className="mt-6 bg-blue-50 px-6 py-3 rounded-lg shadow-sm">
              <p className="text-[#004a74] font-medium text-lg">Loading your saved sets...</p>
            </div>
            <p className="mt-3 text-gray-500 text-sm">This may take a moment</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state component
  const ErrorState = ({ message }: { message: string }) => (
    <div className="bg-white border border-red-200 shadow-lg rounded-xl p-6 mb-8 animate-fade-in">
      <div className="flex items-start gap-4">
        <div className="bg-red-100 p-3 rounded-full flex-shrink-0">
          <AlertCircleIcon className="w-6 h-6 text-red-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Something went wrong</h3>
          <p className="text-gray-600 mb-4">{message}</p>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 
                transition flex items-center gap-2 text-sm font-medium shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2v6h-6"></path>
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                <path d="M3 22v-6h6"></path>
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
              </svg>
              Reload Page
            </button>
            <button 
              onClick={() => navigate('/')}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 
                rounded-lg hover:bg-gray-50 transition text-sm font-medium"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );

// Updated EmptyState component
const EmptyState = () => (
  <div className="flex items-center justify-center min-h-[calc(100vh-16rem)] py-8 w-full">
    <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-12 shadow-xl max-w-lg w-full text-center border border-blue-100">
      <div className="relative mb-10">
        <BookmarkIcon className="mx-auto w-28 h-28 text-[#004a74] relative z-10" />
      </div>
      <h2 className="text-3xl font-bold text-[#004a74] mb-4">
        No Saved Sets Yet
      </h2>
      <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
        You haven't saved any flashcard sets yet. Search for sets to find and save your favorites.
      </p>
      
      {/* Get started steps */}
      <div className="mb-8 text-left">
        <div className="flex items-start gap-3 mb-4 bg-white p-3 rounded-lg shadow-sm">
          <div className="bg-[#004a74] text-white rounded-full p-2 flex-shrink-0">
            <SearchIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-md font-semibold text-[#004a74]">Find Sets</h3>
            <p className="text-sm text-gray-600">Search for sets created by others</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3 mb-4 bg-white p-3 rounded-lg shadow-sm">
          <div className="bg-[#004a74] text-white rounded-full p-2 flex-shrink-0">
            <BookmarkIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-md font-semibold text-[#004a74]">Save Sets</h3>
            <p className="text-sm text-gray-600">Bookmark sets you want to study later</p>
          </div>
        </div>
      </div>

      <button 
        onClick={goToSearch}
        className="mx-auto flex items-center justify-center gap-2 bg-[#004a74] text-white font-bold 
          py-3 px-6 rounded-xl hover:bg-[#00659f] active:scale-[0.98] transition-all shadow-md text-lg w-full"
      >
        <SearchIcon className="w-5 h-5" />
        <span>Find Sets</span>
      </button>
    </div>
  </div>
);

  // Helper modal component with better styling
  const HelperModal = () => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden">
        {/* Top decorative bar */}
        <div className="h-2 bg-gradient-to-r from-[#004a74] to-[#0080d4]"></div>
        
        {/* Close button in corner */}
        <button 
          onClick={() => setShowHelper(false)}
          className="absolute top-4 right-4 bg-gray-100 text-gray-600 p-2 rounded-full 
            hover:bg-gray-200 transition-colors z-10"
          aria-label="Close modal"
        >
          <XIcon className="w-5 h-5" />
        </button>
        
        <div className="p-10 pt-8 text-center">
          {/* Header with decorative elements */}
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <BookOpenIcon className="w-48 h-48 text-[#004a74]" />
            </div>
            <BookmarkIcon className="mx-auto w-24 h-24 text-[#004a74] mb-4" />
            <h2 className="text-3xl font-bold text-[#004a74]">
              Welcome to Your Saved Sets!
            </h2>
          </div>
          
          {/* Content with step indicators */}
          <div className="max-w-xl mx-auto mb-8">
            <div className="bg-blue-50 rounded-xl p-6 mb-6">
              <h3 className="text-xl font-semibold text-[#004a74] mb-4 flex items-center justify-center gap-3">
                <div className="bg-[#004a74] text-white w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold">1</div>
                <span>Find Flashcard Sets</span>
              </h3>
              <p className="text-gray-700">
                Click "Find Sets" to discover flashcards created by your classmates and instructors.
              </p>
            </div>
            
            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-[#004a74] mb-4 flex items-center justify-center gap-3">
                <div className="bg-[#004a74] text-white w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold">2</div>
                <span>Save Sets for Later</span>
              </h3>
              <p className="text-gray-700">
                Bookmark sets you want to study, and return to them anytime on this page.
              </p>
            </div>
          </div>
          
          {/* Action button */}
          <button 
            onClick={() => setShowHelper(false)}
            className="bg-[#004a74] text-white px-8 py-3 rounded-xl 
              hover:bg-[#00659f] transition-all flex items-center 
              justify-center mx-auto gap-2 text-lg font-medium shadow-lg
              hover:shadow-xl active:scale-[0.98]"
          >
            <CheckCircleIcon className="w-5 h-5" />
            <span>Got it!</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Unsave confirmation modal with better styling
  const UnsaveModal = () => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
        {/* Warning bar */}
        <div className="h-1.5 bg-red-500"></div>
        
        <div className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-red-100 p-3 rounded-full">
              <BookmarkX className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Unsave Flashcard Set?</h2>
          </div>
          
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8 rounded-r">
            <p className="text-gray-700">
              This set will be removed from your saved collection. You can always find and save it again later.
            </p>
          </div>
          
          <div className="flex justify-end gap-3">
            <button 
              onClick={() => setShowUnsaveModal(false)}
              className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg 
                hover:bg-gray-50 transition font-medium focus:outline-none focus:ring-2 
                focus:ring-gray-300 focus:ring-offset-1"
            >
              Cancel
            </button>
            <button 
              onClick={unsaveSet}
              className="px-6 py-2.5 bg-red-500 text-white rounded-lg 
                hover:bg-red-600 transition font-medium shadow-sm hover:shadow
                focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1
                active:bg-red-700"
            >
              Unsave
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50/50">
      {/* Navigation Bar */}
      <NavBar />

      {/* Main Content Container - Optimized for both mobile and desktop with sidebar */}
      <div className="md:pl-16 lg:pl-52">
        {/* Header with Search Button - Only shown when sets exist */}
        {sets.length > 0 && (
          <div className="fixed top-0 left-0 right-0 z-10 pt-20 md:pt-5 pb-6 px-4 bg-white shadow-md border-b border-gray-200 md:ml-12 lg:ml-48">
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 flex flex-wrap items-center gap-3 justify-between">
              {/* Button container with responsive design */}
              <div className="flex items-center gap-3 flex-grow sm:flex-grow-0">
                <button
                  onClick={goToSearch}
                  className="relative overflow-hidden bg-gradient-to-r from-[#004a74] to-[#0074c2] text-white font-medium rounded-xl 
                          flex items-center justify-center gap-2 px-4 py-2.5
                          hover:from-[#00395c] hover:to-[#0068b0] active:scale-[0.98] transition-all duration-200
                          shadow-md hover:shadow-lg w-full sm:w-auto text-sm group"
                  aria-label="Find flashcard sets"
                >
                  {/* Animated background highlight */}
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                  
                  {/* Icon with subtle animation */}
                  <div className="relative bg-white/20 p-1.5 rounded-lg mr-1 group-hover:scale-110 transition-transform duration-200">
                    <SearchIcon className="w-4 h-4" />
                  </div>
                  
                  <span className="relative whitespace-nowrap">Find Sets</span>
                </button>
              </div>
              
              {/* Right-aligned counter with improved design - Hidden on mobile when it would stack */}
              <div className="hidden sm:flex bg-gradient-to-r from-blue-50 to-blue-100 text-[#004a74] px-4 py-2 rounded-lg text-sm font-medium
                          items-center justify-center shadow-inner border border-blue-200">
                <span className="font-bold mr-1">{sets.length}</span>
                <span>{sets.length === 1 ? 'set' : 'sets'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Content Area - Adjusted for header height */}
        <div className={`${sets.length > 0 ? "pt-44 md:pt-28" : "pt-20 md:pt-6"} px-4 sm:px-6 pb-16 mx-auto max-w-screen-2xl`}>
          {/* Error message */}
          {error && <ErrorState message={error} />}

          {/* Show grid of sets or empty state */}
          {sets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
              {sets.map((set) => (
                <FlashcardSetCard key={set.id} set={set} />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}

          {/* Modals */}
          {showHelper && <HelperModal />}
          {showUnsaveModal && <UnsaveModal />}
        </div>
      </div>
    </div>
  );
};

export default SavedSets;