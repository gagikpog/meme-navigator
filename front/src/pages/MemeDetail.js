import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMemes } from '../context/MemeContext';
import { IMAGE_URL } from '../config';
import { authFetch } from '../utils/authFetch';
import ImageWithAuth from '../components/ImageWithAuth';

const MemeDetail = () => {
  const { memes, refreshMemes } = useMemes();
  const { fileName } = useParams();
  const navigate = useNavigate();
  const meme = memes.find(m => m.fileName === fileName);

  const [tags, setTags] = useState(meme?.tags.join(', ') || '');
  const [isSaving, setIsSaving] = useState(false);

  if (!meme) return <div className="p-4">Мем не найден</div>;

  const handleUpdate = async () => {
    setIsSaving(true);
    try {
      const res = await authFetch(`/api/memes/${meme.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });

      if (res.ok) {
        if (res.ok) {
          await refreshMemes();
          navigate(-1);
        }
      }
    } catch (err) {
      alert('Ошибка при обновлении');
    }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Удалить этот мем?')) return;

    try {
      await authFetch(`/api/memes/${meme.id}`, {
        method: 'DELETE',
      });
      await refreshMemes();
      navigate('/');
    } catch (err) {
      alert('Ошибка при удалении');
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <ImageWithAuth
        src={`${IMAGE_URL}/${meme.fileName}`}
        alt={meme.fileName}
        className="w-full max-w-md object-cover rounded mb-4"
      />

      <div className="mb-4">
        <label className="block mb-1 font-semibold">Теги</label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="border p-2 w-full rounded"
        />
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleUpdate}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          disabled={isSaving}
        >
          Сохранить
        </button>

        <button
          onClick={handleDelete}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Удалить
        </button>
      </div>
    </div>
  );
};

export default MemeDetail;
