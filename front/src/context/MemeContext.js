import React, { createContext, useContext, useEffect, useState } from 'react';

const MemeContext = createContext();

export const MemeProvider = ({ children }) => {
  const [memes, setMemes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMemes = async () => {
      try {
        const response = await fetch('/data.json');
        const data = await response.json();
        setMemes(data);
      } catch (error) {
        console.error('Ошибка при загрузке данных мемов:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMemes();
  }, []);

  return (
    <MemeContext.Provider value={{ memes, loading }}>
      {children}
    </MemeContext.Provider>
  );
};

export const useMemes = () => useContext(MemeContext);
