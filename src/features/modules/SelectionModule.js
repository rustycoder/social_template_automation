/**
 * @file features/modules/SelectionModule.js
 * @description Global selection state for Export Page post tiles — tracks checked rows,
 *              syncs default-all-selected behavior, and notifies the export button counter.
 * @dependencies None (pure selection state; rendering lives in ExportGrid / ExportPage).
 * @state checkedRowIndices (Set<number>), onSelectionChange callback.
 */

export class SelectionModule {
  /**
   * @description Creates an export selection controller.
   * @param {object} [options]
   * @param {(count: number) => void} [options.onSelectionChange] Called when selection count changes.
   */
  constructor(options = {}) {
    /** @type {Set<number>} */
    this.checkedRowIndices = new Set();

    /** @type {(count: number) => void} */
    this.onSelectionChange = options.onSelectionChange ?? (() => {});
  }

  /**
   * @description Clears all row selections (e.g. when re-entering export step).
   * @returns {void}
   */
  reset() {
    this.checkedRowIndices.clear();
    this._notify();
  }

  /**
   * @description Ensures indices stay in range and defaults to all rows selected.
   * @param {number} rowCount Total available data rows.
   * @returns {void}
   */
  syncWithRowCount(rowCount) {
    for (const index of [...this.checkedRowIndices]) {
      if (index >= rowCount) {
        this.checkedRowIndices.delete(index);
      }
    }

    for (let i = 0; i < rowCount; i++) {
      if (!this.checkedRowIndices.has(i)) {
        this.checkedRowIndices.add(i);
      }
    }
  }

  /**
   * @description Toggles a single row's checked state.
   * @param {number} rowIndex Zero-based row index.
   * @param {boolean} checked Whether the row should be selected.
   * @returns {void}
   */
  setRowChecked(rowIndex, checked) {
    if (checked) {
      this.checkedRowIndices.add(rowIndex);
    } else {
      this.checkedRowIndices.delete(rowIndex);
    }
    this._notify();
  }

  /**
   * @description Returns whether a row is currently selected.
   * @param {number} rowIndex Zero-based row index.
   * @returns {boolean}
   */
  isRowChecked(rowIndex) {
    return this.checkedRowIndices.has(rowIndex);
  }

  /**
   * @description Count of selected rows (0 when buckets unavailable — caller should gate).
   * @returns {number}
   */
  getSelectedCount() {
    return this.checkedRowIndices.size;
  }

  /**
   * @description Whether at least one row is selected.
   * @returns {boolean}
   */
  hasSelection() {
    return this.checkedRowIndices.size > 0;
  }

  /**
   * @description Returns selected rows mapped to data objects.
   * @param {Record<string, string>[]} rows Full data source row array.
   * @returns {{ rowData: Record<string, string>, rowIndex: number }[]}
   */
  getSelectedRows(rows) {
    return [...this.checkedRowIndices]
      .sort((a, b) => a - b)
      .filter((index) => index < rows.length)
      .map((rowIndex) => ({ rowData: rows[rowIndex], rowIndex }));
  }

  /**
   * @description Emits selection change with current count.
   * @returns {void}
   */
  notify() {
    this._notify();
  }

  /**
   * @description Emits selection change with current count.
   * @returns {void}
   * @private
   */
  _notify() {
    this.onSelectionChange(this.getSelectedCount());
  }
}
