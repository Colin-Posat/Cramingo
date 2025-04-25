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
  RefreshCw as RefreshIcon
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
  const [profileDataSource, setProfileDataSource] = useState<string>('');
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
          setProfileDataSource('Total likes endpoint');
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

  // Loading state
  if ((authLoading || isLoading) && !userProfile.username) {
    return (
      <div className="min-h-screen bg-gray-100">
        <NavBar />
        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004a74] mb-4"></div>
              <p className="text-lg text-[#004a74]">Loading your profile...</p>
              <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated state
  if (!isAuthenticated && !authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <AlertCircleIcon className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Authentication Required</h2>
              <p className="text-gray-600 mb-6">You need to be logged in to view your profile.</p>
              <button 
                onClick={() => navigate('/login')} 
                className="px-6 py-3 bg-[#004a74] text-white font-medium rounded-xl hover:bg-[#00659f] transition-all"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <AlertCircleIcon className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Profile</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button 
                  onClick={handleRefresh} 
                  className="px-6 py-3 bg-gray-200 text-gray-800 font-medium rounded-xl hover:bg-gray-300 transition-all"
                >
                  Try Again
                </button>
                <button 
                  onClick={() => navigate('/login')} 
                  className="px-6 py-3 bg-[#004a74] text-white font-medium rounded-xl hover:bg-[#00659f] transition-all"
                >
                  Go to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header Section */}
          <div className="bg-[#004a74] text-white p-8 relative">
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-white/30 mb-4">
                <UserIcon className="h-10 w-10" />
              </div>
              <h1 className="text-3xl font-bold mb-2">{userProfile.username}</h1>
              <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                <HeartIcon className="h-5 w-5 text-pink-200" />
                <span className="font-bold">{userProfile.totalLikes}</span>
                <span className="text-sm opacity-80">{userProfile.totalLikes === 1 ? 'like' : 'likes'}</span>
                {isSyncing && (
                  <RefreshIcon className="h-4 w-4 ml-2 animate-spin" />
                )}
              </div>
            </div>
          </div>
          
          {/* Content Section */}
          <div className="p-8">
            <div className="space-y-4 mb-8">
              {/* University */}
              <div className="bg-gray-50 rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-start">
                  <div className="mr-3 mt-1">
                    <SchoolIcon className="h-5 w-5 text-[#004a74]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">University</h3>
                    <p className="text-lg font-semibold text-[#004a74]">{userProfile.university}</p>
                  </div>
                </div>
              </div>
              
              {/* Email (if available) */}
              {userProfile.email && (
                <div className="bg-gray-50 rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-start">
                    <div className="mr-3 mt-1">
                      <MailIcon className="h-5 w-5 text-[#004a74]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
                      <p className="text-lg font-semibold text-[#004a74]">{userProfile.email}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleEditProfile}
                className="w-full bg-[#004a74] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#00659f] transition-all flex items-center justify-center gap-2"
              >
                <EditIcon className="h-5 w-5" />
                Edit Profile
              </button>
              <button
                onClick={handleSignOut}
                className="w-full bg-white border border-[#004a74] text-[#004a74] font-bold py-3 px-6 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                <LogOutIcon className="h-5 w-5" />
                Sign Out
              </button>
            </div>
            
            {/* Last refresh time indicator */}
            <div className="mt-6 text-center text-xs text-gray-500">
              Last updated: {new Date().toLocaleTimeString()}
              <button 
                onClick={handleRefresh}
                className="ml-2 text-[#004a74] hover:underline"
                disabled={isLoading}
              >
                Refresh
              </button>
            </div>
            
            {/* Debug info - you can remove this in production */}
            <div className="mt-2 text-center text-xs text-gray-400">
              Data source: {profileDataSource || 'Synchronized count'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;