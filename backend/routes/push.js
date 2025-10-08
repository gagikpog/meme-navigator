const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const router = express.Router();
const webpush = require('web-push');

// === POST /subscribe ===
// Добавляем или обновляем подписку в базе
router.post('/subscribe', (req, res) => {
    const sub = req.body;
    const { endpoint, keys } = sub;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ error: 'Неверный формат подписки' });
    }

    const query = `
        INSERT INTO subscriptions (endpoint, keys_p256dh, keys_auth)
        VALUES (?, ?, ?)
        ON CONFLICT(endpoint) DO UPDATE SET keys_p256dh = excluded.keys_p256dh, keys_auth = excluded.keys_auth
    `;

    db.run(query, [endpoint, keys.p256dh, keys.auth], err => {
      if (err) {
        console.error('Ошибка при сохранении подписки:', err);
        return res.status(500).json({ error: 'Ошибка базы данных' });
      }
      console.log('💾 Подписка сохранена:', endpoint);
      res.status(201).json({ message: 'Подписка сохранена' });
    });
});

// === POST /notify ===
// Отправляем уведомления всем пользователям
router.post('/notify', (req, res) => {
    const payload = JSON.stringify({
      title: 'Новое изображение!',
      body: 'Администратор добавил новое изображение.',
      icon: '/icon.png',
      url: '/images'
    });

    db.all('SELECT * FROM subscriptions', async (err, rows) => {
      if (err) {
        console.error('Ошибка чтения подписок:', err);
        return res.status(500).json({ error: 'Ошибка базы данных' });
      }

      console.log(`notify to ${rows.length} subscriptions`, rows);

      const results = await Promise.all(
        rows.map(async sub => {
          const subscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys_p256dh,
              auth: sub.keys_auth
            }
          };

          try {
            await webpush.sendNotification(subscription, payload);
            return { endpoint: sub.endpoint, status: 'ok' };
          } catch (err) {
            console.error('Ошибка Push:', err.statusCode, err, sub.endpoint);

            // Если подписка больше неактуальна — удаляем
            if (err.statusCode === 410 || err.statusCode === 404) {
              db.run('DELETE FROM subscriptions WHERE endpoint = ?', [sub.endpoint]);
              console.log('🗑 Удалена устаревшая подписка:', sub.endpoint);
            }
            return { endpoint: sub.endpoint, status: 'failed' };
          }
        })
      );

      res.json({ message: 'Уведомления отправлены', results });
    });
});
module.exports = router;
