import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft as ChevronLeftIcon,
  Edit3 as Edit3Icon,
  Save as SaveIcon,
  AlertCircle as AlertCircleIcon,
  Book as BookIcon,
  ClipboardList as ClipboardListIcon,
  Info as InfoIcon,
  X as XIcon,
  Heart as HeartIcon,
  CheckCircle as CheckCircleIcon,
  ChevronRight as ChevronRightIcon,
  Bookmark as BookmarkIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Share2 as Share2Icon,
  Printer as PrinterIcon
} from 'lucide-react';
import NavBar from '../../components/NavBar';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';

// Save Success Animation Component (included directly to avoid creating separate file)
interface SaveSuccessNotificationProps {
  show: boolean;
  onClose: () => void;
  navigateToSavedSets: () => void;
}

const EnhancedSaveSuccessNotification: React.FC<SaveSuccessNotificationProps> = ({ 
  show, 
  onClose, 
  navigateToSavedSets 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setProgress(0);
      
      // Animated progress bar
      const duration = 3000; // 3 seconds
      const interval = 30; // Update every 30ms
      const steps = duration / interval;
      let currentStep = 0;
      
      const progressTimer = setInterval(() => {
        currentStep++;
        setProgress(Math.min((currentStep / steps) * 100, 100));
        
        if (currentStep >= steps) {
          clearInterval(progressTimer);
          // Auto-close after progress completes
          setTimeout(() => {
            handleClose();
          }, 500);
        }
      }, interval);
      
      return () => clearInterval(progressTimer);
    }
  }, [show]);
  
  const handleClose = () => {
    setIsExiting(true);
    // Wait for exit animation to complete
    setTimeout(() => {
      setIsVisible(false);
      setIsExiting(false);
      if (onClose) onClose();
    }, 500);
  };
  
  if (!isVisible) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={handleClose}
    >
      <div 
        className={`bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full border border-green-200 
          transform-gpu ${isExiting ? 'scale-95 opacity-0' : 'animate-scaleIn'}`}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the modal
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4
            animate-pulse">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Set Saved Successfully!</h3>
          <p className="text-gray-500 mb-6">
            This flashcard set has been added to your saved sets.
          </p>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6 overflow-hidden">
            <div 
              className="bg-green-500 h-full rounded-full transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <div className="flex gap-3 justify-center">
            <button 
              onClick={handleClose}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 shadow-sm hover:shadow"
            >
              <XIcon size={16} />
              Close
            </button>
            
            <button 
              onClick={() => {
                handleClose();
                setTimeout(() => {
                  if (navigateToSavedSets) navigateToSavedSets();
                }, 300);
              }}
              className="px-5 py-2.5 bg-[#004a74] text-white rounded-lg hover:bg-[#00659f] transition-colors flex items-center gap-2 shadow-md hover:shadow-lg"
            >
              View Saved Sets
              <ChevronRightIcon size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Type definitions
type Flashcard = {
  question: string;
  answer: string;
  questionImage?: string;
  answerImage?: string;
  hasQuestionImage?: boolean;
  hasAnswerImage?: boolean;
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
  likes?: number;
};

const SetViewingPage: React.FC = () => {
  const { user } = useAuth();
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [flashcardSet, setFlashcardSet] = useState<FlashcardSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'flashcards' | 'quiz'>('flashcards');
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [showInfo, setShowInfo] = useState(() => {
    return localStorage.getItem('hideViewerInfoTips') !== 'true';
  });
  const [isSavedByCurrentUser, setIsSavedByCurrentUser] = useState(false);
  const [isUnsaving, setIsUnsaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Likes state
  const [hasLiked, setHasLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  
  // Image preview state
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Navigation flags
  const fromSearch = location.state?.fromSearch || false;
  const searchQuery = location.state?.searchQuery || '';
  const fromPopularSets = location.state?.fromPopularSets || false;

  useEffect(() => {
    if (!user?.uid || !setId) return;
  
    const checkLikeStatus = async () => {
      try {
        const timestamp = new Date().getTime();
        // Updated to match the new router path
        const response = await fetch(
          `${API_BASE_URL}/likes/status?setId=${setId}&userId=${user.uid}&_t=${timestamp}`,
          {
            credentials: 'include',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          }
        );
        if (response.ok) {
          const data = await response.json();
          setHasLiked(data.hasLiked);
        }
      } catch (err) {
        console.error('Error checking like status:', err);
      }
    };
  
    // Get the likes count separately
    const fetchLikesCount = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/likes/count?setId=${setId}`,
          { credentials: 'include' }
        );
        if (response.ok) {
          const data = await response.json();
          setLikesCount(data.likesCount);
          setFlashcardSet(prev => prev ? { ...prev, likes: data.likesCount } : prev);
        }
      } catch (err) {
        console.error('Error fetching likes count:', err);
      }
    };
  
    checkLikeStatus();
    fetchLikesCount();
  }, [user, setId]);

  // Fetch flashcard set
  useEffect(() => {
    const fetchFlashcardSet = async () => {
      setLoading(true);
      setError(null);
  
      if (!user?.uid) {
        setError('User not authenticated. Please log in to view flashcard sets.');
        setLoading(false);
        return;
      }
  
      if (!setId) {
        setError('No flashcard set ID provided. Please select a valid set.');
        setLoading(false);
        return;
      }
  
      try {
        // Fetch the flashcard set
        const response = await fetch(`${API_BASE_URL}/sets/${setId}`, {
          credentials: 'include'
        });
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        const text = await response.text();
        const data: FlashcardSet = JSON.parse(text);
  
        setFlashcardSet(data);
        setLikesCount(data.likes || 0);
  
        // Check saved status using our new endpoint
        const savedStatusRes = await fetch(
          `${API_BASE_URL}/sets/saved-status?userId=${user.uid}&setId=${setId}`,
          { credentials: 'include' }
        );
        
        if (savedStatusRes.ok) {
          const savedStatusData = await savedStatusRes.json();
          setIsSavedByCurrentUser(savedStatusData.isSaved);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to load flashcard set. Please try again.');
      } finally {
        setLoading(false);
      }
    };
  
    fetchFlashcardSet();
  }, [setId, user]);

  // Back link helpers
  const getBackLinkText = () => {
    // Keep original navigation for search results and popular sets
    if (fromSearch) return 'Back to Search Results';
    if (fromPopularSets) return 'Back to Search Sets';
    
    // For other cases, display "Back to Saved Sets" if the user has saved this set
    if (isSavedByCurrentUser) {
      return 'Back to Saved Sets';
    }
    
    // Original fallback logic
    return flashcardSet?.isDerived ? 'Back to Saved Sets' : 'Back to Created Sets';
  };

  // Similarly, update the getBackLinkPath function
  const getBackLinkPath = () => {
    // Keep original navigation for search results and popular sets
    if (fromSearch) return `/search-results?q=${encodeURIComponent(searchQuery)}`;
    if (fromPopularSets) return '/search-sets';
    
    // For other cases, link to saved sets if the user has saved this set
    if (isSavedByCurrentUser) {
      return '/saved-sets';
    }
    
    // Original fallback logic
    return flashcardSet?.isDerived ? '/saved-sets' : '/created-sets';
  };

  // Actions
  const handleEditSet = () => {
    localStorage.setItem('editingFlashcardSet', JSON.stringify(flashcardSet));
    navigate('/set-creator');
  };

  const handleLikeToggle = async () => {
    if (!user?.uid || !setId || isLiking) return;
    setIsLiking(true);
    try {
      // Updated URLs to match the new router paths
      const endpoint = hasLiked
        ? `${API_BASE_URL}/likes/unlike`
        : `${API_BASE_URL}/likes/like`;
      const res = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setId, userId: user.uid })
      });
      if (!res.ok) throw new Error(`Server ${res.status}`);
      const data = await res.json();
      setHasLiked(!hasLiked);
      setLikesCount(data.likesCount);
      setFlashcardSet(prev => prev ? { ...prev, likes: data.likesCount } : prev);
      
      // Update localStorage to remember user preference
      if (!hasLiked) {
        localStorage.setItem(`set_${setId}_liked`, 'true');
      } else {
        localStorage.removeItem(`set_${setId}_liked`);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      alert('Failed to update like status.');
    } finally {
      setIsLiking(false);
    }
  };

  const handleSaveSet = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      // Update API endpoint to match the new implementation
      const res = await fetch(`${API_BASE_URL}/sets/save`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          setId: flashcardSet?.id, // Changed from originalSetId to setId
          userId: user.uid 
        })
      });
      
      if (!res.ok) throw new Error('Save failed');
      const data = await res.json();
      setIsSavedByCurrentUser(true);
      // Show animation instead of alert
      setShowSaveSuccess(true);
    } catch (err) {
      console.error('Error saving set:', err);
      alert('Failed to save the set.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsaveSet = async () => {
    if (!user?.uid) return;
    setIsUnsaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/sets/unsave`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          setId: flashcardSet?.id, 
          userId: user.uid 
        })
      });
      
      if (!res.ok) throw new Error('Unsave failed');
      setIsSavedByCurrentUser(false);
      
      // If we're viewing a saved set in the saved sets page,
      // navigate back to saved sets list
      if (location.pathname.includes('/saved-sets')) {
        navigate('/saved-sets');
      }
    } catch (err) {
      console.error('Error unsaving:', err);
      alert('Failed to unsave the set.');
    } finally {
      setIsUnsaving(false);
    }
  };

  // Refresh likes count
  const refreshLikesCount = async () => {
    if (!setId) return;
    
    try {
      // Updated to match new route definitions
      const response = await fetch(`${API_BASE_URL}/likes/count?setId=${setId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setLikesCount(data.likesCount);
        setFlashcardSet(prev => prev ? { ...prev, likes: data.likesCount } : prev);
      }
    } catch (err) {
      console.error('Error refreshing likes count:', err);
    }
  };

  const toggleCardExpansion = (i: number) => {
    const next = new Set(expandedCards);
    next.has(i) ? next.delete(i) : next.add(i);
    setExpandedCards(next);
  };

  const navigateToFlashcardView = () => {
    setViewMode('flashcards');
    navigate(`/study/${setId}/flashcards`);
  };

  const navigateToQuizView = () => {
    setViewMode('quiz');
    navigate(`/study/${setId}/quiz`);
  };
  
  const showImagePreview = (imageUrl: string) => {
    setPreviewImage(imageUrl);
  };
  
  const closeImagePreview = () => {
    setPreviewImage(null);
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50/50">
      <NavBar />
      <div className="pt-24 px-6 pb-6 flex items-center justify-center h-[calc(100vh-9rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004a74]"></div>
      </div>
    </div>
  );

  if (error || !flashcardSet) return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50/50">
      <NavBar />
      <div className="container mx-auto px-4 pt-24">
        <div className="bg-red-100 border border-red-200 p-6 rounded-2xl shadow-md flex items-start gap-4">
          <AlertCircleIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
          <div>
            <p className="font-bold text-red-800 text-lg mb-2">Error Loading Flashcard Set</p>
            <p className="text-red-700 mb-4">{error || "The flashcard set could not be loaded. Please try again."}</p>
            <div className="flex gap-4">
              <button 
                onClick={() => window.location.reload()} 
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm shadow-sm hover:shadow transition-all active:scale-[0.98]"
              >
                Try Again
              </button>
              <button 
                onClick={() => navigate(getBackLinkPath())} 
                className="bg-[#004a74] hover:bg-[#00395c] text-white px-4 py-2 rounded-xl text-sm shadow-sm hover:shadow transition-all active:scale-[0.98]"
              >
                {getBackLinkText()}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const isCreator = user?.uid === flashcardSet.userId && !flashcardSet.isDerived;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50/50">
      <NavBar />
      
      {/* Save Success Notification */}
      {showSaveSuccess && (
        <EnhancedSaveSuccessNotification 
          show={showSaveSuccess} 
          onClose={() => setShowSaveSuccess(false)} 
          navigateToSavedSets={() => navigate('/saved-sets')}
        />
      )}
      
      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={closeImagePreview}
        >
          <div 
            className="max-w-4xl max-h-[90vh] flex flex-col items-center transform-gpu animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={previewImage} 
              alt="Preview" 
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
            <button 
              onClick={closeImagePreview}
              className="mt-4 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <XIcon className="w-4 h-4" />
              Close Preview
            </button>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* Header with back button and page title */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-6">
          <button 
            onClick={() => navigate(getBackLinkPath())}
            className="flex items-center text-sm bg-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-sm 
              border border-[#004a74]/20 text-[#004a74] hover:bg-blue-50 transition-colors
              group active:scale-[0.98] w-full sm:w-auto"
          >
            <ChevronLeftIcon className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
            <span className="truncate">{getBackLinkText()}</span>
          </button>
          
          {/* Conditionally render Edit or Unsave button */}
        {isCreator ? (
          <button 
            onClick={handleEditSet}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[#004a74] bg-white shadow-sm 
              border border-[#004a74]/50 hover:bg-blue-50 transition-colors active:scale-[0.98] w-full sm:w-auto"
          >
            <Edit3Icon className="w-5 h-5" /> Edit Set
          </button>
        ) : isSavedByCurrentUser ? (
          <button 
            onClick={handleUnsaveSet}
            disabled={isUnsaving}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-white bg-red-500 shadow-sm 
              hover:bg-red-600 transition-colors active:scale-[0.98] disabled:opacity-70 w-full sm:w-auto"
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
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-white bg-[#004a74] shadow-sm 
              hover:bg-[#00659f] transition-colors active:scale-[0.98] w-full sm:w-auto"
          >
            <SaveIcon className="w-5 h-5" /> Save Set
          </button>
        )}
      </div>
        
        {/* Set Info Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6 border border-gray-200 hover:border-[#004a74]/20 transition-all">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#004a74] to-[#0074c2] text-white p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
              <h1 className="text-2xl sm:text-3xl font-bold line-clamp-2">{flashcardSet.title}</h1>
              <span className="bg-white text-[#004a74] px-3 py-1 sm:px-4 sm:py-2 rounded-lg font-medium shadow-sm text-sm sm:text-base mt-1 sm:mt-0">
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
                    className={`w-4 h-4 ${hasLiked ? 'fill-red-600' : ''} transition-transform hover:scale-110`} 
                  />
                )}
                <span className="font-medium">{likesCount}</span>
              </button>
            </div>
            
            {flashcardSet.isDerived && flashcardSet.originalSetId && (
              <p className="mt-1 text-white/70 text-xs sm:text-sm">
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mx-6 my-4 flex">
              <InfoIcon className="w-5 h-5 text-[#004a74] mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-medium text-[#004a74]">
                  What would you like to do with this set?
                </h3>
                <ul className="mt-2 text-sm text-[#004a74]/80 space-y-1">
                  <li>• View all flashcards in the default view below</li>
                  <li>• Start a flashcard study session with the "Study Flashcards" button</li>
                  <li>• Test your knowledge with the "Take Quiz" button</li>
                  <li>• Like the set to show your appreciation</li>
                </ul>
              </div>
              <button 
                onClick={() => {
                  setShowInfo(false);
                  localStorage.setItem('hideViewerInfoTips', 'true');
                }}
                className="text-[#004a74] hover:bg-blue-100 p-1 rounded-full h-6 w-6 flex items-center justify-center"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {/* View Mode Buttons */}
          <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={navigateToFlashcardView}
              className={`py-4 sm:py-6 px-3 sm:px-4 rounded-xl font-bold text-base sm:text-lg transition-all
                ${viewMode === 'flashcards'
                  ? 'bg-gradient-to-r from-[#004a74] to-[#0074c2] text-white shadow-lg'
                  : 'bg-white text-[#004a74] border border-[#004a74]/20 hover:bg-[#e3f3ff] hover:shadow-md'
                } group flex items-center justify-center gap-2`}
            >
              <div className={`${viewMode === 'flashcards' ? 'bg-white/20' : 'bg-blue-100'} p-1.5 sm:p-2 rounded-lg group-hover:scale-110 transition-transform`}>
                <BookIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${viewMode === 'flashcards' ? 'text-white' : 'text-[#004a74]'}`} />
              </div>
              <span>Study Flashcards</span>
            </button>
            
            <button 
              onClick={navigateToQuizView}
              className={`py-4 sm:py-6 px-3 sm:px-4 rounded-xl font-bold text-base sm:text-lg transition-all
                ${viewMode === 'quiz'
                  ? 'bg-gradient-to-r from-[#004a74] to-[#0074c2] text-white shadow-lg'
                  : 'bg-white text-[#004a74] border border-[#004a74]/20 hover:bg-[#e3f3ff] hover:shadow-md'
                } group flex items-center justify-center gap-2`}
            >
              <div className={`${viewMode === 'quiz' ? 'bg-white/20' : 'bg-blue-100'} p-1.5 sm:p-2 rounded-lg group-hover:scale-110 transition-transform`}>
                <ClipboardListIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${viewMode === 'quiz' ? 'text-white' : 'text-[#004a74]'}`} />
              </div>
              <span>Take Quiz</span>
            </button>
          </div>
          
          {/* Additional actions */}
          <div className="flex justify-center gap-3 mt-4">
            <button className="flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm text-[#004a74] hover:bg-blue-50 rounded-lg transition-colors">
              <Share2Icon className="w-3 h-3 sm:w-4 sm:h-4" />
              Share
            </button>
            <button className="flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm text-[#004a74] hover:bg-blue-50 rounded-lg transition-colors">
              <DownloadIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              Export
            </button>
          </div>
        </div>
        </div>
            
        {/* Section Title */}
        <h2 className="text-2xl font-bold text-[#004a74] mb-4 ml-1 flex items-center">
          All Flashcards 
          <span className="ml-2 text-base font-normal bg-[#e3f3ff] text-[#004a74] px-3 py-1 rounded-lg">
            {flashcardSet.flashcards.length} card{flashcardSet.flashcards.length !== 1 ? 's' : ''}
          </span>
        </h2>

        {/* Flashcards */}
        <div className="space-y-6">
          {flashcardSet.flashcards.length === 0 ? (
            <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl text-center">
              <p className="text-xl text-[#004a74] mb-4">This set doesn't have any flashcards yet.</p>
              {isCreator ? (
                <button 
                  onClick={handleEditSet}
                  className="bg-gradient-to-r from-[#004a74] to-[#0074c2] text-white px-6 py-2.5 rounded-xl 
                    hover:from-[#00395c] hover:to-[#0068b0] transition-all shadow-md hover:shadow-lg"
                >
                  Add Flashcards
                </button>
              ) : null}
            </div>
          ) : (
            flashcardSet.flashcards.map((card, index) => (
              <div 
                key={index}
                className="bg-white border border-gray-200 rounded-2xl shadow-md overflow-hidden 
                  hover:shadow-lg transition-all hover:border-[#004a74]/30 transform-gpu hover:scale-[1.01]"
              >
                <div className="bg-gradient-to-r from-[#004a74] to-[#0060a1] text-white px-6 py-3 
                  flex items-center justify-between group-hover:from-[#00395c] group-hover:to-[#0074c2] 
                  transition-colors duration-300">
                  <span className="font-bold">Card {index + 1}</span>
                </div>
                <div className="p-6 grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-[#004a74] mb-3 flex items-center">
                      <span className="bg-[#e3f3ff] text-[#004a74] px-3 py-1 rounded-lg text-sm mr-2">Q</span>
                      Question
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-[#004a74]/30 transition-colors">
                      {card.questionImage && (
                        <div className="mb-3">
                          <div className="relative border rounded-lg overflow-hidden mb-2">
                            <img 
                              src={card.questionImage} 
                              alt="Question" 
                              className="w-full h-auto max-h-[150px] object-contain cursor-zoom-in" 
                              onClick={() => showImagePreview(card.questionImage || '')}
                            />
                            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                              <div className="bg-white/70 backdrop-blur-sm p-1.5 rounded-lg">
                                <SearchIcon className="w-5 h-5 text-[#004a74]" />
                              </div>
                            </div>
                          </div>
                          <div className="text-center text-xs text-gray-500 mt-1">Click image to enlarge</div>
                        </div>
                      )}
                      
                      {card.question && <p className="text-gray-800 whitespace-pre-wrap">{card.question}</p>}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#004a74] mb-3 flex items-center">
                      <span className="bg-[#e3f3ff] text-[#004a74] px-3 py-1 rounded-lg text-sm mr-2">A</span>
                      Answer
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-[#004a74]/30 transition-colors">
                      {card.answerImage && (
                        <div className="mb-3">
                          <div className="relative border rounded-lg overflow-hidden mb-2">
                            <img 
                              src={card.answerImage} 
                              alt="Answer" 
                              className="w-full h-auto max-h-[150px] object-contain cursor-zoom-in" 
                              onClick={() => showImagePreview(card.answerImage || '')}
                            />
                            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                              <div className="bg-white/70 backdrop-blur-sm p-1.5 rounded-lg">
                                <SearchIcon className="w-5 h-5 text-[#004a74]" />
                              </div>
                            </div>
                          </div>
                          <div className="text-center text-xs text-gray-500 mt-1">Click image to enlarge</div>
                        </div>
                      )}
                      
                      {card.answer && <p className="text-gray-800 whitespace-pre-wrap">{card.answer}</p>}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Actions footer */}
        {flashcardSet.flashcards.length > 0 && (
          <div className="mt-8 flex justify-center gap-4">
            <button
              onClick={navigateToFlashcardView}
              className="px-6 py-3 bg-white border-2 border-[#004a74] text-[#004a74] 
                rounded-xl hover:bg-blue-50 transition-all shadow-md hover:shadow-lg 
                flex items-center justify-center gap-2 group active:scale-[0.98]"
            >
              <div className="bg-blue-100 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
                <BookIcon className="w-5 h-5" />
              </div>
              <span className="font-bold">Start Studying</span>
            </button>
            
            <button 
              onClick={navigateToQuizView}
              className="px-6 py-3 bg-gradient-to-r from-[#004a74] to-[#0074c2] text-white rounded-xl 
                hover:from-[#00395c] hover:to-[#0068b0] transition-all shadow-xl hover:shadow-2xl 
                flex items-center justify-center gap-2 group active:scale-[0.98]"
            >
              <div className="bg-white/20 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
                <ClipboardListIcon className="w-5 h-5" />
              </div>
              <span className="font-bold">Take Quiz</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetViewingPage;