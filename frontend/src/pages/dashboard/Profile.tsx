import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User as UserIcon, 
  BookOpen as BookOpenIcon,
  School as SchoolIcon,
  Mail as MailIcon,
  Heart as HeartIcon,
  Edit as EditIcon,
  LogOut as LogOutIcon,
  AlertCircle as AlertCircleIcon
} from 'lucide-react';
import NavBar from '../../components/NavBar';
import { API_BASE_URL, getApiUrl } from '../../config/api'; // Adjust path as needed

interface UserProfile {
  username: string;
  totalLikes: number; // Changed from 'likes' to 'totalLikes' to match backend
  university: string;
  fieldOfStudy: string;
  email?: string;
  uid?: string;
}

const ProfilePage: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile>({
    username: '',
    totalLikes: 0, // Changed from 'likes' to 'totalLikes'
    university: '',
    fieldOfStudy: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileDataSource, setProfileDataSource] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get user data from localStorage first
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
          setError('Not authenticated. Please log in to view your profile.');
          setIsLoading(false);
          return;
        }

        // Parse stored user data
        const userData = JSON.parse(storedUser);
        if (!userData) {
          setError('Invalid user data. Please log in again.');
          setIsLoading(false);
          return;
        }

        // Set initial profile data from localStorage as a fallback
        const localStorageUsername = userData.username?.trim() || 'Anonymous User';
        
        // Set initial profile from localStorage
        setUserProfile({
          username: localStorageUsername,
          totalLikes: userData.totalLikes ?? 0, // Changed from 'likes' to 'totalLikes'
          university: userData.university || 'Not specified',
          fieldOfStudy: userData.fieldOfStudy || 'Not specified',
          email: userData.email,
          uid: userData.uid
        });
        
        setProfileDataSource('localStorage');
        
        // Try to fetch the latest profile data from Firestore
        try {
          // Fetch the user document by ID if available
          if (userData.uid) {
            const userDocResponse = await fetch(`${API_BASE_URL}/user/${userData.uid}`, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include'
            });
            
            if (userDocResponse.ok) {
              const userDocData = await userDocResponse.json();
              
              // Also fetch the total likes count from the dedicated endpoint
              const totalLikesResponse = await fetch(`${API_BASE_URL}/user/${userData.uid}/total-likes`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
              });
              
              if (totalLikesResponse.ok) {
                const likesData = await totalLikesResponse.json();
                // Update user doc data with the dedicated likes count
                userDocData.totalLikes = likesData.totalLikes;
              }
              
              updateProfileData(userDocData, 'User document', userData);
            } else {
              // Try fallback API if user document fetch fails
              await fetchFromFallbackAPI(userData, localStorageUsername);
            }
          } else {
            // No user ID available, try fallback API
            await fetchFromFallbackAPI(userData, localStorageUsername);
          }
        } catch (apiError) {
          console.error('API fetch error:', apiError);
          // Continue using localStorage data
        } finally {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error processing user profile:', error);
        setError('Failed to load profile. Please try again later.');
        setIsLoading(false);
      }
    };

    // Fetch data from fallback API
    const fetchFromFallbackAPI = async (userData: any, localStorageUsername: string) => {
      try {
        const fallbackResponse = await fetch(`${API_BASE_URL}/user/profile`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          
          // Try to get user document by ID if available
          const firebaseUserId = userData.uid || fallbackData.uid;
          if (firebaseUserId) {
            try {
              const userDocResponse = await fetch(`${API_BASE_URL}/user/${firebaseUserId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
              });
              
              if (userDocResponse.ok) {
                const userDocData = await userDocResponse.json();
                
                // Also try to fetch total likes from dedicated endpoint
                try {
                  const totalLikesResponse = await fetch(`${API_BASE_URL}/user/${firebaseUserId}/total-likes`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include'
                  });
                  
                  if (totalLikesResponse.ok) {
                    const likesData = await totalLikesResponse.json();
                    userDocData.totalLikes = likesData.totalLikes;
                  }
                } catch (likesError) {
                  console.error('Error fetching total likes:', likesError);
                }
                
                updateProfileData(userDocData, 'User document', userData, fallbackData);
              } else {
                // Use fallback API data
                updateProfileData(fallbackData, 'Fallback API', userData);
              }
            } catch (userDocError) {
              console.error('Error fetching user document:', userDocError);
              // Use fallback API data
              updateProfileData(fallbackData, 'Fallback API', userData);
            }
          } else {
            // No user ID available, use fallback data
            updateProfileData(fallbackData, 'Fallback API', userData);
          }
        }
      } catch (error) {
        console.error('Error in fallback API:', error);
      }
    };

    // Helper function to update profile data
    const updateProfileData = (
      newData: any, 
      source: string, 
      userData: any, 
      fallbackData?: any
    ) => {
      // Determine the best username from available sources
      const updatedUsername = newData.username?.trim() || 
                             fallbackData?.username?.trim() || 
                             userData.username?.trim() || 
                             'Anonymous User';
      
      // Update profile with the new data
      setUserProfile(prev => ({
        ...prev,
        username: updatedUsername,
        totalLikes: newData.totalLikes ?? fallbackData?.totalLikes ?? prev.totalLikes, // Changed to totalLikes
        university: newData.university || fallbackData?.university || prev.university,
        fieldOfStudy: newData.fieldOfStudy || fallbackData?.fieldOfStudy || prev.fieldOfStudy,
        email: newData.email || fallbackData?.email || prev.email,
        uid: newData.uid || fallbackData?.uid || prev.uid
      }));
      
      setProfileDataSource(source);
      
      // Update localStorage with the latest data
      const updatedUserData = {
        ...userData,
        username: updatedUsername,
        totalLikes: newData.totalLikes ?? fallbackData?.totalLikes ?? userData.totalLikes, // Changed to totalLikes
        university: newData.university || fallbackData?.university || userData.university,
        fieldOfStudy: newData.fieldOfStudy || fallbackData?.fieldOfStudy || userData.fieldOfStudy,
        email: newData.email || fallbackData?.email || userData.email,
        uid: newData.uid || fallbackData?.uid || userData.uid
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUserData));
    };

    fetchUserProfile();
  }, []);

  const handleEditProfile = () => {
    navigate('/edit-profile');
  };

  const handleSignOut = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleRefresh = () => {
    setIsLoading(true);
    window.location.reload();
  };

  // Loading state
  if (isLoading && !userProfile.username) {
    return (
      <div className="min-h-screen bg-gray-50">
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
    <div className="min-h-screen bg-gray-50">
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
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;