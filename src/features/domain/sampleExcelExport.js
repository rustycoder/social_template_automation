/**
 * @file features/domain/sampleExcelExport.js
 * @description Generates downloadable sample .xlsx files with correct column headers per template.
 * @dependencies exceljs, features/domain/templateFields.js, features/domain/templateSampleData.js
 * @state None.
 */

/**
 * Generate per-template sample Excel files for bulk data entry.
 */
import ExcelJS from 'exceljs';
import { getTemplateFields } from './templateFields.js';
import { getSampleRowForTemplate } from './templateSampleData.js';

/**
 * @param {string} value
 */
function sanitizeFilename(value) {
  return String(value)
    .trim()
    .replace(/[^a-z0-9._-]+/gi, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 64);
}

/**
 * @param {object} template
 * @returns {Promise<Blob>}
 */
export async function buildSampleExcelBlob(template) {
  const fields = getTemplateFields(template);
  const sampleRow = getSampleRowForTemplate(template);
  const keys = fields.map((field) => field.key);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Posts');

  const headerRow = sheet.addRow(keys);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8EAF0' },
    };
  });

  sheet.addRow(keys.map((key) => sampleRow[key] ?? ''));
  sheet.addRow(keys.map(() => ''));

  keys.forEach((key, index) => {
    const col = sheet.getColumn(index + 1);
    const headerLen = key.length;
    const sampleVal = String(sampleRow[key] ?? '');
    const width = Math.min(48, Math.max(headerLen, Math.min(sampleVal.length, 40)) + 2);
    col.width = width;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * @param {object} template
 * @returns {Promise<void>}
 */
export async function downloadSampleExcel(template) {
  const blob = await buildSampleExcelBlob(template);
  const id = template?.id || 'template';
  const filename = `${sanitizeFilename(id) || 'template'}-sample.xlsx`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
