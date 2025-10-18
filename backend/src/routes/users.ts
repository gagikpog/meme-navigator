import express, { Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/database';
import { User } from '../types';

const router = express.Router();

// Получить всех пользователей (только для админов)
router.get('/', (req: any, res: Response) => {
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
            `SELECT id, username, name, surname, role, is_blocked, created_at, last_login
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

// Получить пользователя по ID
router.get('/:id', (req: any, res: Response) => {
    const { id } = req.params;

    db.get(
        `SELECT id, username, role, is_blocked, created_at, last_login
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
router.post('/', async (req: any, res: Response) => {
    try {
        const { username, password, name, surname, role = 'user' } = req.body;

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
                'INSERT INTO users (username, password_hash, name, surname, role) VALUES (?, ?, ?, ?, ?)',
                [username, password_hash, name, surname, role],
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
router.put('/:id', async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const { username, name, surname, password, role, is_blocked } = req.body;

        // Проверяем, существует ли пользователь
        db.get('SELECT id, username FROM users WHERE id = ?', [id], async (err: Error | null, user: any) => {
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

// Удалить пользователя
router.delete('/:id', (req: any, res: Response) => {
    const { id } = req.params;

    // Нельзя удалить самого себя
    if (parseInt(id) === req.user['id']) {
        res.status(400).json({ message: 'Нельзя удалить самого себя' });
        return;
    }

    db.get('SELECT id FROM users WHERE id = ?', [id], (err: Error | null, user: any) => {
        if (err) {
            res.status(500).json({ message: 'Ошибка базы данных' });
            return;
        }

        if (!user) {
            res.status(404).json({ message: 'Пользователь не найден' });
            return;
        }

        db.run('DELETE FROM users WHERE id = ?', [id], function (err: Error | null) {
            if (err) {
                res.status(500).json({ message: 'Ошибка удаления пользователя' });
                return;
            }

            res.json({
                message: 'Пользователь успешно удален',
                changes: this.changes,
            });
        });
    });
});

// Блокировать/разблокировать пользователя
router.patch('/:id/block', (req: any, res: Response) => {
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
router.get('/:id/sessions', (req: any, res: Response) => {
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
router.delete('/:id/sessions/:sessionId', (req: any, res: Response) => {
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
