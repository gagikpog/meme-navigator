const jwt = require('jsonwebtoken');
const db = require('../db/database');
require('dotenv').config();
const SECRET = process.env.JWT_SECRET;

const initToken = (req, res, next) => {

  if (!SECRET) {
    console.error('JWT_SECRET is empty');
    return res.status(500).json({ message: 'Внутренняя ошибка' });
  }

  // Skip auth for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  const token = req.query.authorization || req.headers.authorization?.split(' ')[1];
  req.token = token;

  if (!token) {
    return res.status(401).json({ message: 'Нет токена' });
  };

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    return next();
  } catch {
    return res.status(403).json({ message: 'Неверный токен' });
  }
}

const baseAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Нет токена' });
  }

  try {
    const decoded = req.user;

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

        // Проверяем активность сессии устройства, привязанной к токену
        if (!decoded.deviceId) {
          return res.status(401).json({ message: 'Сессия недействительна: отсутствует deviceId' });
        }

        db.get(
          'SELECT id FROM user_sessions WHERE user_id = ? AND device_id = ? AND is_active = 1',
          [decoded.id, decoded.deviceId],
          (sessErr, session) => {
            if (sessErr) {
              return res.status(500).json({ message: 'Ошибка проверки сессии' });
            }

            if (!session) {
              return res.status(401).json({ message: 'Сессия завершена. Выполните вход снова.' });
            }

            if (session.id !== decoded.sessionId) {
              return res.status(401).json({ message: 'Сессия недействительна' });
            }

            req.user = decoded;
            next();
          }
        );
      }
    );
  } catch {
    res.status(403).json({ message: 'Неверный токен' });
  }
}

const initDeviceId = (req, res, next) => {
  const deviceId = req.headers['device-id'];
  if (!deviceId) {
    return res.status(400).json({ message: 'Отсутствует device-id в заголовках' });
  }

  const user = req.user;
  if (user.deviceId !== deviceId) {
    return res.status(401).json({ message: 'Неверный токен' });
  }

  next();
}

// Middleware для проверки аутентификации
const auth = (req, res, next) => {
  return initToken(req, res, () => {
    return initDeviceId(req, res, () => {
      return baseAuth(req, res, next);
    });
  });
};

// Middleware для проверки аутентификации
const authWithoutDeviceId = (req, res, next) => {
  return initToken(req, res, () => {
    return baseAuth(req, res, next);
  });
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

module.exports = { auth, authWithoutDeviceId, requireReadAccess, requireWriteAccess, requireAdminAccess };
