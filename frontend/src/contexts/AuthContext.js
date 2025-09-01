import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const navigate = useNavigate();

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await api.get('/auth/me');
          setUser(response.data.author);
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: newToken, author } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(author);
      
      toast.success('Login successful!');
      navigate('/dashboard');
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Login failed';
      let errorDetails = null;

      if (error.response?.data) {
        const { message, errors, field } = error.response.data;
        
        if (errors && Array.isArray(errors)) {
          // Handle validation errors
          errorDetails = errors;
          errorMessage = 'Please fix the validation errors below';
        } else if (field && message) {
          // Handle field-specific errors
          errorDetails = [{ field, message }];
          errorMessage = message;
        } else if (message) {
          // Handle general server errors
          errorMessage = message;
        }
      } else if (error.message) {
        // Handle network errors
        errorMessage = error.message;
      }

      return { 
        success: false, 
        error: errorMessage,
        details: errorDetails 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { token: newToken, author } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(author);
      
      toast.success('Registration successful!');
      navigate('/dashboard');
      
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Registration failed';
      let errorDetails = null;

      if (error.response?.data) {
        const { message, errors, field } = error.response.data;
        
        if (errors && Array.isArray(errors)) {
          // Handle validation errors
          errorDetails = errors;
          errorMessage = 'Please fix the validation errors below';
        } else if (field && message) {
          // Handle field-specific errors
          errorDetails = [{ field, message }];
          errorMessage = message;
        } else if (message) {
          // Handle general server errors
          errorMessage = message;
        }
      } else if (error.message) {
        // Handle network errors
        errorMessage = error.message;
      }

      return { 
        success: false, 
        error: errorMessage,
        details: errorDetails 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
    navigate('/');
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/auth/profile', profileData);
      setUser(response.data.author);
      toast.success('Profile updated successfully!');
      return { success: true };
    } catch (error) {
      console.error('Profile update error:', error);
      
      let errorMessage = 'Profile update failed';
      let errorDetails = null;

      if (error.response?.data) {
        const { message, errors, field } = error.response.data;
        
        if (errors && Array.isArray(errors)) {
          errorDetails = errors;
          errorMessage = 'Please fix the validation errors below';
        } else if (field && message) {
          errorDetails = [{ field, message }];
          errorMessage = message;
        } else if (message) {
          errorMessage = message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      return { 
        success: false, 
        error: errorMessage,
        details: errorDetails 
      };
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
