// migrations/008_add_user_personal_data.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const db = new sqlite3.Database(path.resolve(__dirname, "../db/memes.db"));

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

function run(query) {
  return new Promise((resolve, reject) => {
    db.run(query, (err) => {
      if (err) {
        reject("Ошибка при добавлении столбца: " + query + " " + err.message);
      } else {
        resolve();
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
