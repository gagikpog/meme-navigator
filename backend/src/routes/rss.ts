import express, { Response } from 'express';
import db from '../db/database';

const router = express.Router();

function escapeXml(value: any): string {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function guessMimeFromFilename(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  return 'application/octet-stream';
}

router.get('/rss.xml', (req: any, res: Response) => {
  const decoded = req.user;

  db.get(
    'SELECT is_blocked FROM users WHERE id = ?',
    [decoded.id],
    (err: Error | null, user: any) => {
      if (err) {
        res.status(500).send('User check failed');
        return;
      }
      if (!user) {
        res.status(404).send('User not found');
        return;
      }
      if (user.is_blocked) {
        res.status(403).send('Account is blocked');
        return;
      }

      db.get(
        'SELECT id FROM user_sessions WHERE user_id = ? AND device_id = ? AND is_active = 1',
        [decoded.id, decoded.deviceId],
        (sessErr: Error | null, session: any) => {
          if (sessErr) {
            res.status(500).send('Session check failed');
            return;
          }
          if (!session) {
            res.status(401).send('Session inactive');
            return;
          }

          // Auth OK → continue to build RSS
          generateRss(req, res);
        }
      );
    }
  );
});

function generateRss(req: any, res: Response): void {
  // Only public memes in RSS
  const sql = 'SELECT * FROM memes WHERE permissions = ? ORDER BY id DESC LIMIT 10';
  db.all(sql, ['public'], (err: Error | null, rows: any[]) => {
    if (err) {
      res.status(500).send('Error generating RSS');
      return;
    }

    const FRONT_BASE_URL = process.env['FRONT_BASE_URL'] || 'https://meme.gagikpog.ru';
    const API_BASE_URL = process.env['API_BASE_URL'] || 'https://gagikpog-api.ru/meme';
    const siteLink = `${FRONT_BASE_URL}/`;

    const itemsXml = (rows || []).map((row: any) => {
      const fileName = row.fileName;
      let title = '';
      if (row.description && String(row.description).trim().length > 0) {
        title = String(row.description).trim();
      } else {
        let tagsText = '';
        try {
          const parsed = row.tags ? JSON.parse(row.tags) : [];
          if (Array.isArray(parsed) && parsed.length > 0) {
            tagsText = parsed.map((t: any) => `#${String(t).trim()}`).join(' ');
          }
        } catch {}
        title = tagsText && tagsText.trim().length > 0 ? tagsText : fileName;
      }
      const link = `${FRONT_BASE_URL}/meme/${encodeURIComponent(fileName)}`;
      const guid = link;
      const enclosureUrl = `${API_BASE_URL}/images/${encodeURIComponent(fileName)}?authorization=${req.token || ''}`;
      const mime = guessMimeFromFilename(fileName);

      // Try to parse timestamp from file name prefix (Date.now() used at upload)
      let pubDate = new Date();
      const tsPrefix = String(fileName).split('-')[0];
      if (tsPrefix && /^\d{10,}$/.test(tsPrefix)) {
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

export default router;