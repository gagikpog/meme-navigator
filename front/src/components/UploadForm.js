import React, { useState } from 'react';
import { useMemes } from '../context/MemeContext';
import { authFetch } from '../utils/authFetch';

const UploadForm = ({ onUpload }) => {
  const [file, setFile] = useState(null);
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState('');
  const { refreshMemes } = useMemes();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setStatus('Выберите изображение');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('tags', JSON.stringify(tags.split(',').map(tag => tag.trim()).filter(Boolean)));

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
        setTags('');
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

  return (
    <form onSubmit={handleSubmit} className="border p-4 rounded mb-6">
      <h2 className="text-xl font-semibold mb-2">Загрузить новый мем</h2>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files[0])}
        className="mb-2 block"
      />

      <input
        type="text"
        placeholder="теги через запятую (funny, cat)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        className="border p-2 w-full mb-2 rounded"
      />

      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
        Загрузить
      </button>

      {status && <p className="mt-2 text-sm text-gray-600">{status}</p>}
    </form>
  );
};

export default UploadForm;
