import React, { useEffect, useState } from 'react';
import { authFetch } from '../utils/authFetch';
const cache = new Map();

const ImageWithAuth = ({ src, alt = '', className = '', style = {}, fallback }) => {
  const [blobUrl, setBlobUrl] = useState(null);

  const [loadError, setLoadError ]= useState(false);

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
        setLoadError(false);
        cache.set(src, url);
      } catch (err) {
        console.error('Ошибка загрузки изображения:', err);
      }
    };

    if (!src) {
      setLoadError(true);
      return;
    }

    loadImage();
  }, [src]);

  if (loadError && fallback) {
    return fallback;
  }

  return blobUrl ? <img src={blobUrl} alt={alt} className={className} style={style} /> : <div style={style} className={className}></div>;
};

export default ImageWithAuth;
