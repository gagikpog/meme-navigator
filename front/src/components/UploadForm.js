import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useMemes } from '../context/MemeContext';
import { authFetch } from '../utils/authFetch';
import { useAuth } from '../context/AuthContext';
import IconWeb from '../icons/Web';
import IconPrivate from '../icons/Private';

const UploadForm = ({ onUpload }) => {
  const [file, setFile] = useState(null);
  const [tags, setTags] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState('private');
  const [status, setStatus] = useState('');
  const [errors, setErrors] = useState({});
  const { refreshMemes } = useMemes();
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const pasteAreaRef = useRef(null);
  const fileInputRef = useRef(null);

  const { hasModeratorAccess } = useAuth();

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

  const revokePreviewUrl = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  }, [previewUrl]);

  const setFileWithPreview = useCallback(async (newFile) => {
    if (!newFile) return;
    revokePreviewUrl();
    setStatus('Обработка изображения...');
    const compressIfNeededInline = async (inputFile) => {
      try {
        const originalSize = inputFile.size;
        const blob = inputFile instanceof Blob ? inputFile : new Blob([inputFile], { type: inputFile.type || 'image/*' });
        const imageBitmap = await createImageBitmap(blob);
        const maxSizePx = 1920;
        const quality = 0.85;
        const targetMime = inputFile.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const srcWidth = imageBitmap.width;
        const srcHeight = imageBitmap.height;
        const scale = Math.min(1, maxSizePx / Math.max(srcWidth, srcHeight));
        const targetWidth = Math.max(1, Math.round(srcWidth * scale));
        const targetHeight = Math.max(1, Math.round(srcHeight * scale));

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);

        const compressedBlob = await new Promise((resolve) => canvas.toBlob(resolve, targetMime, quality));
        if (!compressedBlob) {
          return { file: inputFile, originalSize, finalSize: inputFile.size };
        }
        const finalBlob = compressedBlob.size < originalSize ? compressedBlob : inputFile;
        const finalFile = finalBlob instanceof File ? finalBlob : new File([finalBlob], inputFile.name.replace(/\.(png|jpe?g|webp|gif)$/i, '') + (targetMime === 'image/png' ? '.png' : '.jpg'), { type: targetMime });
        return { file: finalFile, originalSize, finalSize: finalFile.size };
      } catch (e) {
        return { file: inputFile, originalSize: inputFile.size, finalSize: inputFile.size };
      }
    };

    const { file: maybeCompressed, originalSize, finalSize } = await compressIfNeededInline(newFile);
    setFile(maybeCompressed);
    const url = URL.createObjectURL(maybeCompressed);
    setPreviewUrl(url);
    if (finalSize < originalSize) {
      const kb = (n) => Math.round(n / 1024);
      setStatus(`Сжато: ${kb(originalSize)}KB → ${kb(finalSize)}KB`);
    } else {
      setStatus('Изображение готово к загрузке');
    }
  }, [revokePreviewUrl]);

  useEffect(() => {
    return () => {
      revokePreviewUrl();
    };
  }, [revokePreviewUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setStatus('Пожалуйста, заполните все обязательные поля (теги и описание)');
      return;
    }

    if (!file) {
      setStatus('Выберите изображение');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('tags', JSON.stringify(tags.split(',').map(tag => tag.trim()).filter(Boolean)));
    formData.append('description', description);
    formData.append('permissions', permissions);

    if (file.size > 10 * 1024 * 1024) {
      alert("Слишком большой файл. Максимум — 10MB");
      return;
    }

    try {
      const res = await authFetch('/api/memes', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setStatus('✅ Загружено!');
        setFile(null);
        revokePreviewUrl();
        setPreviewUrl(null);
        setTags('');
        setDescription('');
        setPermissions('private');
        await refreshMemes();
        onUpload?.(data); // обновить родителя при необходимости
      } else {
        setStatus('❌ Ошибка загрузки');
      }
    } catch (err) {
      console.error(err);
      setStatus('❌ Сетевая ошибка');
    }
  };

  const handleFileInputChange = (e) => {
    const selected = e.target.files && e.target.files[0];
    if (selected) {
      setFileWithPreview(selected);
    }
  };

  const handlePaste = useCallback((e) => {
    if (!e.clipboardData) return;
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const blob = item.getAsFile();
        if (blob && blob.type.startsWith('image/')) {
          const pastedFile = new File([blob], 'pasted-image.png', { type: blob.type });
          setFileWithPreview(pastedFile);
          setStatus('Изображение вставлено из буфера');
          e.preventDefault();
          return;
        }
      }
    }
  }, [setFileWithPreview]);

  useEffect(() => {
    const node = pasteAreaRef.current;
    if (!node) return;
    node.addEventListener('paste', handlePaste);
    return () => node.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const clearImage = () => {
    setFile(null);
    revokePreviewUrl();
    setPreviewUrl(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const droppedFiles = e.dataTransfer?.files;
    if (droppedFiles && droppedFiles.length > 0) {
      const first = droppedFiles[0];
      if (first.type && first.type.startsWith('image/')) {
        setFileWithPreview(first);
        setStatus('Изображение добавлено перетаскиванием');
      } else {
        setStatus('Пожалуйста, перетащите файл изображения');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border p-4 rounded mb-6">
      <h2 className="text-xl font-semibold mb-2">Загрузить новый мем</h2>

      <div
        ref={pasteAreaRef}
        className={`mb-3 border-2 rounded-xl p-6 min-h-[160px] flex flex-col justify-center transition-colors ${
          isDragOver
            ? "border-blue-400 bg-blue-50"
            : "border-dashed border-gray-300"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />
        <div className="flex items-center gap-3 mb-2 flex-wrap justify-center text-center">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-md border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <span>📁</span>
            <span className="w-40 text-left truncate">
              {previewUrl ? "Заменить изображение" : "Выбрать изображение"}
            </span>
          </button>
          {previewUrl && (
            <button
              type="button"
              onClick={clearImage}
              className="inline-flex items-center gap-2 h-10 px-3 rounded-md border border-transparent text-gray-600 hover:bg-gray-100"
            >
              <span>✖</span>
              <span>Сбросить</span>
            </button>
          )}
          <span className="text-xs text-gray-500">
            или перетащите файл сюда, либо вставьте (Ctrl/Cmd+V)
          </span>
        </div>
      </div>

      {previewUrl && (
        <div className="mb-3">
          <img
            src={previewUrl}
            alt="preview"
            className="max-h-64 rounded border mb-2"
          />
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Теги: <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="теги через запятую (funny, cat)"
          value={tags}
          onChange={(e) => {
            setTags(e.target.value);
            if (errors.tags) {
              setErrors(prev => ({ ...prev, tags: '' }));
            }
          }}
          className={`border rounded w-full p-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.tags ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'}`}
        />
        {errors.tags && <p className="text-red-500 text-sm mt-1 flex items-center gap-1 animate-fadeIn">{errors.tags}</p>}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Описание: <span className="text-red-500">*</span>
        </label>
        <textarea
          placeholder="Описание мема"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (errors.description) {
              setErrors(prev => ({ ...prev, description: '' }));
            }
          }}
          className={`border rounded w-full p-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.description ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'}`}
          rows="3"
        />
        {errors.description && <p className="text-red-500 text-sm mt-1 flex items-center gap-1 animate-fadeIn">{errors.description}</p>}
      </div>
      {hasModeratorAccess() && (
        <div className="mb-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={permissions === "public"}
              onChange={(e) =>
                setPermissions(e.target.checked ? "public" : "private")
              }
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            {permissions === "public" ? (
              <span className="text-green-600"><IconWeb size={20}/></span>
            ) : (
              <span className="text-red-600"><IconPrivate size={20}/></span>
            )}
            Публичная
          </label>
          <p className="text-xs text-gray-500 mt-1">
            {permissions === "public"
              ? "Мем будет доступен всем пользователям"
              : "Мем будет доступен только администраторам"}
          </p>
        </div>
      )}
      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Загрузить
      </button>

      {status && <p className="mt-2 text-sm text-gray-600">{status}</p>}
    </form>
  );
};

export default UploadForm;
