// server/routes/auth.js - только вход в систему
import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/database';
import { JWTPayload } from '../types';

const router = express.Router();
require('dotenv').config();
const SECRET = process.env['JWT_SECRET'];

// Функция для записи/обновления сессии устройства
const updateUserSession = (userId: number, deviceId: string, req: Request): Promise<number> => {
  const deviceInfo = req.get('User-Agent') || '';
  const ipAddress = req.ip || req.connection.remoteAddress || '';
  const userAgent = req.get('User-Agent') || '';

  return new Promise((resolve, reject) => {
    // Проверяем, есть ли уже активная сессия с этим device_id
    db.get(
      'SELECT id FROM user_sessions WHERE user_id = ? AND device_id = ? AND is_active = 1',
      [userId, deviceId],
      (err: Error | null, existingSession: any) => {
        if (err) {
          console.error('Error checking existing session:', err);
          reject(err);
          return;
        }

        if (existingSession) {
          // Обновляем существующую сессию
          db.run(
            'UPDATE user_sessions SET last_activity = CURRENT_TIMESTAMP WHERE id = ?',
            [existingSession.id],
            (err: Error | null) => {
              if (err) {
                console.error('Error updating session:', err);
                reject(err);
                return;
              }
              resolve(existingSession.id);
            }
          );
        } else {
          // Создаем новую сессию
          db.run(
            `INSERT INTO user_sessions (user_id, device_id, device_info, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?)`,
            [userId, deviceId, deviceInfo, ipAddress, userAgent],
            function(err: Error | null) {
              if (err) {
                console.error('Error creating session:', err);
                reject(err);
                return;
              }
              resolve(this.lastID);
            }
          );
        }
      }
    );
  });
};

// Вход в систему
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const deviceId = req.headers['device-id'] as string;

    if (!username || !password) {
      res.status(400).json({ message: 'Логин и пароль обязательны' });
      return;
    }

    if (!deviceId) {
      res.status(400).json({ message: 'deviceId обязателен', headers: JSON.stringify(req.headers) });
      return;
    }

    // Ищем пользователя в базе данных
    db.get(
      'SELECT id, username, password_hash, role, is_blocked FROM users WHERE username = ?',
      [username],
      async (err: Error | null, user: any) => {
        if (err) {
          res.status(500).json({ message: 'Ошибка базы данных' });
          return;
        }

        if (!user) {
          res.status(401).json({ message: 'Неверный логин или пароль' });
          return;
        }

        // Проверяем, не заблокирован ли пользователь
        if (user.is_blocked) {
          res.status(403).json({ message: 'Аккаунт заблокирован' });
          return;
        }

        // Проверяем пароль
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
          res.status(401).json({ message: 'Неверный логин или пароль' });
          return;
        }

        // Обновляем время последнего входа
        db.run(
          'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
          [user.id],
          (err: Error | null) => {
            if (err) console.error('Error updating last_login:', err);
          }
        );

        // Записываем/обновляем сессию устройства
        const sessionId = await updateUserSession(user.id, deviceId, req);

        // Создаем JWT токен
        const token = jwt.sign(
          {
            id: user.id,
            sessionId: sessionId,
            username: user.username,
            role: user.role,
            deviceId: deviceId
          } as JWTPayload,
          SECRET!,
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
router.get('/me', (req: Request, res: Response) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ message: 'Токен не предоставлен' });
    return;
  }

  try {
    const decoded = jwt.verify(token, SECRET!) as JWTPayload;

    db.get(
      'SELECT id, username, role, is_blocked, created_at, last_login FROM users WHERE id = ?',
      [decoded.id],
      (err: Error | null, user: any) => {
        if (err) {
          res.status(500).json({ message: 'Ошибка базы данных' });
          return;
        }

        if (!user) {
          res.status(404).json({ message: 'Пользователь не найден' });
          return;
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
router.get('/my-sessions', (req: Request, res: Response) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ message: 'Токен не предоставлен' });
    return;
  }

  try {
    const decoded = jwt.verify(token, SECRET!) as JWTPayload;

    db.all(
      `SELECT id, device_id, device_info, ip_address, user_agent,
              created_at, last_activity, is_active
       FROM user_sessions
       WHERE user_id = ? AND is_active = 1
       ORDER BY last_activity DESC`,
      [decoded.id],
      (err: Error | null, sessions: any[]) => {
        if (err) {
          res.status(500).json({ message: 'Ошибка базы данных' });
          return;
        }

        res.json({ sessions });
      }
    );
  } catch (error) {
    res.status(401).json({ message: 'Недействительный токен' });
  }
});

// Завершить текущую сессию
router.post('/logout', (req: Request, res: Response) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ message: 'Токен не предоставлен' });
    return;
  }

  try {
    const decoded = jwt.verify(token, SECRET!) as JWTPayload;

    db.run(
      'UPDATE user_sessions SET is_active = 0 WHERE user_id = ? AND device_id = ?',
      [decoded.id, decoded.deviceId],
      function(err: Error | null) {
        if (err) {
          res.status(500).json({ message: 'Ошибка завершения сессии' });
          return;
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

export default router;
