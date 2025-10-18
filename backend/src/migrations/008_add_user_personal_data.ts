// migrations/008_add_user_personal_data.js
import sqlite3 from 'sqlite3';
import path from 'path';
const sqlite = sqlite3.verbose();
const db = new sqlite.Database(path.resolve(__dirname, "../../memes.db"));

// / Миграция: добавление персональных данных пользователей
db.serialize(async () => {
  try {
    await run(`ALTER TABLE users ADD COLUMN name TEXT;`);
    await run(`ALTER TABLE users ADD COLUMN surname TEXT;`);
    await run(`ALTER TABLE users ADD COLUMN avatar TEXT;`);
  } catch (error) {
    console.error(error);
  } finally {
    closeDatabase();
  }
});

function run(query: string) {
  return new Promise((resolve, reject) => {
    db.run(query, (err) => {
      if (err) {
        reject("Ошибка при добавлении столбца: " + query + " " + err.message);
      } else {
        resolve(true);
      }
    });
  });
}

function closeDatabase() {
  db.close((err) => {
    if (err) {
      console.error("Error closing database:", err.message);
    } else {
      console.log("Migration 007 completed successfully");
    }
  });
}
