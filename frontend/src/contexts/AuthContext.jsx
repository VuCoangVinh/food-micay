import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api.js';

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

  // Load user from localStorage on mount
  useEffect(() => {
    try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
    }
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
      localStorage.removeItem('user');
    } finally {
    setLoading(false);
    }
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      const result = await authAPI.login(email, password);
      // authAPI.login already handles token storage in localStorage
      // Backend returns { success: true, token, user } or { error: "..." }
      if (result.token && result.user) {
        // Store user with token
        const userWithToken = { ...result.user, token: result.token };
        setUser(userWithToken);
        localStorage.setItem('user', JSON.stringify(userWithToken));
        return { success: true, user: userWithToken };
      } else if (result.error) {
        return { success: false, error: result.error };
      } else {
        return { success: false, error: 'Đăng nhập thất bại' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'Email hoặc mật khẩu không đúng' };
    }
  };

  // Register function - Only for regular users, not admin
  const register = async (name, email, password) => {
    try {
      const result = await authAPI.register(name, email, password);
      // authAPI.register already handles token storage in localStorage
      // Backend returns { success: true, token, user } or { error: "..." }
      if (result.token && result.user) {
        // Store user with token
        const userWithToken = { ...result.user, token: result.token };
        setUser(userWithToken);
        localStorage.setItem('user', JSON.stringify(userWithToken));
        return { success: true, user: userWithToken };
      } else if (result.error) {
        return { success: false, error: result.error };
      } else {
        return { success: false, error: 'Đăng ký thất bại' };
      }
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: error.message || 'Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại.' };
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // Check if user is admin
  const isAdmin = () => {
    return user?.role === 'admin';
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return user !== null;
  };

  const value = {
    user,
    login,
    register,
    logout,
    isAdmin,
    isAuthenticated,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
