const bcrypt = require('bcryptjs');
const db = require('../db/database');
require('dotenv').config();

async function initAdmin() {
  try {
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    if (!adminUsername || !adminPasswordHash) {
        console.error('Не найден пользователь админ:', error.message);
        process.exit(1);
    }
    
    // Проверяем, существует ли уже админ
    db.get('SELECT id FROM users WHERE username = ? AND role = ?', [adminUsername, 'admin'], async (err, row) => {
      if (err) {
        console.error('Ошибка проверки администратора:', err.message);
        process.exit(1);
      }
      
      if (row) {
        console.log('Администратор уже существует');
        db.close();
        return;
      }

      // Создаем администратора
      db.run(
        'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
        [adminUsername, adminPasswordHash, 'admin'],
        function(err) {
          if (err) {
            console.error('Ошибка создания администратора:', err.message);
            process.exit(1);
          }
          
          console.log(`Администратор создан успешно:`);
          console.log(`Логин: ${adminUsername}`);
          console.log(`Пароль: ${adminPasswordHash}`);
          console.log(`ID: ${this.lastID}`);
          
          db.close();
        }
      );
    });
  } catch (error) {
    console.error('Ошибка инициализации:', error.message);
    process.exit(1);
  }
}

initAdmin();
