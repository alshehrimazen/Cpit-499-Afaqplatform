/**
 * Custom hook for authentication management
 */

import { useState, useEffect } from 'react';
import { saveUser, getUser, removeUser } from '../services/storage.service';
import { authAPI } from '../services/api';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = getUser();
    if (savedUser) {
      setUser(savedUser);
    }
    setLoading(false);
  }, []);

  const login = async (email, password, isGuest = false) => {
    setLoading(true);
    setError(null);

    try {
      if (isGuest) {
        const guestUser = {
          id: 'guest',
          name: 'زائر',
          email: 'guest@afaq.com',
          isGuest: true,
          avatar: 'ز',
        };
        setUser(guestUser);
        saveUser(guestUser);
      } else {
        const { user: loggedInUser } = await authAPI.login(email, password);
        setUser(loggedInUser);
        saveUser(loggedInUser);
      }
      return true;
    } catch (err) {
      setError('فشل تسجيل الدخول. يرجى التحقق من بياناتك.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name, email, password) => {
    setLoading(true);
    setError(null);

    try {
      const { user: newUser } = await authAPI.signup(name, email, password);
      setUser(newUser);
      saveUser(newUser);
      return true;
    } catch (err) {
      setError('فشل إنشاء الحساب. يرجى المحاولة مرة أخرى.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authAPI.logout();
      setUser(null);
      removeUser();
    } catch (err) {
      setError('فشل تسجيل الخروج.');
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (updates) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      saveUser(updatedUser);
    }
  };

  return {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    updateUser,
    isAuthenticated: !!user,
  };
};
