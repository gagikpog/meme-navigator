const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../db/database');
const { requireReadAccess, requireWriteAccess } = require('../middleware/auth');
const sendNotifications = require('../utils/sendNotifications');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/images'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  }
});

// GET all memes - доступно всем аутентифицированным пользователям
router.get('/', requireReadAccess, (req, res) => {
  // Пользователи видят только публичные мемы
  // Админы видят все мемы
  let query = 'SELECT * FROM memes WHERE permissions = ?';
  let params = ['public'];

  if (req.user.role === 'admin' || req.user.role === 'writer') {
    query = 'SELECT * FROM memes';
    params = [];
  }

  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const safeRows = rows.map((meme) => {
      let parsedTags = [];
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
router.get('/:id', requireReadAccess, (req, res) => {
  db.get('SELECT * FROM memes WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Meme not found' });

    // Проверяем права доступа
    if ((req.user.role !== 'admin' && req.user.role !== 'writer') && row.permissions === 'private') {
      return res.status(403).json({ error: 'Недостаточно прав для доступа к этому мему' });
    }

    try {
      row.tags = row.tags ? JSON.parse(row.tags) : [];
    } catch {
      row.tags = [];
    }
    res.json(row);
  });
});

// CREATE meme - только для администраторов
router.post('/', requireWriteAccess, upload.single('image'), (req, res) => {
  const { tags, description, permissions = 'public' } = req.body;
  const fileName = req.file?.filename;

  if (!fileName) return res.status(400).json({ error: 'No image uploaded' });

  let tagArray = [];
  if (typeof tags === 'string') {
    try {
      tagArray = JSON.parse(tags);
    } catch {
      tagArray = [];
    }
  } else if (Array.isArray(tags)) {
    tagArray = tags;
  }

  // Админы могут создавать мемы с любыми правами (public, private)
  const allowedPermissions = ['public', 'private'];

  if (!allowedPermissions.includes(permissions)) {
    return res.status(400).json({ error: 'Недопустимое значение permissions. Разрешены: public, private' });
  }

  db.run(
    'INSERT INTO memes (fileName, tags, description, permissions) VALUES (?, ?, ?, ?)',
    [fileName, JSON.stringify(tagArray), description || '', permissions],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message })
      };

      sendNotifications({
        title: 'Новое изображение!',
        body: (tagArray || []).map((tag) => `#${tag}`).join(' ') || description || 'без тегов',
        icon: '/icons/icon_x192.png',
        url: `/meme/${fileName}`,
      }, {
        permissions: permissions === 'public' ? [] : ['admin', 'writer'],
        excludeUserIds: [req.user.id]
      });

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

// UPDATE meme - только для администраторов
router.put('/:id', requireWriteAccess, (req, res) => {
  const { tags: updateTags, description, permissions } = req.body;
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
  db.get('SELECT * FROM memes WHERE id = ?', [req.params.id], (err, meme) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!meme) return res.status(404).json({ error: 'Meme not found' });

    // Если пытаются изменить права доступа
    if (permissions) {
      const allowedPermissions = ['public', 'private'];

      if (!allowedPermissions.includes(permissions)) {
        return res.status(400).json({ error: 'Недопустимое значение permissions. Разрешены: public, private' });
      }
    }

    const updateQuery = permissions
      ? 'UPDATE memes SET tags = ?, description = ?, permissions = ? WHERE id = ?'
      : 'UPDATE memes SET tags = ?, description = ? WHERE id = ?';

    const updateParams = permissions
      ? [tagArrayStr, description || "", permissions, req.params.id]
      : [tagArrayStr, description || "", req.params.id];

    db.run(updateQuery, updateParams, function (err) {
      if (err) return res.status(500).json({ error: err.message });

      if (permissions !== meme.permissions && permissions === 'public') {

        let tagArray = [];

        try {
          tagArray = updateTags.length ? updateTags : JSON.parse(meme.tags)
        } catch {}

        sendNotifications(
          {
            title: "Новое изображение!",
            body:
              (tagArray || []).map((tag) => `#${tag}`).join(" ") ||
              description ||
              "без тегов",
            icon: "/icons/icon_x192.png",
            url: `/meme/${meme.fileName}`,
          },
          { permissions: ["user"], excludeUserIds: [req.user.id] }
        );
      }

      res.json({ updated: this.changes });
    });
  });
});

// DELETE meme - только для администраторов
router.delete('/:id', requireWriteAccess, (req, res) => {
  // Сначала проверяем, существует ли мем
  db.get('SELECT * FROM memes WHERE id = ?', [req.params.id], (err, meme) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!meme) return res.status(404).json({ error: 'Meme not found' });

    db.run('DELETE FROM memes WHERE id = ?', [req.params.id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ deleted: this.changes });
    });
  });
});

module.exports = router;
