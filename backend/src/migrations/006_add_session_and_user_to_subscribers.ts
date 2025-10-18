// migrations/006_add_session_and_user_to_subscribers.js
import sqlite3 from 'sqlite3';
import path from 'path';

const sqlite = sqlite3.verbose();

const db = new sqlite.Database(path.resolve(__dirname, '../../memes.db'));

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
            console.log('Migration 006 completed successfully');
        }
    });
}
