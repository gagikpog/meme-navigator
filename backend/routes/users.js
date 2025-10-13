const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const router = express.Router();

// Получить всех пользователей (только для админов)
router.get('/', (req, res) => {
  const { page = 1, limit = 10, search = '', role = '', blocked = '' } = req.query;
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE 1=1';
  let params = [];

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
  db.get(
    `SELECT COUNT(*) as total FROM users ${whereClause}`,
    params,
    (err, countResult) => {
      if (err) {
        return res.status(500).json({ message: 'Ошибка базы данных' });
      }

      // Получаем пользователей с пагинацией
      db.all(
        `SELECT id, username, name, surname, role, is_blocked, created_at, last_login
         FROM users ${whereClause}
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset],
        (err, users) => {
          if (err) {
            return res.status(500).json({ message: 'Ошибка базы данных' });
          }

          res.json({
            users,
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total: countResult.total,
              pages: Math.ceil(countResult.total / limit)
            }
          });
        }
      );
    }
  );
});

// Получить пользователя по ID
router.get('/:id', (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT id, username, role, is_blocked, created_at, last_login
     FROM users WHERE id = ?`,
    [id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ message: 'Ошибка базы данных' });
      }

      if (!user) {
        return res.status(404).json({ message: 'Пользователь не найден' });
      }

      res.json(user);
    }
  );
});

// Создать нового пользователя
router.post('/', async (req, res) => {
  try {
    const { username, password, name, surname, role = 'user' } = req.body;

    if (!username || !password || !name || !surname) {
      return res.status(400).json({ message: 'Логин, пароль, имя и фамилия обязательны' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Пароль должен содержать минимум 6 символов' });
    }

    // Проверяем, существует ли пользователь
    db.get(
      'SELECT id FROM users WHERE username = ?',
      [username],
      async (err, existingUser) => {
        if (err) {
          return res.status(500).json({ message: 'Ошибка базы данных' });
        }

        if (existingUser) {
          return res.status(400).json({ message: 'Пользователь с таким логином уже существует' });
        }

        // Хешируем пароль
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        // Создаем пользователя
        db.run(
          'INSERT INTO users (username, password_hash, name, surname, role) VALUES (?, ?, ?, ?, ?)',
          [username, password_hash, name, surname, role],
          function(err) {
            if (err) {
              return res.status(500).json({ message: 'Ошибка создания пользователя' });
            }

            res.status(201).json({
              message: 'Пользователь успешно создан',
              user: {
                id: this.lastID,
                username,
                role
              }
            });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Обновить пользователя
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, name, surname, password, role, is_blocked } = req.body;

    // Проверяем, существует ли пользователь
    db.get(
      'SELECT id, username FROM users WHERE id = ?',
      [id],
      async (err, user) => {
        if (err) {
          return res.status(500).json({ message: 'Ошибка базы данных' });
        }

        if (!user) {
          return res.status(404).json({ message: 'Пользователь не найден' });
        }

        // Проверяем уникальность username, если он изменился
        if (username && username !== user.username) {
          db.get(
            'SELECT id FROM users WHERE username = ? AND id != ?',
            [username, id],
            (err, existingUser) => {
              if (err) {
                return res.status(500).json({ message: 'Ошибка базы данных' });
              }

              if (existingUser) {
                return res.status(400).json({ message: 'Пользователь с таким логином уже существует' });
              }

              updateUser();
            }
          );
        } else {
          updateUser();
        }

        async function updateUser() {
          let updateFields = [];
          let params = [];

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
              return res.status(400).json({ message: 'Пароль должен содержать минимум 6 символов' });
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
            return res.status(400).json({ message: 'Нет данных для обновления' });
          }

          params.push(id);

          db.run(
            `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
            params,
            function(err) {
              if (err) {
                return res.status(500).json({ message: 'Ошибка обновления пользователя' });
              }

              res.json({
                message: 'Пользователь успешно обновлен',
                changes: this.changes
              });
            }
          );
        }
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Удалить пользователя
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  // Нельзя удалить самого себя
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ message: 'Нельзя удалить самого себя' });
  }

  db.get(
    'SELECT id FROM users WHERE id = ?',
    [id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ message: 'Ошибка базы данных' });
      }

      if (!user) {
        return res.status(404).json({ message: 'Пользователь не найден' });
      }

      db.run(
        'DELETE FROM users WHERE id = ?',
        [id],
        function(err) {
          if (err) {
            return res.status(500).json({ message: 'Ошибка удаления пользователя' });
          }

          res.json({
            message: 'Пользователь успешно удален',
            changes: this.changes
          });
        }
      );
    }
  );
});

// Блокировать/разблокировать пользователя
router.patch('/:id/block', (req, res) => {
  const { id } = req.params;
  const { is_blocked } = req.body;

  // Нельзя заблокировать самого себя
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ message: 'Нельзя заблокировать самого себя' });
  }

  db.run(
    'UPDATE users SET is_blocked = ? WHERE id = ?',
    [is_blocked ? 1 : 0, id],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Ошибка обновления статуса пользователя' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: 'Пользователь не найден' });
      }

      res.json({
        message: `Пользователь ${is_blocked ? 'заблокирован' : 'разблокирован'}`,
        changes: this.changes
      });
    }
  );
});

// Получить активные сессии пользователя
router.get('/:id/sessions', (req, res) => {
  const { id } = req.params;

  db.all(
    `SELECT id, device_id, device_info, ip_address, user_agent,
            created_at, last_activity, is_active
     FROM user_sessions
     WHERE user_id = ? AND is_active = 1
     ORDER BY last_activity DESC`,
    [id],
    (err, sessions) => {
      if (err) {
        return res.status(500).json({ message: 'Ошибка базы данных' });
      }

      res.json({ sessions });
    }
  );
});

// Завершить сессию устройства
router.delete('/:id/sessions/:sessionId', (req, res) => {
  const { id, sessionId } = req.params;

  db.run(
    'UPDATE user_sessions SET is_active = 0 WHERE id = ? AND user_id = ?',
    [sessionId, id],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Ошибка завершения сессии' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: 'Сессия не найдена' });
      }

      res.json({
        message: 'Сессия успешно завершена',
        changes: this.changes
      });
    }
  );
});

module.exports = router;

