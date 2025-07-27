import React, { useEffect, useState } from 'react';
import { authFetch } from '../utils/authFetch';
const cache = new Map();

const ImageWithAuth = ({ src, alt = '', className = '' }) => {
  const [blobUrl, setBlobUrl] = useState(null);

  useEffect(() => {
    const loadImage = async () => {
      try {
        if (cache.get(src)) {
          setBlobUrl(cache.get(src));
          return;
        }

        const res = await authFetch(src);
        if (!res.ok) throw new Error('Ошибка загрузки изображения');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        cache.set(src, url);
      } catch (err) {
        console.error('Ошибка загрузки изображения:', err);
      }
    };

    loadImage();

    // Очистка
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [src]);

  return blobUrl ? <img src={blobUrl} alt={alt} className={className} /> : <div>Загрузка...</div>;
};

export default ImageWithAuth;
