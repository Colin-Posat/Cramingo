import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User as UserIcon, 
  ChevronLeft as ChevronLeftIcon,
  Save as SaveIcon,
  X as XIcon,
  AlertCircle as AlertCircleIcon,
  CheckCircle as CheckCircleIcon
} from 'lucide-react';
import NavBar from '../../components/NavBar';

interface UserProfile {
  username: string;
  fieldOfStudy: string;
  email?: string;
  uid?: string;
  likes?: number;
}

const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile>({
    username: '',
    fieldOfStudy: '',
    email: '',
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Load profile data from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setProfile({
        username: userData.username || '',
        fieldOfStudy: userData.fieldOfStudy || '',
        email: userData.email || '',
        uid: userData.uid || userData.id || '',
        likes: userData.likes || 0
      });
    } else {
      setError('User not found. Please log in.');
      setTimeout(() => navigate('/login'), 2000);
    }
    setIsLoading(false);
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);
    
    try {
      const userData = {
        username: profile.username.trim(),
        fieldOfStudy: profile.fieldOfStudy.trim(),
        email: profile.email?.trim() || '',
        uid: profile.uid
      };
      
      console.log('Updating profile with data:', userData);
      
      // Send to your specific endpoint using PUT method (same pattern as your SetController)
      const userId = profile.uid;
      const endpoint = `https://fliply-backend.onrender.com/api/user/${userId}`;
      
      console.log('Using endpoint:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(userData)
      });
      
      if (response.ok) {
        // Update localStorage with new profile data
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const currentUserData = JSON.parse(storedUser);
          const updatedUserData = {
            ...currentUserData,
            ...userData
          };
          localStorage.setItem('user', JSON.stringify(updatedUserData));
        }
        
        // Show success message
        setIsSuccess(true);
        setTimeout(() => {
          navigate('/profile');
        }, 1500);
      } else {
        // Try fallback endpoint (matching your component logic)
        console.log('Trying fallback endpoint: /api/user/update-profile');
        
        const fallbackResponse = await fetch('https://fliply-backend.onrender.com/api/user/update-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(userData)
        });
        
        if (fallbackResponse.ok) {
          // Update localStorage
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const currentUserData = JSON.parse(storedUser);
            const updatedUserData = {
              ...currentUserData,
              ...userData
            };
            localStorage.setItem('user', JSON.stringify(updatedUserData));
          }
          
          // Show success message
          setIsSuccess(true);
          setTimeout(() => {
            navigate('/profile');
          }, 1500);
        } else {
          setError(`Failed to update profile. Server returned status: ${fallbackResponse.status}`);
        }
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('An error occurred while updating your profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/profile');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004a74] mb-4"></div>
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
            <div className="flex flex-col items-center justify-center">
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
        {/* Back button */}
        <div className="max-w-2xl mx-auto mb-4">
          <button
            onClick={handleCancel}
            className="flex items-center text-sm bg-white px-3 py-2 rounded-lg shadow-sm border border-[#004a74]/20 text-[#004a74] hover:bg-[#e3f3ff] transition-colors"
          >
            <ChevronLeftIcon className="w-4 h-4 mr-1" /> Back to Profile
          </button>
        </div>
        
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header Section */}
          <div className="bg-[#004a74] text-white p-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Edit Profile</h1>
            <div className="bg-white/20 p-2 rounded-full">
              <UserIcon className="h-6 w-6" />
            </div>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSave} className="p-6 space-y-6">
            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center">
                <AlertCircleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                {error}
              </div>
            )}
            
            {/* Form instructions */}
            <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg text-sm">
              Fill in the information below to update your profile.
            </div>
            
            {/* Username field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={profile.username}
                onChange={handleChange}
                className="block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 border-gray-300 focus:ring-[#004a74]/20"
                placeholder="Your display name"
                autoComplete="off"
              />
            </div>
            
            {/* Field of Study field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Field of Study
              </label>
              <input
                type="text"
                name="fieldOfStudy"
                value={profile.fieldOfStudy}
                onChange={handleChange}
                className="block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 border-gray-300 focus:ring-[#004a74]/20"
                placeholder="Your major or area of study"
              />
            </div>
            

            
            {/* Action buttons */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`flex-1 bg-[#004a74] text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all ${
                    isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#00659f]'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
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
                    isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
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