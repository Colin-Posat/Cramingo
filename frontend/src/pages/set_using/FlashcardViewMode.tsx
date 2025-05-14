// The main change is in the CSS styles that handle the flip animation
// Look for the updated flip-card styles in the useEffect hook

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Shuffle,
  AlertCircle,
  RefreshCcw,
  Search as SearchIcon,
  X as XIcon,
  Info as InfoIcon
} from 'lucide-react';
import NavBar from '../../components/NavBar';
import { API_BASE_URL } from '../../config/api';

// Type definitions
interface Flashcard {
  id: number;
  question: string;
  answer: string;
  questionImage?: string;
  answerImage?: string;
}

interface FlashcardViewModeProps {
  flashcards?: Flashcard[];
}

const FlashcardViewMode: React.FC<FlashcardViewModeProps> = ({ flashcards: propFlashcards }) => {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  
  // Create all useState hooks first to maintain consistent order
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [localFlashcards, setLocalFlashcards] = useState<Flashcard[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [showKeyboardHint, setShowKeyboardHint] = useState(true);
  // Add a state to track initial load to prevent animation stutter
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // State for standalone mode
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flashcardSet, setFlashcardSet] = useState<{
    title?: string;
    classCode?: string;
    flashcards: Omit<Flashcard, 'id'>[];
  }>({ flashcards: [] });

  // Create all refs before any other hooks
  const styleRef = useRef<HTMLStyleElement | null>(null);
  
  // Define callbacks before useEffect hooks
  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev);
    
    // Add visual pulse effect to the flip button
    const flipButton = document.getElementById('flip-button');
    if (flipButton) {
      flipButton.classList.add('flip-button-active');
      setTimeout(() => {
        flipButton.classList.remove('flip-button-active');
      }, 500);
    }
  }, []);

  const isStandalone = !propFlashcards;

  // Add the style to the document head
  useEffect(() => {
    // Only create the style if it doesn't already exist
    if (!styleRef.current) {
      // Add CSS to the document head
      const styleElement = document.createElement('style');
      styleRef.current = styleElement;
      styleElement.innerHTML = `
        /* New flip card styles based on the credit card example */
        .flip-card {
          perspective: 1000px;
          width: 100%;
          height: 400px;
          transform: translateZ(0);
          user-select: none;
          position: relative;
        }
        
        .flip-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
          transform-style: preserve-3d;
          will-change: transform;
          border-radius: 1rem;
        }
        
        .flip-card.flipped .flip-card-inner {
          transform: rotateY(180deg);
        }
        
        .flip-card-front, .flip-card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          transform: translateZ(0);
          border-radius: 1rem;
          overflow: hidden;
          box-shadow: 0 8px 14px 0 rgba(0,0,0,0.1);
        }
        
        /* NEW: Add fade effect when flipping */
        .flip-card-front {
          opacity: 1;
        }
        
        .ready-for-animation .flip-card-front {
          transition: opacity 0.3s ease;
        }
        
        .flip-card.flipped .flip-card-front {
          opacity: 0;
        }
        
        .flip-card-back {
          transform: rotateY(180deg) translateZ(0);
          opacity: 0;
        }
        
        .ready-for-animation .flip-card-back {
          transition: opacity 0.3s ease;
        }
        
        .flip-card.flipped .flip-card-back {
          opacity: 1;
        }
        
        .ready-for-animation.flip-card.flipped .flip-card-back {
          transition: opacity 0.3s ease 0.3s; /* Delay the fade-in until rotation starts */
        }
        
        /* Card container styling */
        .card-container {
          border: 1px solid rgba(209, 213, 219, 1);
          border-radius: 1rem;
          background-color: white;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          transition: box-shadow 0.2s ease-out;
        }
        
        .card-container:hover {
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border-color: rgba(0, 74, 116, 0.3);
        }
        
        /* Revised button glow effect */
        #flip-button {
          position: relative;
          overflow: visible;
        }
        
        #flip-button::after {
          content: '';
          position: absolute;
          top: -4px;
          left: -4px;
          right: -4px;
          bottom: -4px;
          border-radius: 0.875rem;
          box-shadow: 0 0 0 0 rgba(0, 74, 116, 0);
          opacity: 0;
          transition: opacity 0.2s ease;
          pointer-events: none;
        }
        
        .flip-button-active::after {
          animation: clean-button-glow 0.5s ease forwards;
        }
        
        @keyframes clean-button-glow {
          0% { 
            box-shadow: 0 0 0 0 rgba(0, 74, 116, 0.7); 
            opacity: 0;
          }
          50% { 
            box-shadow: 0 0 15px 3px rgba(0, 74, 116, 0.5); 
            opacity: 1;
          }
          100% { 
            box-shadow: 0 0 0 0 rgba(0, 74, 116, 0); 
            opacity: 0;
          }
        }
        
        /* Added fade animation for card content */
        @keyframes contentFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .flip-card-content {
          animation: contentFadeIn 0.4s ease-out;
        }
        
        /* Image modal animations */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        /* Make images more obviously clickable */
        .cursor-zoom-in {
          cursor: zoom-in;
        }
        
        .cursor-zoom-in:hover::after {
          content: '';
          position: absolute;
          inset: 0;
          background-color: rgba(0, 74, 116, 0.1);
          border-radius: 0.5rem;
          pointer-events: none;
        }
        
        /* Ensure text cannot be selected anywhere in the component */
        .no-select {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
      `;
      document.head.appendChild(styleElement);
    }

    // Clean up the style element when the component unmounts
    return () => {
      if (styleRef.current && document.head.contains(styleRef.current)) {
        document.head.removeChild(styleRef.current);
        styleRef.current = null;
      }
    };
  }, []);
  
  // Other useEffect hooks in the same order as original
  useEffect(() => {
    if (isStandalone && setId) {
      fetchFlashcardSet();
    }
  }, [isStandalone, setId]);

  useEffect(() => {
    const cards = (propFlashcards || flashcardSet.flashcards || []).map((card, index) => ({
      ...card,
      id: index
    }));
    setLocalFlashcards([...cards]);
    setCurrentIndex(0);
    setIsFlipped(false);
    
    // Set a small timeout to handle the initial load state
    setTimeout(() => {
      setIsInitialLoad(false);
    }, 100);
  }, [propFlashcards, flashcardSet.flashcards]);

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (expandedImage || isShuffling) return;

      // Flip card on spacebar
      if (event.code === 'Space') {
        event.preventDefault();
        handleFlip();
      }
      // Previous card
      else if (event.code === 'ArrowLeft' && currentIndex > 0) {
        event.preventDefault();
        goToPrevCard();
      }
      // Next card
      else if (event.code === 'ArrowRight' && currentIndex < localFlashcards.length - 1) {
        event.preventDefault();
        goToNextCard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [expandedImage, isShuffling, currentIndex, localFlashcards.length, handleFlip]);

  const fetchFlashcardSet = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/sets/${setId}`, { credentials: 'include' });
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const data = await response.json();
      setFlashcardSet(data);
    } catch (error) {
      console.error('Error fetching flashcard set:', error);
      setError("Failed to load flashcard set. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const goToNextCard = () => {
    if (currentIndex < localFlashcards.length - 1) {
      setIsFlipped(false);
      setCurrentIndex(prevIndex => prevIndex + 1);
    }
  };

  const goToPrevCard = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setCurrentIndex(prevIndex => prevIndex - 1);
    }
  };

  const shuffleCards = () => {
    if (localFlashcards.length <= 1) return;
    setIsShuffling(true);
    const shuffled = [...localFlashcards].sort(() => Math.random() - 0.5);
    setLocalFlashcards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setTimeout(() => setIsShuffling(false), 50);
  };

  const handleImageClick = (imageUrl: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card flip
    setExpandedImage(imageUrl);
  };

  const closeExpandedImage = () => {
    setExpandedImage(null);
  };

  // Loading state
  if (isStandalone) {
    if (loading) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-white to-blue-50/50">
          <NavBar />
          <div className="pt-24 px-6 pb-6 flex items-center justify-center h-[calc(100vh-9rem)]">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004a74]"></div>
              <p className="mt-4 text-[#004a74] font-medium">Loading flashcards...</p>
            </div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-white to-blue-50/50">
          <NavBar />
          <div className="pt-24 px-6 pb-6 max-w-7xl mx-auto">
            <div className="bg-red-100 border border-red-200 p-6 rounded-xl shadow-md flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-bold text-red-800 text-lg mb-2">Error Loading Flashcards</p>
                <p className="text-red-700 mb-4">{error}</p>
                <div className="flex gap-4">
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm shadow-sm hover:shadow transition-all active:scale-[0.98]"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => navigate('/created-sets')}
                    className="bg-[#004a74] hover:bg-[#00395c] text-white px-4 py-2 rounded-xl text-sm shadow-sm hover:shadow transition-all active:scale-[0.98]"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1 inline" /> Back to Created Sets
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  const noCardsAvailable = !localFlashcards || localFlashcards.length === 0;

  if (isStandalone && noCardsAvailable) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-blue-50/50">
        <NavBar />
        <div className="pt-24 px-6 pb-6 max-w-7xl mx-auto">
          <div className="bg-blue-50 p-6 rounded-xl text-center border border-blue-200 mb-4 shadow-md">
            <p className="text-xl text-[#004a74] mb-4">This set doesn't have any flashcards yet.</p>
            <button
              onClick={() => navigate(`/set-creator`)}
              className="px-6 py-3 bg-gradient-to-r from-[#004a74] to-[#0074c2] text-white rounded-xl
                hover:from-[#00395c] hover:to-[#0068b0] transition-all shadow-xl hover:shadow-2xl
                flex items-center justify-center gap-2 group active:scale-[0.98] mx-auto"
            >
              <span className="font-bold">Add Flashcards</span>
            </button>
          </div>
          <button
            onClick={() => navigate('/created-sets')}
            className="flex items-center text-sm bg-white px-4 py-2.5 rounded-xl shadow-sm
              border border-[#004a74]/20 text-[#004a74] hover:bg-blue-50 transition-colors
              group active:scale-[0.98]"
          >
            <ChevronLeft className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
            Back to Created Sets
          </button>
        </div>
      </div>
    );
  } else if (!isStandalone && noCardsAvailable) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-blue-50 rounded-xl text-center border border-blue-200 shadow-md">
        <p className="text-2xl text-[#004a74] font-medium mb-4">No flashcards in this set</p>
        <p className="text-gray-600">Add some flashcards to start studying!</p>
      </div>
    );
  }

  const totalCards = localFlashcards.length;
  const currentCard = localFlashcards[currentIndex];

  if (noCardsAvailable || !currentCard) {
     // This block handles the case where flashcards are expected but not available or the current card is undefined
     if (isStandalone) {
          return (
            <div className="min-h-screen bg-gradient-to-b from-white to-blue-50/50">
              <NavBar />
              <div className="pt-24 px-6 pb-6 max-w-7xl mx-auto">
                <div className="bg-red-100 border border-red-200 p-6 rounded-xl shadow-md flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-bold text-red-800 text-lg mb-2">Error Loading Flashcards</p>
                    <p className="text-red-700 mb-4">Could not load flashcards or current card. Please try again.</p>
                     <button
                       onClick={() => window.location.reload()}
                       className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm shadow-sm hover:shadow transition-all active:scale-[0.98]"
                     >
                       Try Again
                     </button>
                  </div>
                </div>
              </div>
            </div>
          );
     } else {
       // Case for when propFlashcards is provided but is empty or currentCard is undefined
       return (
        <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-xl text-center border border-red-200">
          <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
          <p className="text-xl text-red-700">Error: Could not load flashcards or the current card.</p>
        </div>
       );
     }
  }

  // Image expanded modal - improved with animation and better UI
  const ImageExpandedModal = () => {
    if (!expandedImage) return null;

    return (
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-select"
        style={{ animation: 'fadeIn 0.2s ease-out' }}
        onClick={closeExpandedImage}
      >
        <div
          className="max-w-4xl max-h-[90vh] flex flex-col items-center"
          style={{ 
            animation: 'scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            transform: 'translateZ(0)' // Force GPU acceleration
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={expandedImage}
            alt="Preview"
            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
          />
          <button
            onClick={closeExpandedImage}
            className="mt-4 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <XIcon className="w-4 h-4" />
            Close Preview
          </button>
        </div>
      </div>
    );
  };

  // Flashcard Element - updated with new flip card animation
  const FlashcardElement = () => (
    <div className="flex flex-col items-center w-full no-select">
      {/* Image expanded modal */}
      <ImageExpandedModal />

      {/* Top section */}
      <div className="w-full max-w-7xl mx-auto mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-[#004a74]">Card {currentIndex + 1} of {totalCards}</span>
          <button
            onClick={shuffleCards}
            disabled={totalCards <= 1 || isShuffling}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors duration-150
              ${(totalCards <= 1 || isShuffling)
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-[#004a74] border border-[#004a74]/30 hover:bg-blue-50 active:scale-[0.98]'}`}
          >
            <Shuffle className="w-4 h-4" /> Shuffle
          </button>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-gradient-to-r from-[#004a74] to-[#0074c2] h-2.5 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Updated Flashcard Implementation with New Flip and Fade Animation */}
      <div className="w-full max-w-4xl mb-8 mx-auto">
        <div className={`flip-card ${isFlipped ? 'flipped' : ''} ${!isInitialLoad ? 'ready-for-animation' : ''}`}>
          <div className="flip-card-inner">
            {/* Front Side (Question) */}
            <div 
              onClick={handleFlip}
              className="flip-card-front card-container p-6 md:p-8
                flex flex-col items-center justify-center overflow-auto cursor-pointer"
            >
              <div className="absolute top-6 left-6 bg-[#e3f3ff] text-[#004a74] px-3 py-1 rounded-lg text-sm">Question</div>
              <div className="absolute top-6 right-6 text-xs text-gray-400 px-2 py-1 bg-gray-100 rounded-lg">
                Click to flip
              </div>

              <div className={`w-full flex flex-col items-center gap-4 mt-6 ${!isInitialLoad ? 'flip-card-content' : ''}`}>
                {/* Question Image */}
                {currentCard.questionImage && (
                  <div className="relative w-full max-w-md">
                    <div className="relative border rounded-lg overflow-hidden mb-2">
                      <div 
                        className="cursor-zoom-in" 
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card flip
                          handleImageClick(currentCard.questionImage!, e);
                        }}
                      >
                        <img
                          src={currentCard.questionImage}
                          alt="Question"
                          className="max-w-full rounded-lg h-48 object-contain mx-auto"
                        />
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                          <div className="bg-white/70 backdrop-blur-sm p-1.5 rounded-lg">
                            <SearchIcon className="w-5 h-5 text-[#004a74]" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-center text-xs text-gray-500 mt-1">Click image to enlarge</div>
                  </div>
                )}

                {/* Question Text */}
                <div className="text-xl md:text-2xl text-center text-gray-800 whitespace-pre-wrap break-words w-full no-select">
                  {currentCard.question}
                </div>
              </div>
            </div>

            {/* Back Side (Answer) */}
            <div
              onClick={handleFlip}
              className="flip-card-back card-container p-6 md:p-8
                flex flex-col items-center justify-center overflow-auto cursor-pointer"
            >
              <div className="absolute top-6 left-6 bg-[#e3f3ff] text-[#004a74] px-3 py-1 rounded-lg text-sm">Answer</div>
              <div className="absolute top-6 right-6 text-xs text-gray-400 px-2 py-1 bg-gray-100 rounded-lg">
                Click to flip
              </div>

              <div className={`w-full flex flex-col items-center gap-4 mt-6 ${!isInitialLoad ? 'flip-card-content' : ''}`}>
                {/* Answer Image */}
                {currentCard.answerImage && (
                  <div className="relative w-full max-w-md">
                    <div className="relative border rounded-lg overflow-hidden mb-2">
                      <div 
                        className="cursor-zoom-in" 
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card flip
                          handleImageClick(currentCard.answerImage!, e);
                        }}
                      >
                        <img
                          src={currentCard.answerImage}
                          alt="Answer"
                          className="max-w-full rounded-lg h-48 object-contain mx-auto"
                        />
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                          <div className="bg-white/70 backdrop-blur-sm p-1.5 rounded-lg">
                            <SearchIcon className="w-5 h-5 text-[#004a74]" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-center text-xs text-gray-500 mt-1">Click image to enlarge</div>
                  </div>
                )}

                {/* Answer Text */}
                <div className="text-xl md:text-2xl text-center text-gray-800 whitespace-pre-wrap break-words w-full no-select">
                  {currentCard.answer}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between w-full max-w-md mx-auto mt-2">
        <button
          onClick={goToPrevCard}
          disabled={currentIndex === 0 || isShuffling}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[#004a74] bg-white border border-[#004a74]/30
            hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          aria-label="Previous card"
        >
          <ChevronLeft className="w-5 h-5" /> Prev
        </button>

        {/* Explicit Flip Button with ID for animation */}
        <button
          id="flip-button"
          onClick={handleFlip}
          disabled={isShuffling}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white bg-gradient-to-r from-[#004a74] to-[#0074c2]
            hover:from-[#00395c] hover:to-[#0068b0] transition-colors disabled:opacity-50
            disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-[0.98]"
          aria-label="Flip card"
          title="Press Spacebar to flip"
        >
          <RefreshCcw className="w-5 h-5" /> Flip
        </button>

        <button
          onClick={goToNextCard}
          disabled={currentIndex === totalCards - 1 || isShuffling}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[#004a74] bg-white border border-[#004a74]/30
            hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          aria-label="Next card"
        >
          Next <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      
      {/* Keyboard shortcuts hint */}
      {showKeyboardHint && (
        <div className="mt-6 p-3 bg-blue-50 rounded-lg text-center text-sm text-[#004a74] opacity-80 max-w-md mx-auto">
          <div className="flex items-center justify-center gap-2">
            <InfoIcon className="w-4 h-4" />
            <span>
              <strong>Keyboard shortcuts:</strong> Spacebar to flip, Arrow keys to navigate
            </span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowKeyboardHint(false);
              }}
              className="ml-2 text-[#004a74]/70 hover:text-[#004a74]"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Render Logic
  if (isStandalone) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-blue-50/50">
        <NavBar />
        <div className="pt-24 pb-12 px-4 md:px-6 max-w-7xl mx-auto">
          <button
            onClick={() => navigate(`/study/${setId}`)}
            className="flex items-center text-sm bg-white px-4 py-2.5 rounded-xl shadow-sm
              border border-[#004a74]/20 text-[#004a74] hover:bg-blue-50 transition-colors
              group active:scale-[0.98] mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
            Back to Set Page
          </button>

          {flashcardSet.title && (
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-[#004a74]">
                {flashcardSet.title}
              </h1>
              {flashcardSet.classCode && (
                <span className="bg-white text-[#004a74] px-4 py-2 rounded-lg font-medium shadow-sm">
                  {flashcardSet.classCode}
                </span>
              )}
            </div>
          )}

          <FlashcardElement />
        </div>
      </div>
    );
  }

  return <FlashcardElement />;
};

export default FlashcardViewMode;