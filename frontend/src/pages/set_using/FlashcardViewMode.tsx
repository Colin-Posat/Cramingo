import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, RotateCw, AlertCircle, Shuffle } from 'lucide-react';
import NavBar from '../../components/NavBar'; // Adjust the import path as needed

type Flashcard = {
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
  // Remove isTransitioning state since we're not using it anymore
  const [localFlashcards, setLocalFlashcards] = useState<Flashcard[]>([]);
  
  // State for standalone mode
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flashcardSet, setFlashcardSet] = useState<{
    title?: string;
    classCode?: string;
    flashcards: Flashcard[];
  }>({ flashcards: [] });

  // Determine if component is being used standalone or as a child
  const isStandalone = !propFlashcards;
  
  // Fetch data if in standalone mode
  useEffect(() => {
    if (isStandalone && setId) {
      fetchFlashcardSet();
    }
  }, [isStandalone, setId]);

  // Initialize local flashcards when props or fetched data changes
  useEffect(() => {
    const cards = propFlashcards || flashcardSet.flashcards || [];
    setLocalFlashcards([...cards]);
  }, [propFlashcards, flashcardSet.flashcards]);

  // Fetch flashcard set data
  const fetchFlashcardSet = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:6500/api/sets/${setId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      
      const data = await response.json();
      setFlashcardSet(data);
    } catch (error) {
      console.error('Error fetching flashcard set:', error);
      setError("Failed to load flashcard set. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };
  
  // Handle when there are no flashcards
  if (!isStandalone && (!localFlashcards || localFlashcards.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-blue-50 rounded-xl text-center">
        <p className="text-2xl text-[#004a74] font-medium mb-4">No flashcards in this set</p>
        <p className="text-gray-600">Add some flashcards to start studying!</p>
      </div>
    );
  }

  // Loading state
  if (isStandalone && loading) {
    return (
      <div className="min-h-screen bg-white">
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

  // Error state
  if (isStandalone && error) {
    return (
      <div className="min-h-screen bg-white">
        <NavBar />
        <div className="pt-24 px-6 pb-6">
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
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
          <button 
            onClick={() => navigate('/created-sets')}
            className="mt-4 bg-[#004a74] text-white px-4 py-2 rounded flex items-center"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to Created Sets
          </button>
        </div>
      </div>
    );
  }
  
  // Empty state - after loading completed
  if (isStandalone && (!localFlashcards || localFlashcards.length === 0)) {
    return (
      <div className="min-h-screen bg-white">
        <NavBar />
        <div className="pt-24 px-6 pb-6">
          <div className="bg-blue-50 p-6 rounded-xl text-center">
            <p className="text-xl text-[#004a74]">This set doesn't have any flashcards yet.</p>
            <button 
              onClick={() => navigate(`/set-creator`)}
              className="mt-4 bg-[#004a74] text-white px-6 py-2 rounded-lg hover:bg-[#00659f] transition-all"
            >
              Add Flashcards
            </button>
          </div>
          <button 
            onClick={() => navigate('/created-sets')}
            className="mt-4 bg-[#004a74] text-white px-4 py-2 rounded flex items-center"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to Created Sets
          </button>
        </div>
      </div>
    );
  }

  const totalCards = localFlashcards.length;
  const currentCard = localFlashcards[currentIndex];

  const goToNextCard = () => {
    if (currentIndex < totalCards - 1) {
      // Just switch instantly without buffer
      setShowAnswer(false);
      setCurrentIndex(prevIndex => prevIndex + 1);
    }
  };

  const goToPrevCard = () => {
    if (currentIndex > 0) {
      // Just switch instantly without buffer
      setShowAnswer(false);
      setCurrentIndex(prevIndex => prevIndex - 1);
    }
  };

  const toggleCardSide = () => {
    setShowAnswer(!showAnswer);
  };

  const shuffleCards = () => {
    // Create a shuffled copy of the flashcards
    const shuffled = [...localFlashcards].sort(() => Math.random() - 0.5);
    setLocalFlashcards(shuffled);
    setCurrentIndex(0);
    setShowAnswer(false);
  };

  // Common flashcard component to reuse in both standalone and embedded modes
  const FlashcardElement = () => (
    <div className="flex flex-col items-center w-full">
      {/* Card counter and shuffle button */}
      <div className="flex justify-between items-center w-full max-w-4xl mx-auto mb-6">
        <div className="text-2xl font-bold text-[#004a74]">
          Card {currentIndex + 1} of {totalCards}
        </div>
        <button
          onClick={shuffleCards}
          disabled={totalCards <= 1}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg
            transition-all ${
              totalCards <= 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-[#004a74] text-white hover:bg-[#00659f]'
            }`}
        >
          <Shuffle className="w-5 h-5" />
          Shuffle
        </button>
      </div>

      {/* Simple Flashcard without animations */}
      <div className="w-full max-w-4xl h-96 mb-10 mx-auto">
        <div 
          onClick={toggleCardSide}
          className="w-full h-full bg-[#004a74] rounded-xl shadow-xl cursor-pointer"
          style={{boxShadow: '0 15px 30px rgba(0, 0, 0, 0.2)'}}
        >
          <div className="flex flex-col items-center h-full p-10">
            <span className="text-white text-2xl font-bold mb-6">
              {showAnswer ? 'Answer' : 'Question'}
            </span>
            <div className="bg-white text-black rounded-lg p-8 w-full flex-grow flex items-center justify-center overflow-auto shadow-inner">
              <p className="text-2xl text-center">
                {showAnswer ? currentCard.answer : currentCard.question}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation controls */}
      <div className="flex items-center justify-between w-full max-w-xl mx-auto mt-4">
        <button 
          onClick={goToPrevCard} 
          disabled={currentIndex === 0}
          className={`flex items-center justify-center p-5 rounded-full shadow-md
            ${currentIndex === 0
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
              : 'bg-[#004a74] text-white hover:bg-[#00659f] hover:shadow-lg'} 
            transition-all`}
        >
          <ChevronLeft className="w-8 h-8" />
        </button>

        <button 
          onClick={toggleCardSide}
          className="flex items-center gap-3 px-8 py-4 rounded-xl shadow-md text-lg
            transition-all font-medium bg-blue-100 text-[#004a74] hover:bg-blue-200 hover:shadow-lg"
        >
          <RotateCw className="w-6 h-6" />
          Flip Card
        </button>

        <button 
          onClick={goToNextCard} 
          disabled={currentIndex === totalCards - 1}
          className={`flex items-center justify-center p-5 rounded-full shadow-md
            ${currentIndex === totalCards - 1
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
              : 'bg-[#004a74] text-white hover:bg-[#00659f] hover:shadow-lg'} 
            transition-all`}
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>
    </div>
  );

  // Standalone view with navbar
  if (isStandalone) {
    return (
      <div className="min-h-screen bg-white">
        <NavBar />
        
        <div className="pt-20 px-6 md:px-12 max-w-6xl mx-auto">
          {/* Back Button */}
          <button 
            onClick={() => navigate(`/study/${setId}`)}
            className="mb-6 flex items-center text-[#004a74] hover:underline"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to Set
          </button>
          
          {/* Set Title if available */}
          {flashcardSet.title && (
            <h1 className="text-2xl font-bold text-[#004a74] mb-4">{flashcardSet.title}</h1>
          )}
          
          {/* Main flashcard content */}
          <FlashcardElement />
        </div>
      </div>
    );
  }

  // Embedded version (used as a child component)
  return <FlashcardElement />;
};

export default FlashcardViewMode;