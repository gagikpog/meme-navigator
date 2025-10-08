const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const router = express.Router();
const webpush = require('web-push');
const sendNotifications = require('../utils/sendNotifications');

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
    const payload = {
        title: 'Новое изображение!',
        body: 'Админ добавил картинку',
        icon: '/icons/icon_x192.png',
        url: '/'
    };

    sendNotifications(payload).then((data) => {
        res.json(data);
    }).catch((error) => {
        res.status(500).json({ error: error.message });
    });
});

module.exports = router;
