import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookIcon, 
  XIcon,
  PlusIcon,
  Edit3Icon,
  TrashIcon,
  AlertCircleIcon,
  HeartIcon,
  SearchIcon,
  CheckCircleIcon,
  BookOpenIcon,
  FolderIcon
} from 'lucide-react';
import NavBar from '../../components/NavBar';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';

// Enhanced type for Flashcard Set
type FlashcardSet = {
  id: string;
  title: string;
  classCode: string;
  numCards?: number;
  isPublic?: boolean;
  icon?: string;
  createdAt?: string;
  likes?: number;
  flashcards?: Array<{question: string, answer: string}>;
};

const CreatedSets: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [showHelper, setShowHelper] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [setToDelete, setSetToDelete] = useState<string | null>(null);

  // Fetch created sets when component mounts or user changes
  useEffect(() => {
    const fetchSets = async () => {
      // Skip fetch if auth is still loading
      if (authLoading) return;
      
      // Handle unauthenticated users
      if (!isAuthenticated || !user) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const userId = user.uid;
        const response = await fetch(`${API_BASE_URL}/sets/user/${userId}`, {
          credentials: 'include' // Include cookies for authentication
        });
        
        // First get text response to properly handle different outcomes
        const responseText = await response.text();
        
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}: ${responseText}`);
        }
        
        try {
          // Parse response as JSON
          const data = JSON.parse(responseText);
          
          // Update state with the parsed data
          setSets(Array.isArray(data) ? data : []);
          
          // Show helper only if no sets and first visit
          if (Array.isArray(data) && data.length === 0) {
            const hasSeenHelper = localStorage.getItem('hasSeenCreatedSetsHelper');
            if (!hasSeenHelper) {
              setShowHelper(true);
              localStorage.setItem('hasSeenCreatedSetsHelper', 'true');
            }
          }
        } catch (parseError) {
          console.error('Error parsing response as JSON:', parseError);
          throw new Error('Server returned invalid data');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        console.error('Error fetching sets:', errorMessage);
        setError(`Failed to load your flashcard sets. ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchSets();
  }, [user, authLoading, isAuthenticated]);

  // Navigation handlers
  const handleCreateSet = () => navigate('/set-creator');
  const handleSearchSets = () => navigate('/search-sets');

  // Handle edit set
  const handleEditSet = (e: React.MouseEvent, set: FlashcardSet) => {
    e.stopPropagation(); // Prevent navigation to set details
    localStorage.setItem("editingFlashcardSet", JSON.stringify(set));
    navigate('/set-creator');
  };

  // Handle delete confirmation
  const confirmDelete = (e: React.MouseEvent, setId: string) => {
    e.stopPropagation(); // Prevent navigation to set details
    setSetToDelete(setId);
    setShowDeleteModal(true);
  };

  // Handle actual deletion
  const deleteSet = async () => {
    if (!setToDelete || !user) return;
    
    try {
      const userId = user.uid;
      
      const response = await fetch(`${API_BASE_URL}/sets/delete/${setToDelete}?userId=${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        // Remove the deleted set from the state
        setSets(sets.filter(set => set.id !== setToDelete));
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to delete set: ${errorText}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error deleting set:', errorMessage);
      alert('Failed to delete the set. Please try again.');
    } finally {
      setShowDeleteModal(false);
      setSetToDelete(null);
    }
  };

  // Format date with robust handling for different date formats
  const formatDate = (dateValue: any): string => {
    if (!dateValue) return 'Recently created';
    
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
      
      return 'Recently created'; // Fallback text
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Recently created';
    }
  };
  
  // Helper functions for date formatting
  const formatDateFromMillis = (milliseconds: number): string => {
    const date = new Date(milliseconds);
    return formatDateFromDate(date);
  };
  
  const formatDateFromDate = (date: Date): string => {
    if (isNaN(date.getTime())) return 'Recently created';
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

// FlashcardSetCard component with optimized animations and updated delete button
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
      onClick={() => navigate(`/study/${set.id}`)}
    >
      {/* Card Header with Status Badge */}
      <div className={`p-4 flex justify-between items-center border-b ${
        set.isPublic 
          ? "bg-gradient-to-r from-green-50 to-blue-50" 
          : "bg-gradient-to-r from-gray-50 to-blue-50"
      }`}>
        <div className="flex items-center gap-2">
          <FolderIcon className="w-5 h-5 text-[#004a74]" />
          <div className="text-sm font-medium text-[#004a74]">Flashcard Set</div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-3 py-1 rounded-full flex items-center gap-1 ${
            set.isPublic 
              ? "bg-green-100 text-green-800" 
              : "bg-gray-100 text-gray-700"
          }`}>
            {set.isPublic 
              ? <><CheckCircleIcon className="w-3 h-3" /> Public</> 
              : <>Private</>
            }
          </span>
        </div>
      </div>
      
      {/* Card content */}
      <div className="p-5 flex-grow flex flex-col">
        <div className="flex-grow">
          <h3 className="text-xl font-bold text-[#004a74] mb-3 line-clamp-2 transition-colors duration-300">
            {set.title}
          </h3>
          
          <div className="px-3 py-2 bg-blue-50 rounded-lg inline-block mb-4">
            <span className="text-sm font-medium text-[#004a74]">{set.classCode}</span>
          </div>
          
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
            Created: {formatDate(set.createdAt)}
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
        <div className="flex gap-2">
          <button 
            onClick={(e) => handleEditSet(e, set)}
            className="bg-white/90 text-[#004a74] p-2 rounded-lg hover:bg-white transition-colors duration-150"
            aria-label="Edit set"
          >
            <Edit3Icon className="w-5 h-5" />
          </button>
          
          {/* Updated Delete Button - Animation only on hover of this button */}
          <button 
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click event
              confirmDelete(e, set.id);
            }}
            className="group/delete relative flex h-10 w-10 flex-col items-center justify-center overflow-hidden rounded-lg 
              bg-white/90 hover:bg-white transition-colors duration-150"
            aria-label="Delete set"
          >
            <svg
              viewBox="0 0 1.625 1.625"
              className="absolute -top-7 fill-red-500 delay-100 group-hover/delete:top-4 group-hover/delete:animate-[spin_1.4s] group-hover/delete:duration-1000"
              height="10"
              width="10"
            >
              <path
                d="M.471 1.024v-.52a.1.1 0 0 0-.098.098v.618c0 .054.044.098.098.098h.487a.1.1 0 0 0 .098-.099h-.39c-.107 0-.195 0-.195-.195"
              ></path>
              <path
                d="M1.219.601h-.163A.1.1 0 0 1 .959.504V.341A.033.033 0 0 0 .926.309h-.26a.1.1 0 0 0-.098.098v.618c0 .054.044.098.098.098h.487a.1.1 0 0 0 .098-.099v-.39a.033.033 0 0 0-.032-.033"
              ></path>
              <path
                d="m1.245.465-.15-.15a.02.02 0 0 0-.016-.006.023.023 0 0 0-.023.022v.108c0 .036.029.065.065.065h.107a.023.023 0 0 0 .023-.023.02.02 0 0 0-.007-.016"
              ></path>
            </svg>
            <svg
              width="12"
              fill="none"
              viewBox="0 0 39 7"
              className="origin-right duration-500 group-hover/delete:rotate-90"
            >
              <line stroke-width="4" stroke="red" y2="5" x2="39" y1="5"></line>
              <line
                stroke-width="3"
                stroke="red"
                y2="1.5"
                x2="26.0357"
                y1="1.5"
                x1="12"
              ></line>
            </svg>
            <svg width="12" fill="none" viewBox="0 0 33 39">
              <mask fill="white" id="path-1-inside-1_8_19">
                <path
                  d="M0 0H33V35C33 37.2091 31.2091 39 29 39H4C1.79086 39 0 37.2091 0 35V0Z"
                ></path>
              </mask>
              <path
                mask="url(#path-1-inside-1_8_19)"
                fill="red"
                d="M0 0H33H0ZM37 35C37 39.4183 33.4183 43 29 43H4C-0.418278 43 -4 39.4183 -4 35H4H29H37ZM4 43C-0.418278 43 -4 39.4183 -4 35V0H4V35V43ZM37 0V35C37 39.4183 33.4183 43 29 43V35V0H37Z"
              ></path>
              <path stroke-width="4" stroke="red" d="M12 6L12 29"></path>
              <path stroke-width="4" stroke="red" d="M21 6V29"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
  const EmptyState = () => (
    <div className="flex items-center justify-center min-h-[calc(100vh-32rem)] py-8 w-full">
      <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-12 shadow-xl max-w-lg w-full text-center border border-blue-100">
        <div className="relative mb-10">
          <BookIcon className="mx-auto w-28 h-28 text-[#004a74] relative z-10" />
        </div>
        <h2 className="text-3xl font-bold text-[#004a74] mb-4">
          No Flashcard Sets Yet
        </h2>
        <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
          Create your first set to start studying or find existing sets from your classmates.
        </p>
        
        {/* Get started steps */}
        <div className="mb-8 text-left">
          <div className="flex items-start gap-3 mb-4 bg-white p-3 rounded-lg shadow-sm">
            <div className="bg-[#004a74] text-white rounded-full p-2 flex-shrink-0">
              <PlusIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-md font-semibold text-[#004a74]">Create a Set</h3>
              <p className="text-sm text-gray-600">Make personalized flashcards for your classes</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 mb-4 bg-white p-3 rounded-lg shadow-sm">
            <div className="bg-[#004a74] text-white rounded-full p-2 flex-shrink-0">
              <SearchIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-md font-semibold text-[#004a74]">Find Sets</h3>
              <p className="text-sm text-gray-600">Search for sets created by others</p>
            </div>
          </div>
        </div>
  
        {/* Button group */}
        <div className="mx-auto flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleCreateSet}
            className="flex items-center justify-center gap-2 bg-[#004a74] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#00659f] active:scale-[0.98] transition-all shadow-md text-lg w-full"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Create Set</span>
          </button>
          <button
            onClick={handleSearchSets}
            className="flex items-center justify-center gap-2 bg-white text-[#004a74] font-bold py-3 px-6 rounded-xl border-2 border-[#004a74] hover:bg-[#e6f2fa] active:scale-[0.98] transition-all shadow-md text-lg w-full"
          >
            <SearchIcon className="w-5 h-5" />
            <span>Find Sets</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Helper modal component
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
            </div>
            <BookIcon className="mx-auto w-24 h-24 text-[#004a74] mb-4" />
            <h2 className="text-3xl font-bold text-[#004a74]">
              Welcome to Your Flashcard Sets!
            </h2>
          </div>
          
          {/* Content with step indicators */}
          <div className="max-w-xl mx-auto mb-8">
            <div className="bg-blue-50 rounded-xl p-6 mb-6">
              <h3 className="text-xl font-semibold text-[#004a74] mb-4 flex items-center justify-center gap-3">
                <div className="bg-[#004a74] text-white w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold">1</div>
                <span>Create Your Own Sets</span>
              </h3>
              <p className="text-gray-700">
                Click "Create Set" to make your own flashcards for any subject or class.
              </p>
            </div>
            
            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-[#004a74] mb-4 flex items-center justify-center gap-3">
                <div className="bg-[#004a74] text-white w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold">2</div>
                <span>Find Existing Sets</span>
              </h3>
              <p className="text-gray-700">
                Browse flashcard sets created by others with the "Find Sets" button.
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

  // Delete confirmation modal
  const DeleteModal = () => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
        {/* Warning bar */}
        <div className="h-1.5 bg-red-500"></div>
        
        <div className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-red-100 p-3 rounded-full">
              <TrashIcon className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Delete Flashcard Set?</h2>
          </div>
          
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8 rounded-r">
            <p className="text-gray-700">
              This action cannot be undone. All flashcards in this set will be permanently deleted.
            </p>
          </div>
          
          <div className="flex justify-end gap-3">
            <button 
              onClick={() => setShowDeleteModal(false)}
              className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg 
                hover:bg-gray-50 transition font-medium focus:outline-none focus:ring-2 
                focus:ring-gray-300 focus:ring-offset-1"
            >
              Cancel
            </button>
            <button 
              onClick={deleteSet}
              className="px-6 py-2.5 bg-red-500 text-white rounded-lg 
                hover:bg-red-600 transition font-medium shadow-sm hover:shadow
                focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1
                active:bg-red-700"
            >
              Delete Set
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Error component with improved UX
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

  // Loading state component
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
            <p className="text-[#004a74] font-medium text-lg">Loading your flashcard sets...</p>
          </div>
          <p className="mt-3 text-gray-500 text-sm">This may take a moment</p>
        </div>
      </div>
    </div>
  );

  // Unauthenticated state component
  const UnauthenticatedState = () => (
    <div className="min-h-screen bg-white">
      <NavBar />
      <div className="pt-24 px-6 pb-6 flex items-center justify-center h-[calc(100vh-9rem)]">
        <div className="bg-white shadow-xl rounded-2xl max-w-md w-full overflow-hidden">
          <div className="h-2 bg-red-500"></div>
          <div className="p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-red-100 p-3 rounded-full flex-shrink-0">
                <AlertCircleIcon className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Authentication Required</h2>
                <p className="text-gray-600 mb-6">
                  You need to be logged in to view and manage your flashcard sets.
                </p>
                <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-6 text-gray-700 text-sm">
                  <p className="font-medium">Why do I need to log in?</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>To create and save your own flashcard sets</li>
                    <li>To access your previously created content</li>
                    <li>To track your study progress</li>
                  </ul>
                </div>
                <button 
                  onClick={() => navigate('/login')}
                  className="bg-[#004a74] w-full text-white px-5 py-3 rounded-lg hover:bg-[#00659f] 
                    transition-all shadow-md font-medium flex items-center justify-center gap-2"
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  Log In
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Main render with conditional rendering
  if (authLoading || loading) {
    return <LoadingState />;
  }

  if (!isAuthenticated || !user) {
    return <UnauthenticatedState />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50/50">
      {/* Navigation Bar */}
      <NavBar />

{/* Header with Create and Search Buttons - Only shown when sets exist */}
{sets.length > 0 && (
  <div className="fixed top-16 left-0 right-0 z-10 bg-white shadow-md border-b border-gray-200 py-4">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center gap-3 justify-between">
      {/* Button container with responsive design */}
      <div className="flex items-center gap-3 flex-grow sm:flex-grow-0">
        <button
          onClick={handleCreateSet}
          className="relative overflow-hidden bg-gradient-to-r from-[#004a74] to-[#0074c2] text-white font-medium rounded-xl 
                   flex items-center justify-center gap-2 px-4 py-2.5
                   hover:from-[#00395c] hover:to-[#0068b0] active:scale-[0.98] transition-all duration-200
                   shadow-md hover:shadow-lg w-full sm:w-auto text-sm group"
          aria-label="Create flashcard set"
        >
          {/* Animated background highlight */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
          
          {/* Icon with subtle animation */}
          <div className="relative bg-white/20 p-1.5 rounded-lg mr-1 group-hover:scale-110 transition-transform duration-200">
            <PlusIcon className="w-4 h-4" />
          </div>
          
          <span className="relative whitespace-nowrap">Create Set</span>
        </button>
        
        <button
          onClick={handleSearchSets}
          className="relative overflow-hidden bg-white text-[#004a74] font-medium rounded-xl 
                   flex items-center justify-center gap-2 px-4 py-2.5
                   border border-[#004a74] hover:bg-blue-50 active:scale-[0.98] 
                   transition-all duration-200 w-full sm:w-auto text-sm
                   shadow-sm hover:shadow group"
          aria-label="Find flashcard sets"
        >
          {/* Subtle animated background highlight */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-blue-100/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
          
          {/* Icon with subtle animation */}
          <div className="relative bg-blue-100 p-1.5 rounded-lg mr-1 group-hover:scale-110 transition-transform duration-200">
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
      {/* Main Content with improved spacing */}
      <div className="pt-40 px-4 sm:px-6 pb-16 max-w-7xl mx-auto">
        {/* Error message */}
        {error && <ErrorState message={error} />}

        {/* Show grid of sets or empty state */}
        {sets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sets.map((set) => (
              <FlashcardSetCard key={set.id} set={set} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}

        {/* Modals */}
        {showHelper && <HelperModal />}
        {showDeleteModal && <DeleteModal />}
      </div>
    </div>
  );
};

export default CreatedSets;