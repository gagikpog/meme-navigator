// src/context/MemeContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';

const MemeContext = createContext();

export const MemeProvider = ({ children }) => {
  const [memes, setMemes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMemes = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/memes');
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

  return (
    <MemeContext.Provider value={{ memes, loading, refreshMemes: fetchMemes }}>
      {children}
    </MemeContext.Provider>
  );
};

export const useMemes = () => useContext(MemeContext);
