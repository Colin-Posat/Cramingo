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
  Heart as HeartIcon
} from 'lucide-react';
import NavBar from '../../components/NavBar';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';

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

  // Likes state
  const [hasLiked, setHasLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);

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
        const response = await fetch(`${API_BASE_URL}/sets/${setId}`, {
          credentials: 'include'
        });
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        const text = await response.text();
        const data: FlashcardSet = JSON.parse(text);

        setFlashcardSet(data);
        setLikesCount(data.likes || 0);

        // Check saved status
        if (data.isDerived && data.userId === user.uid) {
          setIsSavedByCurrentUser(true);
        } else if (data.originalSetId) {
          const savedRes = await fetch(
            `${API_BASE_URL}/sets/saved/${user.uid}`,
            { credentials: 'include' }
          );
          if (savedRes.ok) {
            const savedSets: FlashcardSet[] = await savedRes.json();
            const isSaved = savedSets.some(s => 
              s.originalSetId === data.id && s.userId === user.uid
            );
            setIsSavedByCurrentUser(isSaved);
          }
        } else {
          // Check if the user has saved this set (even if not derived)
          const savedRes = await fetch(
            `${API_BASE_URL}/sets/saved/${user.uid}`,
            { credentials: 'include' }
          );
          if (savedRes.ok) {
            const savedSets: FlashcardSet[] = await savedRes.json();
            const isSaved = savedSets.some(s => 
              s.originalSetId === data.id && s.userId === user.uid
            );
            setIsSavedByCurrentUser(isSaved);
          }
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
    if (fromSearch) return 'Back to Search Results';
    if (fromPopularSets) return 'Back to Search Sets';
    return flashcardSet?.isDerived ? 'Back to Saved Sets' : 'Back to Created Sets';
  };

  const getBackLinkPath = () => {
    if (fromSearch) return `/search-results?q=${encodeURIComponent(searchQuery)}`;
    if (fromPopularSets) return '/search-sets';
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
      const res = await fetch(`${API_BASE_URL}/sets/save`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalSetId: flashcardSet?.id, userId: user.uid })
      });
      if (!res.ok) throw new Error('Save failed');
      const saved = await res.json();
      setIsSavedByCurrentUser(true);
      if (saved.id !== setId) {
        navigate(`/study/${saved.id}`, { state: { fromSearch, searchQuery } });
      }
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
      if (flashcardSet?.isDerived) {
        const res = await fetch(`${API_BASE_URL}/sets/unsave`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ setId: flashcardSet.id, userId: user.uid })
        });
        if (!res.ok) throw new Error('Unsave failed');
        navigate('/saved-sets');
      } else {
        const savedRes = await fetch(`${API_BASE_URL}/sets/saved/${user.uid}`, { credentials: 'include' });
        const savedSets: FlashcardSet[] = await savedRes.json();
        const savedCopy = savedSets.find(s => s.originalSetId === flashcardSet?.id && s.userId === user.uid);
        if (!savedCopy) throw new Error('No saved copy found');
        const res = await fetch(`${API_BASE_URL}/sets/unsave`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ setId: savedCopy.id, userId: user.uid })
        });
        if (!res.ok) throw new Error('Unsave failed');
        setIsSavedByCurrentUser(false);
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

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><NavBar /><div className="pt-24 px-6 pb-6 flex items-center justify-center h-[calc(100vh-9rem)]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004a74]"></div></div></div>
  );

  if (error || !flashcardSet) return (
    <div className="min-h-screen bg-gray-50"><NavBar /><div className="pt-24 px-6"><div className="bg-red-100 p-4 rounded flex items-start"><AlertCircleIcon /><div><p className="font-bold">Error</p><p>{error}</p><button onClick={() => window.location.reload()} className="mt-2 bg-red-700 text-white px-4 py-1 rounded text-sm">Try Again</button></div></div><button onClick={() => navigate('/created-sets')} className="mt-4 bg-[#004a74] text-white px-4 py-2 rounded">Back to Created Sets</button></div></div>
  );

  const isCreator = user?.uid === flashcardSet.userId && !flashcardSet.isDerived;

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
          
          {/* Conditionally render Edit or Unsave button */}
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
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowInfo(false);
                  localStorage.setItem('hideViewerInfoTips', 'true');
                }}
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
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      {card.questionImage && (
                        <div className="mb-3">
                          <img 
                            src={card.questionImage} 
                            alt="Question" 
                            className="max-w-full rounded-lg h-48 object-contain mx-auto border border-gray-200 hover:border-blue-400 transition-colors"
                            onClick={() => {
                              if (!card.questionImage) return; // Type safety check
                              
                              // Create a modal or lightbox effect
                              const modal = document.createElement('div');
                              modal.style.position = 'fixed';
                              modal.style.top = '0';
                              modal.style.left = '0';
                              modal.style.width = '100%';
                              modal.style.height = '100%';
                              modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                              modal.style.display = 'flex';
                              modal.style.alignItems = 'center';
                              modal.style.justifyContent = 'center';
                              modal.style.zIndex = '9999';
                              modal.style.cursor = 'pointer';
                              
                              // Add full-size image
                              const img = document.createElement('img');
                              img.src = card.questionImage; // Now safe because of check above
                              img.style.maxWidth = '90%';
                              img.style.maxHeight = '90%';
                              img.style.objectFit = 'contain';
                              
                              // Close on click
                              modal.onclick = () => {
                                document.body.removeChild(modal);
                              };
                              
                              modal.appendChild(img);
                              document.body.appendChild(modal);
                            }}
                            style={{ cursor: 'zoom-in' }}
                          />
                          <div className="text-center text-xs text-gray-500 mt-1">Click image to expand</div>
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
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      {card.answerImage && (
                        <div className="mb-3">
                          <img 
                            src={card.answerImage} 
                            alt="Answer" 
                            className="max-w-full rounded-lg h-48 object-contain mx-auto border border-gray-200 hover:border-blue-400 transition-colors"
                            onClick={() => {
                              if (!card.answerImage) return; // Type safety check
                              
                              // Create a modal or lightbox effect
                              const modal = document.createElement('div');
                              modal.style.position = 'fixed';
                              modal.style.top = '0';
                              modal.style.left = '0';
                              modal.style.width = '100%';
                              modal.style.height = '100%';
                              modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                              modal.style.display = 'flex';
                              modal.style.alignItems = 'center';
                              modal.style.justifyContent = 'center';
                              modal.style.zIndex = '9999';
                              modal.style.cursor = 'pointer';
                              
                              // Add full-size image
                              const img = document.createElement('img');
                              img.src = card.answerImage; // Now safe because of check above
                              img.style.maxWidth = '90%';
                              img.style.maxHeight = '90%';
                              img.style.objectFit = 'contain';
                              
                              // Close on click
                              modal.onclick = () => {
                                document.body.removeChild(modal);
                              };
                              
                              modal.appendChild(img);
                              document.body.appendChild(modal);
                            }}
                            style={{ cursor: 'zoom-in' }}
                          />
                          <div className="text-center text-xs text-gray-500 mt-1">Click image to expand</div>
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
      </div>
    </div>
  );
};

export default SetViewingPage;