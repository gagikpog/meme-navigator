// migrations/006_add_session_and_user_to_subscribers.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.resolve(__dirname, '../db/memes.db'));

db.serialize(() => {
  db.run(
    `
      ALTER TABLE subscriptions ADD COLUMN session_id INTEGER;
   `,
    (err) => {
      if (err) {
        console.error('Ошибка при добавлении столбцов:', err);
      } else {
        db.run(
          `
          ALTER TABLE subscriptions ADD COLUMN user_id INTEGER;
      `,
          (err) => {
            if (err) {
              console.error('Ошибка при добавлении столбцов:', err);
            } else {
              console.log(
                `✅ Столбцы 'session_id' и 'user_id' успешно добавлены в таблицу 'subscriptions'!`
              );
            }
            closeDatabase();
          }
        );
      }
    }
  );
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
