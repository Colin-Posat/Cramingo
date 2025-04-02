import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft as ChevronLeftIcon,
  Edit3 as Edit3Icon,
  AlertCircle as AlertCircleIcon
} from 'lucide-react';
import NavBar from '../../components/NavBar'; // Adjust the import path as needed

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
};

// Add the animation styles to the document
const fadeInAnimation = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn {
  animation: fadeIn 0.2s ease-in-out forwards;
}
`;

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = fadeInAnimation;
  document.head.appendChild(style);
}

const SetViewingPage: React.FC = () => {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const [flashcardSet, setFlashcardSet] = useState<FlashcardSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'flashcards' | 'quiz'>('flashcards');

  useEffect(() => {
    const fetchFlashcardSet = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = user.id || user.uid;
        
        if (!userId) {
          setError("User not authenticated");
          setLoading(false);
          return;
        }
        
        if (!setId) {
          setError("No flashcard set ID provided");
          setLoading(false);
          return;
        }
        
        try {
          // Fetch from API
          const response = await fetch(`http://localhost:6500/api/sets/${setId}`, {
            credentials: 'include'
          });
          
          if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
          }
          
          const responseText = await response.text();
          
          // Parse the response
          try {
            const data = JSON.parse(responseText);
            console.log('Flashcard set data:', data);
            setFlashcardSet(data);
          } catch (parseError) {
            console.error('Error parsing response:', parseError);
            setError("Invalid data format received from server");
          }
        } catch (fetchError) {
          console.error('Fetch error:', fetchError);
          setError("Failed to load flashcard set. Please check your connection.");
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

  // Handle edit button click
  const handleEditSet = () => {
    if (flashcardSet) {
      localStorage.setItem("editingFlashcardSet", JSON.stringify(flashcardSet));
      navigate('/set-creator');
    }
  };

  // Format date (simplified version from your existing code)
  const formatDate = (dateValue: any): string => {
    if (!dateValue) return 'Recently created';
    
    try {
      // Handle Firestore Timestamp object
      if (typeof dateValue === 'object' && 'seconds' in dateValue) {
        const milliseconds = dateValue.seconds * 1000;
        return new Date(milliseconds).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }
      
      // Handle string or number dates
      return new Date(dateValue).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Recently created';
    }
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
      <div className="min-h-screen bg-white">
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
      <div className="min-h-screen bg-white">
        <NavBar />
        <div className="pt-24 px-6 pb-6">
          <div className="bg-[rgba(229,57,53,0.1)] text-[#e53935] p-3 rounded-md animate-fadeIn flex items-center">
            <AlertCircleIcon className="w-5 h-5 mr-2" />
            <div>
              <p className="font-bold">Error</p>
              <p>{error || "Failed to load flashcard set"}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 bg-[#e53935] text-white px-4 py-1 rounded-lg text-sm hover:bg-[#d32f2f] transition-all"
              >
                Try Again
              </button>
            </div>
          </div>
          <button 
            onClick={() => navigate('/created-sets')}
            className="mt-4 bg-[#004a74] text-white px-4 py-2 rounded-lg flex items-center hover:bg-[#00659f] hover:scale-[1.03] transition-all"
          >
            <ChevronLeftIcon className="w-5 h-5 mr-1" />
            Back to Created Sets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <NavBar />

      {/* Back Button */}
      <button 
        onClick={() => navigate('/created-sets')}
        className="fixed top-4 left-4 bg-transparent text-white flex items-center 
          justify-center z-50 hover:scale-110 transition-transform"
      >
        <ChevronLeftIcon className="w-8 h-8" />
      </button>

      {/* Controls Container */}
      <div className="pt-24 px-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
        {/* Title and Class Code */}
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center flex-wrap gap-3 w-full">
            <h1 className="text-3xl font-bold text-[#004a74] break-words max-w-2xl">
              {flashcardSet.title}
            </h1>
            
            <span className="bg-[#e3f3ff] text-[#004a74] px-4 py-2 rounded-lg border border-[#004a74] font-medium flex-shrink-0">
              {flashcardSet.classCode}
            </span>
          </div>
        </div>
        
        {/* Edit Button */}
        <button 
          onClick={handleEditSet}
          className="mt-4 md:mt-0 bg-[#e3f3ff] text-black px-6 py-3 rounded-lg 
             hover:scale-[1.03] transition-all flex items-center gap-2 shadow-md font-bold"
        >
          <Edit3Icon className="w-5 h-5" />
          Edit Set
        </button>
      </div>

      {/* View Mode Buttons */}
      <div className="flex justify-center px-6 mt-6 gap-4">
      <button
            onClick={navigateToFlashcardView}
            className={`flex-1 py-3 px-4 rounded-lg font-bold text-xl transition-all shadow-md
            ${viewMode === 'flashcards'
                ? 'bg-[#004a74] text-white'
                : 'bg-[#e3f3ff] text-black hover:scale-[1.03]'
            }`}
        >
            View as Flashcards
        </button>
        
        <button 
          onClick={navigateToQuizView}
          className={`flex-1 py-3 px-4 rounded-lg font-bold text-xl transition-all shadow-md
            ${viewMode === 'quiz' 
              ? 'bg-[#004a74] text-white' 
              : 'bg-[#e3f3ff] text-black '
            }`}
        >
          View as Quiz
        </button>
      </div>

      {/* Flashcards */}
      <div className="px-6 mt-6 pb-20">
        <div className="flex flex-col gap-6">
          {flashcardSet.flashcards.map((card, index) => (
            <div 
              key={index} 
              className="bg-[#004a74] text-white p-5 rounded-xl relative 
                h-[220px] flex items-center justify-between gap-3"
            >
              {/* Card Number */}
              <div className="flex items-center justify-center w-10 h-10 bg-white text-[#004a74] 
                rounded-full font-bold text-lg mr-3">
                {index + 1}
              </div>
              
              {/* Question */}
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-lg font-bold">Question:</label>
                <div className="w-full h-32 p-3 text-lg rounded bg-white text-black overflow-auto
                  border-2 border-black">
                  {card.question || "No question"}
                </div>
              </div>
              
              {/* Answer */}
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-lg font-bold">Answer:</label>
                <div className="w-full h-32 p-3 text-lg rounded bg-white text-black overflow-auto
                  border-2 border-black">
                  {card.answer || "No answer"}
                </div>
              </div>
            </div>
          ))}
          
          {flashcardSet.flashcards.length === 0 && (
            <div className="bg-[#e3f3ff] p-6 rounded-xl text-center animate-fadeIn">
              <p className="text-xl text-[#004a74]">This set doesn't have any flashcards yet.</p>
              <button 
                onClick={handleEditSet}
                className="mt-4 bg-[#004a74] text-white px-6 py-2 rounded-lg hover:bg-[#00659f] 
                  transition-all hover:scale-[1.03]"
              >
                Add Flashcards
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SetViewingPage;