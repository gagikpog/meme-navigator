import React, { useEffect, useState } from 'react';
import { authFetch } from '../utils/authFetch';

const ImageWithAuth = ({ src, alt = '', className = '' }) => {
  const [blobUrl, setBlobUrl] = useState(null);

  useEffect(() => {
    const loadImage = async () => {
      try {
        const res = await authFetch(src);
        if (!res.ok) throw new Error('Ошибка загрузки изображения');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
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
