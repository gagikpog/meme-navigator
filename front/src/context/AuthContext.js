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

  const isModerator = () => {
    return user?.role === 'moderator';
  };

  const isWriter = () => {
    return user?.role === 'writer';
  };

  const hasModeratorAccess = () => {
    return isAdmin() || isModerator();
  }

  const canFilter = () => {
    return isAdmin() || isModerator() || isWriter();
  };

  const canCreateMeme = () => {
    return isAdmin() || isModerator() || isWriter();
  };

  const canEditMeme = (meme) => {
    if (isAdmin() || isModerator()) {
      return true;
    }
    return isWriter() && user.id === meme.user_id;
  };

  const canDeleteMeme = (meme) => {
     if (isAdmin() || isModerator()) {
      return true;
    }
    return isWriter() && user.id === meme.user_id && meme.permissions === 'moderate';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAdmin,
        hasModeratorAccess,
        canFilter,
        canCreateMeme,
        canEditMeme,
        canDeleteMeme
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
