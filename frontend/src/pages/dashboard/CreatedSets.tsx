import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusIcon, 
  BookIcon, 
  XIcon 
} from 'lucide-react';
import NavBar from '../../components/NavBar'; // Adjust the import path as needed

// Type for Flashcard Set
type FlashcardSet = {
  id: string;
  title: string;
  description?: string;
  isPublic?: boolean;
  cardCount?: number;
};

const CreatedSets: React.FC = () => {
  const navigate = useNavigate();
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [showHelper, setShowHelper] = useState(false);

  // Fetch created sets when component mounts
  useEffect(() => {
    const fetchSets = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const response = await fetch(`http://localhost:6500/api/sets/created/${user.id}`);
        
        if (response.ok) {
          const data = await response.json();
          setSets(data);

          // Show helper only if no sets and first visit
          if (data.length === 0) {
            const hasSeenHelper = localStorage.getItem('hasSeenCreatedSetsHelper');
            if (!hasSeenHelper) {
              setShowHelper(true);
              localStorage.setItem('hasSeenCreatedSetsHelper', 'true');
            }
          }
        } else {
          console.error('Failed to fetch sets');
        }
      } catch (error) {
        console.error('Error fetching sets:', error);
      }
    };

    fetchSets();
  }, []);

  // Handle create set button click
  const handleCreateSet = () => {
    navigate('/set-creator');
  };

  // Close helper
  const closeHelper = () => {
    setShowHelper(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <NavBar />

      {/* Sets Container */}
      <div className="pt-24 px-6 pb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sets.map((set) => (
            <div 
              key={set.id} 
              className="bg-blue-50 rounded-xl p-6 shadow-md hover:shadow-xl 
                transition-all duration-300 transform hover:-translate-y-2 
                cursor-pointer"
              onClick={() => navigate(`/set/${set.id}`)}
            >
              <h3 className="text-2xl font-bold text-[#004a74] mb-2">
                {set.title}
              </h3>
              {set.description && (
                <p className="text-gray-600 mb-4">{set.description}</p>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  {set.cardCount || 0} cards
                </span>
                {set.isPublic ? (
                  <span className="text-sm text-green-600">Public</span>
                ) : (
                  <span className="text-sm text-gray-500">Private</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* No Sets Helper */}
        {showHelper && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="relative bg-white rounded-xl max-w-xl w-full shadow-2xl">
              <div className="p-6 text-center">
                <BookIcon className="mx-auto w-16 h-16 text-[#004a74] mb-4" />
                <h2 className="text-2xl font-bold text-[#004a74] mb-4">
                  Welcome to Your Study Sets!
                </h2>
                <p className="text-gray-600 mb-6">
                  It looks like you don't have any study sets yet. Click "Create Set" to get started and boost your learning!
                </p>
                <button 
                  onClick={closeHelper}
                  className="bg-[#004a74] text-white px-6 py-3 rounded-full 
                    hover:bg-[#00659f] transition-colors flex items-center 
                    justify-center mx-auto gap-2"
                >
                  <XIcon className="w-5 h-5" />
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Set Button */}
      <button 
        onClick={handleCreateSet}
        className="fixed bottom-6 left-6 bg-[#004a74] text-white 
          rounded-full p-4 shadow-xl hover:bg-[#00659f] 
          transition-colors flex items-center gap-2 z-50"
      >
        <PlusIcon className="w-6 h-6" />
        Create Set
      </button>
    </div>
  );
};

export default CreatedSets;