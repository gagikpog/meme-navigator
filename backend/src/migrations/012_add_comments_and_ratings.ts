import sqlite3 from 'sqlite3';
import path from 'path';

const sqlite = sqlite3.verbose();
const db = new sqlite.Database(path.resolve(__dirname, '../../memes.db'));

console.log('🚀 Начинаем миграцию: добавление таблиц комментариев и оценок');

db.serialize(() => {
    db.run('PRAGMA foreign_keys = ON;', (err) => {
        if (err) {
            console.error('Error enabling foreign keys:', err.message);
            return;
        }

        // Создаем таблицу комментариев
        db.run(
            `
            CREATE TABLE IF NOT EXISTS comments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                meme_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                text TEXT NOT NULL,
                parent_id INTEGER,
                is_deleted INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (meme_id) REFERENCES memes(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
            )
        `,
            (err) => {
                if (err) {
                    console.error('Error creating comments table:', err.message);
                    return;
                }
                console.log('✅ Таблица comments создана');

                // Создаем индексы для комментариев
                const commentIndexes = [
                    ['idx_comments_meme_id', 'comments (meme_id)'],
                    ['idx_comments_user_id', 'comments (user_id)'],
                    ['idx_comments_created_at', 'comments (created_at)'],
                    ['idx_comments_parent_id', 'comments (parent_id)'],
                    ['idx_comments_is_deleted', 'comments (is_deleted)']
                ];

                let indexesCreated = 0;
                const checkIndexesComplete = () => {
                    indexesCreated++;
                    if (indexesCreated === commentIndexes.length) {
                        console.log('✅ Все индексы для comments созданы');
                        createRatingsTable();
                    }
                };

                commentIndexes.forEach(([indexName, indexColumns]) => {
                    db.run(
                        `CREATE INDEX IF NOT EXISTS ${indexName} ON ${indexColumns};`,
                        (err) => {
                            if (err) {
                                console.error(`Error creating index ${indexName}:`, err.message);
                            }
                            checkIndexesComplete();
                        }
                    );
                });
            }
        );

        const createRatingsTable = () => {
            // Создаем таблицу оценок
            db.run(
                `
                CREATE TABLE IF NOT EXISTS ratings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    meme_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    rating INTEGER NOT NULL DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(meme_id, user_id),
                    FOREIGN KEY (meme_id) REFERENCES memes(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    CHECK (rating IN (-5, 0, 5))
                )
            `,
                (err) => {
                    if (err) {
                        console.error('Error creating ratings table:', err.message);
                        return;
                    }
                    console.log('✅ Таблица ratings создана');

                    // Создаем индексы для оценок
                    const ratingIndexes = [
                        ['idx_ratings_meme_id', 'ratings (meme_id)'],
                        ['idx_ratings_user_id', 'ratings (user_id)'],
                        ['idx_ratings_meme_user', 'ratings (meme_id, user_id)']
                    ];

                    let ratingIndexesCreated = 0;
                    const checkRatingIndexesComplete = () => {
                        ratingIndexesCreated++;
                        if (ratingIndexesCreated === ratingIndexes.length) {
                            console.log('✅ Все индексы для ratings созданы');
                            closeDatabase();
                        }
                    };

                    ratingIndexes.forEach(([indexName, indexColumns]) => {
                        db.run(
                            `CREATE INDEX IF NOT EXISTS ${indexName} ON ${indexColumns};`,
                            (err) => {
                                if (err) {
                                    console.error(`Error creating index ${indexName}:`, err.message);
                                }
                                checkRatingIndexesComplete();
                            }
                        );
                    });
                }
            );
        };

        const closeDatabase = () => {
            // Закрываем базу данных
            db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err.message);
                } else {
                    console.log('🎉 Миграция 012 успешно завершена!');
                }
            });
        };
    });
});
