import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sicuti_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      refreshUser();
    }
    
    const handleAuthError = () => {
      logout();
    };
    window.addEventListener('authError', handleAuthError);
    return () => window.removeEventListener('authError', handleAuthError);
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { username, password });
      if (res.data.success) {
        const { token, refreshToken, user: userData } = res.data;
        localStorage.setItem('sicuti_token', token);
        if (refreshToken) localStorage.setItem('sicuti_refresh_token', refreshToken);
        localStorage.setItem('sicuti_user', JSON.stringify(userData));
        setUser(userData);
        return { success: true, user: userData };
      } else {
        return { success: false, message: res.data.message };
      }
    } catch (err) {
      return { 
        success: false, 
        message: err.response?.data?.message || 'Gagal terhubung ke server database' 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('sicuti_refresh_token');
      await api.post('/auth/logout', { refreshToken });
    } catch (e) {
      console.error('Error logging out from server', e);
    } finally {
      localStorage.removeItem('sicuti_token');
      localStorage.removeItem('sicuti_refresh_token');
      localStorage.removeItem('sicuti_user');
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
        localStorage.setItem('sicuti_user', JSON.stringify(res.data.user));
      }
    } catch (e) {
      console.error('Error refreshing user', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
