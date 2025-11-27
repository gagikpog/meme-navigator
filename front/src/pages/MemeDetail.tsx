import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMemes } from '../context/MemeContext';
import { useAuth } from '../context/AuthContext';
import { IMAGE_URL } from '../config';
import ImageWithAuth from '../components/ImageWithAuth';
import ImageModal from '../components/ImageModal';
import { useDialog } from '../hooks/useDialog';
import IconModeration from '../icons/Moderation';
import IconWeb from '../icons/Web';
import IconPrivate from '../icons/Private';
import IconClose from '../icons/Close';
import useSmartBack from '../hooks/useSmartBack';
import formatDate from '../utils/formatDate';
import Comments from '../components/Comments';
import Ratings from '../components/Ratings';

const MemeDetail = () => {
  const { memes, refreshMemes } = useMemes();
  const { fileName } = useParams();
  const navigate = useNavigate();
  const smartBack = useSmartBack();
  const { canEditMeme, canDeleteMeme, hasModeratorAccess, authFetch } = useAuth();
  const { Dialog, showModal: showDialog } = useDialog();

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
  const [errors, setErrors] = useState<{ tags?: string; description?: string }>({});

  // Состояние для отслеживания изменений
  const [originalValues, setOriginalValues] = useState({
    tags: '',
    description: '',
    permissions: 'private'
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Scroll to top when opening a meme or navigating between memes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [fileName]);

  useEffect(() => {
    if (meme) {
      const initialTags = meme.tags.join(', ');
      const initialDescription = meme.description;
      const initialPermissions = meme.permissions || 'private';

      setTags(initialTags);
      setDescription(initialDescription);
      setPermissions(initialPermissions);

      // Сохраняем исходные значения
      setOriginalValues({
        tags: initialTags,
        description: initialDescription,
        permissions: initialPermissions
      });

      // Сбрасываем флаг изменений при загрузке нового мема
      setHasUnsavedChanges(false);
    }
  }, [meme]);

  // Отслеживаем изменения в полях
  useEffect(() => {
    const hasChanges =
      tags !== originalValues.tags ||
      description !== originalValues.description ||
      permissions !== originalValues.permissions;

    setHasUnsavedChanges(hasChanges);
  }, [tags, description, permissions, originalValues]);

  // Предупреждение при попытке покинуть страницу с несохраненными изменениями
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'У вас есть несохраненные изменения. Вы уверены, что хотите покинуть страницу?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  if (!meme) return <div>Мем не найден</div>;


  const hasEditRight = canEditMeme(meme);

  const validateForm = () => {
    const newErrors: { tags?: string; description?: string } = {};

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

    if (res.ok) {
      await refreshMemes();
      // Обновляем исходные значения после успешного сохранения
      setOriginalValues({
        tags: tags,
        description: description,
        permissions: permissions
      });
      setHasUnsavedChanges(false);
    }

    setIsSaving(false);
  };

  const handleDelete = async () => {
    let confirmed: string = '';

    if (hasUnsavedChanges) {
      confirmed = await showDialog({
        title: 'Несохраненные изменения',
        description: 'У вас есть несохраненные изменения. Вы уверены, что хотите удалить мем без сохранения?',
        buttons: {
          yes: { text: 'Удалить без сохранения', icon: '🗑️' },
          no: { text: 'Отмена', icon: '🚫' }
        },
        buttonOrder: ['yes', 'no']
      });
    } else {
      confirmed = await showDialog({
        title: 'Удаление мема',
        description: 'Вы уверены, что хотите удалить этот мем? Это действие нельзя отменить.',
        buttons: {
          yes: { text: 'Удалить', icon: '🗑️' },
          no: { text: 'Отмена', icon: '🚫' }
        },
        buttonOrder: ['yes', 'no']
      });
    }

    if (confirmed !== 'yes') return;

    const res = await authFetch(`/api/memes/${meme.id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      await refreshMemes();
      navigate('/');
    }
  };

  const linkPropagation = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
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
          <IconClose onClick={async (e) => {
            if (hasUnsavedChanges) {
              e.preventDefault();
              const confirmed = await showDialog({
                title: 'Несохраненные изменения',
                description: 'У вас есть несохраненные изменения. Вы уверены, что хотите покинуть страницу?',
                buttons: {
                  yes: { text: 'Покинуть', icon: '🚪' },
                  no: { text: 'Остаться', icon: '🏠' }
                },
                buttonOrder: ['yes', 'no']
              });
              if (confirmed === 'yes') {
                smartBack();
              }
            } else {
              smartBack();
            }
          }} />
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
             <Link
               to={`/meme/${prevMeme.fileName}`}
               replace
               className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
               onClick={async (e) => {
                 linkPropagation(e);
                 if (hasUnsavedChanges) {
                   e.preventDefault();
                   const confirmed = await showDialog({
                     title: 'Несохраненные изменения',
                     description: 'У вас есть несохраненные изменения. Вы уверены, что хотите покинуть страницу?',
                     buttons: {
                       yes: { text: 'Покинуть', icon: '🚪' },
                       no: { text: 'Остаться', icon: '🏠' }
                     },
                     buttonOrder: ['yes', 'no']
                   });
                   if (confirmed === 'yes') {
                     navigate(`/meme/${prevMeme.fileName}`);
                   }
                 }
               }}
             >
              <div className="absolute top-50 left-0 bg-black bg-opacity-50 text-white py-1 rounded" >
                <svg height="50px" width="50px" viewBox="0 0 34 34" fill='currentColor'>
                  <path d="M24.57,34.075c-0.505,0-1.011-0.191-1.396-0.577L8.11,18.432c-0.771-0.771-0.771-2.019,0-2.79 L23.174,0.578c0.771-0.771,2.02-0.771,2.791,0s0.771,2.02,0,2.79l-13.67,13.669l13.67,13.669c0.771,0.771,0.771,2.021,0,2.792 C25.58,33.883,25.075,34.075,24.57,34.075z"/>
                </svg>
              </div>
            </Link>
            <Link
              to={`/meme/${nextMeme.fileName}`}
              replace
              className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
              onClick={async (e) => {
                linkPropagation(e);
                if (hasUnsavedChanges) {
                  e.preventDefault();
                  const confirmed = await showDialog({
                    title: 'Несохраненные изменения',
                    description: 'У вас есть несохраненные изменения. Вы уверены, что хотите покинуть страницу?',
                    buttons: {
                      yes: { text: 'Покинуть', icon: '🚪' },
                      no: { text: 'Остаться', icon: '🏠' }
                    },
                    buttonOrder: ['yes', 'no']
                  });
                  if (confirmed === 'yes') {
                    navigate(`/meme/${nextMeme.fileName}`);
                  }
                }
              }}
            >
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
          <div className='text-xs text-gray-400 mb-2'>
            Добавил {meme.authorName} {meme.authorSurname} {formatDate(meme.created_at)}
          </div>
          {meme?.id && <Ratings memeId={meme.id} />}
          {meme?.id && <Comments memeId={meme.id} />}
          <h2 className="text-lg font-semibold mb-2">Теги:</h2>
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
                rows={10}
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
              {permissions === 'moderate' ? (
                <div className='flex items-baseline'>
                  <span className="text-green-600"><IconModeration size={20}/></span>
                  <button onClick={() => setPermissions('public')} className="bg-green-600 text-white px-2 py-1 ml-2 rounded hover:bg-green-700" >
                    Опубликовать
                  </button>
                  <button onClick={() => setPermissions('private')} className="bg-red-600 text-white px-2 py-1 ml-2 rounded hover:bg-red-700" >
                    Отклонить
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions === 'public'}
                    onChange={(e) => setPermissions(e.target.checked ? 'public' : 'private')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={!hasEditRight}
                  />
                 {permissions === "public" ? (
                    <>
                      <span className="text-green-600"><IconWeb size={20}/></span>
                      Опубликован
                    </>
                  ) : (
                    <>
                      <span className="text-red-600"><IconPrivate size={20}/></span>
                      Не опубликован
                    </>
                  )}
                </label>
              )
              }
              <p className="text-xs text-gray-500 mt-1">
                {permissions === 'public' ? 'Мем доступен всем пользователям' : permissions === 'private' ? 'Мем доступен только администраторам' : 'Мем находится на рассмотрении'}
              </p>
            </div>
          )}

          <div className="flex gap-4">
            {hasEditRight && (
              <button
                onClick={handleSave}
                disabled={isSaving || !hasUnsavedChanges}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <span>💾</span>
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
      <Dialog />
    </>
  );
};

export default MemeDetail;