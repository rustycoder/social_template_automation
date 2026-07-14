import { Router } from 'express';
import { listCategories } from '../services/categoryService.js';
import { getTemplateById, listTemplates } from '../services/templateService.js';

const router = Router();

router.get('/categories', async (_req, res) => {
  try {
    const categories = await listCategories({ activeOnly: true });
    res.json({ categories });
  } catch (error) {
    console.error('List categories error:', error);
    res.status(500).json({ error: 'Failed to list categories' });
  }
});

router.get('/templates', async (_req, res) => {
  try {
    const templates = await listTemplates({ activeOnly: true, includeHtml: true });
    res.json({ templates });
  } catch (error) {
    console.error('List templates error:', error);
    res.status(500).json({ error: 'Failed to list templates' });
  }
});

router.get('/templates/:id', async (req, res) => {
  try {
    const template = await getTemplateById(req.params.id, { includeHtml: true });
    if (!template || !template.isActive) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json({ template });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ error: 'Failed to load template' });
  }
});

export default router;
