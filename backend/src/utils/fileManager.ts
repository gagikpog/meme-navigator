import fs from 'fs';
import path from 'path';

const IMAGE_DIR = path.join(__dirname, '../public/images');

function deleteImage(fileName: string): void {
  if (!fileName) return;
  const filePath = path.join(IMAGE_DIR, fileName);
  fs.unlink(filePath, (err) => {
    if (err && err.code !== 'ENOENT') {
      console.error('Ошибка при удалении файла:', err);
    }
  });
}

export { deleteImage };

