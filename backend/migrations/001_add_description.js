const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('../db/memes.db');

db.all('PRAGMA table_info(memes)', (err, columns) => {
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