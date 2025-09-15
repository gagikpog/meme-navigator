const express = require('express');
const cors = require('cors');
const path = require('path');
const { auth, requireAdminAccess } = require('./middleware/auth');
const memeRoutes = require('./routes/memes');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8003;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Trust proxy for accurate IP addresses
app.set('trust proxy', true);

app.use('/meme/api/auth', authRoutes);
app.use('/meme/images', auth, express.static(path.join(__dirname, 'public/images')));

// Routes
app.use('/meme/api/memes', auth, memeRoutes);
app.use('/meme/api/users', auth, requireAdminAccess, userRoutes);

// Обработка 404 - маршрут не найден
app.use((req, res, next) => {
  res.status(404).json({ message: `Маршрут "${req.path}" не найден` });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
