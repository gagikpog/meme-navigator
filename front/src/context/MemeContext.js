import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const MemeContext = createContext();

export const MemeProvider = ({ children }) => {
    const [memes, setMemes] = useState([]);
    const [loading, setLoading] = useState(true);
    const { authFetch } = useAuth();


    const fetchMemes = useCallback(async () => {
        if (document.location.pathname === '/login/') {
            return;
        }

        try {
            const response = await authFetch('/api/memes');
            const data = await response.json();
            setMemes(data); // tags уже массив
        } catch (error) {
            console.error('Ошибка при загрузке мемов с сервера:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMemes();
    }, [fetchMemes]);

    return (
        <MemeContext.Provider value={{ memes, loading, refreshMemes: fetchMemes }}>
            {children}
        </MemeContext.Provider>
    );
};

export const useMemes = () => useContext(MemeContext);
