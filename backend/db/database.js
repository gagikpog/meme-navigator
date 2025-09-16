const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.resolve(__dirname, 'memes.db'));

// Improve concurrency and reliability for read-after-write patterns
try {
  // Wait up to 5s if the database is busy (e.g., another write in progress)
  // Node-sqlite3 supports this via configure; fallback to PRAGMA if needed
  if (typeof db.configure === 'function') {
    db.configure('busyTimeout', 5000);
  }
  db.exec(`
    PRAGMA journal_mode=WAL;
    PRAGMA synchronous=NORMAL;
    PRAGMA foreign_keys=ON;
    PRAGMA busy_timeout=5000;
  `);
} catch (e) {
  // Non-fatal; continue with defaults
}

db.serialize(() => {
  // Создаем таблицу пользователей
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_blocked INTEGER DEFAULT 0,
      last_login DATETIME
    )
  `);

  // Создаем таблицу мемов с правами доступа
  db.run(`
    CREATE TABLE IF NOT EXISTS memes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fileName TEXT NOT NULL,
      tags TEXT,
      description TEXT,
      permissions TEXT DEFAULT 'private')
  `);

  // Таблица сессий пользователей (как в миграции 004)
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

  // Индексы для user_sessions
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_user_sessions_device_id
    ON user_sessions (device_id)
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active
    ON user_sessions (user_id, is_active)
  `);
});

module.exports = db;
