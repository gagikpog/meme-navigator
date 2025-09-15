const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.resolve(__dirname, '../db/memes.db'));

db.serialize(() => {
  // Добавляем поля для управления пользователями
  db.run(`
    ALTER TABLE users ADD COLUMN is_blocked INTEGER DEFAULT 0
  `, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding is_blocked column:', err.message);
    }
  });

  db.run(`
    ALTER TABLE users ADD COLUMN last_login DATETIME
  `, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding last_login column:', err.message);
    }
  });

  // Создаем таблицу для отслеживания сессий устройств
  db.run(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      device_id TEXT NOT NULL,
      device_info TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Создаем индекс для быстрого поиска по device_id
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_user_sessions_device_id
    ON user_sessions (device_id)
  `);

  // Создаем индекс для поиска активных сессий пользователя
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active
    ON user_sessions (user_id, is_active)
  `);
});

db.close((err) => {
  if (err) {
    console.error('Error closing database:', err.message);
  } else {
    console.log('Migration 004 completed successfully');
  }
});

