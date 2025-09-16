const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../db/database');
const { requireReadAccess, requireWriteAccess } = require('../middleware/auth');

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

  query += ' ORDER BY id DESC';

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(meme => ({
      ...meme,
      tags: meme.tags ? JSON.parse(meme.tags) : [],
    })));
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

    row.tags = row.tags ? JSON.parse(row.tags) : [];
    res.json(row);
  });
});

// CREATE meme - только для администраторов
router.post('/', requireWriteAccess, upload.single('image'), (req, res) => {
  const { tags, description, permissions = 'public' } = req.body;
  const fileName = req.file?.filename;

  if (!fileName) return res.status(400).json({ error: 'No image uploaded' });

  const tagArray = tags ? JSON.parse(tags) : [];

  // Админы могут создавать мемы с любыми правами (public, private)
  const allowedPermissions = ['public', 'private'];

  if (!allowedPermissions.includes(permissions)) {
    return res.status(400).json({ error: 'Недопустимое значение permissions. Разрешены: public, private' });
  }

  db.run(
    'INSERT INTO memes (fileName, tags, description, permissions) VALUES (?, ?, ?, ?)',
    [fileName, JSON.stringify(tagArray), description || '', permissions],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
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
  const { tags, description, permissions } = req.body;
  const tagArray = tags ? JSON.stringify(tags) : '[]';

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
      ? [tagArray, description || "", permissions, req.params.id]
      : [tagArray, description || "", req.params.id];

    db.run(updateQuery, updateParams, function (err) {
      if (err) return res.status(500).json({ error: err.message });
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
