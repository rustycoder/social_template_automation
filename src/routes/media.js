import { Router } from 'express';
import axios from 'axios';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

/**
 * @param {string} urlString
 */
function isAllowedImageUrl(urlString) {
  let parsed;
  try {
    parsed = new URL(urlString);
  } catch {
    return false;
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) return false;

  const host = parsed.hostname.toLowerCase();
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host.endsWith('.local') ||
    host.startsWith('10.') ||
    host.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  ) {
    return false;
  }

  return true;
}

router.get('/proxy-image', authenticate, async (req, res) => {
  const url = req.query.url;
  if (!url || typeof url !== 'string' || !isAllowedImageUrl(url)) {
    return res.status(400).json({ error: 'Invalid image URL' });
  }

  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
      maxContentLength: MAX_IMAGE_BYTES,
      maxBodyLength: MAX_IMAGE_BYTES,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        Referer: (() => {
          try {
            return `${new URL(url).origin}/`;
          } catch {
            return undefined;
          }
        })(),
      },
      validateStatus: (status) => status >= 200 && status < 300,
    });

    const contentType = String(response.headers['content-type'] || '').split(';')[0].trim();
    if (!contentType.startsWith('image/')) {
      return res.status(400).json({ error: 'URL did not return an image' });
    }

    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'private, max-age=3600');
    res.send(Buffer.from(response.data));
  } catch (error) {
    console.error('Image proxy error:', error.message);
    res.status(502).json({ error: 'Failed to fetch image' });
  }
});

export default router;
