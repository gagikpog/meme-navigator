const express = require('express');
const db = require('../db/database');
const jwt = require('jsonwebtoken');
require('dotenv').config();

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
  const decoded = req.user;

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
  const sql = 'SELECT * FROM memes WHERE permissions = ? ORDER BY id DESC LIMIT 10';
  db.all(sql, ['public'], (err, rows) => {
    if (err) {
      return res.status(500).send('Error generating RSS');
    }

    const FRONT_BASE_URL = process.env.FRONT_BASE_URL || 'https://meme.gagikpog.ru';
    const API_BASE_URL = process.env.API_BASE_URL || 'https://gagikpog-api.ru/meme';
    const siteLink = `${FRONT_BASE_URL}/`;

    const itemsXml = (rows || []).map((row) => {
      const fileName = row.fileName;
      let title = '';
      if (row.description && String(row.description).trim().length > 0) {
        title = String(row.description).trim();
      } else {
        let tagsText = '';
        try {
          const parsed = row.tags ? JSON.parse(row.tags) : [];
          if (Array.isArray(parsed) && parsed.length > 0) {
            tagsText = parsed.map((t) => `#${String(t).trim()}`).join(' ');
          }
        } catch {}
        title = tagsText && tagsText.trim().length > 0 ? tagsText : fileName;
      }
      const link = `${FRONT_BASE_URL}/meme/${encodeURIComponent(fileName)}`;
      const guid = link;
      const enclosureUrl = `${API_BASE_URL}/images/${encodeURIComponent(fileName)}?authorization=${req.token}`;
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


