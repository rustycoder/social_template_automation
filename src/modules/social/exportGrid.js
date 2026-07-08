/**
 * Export Grid — 4-column ratio tile previews with per-bucket preset chips.
 */
import { FORMAT_BUCKETS, PLATFORM_PRESETS } from './socialFormats.js';
import { getDefaultDimensionsForBucket } from './socialPreview.js';

const BUCKET_IDS = ['square', 'portrait', 'story', 'landscape'];

const BUCKET_RATIO_LABELS = {
  square: '1:1',
  portrait: '4:5',
  story: '9:16',
  landscape: '1.91:1',
};

export class ExportGrid {
  /**
   * @param {import('../dataSource.js').DataSource} dataSource
   * @param {import('./socialPreview.js').SocialPreview} preview
   * @param {object} callbacks
   */
  constructor(dataSource, preview, callbacks) {
    this.dataSource = dataSource;
    this.preview = preview;
    this.getTemplate = callbacks.getTemplate;
    this.getBucketCss = callbacks.getBucketCss;
    this.getMediaType = callbacks.getMediaType;
    this.getCurrentBucket = callbacks.getCurrentBucket;
    this.onSelectionChange = callbacks.onSelectionChange ?? (() => {});

    this.currentRow = 0;
    this.checkedPresetIds = new Set();

    this.gridEl = document.getElementById('export-ratio-grid');
    this.rowNavEl = document.getElementById('export-row-nav');
    this.prevRowBtn = document.getElementById('export-row-prev');
    this.nextRowBtn = document.getElementById('export-row-next');
    this.rowIndicator = document.getElementById('export-row-indicator');

    this._bindRowNav();
  }

  _bindRowNav() {
    this.prevRowBtn?.addEventListener('click', () => {
      if (this.currentRow > 0) {
        this.currentRow--;
        this.render();
      }
    });

    this.nextRowBtn?.addEventListener('click', () => {
      const rowCount = this.dataSource.getRowCount();
      if (this.currentRow < rowCount - 1) {
        this.currentRow++;
        this.render();
      }
    });
  }

  /**
   * @param {object} template
   * @param {string} mediaType
   * @returns {typeof PLATFORM_PRESETS[number][]}
   */
  _getAvailablePresetsForBucket(template, bucket, mediaType) {
    const layout = template.layouts[bucket];
    if (!layout) return [];

    return PLATFORM_PRESETS.filter((preset) => {
      if (preset.bucket !== bucket) return false;
      if (!preset.media.includes(mediaType)) return false;
      if (mediaType === 'video') return !!layout.animation;
      return true;
    });
  }

  /**
   * @param {object} template
   * @param {string} mediaType
   */
  _syncCheckedPresets(template, mediaType) {
    const availablePresets = [];
    const availableIds = new Set();

    for (const bucket of BUCKET_IDS) {
      for (const preset of this._getAvailablePresetsForBucket(template, bucket, mediaType)) {
        availableIds.add(preset.id);
        availablePresets.push(preset);
      }
    }

    for (const id of [...this.checkedPresetIds]) {
      if (!availableIds.has(id)) {
        this.checkedPresetIds.delete(id);
      }
    }

    const isSingleVideo = mediaType === 'video' && this.dataSource.mode === 'single';
    if (isSingleVideo) {
      const kept = availablePresets.find((preset) => this.checkedPresetIds.has(preset.id)) ?? availablePresets[0];
      this.checkedPresetIds.clear();
      if (kept) {
        this.checkedPresetIds.add(kept.id);
      }
      return;
    }

    for (const id of availableIds) {
      if (!this.checkedPresetIds.has(id)) {
        this.checkedPresetIds.add(id);
      }
    }
  }

  _getLayoutDimensions(template, bucket) {
    const layout = template.layouts[bucket];
    if (layout?.width && layout?.height) {
      return { width: layout.width, height: layout.height };
    }
    return getDefaultDimensionsForBucket(bucket);
  }

  _updateRowNav(rowCount) {
    const showNav = this.dataSource.mode === 'bulk' && rowCount > 1;
    this.rowNavEl?.classList.toggle('hidden', !showNav);

    if (!showNav) return;

    if (this.currentRow >= rowCount) {
      this.currentRow = Math.max(0, rowCount - 1);
    }

    const atStart = this.currentRow === 0;
    const atEnd = this.currentRow >= rowCount - 1;

    if (this.rowIndicator) {
      this.rowIndicator.textContent = `Row ${this.currentRow + 1} of ${rowCount}`;
    }
    if (this.prevRowBtn) this.prevRowBtn.disabled = atStart;
    if (this.nextRowBtn) this.nextRowBtn.disabled = atEnd;
  }

  _buildChip(preset, mediaType) {
    const isSingleVideo = mediaType === 'video' && this.dataSource.mode === 'single';
    const inputType = isSingleVideo ? 'radio' : 'checkbox';
    const inputName = isSingleVideo ? 'export-preset-video' : 'export-preset';
    const isChecked = this.checkedPresetIds.has(preset.id);

    const chip = document.createElement('label');
    chip.className = `ratio-chip${isChecked ? ' selected' : ''}`;
    chip.innerHTML = `
      <input type="${inputType}" name="${inputName}" value="${preset.id}" ${isChecked ? 'checked' : ''} />
      <span>${preset.platform}</span>
    `;

    const input = chip.querySelector('input');
    input.addEventListener('change', () => {
      if (isSingleVideo) {
        this.checkedPresetIds.clear();
        if (input.checked) {
          this.checkedPresetIds.add(preset.id);
        }
        this.gridEl?.querySelectorAll('.ratio-chip input').forEach((el) => {
          if (el !== input) el.checked = false;
        });
        this.gridEl?.querySelectorAll('.ratio-chip').forEach((el) => {
          el.classList.toggle('selected', el.querySelector('input')?.checked);
        });
      } else if (input.checked) {
        this.checkedPresetIds.add(preset.id);
        chip.classList.add('selected');
      } else {
        this.checkedPresetIds.delete(preset.id);
        chip.classList.remove('selected');
      }
      this.onSelectionChange();
    });

    return chip;
  }

  _buildTile(bucket, template, rowData, mediaType) {
    const bucketMeta = FORMAT_BUCKETS[bucket];
    const label = bucketMeta?.label ?? bucket;
    const ratioLabel = BUCKET_RATIO_LABELS[bucket] ?? '';
    const layout = template.layouts[bucket];
    const { width: realW, height: realH } = this._getLayoutDimensions(template, bucket);

    const tile = document.createElement('div');
    tile.className = 'ratio-tile';
    tile.dataset.bucket = bucket;

    const labelRow = document.createElement('div');
    labelRow.className = 'ratio-tile-label';
    labelRow.innerHTML = `<span class="ratio-tile-name">${label}</span><span class="ratio-tile-ratio">${ratioLabel}</span>`;

    const box = document.createElement('div');
    box.className = 'ratio-tile-box';
    box.style.aspectRatio = `${realW} / ${realH}`;

    if (!layout) {
      const empty = document.createElement('div');
      empty.className = 'ratio-tile-empty';
      empty.textContent = `No ${label.toLowerCase()} layout for this template`;
      box.appendChild(empty);
    } else {
      const mount = document.createElement('div');
      mount.className = 'preview-mount ratio-tile-mount';
      box.appendChild(mount);

      const css = this.getBucketCss(bucket);
      requestAnimationFrame(() => {
        this.preview.renderInto(mount, rowData, css, realW, realH);
      });
    }

    const strip = document.createElement('div');
    strip.className = 'ratio-control-strip';
    const presets = this._getAvailablePresetsForBucket(template, bucket, mediaType);

    if (presets.length === 0) {
      strip.classList.add('ratio-control-strip--empty');
    } else {
      for (const preset of presets) {
        strip.appendChild(this._buildChip(preset, mediaType));
      }
    }

    tile.appendChild(labelRow);
    tile.appendChild(box);
    tile.appendChild(strip);

    return tile;
  }

  render() {
    if (!this.gridEl) return;

    const rowCount = this.dataSource.getRowCount();
    if (rowCount === 0) {
      this.gridEl.innerHTML = '';
      this._updateRowNav(0);
      this.onSelectionChange();
      return;
    }

    if (this.currentRow >= rowCount) {
      this.currentRow = rowCount - 1;
    }

    const template = this.getTemplate();
    const mediaType = this.getMediaType();
    const rowData = this.dataSource.getRows()[this.currentRow];

    this._syncCheckedPresets(template, mediaType);
    this._updateRowNav(rowCount);

    this.gridEl.innerHTML = '';
    for (const bucket of BUCKET_IDS) {
      this.gridEl.appendChild(this._buildTile(bucket, template, rowData, mediaType));
    }

    this.onSelectionChange();
  }

  getSelectedPresetIds() {
    return [...this.checkedPresetIds];
  }

  getSelectedCount() {
    return this.checkedPresetIds.size;
  }
}
