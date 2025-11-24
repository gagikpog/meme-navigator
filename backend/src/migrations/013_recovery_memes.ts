import sqlite3 from 'sqlite3';
import path from 'path';

const sqlite = sqlite3.verbose();
const db = new sqlite.Database(path.resolve(__dirname, '../../memes.db'));

console.log('🚀 Начинаем миграцию: Восстановление данных');

interface IElement {
    user_id: number;
    filename: string;
    permissions: string;
    created_at: string;
}

db.serialize(async () => {
    const data = getData();
    for (let i = 0; i < data.length; i++) {
        const element = data[i];
        if (element) {
            await add(element);
        }
    }
    closeDatabase();
});

function add(element: IElement): Promise<number> {
    return new Promise((resolve) => {
        db.run(
            `INSERT INTO memes (user_id, fileName, permissions, created_at) VALUES (?, ?, ?, ?)`,
            [element.user_id, element.filename, element.permissions, element.created_at],
            function (err) {
                if (err) {
                    console.error('Error convert permissions data:', err.message);
                }
                resolve(this.changes);
            }
        );
    });
}

function closeDatabase() {
    // Закрываем базу данных
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('🎉 Миграция 013 успешно завершена!');
        }
    });
}

function getData(): IElement[] {
    return [
        {
            user_id: 1,
            created_at: '2025-10-21 07:26:38',
            permissions: 'public',
            filename: '1761020798503-Ð¡ÑÐ°ÑÑÐ¹ ÑÐ¾ÑÐ¼Ð°Ñ ÑÐ°ÑÐ°ÐºÑÐµÑÐ¸ÑÑÐ¸Ðº.jpg',
        },
        {
            user_id: 4,
            created_at: '2025-10-22 09:53:09',
            permissions: 'public',
            filename: '1761115989383-ÐÐ¾Ð²ÑÐ¹ ÑÐ¾ÑÐµÑÐ½ÑÐ¹ ÑÐ¸ÑÑÐ½Ð¾Ðº.jpg',
        },
        {
            user_id: 12,
            created_at: '2025-10-23 11:09:25',
            permissions: 'public',
            filename: '1761206965193-photo_2025-10-23_13-06-24.jpg',
        },
        {
            user_id: 1,
            created_at: '2025-10-23 13:15:20',
            permissions: 'public',
            filename: ' 1761214520278-ÐÐ¸ÐºÐ¸ÑÐ°.jpg',
        },
        {
            user_id: 3,
            created_at: '2025-10-23 15:03:21',
            permissions: 'public',
            filename: '1761221001341-ÐÐ°Ð³Ð¸Ðº ÑÐºÑÐ¿ÐµÑÐ¸Ð¼ÐµÐ½ÑÑ.jpg',
        },
        {
            user_id: 8,
            created_at: '2025-10-24 14:07:54',
            permissions: 'public',
            filename: '1761304074142-pasted-image.png',
        },
        {
            user_id: 1,
            created_at: '2025-10-27 08:50:53',
            permissions: 'public',
            filename: '1761544252992-88c9e42d3bb10bea7038edcc6b0ff4f7.jpg',
        },
        {
            user_id: 2,
            created_at: '2025-10-29 09:36:54',
            permissions: 'private',
            filename: '1761719814223-ÑÑÐ¾Ð± Ð½Ðµ Ð²ÑÑÑÐºÐ°Ð».jpg',
        },
        {
            user_id: 2,
            created_at: '2025-10-29 10:46:23',
            permissions: 'public',
            filename: '1761723983752-3-Ð»ÐµÐ³ÐµÐ½Ð´Ñ.jpg',
        },
        {
            user_id: 1,
            created_at: '2025-10-30 08:55:04',
            permissions: 'public',
            filename: '1761803704194-Ð²Ð¾Ð»ÑÐµÐ±Ð½Ð¸Ðº.jpg',
        },
        {
            user_id: 1,
            created_at: '2025-10-30 09:22:56',
            permissions: 'public',
            filename: '1761805376299-ÑÐºÐ°Ð»Ð° Ð¾ÑÐ¸Ð±Ð¾Ðº.jpg',
        },
        {
            user_id: 1,
            created_at: '2025-10-31 14:44:32',
            permissions: 'private',
            filename: '1761894297464-pasted-image.png',
        },
        {
            user_id: 5,
            created_at: '2025-10-31 14:44:32',
            permissions: 'public',
            filename: '1761911072652-3eb786cb-6536-45a8-8f70-5ac6acb77b14.png',
        },
        {
            user_id: 12,
            created_at: '2025-11-01 10:33:03',
            permissions: 'public',
            filename: '1761982383677-4922a5e3920a67a97afe0025828c36e0.jpg',
        },
        {
            user_id: 2,
            created_at: '2025-11-01 10:45:47',
            permissions: 'public',
            filename: '1761983147760-Ð´Ð°Ð½Ñ ÑÐ¿Ð¸Ñ.jpg',
        },
        {
            user_id: 2,
            created_at: '2025-11-01 15:01:43',
            permissions: 'public',
            filename: '1761998503314-pasted-image.png',
        },
        {
            user_id: 2,
            created_at: '2025-11-07 13:31:31',
            permissions: 'public',
            filename: '1762511491682-pasted-image.png',
        },
        {
            user_id: 12,
            created_at: '2025-11-12 10:32:15',
            permissions: 'public',
            filename: '1762932735261-serious_Danya.png',
        },
        {
            user_id: 2,
            created_at: '2025-11-13 09:11:10',
            permissions: 'public',
            filename: '1763014270470-Ð»ÑÑÑÐµ Ð·Ð²Ð¾Ð½Ð¸ÑÐµ ÐÐ¸Ð¼Ð¾Ð½Ñ.jpg',
        },
        {
            user_id: 4,
            created_at: '2025-11-13 10:30:24',
            permissions: 'public',
            filename:
                '1763019024382-M25BNfRJofSa20zRW4O32lehsA3N1YyQtzYE4K5YsvGVPqOK6Kj4gWoWNoCays0AzFFbXmIKYt112ujr19R4vR6GwLC5f08UXH0IpI38KffYhGPPHSfL3M7vX8O7ADAx.jpeg',
        },
        {
            user_id: 12,
            created_at: '2025-11-14 14:49:32',
            permissions: 'public',
            filename: '1763120972206-photo_2025-11-14_16-48-50.jpg',
        },
        {
            user_id: 12,
            created_at: '2025-11-14 15:12:10',
            permissions: 'public',
            filename: '1763122330779-photo_2025-11-14_17-07-11.jpg',
        },
        {
            user_id: 2,
            created_at: '2025-11-14 15:14:04',
            permissions: 'public',
            filename: '1763122444102-pasted-image.png',
        },
        {
            user_id: 8,
            created_at: '2025-11-19 15:00:13',
            permissions: 'public',
            filename: '1763553613064-pasted-image.png',
        },
    ];
}

