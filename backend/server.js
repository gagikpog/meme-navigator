const express = require('express');
const cors = require('cors');
const path = require('path');
const { auth, requireAdminAccess, authQueryFallback } = require('./middleware/auth');
const memeRoutes = require('./routes/memes');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const { addClient, removeClient } = require('./notifications/hub');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8003;
const ALLOWED_ORIGINS = [
  'https://meme.gagikpog.ru',
  'https://gagikpog-api.ru',
  'http://localhost:3000',
  'http://localhost:8003',
];

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'device-id'],
    exposedHeaders: [],
    maxAge: 86400,
  })
);

// Explicit preflight short-circuit before auth to avoid wildcard route parsing issues
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Trust proxy for accurate IP addresses
app.set('trust proxy', true);

app.use('/meme/api/auth', authRoutes);
app.use('/meme/images', auth, express.static(path.join(__dirname, 'public/images')));

// Routes
app.use('/meme/api/memes', auth, memeRoutes);
app.use('/meme/api/users', auth, requireAdminAccess, userRoutes);

// SSE notifications endpoint
app.get('/meme/api/notifications', authQueryFallback, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // initial comment to establish stream
  res.write(': connected\n\n');

  const client = { res, user: req.user };
  addClient(client);

  // heartbeat to keep the connection alive through proxies
  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      // ignore
    }
  }, 25000);

  req.on('close', () => {
    removeClient(client);
    clearInterval(heartbeat);
  });
});

// Обработка 404 - маршрут не найден
app.use((req, res, next) => {
  res.status(404).json({ message: `Маршрут "${req.path}" не найден` });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
