import express from 'express';
import cors from 'cors';
import webpush from 'web-push';
import path from 'path';
import { auth, authWithoutDeviceId } from './middleware/auth';
import memeRoutes from './routes/memes';
import pushRoutes from './routes/push';
import rssRoutes from './routes/rss';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import commentRoutes from './routes/comments';
import ratingRoutes from './routes/ratings';

require('dotenv').config();

const app = express();
const PORT = process.env['PORT'] || 4000;
const ALLOWED_ORIGINS = [
    'https://meme.gagikpog.ru',
    'https://gagikpog-api.ru',
    'http://localhost:3000',
    'http://localhost:4000',
];

webpush.setVapidDetails('mailto:gagikpog@gagikpog.ru', process.env['VAPID_PUBLIC']!, process.env['VAPID_PRIVATE']!);

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
        res.sendStatus(204);
        return;
    }
    next();
});
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Trust proxy for accurate IP addresses
app.set('trust proxy', true);

app.use('/meme/images', authWithoutDeviceId, (req: any, res) => {
    const staticMiddleware = express.static(path.join(__dirname, '../public/images'));
    staticMiddleware(req, res, (err) => {
        if (err || res.headersSent) return;
        // Файл не найден — отдаем заглушку
        res.sendFile(path.join(__dirname, '../public/404.png'));
    });
});

// Routes
app.use('/meme/api/auth', authRoutes);
app.use('/meme', authWithoutDeviceId, rssRoutes); // public RSS at /meme/rss.xml
app.use('/meme/api/memes', auth, memeRoutes);
app.use('/meme/api/users', auth, userRoutes);
app.use('/meme/api/comments', auth, commentRoutes);
app.use('/meme/api/ratings', auth, ratingRoutes);
app.use('/meme/push', pushRoutes);

// Обработка 404 - маршрут не найден
app.use((req, res) => {
    res.status(404).json({ message: `Маршрут "${req.path}" не найден` });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
