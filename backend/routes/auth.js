// server/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

const SECRET = process.env.JWT_SECRET || 'super-secret';

// Имитация пользователя из БД
const adminUser = {
  username: 'admin',
  passwordHash: bcrypt.hashSync('ELNbA3WNvC4LTzJ', 10) // 👈 пароль по умолчанию
};

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (username !== adminUser.username) return res.status(401).json({ message: 'Неверный логин или пароль' });

  const valid = await bcrypt.compare(password, adminUser.passwordHash);
  if (!valid) return res.status(401).json({ message: 'Неверный логин или пароль' });

  const token = jwt.sign({ username }, SECRET, { expiresIn: '90d' });
  res.json({ token });
});

module.exports = router;
