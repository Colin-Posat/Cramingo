import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import axios from 'axios';
import { API_BASE_URL, getApiUrl } from '../config/api';
// Define your API URL
const API_URL = API_BASE_URL; // Adjust to your backend URL

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
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Attempting login with:", { email });
      
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      console.log("Login response:", res.data);
      
      if (res.data.token) {
        console.log("Received token, storing in localStorage");
        localStorage.setItem('token', res.data.token);
        
        setAuthToken(res.data.token);
        setUser(res.data.user);
        console.log("User set in state:", res.data.user);
      } else {
        console.error("No token received in response");
        throw new Error("No authentication token received");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // In useEffect for token verification
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log("No token found in localStorage");
        setLoading(false);
        return;
      }
      
      try {
        console.log("Found token, setting in headers");
        setAuthToken(token);
        
        console.log("Verifying token with backend");
        const res = await axios.get(`${API_URL}/auth/verify-token`);
        console.log("Token verification response:", res.data);
        
        if (res.data.success) {
          console.log("Token valid, setting user");
          setUser(res.data.user);
        } else {
          console.error("Token verification failed");
          localStorage.removeItem('token');
          setAuthToken(null);
        }
      } catch (err) {
        console.error('Token verification error:', err);
        localStorage.removeItem('token');
        setAuthToken(null);
      } finally {
        setLoading(false);
      }
    };
  
    loadUser();
  }, []);

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
        isAuthenticated: !!user
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