import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookIcon, 
  XIcon,
  PlusIcon,
  Edit3Icon,
  TrashIcon,
  AlertCircleIcon
} from 'lucide-react';
import NavBar from '../../components/NavBar'; // Adjust the import path as needed

// Enhanced type for Flashcard Set
type FlashcardSet = {
  id: string;
  title: string;
  classCode: string;
  numCards?: number;
  isPublic?: boolean;
  icon?: string;
  createdAt?: string;
  flashcards?: Array<{question: string, answer: string}>;
};

const CreatedSets: React.FC = () => {
  const navigate = useNavigate();
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [showHelper, setShowHelper] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [setToDelete, setSetToDelete] = useState<string | null>(null);

  // Fetch created sets when component mounts
  useEffect(() => {
    const fetchSets = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = user.id || user.uid;
        
        console.log('User from localStorage:', user);
        console.log('Using userId:', userId);
        
        if (!userId) {
          setError("User not authenticated");
          setLoading(false);
          return;
        }
        
        console.log('Fetching sets for user ID:', userId);
        
        // First try to get the response as text to see what's happening
        try {
          const response = await fetch(`http://localhost:6500/api/sets/user/${userId}`, {
            credentials: 'include' // Include cookies for authentication
          });
          
          console.log('Response status:', response.status);
          console.log('Response headers:', response.headers);
          
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
              const hasSeenHelper = localStorage.getItem('hasSeenCreatedSetsHelper');
              if (!hasSeenHelper) {
                setShowHelper(true);
                localStorage.setItem('hasSeenCreatedSetsHelper', 'true');
              }
            }
          } catch (parseError) {
            console.error('Error parsing response as JSON:', parseError);
            setError(`Server returned invalid data. Please try again later.`);
          }
        } catch (fetchError) {
          console.error('Fetch error:', fetchError);
          setError(`Failed to connect to server. Please check your connection.`);
        }
      } catch (error) {
        console.error('Error in fetchSets function:', error);
        setError("An unexpected error occurred. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchSets();
  }, []);

  // Handle create set button click
  const handleCreateSet = () => {
    navigate('/set-creator');
  };

  // Handle edit set
  const handleEditSet = (e: React.MouseEvent, set: FlashcardSet) => {
    e.stopPropagation(); // Prevent navigation to set details
    
    // Store the set data for editing
    localStorage.setItem("editingFlashcardSet", JSON.stringify(set));
    
    // Navigate to the set creator
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
    if (!setToDelete) return;
    
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.id || user.uid;
      
      const response = await fetch(`http://localhost:6500/api/sets/delete/${setToDelete}?userId=${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        // Remove the deleted set from the state
        setSets(sets.filter(set => set.id !== setToDelete));
        setShowDeleteModal(false);
        setSetToDelete(null);
      } else {
        console.error('Failed to delete set:', await response.text());
        alert('Failed to delete the set. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting set:', error);
      alert('Failed to delete the set. Please check your connection.');
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
      
      // Generic object handling with logging to help debugging
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

  // Close helper
  const closeHelper = () => {
    setShowHelper(false);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <NavBar />
        <div className="pt-24 px-6 pb-6 flex items-center justify-center h-[calc(100vh-9rem)]">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004a74]"></div>
            <p className="mt-4 text-[#004a74] font-medium">Loading your study sets...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <NavBar />

      {/* Create Set Button - Top Left */}
      <button 
        onClick={handleCreateSet}
        className="fixed top-20 left-6 bg-[#004a74] text-white font-bold 
          py-4 px-6 rounded-xl hover:bg-[#00659f] active:scale-[0.98] 
          transition-all flex items-center justify-center gap-3 
          shadow-md z-10 text-xl"
      >
        <PlusIcon className="w-5 h-5" />
        <span>Create Set</span>
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
                onClick={() => navigate(`/study/${set.id}`)}
              >
                {/* Card Header with Status Badge */}
                <div className="bg-[#004a74]/10 p-3 flex justify-between items-center">
                  <div className="text-sm font-medium text-[#004a74]">Study Set</div>
                  {set.isPublic ? (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex-shrink-0 whitespace-nowrap">
                      Public
                    </span>
                  ) : (
                    <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full flex-shrink-0 whitespace-nowrap">
                      Private
                    </span>
                  )}
                </div>
                
                {/* Card content */}
                <div className="p-4 flex-grow flex flex-row">
                  <div className="flex-grow flex flex-col justify-between h-full">
                    <div>
                      <h3 className="text-xl font-bold text-[#004a74] mb-2 line-clamp-2">
                        {set.title}
                      </h3>
                      
                      <div className="text-sm text-gray-700 font-medium">
                        <span className="text-[#004a74]">Class:</span> {set.classCode}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-end mt-3">
                      <div className="flex items-center">
                        <BookIcon className="w-4 h-4 mr-1 text-[#004a74]" />
                        <span className="text-sm font-semibold text-[#004a74]">
                          {set.numCards || set.flashcards?.length || 0} cards
                        </span>
                      </div>
                      
                      {set.createdAt && (
                        <div className="text-xs text-gray-500">
                          {formatDate(set.createdAt)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Action buttons footer */}
                <div className="bg-[#004a74] p-4 flex justify-between items-center mt-auto">
                  <div className="text-white text-sm font-medium">Click to study</div>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => handleEditSet(e, set)}
                      className="bg-white text-[#004a74] p-2 rounded-full hover:bg-blue-100 transition"
                      aria-label="Edit set"
                    >
                      <Edit3Icon className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={(e) => confirmDelete(e, set.id)}
                      className="bg-white text-red-500 p-2 rounded-full hover:bg-red-100 transition"
                      aria-label="Delete set"
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
              <BookIcon className="mx-auto w-24 h-24 text-[#004a74] mb-8" />
              <h2 className="text-3xl font-bold text-[#004a74] mb-6">
                No Study Sets Yet
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                You haven't created any study sets yet. Get started by creating your first study set.
              </p>
              <button 
                onClick={handleCreateSet}
                className="mx-auto flex items-center justify-center gap-3 bg-[#004a74] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#00659f] active:scale-[0.98] transition-all shadow-md text-xl"
              >
                <PlusIcon className="w-6 h-6" />
                <span>Create Set</span>
              </button>
            </div>
          </div>

        )}

        {/* No Sets Helper */}
        {showHelper && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="relative bg-white rounded-xl max-w-2xl w-full shadow-2xl">
              <div className="p-8 text-center">
                <BookIcon className="mx-auto w-20 h-20 text-[#004a74] mb-6" />
                <h2 className="text-3xl font-bold text-[#004a74] mb-6">
                  Welcome to Your Study Sets!
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  It looks like you don't have any study sets yet. Click "Create Set" to get started and boost your learning!
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

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full shadow-xl p-8">
              <h2 className="text-2xl font-bold text-[#004a74] mb-6">Delete Study Set?</h2>
              <p className="text-lg text-gray-600 mb-8">
                Are you sure you want to delete this study set? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-4">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition text-lg"
                >
                  Cancel
                </button>
                <button 
                  onClick={deleteSet}
                  className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-lg"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatedSets;