const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.resolve(__dirname, 'memes.db'));

db.serialize(() => {
  // Включаем поддержку внешних ключей
  db.run('PRAGMA foreign_keys = ON;');

  // Таблица пользователей
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_blocked INTEGER DEFAULT 0,
      last_login DATETIME,
      name TEXT,
      surname TEXT,
      avatar TEXT
    )
  `);

  // Таблица мемов (теперь с user_id)
  db.run(`
    CREATE TABLE IF NOT EXISTS memes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fileName TEXT NOT NULL,
      tags TEXT,
      description TEXT,
      permissions TEXT DEFAULT 'private',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      user_id INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Таблица сессий
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

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_user_sessions_device_id
    ON user_sessions (device_id)
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active
    ON user_sessions (user_id, is_active)
  `);

  // Таблица подписок (теперь с внешними ключами)
  db.run(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      endpoint TEXT UNIQUE,
      keys_p256dh TEXT,
      keys_auth TEXT,
      session_id INTEGER,
      user_id INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (session_id) REFERENCES user_sessions(id) ON DELETE CASCADE
    )
  `);
});

module.exports = db;
