import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { upsertTemplateSeed } from '../../services/templateService.js';
import { TEMPLATE_CATEGORIES } from '../../../seed-data/templates/templateCategories.js';
import { LEGACY_TEMPLATE_REGISTRY } from '../../../seed-data/templates/legacyTemplateRegistry.js';
import { NICHE_TEMPLATE_REGISTRY } from '../../../seed-data/templates/nicheTemplateRegistry.js';
import { AUDIENCE_TEMPLATE_REGISTRY } from '../../../seed-data/templates/audienceTemplateRegistry.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, '..', '..', '..', 'seed-data', 'templates', 'html');

const REGISTRY = [
  ...LEGACY_TEMPLATE_REGISTRY,
  ...NICHE_TEMPLATE_REGISTRY,
  ...AUDIENCE_TEMPLATE_REGISTRY,
];

export async function seedTemplates() {
  let ok = 0;
  let missing = 0;

  for (const def of REGISTRY) {
    const filePath = path.join(TEMPLATES_DIR, def.file);
    if (!fs.existsSync(filePath)) {
      console.warn(`  missing file: ${def.file}`);
      missing++;
      continue;
    }

    const htmlSource = fs.readFileSync(filePath, 'utf8');
    const categoryId = TEMPLATE_CATEGORIES[def.category] ? def.category : 'general';

    await upsertTemplateSeed({
      id: def.id,
      name: def.name,
      categoryId,
      htmlSource,
      fields: def.fields || [],
      previewBucket: def.previewBucket || 'square',
      isActive: 1,
    });
    ok++;
    console.log(`  template: ${def.id}`);
  }

  return { ok, missing };
}
