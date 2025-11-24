import sqlite3 from 'sqlite3';
import path from 'path';

const sqlite = sqlite3.verbose();
const db = new sqlite.Database(path.resolve(__dirname, '../../memes.db'));

db.serialize(() => {
    // Включаем поддержку внешних ключей
    db.run('PRAGMA foreign_keys = ON;', (err) => {
        if (err) {
            console.error('Error enabling foreign keys:', err.message);
            return;
        }

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
        `, (err) => {
            if (err) {
                console.error('Error creating users table:', err.message);
                return;
            }
            console.log('✅ Таблица users создана');
        });

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
        `, (err) => {
            if (err) {
                console.error('Error creating memes table:', err.message);
                return;
            }
            console.log('✅ Таблица memes создана');
        });

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
        `, (err) => {
            if (err) {
                console.error('Error creating user_sessions table:', err.message);
                return;
            }
            console.log('✅ Таблица user_sessions создана');
        });

        // Индексы для таблицы сессий
        db.run(`
            CREATE INDEX IF NOT EXISTS idx_user_sessions_device_id
            ON user_sessions (device_id)
        `, (err) => {
            if (err) {
                console.error('Error creating idx_user_sessions_device_id:', err.message);
            }
        });

        db.run(`
            CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active
            ON user_sessions (user_id, is_active)
        `, (err) => {
            if (err) {
                console.error('Error creating idx_user_sessions_user_active:', err.message);
            }
        });

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
        `, (err) => {
            if (err) {
                console.error('Error creating subscriptions table:', err.message);
                return;
            }
            console.log('✅ Таблица subscriptions создана');
        });
        
        // Создаем таблицу комментариев
        db.run(`
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
        `, (err) => {
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
                        } else {
                            console.log(`✅ Индекс ${indexName} создан`);
                        }
                        checkIndexesComplete();
                    }
                );
            });
        });

        const createRatingsTable = () => {
            // Создаем таблицу оценок
            db.run(`
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
            `, (err) => {
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
                    }
                };

                ratingIndexes.forEach(([indexName, indexColumns]) => {
                    db.run(
                        `CREATE INDEX IF NOT EXISTS ${indexName} ON ${indexColumns};`,
                        (err) => {
                            if (err) {
                                console.error(`Error creating index ${indexName}:`, err.message);
                            } else {
                                console.log(`✅ Индекс ${indexName} создан`);
                            }
                            checkRatingIndexesComplete();
                        }
                    );
                });
            });
        };
    });
});

export default db;
