import { Router } from 'express';
import multer from 'multer';
import { authenticate, requireActiveSubscription } from '../middleware/auth.js';
import { createPost, deletePost, listPostsForUser } from '../services/postService.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
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
    if (!req.file?.buffer) {
      return res.status(400).json({ error: 'image file is required' });
    }

    const templateId = req.body?.template_id || req.body?.templateId;
    const platform = req.body?.platform;
    const scheduledAt = req.body?.scheduled_at || req.body?.scheduledAt;
    const caption = req.body?.caption ?? '';
    const formatBucket = req.body?.format_bucket || req.body?.formatBucket || 'square';

    if (!templateId) {
      return res.status(400).json({ error: 'template_id is required' });
    }
    if (!platform) {
      return res.status(400).json({ error: 'platform is required' });
    }
    if (!scheduledAt) {
      return res.status(400).json({ error: 'scheduled_at is required' });
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

    const post = await createPost({
      userId: req.user.id,
      templateId,
      caption,
      platform,
      scheduledAt,
      imageBuffer: req.file.buffer,
      fieldData,
      formatBucket,
      status: 'scheduled',
    });

    res.status(201).json({ post });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Failed to save post' });
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
