import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft as ChevronLeftIcon,
  Edit3 as Edit3Icon,
  AlertCircle as AlertCircleIcon,
  ChevronDown as ChevronDownIcon,
  Book as BookIcon,
  ClipboardList as ClipboardListIcon
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

const SetViewingPage: React.FC = () => {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const [flashcardSet, setFlashcardSet] = useState<FlashcardSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'flashcards' | 'quiz'>('flashcards');
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

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

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => navigate('/created-sets')}
            className="flex items-center text-sm text-[#004a74] hover:underline"
          >
            <ChevronLeftIcon className="w-4 h-4 mr-1" /> Back to Created Sets 
          </button>
          
          <button 
            onClick={handleEditSet}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[#004a74] bg-white border border-[#004a74] hover:bg-blue-50 transition-colors"
          >
            <Edit3Icon className="w-5 h-5" /> Edit Set
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-[#004a74]">
              {flashcardSet.title}
            </h1>
            <span className="bg-[#e3f3ff] text-[#004a74] px-4 py-2 rounded-lg border border-[#004a74] font-medium">
              {flashcardSet.classCode}
            </span>
          </div>

          {/* View Mode Buttons */}
          <div className="flex justify-center mb-6 gap-4">
            <button
              onClick={navigateToFlashcardView}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-lg transition-all 
              ${viewMode === 'flashcards'
                  ? 'bg-[#004a74] text-white shadow-lg'
                  : 'bg-white text-[#004a74] border border-[#004a74]/20 hover:bg-[#e3f3ff] hover:shadow-md'
              } group flex items-center justify-center gap-2`}
            >
              <BookIcon className={`w-5 h-5 transition-transform 
                ${viewMode === 'flashcards' ? 'text-white' : 'text-[#004a74] group-hover:scale-110'}`} />
              View Flashcards
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
              Take Quiz
            </button>
          </div>

          {/* Flashcards */}
          <div className="space-y-6">
            {flashcardSet.flashcards.length === 0 ? (
              <div className="bg-blue-50 p-6 rounded-xl text-center border border-blue-200">
                <p className="text-xl text-[#004a74] mb-4">This set doesn't have any flashcards yet.</p>
                <button 
                  onClick={handleEditSet}
                  className="bg-[#004a74] text-white px-6 py-2 rounded-lg hover:bg-[#00659f] transition-all"
                >
                  Add Flashcards
                </button>
              </div>
            ) : (
              flashcardSet.flashcards.map((card, index) => (
                <div 
                  key={index} 
                  className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
                >
                  <div className="bg-[#004a74] text-white px-6 py-4 flex items-center justify-between">
                    <span className="text-xl font-bold">Card {index + 1}</span>
                  </div>
                  <div className="p-6 grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-[#004a74] mb-3">Question</h3>
                      <div 
                        className={`
                          bg-gray-50 p-4 rounded-lg border border-gray-200 
                          ${expandedCards.has(index) ? 'min-h-fit' : 'max-h-36 overflow-hidden relative'}
                        `}
                      >
                        <p className="text-gray-800">{card.question || "No question provided"}</p>
                        {!expandedCards.has(index) && card.question.length > 200 && (
                          <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-gray-50 to-transparent"></div>
                        )}
                      </div>
                      {card.question.length > 200 && (
                        <button 
                          onClick={() => toggleCardExpansion(index)}
                          className="w-full mt-2 flex items-center justify-center text-[#004a74] hover:bg-blue-50 py-1 rounded-lg transition-colors"
                        >
                          <ChevronDownIcon 
                            className={`w-5 h-5 transition-transform ${
                              expandedCards.has(index) ? 'rotate-180' : ''
                            }`} 
                          />
                          {expandedCards.has(index) ? 'Collapse' : 'Expand'}
                        </button>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[#004a74] mb-3">Answer</h3>
                      <div 
                        className={`
                          bg-gray-50 p-4 rounded-lg border border-gray-200 
                          ${expandedCards.has(index) ? 'min-h-fit' : 'max-h-36 overflow-hidden relative'}
                        `}
                      >
                        <p className="text-gray-800">{card.answer || "No answer provided"}</p>
                        {!expandedCards.has(index) && card.answer.length > 200 && (
                          <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-gray-50 to-transparent"></div>
                        )}
                      </div>
                      {card.answer.length > 200 && (
                        <button 
                          onClick={() => toggleCardExpansion(index)}
                          className="w-full mt-2 flex items-center justify-center text-[#004a74] hover:bg-blue-50 py-1 rounded-lg transition-colors"
                        >
                          <ChevronDownIcon 
                            className={`w-5 h-5 transition-transform ${
                              expandedCards.has(index) ? 'rotate-180' : ''
                            }`} 
                          />
                          {expandedCards.has(index) ? 'Collapse' : 'Expand'}
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
    </div>
  );
};

export default SetViewingPage;