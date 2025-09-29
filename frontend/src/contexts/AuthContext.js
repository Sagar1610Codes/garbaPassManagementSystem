import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on initial load
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const { data } = await authAPI.getMe();
          setUser(data);
        }
      } catch (err) {
        console.error('Error loading user', err);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Login user
  const login = async (email, password) => {
    try {
      console.log('Attempting login with email:', email);
      const response = await authAPI.login(email, password);
      console.log('Login response:', response);
      
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        // Fetch user data after successful login
        const userResponse = await authAPI.getMe();
        console.log('User data:', userResponse.data);
        setUser(userResponse.data);
        return { success: true };
      } else {
        console.error('No token in response:', response);
        return { 
          success: false, 
          error: response.data?.message || 'Invalid response from server' 
        };
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  };

  // Register user with invitation token
  const register = async (token, userData) => {
    try {
      const { data } = await authAPI.register(token, userData);
      localStorage.setItem('token', data.token);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
      return { success: false, error: err.response?.data?.error || 'Registration failed' };
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Error logging out', err);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  // Send invitation
  const sendInvitation = async (email) => {
    try {
      await authAPI.sendInvitation(email);
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.error || 'Failed to send invitation' 
      };
    }
  };

  // Verify invitation token
  const verifyInvitation = async (token) => {
    try {
      const { data } = await authAPI.verifyInvitation(token);
      return { success: true, email: data.email };
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.error || 'Invalid or expired invitation' 
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        sendInvitation,
        verifyInvitation,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthContext;
