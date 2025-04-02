import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../../components/NavBar';

interface UserProfile {
  username: string;
  university: string;
  fieldOfStudy: string;
  email?: string;
  uid?: string;
}

const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile>({
    username: '',
    university: '',
    fieldOfStudy: '',
    email: '',
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Load profile data from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setProfile({
        username: userData.username || '',
        university: userData.university || '',
        fieldOfStudy: userData.fieldOfStudy || '',
        email: userData.email || '',
        uid: userData.uid || ''
      });
    } else {
      setError('User not found. Please log in.');
    }
    setIsLoading(false);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    try {
      // Send updated profile data to the API
      const response = await fetch('http://localhost:6500/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(profile)
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        // Update localStorage with the new profile data
        localStorage.setItem('user', JSON.stringify({ ...profile, ...updatedProfile }));
        // Navigate back to the profile page
        navigate('/profile');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update profile.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while updating your profile.');
    }
  };

  const handleCancel = () => {
    navigate('/profile');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="container mx-auto px-4 pt-24 pb-12 text-center">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004a74]"></div>
          </div>
          <p className="text-xl mt-4 text-[#004a74]">Loading...</p>
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
            <h1 className="text-3xl font-bold">Edit Profile</h1>
          </div>
          {/* Form */}
          <form onSubmit={handleSave} className="p-8 space-y-6">
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <input
                type="text"
                name="username"
                value={profile.username}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#004a74]/20"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">University</label>
              <input
                type="text"
                name="university"
                value={profile.university}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#004a74]/20"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Field of Study</label>
              <input
                type="text"
                name="fieldOfStudy"
                value={profile.fieldOfStudy}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#004a74]/20"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={profile.email || ''}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#004a74]/20"
              />
            </div>
            <div className="flex flex-col gap-3">
              <button
                type="submit"
                className="w-full bg-[#004a74] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#00659f] transition-all"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="w-full bg-white border border-[#004a74] text-[#004a74] font-bold py-3 px-6 rounded-xl hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
