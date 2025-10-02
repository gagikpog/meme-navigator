const express = require('express');
const db = require('../db/database');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const SECRET = process.env.JWT_SECRET;

const router = express.Router();

function escapeXml(value) {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function guessMimeFromFilename(filename) {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  return 'application/octet-stream';
}

router.get('/rss.xml', (req, res) => {
  const token = req.query.authorization;
  if (!token) {
    return res.status(401).send('Authorization token is required');
  }

  if (!SECRET) {
    return res.status(500).send('JWT secret not configured');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, SECRET);
  } catch (e) {
    return res.status(403).send('Invalid token');
  }

  if (!decoded?.id || !decoded?.deviceId) {
    return res.status(401).send('Invalid session');
  }

  db.get(
    'SELECT is_blocked FROM users WHERE id = ?',
    [decoded.id],
    (err, user) => {
      if (err) return res.status(500).send('User check failed');
      if (!user) return res.status(404).send('User not found');
      if (user.is_blocked) return res.status(403).send('Account is blocked');

      db.get(
        'SELECT id FROM user_sessions WHERE user_id = ? AND device_id = ? AND is_active = 1',
        [decoded.id, decoded.deviceId],
        (sessErr, session) => {
          if (sessErr) return res.status(500).send('Session check failed');
          if (!session) return res.status(401).send('Session inactive');

          // Auth OK → continue to build RSS
          generateRss(req, res);
        }
      );
    }
  );
});

function generateRss(req, res) {
  // Only public memes in RSS
  const sql = 'SELECT * FROM memes WHERE permissions = ? ORDER BY id DESC LIMIT 100';
  db.all(sql, ['public'], (err, rows) => {
    if (err) {
      return res.status(500).send('Error generating RSS');
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const siteLink = `${baseUrl}/`;

    const itemsXml = (rows || []).map((row) => {
      const fileName = row.fileName;
      const title = row.description && row.description.trim().length > 0
        ? row.description
        : fileName;
      const link = `${baseUrl}/meme/${encodeURIComponent(fileName)}`;
      const guid = link;
      const enclosureUrl = `${baseUrl}/meme/images/${encodeURIComponent(fileName)}`;
      const mime = guessMimeFromFilename(fileName);

      // Try to parse timestamp from file name prefix (Date.now() used at upload)
      let pubDate = new Date();
      const tsPrefix = String(fileName).split('-')[0];
      if (/^\d{10,}$/.test(tsPrefix)) {
        const ms = parseInt(tsPrefix, 10);
        const d = new Date(ms);
        if (!isNaN(d.getTime())) pubDate = d;
      }

      return (
        '    <item>\n' +
        `      <title>${escapeXml(title)}</title>\n` +
        `      <link>${escapeXml(link)}</link>\n` +
        `      <guid isPermaLink="true">${escapeXml(guid)}</guid>\n` +
        `      <pubDate>${pubDate.toUTCString()}</pubDate>\n` +
        `      <enclosure url="${escapeXml(enclosureUrl)}" type="${mime}" />\n` +
        '    </item>'
      );
    }).join('\n');

    const rss = `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<rss version="2.0">\n` +
      `  <channel>\n` +
      `    <title>Мемы</title>\n` +
      `    <link>${escapeXml(siteLink)}</link>\n` +
      `    <description>Последние публичные мемы</description>\n` +
      `${itemsXml}\n` +
      `  </channel>\n` +
      `</rss>`;

    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.send(rss);
  });
}

module.exports = router;


