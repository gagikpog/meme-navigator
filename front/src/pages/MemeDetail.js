import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMemes } from '../context/MemeContext';
import { useAuth } from '../context/AuthContext';
import { IMAGE_URL } from '../config';
import { authFetch } from '../utils/authFetch';
import ImageWithAuth from '../components/ImageWithAuth';
import ImageModal from '../components/ImageModal';

const MemeDetail = () => {
  const { memes, refreshMemes } = useMemes();
  const { fileName } = useParams();
  const navigate = useNavigate();
  const { canEdit, canDelete } = useAuth();
  const meme = memes.find(m => m.fileName === fileName);

  const [tags, setTags] = useState(meme?.tags.join(', ') || '');
  const [description, setDescription] = useState(meme?.description || '');
  const [permissions, setPermissions] = useState(meme?.permissions || 'private');
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Scroll to top when opening a meme or navigating between memes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [fileName]);

  useEffect(() => {
    if (meme) {
      setTags(meme.tags.join(', '));
      setDescription(meme.description);
      setPermissions(meme.permissions || 'private');
    };
  }, [meme]);

  if (!meme) return <div>Мем не найден</div>;

  const handleSave = async () => {
    if (!canEdit()) return;

    setIsSaving(true);
    const tagArray = tags.split(',').map((t) => t.trim()).filter(Boolean);
    const res = await authFetch(`/api/memes/${meme.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags: tagArray, description, permissions }),
    });
    if (res.ok) await refreshMemes();
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!canDelete()) return;

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
            className="w-full h-[calc(100vh-150px)] flex items-center justify-center overflow-hidden bg-gray-50 rounded mb-6 cursor-pointer"
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
            disabled={!canEdit()}
          />
          {canEdit() ? (
            <div className="mt-4 mb-4">
              <label className="block">Описание:</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 rounded bg-gray-100"
                rows="10"
                disabled={!canEdit()}
              />
            </div>
          ) : (
            description && (
              <div className="mt-4 mb-4">
                <label className="block">Описание:</label>
                <div className="w-full p-2 rounded bg-gray-100">
                  {description}
                </div>
              </div>
            )
          )}

          {canEdit() && (
            <div className="mt-4 mb-4">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissions === 'public'}
                  onChange={(e) => setPermissions(e.target.checked ? 'public' : 'private')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={!canEdit()}
                />
                {permissions === 'public' ? (
                  <span className="text-green-600">🌐</span>
                ) : (
                  <span className="text-red-600">🔒</span>
                )}
                Публичная
              </label>
              <p className="text-xs text-gray-500 mt-1">
                {permissions === 'public' ? 'Мем доступен всем пользователям' : 'Мем доступен только администраторам'}
              </p>
            </div>
          )}

          <div className="flex gap-4">
            {canEdit() && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Сохранить
              </button>
            )}
            {canDelete() && (
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Удалить
              </button>
            )}
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