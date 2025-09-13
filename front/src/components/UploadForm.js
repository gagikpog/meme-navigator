import React, { useState } from 'react';
import { useMemes } from '../context/MemeContext';
import { authFetch } from '../utils/authFetch';

const UploadForm = ({ onUpload }) => {
  const [file, setFile] = useState(null);
  const [tags, setTags] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState('admin');
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
        setTags('');
        setDescription('');
        setPermissions('admin');
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

      <textarea
        placeholder="Описание мема"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="border p-2 w-full mb-2 rounded"
        rows="3"
      />

      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Права доступа:
        </label>
        <select
          value={permissions}
          onChange={(e) => setPermissions(e.target.value)}
          className="border p-2 w-full rounded"
        >
          <option value="admin">Только для администраторов</option>
          <option value="public">Публичный (для всех)</option>
        </select>
      </div>

      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
        Загрузить
      </button>

      {status && <p className="mt-2 text-sm text-gray-600">{status}</p>}
    </form>
  );
};

export default UploadForm;
