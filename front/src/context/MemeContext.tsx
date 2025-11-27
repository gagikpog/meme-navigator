import { createContext, useCallback, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { useAuth } from './AuthContext';
import type { Meme, MemeContextValue } from '../types';

const MemeContext = createContext<MemeContextValue | null>(null);

export const MemeProvider = ({ children }: PropsWithChildren) => {
  const [memes, setMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(true);
  const { authFetch } = useAuth();

  const fetchMemes = useCallback(async () => {
    if (document.location.pathname === '/login/') {
      setLoading(false);
      return;
    }

    try {
      const response = await authFetch('/api/memes');
      const data: Meme[] = await response.json();
      setMemes(data);
    } catch (error) {
      console.error('Ошибка при загрузке мемов с сервера:', error);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    void fetchMemes();
  }, [fetchMemes]);

  return (
    <MemeContext.Provider value={{ memes, loading, refreshMemes: fetchMemes }}>
      {children}
    </MemeContext.Provider>
  );
};

export const useMemes = (): MemeContextValue => {
  const context = useContext(MemeContext);
  if (!context) {
    throw new Error('useMemes должен использоваться внутри MemeProvider');
  }
  return context;
};
