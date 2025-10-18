// migrations/009.1_update_files_date.js
import sqlite3 from 'sqlite3';
import path from 'path';

const sqlite = sqlite3.verbose();
const db = new sqlite.Database(path.resolve(__dirname, '../../memes.db'));

db.serialize(async () => {
    try {
        for (const item of getData()) {
            await run(item);
        }
    } catch (error) {
        console.error(error);
    } finally {
        closeDatabase();
    }
});

function run(item: { date: string; file: string }) {
    const query = `UPDATE memes SET created_at = '${item.date}' WHERE fileName = '${item.file}';`;
    return new Promise((resolve, reject) => {
        db.run(query, function (err) {
            if (!this.changes) {
                console.log(`No rows updated for file: ${item.file}`);
            }
            if (err) {
                reject('Ошибка при обновлении: ' + query + ' ' + err.message);
            } else {
                resolve(true);
            }
        });
    });
}

function closeDatabase() {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Migration 009.1 completed successfully');
        }
    });
}

function getData() {
    return [
        {
            date: '2021-04-21 04:25:00',
            file: '1753613812498-photo_2023-03-23_14-31-31.jpg',
        },
        {
            date: '2019-11-27 09:43:00',
            file: '1753613045523-ÐÐ°ÐºÐ¾Ð¹ ÑÑ ÑÐµÐ³Ð¾Ð´Ð½Ñ ÐÐ°Ð³Ð¸Ðº.jpg',
        },
        {
            date: '2019-11-27 15:51:00',
            file: '1753613779049-photo_2023-09-26_10-38-16.jpg',
        },
    ];
}
