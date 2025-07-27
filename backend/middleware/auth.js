const jwt = require('jsonwebtoken');
const { ERROR } = require('sqlite3');
require('dotenv').config();
const SECRET = process.env.JWT_SECRET;

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Нет токена' });

  try {
    if (!SECRET) {
      throw new ERROR('JWT_SECRET is empty');
      console.error('JWT_SECRET is empty');
    }
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(403).json({ message: 'Неверный токен' });
  }
};
