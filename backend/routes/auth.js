// server/routes/auth.js - только вход в систему
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const router = express.Router();
require('dotenv').config();
const SECRET = process.env.JWT_SECRET;

// Вход в систему
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Логин и пароль обязательны' });
    }

    // Ищем пользователя в базе данных
    db.get(
      'SELECT id, username, password_hash, role FROM users WHERE username = ?',
      [username],
      async (err, user) => {
        if (err) {
          return res.status(500).json({ message: 'Ошибка базы данных' });
        }
        
        if (!user) {
          return res.status(401).json({ message: 'Неверный логин или пароль' });
        }

        // Проверяем пароль
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
          return res.status(401).json({ message: 'Неверный логин или пароль' });
        }

        // Создаем JWT токен
        const token = jwt.sign(
          { 
            id: user.id, 
            username: user.username, 
            role: user.role 
          }, 
          SECRET, 
          { expiresIn: '90d' }
        );
        
        res.json({ 
          token,
          user: {
            id: user.id,
            username: user.username,
            role: user.role
          }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;
