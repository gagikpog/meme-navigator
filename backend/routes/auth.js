// server/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
require('dotenv').config();
const SECRET = process.env.JWT_SECRET;

// Имитация пользователя из БД
const adminUser = {
  username: process.env.ADMIN_USERNAME,
  passwordHash: process.env.ADMIN_PASSWORD_HASH
};

router.post('/login', async (req, res) => {
  if (!SECRET || !adminUser.username || !adminUser.passwordHash) {
    res.status(500).json({ message: 'Ошибка настройки сервера!' });
  } else {
    const { username, password } = req.body;
    if (username !== adminUser.username) {
      return res.status(401).json({ message: 'Неверный логин или пароль' })
    };
  
    const valid = await bcrypt.compare(password, adminUser.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Неверный логин или пароль' });
  
    const token = jwt.sign({ username }, SECRET, { expiresIn: '90d' });
    res.json({ token });
  }
});

module.exports = router;
