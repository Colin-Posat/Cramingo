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
        // Get the user data from localStorage first for the user ID
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
          setError('Not authenticated. Please log in.');
          setIsLoading(false);
          return;
        }

        // Parse stored user data
        const userData = JSON.parse(storedUser);
        console.log('Using stored user data:', userData);
        if (!userData) {
          setError('Invalid user data. Please log in again.');
          setIsLoading(false);
          return;
        }

        // Set initial profile data from localStorage as a fallback
        const localStorageUsername = userData.username && userData.username.trim() !== '' 
          ? userData.username.trim() 
          : 'No username';
          
        setUserProfile({
          username: localStorageUsername,
          likes: userData.likes ?? 0,
          university: userData.university || 'No university',
          fieldOfStudy: userData.fieldOfStudy || 'No field of study',
          email: userData.email,
          uid: userData.uid
        });

        // First try to get data directly from Firestore through your API
        try {
          // This endpoint should fetch the user document directly from Firestore
          const response = await fetch('http://localhost:6500/api/user/firestore-profile', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          });

          if (response.ok) {
            const data = await response.json();
            console.log('Firestore profile data:', data);
            
            // Update profile with Firestore data
            setUserProfile(prev => ({
              ...prev,
              username: data.username || prev.username,
              likes: data.likes ?? prev.likes,
              university: data.university || prev.university,
              fieldOfStudy: data.fieldOfStudy || prev.fieldOfStudy,
              email: data.email || prev.email,
              uid: data.uid || prev.uid
            }));
            
            // Also update localStorage with the Firestore data
            const updatedUserData = {
              ...userData,
              username: data.username || userData.username,
              likes: data.likes ?? userData.likes,
              university: data.university || userData.university,
              fieldOfStudy: data.fieldOfStudy || userData.fieldOfStudy,
              email: data.email || userData.email,
              uid: data.uid || userData.uid
            };
            
            console.log('Updating localStorage with Firestore data:', updatedUserData);
            localStorage.setItem('user', JSON.stringify(updatedUserData));
          } else {
            console.warn('Could not fetch Firestore profile data, falling back to API');
            
            // Fall back to the regular profile API if Firestore endpoint fails
            const fallbackResponse = await fetch('http://localhost:6500/api/user/profile', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              },
              credentials: 'include'
            });

            if (fallbackResponse.ok) {
              const fallbackData = await fallbackResponse.json();
              console.log('Fallback profile data from API:', fallbackData);
              
              // Get username from Firestore via your user ID if available
              const firebaseUserId = userData.uid || fallbackData.uid;
              if (firebaseUserId) {
                try {
                  // Try to get specific user document by ID
                  const userDocResponse = await fetch(`http://localhost:6500/api/user/${firebaseUserId}`, {
                    method: 'GET',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                  });
                  
                  if (userDocResponse.ok) {
                    const userDocData = await userDocResponse.json();
                    console.log('User document data:', userDocData);
                    
                    // Use Firestore username if available
                    const firestoreUsername = userDocData.username && userDocData.username.trim() !== ''
                      ? userDocData.username
                      : fallbackData.username && fallbackData.username.trim() !== ''
                        ? fallbackData.username
                        : localStorageUsername;
                        
                    setUserProfile(prev => ({
                      ...prev,
                      username: firestoreUsername,
                      likes: userDocData.likes ?? fallbackData.likes ?? prev.likes,
                      university: userDocData.university || fallbackData.university || prev.university,
                      fieldOfStudy: userDocData.fieldOfStudy || fallbackData.fieldOfStudy || prev.fieldOfStudy,
                      email: userDocData.email || fallbackData.email || prev.email
                    }));
                    
                    // Update localStorage
                    const updatedUserData = {
                      ...userData,
                      username: firestoreUsername,
                      likes: userDocData.likes ?? fallbackData.likes ?? userData.likes,
                      university: userDocData.university || fallbackData.university || userData.university,
                      fieldOfStudy: userDocData.fieldOfStudy || fallbackData.fieldOfStudy || userData.fieldOfStudy,
                      email: userDocData.email || fallbackData.email || userData.email
                    };
                    
                    console.log('Updating localStorage with user document data:', updatedUserData);
                    localStorage.setItem('user', JSON.stringify(updatedUserData));
                  } else {
                    // If we can't get the Firestore document, use the fallback data
                    const updatedUsername = fallbackData.username && fallbackData.username.trim() !== ''
                      ? fallbackData.username
                      : localStorageUsername;
                      
                    setUserProfile(prev => ({
                      ...prev,
                      username: updatedUsername,
                      likes: fallbackData.likes ?? prev.likes,
                      university: fallbackData.university || prev.university,
                      fieldOfStudy: fallbackData.fieldOfStudy || prev.fieldOfStudy,
                      email: fallbackData.email || prev.email
                    }));
                    
                    // Update localStorage
                    const updatedUserData = {
                      ...userData,
                      username: updatedUsername,
                      likes: fallbackData.likes ?? userData.likes,
                      university: fallbackData.university || userData.university,
                      fieldOfStudy: fallbackData.fieldOfStudy || userData.fieldOfStudy,
                      email: fallbackData.email || userData.email
                    };
                    
                    localStorage.setItem('user', JSON.stringify(updatedUserData));
                  }
                } catch (userDocError) {
                  console.error('Error fetching user document:', userDocError);
                  // Continue with fallback data
                  handleFallbackData(fallbackData, localStorageUsername, userData);
                }
              } else {
                // No user ID available, use fallback data
                handleFallbackData(fallbackData, localStorageUsername, userData);
              }
            } else {
              console.warn('Could not fetch profile from any API');
              // Keep using localStorage data
            }
          }
        } catch (apiError) {
          console.error('API fetch error:', apiError);
          // Continue with stored data
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error processing user profile:', error);
        setError('Failed to load profile. Please try again later.');
        setIsLoading(false);
      }
    };

    // Helper function to handle fallback data
    const handleFallbackData = (
      fallbackData: any, 
      localStorageUsername: string, 
      userData: any
    ) => {
      const updatedUsername = fallbackData.username && fallbackData.username.trim() !== ''
        ? fallbackData.username
        : localStorageUsername;
        
      setUserProfile(prev => ({
        ...prev,
        username: updatedUsername,
        likes: fallbackData.likes ?? prev.likes,
        university: fallbackData.university || prev.university,
        fieldOfStudy: fallbackData.fieldOfStudy || prev.fieldOfStudy,
        email: fallbackData.email || prev.email
      }));
      
      // Update localStorage
      const updatedUserData = {
        ...userData,
        username: updatedUsername,
        likes: fallbackData.likes ?? userData.likes,
        university: fallbackData.university || userData.university,
        fieldOfStudy: fallbackData.fieldOfStudy || userData.fieldOfStudy,
        email: fallbackData.email || userData.email
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

  if (isLoading && userProfile.username === 'Loading...') {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004a74]"></div>
            </div>
            <p className="text-xl mt-4 text-[#004a74]">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-12 text-center">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
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
                Edit Profile
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
    </div>
  );
};

export default ProfilePage;