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

  // Load user: ưu tiên sessionStorage (guest mode tab này) trước, rồi mới localStorage
  useEffect(() => {
    try {
      const guestUser = sessionStorage.getItem('guestUser');
      if (guestUser) {
        // Tab này đang ở chế độ khách → dùng guest user (không đụng localStorage)
        setUser(JSON.parse(guestUser));
      } else {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      }
    } catch {
      localStorage.removeItem('user');
      sessionStorage.removeItem('guestUser');
    } finally {
      setLoading(false);
    }
  }, []);

  // Đặt virtual guest user (không cần backend)
  const setGuestUser = (userData) => {
    sessionStorage.setItem('guestUser', JSON.stringify(userData));
    setUser(userData);
  };

  // Login function
  const login = async (email, password) => {
    try {
      const result = await authAPI.login(email, password);
      if (result.token && result.user) {
        const userWithToken = { ...result.user, token: result.token };
        // Đăng nhập thật → xóa guest user
        sessionStorage.removeItem('guestUser');
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

  // Register function
  const register = async (name, email, password) => {
    try {
      const result = await authAPI.register(name, email, password);
      if (result.token && result.user) {
        const userWithToken = { ...result.user, token: result.token };
        sessionStorage.removeItem('guestUser');
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
    sessionStorage.removeItem('guestUser');
  };

  const isAdmin = () => user?.role === 'admin';
  const isAuthenticated = () => user !== null;

  const value = {
    user,
    setGuestUser,
    login,
    register,
    logout,
    isAdmin,
    isAuthenticated,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
