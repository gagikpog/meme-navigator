import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMemes } from '../context/MemeContext';

const Home = () => {
  const { memes, loading } = useMemes();
  const [search, setSearch] = useState("");

  const normalize = (str) => str.toLowerCase().trim();

  const filteredImages = memes.filter(img => {
    if ((!img.tags || img.tags.length === 0) && search === "") {
      return true;
    }

    const normalizedSearch = normalize(search);

    return img.tags?.some(tag =>
      normalize(tag).includes(normalizedSearch)
    );
  });

  if (loading) return <div className="p-4">Загрузка...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Галерея Мемов</h1>
      <input
        type="text"
        placeholder="Поиск по тегам..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border p-2 mb-4 w-full rounded"
      />
      <div className="flex flex-wrap gap-4 justify-start">
        {filteredImages.map((img) => (
          <Link
            key={img.fileName}
            to={`/meme/${img.fileName}`}
            className="border p-2 rounded shadow-sm flex-grow"
            style={{ flexBasis: '400px', maxWidth: '100%' }}
          >
            <div className="w-full h-[300px] overflow-hidden rounded">
              <img
                src={`/images/${img.fileName}`}
                alt={img.fileName}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Теги: {img.tags?.join(", ") || "Без тегов"}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Home;
