const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.resolve(__dirname, '../db/memes.db'));

db.serialize(() => {
  // Создаем копию таблицы мемов
  db.run(`
    CREATE TABLE newMemes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fileName TEXT NOT NULL,
      tags TEXT,
      description TEXT,
      permissions TEXT DEFAULT 'private')
  `);

  // Переносим все данные
  db.run(`
    INSERT INTO newMemes (id, fileName, tags, description, permissions)
    SELECT id, fileName, tags, description, permissions
    FROM memes;
  `, (err) => {
    if (err) {
      console.error('Error to move data:', err.message);
    }
  });

  // Конвертируем колону permissions, меняем admin на private
  db.run(`
    UPDATE newMemes SET permissions = 'private' WHERE permissions = 'admin'
  `, (err) => {
    if (err) {
      console.error('Error convert permissions data:', err.message);
    }
  });

  // Удаляем старую таблицу мемов
  db.run(`
    DROP TABLE memes
  `, (err) => {
    if (err) {
      console.error('Error to remove memes table:', err.message);
    }
  });

  // Переименовываем таблицу мемов
  db.run(`
    ALTER TABLE newMemes RENAME TO memes;
  `, (err) => {
    if (err) {
      console.error('Error to rename memes table:', err.message);
    }
  });

});

db.close((err) => {
  if (err) {
    console.error('Error closing database:', err.message);
  } else {
    console.log('Migration 003 change meme column values');
  }
});
