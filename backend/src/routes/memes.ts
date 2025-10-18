import express, { Response } from 'express';
import multer from 'multer';
import db from '../db/database';
import { requireReadAccess, requireWriteAccess } from '../middleware/auth';
import sendNotifications from '../utils/sendNotifications';
import { deleteImage } from '../utils/fileManager';
import { Meme } from '../types';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, 'public/images'),
  filename: (_req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  }
});

// GET all memes - доступно всем аутентифицированным пользователям
router.get('/', requireReadAccess, (req: any, res: Response) => {
  // Пользователи видят только публичные мемы
  // Админы видят все мемы
  let query = 'SELECT * FROM memes WHERE permissions = ?';
  let params: any[] = ['public'];

  if (req.user.role === 'admin' || req.user.role === 'writer') {
    query = 'SELECT * FROM memes';
    params = [];
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
  db.get('SELECT * FROM memes WHERE id = ?', [req.params['id']], (err: Error | null, row: Meme) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Meme not found' });
      return;
    }

    // Проверяем права доступа
    if ((req.user.role !== 'admin' && req.user.role !== 'writer') && row.permissions === 'private') {
      res.status(403).json({ error: 'Недостаточно прав для доступа к этому мему' });
      return;
    }

    try {
      (row as any).tags = row.tags ? JSON.parse(row.tags) : [];
    } catch {
      (row as any).tags = [];
    }
    res.json(row);
  });
});

// CREATE meme - только для администраторов
router.post('/', requireWriteAccess, upload.single('image'), (req: any, res: Response) => {
  const { tags, description, permissions = 'public' } = req.body;
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

  // Админы могут создавать мемы с любыми правами (public, private)
  const allowedPermissions = ['public', 'private'];

  if (!allowedPermissions.includes(permissions)) {
    res.status(400).json({ error: 'Недопустимое значение permissions. Разрешены: public, private' });
    return;
  }

  db.run(
    'INSERT INTO memes (fileName, tags, description, permissions, user_id) VALUES (?, ?, ?, ?, ?)',
    [fileName, JSON.stringify(tagArray), description || '', permissions, req.user['id']],
    function (err: Error | null) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      sendNotifications({
        title: 'Новое изображение!',
        body: (tagArray || []).map((tag) => `#${tag}`).join(' ') || description || 'без тегов',
        icon: '/icons/icon_x192.png',
        url: `/meme/${fileName}`,
      }, {
        permissions: permissions === 'public' ? [] : ['admin', 'writer'],
        excludeUserIds: [req.user['id']]
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
router.put('/:id', requireWriteAccess, (req: any, res: Response) => {
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
  db.get('SELECT * FROM memes WHERE id = ?', [req.params['id']], (err: Error | null, meme: Meme) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!meme) {
      res.status(404).json({ error: 'Meme not found' });
      return;
    }

    // Если пытаются изменить права доступа
    if (permissions) {
      const allowedPermissions = ['public', 'private'];

      if (!allowedPermissions.includes(permissions)) {
        res.status(400).json({ error: 'Недопустимое значение permissions. Разрешены: public, private' });
        return;
      }
    }

    const updateQuery = permissions
      ? 'UPDATE memes SET tags = ?, description = ?, permissions = ? WHERE id = ?'
      : 'UPDATE memes SET tags = ?, description = ? WHERE id = ?';

    const updateParams = permissions
      ? [tagArrayStr, description || "", permissions, req.params['id']]
      : [tagArrayStr, description || "", req.params['id']];

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
            title: "Новое изображение!",
            body:
              (tagArray || []).map((tag) => `#${tag}`).join(" ") ||
              description ||
              "без тегов",
            icon: "/icons/icon_x192.png",
            url: `/meme/${meme.fileName}`,
          },
          { permissions: ["user"], excludeUserIds: [req.user['id']] }
        );
      }

      res.json({ updated: this.changes });
    });
  });
});

// DELETE meme - только для администраторов
router.delete('/:id', requireWriteAccess, (req: any, res: Response) => {
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
