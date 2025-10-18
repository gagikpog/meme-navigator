// migrations/007_clear_subscriptions_table.js
import sqlite3 from 'sqlite3';
import path from 'path';
const sqlite = sqlite3.verbose();
const db = new sqlite.Database(path.resolve(__dirname, '../../memes.db'));

// / Миграция: очистка таблицы subscriptions
db.serialize(() => {
    // Удаляем все строки
    db.run(`DELETE FROM subscriptions`, function (err) {
        if (err) {
            return console.error('Ошибка при очистке таблицы subscriptions:', err.message);
        }
        console.log(`Таблица subscriptions очищена, удалено ${this.changes} записей.`);
    });

    // Сбрасываем счетчик AUTOINCREMENT (если есть INTEGER PRIMARY KEY AUTOINCREMENT)
    db.run(`DELETE FROM sqlite_sequence WHERE name='subscriptions'`, function (err) {
        if (err) {
            return console.error('Ошибка при сбросе счетчика AUTOINCREMENT:', err.message);
        }
        console.log('Счетчик AUTOINCREMENT для таблицы subscriptions сброшен.');
        closeDatabase();
    });
});

function closeDatabase() {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Migration 007 completed successfully');
        }
    });
}
