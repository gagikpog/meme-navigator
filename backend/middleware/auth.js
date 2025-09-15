const jwt = require('jsonwebtoken');
const { ERROR } = require('sqlite3');
const db = require('../db/database');
require('dotenv').config();
const SECRET = process.env.JWT_SECRET;

// Middleware для проверки аутентификации
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Нет токена' });

  try {
    if (!SECRET) {
      console.error('JWT_SECRET is empty');
      throw new ERROR('JWT_SECRET is empty');
    }
    const decoded = jwt.verify(token, SECRET);
    
    // Проверяем, не заблокирован ли пользователь
    db.get(
      'SELECT is_blocked FROM users WHERE id = ?',
      [decoded.id],
      (err, user) => {
        if (err) {
          return res.status(500).json({ message: 'Ошибка проверки статуса пользователя' });
        }
        
        if (!user) {
          return res.status(404).json({ message: 'Пользователь не найден' });
        }
        
        if (user.is_blocked) {
          return res.status(403).json({ message: 'Аккаунт заблокирован' });
        }
        
        req.user = decoded;
        next();
      }
    );
  } catch {
    res.status(403).json({ message: 'Неверный токен' });
  }
};

// Middleware для проверки прав на чтение (пользователь или админ)
const requireReadAccess = (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'writer' || req.user.role === 'user') {
    next();
  } else {
    res.status(403).json({ message: 'Недостаточно прав для доступа' });
  }
};

// Middleware для операций записи (только админы)
const requireWriteAccess = (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'writer') {
    next();
  } else {
    res.status(403).json({ message: 'Требуются права на редактирование для выполнения этой операции' });
  }
};

// Middleware для операций записи (только админы)
const requireAdminAccess = (req, res, next) => {
  if (req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Требуются права администратора для выполнения этой операции' });
  }
};

module.exports = { auth, requireReadAccess, requireWriteAccess, requireAdminAccess };
