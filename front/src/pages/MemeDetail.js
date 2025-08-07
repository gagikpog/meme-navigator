import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMemes } from '../context/MemeContext';
import { IMAGE_URL } from '../config';
import { authFetch } from '../utils/authFetch';
import ImageWithAuth from '../components/ImageWithAuth';
import ImageModal from '../components/ImageModal';

const MemeDetail = () => {
  const { memes, refreshMemes } = useMemes();
  const { fileName } = useParams();
  const navigate = useNavigate();
  const meme = memes.find(m => m.fileName === fileName);

  const [tags, setTags] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (meme) setTags(meme.tags.join(', '));
  }, [meme]);

  if (!meme) return <div>Мем не найден</div>;

  const handleSave = async () => {
    setIsSaving(true);
    const tagArray = tags.split(',').map((t) => t.trim()).filter(Boolean);
    const res = await authFetch(`/api/memes/${meme.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags: tagArray }),
    });
    if (res.ok) await refreshMemes();
    setIsSaving(false);
  };

  const handleDelete = async () => {
    const confirmed = window.confirm('Удалить мем?');
    if (!confirmed) return;

    const res = await authFetch(`/api/memes/${meme.id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      await refreshMemes();
      navigate('/');
    }
  };

  return (
    <>
      <div className="max-w-6xl mx-auto p-4">
        {/* Картинка на всю ширину и высоту экрана */}
        <div className="w-full h-[calc(100vh-150px)] overflow-hidden rounded mb-6">
          <div
            className="w-full h-[calc(100vh-150px)] flex items-center justify-center overflow-hidden bg-black rounded mb-6 cursor-pointer"
            onClick={() => setShowModal(true)}
          >

            <ImageWithAuth
              src={`${IMAGE_URL}/${meme.fileName}`}
              alt={meme.fileName}
              className="w-full h-full object-contain"
            />
          </div>
        </div>


        {/* Блок редактирования внизу */}
        <div className="mt-8 border-t pt-6">
          <h2 className="text-lg font-semibold mb-2">Редактировать теги:</h2>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="теги через запятую"
            className="border rounded w-full p-2 mb-4"
          />
          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Сохранить
            </button>
            <button
              onClick={handleDelete}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Удалить
            </button>
          </div>
        </div>
          {showModal && (
            <ImageModal
              src={`${IMAGE_URL}/${meme.fileName}`}
              onClose={() => setShowModal(false)}
            />
          )}
      </div>
    </>
  );
};

export default MemeDetail;