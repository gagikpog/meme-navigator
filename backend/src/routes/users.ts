import express, { Response } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import db from '../db/database';
import { AuthenticatedRequest, User } from '../types';
import { deleteImage } from '../utils/fileManager';
import { requireAdminAccess } from '../middleware/auth';

const router = express.Router();

// Конфигурация multer для загрузки аватаров
const avatarStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, 'public/images'),
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    },
});

const avatarUpload = multer({
    storage: avatarStorage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (_req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Только изображения разрешены для аватаров'));
        }
    },
});

// Получить всех пользователей (только для админов)
router.get('/', requireAdminAccess, (req: any, res: Response) => {
    const { page = 1, limit = 10, search = '', role = '', blocked = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = 'WHERE 1=1';
    let params: any[] = [];

    if (search) {
        whereClause += ' AND username LIKE ?';
        params.push(`%${search}%`);
    }

    if (role) {
        whereClause += ' AND role = ?';
        params.push(role);
    }

    if (blocked !== '') {
        whereClause += ' AND is_blocked = ?';
        params.push(blocked === 'true' ? 1 : 0);
    }

    // Получаем общее количество пользователей
    db.get(`SELECT COUNT(*) as total FROM users ${whereClause}`, params, (err: Error | null, countResult: any) => {
        if (err) {
            res.status(500).json({ message: 'Ошибка базы данных' });
            return;
        }

        // Получаем пользователей с пагинацией
        db.all(
            `SELECT id, username, name, surname, role, is_blocked, created_at, last_login, avatar
         FROM users ${whereClause}
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
            [...params, Number(limit), offset],
            (err: Error | null, users: User[]) => {
                if (err) {
                    res.status(500).json({ message: 'Ошибка базы данных' });
                    return;
                }

                res.json({
                    users,
                    pagination: {
                        page: parseInt(page as string),
                        limit: parseInt(limit as string),
                        total: countResult.total,
                        pages: Math.ceil(countResult.total / Number(limit)),
                    },
                });
            }
        );
    });
});

// Получить свои данные
router.get('/me', (req: any, res: Response) => {
    db.get(
        `SELECT id, username, name, surname, role, is_blocked, created_at, last_login, avatar
     FROM users WHERE id = ?`,
        [req.user.id],
        (err: Error | null, user: User) => {
            if (err) {
                res.status(500).json({ message: 'Ошибка базы данных' });
                return;
            }

            if (!user) {
                res.status(404).json({ message: 'Пользователь не найден' });
                return;
            }

            res.json(user);
        }
    );
});

// Получить пользователя по ID
router.get('/:id', requireAdminAccess, (req: any, res: Response) => {
    const { id } = (req as AuthenticatedRequest).params;
    db.get(
        `SELECT id, username, role, is_blocked, created_at, last_login, avatar
     FROM users WHERE id = ?`,
        [id],
        (err: Error | null, user: User) => {
            if (err) {
                res.status(500).json({ message: 'Ошибка базы данных' });
                return;
            }

            if (!user) {
                res.status(404).json({ message: 'Пользователь не найден' });
                return;
            }

            res.json(user);
        }
    );
});

// Создать нового пользователя
router.post('/', requireAdminAccess, avatarUpload.single('avatar'), async (req: any, res: Response) => {
    try {
        const { username, password, name, surname, role = 'user' } = req.body;
        const avatarFile = req.file;

        if (!username || !password || !name || !surname) {
            res.status(400).json({ message: 'Логин, пароль, имя и фамилия обязательны' });
            return;
        }

        if (password.length < 6) {
            res.status(400).json({ message: 'Пароль должен содержать минимум 6 символов' });
            return;
        }

        // Проверяем, существует ли пользователь
        db.get('SELECT id FROM users WHERE username = ?', [username], async (err: Error | null, existingUser: any) => {
            if (err) {
                res.status(500).json({ message: 'Ошибка базы данных' });
                return;
            }

            if (existingUser) {
                res.status(400).json({ message: 'Пользователь с таким логином уже существует' });
                return;
            }

            // Хешируем пароль
            const saltRounds = 10;
            const password_hash = await bcrypt.hash(password, saltRounds);

            // Создаем пользователя
            db.run(
                'INSERT INTO users (username, password_hash, name, surname, role, avatar) VALUES (?, ?, ?, ?, ?, ?)',
                [username, password_hash, name, surname, role, avatarFile?.filename || null],
                function (err: Error | null) {
                    if (err) {
                        res.status(500).json({ message: 'Ошибка создания пользователя' });
                        return;
                    }

                    res.status(201).json({
                        message: 'Пользователь успешно создан',
                        user: {
                            id: this.lastID,
                            username,
                            role,
                        },
                    });
                }
            );
        });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Обновить пользователя
router.put('/:id', requireAdminAccess, avatarUpload.single('avatar'), async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const { username, name, surname, password, role, is_blocked } = req.body;
        const avatarFile = req.file;

        // Проверяем, существует ли пользователь
        db.get('SELECT id, username, avatar FROM users WHERE id = ?', [id], async (err: Error | null, user: any) => {
            if (err) {
                res.status(500).json({ message: 'Ошибка базы данных' });
                return;
            }

            if (!user) {
                res.status(404).json({ message: 'Пользователь не найден' });
                return;
            }

            // Проверяем уникальность username, если он изменился
            if (username && username !== user.username) {
                db.get(
                    'SELECT id FROM users WHERE username = ? AND id != ?',
                    [username, id],
                    (err: Error | null, existingUser: any) => {
                        if (err) {
                            res.status(500).json({ message: 'Ошибка базы данных' });
                            return;
                        }

                        if (existingUser) {
                            res.status(400).json({ message: 'Пользователь с таким логином уже существует' });
                            return;
                        }

                        updateUser();
                    }
                );
            } else {
                updateUser();
            }

            async function updateUser() {
                let updateFields: string[] = [];
                let params: any[] = [];

                if (username) {
                    updateFields.push('username = ?');
                    params.push(username);
                }

                if (name) {
                    updateFields.push('name = ?');
                    params.push(name);
                }

                if (surname) {
                    updateFields.push('surname = ?');
                    params.push(surname);
                }

                if (password) {
                    if (password.length < 6) {
                        res.status(400).json({ message: 'Пароль должен содержать минимум 6 символов' });
                        return;
                    }
                    const saltRounds = 10;
                    const password_hash = await bcrypt.hash(password, saltRounds);
                    updateFields.push('password_hash = ?');
                    params.push(password_hash);
                }

                if (role !== undefined) {
                    updateFields.push('role = ?');
                    params.push(role);
                }

                if (is_blocked !== undefined) {
                    updateFields.push('is_blocked = ?');
                    params.push(is_blocked ? 1 : 0);
                }

                // Если загружен новый аватар
                if (avatarFile) {
                    // Удаляем старый аватар, если он существует
                    if (user.avatar) {
                        deleteImage(user.avatar);
                    }
                    updateFields.push('avatar = ?');
                    params.push(avatarFile.filename);
                }

                if (updateFields.length === 0) {
                    res.status(400).json({ message: 'Нет данных для обновления' });
                    return;
                }

                params.push(id);

                db.run(
                    `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
                    params,
                    function (err: Error | null) {
                        if (err) {
                            res.status(500).json({ message: 'Ошибка обновления пользователя' });
                            return;
                        }

                        res.json({
                            message: 'Пользователь успешно обновлен',
                            changes: this.changes,
                        });
                    }
                );
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Блокировать/разблокировать пользователя
router.patch('/:id/block', requireAdminAccess, (req: any, res: Response) => {
    const { id } = req.params;
    const { is_blocked } = req.body;

    // Нельзя заблокировать самого себя
    if (parseInt(id) === req.user['id']) {
        res.status(400).json({ message: 'Нельзя заблокировать самого себя' });
        return;
    }

    db.run('UPDATE users SET is_blocked = ? WHERE id = ?', [is_blocked ? 1 : 0, id], function (err: Error | null) {
        if (err) {
            res.status(500).json({ message: 'Ошибка обновления статуса пользователя' });
            return;
        }

        if (this.changes === 0) {
            res.status(404).json({ message: 'Пользователь не найден' });
            return;
        }

        res.json({
            message: `Пользователь ${is_blocked ? 'заблокирован' : 'разблокирован'}`,
            changes: this.changes,
        });
    });
});

// Получить активные сессии пользователя
router.get('/:id/sessions', requireAdminAccess, (req: any, res: Response) => {
    const { id } = req.params;

    db.all(
        `SELECT id, device_id, device_info, ip_address, user_agent,
            created_at, last_activity, is_active
     FROM user_sessions
     WHERE user_id = ? AND is_active = 1
     ORDER BY last_activity DESC`,
        [id],
        (err: Error | null, sessions: any[]) => {
            if (err) {
                res.status(500).json({ message: 'Ошибка базы данных' });
                return;
            }

            res.json({ sessions });
        }
    );
});

// Завершить сессию устройства
router.delete('/:id/sessions/:sessionId', requireAdminAccess, (req: any, res: Response) => {
    const { id, sessionId } = req.params;

    db.run(
        'UPDATE user_sessions SET is_active = 0 WHERE id = ? AND user_id = ?',
        [sessionId, id],
        function (err: Error | null) {
            if (err) {
                res.status(500).json({ message: 'Ошибка завершения сессии' });
                return;
            }

            if (this.changes === 0) {
                res.status(404).json({ message: 'Сессия не найдена' });
                return;
            }

            res.json({
                message: 'Сессия успешно завершена',
                changes: this.changes,
            });
        }
    );
});

export default router;
