// migrations/add_created_at_to_memes.js
import sqlite3 from 'sqlite3';
import path from 'path';
const sqlite = sqlite3.verbose();
const db = new sqlite.Database(path.resolve(__dirname, '../../memes.db'));

db.serialize(() => {
  console.log('Начинаем пересоздание таблицы memes...');

  // 1️⃣ Переименовываем старую таблицу
  db.run(`ALTER TABLE memes RENAME TO memes_old;`, (err) => {
    if (err) {
      console.error("Ошибка при переименовании таблицы:", err);
      closeDatabase();
      return;
    }

    // 2️⃣ Создаём новую таблицу с нужной структурой
    db.run(`
      CREATE TABLE memes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fileName TEXT NOT NULL,
        tags TEXT,
        description TEXT,
        permissions TEXT DEFAULT 'private',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `, (err) => {
      if (err) {
        console.error("Ошибка при создании новой таблицы:", err);
        closeDatabase();
        return;
      }

      // 3️⃣ Переносим данные (без created_at из старой таблицы)
      db.run(`
        INSERT INTO memes (id, fileName, tags, description, permissions, created_at)
        SELECT id, fileName, tags, description,
               COALESCE(permissions, 'private'),
               CURRENT_TIMESTAMP
        FROM memes_old;
      `, (err) => {
        if (err) {
          console.error("Ошибка при переносе данных:", err);
          closeDatabase();
          return;
        }

        // 4️⃣ Удаляем старую таблицу
        db.run(`DROP TABLE memes_old;`, (err) => {
          if (err) {
            console.error("Ошибка при удалении старой таблицы:", err);
          } else {
            console.log("✅ Таблица 'memes' успешно пересоздана с нужной структурой!");
          }
          closeDatabase();
        });
      });
    });
  });
});

function closeDatabase() {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Migration 005 completed successfully');
    }
  });
}
