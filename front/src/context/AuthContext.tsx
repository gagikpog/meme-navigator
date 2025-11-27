import { createContext, useCallback, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { authorizationFetch } from '../utils/authFetch';
import useDialog from '../hooks/useDialog';
import type { AuthContextValue, AuthFetch, Meme, User } from '../types';

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { Dialog, showModal: showDialog } = useDialog();

  const authFetch: AuthFetch = useCallback(
    (url, options = {}, confirmError = true) =>
      authorizationFetch(url, options).catch((error: Error) => {
        if (confirmError && error.message) {
          showDialog({
            title: 'Ошибка',
            description: error.message,
            buttons: {
              yes: { text: 'Ок', icon: null }
            }
          });
        }
        throw error;
      }),
    [showDialog]
  );

  const updateUserData = useCallback(async () => {
    try {
      const response = await authFetch('/api/users/me');
      const data: User = await response.json();
      setUser(data);
    } catch (error) {
      console.error('Ошибка при загрузке данных пользователя:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (savedUser && token) {
      void updateUserData();
    } else {
      setLoading(false);
    }
  }, [updateUserData]);

  const login = useCallback(
    (userData: User, token: string) => {
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', token);
      void updateUserData();
    },
    [updateUserData]
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }, []);

  const isAdmin = () => user?.role === 'admin';
  const isModerator = () => user?.role === 'moderator';
  const isWriter = () => user?.role === 'writer';

  const hasModeratorAccess = () => isAdmin() || isModerator();
  const canFilter = () => isAdmin() || isModerator() || isWriter();
  const canCreateMeme = () => canFilter();

  const canEditMeme = (meme: Meme) => {
    if (!user) return false;
    if (isAdmin() || isModerator()) {
      return true;
    }
    return isWriter() && user.id === meme.user_id;
  };

  const canDeleteMeme = (meme: Meme) => {
    if (!user) return false;
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
        canDeleteMeme,
        authFetch
      }}
    >
      {children}
      <Dialog />
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth должен использоваться внутри AuthProvider');
  }
  return context;
};
