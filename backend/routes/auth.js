// server/routes/auth.js - только вход в систему
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const router = express.Router();
require('dotenv').config();
const SECRET = process.env.JWT_SECRET;

// Функция для записи/обновления сессии устройства
const updateUserSession = (userId, deviceId, req) => {
  const deviceInfo = req.get('User-Agent') || '';
  const ipAddress = req.ip || req.connection.remoteAddress || '';
  const userAgent = req.get('User-Agent') || '';

  // Проверяем, есть ли уже активная сессия с этим device_id
  db.get(
    'SELECT id FROM user_sessions WHERE user_id = ? AND device_id = ? AND is_active = 1',
    [userId, deviceId],
    (err, existingSession) => {
      if (err) {
        console.error('Error checking existing session:', err);
        return;
      }

      if (existingSession) {
        // Обновляем существующую сессию
        db.run(
          'UPDATE user_sessions SET last_activity = CURRENT_TIMESTAMP WHERE id = ?',
          [existingSession.id],
          (err) => {
            if (err) console.error('Error updating session:', err);
          }
        );
      } else {
        // Создаем новую сессию
        db.run(
          `INSERT INTO user_sessions (user_id, device_id, device_info, ip_address, user_agent)
           VALUES (?, ?, ?, ?, ?)`,
          [userId, deviceId, deviceInfo, ipAddress, userAgent],
          (err) => {
            if (err) console.error('Error creating session:', err);
          }
        );
      }
    }
  );
};

// Вход в систему
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const { 'device-id': deviceId } = req.headers;

    if (!username || !password) {
      return res.status(400).json({ message: 'Логин и пароль обязательны' });
    }

    if (!deviceId) {
      return res.status(400).json({ message: 'deviceId обязателен',headers: JSON.stringify(req.headers) });
    }

    // Ищем пользователя в базе данных
    db.get(
      'SELECT id, username, password_hash, role, is_blocked FROM users WHERE username = ?',
      [username],
      async (err, user) => {
        if (err) {
          return res.status(500).json({ message: 'Ошибка базы данных' });
        }

        if (!user) {
          return res.status(401).json({ message: 'Неверный логин или пароль' });
        }

        // Проверяем, не заблокирован ли пользователь
        if (user.is_blocked) {
          return res.status(403).json({ message: 'Аккаунт заблокирован' });
        }

        // Проверяем пароль
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
          return res.status(401).json({ message: 'Неверный логин или пароль' });
        }

        // Обновляем время последнего входа
        db.run(
          'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
          [user.id],
          (err) => {
            if (err) console.error('Error updating last_login:', err);
          }
        );

        // Записываем/обновляем сессию устройства
        updateUserSession(user.id, deviceId, req);

        // Создаем JWT токен
        const token = jwt.sign(
          {
            id: user.id,
            username: user.username,
            role: user.role,
            deviceId: deviceId
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
          },
          deviceId: deviceId
        });
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить информацию о текущем пользователе
router.get('/me', (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Токен не предоставлен' });
  }

  try {
    const decoded = jwt.verify(token, SECRET);

    db.get(
      'SELECT id, username, role, is_blocked, created_at, last_login FROM users WHERE id = ?',
      [decoded.id],
      (err, user) => {
        if (err) {
          return res.status(500).json({ message: 'Ошибка базы данных' });
        }

        if (!user) {
          return res.status(404).json({ message: 'Пользователь не найден' });
        }

        res.json({
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
            is_blocked: user.is_blocked,
            created_at: user.created_at,
            last_login: user.last_login
          },
          deviceId: decoded.deviceId
        });
      }
    );
  } catch (error) {
    res.status(401).json({ message: 'Недействительный токен' });
  }
});

// Получить активные сессии текущего пользователя
router.get('/my-sessions', (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Токен не предоставлен' });
  }

  try {
    const decoded = jwt.verify(token, SECRET);

    db.all(
      `SELECT id, device_id, device_info, ip_address, user_agent,
              created_at, last_activity, is_active
       FROM user_sessions
       WHERE user_id = ? AND is_active = 1
       ORDER BY last_activity DESC`,
      [decoded.id],
      (err, sessions) => {
        if (err) {
          return res.status(500).json({ message: 'Ошибка базы данных' });
        }

        res.json({ sessions });
      }
    );
  } catch (error) {
    res.status(401).json({ message: 'Недействительный токен' });
  }
});

// Завершить текущую сессию
router.post('/logout', (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Токен не предоставлен' });
  }

  try {
    const decoded = jwt.verify(token, SECRET);

    db.run(
      'UPDATE user_sessions SET is_active = 0 WHERE user_id = ? AND device_id = ?',
      [decoded.id, decoded.deviceId],
      function(err) {
        if (err) {
          return res.status(500).json({ message: 'Ошибка завершения сессии' });
        }

        res.json({
          message: 'Сессия успешно завершена',
          changes: this.changes
        });
      }
    );
  } catch (error) {
    res.status(401).json({ message: 'Недействительный токен' });
  }
});

module.exports = router;
