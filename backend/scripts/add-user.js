const bcrypt = require('bcryptjs');
const db = require('../db/database');

async function addUser() {
  try {
    const username = process.argv[2];
    const password = process.argv[3];
    const role = process.argv[4] || 'user';
    
    if (!username || !password) {
      console.log('Использование: node add-user.js <username> <password> [role]');
      console.log('Пример: node add-user.js testuser password123 user');
      process.exit(1);
    }

    // Проверяем, существует ли пользователь
    db.get('SELECT id FROM users WHERE username = ?', [username], async (err, row) => {
      if (err) {
        console.error('Ошибка проверки пользователя:', err.message);
        process.exit(1);
      }
      
      if (row) {
        console.log('Пользователь уже существует');
        db.close();
        return;
      }

      // Хешируем пароль
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Создаем пользователя
      db.run(
        'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
        [username, passwordHash, role],
        function(err) {
          if (err) {
            console.error('Ошибка создания пользователя:', err.message);
            process.exit(1);
          }
          
          console.log(`Пользователь создан успешно:`);
          console.log(`Логин: ${username}`);
          console.log(`Пароль: ${password}`);
          console.log(`Роль: ${role}`);
          console.log(`ID: ${this.lastID}`);
          
          db.close();
        }
      );
    });
  } catch (error) {
    console.error('Ошибка:', error.message);
    process.exit(1);
  }
}

addUser();
