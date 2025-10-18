import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import db from '../db/database';
import { JWTPayload } from '../types';

require('dotenv').config();
const SECRET = process.env['JWT_SECRET'];

const initToken = (req: Request, res: Response, next: NextFunction): void => {
  if (!SECRET) {
    console.error('JWT_SECRET is empty');
    res.status(500).json({ message: 'Внутренняя ошибка' });
    return;
  }

  // Skip auth for CORS preflight
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  const token = req.query['authorization'] as string || req.headers.authorization?.split(' ')[1];
  (req as any).token = token;

  if (!token) {
    res.status(401).json({ message: 'Нет токена' });
    return;
  }

  try {
    const decoded = jwt.verify(token, SECRET) as JWTPayload;
    (req as any).user = decoded;
    next();
  } catch {
    res.status(403).json({ message: 'Неверный токен' });
  }
};

const baseAuth = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as any).user as JWTPayload;
  
  if (!user) {
    res.status(401).json({ message: 'Нет токена' });
    return;
  }

  try {
    // Проверяем, не заблокирован ли пользователь
    db.get(
      'SELECT is_blocked FROM users WHERE id = ?',
      [user.id],
      (err: Error | null, userResult: any) => {
        if (err) {
          console.error('Database error during user status check:', err);
          res.status(500).json({ message: 'Ошибка проверки статуса пользователя' });
          return;
        }

        if (!userResult) {
          res.status(404).json({ message: 'Пользователь не найден' });
          return;
        }

        if (userResult.is_blocked) {
          res.status(403).json({ message: 'Аккаунт заблокирован' });
          return;
        }

        // Проверяем активность сессии устройства, привязанной к токену
        if (!user.deviceId) {
          res.status(401).json({ message: 'Сессия недействительна: отсутствует deviceId' });
          return;
        }

        db.get(
          'SELECT id FROM user_sessions WHERE user_id = ? AND device_id = ? AND is_active = 1',
          [user.id, user.deviceId],
          (sessErr: Error | null, session: any) => {
            if (sessErr) {
              res.status(500).json({ message: 'Ошибка проверки сессии' });
              return;
            }

            if (!session) {
              res.status(401).json({ message: 'Сессия завершена. Выполните вход снова.' });
              return;
            }

            if (session.id !== user.sessionId) {
              res.status(401).json({ message: 'Сессия недействительна' });
              return;
            }

            (req as any).user = user;
            next();
          }
        );
      }
    );
  } catch {
    res.status(403).json({ message: 'Неверный токен' });
  }
};

const initDeviceId = (req: Request, res: Response, next: NextFunction): void => {
  const deviceId = req.headers['device-id'] as string;
  if (!deviceId) {
    res.status(400).json({ message: 'Отсутствует device-id в заголовках' });
    return;
  }

  const user = (req as any).user as JWTPayload;
  if (user.deviceId !== deviceId) {
    res.status(401).json({ message: 'Неверный токен' });
    return;
  }

  next();
};

// Middleware для проверки аутентификации
const auth = (req: Request, res: Response, next: NextFunction): void => {
  initToken(req, res, () => {
    initDeviceId(req, res, () => {
      baseAuth(req, res, next);
    });
  });
};

// Middleware для проверки аутентификации
const authWithoutDeviceId = (req: Request, res: Response, next: NextFunction): void => {
  initToken(req, res, () => {
    baseAuth(req, res, next);
  });
};

// Middleware для проверки прав на чтение (пользователь или админ)
const requireReadAccess = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as any).user as JWTPayload;
  if (user.role === 'admin' || user.role === 'writer' || user.role === 'user') {
    next();
  } else {
    res.status(403).json({ message: 'Недостаточно прав для доступа' });
  }
};

// Middleware для операций записи (только админы)
const requireWriteAccess = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as any).user as JWTPayload;
  if (user.role === 'admin' || user.role === 'writer') {
    next();
  } else {
    res.status(403).json({ message: 'Требуются права на редактирование для выполнения этой операции' });
  }
};

// Middleware для операций записи (только админы)
const requireAdminAccess = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as any).user as JWTPayload;
  if (user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Требуются права администратора для выполнения этой операции' });
  }
};

export { auth, authWithoutDeviceId, requireReadAccess, requireWriteAccess, requireAdminAccess };
