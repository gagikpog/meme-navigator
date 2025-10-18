import express, { Response } from 'express';
import db from '../db/database';
import sendNotifications from '../utils/sendNotifications';
import { requireWriteAccess } from '../middleware/auth';

const router = express.Router();

// === POST /subscribe ===
// Добавляем или обновляем подписку в базе
router.post('/subscribe', (req: any, res: Response) => {
    const sub = req.body;
    const { endpoint, keys } = sub;
    const { sessionId, id } = req.user;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      res.status(400).json({ error: 'Неверный формат подписки' });
      return;
    }

    const query = `
        INSERT INTO subscriptions (endpoint, keys_p256dh, keys_auth, session_id, user_id)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(endpoint) DO UPDATE SET keys_p256dh = excluded.keys_p256dh, keys_auth = excluded.keys_auth
    `;

    db.run(query, [endpoint, keys.p256dh, keys.auth, sessionId, id], (err: Error | null) => {
      if (err) {
        console.error('Ошибка при сохранении подписки:', err);
        res.status(500).json({ error: 'Ошибка базы данных' });
        return;
      }
      res.status(201).json({ message: 'Подписка сохранена' });
    });
});

// === POST /notify ===
// Отправляем уведомления всем пользователям
router.post('/notify', requireWriteAccess, (req: any, res: Response) => {
  const {
    title = 'Новое изображение!',
    body = 'Админ добавил картинку',
    icon = '/icons/icon_x192.png',
    url = '/',
    sessionIds,
    userIds,
    excludeUserIds,
    excludeSessionIds,
    permissions
  } = req.body;

    const payload = {
        title,
        body,
        icon,
        url
    };

    sendNotifications(payload, { userIds, sessionIds, excludeUserIds, excludeSessionIds, permissions }).then((data) => {
        res.json(data);
    }).catch((error) => {
        res.status(500).json({ error: error.message });
    });
});

export default router;