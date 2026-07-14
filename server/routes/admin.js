import { Router } from 'express';
import multer from 'multer';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from '../services/categoryService.js';
import {
  createTemplate,
  listTemplates,
  softDeleteTemplate,
  updateTemplate,
} from '../services/templateService.js';
import { slugifyId } from '../services/jsonText.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.use(authenticate, requireAdmin);

function parseFieldsJson(raw) {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error('fields_json must be valid JSON');
    error.status = 400;
    throw error;
  }
}

router.get('/categories', async (_req, res) => {
  try {
    const categories = await listCategories({ activeOnly: false });
    res.json({ categories });
  } catch (error) {
    console.error('Admin list categories error:', error);
    res.status(500).json({ error: 'Failed to list categories' });
  }
});

router.post('/categories', async (req, res) => {
  try {
    const { id, label, sortOrder, isActive } = req.body || {};
    if (!label || !String(label).trim()) {
      return res.status(400).json({ error: 'label is required' });
    }
    const categoryId = id || slugifyId(label);
    const category = await createCategory({
      id: categoryId,
      label: String(label).trim(),
      sortOrder: sortOrder != null ? Number(sortOrder) : 0,
      isActive: isActive !== false && isActive !== 0 && isActive !== '0',
    });
    res.status(201).json({ category });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Category id already exists' });
    }
    console.error('Admin create category error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Failed to create category' });
  }
});

router.patch('/categories/:id', async (req, res) => {
  try {
    const category = await updateCategory(req.params.id, {
      label: req.body?.label,
      sortOrder: req.body?.sortOrder,
      isActive: req.body?.isActive,
    });
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ category });
  } catch (error) {
    console.error('Admin update category error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Failed to update category' });
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    const deleted = await deleteCategory(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ ok: true });
  } catch (error) {
    console.error('Admin delete category error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Failed to delete category' });
  }
});

router.get('/templates', async (_req, res) => {
  try {
    const templates = await listTemplates({ activeOnly: false, includeHtml: false });
    res.json({ templates });
  } catch (error) {
    console.error('Admin list templates error:', error);
    res.status(500).json({ error: 'Failed to list templates' });
  }
});

router.post('/templates', upload.single('html'), async (req, res) => {
  try {
    const htmlSource =
      req.file?.buffer?.toString('utf8') ||
      (typeof req.body?.html === 'string' ? req.body.html : '');

    if (!htmlSource.trim()) {
      return res.status(400).json({ error: 'html file or html body is required' });
    }

    const name = req.body?.name;
    const categoryId = req.body?.category_id || req.body?.categoryId;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'name is required' });
    }
    if (!categoryId) {
      return res.status(400).json({ error: 'category_id is required' });
    }

    const fields = parseFieldsJson(req.body?.fields_json ?? req.body?.fieldsJson);
    if (!fields) {
      return res.status(400).json({ error: 'fields_json is required' });
    }

    const template = await createTemplate({
      id: req.body?.id || undefined,
      name: String(name).trim(),
      categoryId,
      htmlSource,
      fields,
      previewBucket: req.body?.preview_bucket || req.body?.previewBucket || 'square',
      isActive: req.body?.is_active !== '0' && req.body?.isActive !== false,
    });

    res.status(201).json({ template });
  } catch (error) {
    console.error('Admin create template error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Failed to create template' });
  }
});

router.patch('/templates/:id', upload.single('html'), async (req, res) => {
  try {
    const patch = {};
    if (req.body?.name != null) patch.name = String(req.body.name).trim();
    if (req.body?.category_id != null || req.body?.categoryId != null) {
      patch.categoryId = req.body.category_id || req.body.categoryId;
    }
    if (req.body?.preview_bucket != null || req.body?.previewBucket != null) {
      patch.previewBucket = req.body.preview_bucket || req.body.previewBucket;
    }
    if (req.body?.is_active != null || req.body?.isActive != null) {
      const raw = req.body.is_active ?? req.body.isActive;
      patch.isActive = raw === true || raw === 1 || raw === '1';
    }
    if (req.body?.fields_json != null || req.body?.fieldsJson != null) {
      patch.fields = parseFieldsJson(req.body.fields_json ?? req.body.fieldsJson);
    }
    if (req.file?.buffer) {
      patch.htmlSource = req.file.buffer.toString('utf8');
    } else if (typeof req.body?.html === 'string') {
      patch.htmlSource = req.body.html;
    }

    const template = await updateTemplate(req.params.id, patch);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json({ template });
  } catch (error) {
    console.error('Admin update template error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Failed to update template' });
  }
});

router.delete('/templates/:id', async (req, res) => {
  try {
    const deleted = await softDeleteTemplate(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json({ ok: true });
  } catch (error) {
    console.error('Admin delete template error:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

export default router;
