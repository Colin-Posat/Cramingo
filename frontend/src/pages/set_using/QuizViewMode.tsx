import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, X, ChevronRight, RotateCw, ChevronLeft, AlertCircle, ImageIcon, Settings, Bookmark, BookmarkCheck, ChevronDown } from 'lucide-react';
import NavBar from '../../components/NavBar'; // Adjust the import path as needed
import { API_BASE_URL } from '../../config/api'; // Adjust path as needed
// Import the modal component directly - adjust the path as needed
import QuizSettingsModal from '../../components/QuizSettingsModal';

// Updated Flashcard type to include image properties
type Flashcard = {
  question: string;
  answer: string;
  questionImage?: string;
  answerImage?: string;
};

type AnswerFeedback = {
  isClose?: boolean;
  feedback?: string;
};

interface QuizSettings {
  quizTypes: ('text-input' | 'multiple-choice')[];
  shuffleQuestions: boolean;
}

type QuizViewModeProps = {
  flashcards?: Flashcard[];
  quizType?: 'text-input' | 'multiple-choice';
};

type QuizState = {
  currentIndex: number;
  showAnswer: boolean;
  userAnswers: string[];
  results: ('correct' | 'incorrect' | '')[]; 
  answeredFlags: boolean[];
  quizCompleted: boolean;
  options: string[][];
  feedback: AnswerFeedback[];
  bookmarkedQuestions: number[];
  filteredCards: Flashcard[];
  questionsOrder: number[]; // Maps UI index to actual flashcard index
};

const EnhancedQuiz: React.FC<QuizViewModeProps> = ({
  flashcards: propFlashcards,
  quizType: propQuizType,
}) => {
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

  // Settings and UI state
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(true); // Open by default
  const [quizSettings, setQuizSettings] = useState<QuizSettings>({
    quizTypes: ['text-input'], // Default to text input
    shuffleQuestions: false,
  });
  const [isQuestionMenuOpen, setIsQuestionMenuOpen] = useState(false);

  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [currentQuizType, setCurrentQuizType] = useState<'text-input' | 'multiple-choice'>('text-input');
  const [currentAnswerMode, setCurrentAnswerMode] = useState<'text-input' | 'multiple-choice'>('text-input');

  // Determine if component is being used standalone or as a child
  const isStandalone = !propFlashcards;
  const allFlashcards = propFlashcards || flashcardSet.flashcards || [];
  
  // Image handling states
  const [skippedCards, setSkippedCards] = useState<number>(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // --- State Initialization ---
  const initializeQuizState = (cards: Flashcard[], settings?: QuizSettings): QuizState => {
    let questionsOrder = Array.from({ length: cards.length }, (_, i) => i);
    
    // Shuffle question order if enabled
    if (settings?.shuffleQuestions) {
      questionsOrder = shuffleArray([...questionsOrder]);
    }
    
    return {
      currentIndex: 0,
      showAnswer: false,
      userAnswers: Array(cards.length).fill(''),
      results: Array(cards.length).fill(''),
      answeredFlags: Array(cards.length).fill(false),
      quizCompleted: false,
      options: Array(cards.length).fill([]),
      feedback: Array(cards.length).fill({}),
      bookmarkedQuestions: [],
      filteredCards: cards,
      questionsOrder,
    };
  };

  const [quizState, setQuizState] = useState<QuizState>(initializeQuizState(allFlashcards));
  const [filteredFlashcards, setFilteredFlashcards] = useState<Flashcard[]>([]);

  // --- Effects ---
  useEffect(() => {
    const filtered = allFlashcards.filter(card => !card.answerImage);
    setFilteredFlashcards(filtered);
    setSkippedCards(allFlashcards.length - filtered.length);
  }, [allFlashcards]);

  // Re-initialize quiz state when flashcards change or settings are updated
  useEffect(() => {
    if (filteredFlashcards.length > 0) {
      const newQuizState = initializeQuizState(filteredFlashcards, quizSettings);
      setQuizState(newQuizState);
      setUserInput('');
      setScore({ correct: 0, incorrect: 0 });
  
      // Set initial quiz type from settings
      if (quizSettings.quizTypes.length > 0) {
        setCurrentQuizType(quizSettings.quizTypes[0]);
        setCurrentAnswerMode(quizSettings.quizTypes[0]);
      }
  
      // Generate options for the first question if needed
      if (quizSettings.quizTypes.includes('multiple-choice') && filteredFlashcards.length > 0) {
        const actualIndex = newQuizState.questionsOrder[0];
        generateOptionsForCardIfNeeded(actualIndex, filteredFlashcards, newQuizState.options);
      }
    }
  }, [filteredFlashcards, quizSettings]);

  // Fetch data if in standalone mode
  useEffect(() => {
    if (isStandalone && setId) {
      fetchFlashcardSet();
    }
  }, [isStandalone, setId]);

  // Update userInput when navigating to a previously answered question
  useEffect(() => {
    if (!quizState.showAnswer && currentAnswerMode === 'text-input') {
      const actualIndex = quizState.questionsOrder[quizState.currentIndex];
      setUserInput(quizState.userAnswers[actualIndex] || '');
    }
  }, [quizState.currentIndex, quizState.showAnswer, currentAnswerMode, quizState.userAnswers, quizState.questionsOrder]);

  // Helper for image handling
  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
  };

  // --- Data Fetching & Option Generation ---
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

  const generateOptionsForCardIfNeeded = async (index: number, cards = filteredFlashcards, currentOptions: string[][]) => {
    if (currentAnswerMode !== 'multiple-choice' || cards.length === 0 || index >= cards.length || (currentOptions[index] && currentOptions[index].length > 0) || loadingOptions) {
      return;
    }

    const currentCard = cards[index];
    setLoadingOptions(true);

    try {
      const response = await fetch(`${API_BASE_URL}/quiz/generate-distractors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          correctAnswer: currentCard.answer,
          question: currentCard.question,
          numberOfDistractors: 3
        }),
        credentials: 'include'
      });

      if (!response.ok) throw new Error(`Server returned ${response.status}`);

      const distractors = await response.json();
      const allOptions = [currentCard.answer, ...distractors];
      const shuffledOptions = shuffleArray(allOptions);

      setQuizState(prev => {
        const updatedOptions = [...prev.options];
        if (!updatedOptions[index] || updatedOptions[index].length === 0) {
          updatedOptions[index] = shuffledOptions;
        }
        return { ...prev, options: updatedOptions };
      });
    } catch (error) {
      console.error(`Error generating options for index ${index}:`, error);
      setQuizState(prev => {
        const updatedOptions = [...prev.options];
        if (!updatedOptions[index] || updatedOptions[index].length === 0) {
          updatedOptions[index] = [currentCard.answer];
        }
        return { ...prev, options: updatedOptions };
      });
    } finally {
      setLoadingOptions(false);
    }
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // --- Settings Modal Handlers ---
  const handleSettingsConfirm = (settings: QuizSettings) => {
    setQuizSettings(settings);
    setIsSettingsModalOpen(false);
    
    // Initialize with the first quiz type from settings
    if (settings.quizTypes.length > 0) {
      setCurrentQuizType(settings.quizTypes[0]);
      setCurrentAnswerMode(settings.quizTypes[0]);
    }
  };

  // Toggle between quiz types if multiple are enabled
  const toggleQuizType = () => {
    if (quizSettings.quizTypes.length > 1) {
      const newType = currentAnswerMode === 'text-input' ? 'multiple-choice' : 'text-input';
      setCurrentAnswerMode(newType);
      
      // If switching to multiple-choice, generate options for current question
      if (newType === 'multiple-choice') {
        const actualIndex = quizState.questionsOrder[quizState.currentIndex];
        generateOptionsForCardIfNeeded(actualIndex, filteredFlashcards, quizState.options);
      }
    }
  };

  // --- Core Quiz Logic ---
  const handleAnswerResult = (
    userAnswer: string, 
    isCorrect: boolean, 
    feedbackInfo: AnswerFeedback = {}
  ) => {
    const actualIndex = quizState.questionsOrder[quizState.currentIndex];
    const alreadyAnswered = quizState.answeredFlags[actualIndex];
    const previousResult = quizState.results[actualIndex];
  
    setQuizState(prev => {
      const updatedUserAnswers = [...prev.userAnswers];
      updatedUserAnswers[actualIndex] = userAnswer;
  
      const updatedResults = [...prev.results];
      updatedResults[actualIndex] = isCorrect ? 'correct' : 'incorrect';
  
      const updatedAnsweredFlags = [...prev.answeredFlags];
      updatedAnsweredFlags[actualIndex] = true;
  
      const updatedFeedback = [...prev.feedback];
      updatedFeedback[actualIndex] = feedbackInfo;
  
      return {
        ...prev,
        userAnswers: updatedUserAnswers,
        results: updatedResults,
        answeredFlags: updatedAnsweredFlags,
        feedback: updatedFeedback,
        showAnswer: true,
      };
    });
  
    // Update score
    setScore(prev => {
      let correctDelta = 0;
      let incorrectDelta = 0;
  
      if (!alreadyAnswered) {
        if (isCorrect) correctDelta = 1;
        else incorrectDelta = 1;
      } else {
        if (isCorrect && previousResult === 'incorrect') {
          correctDelta = 1;
          incorrectDelta = -1;
        } else if (!isCorrect && previousResult === 'correct') {
          correctDelta = -1;
          incorrectDelta = 1;
        }
      }
  
      return {
        correct: prev.correct + correctDelta,
        incorrect: prev.incorrect + incorrectDelta,
      };
    });
  };

  const checkAnswer = async (userAnswer: string) => {
    if (!filteredFlashcards || filteredFlashcards.length === 0) return;
    
    const actualIndex = quizState.questionsOrder[quizState.currentIndex];
    const currentCard = filteredFlashcards[actualIndex];
    if (!currentCard) return;
  
    // For multiple choice
    if (currentAnswerMode === 'multiple-choice') {
      const isCorrect = userAnswer.trim().toLowerCase() === currentCard.answer.trim().toLowerCase();
      handleAnswerResult(userAnswer, isCorrect);
      return;
    }
  
    // For text input, use semantic answer checking
    try {
      const response = await fetch(`${API_BASE_URL}/semantic-answer/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAnswer: userAnswer.trim(),
          correctAnswer: currentCard.answer.trim()
        }),
        credentials: 'include'
      });
  
      if (!response.ok) {
        // Fall back to exact matching
        const isCorrect = userAnswer.trim().toLowerCase() === currentCard.answer.trim().toLowerCase();
        handleAnswerResult(userAnswer, isCorrect);
        return;
      }
  
      const data = await response.json();
      handleAnswerResult(userAnswer, data.isCorrect, {
        isClose: data.isClose,
        feedback: data.feedback
      });
    } catch (error) {
      // Fall back to exact matching
      const isCorrect = userAnswer.trim().toLowerCase() === currentCard.answer.trim().toLowerCase();
      handleAnswerResult(userAnswer, isCorrect);
    }
  };

  const handleTextCheck = async () => {
    await checkAnswer(userInput);
  };

  const handleMultipleChoiceSelect = (selectedOption: string) => {
    checkAnswer(selectedOption);
  };

  // --- Bookmark Logic ---
  const toggleBookmark = () => {
    const actualIndex = quizState.questionsOrder[quizState.currentIndex];
    
    setQuizState(prev => {
      const bookmarked = prev.bookmarkedQuestions.includes(actualIndex);
      const updatedBookmarks = bookmarked 
        ? prev.bookmarkedQuestions.filter(idx => idx !== actualIndex)
        : [...prev.bookmarkedQuestions, actualIndex];
      
      return {
        ...prev,
        bookmarkedQuestions: updatedBookmarks
      };
    });
  };

  // --- Navigation Logic ---
  const goToSpecificQuestion = (index: number) => {
    if (index >= 0 && index < filteredFlashcards.length) {
      const actualIndex = quizState.questionsOrder[index];
      
      // Pre-load options if needed
      if (currentAnswerMode === 'multiple-choice') {
        generateOptionsForCardIfNeeded(actualIndex, filteredFlashcards, quizState.options);
      }
      
      setQuizState(prev => ({
        ...prev,
        currentIndex: index,
        showAnswer: prev.answeredFlags[actualIndex],
      }));
      
      setIsQuestionMenuOpen(false);
    }
  };

  const goToPreviousQuestion = () => {
    if (quizState.currentIndex > 0) {
      goToSpecificQuestion(quizState.currentIndex - 1);
    }
  };

  const goToNextQuestion = () => {
    if (quizState.currentIndex < filteredFlashcards.length - 1) {
      goToSpecificQuestion(quizState.currentIndex + 1);
    }
  };

  const proceedToNextOrFinish = () => {
    const isLastCard = quizState.currentIndex === filteredFlashcards.length - 1;

    if (isLastCard) {
      setQuizState(prev => ({ ...prev, quizCompleted: true }));
    } else {
      goToNextQuestion();
      
      // Clear text input when moving to next question
      if (currentAnswerMode === 'text-input') {
        const nextActualIndex = quizState.questionsOrder[quizState.currentIndex + 1];
        if (!quizState.answeredFlags[nextActualIndex]) {
          setUserInput('');
        }
      }
    }
  };

  const resetQuiz = () => {
    const newQuizState = initializeQuizState(filteredFlashcards, quizSettings);
    setQuizState(newQuizState);
    setUserInput('');
    setScore({ correct: 0, incorrect: 0 });
    
    // Generate options for the first question
    if (currentAnswerMode === 'multiple-choice' && filteredFlashcards.length > 0) {
      const actualIndex = newQuizState.questionsOrder[0];
      generateOptionsForCardIfNeeded(actualIndex, filteredFlashcards, newQuizState.options);
    }
  };

  // --- Rendering ---
  // Handle loading/error/empty states for standalone mode
  if (isStandalone) {
    if (loading) {
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

    if (error) {
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
  }

  // Check if there are any valid flashcards after filtering
  if (filteredFlashcards.length === 0) {
    return (
      <div className={isStandalone ? "min-h-screen bg-white" : ""}>
        {isStandalone && <NavBar />}
        <div className={isStandalone ? "pt-24 px-6 pb-6" : ""}>
          <div className="bg-blue-50 p-6 rounded-xl text-center border border-blue-200">
            {skippedCards > 0 ? (
              <>
                <div className="flex justify-center mb-4">
                  <ImageIcon size={48} className="text-blue-500" />
                </div>
                <p className="text-xl text-[#004a74] mb-3">
                  {allFlashcards.length > 0 
                    ? "This set only contains flashcards with answer images" 
                    : "This set doesn't have any flashcards yet"}
                </p>
                <p className="text-gray-700 mb-4">
                  {allFlashcards.length > 0 
                    ? "Quiz mode currently doesn't support flashcards with answer images. Please try using View mode instead." 
                    : "Add some flashcards to start studying!"}
                </p>
              </>
            ) : (
              <>
                <p className="text-xl text-[#004a74]">This set doesn't have any flashcards yet.</p>
                <p className="text-gray-700 mt-2 mb-4">Add some flashcards to start studying!</p>
              </>
            )}
            
            {isStandalone && skippedCards > 0 && (
              <div className="mt-6">
                <button
                  onClick={() => navigate(`/study/${setId}`)}
                  className="flex items-center mx-auto bg-[#004a74] text-white px-6 py-3 rounded-lg hover:bg-[#00659f] transition-all font-semibold"
                >
                  <ChevronLeft className="w-5 h-5 mr-2" />
                  Back to Set Viewer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Get the current card based on the questionsOrder mapping
  const actualIndex = quizState.questionsOrder[quizState.currentIndex];
  const currentCard = filteredFlashcards[actualIndex];
  const isBookmarked = quizState.bookmarkedQuestions.includes(actualIndex);
  
  if (!currentCard) {
    console.error("Error: currentCard is undefined at index", quizState.currentIndex);
    return <div>Error: Could not load current card. <button onClick={resetQuiz}>Reset Quiz</button></div>;
  }

  // Render function for the multiple choice options
  const renderMultipleChoiceOptions = () => {
    const options = quizState.options[actualIndex];

    if (loadingOptions || !options) {
      return (
        <div className="flex justify-center items-center h-36 w-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#004a74]"></div>
          <p className="ml-3 text-[#004a74]">Loading options...</p>
        </div>
      );
    }
    
    if (options.length === 0 && !loadingOptions) {
      return (
        <div className="text-center text-red-600 p-4 bg-red-50 rounded">
          Could not load options for this question.
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
        {options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => handleMultipleChoiceSelect(option)}
            disabled={quizState.showAnswer}
            className={`p-4 rounded-lg text-left text-lg transition-all duration-200 border-2
              ${quizState.showAnswer
                ? option.toLowerCase() === currentCard.answer.toLowerCase()
                  ? 'bg-green-100 border-green-500 text-green-800 ring-2 ring-green-300'
                  : option === quizState.userAnswers[actualIndex]
                    ? 'bg-red-100 border-red-500 text-red-800 ring-2 ring-red-300'
                    : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed opacity-70'
                : 'bg-white border-gray-300 hover:border-[#004a74] hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-[#004a74] focus:ring-opacity-50'
              }`}
          >
            {option}
          </button>
        ))}
      </div>
    );
  };

  // Render function for the quiz content
  const renderQuizContent = () => {
    const totalCards = filteredFlashcards.length;
    const totalAnswered = quizState.answeredFlags.filter(Boolean).length;

    // --- Results Screen ---
    if (quizState.quizCompleted) {
      const finalScore = score.correct;
      const totalAttempted = score.correct + score.incorrect;
      const percentageScore = totalAttempted > 0 ? Math.round((finalScore / totalAttempted) * 100) : 0;

      return (
        <div className="w-full max-w-7xl mx-auto mt-8 bg-white rounded-xl shadow-lg p-6 md:p-8">
          <h2 className="text-3xl font-bold text-[#004a74] mb-6 text-center">Quiz Results</h2>

          <div className="text-center mb-8">
            <div className="text-6xl font-bold text-[#004a74]">
              {percentageScore}%
            </div>
            <div className="text-xl text-gray-600 mt-2">
              {finalScore} correct out of {totalAttempted} attempted questions ({totalCards} total)
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-4 md:h-6 mb-8">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                percentageScore >= 80 ? 'bg-green-500' :
                percentageScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${percentageScore}%` }}
            ></div>
          </div>

          {/* Question Review Section */}
          <div className="w-full mb-8">
            <h3 className="text-2xl font-semibold mb-4 text-[#004a74]">Question Review:</h3>
            {filteredFlashcards.map((card, originalIndex) => {
              // Find the UI index for this card
              const uiIndex = quizState.questionsOrder.findIndex(idx => idx === originalIndex);
              
              return (
                <div key={originalIndex} className={`mb-4 border rounded-lg p-4 ${
                  quizState.results[originalIndex] === 'correct' ? 'border-green-200 bg-green-50' :
                  quizState.feedback[originalIndex]?.isClose ? 'border-yellow-200 bg-yellow-50' :
                  quizState.results[originalIndex] === 'incorrect' ? 'border-red-200 bg-red-50' :
                  'border-gray-200 bg-gray-50' // Not answered
                }`}>
                  <div className="flex items-start gap-2 mb-2">
                    <div className="flex-shrink-0 w-6 h-6 mt-1">
                      {quizState.results[originalIndex] === 'correct' ? (
                        <Check className="w-6 h-6 text-green-600" />
                      ) : quizState.feedback[originalIndex]?.isClose ? (
                        <AlertCircle className="w-6 h-6 text-yellow-600" />
                      ) : quizState.results[originalIndex] === 'incorrect' ? (
                        <X className="w-6 h-6 text-red-600" />
                      ) : (
                        <span className="w-6 h-6 inline-block text-gray-400">-</span>
                      )}
                    </div>
                    <div className="flex-grow">
                      <p className="font-medium text-lg text-gray-800">
                        Question {uiIndex + 1}: <span className="font-normal">{card.question}</span>
                      </p>
                      {quizState.bookmarkedQuestions.includes(originalIndex) && (
                        <span className="ml-2 inline-flex items-center text-xs text-blue-600">
                          <BookmarkCheck size={14} className="mr-1" /> Bookmarked
                        </span>
                      )}
                    </div>
                  </div>
                  {quizState.answeredFlags[originalIndex] ? (
                    <div className="pl-8">
                      <p className="text-sm text-gray-500">Your answer:</p>
                      <p className={`font-medium text-base mb-1 ${
                        quizState.results[originalIndex] === 'correct' ? 'text-green-700' : 
                        quizState.feedback[originalIndex]?.isClose ? 'text-yellow-700' : 'text-red-700'
                      }`}>
                        {quizState.userAnswers[originalIndex] || '(No answer provided)'}
                      </p>

                      {quizState.feedback[originalIndex]?.feedback && quizState.results[originalIndex] !== 'correct' && (
                        <div className="mb-2 p-2 bg-white rounded border border-gray-200">
                          <p className="text-gray-700 text-sm">
                            <span className="font-medium">Feedback: </span>
                            {quizState.feedback[originalIndex].feedback}
                          </p>
                        </div>
                      )}

                      <p className="text-sm text-gray-500 mt-2">Correct answer:</p>
                      <p className="text-green-700 font-medium text-base">{card.answer}</p>
                    </div>
                  ) : (
                    <div className="pl-8 text-gray-500 italic">Not answered</div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-center">
            <button
              onClick={resetQuiz}
              className="flex items-center gap-2 bg-[#004a74] text-white px-6 py-3 rounded-lg hover:bg-[#00659f] transition-all font-semibold text-lg"
            >
              <RotateCw className="w-5 h-5" />
              Take Quiz Again
            </button>
          </div>
        </div>
      );
    }

    // --- Quiz Taking Screen ---
    return (
      <div className="flex flex-col items-center w-full max-w-7xl mx-auto">
        {/* Top Controls: Settings, Progress Bar, and Question Navigation */}
        <div className="w-full mb-4">
          <div className="flex justify-between items-center mb-2">
            {/* Settings Button */}
            <button 
              onClick={() => setIsSettingsModalOpen(true)}
              className="flex items-center gap-1 text-[#004a74] hover:bg-blue-50 p-2 rounded transition-colors"
              aria-label="Quiz Settings"
            >
              <Settings size={18} />
              <span className="text-sm">Settings</span>
            </button>

            {/* Progress Stats */}
            <div className="text-sm text-gray-600 flex items-center">
              <span className="font-medium">{quizState.currentIndex + 1}</span>
              <span className="mx-1">/</span>
              <span>{totalCards}</span>
              <span className="ml-3 text-xs px-2 py-1 bg-blue-50 rounded-full">
                {score.correct} correct, {score.incorrect} incorrect
              </span>
            </div>

            {/* Question Jump Menu */}
            <div className="relative">
              <button 
                onClick={() => setIsQuestionMenuOpen(!isQuestionMenuOpen)}
                className="flex items-center gap-1 text-[#004a74] hover:bg-blue-50 p-2 rounded transition-colors"
              >
                <span className="text-sm">Jump to Question</span>
                <ChevronDown size={18} />
              </button>
              
              {isQuestionMenuOpen && (
                <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-64 max-h-96 overflow-y-auto">
                  <div className="p-2 sticky top-0 bg-gray-50 border-b">
                    <div className="text-xs font-medium text-gray-500">QUESTIONS</div>
                  </div>
                  <div className="py-1">
                    {Array.from({ length: totalCards }, (_, i) => {
                      const qActualIndex = quizState.questionsOrder[i];
                      const qCard = filteredFlashcards[qActualIndex];
                      const isAnswered = quizState.answeredFlags[qActualIndex];
                      const isCorrect = quizState.results[qActualIndex] === 'correct';
                      const isIncorrect = quizState.results[qActualIndex] === 'incorrect';
                      const isClose = quizState.feedback[qActualIndex]?.isClose;
                      const isBookmarked = quizState.bookmarkedQuestions.includes(qActualIndex);
                      
                      return (
                        <button 
                          key={i}
                          onClick={() => goToSpecificQuestion(i)}
                          className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-blue-50 ${
                            quizState.currentIndex === i ? 'bg-blue-50' : ''
                          }`}
                        >
                          <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                            isAnswered 
                              ? isCorrect 
                                ? 'bg-green-100 text-green-800' 
                                : isClose 
                                  ? 'bg-yellow-100 text-yellow-800' 
                                  : 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {i + 1}
                          </span>
                          <span className="truncate flex-1">{qCard.question.length > 30 ? `${qCard.question.substring(0, 30)}...` : qCard.question}</span>
                          {isBookmarked && <BookmarkCheck size={16} className="flex-shrink-0 text-blue-500" />}
                        </button>
                      );
                    })}
                  </div>
                  
                  {quizState.bookmarkedQuestions.length > 0 && (
                    <>
                      <div className="p-2 sticky top-0 bg-gray-50 border-y">
                        <div className="text-xs font-medium text-gray-500">BOOKMARKED</div>
                      </div>
                      <div className="py-1">
                        {quizState.bookmarkedQuestions.map(bookmarkIndex => {
                          // Find the UI index for this bookmarked question
                          const uiIndex = quizState.questionsOrder.findIndex(idx => idx === bookmarkIndex);
                          if (uiIndex === -1) return null;
                          
                          const qCard = filteredFlashcards[bookmarkIndex];
                          return (
                            <button 
                              key={`bookmark-${bookmarkIndex}`}
                              onClick={() => goToSpecificQuestion(uiIndex)}
                              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-blue-50 ${
                                quizState.currentIndex === uiIndex ? 'bg-blue-50' : ''
                              }`}
                            >
                              <BookmarkCheck size={16} className="flex-shrink-0 text-blue-500" />
                              <span className="truncate flex-1">{qCard.question.length > 30 ? `${qCard.question.substring(0, 30)}...` : qCard.question}</span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-[#004a74] h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${((quizState.currentIndex + 1) / totalCards) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Skipped cards notification */}
        {skippedCards > 0 && (
          <div className="w-full mb-4 bg-blue-50 p-3 rounded-lg border border-blue-200 flex items-center justify-between">
            <div className="flex items-center">
              <ImageIcon size={18} className="text-blue-500 mr-2" />
              <p className="text-blue-700 text-sm">
                {skippedCards} {skippedCards === 1 ? 'flashcard' : 'flashcards'} with answer images {skippedCards === 1 ? 'was' : 'were'} skipped from this quiz.
              </p>
            </div>
            <button 
              onClick={() => setSkippedCards(0)} 
              className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-100 transition-colors"
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Question Card */}
        <div className="w-full bg-white border border-gray-200 rounded-xl shadow-lg p-6 md:p-8 mb-6 relative">
          {/* Bookmark button */}
          <button 
            onClick={toggleBookmark}
            className="absolute top-4 right-4 text-gray-400 hover:text-blue-500 transition-colors"
            aria-label={isBookmarked ? "Remove bookmark" : "Bookmark question"}
          >
            {isBookmarked ? 
              <BookmarkCheck size={24} className="text-blue-500" /> : 
              <Bookmark size={24} />
            }
          </button>
          
          {/* Question Display */}
          <div className="mb-6 min-h-[80px]">
            <p className="text-gray-500 text-sm font-medium mb-1">QUESTION</p>
            {currentCard.questionImage ? (
              <div className="mb-2">
                <img 
                  src={currentCard.questionImage} 
                  alt="Question image" 
                  className="max-w-full max-h-64 object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => handleImageClick(currentCard.questionImage!)}
                />
                <p className="text-xs text-gray-600 mt-1">Click image to enlarge</p>
              </div>
            ) : null}
            <p className="text-xl md:text-2xl text-gray-800">{currentCard.question}</p>
          </div>

          {/* Answer Mode Toggle (if multiple types enabled) */}
          {quizSettings.quizTypes.length > 1 && !quizState.showAnswer && (
            <div className="mb-4 flex justify-end">
              <button
                onClick={toggleQuizType}
                className="text-sm flex items-center gap-1 text-[#004a74] bg-blue-50 hover:bg-blue-100 py-1 px-3 rounded-full transition-colors"
              >
                <span>Switch to {currentAnswerMode === 'text-input' ? 'Multiple Choice' : 'Text Input'}</span>
              </button>
            </div>
          )}

          {/* Answer Area (Input or Feedback) */}
          <div className="min-h-[180px]">
            {quizState.showAnswer ? (
              // Feedback Section
              <div className={`rounded-lg p-4 border ${
                quizState.results[actualIndex] === 'correct'
                  ? 'bg-green-50 border-green-200'
                  : quizState.feedback[actualIndex]?.isClose
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className={`font-bold text-lg ${
                    quizState.results[actualIndex] === 'correct' 
                      ? 'text-green-700' 
                      : quizState.feedback[actualIndex]?.isClose
                        ? 'text-yellow-700'
                        : 'text-red-700'
                  }`}>
                    Your Answer:
                  </h3>
                  {quizState.results[actualIndex] === 'correct' ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <Check className="w-4 h-4" /> Correct
                    </span>
                  ) : quizState.feedback[actualIndex]?.isClose ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                      <AlertCircle className="w-4 h-4" /> Close!
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                      <X className="w-4 h-4" /> Incorrect
                    </span>
                  )}
                </div>
                <p className="text-lg text-gray-700 break-words">{quizState.userAnswers[actualIndex] || "(No answer provided)"}</p>

                {/* Display feedback if available */}
                {quizState.feedback[actualIndex]?.feedback && quizState.results[actualIndex] !== 'correct' && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-700 mb-1">Feedback:</h4>
                    <p className="text-gray-600">{quizState.feedback[actualIndex].feedback}</p>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-gray-200">
                  <h3 className="font-bold text-lg text-green-700">Correct Answer:</h3>
                  <p className="text-lg text-gray-700 break-words">{currentCard.answer}</p>
                </div>
              </div>
            ) : (
              // Input Section based on current mode
              currentAnswerMode === 'multiple-choice' ? (
                renderMultipleChoiceOptions()
              ) : (
                // Text Input
                <div className="flex flex-col gap-4">
                  <textarea
                    value={userInput}
                    onChange={e => setUserInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleTextCheck();
                      }
                    }}
                    placeholder="Type your answer here..."
                    rows={4}
                    className="w-full p-3 rounded-lg border border-[#004a74] focus:outline-none focus:ring-2 focus:ring-[#004a74]/20 text-base resize-vertical transition-all"
                  />
                  <button
                    onClick={handleTextCheck}
                    disabled={!userInput.trim()}
                    className={`w-full bg-[#004a74] text-white py-3 px-6 rounded-lg hover:bg-[#00659f] transition-colors font-semibold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed`}
                  >
                    Check Answer
                  </button>
                </div>
              )
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="w-full flex items-center justify-between mt-2">
          {/* Previous Button */}
          <button
            onClick={goToPreviousQuestion}
            disabled={quizState.currentIndex === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[#004a74] bg-white border border-[#004a74] hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous question"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          {/* Conditional Button: Either "Next Question" after answer check OR "See Results" */}
          {quizState.showAnswer ? (
            <button
              onClick={proceedToNextOrFinish}
              className="flex items-center gap-2 px-5 py-3 rounded-lg bg-[#28a745] text-white hover:bg-[#218838] transition-colors font-semibold text-lg shadow hover:shadow-md"
              aria-label={quizState.currentIndex < totalCards - 1 ? "Next question" : "See results"}
            >
              {quizState.currentIndex < totalCards - 1 ? 'Next Question' : 'See Results'}
              {quizState.currentIndex < totalCards - 1 && <ChevronRight className="w-5 h-5" />}
            </button>
          ) : (
            <div className="w-[130px]"></div> // Placeholder to maintain layout
          )}

          {/* Next Button */}
          {!quizState.showAnswer && (
            <button
              onClick={goToNextQuestion}
              disabled={quizState.currentIndex === totalCards - 1}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[#004a74] bg-white border border-[#004a74] hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next question"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
          {quizState.showAnswer && (
            <div className="w-[100px]"></div> // Placeholder to keep 'Previous' aligned left
          )}
        </div>
      </div>
    );
  };

  // --- Component Return ---
  if (isStandalone) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="pt-24 pb-12 px-4 md:px-6 max-w-7xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate(`/study/${setId}`)} 
            className="flex items-center text-sm bg-white px-3 py-2 rounded-lg shadow-sm border border-[#004a74]/20 text-[#004a74] hover:bg-[#e3f3ff] transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Set Page 
          </button>

          {/* Set Title */}
          <div className="mb-6 text-center md:text-left">
            {flashcardSet.title && (
              <h1 className="text-2xl md:text-3xl font-bold text-[#004a74] mb-2">{flashcardSet.title}</h1>
            )}
            <p className="text-lg text-gray-600">
              Quiz Mode
            </p>
          </div>

          {/* Main quiz content */}
          {renderQuizContent()}
        </div>

        {/* Settings Modal */}
        {isSettingsModalOpen && (
          <QuizSettingsModal
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
            onConfirm={handleSettingsConfirm}

          />
        )}

        {/* Image Modal */}
        {isImageModalOpen && selectedImage && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4 cursor-pointer"
            onClick={closeImageModal}
          >
            <div className="max-w-4xl max-h-[90vh] w-full">
              <div className="bg-white p-2 rounded-lg">
                <img 
                  src={selectedImage} 
                  alt="Enlarged question image" 
                  className="max-w-full max-h-[80vh] object-contain mx-auto"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Embedded version
  return (
    <>
      {renderQuizContent()}
      
      {/* Settings Modal */}
      {isSettingsModalOpen && (
        <QuizSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          onConfirm={handleSettingsConfirm}

        />
      )}

      {/* Image Modal */}
      {isImageModalOpen && selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={closeImageModal}
        >
          <div className="max-w-4xl max-h-[90vh] w-full">
            <div className="bg-white p-2 rounded-lg">
              <img 
                src={selectedImage} 
                alt="Enlarged question image" 
                className="max-w-full max-h-[80vh] object-contain mx-auto"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EnhancedQuiz;