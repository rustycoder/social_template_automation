import { Router } from 'express';
import multer from 'multer';
import { authenticate, requireActiveSubscription } from '../middleware/auth.js';
import {
  createPost,
  deletePost,
  listPostsForUser,
  updatePost,
} from '../services/postService.js';
import { renderTemplateToPng } from '../services/render/index.js';
import { LAYOUTS } from '../services/render/layouts.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024,
    // field_data may include image data URLs before server-side materialization
    fieldSize: 25 * 1024 * 1024,
  },
});

router.use(authenticate, requireActiveSubscription);

router.get('/', async (req, res) => {
  try {
    const posts = await listPostsForUser(req.user.id);
    res.json({ posts });
  } catch (error) {
    console.error('List posts error:', error);
    res.status(500).json({ error: 'Failed to list posts' });
  }
});

router.post('/', upload.single('image'), async (req, res) => {
  try {
    const templateId = req.body?.template_id || req.body?.templateId;
    let platforms = req.body?.platforms;
    if (typeof platforms === 'string') {
      try {
        platforms = JSON.parse(platforms);
      } catch {
        platforms = platforms.split(/[,|]/).map((s) => s.trim()).filter(Boolean);
      }
    }
    if (!platforms && req.body?.platform) {
      platforms = [req.body.platform];
    }
    const scheduledAt =
      req.body?.scheduled_at ||
      req.body?.scheduledAt ||
      new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const caption = req.body?.caption ?? '';
    const formatBucket = req.body?.format_bucket || req.body?.formatBucket || 'square';
    const status = req.body?.status || 'preparing';

    if (!templateId) {
      return res.status(400).json({ error: 'template_id is required' });
    }

    if (!LAYOUTS[formatBucket]) {
      return res.status(400).json({
        error: `Invalid format_bucket. Allowed: ${Object.keys(LAYOUTS).join(', ')}`,
      });
    }

    let fieldData = {};
    const rawFieldData = req.body?.field_data || req.body?.fieldData;
    if (rawFieldData) {
      try {
        fieldData = typeof rawFieldData === 'string' ? JSON.parse(rawFieldData) : rawFieldData;
      } catch {
        return res.status(400).json({ error: 'field_data must be valid JSON' });
      }
    }

    let imageBuffer = req.file?.buffer || null;
    let storedFieldData = fieldData;

    if (!imageBuffer) {
      const rendered = await renderTemplateToPng({
        templateId,
        fieldData,
        formatBucket,
        userId: req.user.id,
        materializeImages: true,
      });
      imageBuffer = rendered.buffer;
      storedFieldData = rendered.fieldData;
    }

    const post = await createPost({
      userId: req.user.id,
      templateId,
      caption,
      platforms: platforms || [],
      scheduledAt,
      imageBuffer,
      fieldData: storedFieldData,
      formatBucket,
      status,
    });

    res.status(201).json({ post });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Failed to save post' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const post = await updatePost(Number(req.params.id), req.body || {}, req.user.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json({ post });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Failed to update post' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await deletePost(Number(req.params.id), req.user.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json({ ok: true });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

export default router;
