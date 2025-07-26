import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMemes } from '../context/MemeContext';

const MemeDetail = () => {
  const { fileName } = useParams(); // fileName = "funny-cat.jpg"
  const { memes } = useMemes();
  const navigate = useNavigate();

  // Ищем точное совпадение по fileName
  const meme = memes.find((img) => img.fileName === fileName);

  if (!meme) {
    return <div className="p-4">Мем не найден</div>;
  }

  return (
    <div className="p-4">
      <button onClick={() => navigate(-1)} className="mb-4 text-blue-500">← Назад</button>
      <img src={`/images/${meme.fileName}`} alt={meme.fileName} className="w-full max-w-md" />
      <p className="mt-2">Теги: {meme.tags.join(', ')}</p>
    </div>
  );
};

export default MemeDetail;
