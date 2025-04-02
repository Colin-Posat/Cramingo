import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, X, ChevronRight, RotateCw, ChevronLeft, AlertCircle } from 'lucide-react';
import NavBar from '../../components/NavBar'; // Adjust the import path as needed

type Flashcard = {
  question: string;
  answer: string;
};

type QuizViewModeProps = {
  flashcards?: Flashcard[];
};

type QuizState = {
  currentIndex: number;
  showAnswer: boolean;
  userAnswers: string[];
  results: ('correct' | 'incorrect' | '')[];
  quizCompleted: boolean;
};

// Make sure to add the default export
const QuizViewMode: React.FC<QuizViewModeProps> = ({ flashcards: propFlashcards }) => {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  
  // State for standalone mode
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flashcardSet, setFlashcardSet] = useState<{
    title?: string;
    classCode?: string;
    flashcards: Flashcard[];
  }>({ flashcards: [] });
  
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState({ correct: 0, total: 0 });

  // Determine if component is being used standalone or as a child
  const isStandalone = !propFlashcards;
  
  // Get flashcards from props or fetched data
  const flashcards = propFlashcards || flashcardSet.flashcards || [];
  
  const [quizState, setQuizState] = useState<QuizState>({
    currentIndex: 0,
    showAnswer: false,
    userAnswers: Array(flashcards.length).fill(''),
    results: Array(flashcards.length).fill(''),
    quizCompleted: false
  });

  // Initialize quiz state when flashcards change
  useEffect(() => {
    setQuizState({
      currentIndex: 0,
      showAnswer: false,
      userAnswers: Array(flashcards.length).fill(''),
      results: Array(flashcards.length).fill(''),
      quizCompleted: false
    });
    setUserInput('');
    setScore({ correct: 0, total: 0 });
  }, [flashcards]);
  
  // Fetch data if in standalone mode
  useEffect(() => {
    if (isStandalone && setId) {
      fetchFlashcardSet();
    }
  }, [isStandalone, setId]);

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

  // Handle when there are no flashcards (embedded mode)
  if (!isStandalone && (!flashcards || flashcards.length === 0)) {
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
            <p className="mt-4 text-[#004a74] font-medium">Loading quiz...</p>
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
  if (isStandalone && (!flashcards || flashcards.length === 0)) {
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

  const totalCards = flashcards.length;
  const currentCard = flashcards[quizState.currentIndex];
  
  // Check answer and move to next card
  const checkAnswer = () => {
    const isCorrect = userInput.trim().toLowerCase() === currentCard.answer.trim().toLowerCase();
    
    setQuizState(prev => {
      const updatedUserAnswers = [...prev.userAnswers];
      updatedUserAnswers[prev.currentIndex] = userInput;
      
      const updatedResults = [...prev.results];
      updatedResults[prev.currentIndex] = isCorrect ? 'correct' : 'incorrect';
      
      return {
        ...prev,
        userAnswers: updatedUserAnswers,
        results: updatedResults,
        showAnswer: true
      };
    });
    
    // Update score
    setScore(prev => ({
      correct: isCorrect ? prev.correct + 1 : prev.correct,
      total: prev.total + 1
    }));
  };
  
  // Move to next question
  const nextQuestion = () => {
    if (quizState.currentIndex < totalCards - 1) {
      setQuizState(prev => ({
        ...prev,
        currentIndex: prev.currentIndex + 1,
        showAnswer: false
      }));
      setUserInput('');
    } else {
      // Quiz completed
      setQuizState(prev => ({
        ...prev,
        quizCompleted: true
      }));
    }
  };
  
  // Reset the quiz
  const resetQuiz = () => {
    setQuizState({
      currentIndex: 0,
      showAnswer: false,
      userAnswers: Array(flashcards.length).fill(''),
      results: Array(flashcards.length).fill(''),
      quizCompleted: false
    });
    setUserInput('');
    setScore({ correct: 0, total: 0 });
  };

  // Standalone wrapper for the quiz UI
  const renderQuizContent = () => {
    // Results screen
    if (quizState.quizCompleted) {
      const percentageScore = Math.round((score.correct / score.total) * 100);
      
      return (
        <div className="w-full max-w-4xl mx-auto mt-8 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-[#004a74] mb-6">Quiz Results</h2>
          
          <div className="text-6xl font-bold mb-6 text-center">
            {percentageScore}%
            <div className="text-2xl font-normal text-gray-600 mt-2">
              {score.correct} out of {score.total} correct
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-6 mb-8">
            <div 
              className={`h-6 rounded-full ${
                percentageScore >= 80 ? 'bg-green-500' : 
                percentageScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${percentageScore}%` }}
            ></div>
          </div>
          
          <div className="w-full mb-8">
            <h3 className="text-2xl font-semibold mb-4 text-[#004a74]">Question Review:</h3>
            {flashcards.map((card, index) => (
              <div key={index} className="mb-6 border-b pb-4">
                <div className="flex items-center gap-2 mb-2">
                  {quizState.results[index] === 'correct' ? (
                    <Check className="w-6 h-6 text-green-500" />
                  ) : (
                    <X className="w-6 h-6 text-red-500" />
                  )}
                  <p className="font-medium text-lg">Question {index + 1}:</p>
                </div>
                <p className="mb-2 pl-7 text-lg">{card.question}</p>
                <div className="pl-7">
                  <p className="text-base text-gray-600">Your answer:</p>
                  <p className={`font-medium text-lg ${
                    quizState.results[index] === 'correct' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {quizState.userAnswers[index] || '(No answer provided)'}
                  </p>
                  
                  {quizState.results[index] === 'incorrect' && (
                    <div className="mt-1">
                      <p className="text-base text-gray-600">Correct answer:</p>
                      <p className="text-green-600 font-medium text-lg">{card.answer}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-center">
            <button 
              onClick={resetQuiz}
              className="flex items-center gap-2 bg-[#004a74] text-white px-8 py-4 rounded-xl
                hover:bg-[#00659f] transition-all font-bold text-xl"
            >
              <RotateCw className="w-6 h-6" />
              Take Quiz Again
            </button>
          </div>
        </div>
      );
    }

    // Quiz taking screen
    return (
      <div className="flex flex-col items-center w-full max-w-4xl mx-auto">
        {/* Progress */}
        <div className="w-full mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-2xl font-bold text-[#004a74]">
              Question {quizState.currentIndex + 1} of {totalCards}
            </span>
            <span className="text-2xl font-bold text-[#004a74]">
              Score: {score.correct}/{score.total}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-[#004a74] h-4 rounded-full transition-all" 
              style={{ width: `${((quizState.currentIndex) / totalCards) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question card */}
        <div className="w-full bg-[#004a74] rounded-xl shadow-xl p-8 mb-10"
             style={{boxShadow: '0 15px 30px rgba(0, 0, 0, 0.2)', minHeight: '550px'}}>
          <h3 className="text-white text-2xl font-bold mb-6">Question:</h3>
          <div className="bg-white text-black rounded-lg p-8 mb-6 h-48 flex items-center justify-center overflow-auto shadow-inner">
            <p className="text-2xl">{currentCard.question}</p>
          </div>
          
          {quizState.showAnswer ? (
            <div className="bg-gray-100 rounded-lg p-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-[#004a74] font-bold text-xl">Your Answer:</h3>
                {quizState.results[quizState.currentIndex] === 'correct' ? (
                  <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full flex items-center gap-1 text-lg">
                    <Check className="w-5 h-5" /> Correct
                  </span>
                ) : (
                  <span className="bg-red-100 text-red-800 px-4 py-2 rounded-full flex items-center gap-1 text-lg">
                    <X className="w-5 h-5" /> Incorrect
                  </span>
                )}
              </div>
              <p className="text-xl">{userInput || "(No answer provided)"}</p>
              
              {quizState.results[quizState.currentIndex] === 'incorrect' && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h3 className="text-[#004a74] font-bold text-xl">Correct Answer:</h3>
                  <p className="text-xl">{currentCard.answer}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full p-4 rounded-lg border-2 border-gray-300 focus:border-[#004a74] focus:outline-none
                  h-36 resize-none text-xl"
              />
              <button 
                onClick={checkAnswer}
                className="bg-white text-[#004a74] py-4 px-6 rounded-lg hover:bg-blue-50
                  transition-colors font-bold text-xl"
              >
                Check Answer
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        {quizState.showAnswer && (
          <div className="flex justify-center w-full mt-4">
            <button 
              onClick={nextQuestion}
              className="flex items-center gap-3 bg-[#004a74] text-white px-8 py-4 rounded-xl
                hover:bg-[#00659f] transition-all font-bold text-xl shadow-md hover:shadow-lg"
            >
              {quizState.currentIndex < totalCards - 1 ? (
                <>
                  Next Question
                  <ChevronRight className="w-6 h-6" />
                </>
              ) : (
                'See Results'
              )}
            </button>
          </div>
        )}
      </div>
    );
  };

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
          
          {/* Main quiz content */}
          {renderQuizContent()}
        </div>
      </div>
    );
  }

  // Embedded version (used as a child component)
  return renderQuizContent();
};

// Make sure to add the default export
export default QuizViewMode;