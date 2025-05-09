import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User as UserIcon, 
  School as SchoolIcon,
  Mail as MailIcon,
  Heart as HeartIcon,
  Edit as EditIcon,
  LogOut as LogOutIcon,
  AlertCircle as AlertCircleIcon,
  RefreshCw as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  BookOpen as BookOpenIcon,
  LayoutGrid as LayoutGridIcon,
  Folder as FolderIcon
} from 'lucide-react';
import NavBar from '../../components/NavBar';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';

interface UserProfile {
  username: string;
  totalLikes: number;
  university: string;
  fieldOfStudy: string;
  email?: string;
  uid?: string;
}

interface SetCounts {
  created: number;
  saved: number;
  total: number;
}

const ProfilePage: React.FC = () => {
  const { user, logout, loading: authLoading, isAuthenticated } = useAuth();
  
  const [userProfile, setUserProfile] = useState<UserProfile>({
    username: '',
    totalLikes: 0,
    university: '',
    fieldOfStudy: ''
  });
  const [setCounts, setSetCounts] = useState<SetCounts>({
    created: 0,
    saved: 0,
    total: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Function to force sync total likes with the backend
  const syncTotalLikes = async () => {
    if (!userProfile.uid) return;
    
    try {
      setIsSyncing(true);
      
      // Call the sync endpoint to recalculate likes based on actual flashcard sets
      const response = await fetch(`${API_BASE_URL}/user/${userProfile.uid}/sync-likes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Update the local state with the accurate likes count
        setUserProfile(prev => ({
          ...prev,
          totalLikes: data.totalLikes
        }));
        
        console.log(`Likes synced successfully. Total likes: ${data.totalLikes}`);
      } else {
        console.error('Failed to sync likes. Server returned:', response.status);
      }
    } catch (error) {
      console.error('Error syncing likes:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Fetch the user set counts
  const fetchUserSetCounts = async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/sets/counts/${userId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setSetCounts({
          created: data.created || 0,
          saved: data.saved || 0,
          total: data.total || 0
        });
        console.log(`Fetched set counts: Created: ${data.created}, Saved: ${data.saved}, Total: ${data.total}`);
      } else {
        console.error('Failed to fetch set counts. Server returned:', response.status);
      }
    } catch (error) {
      console.error('Error fetching set counts:', error);
    }
  };

  // Fetch the user profile data
  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if user is authenticated
      if (!isAuthenticated || !user) {
        setError('Not authenticated. Please log in to view your profile.');
        setIsLoading(false);
        return;
      }

      // Set initial profile data from auth context
      setUserProfile({
        username: user.username?.trim() || 'Anonymous User',
        // Initialize totalLikes to 0 rather than potentially incorrect value
        totalLikes: 0,
        university: user.university || 'Not specified',
        fieldOfStudy: user.fieldOfStudy || 'Not specified',
        email: user.email,
        uid: user.uid
      });
      
      // If no user ID, we can't fetch accurate data
      if (!user.uid) {
        setIsLoading(false);
        return;
      }
      
      // Always sync likes first to ensure accuracy
      await syncTotalLikes();
      
      // Fetch set counts
      await fetchUserSetCounts(user.uid);
      
      // Then fetch from dedicated total-likes endpoint as a backup
      try {
        const totalLikesResponse = await fetch(`${API_BASE_URL}/user/${user.uid}/total-likes`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        
        if (totalLikesResponse.ok) {
          const likesData = await totalLikesResponse.json();
          setUserProfile(prev => ({
            ...prev,
            totalLikes: likesData.totalLikes || 0
          }));
        }
      } catch (likesError) {
        console.error('Error fetching total likes:', likesError);
        // Already synced above, no need to do it again
      }
      
      // Fetch user document for other profile data
      try {
        const userDocResponse = await fetch(`${API_BASE_URL}/user/${user.uid}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        
        if (userDocResponse.ok) {
          const userData = await userDocResponse.json();
          
          // Update other profile fields but keep the already fetched likes count
          setUserProfile(prev => ({
            ...prev,
            username: userData.username?.trim() || prev.username,
            university: userData.university || prev.university,
            fieldOfStudy: userData.fieldOfStudy || prev.fieldOfStudy,
            email: userData.email || prev.email
          }));
        }
      } catch (userDocError) {
        console.error('Error fetching user document:', userDocError);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error processing user profile:', error);
      setError('Failed to load profile. Please try again later.');
      setIsLoading(false);
    }
  };

  // Fetch profile when component mounts or auth status changes
  useEffect(() => {
    if (!authLoading) {
      fetchUserProfile();
    }
  }, [user, isAuthenticated, authLoading]);

  const handleEditProfile = () => {
    navigate('/edit-profile');
  };

  const handleViewCreatedSets = () => {
    navigate('/created-sets');
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  const handleRefresh = () => {
    fetchUserProfile();
  };

  // Loading state - Vertically centered
  if ((authLoading || isLoading) && !userProfile.username) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-blue-50/50 flex flex-col">
        <NavBar />
        <div className="flex-1 md:pl-16 lg:pl-48 px-4 md:px-6 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="animate-ping absolute inset-0 rounded-full bg-blue-400 opacity-30"></div>
              <div className="animate-spin relative rounded-full h-12 w-12 md:h-16 md:w-16 border-4 border-transparent border-t-4 border-t-[#004a74] border-b-4 border-b-[#004a74]"></div>
            </div>
            <div className="mt-6 bg-blue-50 px-4 md:px-6 py-3 rounded-lg shadow-sm">
              <p className="text-[#004a74] font-medium text-base md:text-lg">Loading your profile...</p>
            </div>
            <p className="mt-3 text-gray-500 text-xs md:text-sm">This may take a moment</p>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated state - Vertically centered
  if (!isAuthenticated && !authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-blue-50/50 flex flex-col">
        <NavBar />
        <div className="flex-1 md:pl-16 lg:pl-48 px-4 md:px-6 flex items-center justify-center">
          <div className="bg-white shadow-xl rounded-2xl w-full max-w-md overflow-hidden">
            <div className="h-2 bg-red-500"></div>
            <div className="p-5 md:p-8">
              <div className="flex flex-col md:flex-row md:items-start gap-4 mb-6">
                <div className="bg-red-100 p-3 rounded-full flex-shrink-0 mx-auto md:mx-0">
                  <AlertCircleIcon className="w-6 h-6 text-red-500" />
                </div>
                <div className="text-center md:text-left">
                  <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-2">Authentication Required</h2>
                  <p className="text-gray-600 mb-6">
                    You need to be logged in to view and manage your profile.
                  </p>
                  <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-6 text-gray-700 text-sm">
                    <p className="font-medium">Why do I need to log in?</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>To access your personal profile</li>
                      <li>To edit your profile information</li>
                      <li>To see your total likes received</li>
                    </ul>
                  </div>
                  <button 
                    onClick={() => navigate('/login')} 
                    className="bg-[#004a74] w-full text-white px-5 py-3 rounded-lg hover:bg-[#00659f] 
                      transition-all shadow-md font-medium flex items-center justify-center gap-2"
                  >
                    <CheckCircleIcon className="w-5 h-5" />
                    Log In
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state - Vertically centered
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-blue-50/50 flex flex-col">
        <NavBar />
        <div className="flex-1 md:pl-16 lg:pl-48 px-4 md:px-6 flex items-center justify-center">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-5 md:p-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-start gap-4">
              <div className="bg-red-100 p-3 rounded-full flex-shrink-0 mx-auto md:mx-0">
                <AlertCircleIcon className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Unable to Load Profile</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                  <button 
                    onClick={handleRefresh} 
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 
                      transition flex items-center gap-2 text-sm font-medium shadow-sm"
                  >
                    <RefreshIcon className="w-4 h-4" />
                    Try Again
                  </button>
                  <button 
                    onClick={() => navigate('/login')} 
                    className="bg-white border border-gray-300 text-gray-700 px-4 py-2 
                      rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                  >
                    Go to Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main profile view - Updated with spacing similar to SearchSetsPage
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50/50">
      <NavBar />
      
      {/* Main content area - Updated to match SearchSetsPage spacing */}
      <div className="md:pl-24 lg:pl-56 pt-24 md:pt-8 px-4 sm:px-6 pb-16">
        <div className="max-w-2xl mx-auto">
          
          {/* Profile Header Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-5 md:mb-6
                      transform-gpu hover:shadow-xl transition-all duration-300
                      border border-gray-200 hover:border-[#004a74]/30">
            {/* Animated Background Gradient */}
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-[#004a74] to-[#0060a1] opacity-100"></div>
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiB4PSIwIiB5PSIwIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHBhdHRlcm5UcmFuc2Zvcm09InJvdGF0ZSgzMCkiPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNwYXR0ZXJuKSIvPjwvc3ZnPg==')]"></div>

              <div className="pt-6 md:pt-10 pb-6 md:pb-8 px-5 md:px-8 relative z-10">
                <div className="flex flex-col items-center justify-between gap-6">
                  {/* Avatar and Name Section */}
                  <div className="flex flex-col items-center text-center">
                    <div className="relative group">
                      <div className="absolute inset-0 rounded-full bg-white/10 blur-md transform group-hover:scale-110 transition-all duration-300"></div>
                      <div className="relative flex items-center justify-center h-20 w-20 md:h-24 md:w-24 bg-gradient-to-br from-white/20 to-white/5 backdrop-blur rounded-full border border-white/20 shadow-lg group-hover:shadow-white/10 transition-all duration-300">
                        <UserIcon className="h-10 w-10 md:h-12 md:w-12 text-white group-hover:scale-110 transition-transform duration-200" />
                      </div>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white mt-3 drop-shadow-md">{userProfile.username}</h1>
                  </div>

                  {/* Stats Card */}
                  <div className="flex flex-col items-center">
                    <div className="bg-white/10 backdrop-blur-lg p-4 rounded-xl border border-white/20 shadow-lg
                               transform-gpu hover:scale-105 transition-all duration-300">
                      <div className="flex items-center gap-8 md:gap-10 justify-center">
                        {/* Likes counter with animation */}
                        <div className="text-center">
                          <div className="bg-pink-500/20 h-14 w-14 rounded-full flex items-center justify-center mb-2 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/30 to-pink-600/30 group-hover:opacity-100 opacity-0 transition-opacity duration-300"></div>
                            <HeartIcon className={`h-7 w-7 text-pink-200 ${isSyncing ? 'animate-pulse' : 'group-hover:scale-110 group-hover:text-pink-100'} transition-all duration-300`} fill={userProfile.totalLikes > 0 ? "rgba(244, 114, 182, 0.6)" : "none"} />
                            {isSyncing && (
                              <RefreshIcon className="h-5 w-5 text-white absolute animate-spin" />
                            )}
                          </div>
                          <div className="text-white font-bold text-2xl">{userProfile.totalLikes}</div>
                          <div className="text-blue-100 text-sm">{userProfile.totalLikes === 1 ? 'like' : 'likes'}</div>
                        </div>
                        
                        {/* Sets counter - Now showing CREATED sets count */}
                        <div className="text-center">
                          <div className="bg-blue-500/20 h-14 w-14 rounded-full flex items-center justify-center mb-2 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-blue-600/30 group-hover:opacity-100 opacity-0 transition-opacity duration-300"></div>
                            <FolderIcon className="h-7 w-7 text-blue-200 group-hover:scale-110 group-hover:text-blue-100 transition-all duration-300" />
                          </div>
                          <div className="text-white font-bold text-2xl">{setCounts.created}</div>
                          <div className="text-blue-100 text-sm">{setCounts.created === 1 ? 'set' : 'sets'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Content Cards */}
          <div className="grid grid-cols-1 gap-4 md:gap-5 mb-5">
            {/* University Card */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden
                       transform-gpu hover:shadow-xl hover:-translate-y-1 transition-all duration-300
                       border border-gray-200 hover:border-[#004a74]/30 group">
              <div className="p-4 md:p-5">
                <div className="flex items-start">
                  <div className="bg-gradient-to-br from-[#004a74] to-[#0074c2] text-white rounded-lg p-3 mr-4 shadow-md
                             group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 flex-shrink-0">
                    <SchoolIcon className="h-5 w-5 md:h-6 md:w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">University</h3>
                    <p className="text-base md:text-lg font-semibold text-[#004a74] group-hover:text-[#0074c2] transition-colors break-words hyphens-auto truncate">
                      {userProfile.university}
                    </p>
                  </div>
                </div>
              </div>
              <div className="h-1 w-full bg-gradient-to-r from-[#004a74] to-[#0074c2] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
            </div>

            {/* Email Card */}
            {userProfile.email && (
              <div className="bg-white rounded-xl shadow-md overflow-hidden
                         transform-gpu hover:shadow-xl hover:-translate-y-1 transition-all duration-300
                         border border-gray-200 hover:border-[#004a74]/30 group">
                <div className="p-4 md:p-5">
                  <div className="flex items-start">
                    <div className="bg-gradient-to-br from-[#004a74] to-[#0074c2] text-white rounded-lg p-3 mr-4 shadow-md
                               group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 flex-shrink-0">
                      <MailIcon className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
                      <p className="text-base md:text-lg font-semibold text-[#004a74] group-hover:text-[#0074c2] transition-colors break-words hyphens-auto truncate">
                        {userProfile.email}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="h-1 w-full bg-gradient-to-r from-[#004a74] to-[#0074c2] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
              </div>
            )}
          </div>

          
          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4 md:gap-5">
            <button
              onClick={handleEditProfile}
              className="relative overflow-hidden bg-gradient-to-r from-[#004a74] to-[#0074c2] text-white font-bold 
                      py-4 px-4 md:px-5 rounded-xl 
                      hover:from-[#00395c] hover:to-[#0068b0] active:scale-[0.98] transition-all duration-300 shadow-md
                      flex items-center justify-center gap-3 group touch-manipulation text-base md:text-lg"
            >
              <div className="relative bg-white/20 p-2 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <EditIcon className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <span className="relative">Edit Profile</span>
            </button>
            
            <button
              onClick={handleSignOut}
              className="relative overflow-hidden bg-white border-2 border-[#004a74] text-[#004a74] font-bold 
                      py-4 px-4 md:px-5 
                      rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all duration-300 shadow-sm 
                      flex items-center justify-center gap-3 group touch-manipulation text-base md:text-lg"
            >
              <div className="relative bg-blue-100 p-2 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <LogOutIcon className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <span className="relative">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;