import sqlite3 from 'sqlite3';
import path from 'path';
const sqlite = sqlite3.verbose();
const db = new sqlite.Database(path.resolve(__dirname, '../../memes.db'));

db.serialize(() => {
    // Создаем таблицу пользователей
    db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    // Добавляем колонку permissions в таблицу memes
    db.run(
        `
    ALTER TABLE memes ADD COLUMN permissions TEXT DEFAULT 'admin'
  `,
        (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error adding permissions column:', err.message);
            }
        }
    );

    // Добавляем колонку user_id в таблицу memes для связи с пользователем
    db.run(
        `
    ALTER TABLE memes ADD COLUMN user_id INTEGER
  `,
        (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error adding user_id column:', err.message);
            }
        }
    );
});

db.close((err) => {
    if (err) {
        console.error('Error closing database:', err.message);
    } else {
        console.log('Migration 002 completed successfully');
    }
});
