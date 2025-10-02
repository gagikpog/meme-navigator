// src/context/MemeContext.js
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { authFetch } from '../utils/authFetch';
import { API_URL } from '../config';

const MemeContext = createContext();

export const MemeProvider = ({ children }) => {
  const [memes, setMemes] = useState([]);
  const [loading, setLoading] = useState(true);


  const fetchMemes = async () => {
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
  };

  useEffect(() => {
    fetchMemes();
  }, []);

  // Subscribe to server-sent events for new memes
  const sseRef = useRef(null);
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Request browser Notification permission once
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    const url = `${API_URL}/api/notifications`;
    // Use fetch-based SSE to send Authorization header is tricky; instead, backend protects route with auth middleware,
    // so we rely on fetch keep-alive with headers by using EventSource polyfill pattern via query token.
    // But we already have auth-protected endpoint; simplest: use native EventSource and pass token via query.
    const es = new EventSource(`${url}?token=${encodeURIComponent(token)}`);
    sseRef.current = es;

    es.onmessage = (evt) => {
      try {
        const parsed = JSON.parse(evt.data);
        if (parsed?.type === 'meme_created') {
          const meme = parsed.data;
          // Show notification only if user is allowed to see it; filtering is also done server-side by role
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            try {
              const title = meme.permissions === 'private' ? 'Новый приватный мем' : 'Новый мем';
              const n = new Notification(title, {
                body: meme.description || (Array.isArray(meme.tags) ? `#${meme.tags.slice(0,3).join(' #')}` : ''),
                tag: `meme-${meme.id}`,
              });
              n.onclick = () => {
                window.focus();
              };
            } catch {}
          }
          // Refresh meme list
          fetchMemes();
        }
      } catch {}
    };

    es.onerror = () => {
      // Keep connection open to allow native auto-reconnect
    };

    return () => {
      try { es.close(); } catch {}
      sseRef.current = null;
    };
  }, []);

  return (
    <MemeContext.Provider value={{ memes, loading, refreshMemes: fetchMemes }}>
      {children}
    </MemeContext.Provider>
  );
};

export const useMemes = () => useContext(MemeContext);
