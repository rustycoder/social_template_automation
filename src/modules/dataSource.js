/**
 * Unified data source — headers/rows from bulk Excel or single manual entry.
 */
import { parseExcelFile } from './csvParser.js';
import { buildRowFromManualFields } from './templateFields.js';

export class DataSource {
  constructor() {
    this.headers = [];
    this.rows = [];
    /** @type {'bulk' | 'single' | null} */
    this.mode = null;
    this.fileName = '';
    /** @type {Set<string>} */
    this.imageColumns = new Set();
    this.onDataLoaded = null;
  }

  /**
   * @param {File} file
   */
  async loadFromExcelFile(file) {
    const { headers, rows, imageColumns, fileName } = await parseExcelFile(file);
    this.headers = headers;
    this.rows = rows;
    this.imageColumns = imageColumns;
    this.fileName = fileName;
    this.mode = 'bulk';

    if (this.onDataLoaded) {
      this.onDataLoaded(this.headers, this.rows);
    }

    return { headers, rows, imageColumns, fileName };
  }

  /**
   * @param {object} template
   * @param {Record<string, string>} fieldValues
   */
  loadFromManualFields(template, fieldValues) {
    const row = buildRowFromManualFields(template, fieldValues);
    this.headers = Object.keys(row);
    this.rows = [row];
    this.imageColumns = new Set();
    for (const field of template.fields || []) {
      if (field.type === 'image') {
        this.imageColumns.add(field.key.toLowerCase());
      }
    }
    for (const [key, value] of Object.entries(fieldValues)) {
      if (typeof value === 'string' && value.startsWith('data:image/')) {
        this.imageColumns.add(key.toLowerCase());
      }
    }
    this.fileName = 'Single Post';
    this.mode = 'single';

    if (this.onDataLoaded) {
      this.onDataLoaded(this.headers, this.rows);
    }
  }

  clear() {
    this.headers = [];
    this.rows = [];
    this.mode = null;
    this.fileName = '';
    this.imageColumns.clear();
  }

  getHeaders() {
    return this.headers;
  }

  getRows() {
    return this.rows;
  }

  getRowCount() {
    return this.rows.length;
  }

  /**
   * @param {string} header
   */
  isImageColumn(header) {
    return this.imageColumns.has(header.toLowerCase());
  }
}
