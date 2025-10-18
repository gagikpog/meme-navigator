/**
 * Полная миграция структуры с добавлением всех внешних ключей
 * Исправлено выполнение — теперь все шаги строго последовательны.
 */

import sqlite3 from 'sqlite3';
import path from 'path';

const sqlite = sqlite3.verbose();
const db = new sqlite.Database(path.resolve(__dirname, '../../memes.db'));

console.log('🚀 Начинаем полную миграцию структуры БД');

db.serialize(() => {
  db.run('PRAGMA foreign_keys = OFF;', (err) => {
    if (err) throw err;

    db.get(`SELECT id FROM users WHERE username = 'gagikpog'`, (err, admin: {id: number}) => {
      if (err) throw err;

      if (!admin) {
        console.error('⚠️ Пользователь gagikpog не найден, завершаем миграцию...');
        return;
      } else {
        migrateAll(admin.id);
      }
    });
  });
});

function migrateAll(adminId: number) {
  console.log(`👤 Администратор найден: ID=${adminId}`);

  migrateMemes(adminId, () => {
    migrateUserSessions(() => {
      migrateSubscriptions(() => {
        db.run('PRAGMA foreign_keys = ON;', (err) => {
          if (err) throw err;
          console.log('🔗 Внешние ключи снова включены');
          console.log('🎉 Миграция успешно завершена!');
        });
      });
    });
  });
}

function migrateMemes(adminId: number, next: Function) {
  console.log('➡️ Миграция таблицы memes...');
  db.run(`ALTER TABLE memes RENAME TO memes_old;`, (err) => {
    if (err) throw err;

    db.run(`
      CREATE TABLE memes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fileName TEXT NOT NULL,
        tags TEXT,
        description TEXT,
        permissions TEXT DEFAULT 'private',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_id INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `, (err) => {
      if (err) throw err;

      db.run(`
        INSERT INTO memes (id, fileName, tags, description, permissions, created_at, user_id)
        SELECT id, fileName, tags, description, permissions, created_at, ${adminId}
        FROM memes_old;
      `, (err) => {
        if (err) throw err;

        db.run(`DROP TABLE memes_old;`, (err) => {
          if (err) throw err;

          db.run(`CREATE INDEX IF NOT EXISTS idx_memes_user_id ON memes (user_id);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_memes_created_at ON memes (created_at);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_memes_permissions ON memes (permissions);`);
          console.log('✅ Таблица memes успешно обновлена');
          next();
        });
      });
    });
  });
}

function migrateUserSessions(next: Function) {
  console.log('➡️ Миграция таблицы user_sessions...');
  db.run(`ALTER TABLE user_sessions RENAME TO user_sessions_old;`, (err) => {
    if (err) throw err;

    db.run(`
      CREATE TABLE user_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        device_id TEXT NOT NULL,
        device_info TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `, (err) => {
      if (err) throw err;

      db.run(`
        INSERT INTO user_sessions (id, user_id, device_id, device_info, ip_address, user_agent, created_at, last_activity, is_active)
        SELECT id, user_id, device_id, device_info, ip_address, user_agent, created_at, last_activity, is_active
        FROM user_sessions_old;
      `, (err) => {
        if (err) throw err;

        db.run(`DROP TABLE user_sessions_old;`, (err) => {
          if (err) throw err;

          db.run(`CREATE INDEX IF NOT EXISTS idx_user_sessions_device_id ON user_sessions (device_id);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active ON user_sessions (user_id, is_active);`);
          console.log('✅ Таблица user_sessions успешно обновлена');
          next();
        });
      });
    });
  });
}

function migrateSubscriptions(next: Function) {
  console.log('➡️ Миграция таблицы subscriptions...');
  db.run(`ALTER TABLE subscriptions RENAME TO subscriptions_old;`, (err) => {
    if (err) throw err;

    db.run(`
      CREATE TABLE subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        endpoint TEXT UNIQUE,
        keys_p256dh TEXT,
        keys_auth TEXT,
        session_id INTEGER,
        user_id INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (session_id) REFERENCES user_sessions(id) ON DELETE CASCADE
      );
    `, (err) => {
      if (err) throw err;

      db.run(`
        INSERT INTO subscriptions (id, endpoint, keys_p256dh, keys_auth, session_id, user_id)
        SELECT id, endpoint, keys_p256dh, keys_auth, session_id, user_id
        FROM subscriptions_old;
      `, (err) => {
        if (err) throw err;

        db.run(`DROP TABLE subscriptions_old;`, (err) => {
          if (err) throw err;
          console.log('✅ Таблица subscriptions успешно обновлена');
          next();
        });
      });
    });
  });
}
