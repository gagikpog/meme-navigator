import express, { Response } from 'express';
import db from '../db/database';
import { requireReadAccess } from '../middleware/auth';
import { AuthenticatedRequest, Rating } from '../types';

const router = express.Router();

// GET rating for a specific meme by current user
router.get('/meme/:memeId', requireReadAccess, (req: any, res: Response) => {
    const memeId = parseInt(req.params['memeId']);
    const { user } = req as AuthenticatedRequest;

    if (isNaN(memeId)) {
        res.status(400).json({ error: 'Invalid meme ID' });
        return;
    }

    db.get('SELECT * FROM ratings WHERE meme_id = ? AND user_id = ?', [memeId, user.id], (err: Error | null, rating: Rating) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        // Если оценки нет, возвращаем null (что означает 0 - без оценки)
        res.json(rating || { rating: 0 });
    });
});

// GET rating statistics for a meme (likes and dislikes count)
router.get('/meme/:memeId/stats', requireReadAccess, (req: any, res: Response) => {
    const memeId = parseInt(req.params['memeId']);

    if (isNaN(memeId)) {
        res.status(400).json({ error: 'Invalid meme ID' });
        return;
    }

    const query = `
        SELECT 
            COUNT(CASE WHEN rating = 5 THEN 1 END) AS likesCount,
            COUNT(CASE WHEN rating = -5 THEN 1 END) AS dislikesCount
        FROM ratings
        WHERE meme_id = ?
    `;

    db.get(query, [memeId], (err: Error | null, stats: { likesCount: number; dislikesCount: number }) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({
            likesCount: stats.likesCount || 0,
            dislikesCount: stats.dislikesCount || 0,
        });
    });
});

// GET users who liked or disliked a meme (loaded on-demand for tooltip)
router.get('/meme/:memeId/users', requireReadAccess, (req: any, res: Response) => {
    const memeId = parseInt(req.params['memeId']);
    const type = (req.query?.type as string) || 'like';

    if (isNaN(memeId)) {
        res.status(400).json({ error: 'Invalid meme ID' });
        return;
    }

    const ratingValue = type === 'dislike' ? -5 : type === 'like' ? 5 : null;
    if (ratingValue === null) {
        res.status(400).json({ error: 'Invalid reaction type. Use like or dislike' });
        return;
    }

    const query = `
        SELECT 
            u.id,
            u.username,
            u.name,
            u.surname,
            u.avatar,
            u.role
        FROM ratings r
        JOIN users u ON r.user_id = u.id
        WHERE r.meme_id = ? AND r.rating = ?
        ORDER BY r.created_at DESC
        LIMIT 100
    `;

    db.all(query, [memeId, ratingValue], (err: Error | null, users: any[]) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        res.json({ users: users || [] });
    });
});

// POST/PUT create or update a rating
router.post('/', requireReadAccess, (req: any, res: Response) => {
    const { meme_id, rating } = req.body;
    const { user } = req as AuthenticatedRequest;

    if (!meme_id || rating === undefined) {
        res.status(400).json({ error: 'meme_id and rating are required' });
        return;
    }

    // Проверяем, что rating имеет допустимое значение
    if (![-5, 0, 5].includes(rating)) {
        res.status(400).json({ error: 'rating must be -5 (dislike), 0 (no rating), or 5 (like)' });
        return;
    }

    // Проверяем, существует ли мем
    db.get('SELECT id FROM memes WHERE id = ?', [meme_id], (err: Error | null, meme: { id: number } | undefined) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!meme) {
            res.status(404).json({ error: 'Meme not found' });
            return;
        }

        // Проверяем, существует ли уже оценка от этого пользователя
        db.get('SELECT * FROM ratings WHERE meme_id = ? AND user_id = ?', [meme_id, user.id], (err: Error | null, existingRating: Rating) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            if (existingRating) {
                // Обновляем существующую оценку
                if (rating === 0) {
                    // Если оценка 0, удаляем запись
                    db.run('DELETE FROM ratings WHERE meme_id = ? AND user_id = ?', [meme_id, user.id], function (err: Error | null) {
                        if (err) {
                            res.status(500).json({ error: err.message });
                            return;
                        }
                        res.json({ rating: 0, deleted: true });
                    });
                } else {
                    // Обновляем оценку
                    db.run(
                        'UPDATE ratings SET rating = ?, updated_at = CURRENT_TIMESTAMP WHERE meme_id = ? AND user_id = ?',
                        [rating, meme_id, user.id],
                        function (err: Error | null) {
                            if (err) {
                                res.status(500).json({ error: err.message });
                                return;
                            }
                            db.get('SELECT * FROM ratings WHERE meme_id = ? AND user_id = ?', [meme_id, user.id], (err: Error | null, updatedRating: Rating) => {
                                if (err) {
                                    res.status(500).json({ error: err.message });
                                    return;
                                }
                                res.json(updatedRating);
                            });
                        }
                    );
                }
            } else {
                // Создаем новую оценку (только если rating не 0)
                if (rating === 0) {
                    res.json({ rating: 0 });
                    return;
                }

                db.run(
                    'INSERT INTO ratings (meme_id, user_id, rating) VALUES (?, ?, ?)',
                    [meme_id, user.id, rating],
                    function (err: Error | null) {
                        if (err) {
                            res.status(500).json({ error: err.message });
                            return;
                        }

                        db.get('SELECT * FROM ratings WHERE id = ?', [this.lastID], (err: Error | null, newRating: Rating) => {
                            if (err) {
                                res.status(500).json({ error: err.message });
                                return;
                            }
                            res.status(201).json(newRating);
                        });
                    }
                );
            }
        });
    });
});

export default router;

