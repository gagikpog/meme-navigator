const jwt = require('jsonwebtoken');
const { ERROR } = require('sqlite3');
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
    req.user = decoded;
    next();
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
