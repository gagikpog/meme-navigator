const fs = require('fs');
const path = require('path');

const IMAGE_DIR = path.join(__dirname, '../public/images');

function deleteImage(fileName) {
  if (!fileName) return;
  const filePath = path.join(IMAGE_DIR, fileName);
  fs.unlink(filePath, (err) => {
    if (err && err.code !== 'ENOENT') {
      console.error('Ошибка при удалении файла:', err);
    }
  });
}

module.exports = { deleteImage };
