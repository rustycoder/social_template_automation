/**
 * @file features/pages/DataPage.js
 * @description Page 2 — coordinates live preview updates when data entry changes and prepares
 *              the step description when entering from Template Page.
 * @dependencies features/rendering/preview.js, features/domain/templateSampleData.js
 * @state Stateless view coordinator; DataEntryModule owns form/upload state.
 */

import { getSampleRowForTemplate } from '../domain/templateSampleData.js';

export class DataPage {
  /**
   * @description Creates the Data Page preview coordinator.
   * @param {import('../rendering/preview.js').PostPreview} dataPreview Right-column live preview.
   * @param {() => object} getTemplate Resolver for the active template.
   * @param {import('../domain/dataSource.js').DataSource} dataSource Shared row store.
   * @param {() => { width: number, height: number }} getLayoutDimensions Layout size for preview fitting.
   */
  constructor(dataPreview, getTemplate, dataSource, getLayoutDimensions) {
    this.dataPreview = dataPreview;
    this.getTemplate = getTemplate;
    this.dataSource = dataSource;
    this.getLayoutDimensions = getLayoutDimensions;

    this.descEl = document.getElementById('data-step-desc');
    this.hintEl = document.getElementById('data-preview-hint');
  }

  /**
   * @description Updates the step description when navigating from Template Page.
   * @returns {void}
   */
  prepareForEntry() {
    if (!this.descEl) return;
    const template = this.getTemplate();
    this.descEl.textContent = `Fill in fields for "${template.name}" or upload Excel with matching column names.`;
  }

  /**
   * @description Refreshes the live preview — sample data when empty, real rows when populated.
   * @returns {void}
   */
  updatePreview() {
    const template = this.getTemplate();
    const rowCount = this.dataSource.getRowCount();

    if (rowCount > 0) {
      this.hintEl?.classList.add('hidden');
      this.dataPreview.update();
    } else {
      this.hintEl?.classList.remove('hidden');
      this.dataPreview.updateFromRow(getSampleRowForTemplate(template));
    }

    // Fit preview mount after layout — rAF ensures split-pane dimensions are settled.
    requestAnimationFrame(() => {
      const { width, height } = this.getLayoutDimensions();
      this.dataPreview._fitPreviewMount(this.dataPreview.previewMount, width, height);
    });
  }

  /**
   * @description Called when step 2 becomes active — delayed fit handles CSS transition settling.
   * @returns {void}
   */
  onEnter() {
    setTimeout(() => {
      this.updatePreview();
      requestAnimationFrame(() => {
        const { width, height } = this.getLayoutDimensions();
        this.dataPreview._fitPreviewMount(this.dataPreview.previewMount, width, height);
      });
    }, 50);
  }
}
