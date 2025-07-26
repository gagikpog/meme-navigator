const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'super-secret';

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Нет токена' });

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(403).json({ message: 'Неверный токен' });
  }
};
