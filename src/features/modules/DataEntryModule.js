/**
 * @file features/modules/DataEntryModule.js
 * @description Data Page state machine — manages Single Form vs Multiple Excel tabs, field validation,
 *              bulk upload parsing, and the Continue button gate before export.
 * @dependencies features/domain/templateFields.js, features/domain/sampleExcelExport.js, features/domain/dataSource.js
 * @state activeSource ('single' | 'bulk'), lastValidation, onContinue / onDataChange callbacks.
 */

import { getTemplateFields, validateExcelHeaders, validateManualFields } from '../domain/templateFields.js';
import { downloadSampleExcel } from '../domain/sampleExcelExport.js';

export class DataEntryModule {
  /**
   * @description Initializes Data Page form controls and tab state machine.
   * @param {import('../domain/dataSource.js').DataSource} dataSource Shared row store.
   * @param {() => object} getTemplate Resolver for the currently selected template.
   */
  constructor(dataSource, getTemplate) {
    this.dataSource = dataSource;
    this.getTemplate = getTemplate;

    /** @type {'single' | 'bulk'} */
    this.activeSource = 'bulk';

    /** @type {(() => void) | null} */
    this.onContinue = null;

    /** @type {(() => void) | null} */
    this.onDataChange = null;

    /** @type {ReturnType<typeof validateExcelHeaders> | null} */
    this.lastValidation = null;

    this._bindElements();
    this._bindEvents();
    this._updateContinueButton();
  }

  /**
   * @description Caches DOM references for the Data Page (#step-2) form region.
   * @returns {void}
   * @private
   */
  _bindElements() {
    this.sourceTabBtns = document.querySelectorAll('#upload-tabs .tab-switcher__btn');
    this.bulkPanel = document.getElementById('bulk-panel');
    this.singlePanel = document.getElementById('single-panel');

    this.dropzone = document.getElementById('dropzone');
    this.fileInput = document.getElementById('file-input');
    this.fileInfo = document.getElementById('file-info');
    this.fileNameEl = document.getElementById('file-name');
    this.fileMetaEl = document.getElementById('file-meta');
    this.removeFileBtn = document.getElementById('remove-file');
    this.dataPreview = document.getElementById('data-preview');
    this.previewThead = document.getElementById('preview-thead');
    this.previewTbody = document.getElementById('preview-tbody');
    this.rowCount = document.getElementById('row-count');
    this.mismatchPanel = document.getElementById('mismatch-panel');

    this.fieldsList = document.getElementById('fields-list');
    this.btnContinue = document.getElementById('btn-to-preview');
    this.btnDownloadSample = document.getElementById('btn-download-sample-excel');
  }

  /**
   * @description Wires tab switching, drag-drop upload, manual field sync, and continue action.
   * @returns {void}
   * @private
   */
  _bindEvents() {
    this.sourceTabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const source = btn.dataset.source;
        if (!source) return;
        this._switchSourceTab(source);
      });
    });

    this.dropzone?.addEventListener('click', () => this.fileInput?.click());

    this.fileInput?.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    this.fileInput?.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this._handleBulkFile(e.target.files[0]);
      }
    });

    this.dropzone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.dropzone.classList.add('drag-over');
    });

    this.dropzone?.addEventListener('dragleave', () => {
      this.dropzone.classList.remove('drag-over');
    });

    this.dropzone?.addEventListener('drop', (e) => {
      e.preventDefault();
      this.dropzone.classList.remove('drag-over');
      if (e.dataTransfer.files.length > 0) {
        this._handleBulkFile(e.dataTransfer.files[0]);
      }
    });

    this.removeFileBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this._resetBulk();
    });

    this.fieldsList?.addEventListener('input', (e) => {
      if (e.target.matches('.field-value, .field-textarea')) {
        this._syncManualFields();
      }
    });

    this.fieldsList?.addEventListener('change', (e) => {
      if (e.target.matches('.field-file')) {
        this._handleImageFile(e.target);
      }
    });

    this.fieldsList?.addEventListener('input', (e) => {
      if (e.target.matches('.field-url')) {
        this._handleImageUrl(e.target);
      }
    });

    this.btnContinue?.addEventListener('click', () => {
      if (!this.btnContinue.disabled && this.onContinue) {
        this.onContinue();
      }
    });

    this.btnDownloadSample?.addEventListener('click', async () => {
      try {
        await downloadSampleExcel(this.getTemplate());
      } catch (error) {
        console.error('Sample Excel download failed:', error);
        this._showError(`Failed to generate sample Excel: ${error.message}`);
      }
    });
  }

  /**
   * @description Rebuilds the single-post form from the selected template's field schema.
   * @returns {void}
   */
  rebuildFormForTemplate() {
    const template = this.getTemplate();
    const fields = getTemplateFields(template);

    if (!this.fieldsList) return;

    this.fieldsList.innerHTML = '';

    for (const field of fields) {
      const row = document.createElement('div');
      row.className = 'field-row';
      row.dataset.fieldKey = field.key;

      if (field.type === 'image') {
        row.innerHTML = `
          <div class="field-grid">
            <div class="setting-group">
              <label for="field-file-${field.key}">${field.label}${field.required ? ' <span class="required-badge">*</span>' : ''}</label>
              <input type="text" id="field-url-${field.key}" class="text-input field-url" data-key="${field.key}" placeholder="Paste image URL…" autocomplete="off" />
              <input type="file" id="field-file-${field.key}" class="text-input field-file" accept="image/*" data-key="${field.key}" style="margin-top:6px" />
              <input type="hidden" class="field-value" data-key="${field.key}" value="" />
            </div>
          </div>
        `;
      } else if (field.type === 'textarea') {
        row.innerHTML = `
          <div class="field-grid">
            <div class="setting-group">
              <label for="field-${field.key}">${field.label}${field.required ? ' <span class="required-badge">*</span>' : ''}</label>
              <textarea id="field-${field.key}" class="text-input field-textarea field-value" data-key="${field.key}" rows="2" placeholder="Enter ${field.label.toLowerCase()}…" name="${field.key}" autocomplete="off"></textarea>
            </div>
          </div>
        `;
      } else {
        row.innerHTML = `
          <div class="field-grid">
            <div class="setting-group">
              <label for="field-${field.key}">${field.label}${field.required ? ' <span class="required-badge">*</span>' : ''}</label>
              <input type="text" id="field-${field.key}" class="text-input field-value" data-key="${field.key}" placeholder="Enter ${field.label.toLowerCase()}…" name="${field.key}" autocomplete="off" />
            </div>
          </div>
        `;
      }

      this.fieldsList.appendChild(row);
    }

    this.dataSource.clear();
    this._hideMismatch();
    this._updateContinueButton();
    this._notifyDataChange();
  }

  /**
   * @description Switches between Single Data and Multiple Data tabs.
   * @param {'bulk' | 'single'} source Target tab identifier from data-source attribute.
   * @returns {void}
   * @private
   */
  _switchSourceTab(source) {
    this.activeSource = source;
    this.sourceTabBtns.forEach((btn) => {
      const isActive = btn.dataset.source === source;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    this.bulkPanel?.classList.toggle('hidden', source !== 'bulk');
    this.singlePanel?.classList.toggle('hidden', source !== 'single');
    this._updateContinueButton();
    this._notifyDataChange();
  }

  /**
   * @description Notifies listeners that row data or validation state changed.
   * @returns {void}
   * @private
   */
  _notifyDataChange() {
    if (this.onDataChange) this.onDataChange();
  }

  /**
   * @description Parses and validates an uploaded Excel workbook.
   * @param {File} file User-selected .xlsx or .xls file.
   * @returns {Promise<void>}
   * @private
   */
  async _handleBulkFile(file) {
    const ext = file.name.toLowerCase();
    if (!ext.endsWith('.xlsx') && !ext.endsWith('.xls')) {
      this._showError('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    const fileSizeKB = (file.size / 1024).toFixed(1);

    try {
      await this.dataSource.loadFromExcelFile(file);
      const template = this.getTemplate();
      this.lastValidation = validateExcelHeaders(template, this.dataSource.getHeaders());
      this._renderMismatch(this.lastValidation);

      this.fileNameEl.textContent = this.dataSource.fileName;
      this.fileMetaEl.textContent = `${fileSizeKB} KB · ${this.dataSource.rows.length} rows · ${this.dataSource.headers.length} columns`;
      this.fileInfo?.classList.remove('hidden');
      if (this.dropzone) this.dropzone.style.display = 'none';

      this._renderPreview();
      this._updateContinueButton();
      this._notifyDataChange();
    } catch (error) {
      console.error('Excel parse error:', error);
      this._showError(`Failed to parse Excel file: ${error.message}`);
    }
  }

  /**
   * @description Clears bulk upload state and restores the dropzone.
   * @returns {void}
   * @private
   */
  _resetBulk() {
    this.dataSource.clear();
    this.lastValidation = null;
    if (this.fileInput) this.fileInput.value = '';

    this.fileInfo?.classList.add('hidden');
    this.dataPreview?.classList.add('hidden');
    this._hideMismatch();
    if (this.dropzone) this.dropzone.style.display = '';
    this._updateContinueButton();
    this._notifyDataChange();
  }

  /**
   * @description Syncs image field value from a pasted URL.
   * @param {HTMLInputElement} urlInput URL text input element.
   * @returns {void}
   * @private
   */
  _handleImageUrl(urlInput) {
    const key = urlInput.dataset.key;
    const valueInput = this.fieldsList?.querySelector(`input.field-value[data-key="${key}"]`);
    if (!valueInput) return;
    valueInput.value = urlInput.value.trim();
    this._syncManualFields();
  }

  /**
   * @description Reads a local image file into a data URL for the field value.
   * @param {HTMLInputElement} fileInput File input element.
   * @returns {void}
   * @private
   */
  _handleImageFile(fileInput) {
    const file = fileInput.files?.[0];
    const key = fileInput.dataset.key;
    const valueInput = this.fieldsList?.querySelector(`input.field-value[data-key="${key}"]`);
    if (!file || !valueInput) return;

    const urlInput = this.fieldsList?.querySelector(`.field-url[data-key="${key}"]`);
    if (urlInput) urlInput.value = '';

    const reader = new FileReader();
    reader.onload = () => {
      valueInput.value = typeof reader.result === 'string' ? reader.result : '';
      this._syncManualFields();
    };
    reader.onerror = () => {
      this._showError('Failed to read image file');
    };
    reader.readAsDataURL(file);
  }

  /**
   * @description Collects current manual field values from the single-post form.
   * @returns {Record<string, string>}
   * @private
   */
  _collectFieldValues() {
    /** @type {Record<string, string>} */
    const fieldValues = {};
    this.fieldsList?.querySelectorAll('.field-value').forEach((input) => {
      const key = input.dataset.key;
      if (key) fieldValues[key] = input.value ?? '';
    });
    return fieldValues;
  }

  /**
   * @description Pushes manual field values into DataSource and re-validates.
   * @returns {void}
   * @private
   */
  _syncManualFields() {
    const template = this.getTemplate();
    const fieldValues = this._collectFieldValues();
    const validation = validateManualFields(template, fieldValues);
    this.lastValidation = validation;

    const hasValue = Object.values(fieldValues).some(
      (v) => v !== null && v !== undefined && String(v).trim() !== ''
    );

    if (hasValue) {
      this.dataSource.loadFromManualFields(template, fieldValues);
    } else {
      this.dataSource.clear();
      this.dataSource.mode = 'single';
    }

    this._updateContinueButton();
    this._notifyDataChange();
  }

  /**
   * @description Renders Excel header mismatch feedback panel.
   * @param {ReturnType<typeof validateExcelHeaders>} validation Validation result object.
   * @returns {void}
   * @private
   */
  _renderMismatch(validation) {
    if (!this.mismatchPanel) return;

    if (validation.isValid && validation.extra.length === 0) {
      this.mismatchPanel.classList.add('hidden');
      this.mismatchPanel.innerHTML = '';
      return;
    }

    const parts = [];

    if (validation.missingRequired.length > 0) {
      parts.push(
        `<div class="mismatch-block mismatch-error"><strong>Missing required columns:</strong> ${validation.missingRequired.join(', ')}</div>`
      );
    }

    if (validation.missing.length > validation.missingRequired.length) {
      const optionalMissing = validation.missing.filter((k) => !validation.missingRequired.includes(k));
      if (optionalMissing.length > 0) {
        parts.push(
          `<div class="mismatch-block mismatch-warn"><strong>Missing optional columns:</strong> ${optionalMissing.join(', ')}</div>`
        );
      }
    }

    if (validation.matched.length > 0) {
      parts.push(
        `<div class="mismatch-block mismatch-ok"><strong>Matched:</strong> ${validation.matched.map((m) => m.header).join(', ')}</div>`
      );
    }

    if (validation.extra.length > 0) {
      parts.push(
        `<div class="mismatch-block mismatch-warn"><strong>Extra columns in Excel (ignored):</strong> ${validation.extra.join(', ')}</div>`
      );
    }

    this.mismatchPanel.innerHTML = parts.join('');
    this.mismatchPanel.classList.remove('hidden');
  }

  /**
   * @description Hides the Excel column mismatch panel.
   * @returns {void}
   * @private
   */
  _hideMismatch() {
    this.mismatchPanel?.classList.add('hidden');
    if (this.mismatchPanel) this.mismatchPanel.innerHTML = '';
  }

  /**
   * @description Renders a scrollable preview table for uploaded Excel rows (max 50).
   * @returns {void}
   * @private
   */
  _renderPreview() {
    const headers = this.dataSource.getHeaders();
    const rows = this.dataSource.getRows();

    const headerRow = document.createElement('tr');
    headers.forEach((h) => {
      const th = document.createElement('th');
      th.textContent = h;
      if (this.dataSource.isImageColumn(h)) {
        th.textContent += ' 🖼️';
      }
      headerRow.appendChild(th);
    });
    if (this.previewThead) {
      this.previewThead.innerHTML = '';
      this.previewThead.appendChild(headerRow);
    }

    if (this.previewTbody) {
      this.previewTbody.innerHTML = '';
      const previewRows = rows.slice(0, 50);
      previewRows.forEach((row) => {
        const tr = document.createElement('tr');
        headers.forEach((h) => {
          const td = document.createElement('td');
          const value = row[h] ?? '';

          if (typeof value === 'string' && value.startsWith('data:image/')) {
            const img = document.createElement('img');
            img.src = value;
            img.style.maxWidth = '60px';
            img.style.maxHeight = '40px';
            img.style.borderRadius = '4px';
            img.style.objectFit = 'cover';
            td.appendChild(img);
          } else {
            td.textContent = value;
            td.title = value;
          }
          tr.appendChild(td);
        });
        this.previewTbody.appendChild(tr);
      });
    }

    if (this.rowCount) {
      this.rowCount.textContent = `Showing ${Math.min(rows.length, 50)} of ${rows.length} rows`;
    }
    this.dataPreview?.classList.remove('hidden');
  }

  /**
   * @description Enables the footer Next button once bulk rows exist or single form has any input.
   * @returns {void}
   * @private
   */
  _updateContinueButton() {
    if (!this.btnContinue) return;

    if (this.activeSource === 'bulk') {
      const hasRows = this.dataSource.getRowCount() > 0;
      this.btnContinue.disabled = !hasRows;
      return;
    }

    const template = this.getTemplate();
    const fieldValues = this._collectFieldValues();
    const validation = validateManualFields(template, fieldValues);
    this.lastValidation = validation;

    const hasValue = Object.values(fieldValues).some(
      (v) => v !== null && v !== undefined && String(v).trim() !== ''
    );
    this.btnContinue.disabled = !hasValue;
  }

  /**
   * @description Dispatches a global toast error event.
   * @param {string} message User-visible error text.
   * @returns {void}
   * @private
   */
  _showError(message) {
    window.dispatchEvent(new CustomEvent('toast', { detail: { message, type: 'error' } }));
  }
}

/** @deprecated Use DataEntryModule — kept for backward-compatible imports. */
export { DataEntryModule as UploadStep };
