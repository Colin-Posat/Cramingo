import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  User as UserIcon, 
  ChevronLeft as ChevronLeftIcon,
  Save as SaveIcon,
  X as XIcon,
  AlertCircle as AlertCircleIcon,
  CheckCircle as CheckCircleIcon
} from 'lucide-react';
import NavBar from '../../components/NavBar';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';

interface UserProfile {
  username: string;
  fieldOfStudy: string;
  email?: string;
  uid?: string;
  likes?: number;
}

const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();

  // Force a reload when the component is mounted to ensure fresh data
  useEffect(() => {
    // Get navigation type
    const navEntries = window.performance.getEntriesByType('navigation');
    const navType = navEntries.length > 0 
      ? (navEntries[0] as PerformanceNavigationTiming).type 
      : '';
    
    // Only reload if it's a navigation (not a reload)
    if (navType === 'navigate') {
      // Store a flag in sessionStorage to prevent infinite reloads
      if (!sessionStorage.getItem('profile_edited_reloaded')) {
        sessionStorage.setItem('profile_edited_reloaded', 'true');
        window.location.reload();
      }
    }

    // Clean up the flag when component unmounts
    return () => {
      sessionStorage.removeItem('profile_edited_reloaded');
    };
  }, []);

  const [profile, setProfile] = useState<UserProfile>({
    username: '',
    fieldOfStudy: '',
    email: '',
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [initialUserData, setInitialUserData] = useState<UserProfile | null>(null);
  const [profileDataSource, setProfileDataSource] = useState<string>('');

  // Username‐availability check state & refs
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  const usernameTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load user data using the same approach as ProfilePage
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        // Check if user is authenticated through the auth context
        if (!user) {
          setError('Not authenticated. Please log in to edit your profile.');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        // Set initial profile data from auth context
        const userData = {
          username: user.username?.trim() || 'Anonymous User',
          fieldOfStudy: user.fieldOfStudy || '',
          email: user.email || '',
          uid: user.uid || '',
          likes: user.likes || 0,
        };
        
        setProfile(userData);
        setInitialUserData(userData);
        setProfileDataSource('authContext');
        
        // If user has a username, mark it as available since it's the user's current username
        if (userData.username && userData.username !== 'Anonymous User') {
          setUsernameAvailable(true);
        }
        
        // Try to fetch the latest profile data from Firestore
        try {
          // Fetch the user document by ID if available
          if (user.uid) {
            const userDocResponse = await fetch(`${API_BASE_URL}/user/${user.uid}`, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include'
            });
            
            if (userDocResponse.ok) {
              const userDocData = await userDocResponse.json();
              updateProfileData(userDocData, 'User document');
            } else {
              // Try fallback API if user document fetch fails
              await fetchFromFallbackAPI();
            }
          } else {
            // No user ID available, try fallback API
            await fetchFromFallbackAPI();
          }
        } catch (apiError) {
          console.error('API fetch error:', apiError);
          // Continue using auth context data
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
    const fetchFromFallbackAPI = async () => {
      try {
        const fallbackResponse = await fetch(`${API_BASE_URL}/user/profile`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          
          // Try to get user document by ID if available
          const firebaseUserId = user?.uid || fallbackData.uid;
          if (firebaseUserId) {
            try {
              const userDocResponse = await fetch(`${API_BASE_URL}/user/${firebaseUserId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
              });
              
              if (userDocResponse.ok) {
                const userDocData = await userDocResponse.json();
                updateProfileData(userDocData, 'User document', fallbackData);
              } else {
                // Use fallback API data
                updateProfileData(fallbackData, 'Fallback API');
              }
            } catch (userDocError) {
              console.error('Error fetching user document:', userDocError);
              // Use fallback API data
              updateProfileData(fallbackData, 'Fallback API');
            }
          } else {
            // No user ID available, use fallback data
            updateProfileData(fallbackData, 'Fallback API');
          }
        }
      } catch (error) {
        console.error('Error in fallback API:', error);
      }
    };

    // Helper function to update profile data - similar to ProfilePage
    const updateProfileData = (
      newData: any, 
      source: string,
      fallbackData?: any
    ) => {
      // Determine the best username from available sources
      const updatedUsername = newData.username?.trim() || 
                             fallbackData?.username?.trim() || 
                             user?.username?.trim() || 
                             'Anonymous User';
      
      // Update profile with the new data
      setProfile(prev => ({
        ...prev,
        username: updatedUsername,
        fieldOfStudy: newData.fieldOfStudy || fallbackData?.fieldOfStudy || prev.fieldOfStudy,
        email: newData.email || fallbackData?.email || prev.email,
        uid: newData.uid || fallbackData?.uid || prev.uid
      }));

      // Also update initialUserData to track what data we started with
      setInitialUserData(prev => ({
        ...prev as UserProfile,
        username: updatedUsername,
        fieldOfStudy: newData.fieldOfStudy || fallbackData?.fieldOfStudy || (prev as UserProfile)?.fieldOfStudy || '',
        email: newData.email || fallbackData?.email || (prev as UserProfile)?.email || '',
        uid: newData.uid || fallbackData?.uid || (prev as UserProfile)?.uid || ''
      }));
      
      // If username exists, mark it as available since it's the user's current username
      if (updatedUsername && updatedUsername !== 'Anonymous User') {
        setUsernameAvailable(true);
      }
      
      setProfileDataSource(source);
    };

    // Only fetch when auth is not loading anymore
    if (!authLoading) {
      fetchUserProfile();
    }
  }, [user, authLoading, navigate]);

  // Debounced username‐availability check
  const checkUsername = useCallback(async (name: string) => {
    if (name.length < 3) {
      setUsernameAvailable(false);
      setUsernameError(name ? 'Username must be at least 3 characters' : '');
      return;
    }
    
    // Skip the availability check if username hasn't changed from the initial value
    if (initialUserData && name === initialUserData.username) {
      setUsernameAvailable(true);
      setUsernameError('');
      return;
    }
    
    try {
      setIsCheckingUsername(true);
      setUsernameError('');
      const res = await fetch(`${API_BASE_URL}/auth/check-username`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsernameAvailable(data.available);
        setUsernameError(data.available ? '' : 'Username already taken');
      } else {
        setUsernameAvailable(false);
        setUsernameError('Error checking username');
      }
    } catch {
      setUsernameAvailable(false);
      setUsernameError('Connection error');
    } finally {
      setIsCheckingUsername(false);
    }
  }, [initialUserData]);

  useEffect(() => {
    // Reset state & clear previous timer
    if (usernameTimeoutRef.current) clearTimeout(usernameTimeoutRef.current);
    
    // Skip if we're still loading
    if (isLoading) return;
    
    const name = profile.username.trim();
    
    // If username is the same as the original, mark it as available
    if (initialUserData && name === initialUserData.username) {
      setUsernameAvailable(true);
      setUsernameError('');
      return;
    }
    
    // Otherwise, reset availability status
    setUsernameAvailable(false);
    setUsernameError('');
    
    if (name.length >= 3) {
      usernameTimeoutRef.current = setTimeout(() => {
        checkUsername(name);
      }, 500);
    }
    
    return () => {
      if (usernameTimeoutRef.current) clearTimeout(usernameTimeoutRef.current);
    };
  }, [profile.username, checkUsername, isLoading, initialUserData]);

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Save handler with final username check
  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    const name = profile.username.trim();
    if (name.length < 3) {
      setError('Username must be at least 3 characters');
      setIsSaving(false);
      return;
    }
    
    // Skip username check if unchanged
    const usernameChanged = initialUserData && name !== initialUserData.username;
    if (usernameChanged && !usernameAvailable && !isCheckingUsername) {
      await checkUsername(name);
      if (!usernameAvailable) {
        setError(usernameError || 'Username unavailable');
        setIsSaving(false);
        return;
      }
    }

    try {
      const userData = {
        username: name,
        fieldOfStudy: profile.fieldOfStudy.trim(),
        email: profile.email?.trim() || '',
        uid: profile.uid,
      };
      
      const endpoint = `${API_BASE_URL}/user/${profile.uid}`;
      let res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(userData),
      });
      
      if (!res.ok) {
        // fallback
        res = await fetch(`${API_BASE_URL}/user/update-profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(userData),
        });
      }
      
      if (res.ok) {
        setIsSuccess(true);
        setTimeout(() => navigate('/profile'), 1500);
      } else {
        setError(`Failed to update profile. Status: ${res.status}`);
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while updating your profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => navigate('/profile');

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004a74] mb-4" />
              <p className="text-lg text-[#004a74]">Loading your profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="flex flex-col items-center">
              <div className="rounded-full h-16 w-16 bg-green-100 flex items-center justify-center mb-4">
                <CheckCircleIcon className="h-10 w-10 text-green-600" />
              </div>
              <p className="text-xl font-bold text-gray-900 mb-2">Profile Updated!</p>
              <p className="text-gray-600">Your changes have been saved successfully.</p>
              <p className="text-sm text-gray-500 mt-4">Redirecting to your profile...</p>
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
        <div className="max-w-2xl mx-auto mb-4">
          <button
            onClick={handleCancel}
            className="flex items-center text-sm bg-white px-3 py-2 rounded-lg shadow-sm border border-[#004a74]/20 text-[#004a74] hover:bg-[#e3f3ff] transition-colors"
          >
            <ChevronLeftIcon className="w-4 h-4 mr-1" /> Back to Profile
          </button>
        </div>
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-[#004a74] text-white p-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Edit Profile</h1>
            <div className="bg-white/20 p-2 rounded-full">
              <UserIcon className="h-6 w-6" />
            </div>
          </div>
          <form onSubmit={handleSave} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center">
                <AlertCircleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                {error}
              </div>
            )}
            <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg text-sm">
              Fill in the information below to update your profile.

            </div>
            {/* Username field with availability indicator */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="username"
                  value={profile.username}
                  onChange={handleChange}
                  placeholder="Your display name"
                  className={`block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                    usernameError
                      ? 'border-red-500 focus:ring-red-200'
                      : usernameAvailable
                      ? 'border-green-500 focus:ring-green-200'
                      : 'border-gray-300 focus:ring-[#004a74]/20'
                  }`}
                  autoComplete="off"
                />
                {profile.username.length >= 3 && (
                  <div className="absolute inset-y-0 right-3 flex items-center">
                    {isCheckingUsername ? (
                      <div className="h-5 w-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                    ) : usernameAvailable ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircleIcon className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {usernameError && (
                <p className="text-red-500 text-xs mt-1">{usernameError}</p>
              )}
            </div>


            {/* Action buttons */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={
                    isSaving ||
                    isCheckingUsername ||
                    (profile.username.length >= 3 && !usernameAvailable)
                  }
                  className={`flex-1 bg-[#004a74] text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all ${
                    isSaving
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-[#00659f]'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <SaveIcon className="h-5 w-5" />
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className={`sm:w-40 bg-white border border-[#004a74] text-[#004a74] font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all ${
                    isSaving
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-[#e3f3ff]'
                  }`}
                >
                  <XIcon className="h-5 w-5" />
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;