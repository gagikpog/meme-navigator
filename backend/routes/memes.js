const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../db/database');

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

// GET all memes
router.get('/', (req, res) => {
  db.all('SELECT * FROM memes ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(meme => ({
      ...meme,
      tags: meme.tags ? JSON.parse(meme.tags) : [],
    })));
  });
});

// GET one meme
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM memes WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Meme not found' });
    row.tags = row.tags ? JSON.parse(row.tags) : [];
    res.json(row);
  });
});

// CREATE meme
router.post('/', upload.single('image'), (req, res) => {
  const { tags, description  } = req.body;
  const fileName = req.file?.filename;

  if (!fileName) return res.status(400).json({ error: 'No image uploaded' });

  const tagArray = tags ? JSON.parse(tags) : [];

  db.run(
    'INSERT INTO memes (fileName, tags, description) VALUES (?, ?, ?)',
    [fileName, JSON.stringify(tagArray), description || ''],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID, fileName, tags: tagArray, description });
    }
  );
});

// UPDATE meme
router.put('/:id', (req, res) => {
  const { tags, description} = req.body;
  const tagArray = tags ? JSON.stringify(tags) : '[]';

  db.run(
    'UPDATE memes SET tags = ?, description = ? WHERE id = ?',
    [tagArray, description || "", req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});

// DELETE meme
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM memes WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

module.exports = router;
