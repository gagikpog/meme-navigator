import sqlite3 from 'sqlite3';
import path from 'path';

const sqlite = sqlite3.verbose();
const db = new sqlite.Database(path.resolve(__dirname, '../../memes.db'));

db.serialize(async () => {
    try {
        console.log('запуск перенос данных по авторам');
        await main();
        await closeDatabase();
    } catch (error) {
        console.error(error);
    }
});

async function main() {
    const data = getData();
    let count = 0;
    let changes = 0;

    for (let index = 0; index < data.length; index++) {
        const row = data[index];
        if (row) {
            console.log(`Начинаем указывать авторства пользователя ${row.authorName} с ИД: ${row.authorId}`);
            for (let memeIndex = 0; memeIndex < row.memes.length; memeIndex++) {
                const meme = row.memes[memeIndex];
                if (meme) {
                    count++
                    const fileName = decodeURIComponent(meme).replace('https://meme.gagikpog.ru/meme/', '');
                    console.log(`Обновление: ${fileName}`);
                    changes += await update(row.authorId, fileName);
                }
            }
        }
    }
 
    console.log(`Обновлено ${changes} из ${count}`);
}

function update(authorId: number, fileName: string): Promise<number> {
    return new Promise((resolve) => {
        db.run(`UPDATE memes SET user_id = ${authorId} WHERE fileName = '${fileName}'`, function(err) {
            if (err) {
                console.error('Error convert permissions data:', err.message);
            }
            resolve(this.changes);
        });
    });
}

function closeDatabase() {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Migration 111 completed successfully');
        }
    });
}

function getData() {
    return [
        {
            authorId: 2,
            authorName: 'Сабит',
            memes: [
                'https://meme.gagikpog.ru/meme/1760612435431-pasted-image.png',
                'https://meme.gagikpog.ru/meme/1760612368797-%C3%90%C2%B3%C3%90%C2%B0%C3%90%C2%B3%C3%90%C2%B8%C3%90%C2%BA%20%C3%90%C2%B4%C3%90%C2%B5%C3%91%C2%80%C3%90%C2%B4%C3%90%C2%B8%C3%91%C2%81%C3%91%C2%8C.jpg',
                'https://meme.gagikpog.ru/meme/1760612138524-pasted-image.png',
                'https://meme.gagikpog.ru/meme/1760428674173-%C3%90%C2%BD%C3%90%C2%B0%C3%90%C2%B8%C3%90%C2%BB%C3%91%C2%8C%20%C3%90%C2%B7%C3%90%C2%B2%C3%90%C2%B0%C3%90%C2%BD%C3%90%C2%BD%C3%91%C2%8B%C3%90%C2%B8%C3%8C%C2%86%20%C3%91%C2%83%C3%90%C2%B6%C3%90%C2%B8%C3%90%C2%BD.jpg',
                'https://meme.gagikpog.ru/meme/1760009673956-pasted-image.png',
                'https://meme.gagikpog.ru/meme/1759917262638-%C3%90%C2%B4%C3%90%C2%BE%C3%90%C2%B3%C3%90%C2%BE%C3%90%C2%B2%C3%90%C2%BE%C3%91%C2%80.jpg',
                'https://meme.gagikpog.ru/meme/1759726707513-%C3%90%C2%BE%C3%90%C2%BF%C3%91%C2%82%C3%90%C2%B8%C3%90%C2%BC%C3%91%C2%83%C3%91%C2%81%20%C3%90%C2%BF%C3%91%C2%80%C3%90%C2%B0%C3%90%C2%B8%C3%8C%C2%86%C3%90%C2%BC.jpg',
                'https://meme.gagikpog.ru/meme/1759482279074-IMG_20251003_140304_264.png',
                'https://meme.gagikpog.ru/meme/1759385862168-%C3%90%C2%B7%C3%90%C2%B5%C3%91%C2%80%C3%90%C2%BA%C3%90%C2%B0%C3%90%C2%BB%C3%90%C2%BE.jpg',
                'https://meme.gagikpog.ru/meme/1759146636036-%C3%91%C2%80%C3%90%C2%B5%C3%90%C2%B2%C3%91%C2%8C%C3%91%C2%8E.jpg',
                'https://meme.gagikpog.ru/meme/1758869973975-%C3%90%C2%BF%C3%90%C2%BB%C3%90%C2%B0%C3%91%C2%82%C3%91%C2%84%C3%90%C2%BE%C3%91%C2%80%C3%90%C2%BC%C3%90%C2%B0-%C3%91%C2%81%C3%90%C2%BC%C3%90%C2%BE%C3%91%C2%82%C3%91%C2%80%C3%90%C2%B8%C3%91%C2%82-%C3%91%C2%81%C3%90%C2%BF%C3%90%C2%B8%C3%91%C2%81%C3%90%C2%BA%C3%90%C2%B8.jpg',
                'https://meme.gagikpog.ru/meme/1759213612949-Image_2025-09-24_17-37-02_850.png',
                'https://meme.gagikpog.ru/meme/1758033250067-tg_image_3987812087.jpeg',
                'https://meme.gagikpog.ru/meme/1758081660167-photo_2025-09-11_12-20-16.jpg',
                'https://meme.gagikpog.ru/meme/1754571082508-mozhet-hvatit-buhtet.jpg',
                'https://meme.gagikpog.ru/meme/1753613615946-photo_2025-07-17_12-01-02.jpg',
                'https://meme.gagikpog.ru/meme/1753613052324-%C3%90%C2%B8%C3%90%C2%B8.png',
                'https://meme.gagikpog.ru/meme/1753614109948-gpt.jpeg',
                'https://meme.gagikpog.ru/meme/1753612809820-%C3%90%C2%BF%C3%90%C2%B5%C3%91%C2%80%C3%90%C2%B5%C3%91%C2%82%C3%90%C2%BE%C3%91%C2%81%C3%90%C2%BE%C3%90%C2%B2%C3%90%C2%B0%C3%90%C2%BB.png',
                'https://meme.gagikpog.ru/meme/1753613621096-photo_2025-05-23_15-05-57.jpg',
                'https://meme.gagikpog.ru/meme/1753614129818-fury-orig.jpg',
                'https://meme.gagikpog.ru/meme/1753612378850-%C3%91%C2%83%C3%91%C2%81%C3%91%C2%82%C3%90%C2%B0%C3%90%C2%BB.jpg',
                'https://meme.gagikpog.ru/meme/1753612442485-%C3%91%C2%82%C3%90%C2%B0%C3%90%C2%B8%C3%90%C2%BD%C3%91%C2%8B%20%C3%91%C2%87%C3%90%C2%B5%C3%90%C2%BB%C3%90%C2%BE%C3%90%C2%B2%C3%90%C2%B5%C3%91%C2%87%C3%90%C2%B5%C3%91%C2%81%C3%91%C2%82%C3%90%C2%B2%C3%90%C2%B0.png',
                'https://meme.gagikpog.ru/meme/1753613600217-regexp-god.jpg',
                'https://meme.gagikpog.ru/meme/1753614043846-Image_2025-03-31_16-37-44_939.png',
                'https://meme.gagikpog.ru/meme/1753613549253-tg_image_3655446252.jpeg',
                'https://meme.gagikpog.ru/meme/1753612882675-%C3%90%C2%BC%C3%90%C2%B5%C3%90%C2%BC%C3%90%C2%BE.png',
                'https://meme.gagikpog.ru/meme/1753612875503-%C3%90%C2%9C%C3%90%C2%BE%C3%91%C2%91_%C3%90%C2%B2%C3%91%C2%80%C3%90%C2%B5%C3%90%C2%BC%C3%91%C2%8F_%C3%90%C2%BF%C3%91%C2%80%C3%90%C2%B8%C3%91%C2%88%C3%90%C2%BB%C3%90%C2%BE.jpg',
                'https://meme.gagikpog.ru/meme/1753613024781-%C3%90%C2%BA%C3%90%C2%BD%C3%90%C2%BE%C3%90%C2%BF%C3%90%C2%BA%C3%90%C2%B0.jpg',
                'https://meme.gagikpog.ru/meme/1753612803519-%C3%90%C2%9F%C3%90%C2%B5%C3%91%C2%82%C3%91%C2%80.jpg',
                'https://meme.gagikpog.ru/meme/1753604823982-%C3%90%C2%A9%C3%90%C2%B5%C3%90%C2%B4%C3%91%C2%80%C3%90%C2%B8%C3%90%C2%BD.png',
                'https://meme.gagikpog.ru/meme/1753613825544-photo_2021-02-11_21-59-45.jpg',
                'https://meme.gagikpog.ru/meme/1753613829730-photo_2021-02-11_16-01-07.jpg',
                'https://meme.gagikpog.ru/meme/1753613452965-%C3%90%C2%B3%C3%90%C2%B0%C3%90%C2%B3%C3%90%C2%B8%C3%90%C2%BA%20(3).jpg',
                'https://meme.gagikpog.ru/meme/1753612816883-%C3%90%C2%BE%C3%90%C2%BF%C3%91%C2%82%C3%90%C2%B8%C3%90%C2%BC%C3%90%C2%B8%C3%90%C2%B7%C3%90%C2%B0%C3%91%C2%86%C3%90%C2%B8%C3%91%C2%8F%20%C3%90%C2%BA%C3%90%C2%B0%C3%91%C2%82%C3%90%C2%B0%C3%90%C2%BB%C3%90%C2%BE%C3%90%C2%B3%C3%90%C2%B0.png',
                'https://meme.gagikpog.ru/meme/1753613697638-photo_2024-06-27_08-18-38.jpg',
                'https://meme.gagikpog.ru/meme/1753613708984-photo_2024-05-27_13-03-06.jpg',
                'https://meme.gagikpog.ru/meme/1753613723963-photo_2024-03-13_14-44-00.jpg',
                'https://meme.gagikpog.ru/meme/1753613727603-photo_2024-03-11_12-59-55.jpg',
                'https://meme.gagikpog.ru/meme/1753612890739-%C3%90%C2%9C%C3%90%C2%B0%C3%90%C2%BC%C3%90%C2%B1%C3%90%C2%B5%C3%91%C2%82%C3%90%C2%BE%C3%90%C2%B2%20%C3%90%C2%A1%C3%90%C2%B5%C3%91%C2%80%C3%90%C2%B3%C3%90%C2%B5%C3%90%C2%B9.jpg',
                'https://meme.gagikpog.ru/meme/1753612288820-%C3%91%C2%83%C3%91%C2%87%C3%90%C2%B8%C3%91%C2%81%C3%91%C2%8C%20%C3%90%C2%BA%C3%90%C2%BE%C3%90%C2%B3%C3%90%C2%B4%C3%90%C2%B0%20%C3%91%C2%8F%20%C3%90%C2%B6%C3%90%C2%B8%C3%90%C2%B2.jpg',
                'https://meme.gagikpog.ru/meme/1753613424537-%C3%90%C2%B3%C3%90%C2%B0%C3%90%C2%B3%C3%90%C2%B8%C3%90%C2%BA.jpg',
                'https://meme.gagikpog.ru/meme/1753613779049-photo_2023-09-26_10-38-16.jpg',
                'https://meme.gagikpog.ru/meme/1753613045523-%C3%90%C2%9A%C3%90%C2%B0%C3%90%C2%BA%C3%90%C2%BE%C3%90%C2%B9%20%C3%91%C2%82%C3%91%C2%8B%20%C3%91%C2%81%C3%90%C2%B5%C3%90%C2%B3%C3%90%C2%BE%C3%90%C2%B4%C3%90%C2%BD%C3%91%C2%8F%20%C3%90%C2%93%C3%90%C2%B0%C3%90%C2%B3%C3%90%C2%B8%C3%90%C2%BA.jpg',
            ]
        }, {
            authorId: 12,
            authorName: 'Лилия',
            memes: [
                'https://meme.gagikpog.ru/meme/1760446752119-photo_2025-10-14_17-52-25.jpg',
                'https://meme.gagikpog.ru/meme/1760028185164-pasted-image.png',
                'https://meme.gagikpog.ru/meme/1760021770453-pasted-image.jpg',
                'https://meme.gagikpog.ru/meme/1757405960035-photo_2025-09-09_13-12-58.jpg',
                'https://meme.gagikpog.ru/meme/1756886870182-photo_2025-09-03_13-06-36.jpg',
                'https://meme.gagikpog.ru/meme/1753613666871-photo_2025-01-13_17-42-51.jpg',
                'https://meme.gagikpog.ru/meme/1753613670652-photo_2025-01-13_10-41-18.jpg',
                'https://meme.gagikpog.ru/meme/1753613677127-photo_2024-09-03_12-49-12.jpg',
                'https://meme.gagikpog.ru/meme/1753613015165-%C3%90%C2%BA%C3%90%C2%BE%C3%90%C2%BD%C3%90%C2%B2%C3%90%C2%B5%C3%91%C2%80%C3%91%C2%82%C3%90%C2%B0%C3%91%C2%86%C3%90%C2%B8%C3%91%C2%8F.png',
                'https://meme.gagikpog.ru/meme/1759476528358-pasted-image.png',
                'https://meme.gagikpog.ru/meme/1753613606804-photo_2025-07-23_12-21-31.jpg',
            ]
        }, {
            authorId: 3,
            authorName: 'Никита',
            memes: [
                'https://meme.gagikpog.ru/meme/1760101209965-pasted-image.png',
                'https://meme.gagikpog.ru/meme/1760099919103-pasted-image.png',
                'https://meme.gagikpog.ru/meme/1760076557411-pasted-image.png',
                'https://meme.gagikpog.ru/meme/1759735881461-pasted-image.png',
                'https://meme.gagikpog.ru/meme/1754480661047-photo_2025-08-06_16-34-38.jpg',
                'https://meme.gagikpog.ru/meme/1753612591778-%C3%90%C2%A1%C3%90%C2%B0%C3%90%C2%B1%C3%90%C2%B8%C3%91%C2%82%C3%90%C2%93%C3%91%C2%83%C3%90%C2%B4.png',
                'https://meme.gagikpog.ru/meme/1753613685848-photo_2024-08-27_19-36-18.jpg',
                'https://meme.gagikpog.ru/meme/1753613716504-photo_2024-05-13_18-01-13.jpg',
            ]
        }, {
            authorId: 5,
            authorName: 'Софронов',
            memes: [
                'https://meme.gagikpog.ru/meme/1759994866355-pasted-image.png',
                'https://meme.gagikpog.ru/meme/1759303892456-photo_2025-10-01_12-29-16.jpg',
                'https://meme.gagikpog.ru/meme/1758864266126-photo_2025-09-26_10-21-39.jpg',
            ]
        }, {
            authorId: 7,
            authorName: 'Егорова',
            memes: [
                'https://meme.gagikpog.ru/meme/1759304594087-%C3%90%C2%A0%C3%90%C2%B8%C3%91%C2%81%C3%91%C2%83%C3%90%C2%BD%C3%90%C2%BE%C3%90%C2%BA2.png',
                'https://meme.gagikpog.ru/meme/1759304511675-%C3%90%C2%A0%C3%90%C2%B8%C3%91%C2%81%C3%91%C2%83%C3%90%C2%BD%C3%90%C2%BE%C3%90%C2%BA1.png',
            ]
        }, {
            authorId: 4,
            authorName: 'Грамотеев',
            memes: [
                'https://meme.gagikpog.ru/meme/1753614287656-8dee550f-1c72-46e8-84f4-9eb2237ee1eb.jpg',
                'https://meme.gagikpog.ru/meme/1753613632036-photo_2025-04-28_13-14-50.jpg',
            ]
        }, {
            authorId: 8,
            authorName: 'Наиль',
            memes: [
                'https://meme.gagikpog.ru/meme/1757003799064-photo_2025-09-04_21-34-22.jpg',
                'https://meme.gagikpog.ru/meme/1753614000833-Image_2025-06-27_11-06-47_520.jpg',
                'https://meme.gagikpog.ru/meme/1753612426843-%C3%91%C2%82%C3%90%C2%B5%C3%91%C2%81%C3%91%C2%82%C3%90%C2%B8%C3%91%C2%80%C3%91%C2%83%C3%90%C2%B5%C3%90%C2%BC.jpg',
                'https://meme.gagikpog.ru/meme/1753612331565-%C3%91%C2%83%C3%91%C2%87%C3%90%C2%B0%C3%91%C2%81%C3%91%C2%82%C3%90%C2%BE%C3%90%C2%BA.jpg',
                'https://meme.gagikpog.ru/meme/1753613755164-photo_2023-10-23_17-39-11.jpg',
                'https://meme.gagikpog.ru/meme/1753613758859-photo_2023-10-23_17-37-41.jpg',
                'https://meme.gagikpog.ru/meme/1753613762541-photo_2023-10-23_17-37-32.jpg',
                'https://meme.gagikpog.ru/meme/1753613765899-photo_2023-10-13_15-31-58.jpg',
                'https://meme.gagikpog.ru/meme/1753613038309-%C3%90%C2%9A%C3%90%C2%B0%C3%91%C2%82%C3%90%C2%B0%C3%90%C2%B4%C3%90%C2%BB%C3%90%C2%B3%20%C3%91%C2%8D%C3%91%C2%82%C3%90%C2%BE%C3%91%C2%82%20%C3%90%C2%B5%C3%90%C2%B1%C3%91%C2%83%C3%91%C2%87%C3%90%C2%B8%C3%90%C2%B9.jpg',
                'https://meme.gagikpog.ru/meme/1753612734397-%C3%90%C2%BF%C3%90%C2%BE%C3%91%C2%80%C3%90%C2%B0.jpg',
                'https://meme.gagikpog.ru/meme/1753612909528-%C3%90%C2%BA%C3%91%C2%82%C3%90%C2%BE%20%C3%91%C2%85%C3%90%C2%BE%C3%91%C2%87%C3%90%C2%B5%C3%91%C2%82%20%C3%91%C2%81%C3%91%C2%82%C3%90%C2%B0%C3%91%C2%82%C3%91%C2%8C.jpg',
                'https://meme.gagikpog.ru/meme/1753613772715-photo_2023-10-13_14-37-27.jpg',
                'https://meme.gagikpog.ru/meme/1753613775868-photo_2023-10-13_14-36-40.jpg',
                'https://meme.gagikpog.ru/meme/1753612543706-%C3%90%C2%A1%C3%90%C2%B2%C3%90%C2%BE%C3%90%C2%B9%20%C3%90%C2%91%C3%91%C2%83%C3%91%C2%82.jpg',
            ]
        }, {
            authorId: 9,
            authorName: 'Антон',
            memes: [
                'https://meme.gagikpog.ru/meme/1753613074805-%C3%90%C2%B7%C3%90%C2%B0%C3%90%C2%BF%C3%91%C2%80%C3%90%C2%B5%C3%91%C2%89%C3%90%C2%B0%C3%91%C2%8E%20%C3%91%C2%81%C3%90%C2%BE%C3%90%C2%B1%C3%90%C2%B8%C3%91%C2%80%C3%90%C2%B0%C3%91%C2%82%C3%91%C2%8C.png',
                'https://meme.gagikpog.ru/meme/1753612709610-%C3%90%C2%9F%C3%91%C2%8F%C3%91%C2%82%C3%90%C2%B0%C3%90%C2%BA%C3%90%C2%BE%C3%90%C2%B2,%20%C3%91%C2%80%C3%90%C2%B0%C3%90%C2%B1%C3%90%C2%BE%C3%91%C2%82%C3%90%C2%B0%C3%90%C2%B9.jpeg',
            ]
        }, {
            authorId: 6,
            authorName: 'Караулов',
            memes: [
                'https://meme.gagikpog.ru/meme/1753614082996-gyCUT_D7cEA.jpg'
            ]
        }
    ];
}
