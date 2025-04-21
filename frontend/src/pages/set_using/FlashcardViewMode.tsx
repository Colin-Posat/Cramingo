import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Shuffle, AlertCircle, RefreshCcw } from 'lucide-react';
import NavBar from '../../components/NavBar'; // Adjust the import path as needed
import { API_BASE_URL, getApiUrl } from '../../config/api'; // Adjust path as needed

type Flashcard = {
  id: number;
  question: string;
  answer: string;
};

type FlashcardViewModeProps = {
  flashcards?: Flashcard[];
};

const FlashcardViewMode: React.FC<FlashcardViewModeProps> = ({ flashcards: propFlashcards }) => {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [localFlashcards, setLocalFlashcards] = useState<Flashcard[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);

  // State for standalone mode
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flashcardSet, setFlashcardSet] = useState<{
    title?: string;
    classCode?: string;
    flashcards: Omit<Flashcard, 'id'>[];
  }>({ flashcards: [] });

  const isStandalone = !propFlashcards;

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
    setShowAnswer(false);
  }, [propFlashcards, flashcardSet.flashcards]);

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
      setShowAnswer(false);
      setCurrentIndex(prevIndex => prevIndex + 1);
    }
  };

  const goToPrevCard = () => {
    if (currentIndex > 0) {
      setShowAnswer(false);
      setCurrentIndex(prevIndex => prevIndex - 1);
    }
  };

  const toggleCardSide = () => {
    setShowAnswer(!showAnswer);
  };

  const shuffleCards = () => {
    if (localFlashcards.length <= 1) return;
    setIsShuffling(true);
    const shuffled = [...localFlashcards].sort(() => Math.random() - 0.5);
    setLocalFlashcards(shuffled);
    setCurrentIndex(0);
    setShowAnswer(false);
    setTimeout(() => setIsShuffling(false), 50);
  };

  // Loading state
  if (isStandalone) {
    if (loading) {
      return (
        <div className="min-h-screen bg-gray-50">
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
        <div className="min-h-screen bg-gray-50">
          <NavBar />
          <div className="pt-24 px-6 pb-6 max-w-7xl mx-auto">
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded flex items-start mb-4">
              <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold">Error</p>
                <p>{error}</p>
                <button onClick={() => window.location.reload()} className="mt-2 bg-red-700 text-white px-4 py-1 rounded text-sm hover:bg-red-800 transition">Try Again</button>
              </div>
            </div>
            <button onClick={() => navigate('/created-sets')} className="bg-[#004a74] text-white px-4 py-2 rounded flex items-center text-sm hover:bg-[#00659f]"> <ChevronLeft className="w-4 h-4 mr-1" /> Back to Created Sets </button>
          </div>
        </div>
      );
    }
  }

  const noCardsAvailable = !localFlashcards || localFlashcards.length === 0;

  if (isStandalone && noCardsAvailable) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="pt-24 px-6 pb-6 max-w-7xl mx-auto">
          <div className="bg-blue-50 p-6 rounded-xl text-center border border-blue-200 mb-4">
            <p className="text-xl text-[#004a74]">This set doesn't have any flashcards yet.</p>
            <button onClick={() => navigate(`/set-creator`)} className="mt-4 bg-[#004a74] text-white px-6 py-2 rounded-lg hover:bg-[#00659f] transition-all"> Add Flashcards </button>
          </div>
          <button onClick={() => navigate('/created-sets')} className="bg-[#004a74] text-white px-4 py-2 rounded flex items-center text-sm hover:bg-[#00659f]"> <ChevronLeft className="w-4 h-4 mr-1" /> Back to Created Sets </button>
        </div>
      </div>
    );
  } else if (!isStandalone && noCardsAvailable) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-blue-50 rounded-xl text-center border border-blue-200">
        <p className="text-2xl text-[#004a74] font-medium mb-4">No flashcards in this set</p>
        <p className="text-gray-600">Add some flashcards to start studying!</p>
      </div>
    );
  }

  if (noCardsAvailable) { return <div>Error loading flashcards.</div>; }

  const totalCards = localFlashcards.length;
  const currentCard = localFlashcards[currentIndex];
  if (!currentCard) { return <div>Error: Could not load the current card.</div>; }

  // Modified FlashcardElement with click-to-flip and explicit flip button
  const FlashcardElement = () => (
    <div className="flex flex-col items-center w-full">
      {/* Top section */}
      <div className="w-full max-w-7xl mx-auto mb-4">
        <div className="flex justify-between items-center mb-2 text-sm text-gray-600">
          <span>Card {currentIndex + 1} of {totalCards}</span>
          <button 
            onClick={shuffleCards} 
            disabled={totalCards <= 1 || isShuffling} 
            className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs transition-colors duration-150 ${(totalCards <= 1 || isShuffling) ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white text-[#004a74] border border-[#004a74] hover:bg-blue-50'}`}
          >
            <Shuffle className="w-3 h-3" /> Shuffle 
          </button>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-[#004a74] h-2.5 rounded-full transition-all duration-300 ease-out" 
            style={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Flashcard with Flip Animation - Now clickable and with explicit flip button */}
      <div className="w-full max-w-7xl h-96 mb-6 mx-auto [perspective:1000px]">
        <div 
          key={currentCard.id} 
          className="relative w-full h-full [transform-style:preserve-3d]"
          onClick={toggleCardSide}
        >
          {/* Front Face (Question) */}
          <div 
            className={`
              absolute w-full h-full 
              [backface-visibility:hidden]
              bg-white border border-gray-200 rounded-xl 
              shadow-lg p-6 md:p-8 
              flex flex-col items-center justify-center 
              overflow-hidden 
              transition-transform duration-700 ease-in-out
              cursor-pointer hover:shadow-xl
              ${showAnswer ? '[transform:rotateY(180deg)]' : '[transform:rotateY(0deg)]'}
            `}
          >
            <span className="absolute top-4 left-6 text-sm font-medium text-gray-500">Question</span>
            <div className="absolute top-4 right-6 text-xs text-gray-400">Click to flip</div>
            <p className="text-xl md:text-2xl text-center text-gray-800 break-words">
              {currentCard.question}
            </p>
          </div>

          {/* Back Face (Answer) */}
          <div 
            className={`
              absolute w-full h-full 
              [backface-visibility:hidden] 
              bg-white border border-gray-200 rounded-xl 
              shadow-lg p-6 md:p-8 
              flex flex-col items-center justify-center 
              overflow-hidden 
              transition-transform duration-700 ease-in-out
              cursor-pointer hover:shadow-xl
              ${showAnswer ? '[transform:rotateY(0deg)]' : '[transform:rotateY(180deg)]'}
            `}
          >
            <span className="absolute top-4 left-6 text-sm font-medium text-gray-500">Answer</span>
            <div className="absolute top-4 right-6 text-xs text-gray-400">Click to flip</div>
            <p className="text-xl md:text-2xl text-center text-gray-800 break-words">
              {currentCard.answer}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation controls - Added explicit Flip button */}
      <div className="flex items-center justify-between w-full max-w-md mx-auto mt-2">
        <button 
          onClick={goToPrevCard} 
          disabled={currentIndex === 0 || isShuffling} 
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[#004a74] bg-white border border-[#004a74] hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
          aria-label="Previous card"
        >
          <ChevronLeft className="w-5 h-5" /> Prev 
        </button>
        
        {/* New Explicit Flip Button */}
        <button 
          onClick={toggleCardSide} 
          disabled={isShuffling} 
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[#004a74] bg-white border border-[#004a74] hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
          aria-label="Flip card"
        >
          <RefreshCcw className="w-5 h-5" /> Flip
        </button>
        
        <button 
          onClick={goToNextCard} 
          disabled={currentIndex === totalCards - 1 || isShuffling} 
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[#004a74] bg-white border border-[#004a74] hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
          aria-label="Next card"
        >
          Next <ChevronRight className="w-5 h-5" /> 
        </button>
      </div>
    </div>
  );

  // Render Logic
  if (isStandalone) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="pt-24 pb-12 px-4 md:px-6 max-w-7xl mx-auto">
          <button 
            onClick={() => navigate(`/study/${setId}`)} 
            className="flex items-center text-sm bg-white px-3 py-2 rounded-lg shadow-sm border border-[#004a74]/20 text-[#004a74] hover:bg-[#e3f3ff] transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Set Page 
          </button>
          {flashcardSet.title && (
            <h1 className="text-2xl md:text-3xl font-bold text-[#004a74] mb-4 text-center md:text-left">
              {flashcardSet.title}
            </h1>
          )}
          <FlashcardElement />
        </div>
      </div>
    );
  }

  return <FlashcardElement />;
};

export default FlashcardViewMode;