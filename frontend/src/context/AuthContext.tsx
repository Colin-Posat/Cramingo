import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import axios from 'axios';
import { API_BASE_URL, getApiUrl } from '../config/api';

// Define your API URL
const API_URL = API_BASE_URL;

// Define user type based on your data structure
interface User {
  uid: string;
  email: string;
  username: string;
  university?: string;
  fieldOfStudy?: string;
  likes: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, providedToken?: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loginWithGoogle: (email: string, token: string) => Promise<void>;
  delayedNavigationAfterLogin: boolean;
  setDelayedNavigationAfterLogin: (value: boolean) => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [delayedNavigationAfterLogin, setDelayedNavigationAfterLogin] = useState<boolean>(false);

  // Setup axios
  const setAuthToken = (token: string | null) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  // Check if user is already logged in
  useEffect(() => {
    const loadUser = async () => {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        // Set token in axios headers
        setAuthToken(token);
        
        // Verify token is valid
        const res = await axios.get(`${API_BASE_URL}/auth/verify-token`);
        
        if (res.data.success) {
          setUser(res.data.user);
        } else {
          // Clear invalid token
          localStorage.removeItem('token');
          setAuthToken(null);
        }
      } catch (err) {
        console.error('Token verification failed:', err);
        localStorage.removeItem('token');
        setAuthToken(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const loginWithGoogle = async (email: string, token: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Attempting Google login with:", { email });
      
      if (!token) {
        throw new Error("Google authentication token is required");
      }
      
      // Set the token in axios headers
      setAuthToken(token);
      
      // Store token in localStorage
      localStorage.setItem('token', token);
      
      // Verify the token with your backend to get user data
      const res = await axios.get(`${API_URL}/auth/verify-token`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.data.success || !res.data.user) {
        throw new Error("Token verification failed");
      }
      
      // Update state with user data
      setUser(res.data.user);
      
      // If we're in a delayed navigation scenario (like the AccountFoundPopup),
      // don't do anything here - the navigation will be handled by the popup component
      
    } catch (err: any) {
      console.error("Google login error:", err);
      setError(err.response?.data?.message || 'Google login failed');
      
      // Clean up in case of error
      localStorage.removeItem('token');
      setAuthToken(null);
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (email: string, password: string, providedToken?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Attempting login with:", { email, hasProvidedToken: !!providedToken });
      
      let token: string;
      let userData: User;
      
      // If a token is provided (e.g., from Google Auth), use it directly
      if (providedToken) {
        token = providedToken;
        // Verify the token and get user info
        setAuthToken(token);
        
        try {
          const res = await axios.get(`${API_URL}/auth/verify-token`);
          if (!res.data.success || !res.data.user) {
            throw new Error("Invalid authentication token");
          }
          userData = res.data.user;
        } catch (err) {
          console.error("Token verification failed:", err);
          setAuthToken(null);
          throw new Error("Token verification failed");
        }
      } else {
        // Regular email/password login
        const res = await axios.post(`${API_URL}/auth/login`, { email, password });
        console.log("Login response:", res.data);
        
        if (!res.data.token || !res.data.user) {
          console.error("No token or user received in response");
          throw new Error("No authentication token received");
        }
        
        token = res.data.token;
        userData = res.data.user;
        
        // Set the token in axios headers
        setAuthToken(token);
      }
      
      // Store token in localStorage
      localStorage.setItem('token', token);
      
      // Update state with user data
      setUser(userData);
      console.log("User set in state:", userData);
      
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`);
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      // Always clear local state regardless of server response
      localStorage.removeItem('token');
      setAuthToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        loginWithGoogle,
        isAuthenticated: !!user,
        delayedNavigationAfterLogin,
        setDelayedNavigationAfterLogin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};