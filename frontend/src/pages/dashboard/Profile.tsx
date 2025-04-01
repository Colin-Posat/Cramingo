import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../../components/NavBar';

interface UserProfile {
  username: string;
  likes: number;
  university: string;
  fieldOfStudy: string;
  email?: string;
  uid?: string;
}

const ProfilePage: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile>({
    username: 'Loading...',
    likes: 0,
    university: 'Loading...',
    fieldOfStudy: 'Loading...'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Get the user data from localStorage - this matches your login component
        const storedUser = localStorage.getItem('user');
        
        if (!storedUser) {
          setError('Not authenticated. Please log in.');
          setIsLoading(false);
          return;
        }

        // Parse the stored user data
        const userData = JSON.parse(storedUser);
        console.log('Using stored user data:', userData);
        
        if (!userData) {
          setError('Invalid user data. Please log in again.');
          setIsLoading(false);
          return;
        }
        
        // Update profile with stored data first
        setUserProfile({
          username: userData.username || 'No username',
          likes: userData.likes || 0,
          university: userData.university || 'No university',
          fieldOfStudy: userData.fieldOfStudy || 'No field of study',
          email: userData.email,
          uid: userData.uid
        });
        
        // Then try to get fresh data from the API
        try {
          const response = await fetch('http://localhost:6500/api/user/profile', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include' // This is important to include cookies
          });

          if (response.ok) {
            const data = await response.json();
            console.log('Profile data from API:', data);
            
            // Update profile with fresh data
            setUserProfile(prev => ({
              ...prev,
              ...data
            }));
            
            // Update the stored user data
            localStorage.setItem('user', JSON.stringify({
              ...userData,
              ...data
            }));
          } else {
            console.warn('Could not refresh profile data from API');
            // We'll continue with the stored data
          }
        } catch (apiError) {
          console.error('API fetch error:', apiError);
          // We'll continue with the stored data
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error processing user profile:', error);
        setError('Failed to load profile. Please try again later.');
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleEditProfile = () => {
    navigate('/edit-profile');
  };

  const handleSignOut = () => {
    // Clear authentication data
    localStorage.removeItem('user');
    
    // Redirect to login page
    navigate('/login');
  };

  if (isLoading && userProfile.username === 'Loading...') {
    return (
      <div className="bg-white flex flex-col items-center min-h-screen p-8">
        <NavBar />
        <div className="w-full max-w-2xl bg-[#e3f3ff] rounded-2xl shadow-md p-12 text-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004a74]"></div>
          </div>
          <p className="text-xl mt-4 text-[#004a74]">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white flex flex-col items-center min-h-screen p-8">
        <NavBar />
        <div className="w-full max-w-2xl bg-[#e3f3ff] rounded-2xl shadow-md p-12 text-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <p className="text-xl text-red-500 mb-6">{error}</p>
          <button 
            onClick={() => navigate('/login')} 
            className="px-6 py-3 bg-[#004a74] text-white font-medium rounded-xl hover:bg-[#00659f] transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white flex flex-col items-center min-h-screen p-8">
      {/* Navigation Bar */}
      <NavBar />

      {/* Profile Container */}
      <div className="w-full max-w-2xl bg-[#e3f3ff] rounded-2xl shadow-md p-0 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 overflow-hidden">
        {/* Header Section */}
        <div className="bg-[#004a74] text-white p-8 text-center">
          <h1 className="text-3xl font-bold mb-2">{userProfile.username}</h1>
          <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
            <span className="text-xl">❤️</span>
            <span className="font-bold">{userProfile.likes}</span>
          </div>
        </div>
        
        {/* Content Section */}
        <div className="p-8">
          {/* Profile Info Cards */}
          <div className="space-y-4 mb-8">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 mb-1">University</h3>
              <p className="text-lg font-semibold text-[#004a74]">{userProfile.university}</p>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Field of Study</h3>
              <p className="text-lg font-semibold text-[#004a74]">{userProfile.fieldOfStudy}</p>
            </div>
            

          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleEditProfile}
              className="w-full bg-[#004a74] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#00659f] transition-all flex items-center justify-center gap-2"
            >
              <span>Edit Profile</span>
            </button>
            
            <button
              onClick={handleSignOut}
              className="w-full bg-white border border-[#004a74] text-[#004a74] font-bold py-3 px-6 rounded-xl hover:bg-gray-50 transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;