import React, { useEffect, useState } from 'react';
import { authFetch } from '../utils/authFetch';
const cache = new Map();

const ImageWithAuth = ({ src, alt = '', className = '', style = {} }) => {
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
  }, [src]);

  return blobUrl ? <img src={blobUrl} alt={alt} className={className} style={style} /> : <div style={style} className={className}></div>;
};

export default ImageWithAuth;
