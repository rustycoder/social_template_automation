import { Router } from 'express';
import express from 'express';
import { authenticate, requireActiveSubscription } from '../middleware/auth.js';
import { renderTemplateToPng } from '../services/render/index.js';
import { LAYOUTS } from '../services/render/layouts.js';

const router = Router();

router.use(authenticate, requireActiveSubscription);
router.use(express.json({ limit: '25mb' }));

/**
 * POST /api/render
 * Body: { template_id, field_data, format_bucket }
 * Response: image/png
 */
router.post('/', async (req, res) => {
  try {
    const templateId = req.body?.template_id || req.body?.templateId;
    const formatBucket = req.body?.format_bucket || req.body?.formatBucket || 'square';
    let fieldData = req.body?.field_data ?? req.body?.fieldData ?? {};

    if (!templateId) {
      return res.status(400).json({ error: 'template_id is required' });
    }

    if (typeof fieldData === 'string') {
      try {
        fieldData = JSON.parse(fieldData);
      } catch {
        return res.status(400).json({ error: 'field_data must be valid JSON' });
      }
    }

    if (!LAYOUTS[formatBucket]) {
      return res.status(400).json({
        error: `Invalid format_bucket. Allowed: ${Object.keys(LAYOUTS).join(', ')}`,
      });
    }

    const { buffer } = await renderTemplateToPng({
      templateId,
      fieldData,
      formatBucket,
      userId: req.user.id,
      // Persist data-URL images so Chromium can load them via /uploads if needed;
      // data URLs also work inline — materialize keeps payloads consistent with save.
      materializeImages: true,
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error) {
    console.error('Render error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Render failed' });
  }
});

export default router;
