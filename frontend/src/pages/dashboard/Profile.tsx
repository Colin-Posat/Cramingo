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
  CheckCircleIcon,
  BookOpenIcon
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

const ProfilePage: React.FC = () => {
  const { user, logout, loading: authLoading, isAuthenticated } = useAuth();
  
  const [userProfile, setUserProfile] = useState<UserProfile>({
    username: '',
    totalLikes: 0,
    university: '',
    fieldOfStudy: ''
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

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  const handleRefresh = () => {
    fetchUserProfile();
  };

  // Loading state - Updated with sidebar spacing
  if ((authLoading || isLoading) && !userProfile.username) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-blue-50/50">
        <NavBar />
        <div className="md:pl-16 lg:pl-48 pt-24 md:pt-8 px-6 pb-6 flex items-center justify-center h-[calc(100vh-9rem)]">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="animate-ping absolute inset-0 rounded-full bg-blue-400 opacity-30"></div>
              <div className="animate-spin relative rounded-full h-16 w-16 border-4 border-transparent border-t-4 border-t-[#004a74] border-b-4 border-b-[#004a74]"></div>
            </div>
            <div className="mt-6 bg-blue-50 px-6 py-3 rounded-lg shadow-sm">
              <p className="text-[#004a74] font-medium text-lg">Loading your profile...</p>
            </div>
            <p className="mt-3 text-gray-500 text-sm">This may take a moment</p>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated state - Updated with sidebar spacing
  if (!isAuthenticated && !authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-blue-50/50">
        <NavBar />
        <div className="md:pl-16 lg:pl-48 pt-24 md:pt-8 px-6 pb-6 flex items-center justify-center h-[calc(100vh-9rem)]">
          <div className="bg-white shadow-xl rounded-2xl max-w-md w-full overflow-hidden">
            <div className="h-2 bg-red-500"></div>
            <div className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="bg-red-100 p-3 rounded-full flex-shrink-0">
                  <AlertCircleIcon className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">Authentication Required</h2>
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

  // Error state - Updated with sidebar spacing
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-blue-50/50">
        <NavBar />
        <div className="md:pl-16 lg:pl-48 pt-24 md:pt-8 px-6 pb-6">
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8 animate-fade-in">
            <div className="flex items-start gap-4">
              <div className="bg-red-100 p-3 rounded-full flex-shrink-0">
                <AlertCircleIcon className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Unable to Load Profile</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <div className="flex flex-wrap gap-3">
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

  // Main profile view - Updated with sidebar spacing
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50/50">
      <NavBar />
      <div className="md:pl-16 lg:pl-48 pt-24 md:pt-8 px-6 pb-12">
        <div className="max-w-2xl mx-auto">
          {/* Profile Card */}
          <div 
            className="bg-white rounded-2xl shadow-lg overflow-hidden 
            hover:shadow-xl transition-all duration-300 ease-out
            border border-gray-200 hover:border-[#004a74]/30"
          >
            {/* Header Section */}
            <div className="bg-gradient-to-r from-[#004a74] to-[#0060a1] text-white p-8 relative">
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-24 w-24 rounded-full 
                  bg-white/20 mb-4 ring-4 ring-white/10 shadow-inner">
                  <UserIcon className="h-12 w-12" />
                </div>
                <h1 className="text-3xl font-bold mb-3">{userProfile.username}</h1>
                
                <div className="flex items-center justify-center gap-4">
                  <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
                    <HeartIcon className="h-5 w-5 text-pink-200" />
                    <span className="font-bold">{userProfile.totalLikes}</span>
                    <span className="text-sm opacity-80">{userProfile.totalLikes === 1 ? 'like' : 'likes'}</span>
                    {isSyncing && (
                      <RefreshIcon className="h-4 w-4 ml-1 animate-spin" />
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Content Section */}
            <div className="p-8">
              <div className="space-y-5 mb-8">
                {/* University */}
                <div className="bg-blue-50 rounded-xl p-5 shadow-sm border border-blue-100
                  hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-start">
                    <div className="bg-[#004a74] text-white rounded-lg p-3 mr-4 shadow-sm">
                      <SchoolIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">University</h3>
                      <p className="text-xl font-semibold text-[#004a74]">{userProfile.university}</p>
                    </div>
                  </div>
                </div>
                
                {/* Email (if available) */}
                {userProfile.email && (
                  <div className="bg-blue-50 rounded-xl p-5 shadow-sm border border-blue-100
                    hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-start">
                      <div className="bg-[#004a74] text-white rounded-lg p-3 mr-4 shadow-sm">
                        <MailIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Email</h3>
                        <p className="text-xl font-semibold text-[#004a74]">{userProfile.email}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleEditProfile}
                  className="w-full bg-[#004a74] text-white font-bold py-3 px-6 rounded-xl 
                  hover:bg-[#00659f] active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <EditIcon className="h-5 w-5" />
                  Edit Profile
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full bg-white border border-[#004a74] text-[#004a74] font-bold py-3 px-6 
                  rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all shadow-sm 
                  flex items-center justify-center gap-2"
                >
                  <LogOutIcon className="h-5 w-5" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;