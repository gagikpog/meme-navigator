import express, { Response } from 'express';
import multer from 'multer';
import db from '../db/database';
import { requireReadAccess, requireWriteAccess } from '../middleware/auth';
import sendNotifications from '../utils/sendNotifications';
import { deleteImage } from '../utils/fileManager';
import { AuthenticatedRequest, Meme, TPermissions } from '../types';

const router = express.Router();

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, 'public/images'),
    filename: (_req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
});

// GET all memes - доступно всем аутентифицированным пользователям
router.get('/', requireReadAccess, (req: any, res: Response) => {
    // Админы видят все мемы
    let query = `
        SELECT
            memes.*, users.name AS authorName, users.surname as authorSurname, users.username as authorUsername
        FROM memes
        LEFT JOIN users
            ON memes.user_id = users.id
    `;
    let params: any[] = [];
    const { user } = req as AuthenticatedRequest

    if (user.role === 'user') {
        // Пользователи видят только публичные мемы
        query += 'WHERE memes.permissions = ?';
        params.push('public');
    } else if (user.role === 'writer') {
        // Редактор видит свои и публичные мемы 
        query += 'WHERE memes.permissions = ? OR user_id = ?';
        params.push('public', user.id);
    }

    query += ' ORDER BY created_at DESC';

    db.all(query, params, (err: Error | null, rows: Meme[]) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        const safeRows = rows.map((meme: Meme) => {
            let parsedTags: string[] = [];
            if (meme.tags) {
                try {
                    parsedTags = JSON.parse(meme.tags);
                } catch {
                    parsedTags = [];
                }
            }
            return { ...meme, tags: parsedTags };
        });
        res.json(safeRows);
    });
});

// GET one meme - доступно всем аутентифицированным пользователям
router.get('/:id', requireReadAccess, (req: any, res: Response) => {

    const { user } = req as AuthenticatedRequest;

    db.get('SELECT * FROM memes WHERE id = ?', [req.params['id']], (err: Error | null, row: Meme) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Meme not found' });
            return;
        }

        const isSelfRecord = row.user_id === user.id
        const hasViewRight = user.role === 'admin' || user.role === 'moderator' || row.permissions === 'public';

        // Проверяем права доступа
        if (hasViewRight || isSelfRecord) {
            try {
                (row as any).tags = row.tags ? JSON.parse(row.tags) : [];
            } catch {
                (row as any).tags = [];
            }
            res.json(row);
            return;
        }

        res.status(403).json({ error: 'Недостаточно прав для доступа к этому мему' });
        return;
    });
});

router.post('/', requireWriteAccess, upload.single('image'), (req: any, res: Response) => {
    const { tags, description } = req.body;
    let { permissions = 'public' }: { permissions:TPermissions } = req.body;
    const { user } = req as AuthenticatedRequest;
    const fileName = req.file?.filename;

    if (!fileName) {
        res.status(400).json({ error: 'No image uploaded' });
        return;
    }

    let tagArray: string[] = [];
    if (typeof tags === 'string') {
        try {
            tagArray = JSON.parse(tags);
        } catch {
            tagArray = [];
        }
    } else if (Array.isArray(tags)) {
        tagArray = tags;
    }

    const allowedPermissions: TPermissions[] = ['public', 'private', 'moderate'];

    // публикация редактора сначала должна пройти модерацию
    if (user.role === 'writer') {
        permissions = 'moderate';
    }

    if (!allowedPermissions.includes(permissions)) {
        res.status(400).json({ error: 'Недопустимое значение permissions. Разрешены: public, private, moderate' });
        return;
    }

    db.run(
        'INSERT INTO memes (fileName, tags, description, permissions, user_id) VALUES (?, ?, ?, ?, ?)',
        [fileName, JSON.stringify(tagArray), description || '', permissions, user.id],
        function (err: Error | null) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            sendNotifications(
                {
                    title: 'Новое изображение!',
                    body: (tagArray || []).map((tag) => `#${tag}`).join(' ') || description || 'без тегов',
                    icon: '/icons/icon_x192.png',
                    url: `/meme/${fileName}`,
                },
                {
                    permissions: permissions === 'public' ? [] : ['admin', 'moderator'],
                    excludeUserIds: [user.id],
                }
            );

            res.status(201).json({
                id: this.lastID,
                fileName,
                tags: tagArray,
                description,
                permissions,
            });
        }
    );
});

router.put('/:id', requireWriteAccess, (req: any, res: Response) => {
    const { tags: updateTags, description } = req.body;
    let { permissions }: { permissions: TPermissions } = req.body;
    const { user } = req as AuthenticatedRequest;
    let tagArrayStr = '[]';
    if (typeof updateTags === 'string') {
        try {
            const parsed = JSON.parse(updateTags);
            tagArrayStr = JSON.stringify(Array.isArray(parsed) ? parsed : []);
        } catch {
            tagArrayStr = '[]';
        }
    } else if (Array.isArray(updateTags)) {
        tagArrayStr = JSON.stringify(updateTags);
    }

    // Сначала проверяем, существует ли мем
    db.get('SELECT * FROM memes WHERE id = ?', [req.params['id']], (err: Error | null, meme: Meme) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!meme) {
            res.status(404).json({ error: 'Meme not found' });
            return;
        }

        if (user.role === 'writer' && meme.user_id !== user.id) {
            res.status(403).json({ error: 'У вас нет прав на редактирование этого мема!' });
            return;
        }

        // Если пытаются изменить права доступа
        if (permissions) {
            const allowedPermissions: TPermissions[] = ['public', 'private', 'moderate'];

            if (user.role === 'writer') {
                permissions = 'moderate';
            }

            if (!allowedPermissions.includes(permissions)) {
                res.status(400).json({ error: 'Недопустимое значение permissions. Разрешены: public, private, moderate' });
                return;
            }
        }

        const updateQuery = permissions
            ? 'UPDATE memes SET tags = ?, description = ?, permissions = ? WHERE id = ?'
            : 'UPDATE memes SET tags = ?, description = ? WHERE id = ?';

        const updateParams = permissions
            ? [tagArrayStr, description || '', permissions, req.params['id']]
            : [tagArrayStr, description || '', req.params['id']];

        db.run(updateQuery, updateParams, function (err: Error | null) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            if (permissions !== meme.permissions && permissions === 'public') {
                let tagArray: string[] = [];

                try {
                    tagArray = updateTags.length ? updateTags : JSON.parse(meme.tags);
                } catch {}

                sendNotifications(
                    {
                        title: 'Новое изображение!',
                        body: (tagArray || []).map((tag) => `#${tag}`).join(' ') || description || 'без тегов',
                        icon: '/icons/icon_x192.png',
                        url: `/meme/${meme.fileName}`,
                    },
                    { permissions: ['user'], excludeUserIds: [user.id] }
                );
            }

            res.json({ updated: this.changes });
        });
    });
});

// DELETE meme - только для администраторов
router.delete('/:id', requireWriteAccess, (req: any, res: Response) => {
    const { user } = req as AuthenticatedRequest;

    // Сначала проверяем, существует ли мем
    db.get('SELECT * FROM memes WHERE id = ?', [req.params['id']], (err: Error | null, meme: Meme) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!meme) {
            res.status(404).json({ error: 'Meme not found' });
            return;
        }

        if (user.role === 'moderator') {
            if (meme.user_id !== user.id) {
                res.status(403).json({ error: 'У вас нет прав на удаление этого мема' });
                return;
            } else if (meme.permissions === 'public') {
                res.status(403).json({ error: 'Вы не можете удалить опубликованный мем' });
                return;
            }
        }

        db.run('DELETE FROM memes WHERE id = ?', [req.params['id']], function (err: Error | null) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ deleted: this.changes });
            deleteImage(meme.fileName);
        });
    });
});

export default router;
