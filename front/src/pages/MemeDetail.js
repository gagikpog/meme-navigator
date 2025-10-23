import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  const { canEditMeme, canDeleteMeme, hasModeratorAccess } = useAuth();

  const currentMemeIndex = useMemo(() => {
    return memes.findIndex(m => m.fileName === fileName);
  }, [fileName, memes]);

  const meme = memes[currentMemeIndex];
  const prevMeme = memes[(currentMemeIndex - 1 + memes.length) % memes.length];
  const nextMeme = memes[(currentMemeIndex + 1) % memes.length];

  const [tags, setTags] = useState(meme?.tags.join(', ') || '');
  const [description, setDescription] = useState(meme?.description || '');
  const [permissions, setPermissions] = useState(meme?.permissions || 'private');
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

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


  const hasEditRight = canEditMeme(meme);

  const validateForm = () => {
    const newErrors = {};

    if (!tags.trim()) {
      newErrors.tags = 'Теги обязательны для заполнения';
    }

    if (!description.trim()) {
      newErrors.description = 'Описание обязательно для заполнения';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

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

  const linkPropagation = (event) => {
    event.stopPropagation();
  };

  return (
    <>
      <div className="max-w-6xl mx-auto p-4 relative">
        {/* Картинка на всю ширину и высоту экрана */}
        <div className='sticky top-14 z-10 flex justify-end mb-2 pointer-events-none'>
          <div className="bg-black bg-opacity-50 text-white text-sm px-2 rounded flex items-center">
            {currentMemeIndex + 1} из {memes.length}
          </div>
          <div onClick={() => navigate(-1)} className='bg-black bg-opacity-50 text-white text-sm px-1 py-1 rounded-full z-10 cursor-pointer ml-4 pointer-events-auto'>
            <svg width="25" height="25" viewBox="0 0 24 24">
              <path fill="currentColor" d="M5.29289 5.29289C5.68342 4.90237 6.31658 4.90237 6.70711 5.29289L12 10.5858L17.2929 5.29289C17.6834 4.90237 18.3166 4.90237 18.7071 5.29289C19.0976 5.68342 19.0976 6.31658 18.7071 6.70711L13.4142 12L18.7071 17.2929C19.0976 17.6834 19.0976 18.3166 18.7071 18.7071C18.3166 19.0976 17.6834 19.0976 17.2929 18.7071L12 13.4142L6.70711 18.7071C6.31658 19.0976 5.68342 19.0976 5.29289 18.7071C4.90237 18.3166 4.90237 17.6834 5.29289 17.2929L10.5858 12L5.29289 6.70711C4.90237 6.31658 4.90237 5.68342 5.29289 5.29289Z"/>
            </svg>
          </div>
        </div>
        <div className="w-full h-[calc(100vh-150px)] overflow-hidden rounded mb-6 relative">
          <div
            className="w-full h-[calc(100vh-150px)] flex items-center justify-center overflow-hidden bg-gray-50 rounded mb-6 cursor-pointer"
            onClick={() => setShowModal(true)}
          >
            <ImageWithAuth
              src={`${IMAGE_URL}/${meme.fileName}`}
              alt={meme.fileName}
              className="w-full h-full object-contain"
            />
             <Link to={`/meme/${prevMeme.fileName}`} className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors" onClick={linkPropagation}>
              <div className="absolute top-50 left-0 bg-black bg-opacity-50 text-white py-1 rounded" >
                <svg height="50px" width="50px" viewBox="0 0 34 34" fill='currentColor'>
                  <path d="M24.57,34.075c-0.505,0-1.011-0.191-1.396-0.577L8.11,18.432c-0.771-0.771-0.771-2.019,0-2.79 L23.174,0.578c0.771-0.771,2.02-0.771,2.791,0s0.771,2.02,0,2.79l-13.67,13.669l13.67,13.669c0.771,0.771,0.771,2.021,0,2.792 C25.58,33.883,25.075,34.075,24.57,34.075z"/>
                </svg>
              </div>
            </Link>
            <Link to={`/meme/${nextMeme.fileName}`} className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors" onClick={linkPropagation}>
              <div className="absolute top-50 right-0 bg-black bg-opacity-50 text-white py-1 rounded" >
                <svg height="50px" width="50px" viewBox="0 0 34 34" fill='currentColor' className='rotate-180'>
                  <path d="M24.57,34.075c-0.505,0-1.011-0.191-1.396-0.577L8.11,18.432c-0.771-0.771-0.771-2.019,0-2.79 L23.174,0.578c0.771-0.771,2.02-0.771,2.791,0s0.771,2.02,0,2.79l-13.67,13.669l13.67,13.669c0.771,0.771,0.771,2.021,0,2.792 C25.58,33.883,25.075,34.075,24.57,34.075z"/>
                </svg>
              </div>
             </Link>
          </div>
        </div>

        {/* Блок редактирования внизу */}
        <div className="mt-8 border-t pt-6">
          <h2 className="text-lg font-semibold mb-2">Редактировать теги:</h2>
          <div className="mb-4">
            <input
              type="text"
              value={tags}
              onChange={(e) => {
                setTags(e.target.value);
                if (errors.tags) {
                  setErrors(prev => ({ ...prev, tags: '' }));
                }
              }}
              placeholder="теги через запятую *"
              className={`border rounded w-full p-2 ${errors.tags ? 'border-red-500' : ''}`}
              disabled={!hasEditRight}
              required
            />
            {errors.tags && <p className="text-red-500 text-sm mt-1">{errors.tags}</p>}
          </div>
          {hasEditRight ? (
            <div className="mt-4 mb-4">
              <label className="block">Описание: *</label>
              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) {
                    setErrors(prev => ({ ...prev, description: '' }));
                  }
                }}
                className={`w-full p-2 rounded bg-gray-100 ${errors.description ? 'border-red-500' : ''}`}
                rows="10"
                disabled={!hasEditRight}
                required
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
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

          {hasModeratorAccess() && (
            <div className="mt-4 mb-4">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissions === 'public'}
                  onChange={(e) => setPermissions(e.target.checked ? 'public' : 'private')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={!hasEditRight}
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
            {hasEditRight && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Сохранить
              </button>
            )}
            {canDeleteMeme(meme) && (
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