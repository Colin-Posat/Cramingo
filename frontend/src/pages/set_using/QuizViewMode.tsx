import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, X, ChevronRight, RotateCw, ChevronLeft, AlertCircle } from 'lucide-react';
import NavBar from '../../components/NavBar'; // Adjust the import path as needed

type Flashcard = {
  question: string;
  answer: string;
};

type AnswerFeedback = {
  isClose?: boolean;
  feedback?: string;
};

type QuizViewModeProps = {
  flashcards?: Flashcard[];
  quizType?: 'text-input' | 'multiple-choice';
};

type QuizState = {
  currentIndex: number;
  showAnswer: boolean; // Tracks if the *current* card's answer is being shown after checking
  userAnswers: string[];
  results: ('correct' | 'incorrect' | '')[]; // Store result per card index
  answeredFlags: boolean[]; // Track if a question has been attempted/answered
  quizCompleted: boolean;
  options: string[][]; // Array of options for each question
  feedback: AnswerFeedback[];
};

const MultipleChoiceQuiz: React.FC<QuizViewModeProps> = ({
  flashcards: propFlashcards,
  quizType: propQuizType, // Rename prop to avoid conflict
}) => {
  const { setId, quizType: paramQuizType } = useParams<{ setId: string; quizType?: string }>(); // Get quizType from URL params too
  const navigate = useNavigate();

  // Determine quiz type precedence: URL param > prop > default
  const quizType = (paramQuizType || propQuizType || 'text-input') as 'text-input' | 'multiple-choice';

  // State for standalone mode
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flashcardSet, setFlashcardSet] = useState<{
    title?: string;
    classCode?: string;
    flashcards: Flashcard[];
  }>({ flashcards: [] });

  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState({ correct: 0, incorrect: 0 }); // Track incorrect too
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Determine if component is being used standalone or as a child
  const isStandalone = !propFlashcards;

  // Get flashcards from props or fetched data
  const flashcards = propFlashcards || flashcardSet.flashcards || [];

  // --- State Initialization ---
  const initializeQuizState = (cards: Flashcard[]): QuizState => ({
    currentIndex: 0,
    showAnswer: false,
    userAnswers: Array(cards.length).fill(''),
    results: Array(cards.length).fill(''),
    answeredFlags: Array(cards.length).fill(false), // Initialize answered flags
    quizCompleted: false,
    options: Array(cards.length).fill([]),
    feedback: Array(cards.length).fill({}),
  });

  const [quizState, setQuizState] = useState<QuizState>(initializeQuizState(flashcards));

  // --- Effects ---

  // Re-initialize quiz state when flashcards change or quiz type changes
  useEffect(() => {
    const newQuizState = initializeQuizState(flashcards);
    setQuizState(newQuizState);
    setUserInput(''); // Clear input field
    setScore({ correct: 0, incorrect: 0 }); // Reset score

    // If quiz type is multiple-choice, generate options for the first question
    if (quizType === 'multiple-choice' && flashcards.length > 0) {
      generateOptionsForCardIfNeeded(0, flashcards, newQuizState.options);
    }
  }, [flashcards, quizType]); // Add quizType dependency

  // Fetch data if in standalone mode
  useEffect(() => {
    if (isStandalone && setId) {
      fetchFlashcardSet();
    }
  }, [isStandalone, setId]); // Removed quizType dependency here, fetch only based on set ID

  // Update userInput when navigating back to a previously answered text question
  useEffect(() => {
      if (!quizState.showAnswer && quizType === 'text-input') {
          setUserInput(quizState.userAnswers[quizState.currentIndex] || '');
      }
  }, [quizState.currentIndex, quizState.showAnswer, quizType, quizState.userAnswers]);


  // --- Data Fetching & Option Generation ---

  const fetchFlashcardSet = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`https://fliply-backend.onrender.com/api/sets/${setId}`, { credentials: 'include' });
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const data = await response.json();
      setFlashcardSet(data);
      // Initialization (including option generation) is handled by the flashcards useEffect
    } catch (error) {
      console.error('Error fetching flashcard set:', error);
      setError("Failed to load flashcard set. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // Generate options only if needed (not already generated)
  const generateOptionsForCardIfNeeded = async (index: number, cards = flashcards, currentOptions: string[][]) => {
      // Check if options are needed and not already available/loading
      if (quizType !== 'multiple-choice' || cards.length === 0 || index >= cards.length || (currentOptions[index] && currentOptions[index].length > 0) || loadingOptions) {
          return;
      }

      const currentCard = cards[index];
      setLoadingOptions(true); // Indicate loading specifically for this action

      try {
          const response = await fetch('https://fliply-backend.onrender.com/api/quiz/generate-distractors', {
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
              // Ensure we don't overwrite if another process generated options faster
              if (!updatedOptions[index] || updatedOptions[index].length === 0) {
                updatedOptions[index] = shuffledOptions;
              }
              return { ...prev, options: updatedOptions };
          });

      } catch (error) {
          console.error(`Error generating options for index ${index}:`, error);
          // Fallback: Use only the correct answer if generation fails
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


  const shuffleArray = (array: string[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };


  // --- Core Quiz Logic ---

  const handleAnswerResult = (
    userAnswer: string, 
    isCorrect: boolean, 
    feedbackInfo: AnswerFeedback = {}
  ) => {
    const alreadyAnswered = quizState.answeredFlags[quizState.currentIndex];
    const previousResult = quizState.results[quizState.currentIndex];
  
    setQuizState(prev => {
      const updatedUserAnswers = [...prev.userAnswers];
      updatedUserAnswers[prev.currentIndex] = userAnswer;
  
      const updatedResults = [...prev.results];
      updatedResults[prev.currentIndex] = isCorrect ? 'correct' : 'incorrect';
  
      const updatedAnsweredFlags = [...prev.answeredFlags];
      updatedAnsweredFlags[prev.currentIndex] = true; // Mark as answered
  
      const updatedFeedback = [...prev.feedback];
      updatedFeedback[prev.currentIndex] = feedbackInfo;
  
      return {
        ...prev,
        userAnswers: updatedUserAnswers,
        results: updatedResults,
        answeredFlags: updatedAnsweredFlags,
        feedback: updatedFeedback,
        showAnswer: true, // Show feedback
      };
    });
  
    // Update score only if it wasn't answered correctly before,
    // or if it was answered incorrectly before and now is correct.
    // Prevents double-counting correct answers or penalizing changing incorrect->incorrect.
    setScore(prev => {
      let correctDelta = 0;
      let incorrectDelta = 0;
  
      if (!alreadyAnswered) {
        // First time answering this question in this session
        if (isCorrect) correctDelta = 1;
        else incorrectDelta = 1;
      } else {
        // Re-answering
        if (isCorrect && previousResult === 'incorrect') {
          correctDelta = 1;
          incorrectDelta = -1; // Was incorrect, now correct
        } else if (!isCorrect && previousResult === 'correct') {
          correctDelta = -1; // Was correct, now incorrect
          incorrectDelta = 1;
        }
        // If incorrect -> incorrect, or correct -> correct, no change
      }
  
      return {
        correct: prev.correct + correctDelta,
        incorrect: prev.incorrect + incorrectDelta,
      };
    });
  };

  const checkAnswer = async (userAnswer: string) => {
    if (!flashcards || flashcards.length === 0) return; // Guard against no flashcards
    const currentCard = flashcards[quizState.currentIndex];
    if (!currentCard) return; // Guard against invalid index
  
    // For multiple choice, continue using direct string comparison
    if (quizType === 'multiple-choice') {
      const isCorrect = userAnswer.trim().toLowerCase() === currentCard.answer.trim().toLowerCase();
      handleAnswerResult(userAnswer, isCorrect);
      return;
    }
  
    // For text input, use the semantic answer checking API
    try {
      const response = await fetch('https://fliply-backend.onrender.com/api/semantic-answer/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAnswer: userAnswer.trim(),
          correctAnswer: currentCard.answer.trim()
        }),
        credentials: 'include'
      });
  
      if (!response.ok) {
        console.error(`Server returned ${response.status}`);
        // Fall back to exact matching if API fails
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
      console.error('Error checking answer semantically:', error);
      // Fall back to exact matching if API call fails
      const isCorrect = userAnswer.trim().toLowerCase() === currentCard.answer.trim().toLowerCase();
      handleAnswerResult(userAnswer, isCorrect);
    }
  };
  const handleTextCheck = async () => {
    await checkAnswer(userInput);
  }

  const handleMultipleChoiceSelect = (selectedOption: string) => {
    checkAnswer(selectedOption);
  }

  // --- Navigation Logic ---

  const goToPreviousQuestion = () => {
    if (quizState.currentIndex > 0) {
      const prevIndex = quizState.currentIndex - 1;
      setQuizState(prev => ({
        ...prev,
        currentIndex: prevIndex,
        showAnswer: prev.answeredFlags[prevIndex], // Show answer only if previously answered
      }));
       // Option generation handled by useEffect or generateOptionsForCardIfNeeded if needed on demand elsewhere
       // User input for text is handled by useEffect
    }
  };

  const goToNextQuestion = () => {
    if (quizState.currentIndex < flashcards.length - 1) {
      const nextIndex = quizState.currentIndex + 1;
      // Ensure options are ready for the next card *before* navigating state
      generateOptionsForCardIfNeeded(nextIndex, flashcards, quizState.options);
      setQuizState(prev => ({
        ...prev,
        currentIndex: nextIndex,
        showAnswer: prev.answeredFlags[nextIndex], // Show answer only if previously answered
      }));
      // User input for text is handled by useEffect
    }
  };

  // This function is called ONLY by the button that appears AFTER an answer is checked
  const proceedToNextOrFinish = () => {
    const isLastCard = quizState.currentIndex === flashcards.length - 1;

    if (isLastCard) {
      setQuizState(prev => ({ ...prev, quizCompleted: true }));
    } else {
      const nextIndex = quizState.currentIndex + 1;
      generateOptionsForCardIfNeeded(nextIndex, flashcards, quizState.options); // Pre-load options
      setQuizState(prev => ({
        ...prev,
        currentIndex: nextIndex,
        showAnswer: prev.answeredFlags[nextIndex], // Show answer if already answered
      }));
      // Clear text input specifically when moving to the *next* question after *answering*
      if (quizType === 'text-input' && !quizState.answeredFlags[nextIndex]) {
          setUserInput('');
      }
    }
  };

  const resetQuiz = () => {
    const newQuizState = initializeQuizState(flashcards);
    setQuizState(newQuizState);
    setUserInput('');
    setScore({ correct: 0, incorrect: 0 });
    // Generate options for the first question again
    if (quizType === 'multiple-choice' && flashcards.length > 0) {
      generateOptionsForCardIfNeeded(0, flashcards, newQuizState.options);
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
            {/* ... (error display code - unchanged) ... */}
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

    if (!flashcards || flashcards.length === 0) {
      return (
        <div className="min-h-screen bg-white">
          <NavBar />
          <div className="pt-24 px-6 pb-6">
            {/* ... (empty set display code - unchanged) ... */}
            <div className="bg-blue-50 p-6 rounded-xl text-center">
              <p className="text-xl text-[#004a74]">This set doesn't have any flashcards yet.</p>
              <button
                onClick={() => navigate(`/set-creator`)} // Assuming this is the correct route
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
  } else {
      // Embedded mode: Handle no flashcards
      if (!flashcards || flashcards.length === 0) {
         return (
            <div className="flex flex-col items-center justify-center p-8 bg-blue-50 rounded-xl text-center">
                <p className="text-2xl text-[#004a74] font-medium mb-4">No flashcards in this set</p>
                <p className="text-gray-600">Add some flashcards to start studying!</p>
            </div>
        );
      }
  }

  // Guard clause for rendering quiz content if flashcards array is somehow empty after checks
  if (flashcards.length === 0) {
    return <div>Error: No flashcards available to display.</div>;
  }

  const totalCards = flashcards.length;
  const currentCard = flashcards[quizState.currentIndex];
   // Add a check for currentCard existence before accessing its properties
  if (!currentCard) {
    console.error("Error: currentCard is undefined at index", quizState.currentIndex);
    // Optionally, reset or show an error state
     return <div>Error: Could not load current card. <button onClick={resetQuiz}>Reset Quiz</button></div>;
  }


  // Render function for the multiple choice options
  const renderMultipleChoiceOptions = () => {
    const options = quizState.options[quizState.currentIndex];

    if (loadingOptions || !options) { // Check if options array exists
      return (
        <div className="flex justify-center items-center h-36 w-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#004a74]"></div>
          <p className="ml-3 text-[#004a74]">Loading options...</p>
        </div>
      );
    }
     if (options.length === 0 && !loadingOptions) {
       // Handle case where options failed to load or are empty after loading attempt
        return (
            <div className="text-center text-red-600 p-4 bg-red-50 rounded">
                Could not load options for this question.
            </div>
        );
    }


    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full"> {/* Responsive grid */}
        {options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => handleMultipleChoiceSelect(option)}
            // Disable button if answer is shown OR if it's the correct/incorrect selection already highlighted
            disabled={quizState.showAnswer}
            className={`p-4 rounded-lg text-left text-lg transition-all duration-200 border-2
              ${quizState.showAnswer
                ? option.toLowerCase() === currentCard.answer.toLowerCase() // Correct answer
                  ? 'bg-green-100 border-green-500 text-green-800 ring-2 ring-green-300' // Clearly mark correct
                  : option === quizState.userAnswers[quizState.currentIndex] // Incorrect user choice
                    ? 'bg-red-100 border-red-500 text-red-800 ring-2 ring-red-300' // Clearly mark incorrect selection
                    : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed opacity-70' // Other incorrect options
                : 'bg-white border-gray-300 hover:border-[#004a74] hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-[#004a74] focus:ring-opacity-50' // Default state
              }`}
          >
            {option}
          </button>
        ))}
      </div>
    );
  };

  // Main quiz content rendering
  // Main quiz content rendering
  const renderQuizContent = () => {
    const totalAnswered = quizState.answeredFlags.filter(Boolean).length;

    // --- Results Screen ---
    if (quizState.quizCompleted) {
        const finalScore = score.correct; // Use the tracked score
        const totalAttempted = score.correct + score.incorrect; // Base percentage on attempted Qs
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
            {flashcards.map((card, index) => (
              <div key={index} className={`mb-4 border rounded-lg p-4 ${
                quizState.results[index] === 'correct' ? 'border-green-200 bg-green-50' :
                quizState.feedback[index]?.isClose ? 'border-yellow-200 bg-yellow-50' :
                quizState.results[index] === 'incorrect' ? 'border-red-200 bg-red-50' :
                'border-gray-200 bg-gray-50' // Not answered
              }`}>
                <div className="flex items-start gap-2 mb-2">
                  <div className="flex-shrink-0 w-6 h-6 mt-1">
                    {quizState.results[index] === 'correct' ? (
                        <Check className="w-6 h-6 text-green-600" />
                    ) : quizState.feedback[index]?.isClose ? (
                        <AlertCircle className="w-6 h-6 text-yellow-600" />
                    ) : quizState.results[index] === 'incorrect' ? (
                        <X className="w-6 h-6 text-red-600" />
                    ) : (
                        <span className="w-6 h-6 inline-block text-gray-400">-</span> // Placeholder for unanswered
                    )}
                  </div>
                  <p className="font-medium text-lg text-gray-800">Question {index + 1}: <span className="font-normal">{card.question}</span></p>
                </div>
                {quizState.answeredFlags[index] ? ( // Only show answers if attempted
                  <div className="pl-8">
                    <p className="text-sm text-gray-500">Your answer:</p>
                    <p className={`font-medium text-base mb-1 ${
                        quizState.results[index] === 'correct' ? 'text-green-700' : 
                        quizState.feedback[index]?.isClose ? 'text-yellow-700' : 'text-red-700'
                    }`}>
                        {quizState.userAnswers[index] || '(No answer provided)'}
                    </p>

                    {/* Display feedback if available and not correct */}
                    {quizState.feedback[index]?.feedback && quizState.results[index] !== 'correct' && (
                      <div className="mb-2 p-2 bg-white rounded border border-gray-200">
                        <p className="text-gray-700 text-sm">
                          <span className="font-medium">Feedback: </span>
                          {quizState.feedback[index].feedback}
                        </p>
                      </div>
                    )}

                    {/* Always show correct answer, regardless of whether the user was correct */}
                    <p className="text-sm text-gray-500 mt-2">Correct answer:</p>
                    <p className="text-green-700 font-medium text-base">{card.answer}</p>
                  </div>
                ) : (
                  <div className="pl-8 text-gray-500 italic">Not answered</div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <button
              onClick={resetQuiz}
              className="flex items-center gap-2 bg-[#004a74] text-white px-6 py-3 rounded-lg
                hover:bg-[#00659f] transition-all font-semibold text-lg"
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
        {/* Progress Bar and Score */}
         <div className="w-full mb-4">
            <div className="flex justify-between items-center mb-2 text-sm text-gray-600">
                <span>Question {quizState.currentIndex + 1} of {totalCards}</span>
                <span>Score: {score.correct} Correct, {score.incorrect} Incorrect</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                    className="bg-[#004a74] h-2.5 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${((quizState.currentIndex + 1) / totalCards) * 100}%` }} // Progress based on current question
                ></div>
            </div>
        </div>


        {/* Question Card */}
        <div className="w-full bg-white border border-gray-200 rounded-xl shadow-lg p-6 md:p-8 mb-6">
          {/* Question Display */}
           <div className="mb-6 min-h-[80px]"> {/* Ensure minimum height */}
             <p className="text-gray-500 text-sm font-medium mb-1">QUESTION</p>
             <p className="text-xl md:text-2xl text-gray-800">{currentCard.question}</p>
           </div>


          {/* Answer Area (Input or Feedback) */}
          <div className="min-h-[180px]"> {/* Ensure consistent height */}
            {quizState.showAnswer ? (
              // Feedback Section
              <div className={`rounded-lg p-4 border ${
                  quizState.results[quizState.currentIndex] === 'correct'
                    ? 'bg-green-50 border-green-200'
                    : quizState.feedback[quizState.currentIndex]?.isClose
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-red-50 border-red-200'
              }`}>
                 <div className="flex justify-between items-center mb-2">
                    <h3 className={`font-bold text-lg ${
                        quizState.results[quizState.currentIndex] === 'correct' 
                          ? 'text-green-700' 
                          : quizState.feedback[quizState.currentIndex]?.isClose
                            ? 'text-yellow-700'
                            : 'text-red-700'
                    }`}>
                        Your Answer:
                    </h3>
                    {quizState.results[quizState.currentIndex] === 'correct' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            <Check className="w-4 h-4" /> Correct
                        </span>
                    ) : quizState.feedback[quizState.currentIndex]?.isClose ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                            <AlertCircle className="w-4 h-4" /> Close!
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                            <X className="w-4 h-4" /> Incorrect
                        </span>
                    )}
                </div>
                <p className="text-lg text-gray-700 break-words">{quizState.userAnswers[quizState.currentIndex] || "(No answer provided)"}</p>

                {/* Display feedback if available */}
                {quizState.feedback[quizState.currentIndex]?.feedback && quizState.results[quizState.currentIndex] !== 'correct' && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-700 mb-1">Feedback:</h4>
                    <p className="text-gray-600">{quizState.feedback[quizState.currentIndex].feedback}</p>
                  </div>
                )}

                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <h3 className="font-bold text-lg text-green-700">Correct Answer:</h3>
                    <p className="text-lg text-gray-700 break-words">{currentCard.answer}</p>
                  </div>

              </div>
            ) : (
              // Input Section
              quizType === 'multiple-choice' ? (
                renderMultipleChoiceOptions()
              ) : (
                // Text Input
                 <div className="flex flex-col gap-4">
                    <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Type your answer here..."
                    rows={4} // Set a reasonable number of rows
                    className="w-full p-3 rounded-lg border border-[#004a74] focus:outline-none focus:ring-2 focus:ring-[#004a74]/20 text-base resize-vertical transition-all"
                    />
                    <button
                    onClick={handleTextCheck}
                    disabled={!userInput.trim()} // Disable if input is empty
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
                // Placeholder to maintain layout spacing when Check Answer/MC options are shown
                <div className="w-[130px]"></div> // Adjust width to roughly match button size
             )}

           {/* Next Button (Always available except on last card if answer not shown) */}
           {/* Hide the general 'Next' if the 'Proceed' button is shown */}
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
           {/* Show an empty div matching Next button size when 'Proceed' is shown to keep 'Previous' aligned left */}
           {quizState.showAnswer && quizState.currentIndex !== totalCards - 1 && (
                <div className="w-[100px]"></div> // Adjust width to match Next button size
           )}
           {/* Hide next button completely on last card when answer is shown */}
            {quizState.showAnswer && quizState.currentIndex === totalCards - 1 && (
                 <div className="w-[100px]"></div> // Adjust width to match Next button size
            )}

        </div>

      </div>
    );
  };

  // --- Component Return ---

  if (isStandalone) {
    return (
      <div className="min-h-screen bg-gray-50"> {/* Lighter background */}
        <NavBar />
        <div className="pt-24 pb-12 px-4 md:px-6 max-w-7xl mx-auto">
           {/* Back Button */}
           <button
              onClick={() => navigate(`/study/${setId}`)} 
              className="flex items-center text-sm bg-white px-3 py-2 rounded-lg shadow-sm border border-[#004a74]/20 text-[#004a74] hover:bg-[#e3f3ff] transition-colors mb-4"
          >
              <ChevronLeft className="w-4 h-4 mr-1" /> Back to Set Page 
          </button>

          {/* Set Title and Quiz Type */}
          <div className="mb-6 text-center md:text-left">
             {flashcardSet.title && (
                <h1 className="text-2xl md:text-3xl font-bold text-[#004a74] mb-2">{flashcardSet.title}</h1>
             )}
              <p className="text-lg text-gray-600">
                  Quiz Mode: <span className="font-semibold">{quizType === 'multiple-choice' ? 'Multiple Choice' : 'Text Input'}</span>
              </p>
          </div>


         {/* Quiz Type Selector - Enhanced Design with Fixed Alignment and Animation */}
         <div className="mb-8 flex justify-center">
            <div className="bg-white p-2 rounded-xl shadow-lg border border-gray-100">
              <div className="relative grid grid-cols-2 w-[300px]">
                {/* Animated Background Slider */}
                <div 
                  className={`absolute top-0 bottom-0 w-1/2 bg-[#004a74] rounded-lg transition-all duration-300 ease-out ${
                    quizType === 'multiple-choice' ? 'translate-x-full' : 'translate-x-0'
                  }`} 
                  aria-hidden="true"
                />
                
                {/* Text Input Button */}
                <div className="relative">
                  <button
                    onClick={() => navigate(`/quiz/${setId}/text`)}
                    className="w-full py-3 text-base font-medium text-center"
                    type="button"
                  >
                    <span className={`relative z-10 transition-colors duration-200 ${quizType === 'text-input' ? 'text-white' : 'text-gray-700 hover:text-[#004a74]'}`}>
                      Text Input
                    </span>
                  </button>
                </div>
                
                {/* Multiple Choice Button */}
                <div className="relative">
                  <button
                    onClick={() => navigate(`/quiz/${setId}/multiple-choice`)}
                    className="w-full py-3 text-base font-medium text-center"
                    type="button"
                  >
                    <span className={`relative z-10 transition-colors duration-200 ${quizType === 'multiple-choice' ? 'text-white' : 'text-gray-700 hover:text-[#004a74]'}`}>
                      Multiple Choice
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main quiz content */}
          {renderQuizContent()}
        </div>
      </div>
    );
  }

  // Embedded version
  return renderQuizContent();
};

export default MultipleChoiceQuiz;