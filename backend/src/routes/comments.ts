import express, { Response } from 'express';
import db from '../db/database';
import { requireReadAccess } from '../middleware/auth';
import { AuthenticatedRequest, Comment } from '../types';

const router = express.Router();

// GET all comments for a meme (with hierarchy)
router.get('/meme/:memeId', requireReadAccess, (req: any, res: Response) => {
    const memeId = parseInt(req.params['memeId']);
    if (isNaN(memeId)) {
        res.status(400).json({ error: 'Invalid meme ID' });
        return;
    }

    const query = `
        SELECT 
            comments.*,
            users.name AS authorName,
            users.surname AS authorSurname,
            users.username AS authorUsername
        FROM comments
        LEFT JOIN users ON comments.user_id = users.id
        WHERE comments.meme_id = ?
        ORDER BY comments.created_at ASC
    `;

    db.all(query, [memeId], (err: Error | null, rows: Comment[]) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        // Проверяем, есть ли ответы у удаленных комментариев
        const hasReplies = (commentId: number): boolean => {
            return rows.some(c => c.parent_id === commentId);
        };

        // Преобразуем плоский список в иерархию
        const buildHierarchy = (comments: Comment[]): Comment[] => {
            const commentMap = new Map<number, Comment>();
            const rootComments: Comment[] = [];

            // Создаем карту комментариев
            comments.forEach(comment => {
                commentMap.set(comment.id, { ...comment, replies: [] });
            });

            // Строим дерево
            comments.forEach(comment => {
                const commentWithReplies = commentMap.get(comment.id)!;
                if (comment.parent_id) {
                    const parent = commentMap.get(comment.parent_id);
                    if (parent) {
                        if (!parent.replies) parent.replies = [];
                        parent.replies.push(commentWithReplies);
                    }
                } else {
                    rootComments.push(commentWithReplies);
                }
            });

            return rootComments;
        };

        // Если комментарий удален, но у него есть ответы, все равно показываем его
        const processedRows = rows.map(comment => {
            if (comment.is_deleted && hasReplies(comment.id)) {
                return { ...comment, text: 'Комментарий удален' };
            }
            return comment;
        });

        const hierarchicalComments = buildHierarchy(processedRows);
        res.json(hierarchicalComments);
    });
});

// POST create a new comment (or reply)
router.post('/', requireReadAccess, (req: any, res: Response) => {
    const { meme_id, text, parent_id } = req.body;
    const { user } = req as AuthenticatedRequest;

    if (!meme_id || !text || typeof text !== 'string' || text.trim() === '') {
        res.status(400).json({ error: 'meme_id and text are required' });
        return;
    }

    // Если указан parent_id, проверяем что родительский комментарий существует и не удален
    if (parent_id) {
        db.get('SELECT * FROM comments WHERE id = ? AND meme_id = ?', [parent_id, meme_id], (err: Error | null, parent: Comment) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            if (!parent) {
                res.status(404).json({ error: 'Parent comment not found' });
                return;
            }
            createComment();
        });
    } else {
        createComment();
    }

    function createComment() {
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

            const insertQuery = parent_id
                ? 'INSERT INTO comments (meme_id, user_id, text, parent_id) VALUES (?, ?, ?, ?)'
                : 'INSERT INTO comments (meme_id, user_id, text) VALUES (?, ?, ?)';
            
            const insertParams = parent_id
                ? [meme_id, user.id, text.trim(), parent_id]
                : [meme_id, user.id, text.trim()];

            db.run(insertQuery, insertParams, function (err: Error | null) {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }

                // Возвращаем созданный комментарий с данными автора
                db.get(
                    `SELECT 
                        comments.*,
                        users.name AS authorName,
                        users.surname AS authorSurname,
                        users.username AS authorUsername
                    FROM comments
                    LEFT JOIN users ON comments.user_id = users.id
                    WHERE comments.id = ?`,
                    [this.lastID],
                    (err: Error | null, comment: Comment) => {
                        if (err) {
                            res.status(500).json({ error: err.message });
                            return;
                        }
                        res.status(201).json(comment);
                    }
                );
            });
        });
    }
});

// PUT update a comment (only by author, even admin cannot edit others' comments)
router.put('/:id', requireReadAccess, (req: any, res: Response) => {
    const commentId = parseInt(req.params['id']);
    const { text } = req.body;
    const { user } = req as AuthenticatedRequest;

    if (isNaN(commentId)) {
        res.status(400).json({ error: 'Invalid comment ID' });
        return;
    }

    if (!text || typeof text !== 'string' || text.trim() === '') {
        res.status(400).json({ error: 'text is required' });
        return;
    }

    // Проверяем, существует ли комментарий и принадлежит ли он пользователю
    db.get('SELECT * FROM comments WHERE id = ?', [commentId], (err: Error | null, comment: Comment) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!comment) {
            res.status(404).json({ error: 'Comment not found' });
            return;
        }
        if (comment.is_deleted) {
            res.status(400).json({ error: 'Cannot edit deleted comment' });
            return;
        }
        // Только автор может редактировать, даже админ не может
        if (comment.user_id !== user.id) {
            res.status(403).json({ error: 'You can only edit your own comments' });
            return;
        }

        db.run('UPDATE comments SET text = ? WHERE id = ?', [text.trim(), commentId], function (err: Error | null) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            // Возвращаем обновленный комментарий
            db.get(
                `SELECT 
                    comments.*,
                    users.name AS authorName,
                    users.surname AS authorSurname,
                    users.username AS authorUsername
                FROM comments
                LEFT JOIN users ON comments.user_id = users.id
                WHERE comments.id = ?`,
                [commentId],
                (err: Error | null, comment: Comment) => {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }
                    res.json(comment);
                }
            );
        });
    });
});

// DELETE a comment (soft delete - only by author, admin, or moderator)
router.delete('/:id', requireReadAccess, (req: any, res: Response) => {
    const commentId = parseInt(req.params['id']);
    const { user } = req as AuthenticatedRequest;

    if (isNaN(commentId)) {
        res.status(400).json({ error: 'Invalid comment ID' });
        return;
    }

    // Проверяем, существует ли комментарий и права доступа
    db.get('SELECT * FROM comments WHERE id = ?', [commentId], (err: Error | null, comment: Comment) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!comment) {
            res.status(404).json({ error: 'Comment not found' });
            return;
        }
        if (comment.user_id !== user.id && user.role !== 'admin' && user.role !== 'moderator') {
            res.status(403).json({ error: 'You can only delete your own comments' });
            return;
        }

        // Мягкое удаление - помечаем как удаленный
        // Если есть ответы, все равно помечаем как удаленный, но текст будет заменен на "Комментарий удален"
        db.run('UPDATE comments SET is_deleted = 1 WHERE id = ?', [commentId], function (err: Error | null) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            // Возвращаем обновленный комментарий
            db.get(
                `SELECT 
                    comments.*,
                    users.name AS authorName,
                    users.surname AS authorSurname,
                    users.username AS authorUsername
                FROM comments
                LEFT JOIN users ON comments.user_id = users.id
                WHERE comments.id = ?`,
                [commentId],
                (err: Error | null, deletedComment: Comment) => {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }
                    res.json({ deleted: this.changes, comment: deletedComment });
                }
            );
        });
    });
});

export default router;

