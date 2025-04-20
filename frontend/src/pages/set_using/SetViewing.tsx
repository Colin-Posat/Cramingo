import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft as ChevronLeftIcon,
  Edit3 as Edit3Icon,
  Save as SaveIcon,
  AlertCircle as AlertCircleIcon,
  ChevronDown as ChevronDownIcon,
  Book as BookIcon,
  ClipboardList as ClipboardListIcon,
  Info as InfoIcon,
  X as XIcon,
  Heart as HeartIcon // Add Heart icon
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
  isPublic?: boolean;
  icon?: string;
  createdAt?: string | object;
  description?: string;
  userId?: string;
  isDerived?: boolean;
  originalSetId?: string;
  likes?: number; // Add likes field
};

const SetViewingPage: React.FC = () => {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [flashcardSet, setFlashcardSet] = useState<FlashcardSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'flashcards' | 'quiz'>('flashcards');
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(() => {
    // Check localStorage for user preference
    return localStorage.getItem('hideViewerInfoTips') !== 'true';
  });
  const [isSavedByCurrentUser, setIsSavedByCurrentUser] = useState(false);
  const [isUnsaving, setIsUnsaving] = useState(false);
  
  // New state variables for likes
  const [hasLiked, setHasLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  
  // Extract navigation state to check if we came from search results
  const fromSearch = location.state?.fromSearch || false;
  const searchQuery = location.state?.searchQuery || '';

  useEffect(() => {
    // Get current user ID from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUserId(user.id || user.uid);
  }, []);

  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!setId || !currentUserId) return;
      
      try {
        // Add a timestamp parameter and no-cache headers to prevent caching issues
        const timestamp = new Date().getTime();
        const response = await fetch(`http://localhost:6500/api/sets/like-status?setId=${setId}&userId=${currentUserId}&_t=${timestamp}`, {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setHasLiked(data.hasLiked);
          console.log('Like status retrieved:', data.hasLiked);
        } else {
          console.error('Failed to get like status:', response.status);
        }
      } catch (error) {
        console.error('Error checking like status:', error);
      }
    };
    
    if (currentUserId && setId) {
      checkLikeStatus();
    }
  }, [currentUserId, setId]);

  useEffect(() => {
    const fetchFlashcardSet = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = user.id || user.uid;
        
        if (!userId) {
          setError("User not authenticated. Please log in to view flashcard sets.");
          setLoading(false);
          return;
        }
        
        if (!setId) {
          setError("No flashcard set ID provided. Please select a valid set.");
          setLoading(false);
          return;
        }
        
        try {
          const response = await fetch(`http://localhost:6500/api/sets/${setId}`, {
            credentials: 'include'
          });
          
          if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
          }
          
          const responseText = await response.text();
          
          try {
            const data = JSON.parse(responseText);
            console.log('Flashcard set data:', data);
            setFlashcardSet(data);
            
            // Set the likes count
            setLikesCount(data.likes || 0);
            
            // Check if this set is already saved by the current user
            if (data.isDerived && data.userId === userId) {
              setIsSavedByCurrentUser(true);
            } else if (data.originalSetId) {
              // Check if this is a set the current user has saved
              const savedSetsResponse = await fetch(`http://localhost:6500/api/sets/saved/${userId}`, {
                credentials: 'include'
              });
              
              if (savedSetsResponse.ok) {
                const savedSets = await savedSetsResponse.json();
                const isSaved = savedSets.some((set: FlashcardSet) => 
                  set.originalSetId === data.id && set.userId === userId
                );
                setIsSavedByCurrentUser(isSaved);
              }
            }
          } catch (parseError) {
            console.error('Error parsing response:', parseError);
            setError("Invalid data format received from server. Please try again later.");
          }
        } catch (fetchError) {
          console.error('Fetch error:', fetchError);
          setError("Failed to load flashcard set. Please check your connection and try again.");
        }
      } catch (error) {
        console.error('Error in fetchFlashcardSet:', error);
        setError("An unexpected error occurred while loading the flashcard set");
      } finally {
        setLoading(false);
      }
    };

    fetchFlashcardSet();
  }, [setId]);

  // Get back link text based on navigation state
  const getBackLinkText = () => {
    if (fromSearch) {
      return `Back to Search Results`;
    }
    return flashcardSet?.isDerived ? "Back to Saved Sets" : "Back to Created Sets";
  };
  
  // Get back link path based on navigation state
  const getBackLinkPath = () => {
    if (fromSearch) {
      return `/search-results?q=${encodeURIComponent(searchQuery)}`;
    }
    return flashcardSet?.isDerived ? "/saved-sets" : "/created-sets";
  };

  // Handle edit button click
  const handleEditSet = () => {
    if (flashcardSet) {
      localStorage.setItem("editingFlashcardSet", JSON.stringify(flashcardSet));
      navigate('/set-creator');
    }
  };

  // New function to handle liking/unliking
  const handleLikeToggle = async () => {
    if (!currentUserId || !setId || isLiking) return;
    
    try {
      setIsLiking(true);
      
      const endpoint = hasLiked 
        ? 'http://localhost:6500/api/sets/unlike'
        : 'http://localhost:6500/api/sets/like';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify({
          setId,
          userId: currentUserId
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update both local state and flashcardSet state to ensure consistency
      setHasLiked(!hasLiked);
      setLikesCount(data.likesCount);
      
      // Update the flashcardSet object to include the updated likes count
      setFlashcardSet(prev => {
        if (!prev) return null;
        return {
          ...prev,
          likes: data.likesCount
        };
      });
      
      // Store the like status in localStorage as a backup strategy
      localStorage.setItem(`set_${setId}_liked`, !hasLiked ? 'true' : 'false');
      
      console.log('Like status updated:', !hasLiked, 'Likes count:', data.likesCount);
      
    } catch (error) {
      console.error('Error toggling like:', error);
      // Show error message to the user
      alert(error instanceof Error ? error.message : 'Failed to like/unlike the set. Please try again.');
    } finally {
      setIsLiking(false);
    }
  };
  
  // Finally, add a localStorage check in the initial useEffect to ensure we have a fallback
  // if the API call fails or is delayed:
  
  useEffect(() => {
    // Get current user ID from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUserId(user.id || user.uid);
    
    // Check if we have a stored like state for this set
    if (setId) {
      const storedLikeStatus = localStorage.getItem(`set_${setId}_liked`);
      if (storedLikeStatus === 'true') {
        setHasLiked(true);
      }
    }
  }, [setId]);
  

  // Handle save button click
  const handleSaveSet = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.id || user.uid;

      // Perform save operation
      const response = await fetch('http://localhost:6500/api/sets/save', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalSetId: flashcardSet?.id,
          userId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save set');
      }

      const savedSet = await response.json();
      
      // Update state to reflect the set is now saved
      setIsSavedByCurrentUser(true);
      
      // Optional: Navigate to the newly saved set
      if (savedSet.id !== setId) {
        // Preserve the fromSearch and searchQuery when navigating
        navigate(`/study/${savedSet.id}`, {
          state: {
            fromSearch: fromSearch,
            searchQuery: searchQuery
          }
        });
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error saving set:', error);
      setLoading(false);
      // Show error message to the user
      alert(error instanceof Error ? error.message : 'Failed to save the set. Please try again.');
    }
  };

  // Handle unsave button click
  const handleUnsaveSet = async () => {
    try {
      setIsUnsaving(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.id || user.uid;

      // If this is a saved set (we're viewing the saved copy)
      if (flashcardSet?.isDerived) {
        const response = await fetch('http://localhost:6500/api/sets/unsave', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            setId: flashcardSet.id,
            userId
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to unsave set');
        }

        // Navigate back to saved sets page after unsaving
        navigate('/saved-sets');
      } else {
        // If we're viewing the original set but want to unsave our saved copy
        // First we need to find our saved copy
        const savedSetsResponse = await fetch(`http://localhost:6500/api/sets/saved/${userId}`, {
          credentials: 'include'
        });
        
        if (!savedSetsResponse.ok) {
          throw new Error('Failed to fetch saved sets');
        }
        
        const savedSets = await savedSetsResponse.json();
        const savedCopy = savedSets.find((set: FlashcardSet) => 
          set.originalSetId === flashcardSet?.id && set.userId === userId
        );
        
        if (!savedCopy) {
          throw new Error('Could not find your saved copy of this set');
        }
        
        // Unsave the found copy
        const unsaveResponse = await fetch('http://localhost:6500/api/sets/unsave', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            setId: savedCopy.id,
            userId
          }),
        });
        
        if (!unsaveResponse.ok) {
          const errorData = await unsaveResponse.json();
          throw new Error(errorData.message || 'Failed to unsave set');
        }
        
        // Update state to reflect the set is no longer saved
        setIsSavedByCurrentUser(false);
      }
    } catch (error) {
      console.error('Error unsaving set:', error);
      // Show error message to the user
      alert(error instanceof Error ? error.message : 'Failed to unsave the set. Please try again.');
    } finally {
      setIsUnsaving(false);
    }
  };

  // Toggle card expansion
  const toggleCardExpansion = (index: number) => {
    const newExpandedCards = new Set(expandedCards);
    if (newExpandedCards.has(index)) {
      newExpandedCards.delete(index);
    } else {
      newExpandedCards.add(index);
    }
    setExpandedCards(newExpandedCards);
  };

  // Navigate to flashcard view mode
  const navigateToFlashcardView = () => {
    setViewMode('flashcards');
    navigate(`/study/${setId}/flashcards`);
  };

  // Navigate to quiz view mode
  const navigateToQuizView = () => {
    setViewMode('quiz');
    navigate(`/study/${setId}/quiz`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="pt-24 px-6 pb-6 flex items-center justify-center h-[calc(100vh-9rem)]">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004a74]"></div>
            <p className="mt-4 text-[#004a74] font-medium">Loading flashcard set...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !flashcardSet) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="pt-24 px-6 pb-6 max-w-4xl mx-auto">
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded flex items-start mb-4">
            <AlertCircleIcon className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold">Error</p>
              <p>{error || "Failed to load flashcard set"}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 bg-red-700 text-white px-4 py-1 rounded text-sm hover:bg-red-800 transition"
              >
                Try Again
              </button>
            </div>
          </div>
          <button 
            onClick={() => navigate('/created-sets')}
            className="bg-[#004a74] text-white px-4 py-2 rounded flex items-center text-sm hover:bg-[#00659f]"
          >
            <ChevronLeftIcon className="w-4 h-4 mr-1" /> 
            Back to Created Sets
          </button>
        </div>
      </div>
    );
  }

  const isCreator = currentUserId === flashcardSet.userId && !flashcardSet.isDerived;

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => navigate(getBackLinkPath())}
            className="flex items-center text-sm bg-white px-3 py-2 rounded-lg shadow-sm border border-[#004a74]/20 text-[#004a74] hover:bg-[#e3f3ff] transition-colors"
          >
            <ChevronLeftIcon className="w-4 h-4 mr-1" /> {getBackLinkText()}
          </button>
          
          {/* Conditionally render Edit, Save, or Unsave button */}
          {isCreator ? (
            <button 
              onClick={handleEditSet}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[#004a74] bg-white shadow-sm border border-[#004a74]/50 hover:bg-blue-50 transition-colors"
            >
              <Edit3Icon className="w-5 h-5" /> Edit Set
            </button>
          ) : isSavedByCurrentUser ? (
            <button 
              onClick={handleUnsaveSet}
              disabled={isUnsaving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-red-500 shadow-sm hover:bg-red-600 transition-colors"
            >
              {isUnsaving ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <XIcon className="w-5 h-5" />
              )}
              Unsave Set
            </button>
          ) : (
            <button 
              onClick={handleSaveSet}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-[#004a74] shadow-sm hover:bg-[#00659f] transition-colors"
            >
              <SaveIcon className="w-5 h-5" /> Save Set
            </button>
          )}
        </div>
        
        {/* Set Info Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          {/* Header */}
          <div className="bg-[#004a74] text-white p-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">{flashcardSet.title}</h1>
              <span className="bg-white text-[#004a74] px-4 py-2 rounded-lg font-medium">
                {flashcardSet.classCode}
              </span>
            </div>
            
            {/* Added Likes Display and Card Count in a Flex Row */}
            <div className="mt-2 flex items-center justify-between">
              <p className="opacity-80">
                {flashcardSet.flashcards.length} card{flashcardSet.flashcards.length !== 1 ? 's' : ''}
              </p>
              
              {/* Like Button and Count */}
              <button 
                onClick={handleLikeToggle}
                disabled={isLiking}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all ${
                  hasLiked 
                    ? 'bg-red-100 text-red-600' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {isLiking ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                ) : (
                  <HeartIcon 
                    className={`w-4 h-4 ${hasLiked ? 'fill-red-600' : ''}`} 
                  />
                )}
                <span className="font-medium">{likesCount}</span>
              </button>
            </div>
            
            {flashcardSet.isDerived && flashcardSet.originalSetId && (
              <p className="mt-1 text-white/70 text-sm">
                Saved from original set
              </p>
            )}
          </div>

          {/* Description Section */}
          {(() => {
            const hasDescription = 
              flashcardSet.description !== undefined && 
              flashcardSet.description !== null && 
              flashcardSet.description.trim() !== '';

            return hasDescription ? (
              <div className="px-6 py-4 bg-blue-50 border-b border-[#004a74]/10">
                <h3 className="text-sm font-semibold text-[#004a74] mb-2">Description</h3>
                <p className="text-[#004a74]/80">{flashcardSet.description}</p>
              </div>
            ) : null;
          })()}
          
          {/* Info Panel - collapsible */}
          {showInfo && (
            <div className="bg-[#e3f3ff] p-4 flex items-start gap-3 border-b border-[#004a74]/20">
              <InfoIcon className="w-5 h-5 text-[#004a74] mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-[#004a74] font-medium">
                  What would you like to do with this set?
                </p>
                <p className="text-sm text-[#004a74]/80 mt-1">
                  • View all flashcards in the default view below<br />
                  • Start a flashcard study session with the "Study Flashcards" button<br />
                  • Test your knowledge with the "Take Quiz" button<br />
                  • Like the set to show your appreciation
                </p>
                <div className="mt-3 flex items-center">
                  <input 
                    type="checkbox" 
                    id="dontShowAgainViewer" 
                    className="h-4 w-4 text-[#004a74] rounded border-gray-300"
                    onChange={(e) => {
                      if (e.target.checked) {
                        localStorage.setItem('hideViewerInfoTips', 'true');
                      } else {
                        localStorage.removeItem('hideViewerInfoTips');
                      }
                    }}
                  />
                  <label htmlFor="dontShowAgainViewer" className="ml-2 text-xs text-[#004a74]/80">
                    Don't show this tip again
                  </label>
                </div>
              </div>
              <button 
                onClick={() => setShowInfo(false)}
                className="text-[#004a74] hover:bg-[#004a74]/10 p-1 rounded-full"
              >
                ✕
              </button>
            </div>
          )}
          
          {/* View Mode Buttons */}
          <div className="p-6">
            <div className="flex justify-center gap-4">
              <button
                onClick={navigateToFlashcardView}
                className={`flex-1 py-6 px-4 rounded-xl font-bold text-lg transition-all
                  ${viewMode === 'flashcards'
                    ? 'bg-[#004a74] text-white shadow-lg'
                    : 'bg-white text-[#004a74] border border-[#004a74]/20 hover:bg-[#e3f3ff] hover:shadow-md'
                  } group flex items-center justify-center gap-2`}
              >
                <BookIcon className={`w-5 h-5 transition-transform 
                  ${viewMode === 'flashcards' ? 'text-white' : 'text-[#004a74] group-hover:scale-110'}`} />
                <span>Study Flashcards</span>
              </button>
              
              <button 
                onClick={navigateToQuizView}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-lg transition-all
                  ${viewMode === 'quiz'
                    ? 'bg-[#004a74] text-white shadow-lg'
                    : 'bg-white text-[#004a74] border border-[#004a74]/20 hover:bg-[#e3f3ff] hover:shadow-md'
                  } group flex items-center justify-center gap-2`}
              >
                <ClipboardListIcon className={`w-5 h-5 transition-transform
                  ${viewMode === 'quiz' ? 'text-white' : 'text-[#004a74] group-hover:scale-110'}`} />
                <span>Take Quiz</span>
              </button>
            </div>
          </div>
        </div>
            
        {/* Section Title */}
        <h2 className="text-2xl font-bold text-[#004a74] mb-4 ml-1">
          All Flashcards ({flashcardSet.flashcards.length})
        </h2>

        {/* Flashcards */}
        <div className="space-y-6">
          {flashcardSet.flashcards.length === 0 ? (
            <div className="bg-blue-50 p-6 rounded-xl text-center border border-blue-200">
              <p className="text-xl text-[#004a74] mb-4">This set doesn't have any flashcards yet.</p>
              {isCreator ? (
                <button 
                  onClick={handleEditSet}
                  className="bg-[#004a74] text-white px-6 py-2 rounded-lg hover:bg-[#00659f] transition-all"
                >
                  Add Flashcards
                </button>
              ) : null}
            </div>
          ) : (
            flashcardSet.flashcards.map((card, index) => (
              <div 
                key={index}
                className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="bg-[#004a74] text-white px-6 py-3 flex items-center justify-between">
                  <span className="font-bold">Card {index + 1}</span>
                </div>
                <div className="p-6 grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-[#004a74] mb-3 flex items-center">
                      <span className="bg-[#e3f3ff] text-[#004a74] px-3 py-1 rounded-lg text-sm mr-2">Q</span>
                      Question
                    </h3>
                    <div
                      className={`
                        bg-gray-50 p-4 rounded-lg border border-gray-200
                        ${expandedCards.has(index) ? 'min-h-fit' : 'max-h-36 overflow-hidden relative'}
                      `}
                    >
                      <p className="text-gray-800">{card.question || "No question provided"}</p>
                      {!expandedCards.has(index) && card.question && card.question.length > 200 && (
                        <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-gray-50 to-transparent"></div>
                      )}
                    </div>
                    {card.question && card.question.length > 200 && (
                      <button 
                        onClick={() => toggleCardExpansion(index)}
                        className="w-full mt-2 flex items-center justify-center text-[#004a74] hover:bg-blue-50 py-1 rounded-lg transition-colors"
                      >
                        <ChevronDownIcon 
                          className={`w-5 h-5 transition-transform ${
                            expandedCards.has(index) ? 'rotate-180' : ''
                          }`}
                        />
                        {expandedCards.has(index) ? 'Collapse' : 'Show More'}
                      </button>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#004a74] mb-3 flex items-center">
                      <span className="bg-[#e3f3ff] text-[#004a74] px-3 py-1 rounded-lg text-sm mr-2">A</span>
                      Answer
                    </h3>
                    <div
                      className={`
                        bg-gray-50 p-4 rounded-lg border border-gray-200
                        ${expandedCards.has(index) ? 'min-h-fit' : 'max-h-36 overflow-hidden relative'}
                      `}
                    >
                      <p className="text-gray-800">{card.answer || "No answer provided"}</p>
                      {!expandedCards.has(index) && card.answer && card.answer.length > 200 && (
                        <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-gray-50 to-transparent"></div>
                      )}
                    </div>
                    {card.answer && card.answer.length > 200 && (
                      <button 
                        onClick={() => toggleCardExpansion(index)}
                        className="w-full mt-2 flex items-center justify-center text-[#004a74] hover:bg-blue-50 py-1 rounded-lg transition-colors"
                      >
                        <ChevronDownIcon 
                          className={`w-5 h-5 transition-transform ${
                            expandedCards.has(index) ? 'rotate-180' : ''
                          }`}
                        />
                        {expandedCards.has(index) ? 'Collapse' : 'Show More'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SetViewingPage;