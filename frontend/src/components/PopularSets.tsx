import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen as BookOpenIcon, Heart as HeartIcon, School as SchoolIcon } from 'lucide-react';
import { API_BASE_URL } from '../config/api'; // Adjust path as needed
import { useAuth } from '../context/AuthContext'; // Import auth context

// Type definitions (same as in SearchResultsPage)
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
  isPublic: boolean;
  icon?: string;
  createdAt?: string | object;
  description?: string;
  userId?: string;
  username?: string;
  createdBy?: string;
  likes?: number;
  university?: string;
};

// Helper function to slugify university names (same as in SearchSetsPage)
const slugifyUniversityName = (universityName: string): string => {
  return universityName
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with a single hyphen
    .trim();                  // Trim leading/trailing hyphens
};

const PopularSets: React.FC = () => {
  const [popularSets, setPopularSets] = useState<FlashcardSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth(); // Get user info from auth context

  useEffect(() => {
    const fetchPopularSets = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let endpoint = `${API_BASE_URL}/sets/popular`;
        
        // If user has university info, add it as a query parameter
        if (user?.university) {
          const slugifiedUni = slugifyUniversityName(user.university);
          endpoint = `${API_BASE_URL}/sets/popular?university=${encodeURIComponent(slugifiedUni)}`;
          console.log(`📚 Fetching popular sets for ${user.university}`);
        } else {
          console.log('❌ No university info available, fetching general popular sets');
        }
        
        const response = await fetch(endpoint, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Popular sets:', data);
        
        // Filter sets by user's university if university info exists
        let filteredSets = data;
        if (user?.university) {
          filteredSets = data.filter((set: FlashcardSet) => 
            !set.university || // Include sets without university info
            set.university.toLowerCase() === user.university?.toLowerCase() // Match by university
          );
          
          console.log(`📊 Found ${filteredSets.length} sets for ${user.university}`);
        }
        
        setPopularSets(filteredSets);
      } catch (error) {
        console.error('Error fetching popular sets:', error);
        setError("Failed to load popular sets");
        
        // Fallback to mock data only if there's an error - now with university field
        // We'll pretend these mock sets are from the user's university
        if (user?.university) {
          const mockSets = [
            {
              id: "mock1",
              title: "Calculus Fundamentals",
              classCode: "MATH103",
              numCards: 45,
              likes: 124,
              flashcards: [],
              isPublic: true,
              university: user.university
            },
            {
              id: "mock2",
              title: "Introduction to Programming",
              classCode: "CSE101",
              numCards: 36,
              likes: 98,
              flashcards: [],
              isPublic: true,
              university: user.university
            },
            {
              id: "mock3",
              title: "Organic Chemistry Basics",
              classCode: "CHEM110",
              numCards: 52,
              likes: 87,
              flashcards: [],
              isPublic: true,
              university: user.university
            },
            {
              id: "mock4",
              title: "Physics Mechanics",
              classCode: "PHYS104",
              numCards: 29,
              likes: 76,
              flashcards: [],
              isPublic: true,
              university: user.university
            },
            {
              id: "mock5",
              title: "Cell Biology Review",
              classCode: "BIO201",
              numCards: 63,
              likes: 63,
              flashcards: [],
              isPublic: true,
              university: user.university
            }
          ];
          setPopularSets(mockSets);
        } else {
          // Generic mock data if no university
          const mockSets = [
            {
              id: "mock1",
              title: "Calculus Fundamentals",
              classCode: "MATH103",
              numCards: 45,
              likes: 124,
              flashcards: [],
              isPublic: true
            },
            {
              id: "mock2",
              title: "Introduction to Programming",
              classCode: "CSE101",
              numCards: 36,
              likes: 98,
              flashcards: [],
              isPublic: true
            },
            {
              id: "mock3",
              title: "Organic Chemistry Basics",
              classCode: "CHEM110",
              numCards: 52,
              likes: 87,
              flashcards: [],
              isPublic: true
            }
          ];
          setPopularSets(mockSets);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchPopularSets();
  }, [user]); // Add user to dependency array to refetch when user changes

  // Updated viewSet function to pass the fromPopularSets state
  const viewSet = (setId: string) => {
    navigate(`/study/${setId}`, {
      state: {
        fromPopularSets: true
      }
    });
  };

  if (loading) {
    return (
      <div className="mt-8 bg-white backdrop-blur-sm rounded-2xl shadow-md border border-gray-100 p-6">
        <h2 className="text-lg font-medium text-gray-800 mb-4">Most Popular Sets</h2>
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#004a74]"></div>
          <span className="ml-3 text-gray-500">Loading popular sets...</span>
        </div>
      </div>
    );
  }

  if (error && (!popularSets || popularSets.length === 0)) {
    return (
      <div className="mt-8 bg-white backdrop-blur-sm rounded-2xl shadow-md border border-gray-100 p-6">
        <h2 className="text-lg font-medium text-gray-800 mb-4">Most Popular Sets</h2>
        <p className="text-gray-500 text-sm">Unable to load popular sets at this time.</p>
      </div>
    );
  }

  return (
    <div className="mt-8 bg-white backdrop-blur-sm rounded-2xl shadow-md border border-gray-100 p-6">
      <h2 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
        {user?.university ? (
          <>
            <SchoolIcon className="w-5 h-5 mr-2 text-[#004a74]" />
            <span>Most Popular Sets at {user.university}</span>
          </>
        ) : (
          'Most Popular Sets'
        )}
      </h2>
      
      <div className="space-y-3">
        {popularSets.map((set) => (
          <div 
            key={set.id}
            onClick={() => viewSet(set.id)}
            className="flex items-start border border-gray-100 rounded-xl p-3 hover:bg-[#e3f3ff]/30 transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 bg-[#004a74] rounded-lg flex items-center justify-center flex-shrink-0 mr-3">
              <BookOpenIcon className="w-5 h-5 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-[#004a74] truncate">{set.title}</h3>
              <div className="flex items-center mt-1">
                <span className="bg-[#004a74]/10 text-[#004a74] px-2 py-0.5 rounded text-xs font-medium">
                  {set.classCode}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  {set.numCards || (set.flashcards && set.flashcards.length) || 0} cards
                </span>
                {set.createdBy && (
                  <span className="text-xs text-gray-500 ml-2">
                    by {set.createdBy}
                  </span>
                )}
              </div>
            </div>
            
            <div className="text-rose-500 flex items-center whitespace-nowrap ml-2">
              <HeartIcon className="w-4 h-4 mr-1 fill-rose-500" />
              <span>{set.likes || 0}</span>
            </div>
          </div>
        ))}
      </div>
      
      {popularSets.length === 0 && (
        <div className="text-center py-6">
          <p className="text-gray-500">No popular sets available for {user?.university || 'your university'} yet.</p>
          <p className="text-sm text-gray-400 mt-1">Be the first to create one!</p>
        </div>
      )}
    </div>
  );
};

export default PopularSets;