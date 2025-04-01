import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookmarkIcon, 
  XIcon,
  SearchIcon
} from 'lucide-react';
import NavBar from '../../components/NavBar'; // Adjust the import path as needed

// Type for Flashcard Set
type FlashcardSet = {
  id: string;
  title: string;
  description?: string;
  owner?: string;
  cardCount?: number;
};

const SavedSets: React.FC = () => {
  const navigate = useNavigate();
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [showHelper, setShowHelper] = useState(false);

  // Fetch saved sets when component mounts
  useEffect(() => {
    const fetchSavedSets = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const response = await fetch(`http://localhost:6500/api/sets/saved/${user.id}`);
        
        if (response.ok) {
          const data = await response.json();
          setSets(data);

          // Show helper only if no sets and first visit
          if (data.length === 0) {
            const hasSeenHelper = localStorage.getItem('hasSeenSavedSetsHelper');
            if (!hasSeenHelper) {
              setShowHelper(true);
              localStorage.setItem('hasSeenSavedSetsHelper', 'true');
            }
          }
        } else {
          console.error('Failed to fetch saved sets');
        }
      } catch (error) {
        console.error('Error fetching saved sets:', error);
      }
    };

    fetchSavedSets();
  }, []);

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
        {/* Show grid of sets if there are any */}
        {sets.length > 0 ? (
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
                  {set.owner && (
                    <span className="text-sm text-gray-600">By: {set.owner}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Empty State - Shows when no sets are present
          <div className="flex items-center justify-center h-[calc(100vh-9rem)] w-full">
            <div className="bg-blue-50 rounded-xl p-8 shadow-md max-w-md w-full text-center">
              <BookmarkIcon className="mx-auto w-20 h-20 text-[#004a74] mb-6" />
              <h2 className="text-2xl font-bold text-[#004a74] mb-4">
                No Saved Sets Yet
              </h2>
              <p className="text-gray-600 mb-6">
                You haven't saved any study sets yet. Click the "Search Sets" link in the navigation bar to find and save sets for your classes.
              </p>
              <div className="flex items-center justify-center gap-3 bg-[#e3f3ff] p-3 rounded-lg">
                <div className="flex items-center text-[#004a74]">
                  <SearchIcon className="w-5 h-5" />
                  <span className="font-bold ml-1">Search Sets</span>
                </div>
                <span className="text-gray-500">→</span>
                <span className="text-gray-600">In the navigation bar</span>
              </div>
            </div>
          </div>
        )}

        {/* No Sets Helper */}
        {showHelper && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="relative bg-white rounded-xl max-w-xl w-full shadow-2xl">
              <div className="p-6 text-center">
                <BookmarkIcon className="mx-auto w-16 h-16 text-[#004a74] mb-4" />
                <h2 className="text-2xl font-bold text-[#004a74] mb-4">
                  Welcome to Your Saved Sets!
                </h2>
                <p className="text-gray-600 mb-6">
                  This is where you'll find study sets you've saved from other students. Click the "Search Sets" tab in the navigation bar to find and save sets for your classes.
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
    </div>
  );
};

// Add CSS for animation
const fadeInAnimation = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn {
  animation: fadeIn 0.2s ease-in-out forwards;
}
`;

// Add the animation styles to the document
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = fadeInAnimation;
  document.head.appendChild(style);
}

export default SavedSets;