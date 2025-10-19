import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authFetch } from '../utils/authFetch';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const updateUserData = useCallback(() => {
     authFetch('/api/users/me').then((data) => data.json()).then((data) => {
        setUser(data);
        setLoading(false);
      }).catch((error) => {
        console.error('Ошибка при загрузке данных пользователя:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }).finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
// Проверяем, есть ли сохраненные данные пользователя
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (savedUser && token) {
       updateUserData();
    }
  }, [updateUserData]);

  const login = useCallback((userData, token) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    updateUserData();
  }, [updateUserData]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }, []);

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const isWriter = () => {
    return user?.role === 'writer';
  };

  const isUser = () => {
    return user?.role === 'user';
  };

  const canCreate = () => {
    return isAdmin() || isWriter();
  };

  const canEdit = () => {
    return isAdmin() || isWriter();
  };

  const canDelete = () => {
    return isAdmin() || isWriter();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAdmin,
        isWriter,
        isUser,
        canCreate,
        canEdit,
        canDelete
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth должен использоваться внутри AuthProvider');
  }
  return context;
};
