import sqlite3 from 'sqlite3';
const sqlite = sqlite3.verbose();
const db = new sqlite.Database('../../memes.db');

db.all('PRAGMA table_info(memes)', (err, columns: {name: string}[]) => {
  if (err) throw err;

  const hasDescription = columns.some((col) => col.name === 'description');
  if (!hasDescription) {
    db.run('ALTER TABLE memes ADD COLUMN description TEXT', (err2) => {
      if (err2) throw err2;
      console.log('Миграция применена: добавлено поле description');
    });
  } else {
    console.log('Поле description уже существует');
  }
});