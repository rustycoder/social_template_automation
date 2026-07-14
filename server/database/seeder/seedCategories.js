import { upsertCategory } from '../../services/categoryService.js';
import { TEMPLATE_CATEGORIES } from '../../../src/templates/templateCategories.js';

export async function seedCategories() {
  let sort = 0;
  for (const [id, label] of Object.entries(TEMPLATE_CATEGORIES)) {
    await upsertCategory({ id, label, sortOrder: sort++, isActive: 1 });
    console.log(`  category: ${id}`);
  }

  return { ok: Object.keys(TEMPLATE_CATEGORIES).length };
}
