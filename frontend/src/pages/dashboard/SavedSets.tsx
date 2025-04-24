import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookmarkIcon, 
  XIcon,
  SearchIcon,
  AlertCircleIcon,
  BookIcon,
  UsersIcon,
  BookmarkX,
  HeartIcon
} from 'lucide-react';
import NavBar from '../../components/NavBar';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';

// Type for Flashcard Set
interface FlashcardSet {
  id: string;
  title: string;
  description?: string;
  classCode?: string;
  numCards: number;
  isPublic?: boolean;
  icon?: string;
  userId?: string;
  username?: string;
  originalSetId?: string;
  originalCreatorId?: string;
  originalCreatorUsername?: string;
  isDerived?: boolean;
  savedByUsername?: string;
  likes?: number;
  createdAt: { seconds: number; nanoseconds: number } | string;
  createdBy?: string;
  flashcards?: Array<{ question: string; answer: string }>;
}

const SavedSets: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showHelper, setShowHelper] = useState<boolean>(false);
  const [showUnsaveModal, setShowUnsaveModal] = useState(false);
  const [setToUnsave, setSetToUnsave] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchSavedSets = async () => {
      try {
        setLoading(true);
        setError(null);

        const apiUrl = import.meta.env.VITE_API_URL || API_BASE_URL;
        const response = await fetch(`${apiUrl}/sets/saved/${user.uid}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error('Invalid server response');
        }
        const arr = Array.isArray(data) ? data : [];
        setSets(arr);

        if (arr.length === 0 && !localStorage.getItem('hasSeenSavedSetsHelper')) {
          setShowHelper(true);
          localStorage.setItem('hasSeenSavedSetsHelper', 'true');
        }
      } catch (err) {
        console.error(err);
        setError('An unexpected error occurred. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSavedSets();
  }, [authLoading, user, navigate]);

  const closeHelper = () => setShowHelper(false);
  const goToSearch = () => navigate('/search-sets');
  const handleSetClick = (id: string) => navigate(`/study/${id}`);
  const confirmUnsave = (e: React.MouseEvent, id: string) => { e.stopPropagation(); setSetToUnsave(id); setShowUnsaveModal(true); };

  const unsaveSet = async () => {
    if (!setToUnsave || !user) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || API_BASE_URL;
      const res = await fetch(`${apiUrl}/sets/unsave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ setId: setToUnsave, userId: user.uid })
      });
      if (res.ok) {
        setSets(sets.filter(s => s.id !== setToUnsave));
        setShowUnsaveModal(false);
        setSetToUnsave(null);
      } else {
        console.error(await res.text());
        alert('Failed to unsave the set. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to unsave the set. Please check your connection.');
    }
  };

  const formatDate = (value: any) => {
    try {
      let date: Date;
      if (typeof value === 'object' && 'seconds' in value) {
        const ms = value.seconds * 1000 + (value.nanoseconds || 0) / 1e6;
        date = new Date(ms);
      } else {
        date = new Date(value);
      }
      return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
    } catch {
      return 'Recently saved';
    }
  };

  const getCreatorName = (set: FlashcardSet) => {
    if (set.originalCreatorUsername) return `Created by ${set.originalCreatorUsername}`;
    if (set.createdBy) return `Created by ${set.createdBy}`;
    if (set.username) return `Created by ${set.username}`;
    if (set.originalCreatorId) return `User ${set.originalCreatorId.slice(0,6)}`;
    if (set.userId) return `User ${set.userId.slice(0,6)}`;
    return 'Public set';
  };

  if (loading) return (
    <div className="min-h-screen bg-white">
      <NavBar />
      <div className="pt-24 px-6 flex items-center justify-center h-[calc(100vh-9rem)]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004a74]" />
          <p className="mt-4 text-[#004a74] font-medium">Loading your saved sets...</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      <div className="fixed top-20 left-0 right-0 px-6 z-10">
        <button onClick={goToSearch} className="bg-[#004a74] text-white font-bold py-4 px-6 rounded-xl hover:bg-[#00659f] active:scale-[0.98] transition-all flex items-center gap-3 shadow-md text-xl">
          <SearchIcon className="w-5 h-5" />
          <span>Find Sets</span>
        </button>
      </div>
      <div className="pt-32 px-6 pb-6">
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded flex items-start">
            <AlertCircleIcon className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold">Error</p>
              <p>{error}</p>
              <button onClick={() => window.location.reload()} className="mt-2 bg-red-700 text-white px-4 py-1 rounded text-sm hover:bg-red-800 transition">Try Again</button>
            </div>
          </div>
        )}
        {sets.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-10">
            {sets.map(set => (
              <div key={set.id} onClick={() => handleSetClick(set.id)} className="bg-blue-50 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 relative cursor-pointer overflow-hidden border-2 hover:border-[#004a74]/20 flex flex-col min-h-[250px]">
                <div className="bg-[#004a74]/10 p-3"><div className="text-sm font-medium text-[#004a74]">Saved Set</div></div>
                <div className="p-4 flex-grow flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-[#004a74] mb-2 line-clamp-2">{set.title}</h3>
                    {set.classCode && <div className="text-sm text-gray-700 font-medium mb-1"><span className="text-[#004a74]">Class:</span> {set.classCode}</div>}
                    {set.description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{set.description}</p>}
                  </div>
                  <div className="flex justify-between items-end mt-3">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center"><BookIcon className="w-4 h-4 mr-1 text-[#004a74]"/><span className="text-sm font-semibold text-[#004a74]">{set.numCards} {set.numCards === 1 ? 'card' : 'cards'}</span></div>
                      <div className="flex items-center"><HeartIcon className="w-4 h-4 mr-1 text-rose-500 fill-rose-500"/><span className="text-sm font-semibold text-[#004a74]">{set.likes || 0} {(set.likes === 1) ? 'like' : 'likes'}</span></div>
                    </div>
                  </div>
                </div>
                <div className="bg-[#004a74] p-4 flex justify-between items-center text-white">
                  <span className="text-sm font-medium">Click to study</span>
                  <div className="flex items-center gap-2">
                    <div className="text-xs flex items-center mr-3"><UsersIcon className="w-3 h-3 mr-1"/>{getCreatorName(set)}</div>
                    <button onClick={e => confirmUnsave(e, set.id)} className="bg-white text-red-500 p-2 rounded-full hover:bg-red-100 transition" aria-label="Unsave set">
                      <BookmarkX className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-[calc(100vh-9rem)] w-full">
            <div className="bg-blue-50 rounded-xl p-10 shadow-lg max-w-lg text-center">
              <BookmarkIcon className="mx-auto w-24 h-24 text-[#004a74] mb-8" />
              <h2 className="text-3xl font-bold text-[#004a74] mb-6">No Saved Sets Yet</h2>
              <p className="text-lg text-gray-600 mb-8">You haven't saved any flashcard sets yet. Click the button below to search for sets and save your favorites.</p>
              <button onClick={goToSearch} className="bg-[#004a74] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#00659f] active:scale-[0.98] transition-all shadow-md text-xl flex items-center gap-3 mx-auto">
                <SearchIcon className="w-6 h-6" /> Find Sets
              </button>
            </div>
          </div>
        )}
        {showHelper && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl text-center p-8">
              <BookmarkIcon className="mx-auto w-20 h-20 text-[#004a74] mb-6" />
              <h2 className="text-3xl font-bold text-[#004a74] mb-6">Welcome to Your Saved Sets!</h2>
              <p className="text-xl text-gray-600 mb-8">This is where you'll find flashcard sets you've saved from other users. Search for public sets and save them to study later!</p>
              <button onClick={closeHelper} className="bg-[#004a74] text-white py-3 px-8 rounded-full hover:bg-[#00659f] transition flex items-center gap-3 mx-auto text-lg">
                <XIcon className="w-6 h-6" /> Close
              </button>
            </div>
          </div>
        )}
        {showUnsaveModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full shadow-xl p-8">
              <h2 className="text-2xl font-bold text-[#004a74] mb-6">Unsave Flashcard Set?</h2>
              <p className="text-lg text-gray-600 mb-8">Are you sure you want to unsave this flashcard set? You'll no longer have access to it in your saved sets.</p>
              <div className="flex justify-end gap-4">
                <button onClick={() => setShowUnsaveModal(false)} className="px-6 py-3 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition text-lg">Cancel</button>
                <button onClick={unsaveSet} className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-lg">Unsave</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedSets;
