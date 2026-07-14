/**
 * @file features/auth/adminUI.js
 * @description Admin page — manage categories and templates via /api/admin/*.
 */

import { api, ApiError } from './api.js';
import { authService } from './auth.js';
import { AdminHtmlEditor } from './adminHtmlEditor.js';
import { createPostCardPreview } from '../components/PostCard.js';
import { renderGalleryPreview } from '../rendering/templateGalleryPreview.js';
import { parseHtmlTemplate } from '../../templates/htmlTemplateLoader.js';
import { BUCKET_RATIO_LABELS } from '../shared/constants.js';
import { formatHtmlSource } from '../shared/formatHtml.js';
import { getSampleRowForTemplate } from '../domain/templateSampleData.js';

const PREVIEW_BUCKETS = ['square', 'portrait', 'story', 'landscape'];
const FIELD_TYPES = ['text', 'textarea', 'image'];
const ADMIN_PAGE_SIZE = 12;

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function toast(message, type = 'success') {
  window.dispatchEvent(new CustomEvent('toast', { detail: { message, type } }));
}

export class AdminUI {
  /**
   * @param {import('./authUI.js').AuthUI} authUI
   * @param {{ onCatalogChanged?: () => Promise<void> | void, standalone?: boolean }} [deps]
   */
  constructor(authUI, deps = {}) {
    this.authUI = authUI;
    this.onCatalogChanged = deps.onCatalogChanged ?? (() => {});
    this.standalone = !!deps.standalone;

    this.page = document.getElementById('admin-page');
    this.backBtn = document.getElementById('btn-admin-back');
    this.errorEl = document.getElementById('admin-error');
    this.loadingEl = document.getElementById('admin-loading');

    this.tabBtns = document.querySelectorAll('#admin-tabs .tab-switcher__btn');
    this.templatesPanel = document.getElementById('admin-templates-panel');
    this.categoriesPanel = document.getElementById('admin-categories-panel');

    this.templatesGrid = document.getElementById('admin-templates-grid');
    this.categoriesBody = document.getElementById('admin-categories-body');
    this.templateSearch = document.getElementById('admin-template-search');
    this.templateStatusFilter = document.getElementById('admin-template-status-filter');
    this.templateCategoryFilter = document.getElementById('admin-template-category-filter');
    this.categorySearch = document.getElementById('admin-category-search');

    this.templatesPagination = document.getElementById('admin-templates-pagination');
    this.categoriesPagination = document.getElementById('admin-categories-pagination');

    this.btnNewTemplate = document.getElementById('btn-admin-new-template');
    this.btnNewCategory = document.getElementById('btn-admin-new-category');

    this.templateFormOverlay = document.getElementById('admin-template-form-overlay');
    this.templateFormTitle = document.getElementById('admin-template-form-title');
    this.templateForm = document.getElementById('admin-template-form');
    this.templateFormClose = document.getElementById('admin-template-form-close');
    this.templateFormCancel = document.getElementById('admin-template-form-cancel');
    this.templateFormError = document.getElementById('admin-template-form-error');
    this.templateFormSubmit = document.getElementById('admin-template-form-submit');
    this.fieldsList = document.getElementById('admin-fields-list');
    this.btnAddField = document.getElementById('btn-admin-add-field');
    this.samplePreviewMount = document.getElementById('admin-template-sample-mount');
    this.samplePreviewFrame = document.querySelector('.admin-sample-preview');

    this.categoryFormOverlay = document.getElementById('admin-category-form-overlay');
    this.categoryFormTitle = document.getElementById('admin-category-form-title');
    this.categoryForm = document.getElementById('admin-category-form');
    this.categoryFormClose = document.getElementById('admin-category-form-close');
    this.categoryFormCancel = document.getElementById('admin-category-form-cancel');
    this.categoryFormError = document.getElementById('admin-category-form-error');

    /** @type {'templates' | 'categories'} */
    this.activeTab = 'templates';
    /** @type {object[]} */
    this._templates = [];
    /** @type {object[]} */
    this._categories = [];
    this._templatePage = 1;
    this._categoryPage = 1;
    /** @type {string | null} */
    this._editingTemplateId = null;
    /** @type {string} */
    this._editingPreviewBucket = 'square';
    /** @type {string | null} */
    this._editingCategoryId = null;
    this._previousStep = 1;
    this._visible = false;
    this._loadId = 0;
    /** @type {import('./adminHtmlEditor.js').AdminHtmlEditor | null} */
    this._htmlEditor = null;
    /** @type {ReturnType<typeof setTimeout> | null} */
    this._samplePreviewTimer = null;

    this._bindEvents();
  }

  _ensureHtmlEditor() {
    if (this._htmlEditor) return this._htmlEditor;
    const textarea = document.getElementById('admin-template-html-source');
    if (!(textarea instanceof HTMLTextAreaElement)) return null;
    this._htmlEditor = new AdminHtmlEditor(textarea, {
      onChange: () => this._scheduleSamplePreview(),
    });
    this._htmlEditor.mount();
    return this._htmlEditor;
  }

  _bindEvents() {
    this.backBtn?.addEventListener('click', () => this.hide());

    this.tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.adminTab;
        if (tab) this._switchTab(tab);
      });
    });

    this.templateSearch?.addEventListener('input', () => {
      this._templatePage = 1;
      this._renderTemplates();
    });
    this.templateStatusFilter?.addEventListener('change', () => {
      this._templatePage = 1;
      this._renderTemplates();
    });
    this.templateCategoryFilter?.addEventListener('change', () => {
      this._templatePage = 1;
      this._renderTemplates();
    });
    this.categorySearch?.addEventListener('input', () => {
      this._categoryPage = 1;
      this._renderCategories();
    });

    this.page?.addEventListener('click', (e) => {
      const prev = e.target?.closest?.('[data-admin-page-prev]');
      const next = e.target?.closest?.('[data-admin-page-next]');
      if (prev) {
        this._changePage(prev.dataset.adminPagePrev, -1);
      } else if (next) {
        this._changePage(next.dataset.adminPageNext, 1);
      }
    });

    this.btnNewTemplate?.addEventListener('click', () => this._openTemplateForm(null));
    this.btnNewCategory?.addEventListener('click', () => this._openCategoryForm(null));

    this.templateFormClose?.addEventListener('click', () => this._closeTemplateForm());
    this.templateFormCancel?.addEventListener('click', () => this._closeTemplateForm());
    this.templateFormOverlay?.addEventListener('click', (e) => {
      if (e.target === this.templateFormOverlay) this._closeTemplateForm();
    });
    this.templateForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this._submitTemplateForm();
    });
    this.btnAddField?.addEventListener('click', () => {
      this._addFieldRow();
      this._scheduleSamplePreview();
    });
    document.getElementById('admin-template-html')?.addEventListener('change', (e) => {
      this._loadHtmlFileIntoEditor(e.target?.files?.[0]);
    });

    this.categoryFormClose?.addEventListener('click', () => this._closeCategoryForm());
    this.categoryFormCancel?.addEventListener('click', () => this._closeCategoryForm());
    this.categoryFormOverlay?.addEventListener('click', (e) => {
      if (e.target === this.categoryFormOverlay) this._closeCategoryForm();
    });
    this.categoryForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this._submitCategoryForm();
    });
  }

  isAdmin() {
    return authService.getUser()?.role === 'admin';
  }

  async show() {
    // Prefer restoring an existing JWT over opening the login modal.
    if (!authService.isLoggedIn()) {
      const hasSession = await authService.ensureSession();
      if (!hasSession) {
        const loggedIn = await this.authUI.requireLogin();
        if (!loggedIn) {
          if (this.standalone) {
            window.location.href = '/';
          }
          return;
        }
      }
    } else {
      try {
        await authService.refreshUser();
      } catch {
        /* refreshUser may logout on 401 */
      }
    }

    if (!this.isAdmin()) {
      toast('Admin access required. Sign in with an admin account.', 'error');
      if (this.standalone) {
        window.location.href = '/';
      }
      return;
    }

    this.authUI._closeDropdown();
    this._visible = true;

    if (this.standalone) {
      this.page?.classList.add('active');
      await this._load();
      return;
    }

    this._previousStep =
      document.querySelector('.step-panel.active')?.id?.replace('step-', '') || '1';

    const main = document.getElementById('main-content');
    if (main) main.dataset.layoutMode = 'admin';

    const app = document.getElementById('app');
    if (app) app.dataset.admin = 'true';

    document.querySelectorAll('.step-panel').forEach((panel) => panel.classList.remove('active'));
    this.page?.classList.add('active');
    this._syncFooterPanel('admin');

    await this._load();
  }

  hide() {
    if (this.standalone) {
      this._closeTemplateForm();
      this._closeCategoryForm();
      window.location.href = '/';
      return;
    }

    this._visible = false;
    this._loadId += 1;
    this.page?.classList.remove('active');
    this._closeTemplateForm();
    this._closeCategoryForm();

    const step = parseInt(this._previousStep, 10) || 1;
    const app = document.getElementById('app');
    const main = document.getElementById('main-content');
    if (main) main.dataset.layoutMode = step === 2 ? 'split' : 'default';
    if (app) {
      delete app.dataset.admin;
      app.dataset.activeStep = String(step);
    }

    document.querySelectorAll('.step-panel').forEach((panel) => panel.classList.remove('active'));
    document.getElementById(`step-${step}`)?.classList.add('active');
    this._syncFooterPanel(String(step));
  }

  _syncFooterPanel(activeStep) {
    document.getElementById('app-footer')?.querySelectorAll('.footer-panel').forEach((panel) => {
      panel.classList.toggle('active', panel.dataset.footerStep === activeStep);
    });
  }

  _switchTab(tab) {
    this.activeTab = tab === 'categories' ? 'categories' : 'templates';

    this.tabBtns.forEach((btn) => {
      const active = btn.dataset.adminTab === this.activeTab;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    this.templatesPanel?.classList.toggle('hidden', this.activeTab !== 'templates');
    this.categoriesPanel?.classList.toggle('hidden', this.activeTab !== 'categories');
  }

  _setLoading(loading) {
    this.loadingEl?.classList.toggle('hidden', !loading);
  }

  _setError(message) {
    if (!this.errorEl) return;
    if (!message) {
      this.errorEl.textContent = '';
      this.errorEl.classList.add('hidden');
      return;
    }
    this.errorEl.textContent = message;
    this.errorEl.classList.remove('hidden');
  }

  async _load() {
    const loadId = ++this._loadId;
    this._setError('');
    this._setLoading(true);
    try {
      const [{ templates }, { categories }] = await Promise.all([
        api.adminListTemplates(),
        api.adminListCategories(),
      ]);
      if (loadId !== this._loadId) return;
      this._templates = templates || [];
      this._categories = categories || [];
      this._templatePage = 1;
      this._categoryPage = 1;
      this._renderTemplates();
      this._renderCategories();
      this._fillCategorySelects();
    } catch (error) {
      if (loadId !== this._loadId) return;
      this._setError(error instanceof ApiError ? error.message : 'Failed to load admin data');
    } finally {
      if (loadId === this._loadId) this._setLoading(false);
    }
  }

  _fillCategorySelects() {
    const formSelect = document.getElementById('admin-template-category');
    if (formSelect) {
      const current = formSelect.value;
      formSelect.innerHTML = '';
      for (const cat of this._categories) {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = `${cat.label}${cat.isActive ? '' : ' (inactive)'}`;
        formSelect.appendChild(opt);
      }
      if (current && [...formSelect.options].some((o) => o.value === current)) {
        formSelect.value = current;
      }
    }

    const filterSelect = this.templateCategoryFilter;
    if (filterSelect) {
      const currentFilter = filterSelect.value;
      filterSelect.innerHTML = '<option value="">All categories</option>';
      const sorted = [...this._categories].sort((a, b) =>
        String(a.label || a.id).localeCompare(String(b.label || b.id))
      );
      for (const cat of sorted) {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.label || cat.id;
        filterSelect.appendChild(opt);
      }
      if (currentFilter && [...filterSelect.options].some((o) => o.value === currentFilter)) {
        filterSelect.value = currentFilter;
      }
    }
  }

  _categoryLabel(id) {
    return this._categories.find((c) => c.id === id)?.label || id;
  }

  /**
   * @param {object[]} rows
   * @param {number} page
   */
  _paginate(rows, page) {
    const total = rows.length;
    const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE) || 1);
    const current = Math.min(Math.max(1, page), totalPages);
    const start = (current - 1) * ADMIN_PAGE_SIZE;
    return {
      page: current,
      totalPages,
      total,
      start: total === 0 ? 0 : start + 1,
      end: Math.min(start + ADMIN_PAGE_SIZE, total),
      rows: rows.slice(start, start + ADMIN_PAGE_SIZE),
    };
  }

  /**
   * @param {'templates'|'categories'} kind
   * @param {number} delta
   */
  _changePage(kind, delta) {
    if (kind === 'templates') {
      this._templatePage += delta;
      this._renderTemplates();
    } else if (kind === 'categories') {
      this._categoryPage += delta;
      this._renderCategories();
    }
  }

  /**
   * @param {HTMLElement|null} el
   * @param {'templates'|'categories'} kind
   * @param {{ page: number, totalPages: number, total: number, start: number, end: number }} info
   */
  _updatePagination(el, kind, info) {
    if (!el) return;
    const label = el.querySelector(`[data-admin-page-label="${kind}"]`);
    const prev = el.querySelector(`[data-admin-page-prev="${kind}"]`);
    const next = el.querySelector(`[data-admin-page-next="${kind}"]`);

    if (info.total === 0) {
      el.hidden = true;
      return;
    }

    el.hidden = false;
    if (label) {
      label.textContent = `Showing ${info.start}–${info.end} of ${info.total} · Page ${info.page} of ${info.totalPages}`;
    }
    if (prev) prev.disabled = info.page <= 1;
    if (next) next.disabled = info.page >= info.totalPages;
  }

  _filterTemplates() {
    const q = (this.templateSearch?.value || '').trim().toLowerCase();
    const status = this.templateStatusFilter?.value || 'active';
    const categoryId = this.templateCategoryFilter?.value || '';
    let rows = this._templates;

    if (status === 'active') {
      rows = rows.filter((t) => !!t.isActive);
    } else if (status === 'inactive') {
      rows = rows.filter((t) => !t.isActive);
    }

    if (categoryId) {
      rows = rows.filter((t) => t.categoryId === categoryId);
    }

    if (!q) return rows;
    return rows.filter(
      (t) =>
        t.name?.toLowerCase().includes(q) ||
        t.id?.toLowerCase().includes(q) ||
        t.categoryId?.toLowerCase().includes(q) ||
        this._categoryLabel(t.categoryId).toLowerCase().includes(q)
    );
  }

  _filterCategories() {
    const q = (this.categorySearch?.value || '').trim().toLowerCase();
    let rows = this._categories;
    if (!q) return rows;
    return rows.filter(
      (c) => c.label?.toLowerCase().includes(q) || c.id?.toLowerCase().includes(q)
    );
  }

  /**
   * @param {object} row
   * @returns {object | null}
   */
  _toPreviewTemplate(row) {
    const rawHtml = row.htmlSource || row.html_source || '';
    if (!rawHtml) return null;
    try {
      return parseHtmlTemplate(rawHtml, {
        id: row.id,
        name: row.name,
        category: row.categoryId || 'general',
        previewBucket: row.previewBucket || 'square',
        fields: row.fields || [],
      });
    } catch (err) {
      console.warn('[AdminUI] Failed to parse template for preview:', row.id, err);
      return null;
    }
  }

  _renderTemplates() {
    if (!this.templatesGrid) return;
    const filtered = this._filterTemplates();
    const pageInfo = this._paginate(filtered, this._templatePage);
    this._templatePage = pageInfo.page;
    this._updatePagination(this.templatesPagination, 'templates', pageInfo);

    this.templatesGrid.innerHTML = '';
    if (pageInfo.rows.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'admin-empty-cell';
      empty.textContent = 'No templates found.';
      this.templatesGrid.appendChild(empty);
      return;
    }

    for (const t of pageInfo.rows) {
      const bucket = t.previewBucket || 'square';
      const card = document.createElement('article');
      card.className = 'template-card admin-template-card';
      card.dataset.template = t.id;
      card.dataset.galleryBucket = bucket;
      if (!t.isActive) card.classList.add('admin-template-card--inactive');

      const preview = createPostCardPreview({
        bucket,
        templateId: t.id,
        aspectLabel: BUCKET_RATIO_LABELS[bucket] ?? bucket,
      });
      card.appendChild(preview);

      const body = document.createElement('div');
      body.className = 'template-card-body post-card__body admin-template-card__body';
      body.innerHTML = `
        <h4 class="template-card-heading post-card__heading">${escapeHtml(t.name)}</h4>
        <span class="template-card-category post-card__category">${escapeHtml(this._categoryLabel(t.categoryId))}</span>
        <div class="admin-mono">${escapeHtml(t.id)}</div>
        <span class="admin-status-badge ${t.isActive ? 'active' : 'inactive'}">
          ${t.isActive ? 'Active' : 'Inactive'}
        </span>
      `;
      card.appendChild(body);

      const actions = document.createElement('div');
      actions.className = 'admin-template-card__actions';
      actions.innerHTML = `
        <button type="button" class="btn btn-outline btn-sm" data-action="edit">Edit</button>
        <button type="button" class="btn btn-outline btn-sm" data-action="toggle">
          ${t.isActive ? 'Deactivate' : 'Activate'}
        </button>
        <button type="button" class="btn btn-outline btn-sm admin-template-card__delete" data-action="delete">Delete</button>
      `;
      actions.querySelector('[data-action="edit"]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this._openTemplateForm(t.id);
      });
      actions.querySelector('[data-action="toggle"]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this._toggleTemplate(t);
      });
      actions.querySelector('[data-action="delete"]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this._deleteTemplate(t);
      });
      card.appendChild(actions);

      this.templatesGrid.appendChild(card);

      const previewMount = card.querySelector('.template-preview-mount');
      const parsed = this._toPreviewTemplate(t);
      if (parsed && previewMount) {
        renderGalleryPreview(parsed, previewMount, { bucket });
      } else if (previewMount) {
        previewMount.innerHTML = '<span class="gallery-preview-empty">No preview</span>';
      }
    }
  }

  _renderCategories() {
    if (!this.categoriesBody) return;
    const filtered = this._filterCategories();
    const pageInfo = this._paginate(filtered, this._categoryPage);
    this._categoryPage = pageInfo.page;
    this._updatePagination(this.categoriesPagination, 'categories', pageInfo);

    this.categoriesBody.innerHTML = '';

    if (pageInfo.rows.length === 0) {
      this.categoriesBody.innerHTML =
        '<tr><td colspan="4" class="admin-empty-cell">No categories found.</td></tr>';
      return;
    }

    for (const c of pageInfo.rows) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <strong>${escapeHtml(c.label)}</strong>
          <div class="admin-mono">${escapeHtml(c.id)}</div>
        </td>
        <td>${escapeHtml(c.sortOrder)}</td>
        <td>
          <span class="admin-status-badge ${c.isActive ? 'active' : 'inactive'}">
            ${c.isActive ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td class="admin-actions">
          <button type="button" class="btn btn-outline btn-sm" data-action="edit">Edit</button>
          <button type="button" class="btn btn-outline btn-sm" data-action="toggle">
            ${c.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </td>
      `;
      tr.querySelector('[data-action="edit"]')?.addEventListener('click', () =>
        this._openCategoryForm(c)
      );
      tr.querySelector('[data-action="toggle"]')?.addEventListener('click', () =>
        this._toggleCategory(c)
      );
      this.categoriesBody.appendChild(tr);
    }
  }

  _clearFieldsList() {
    if (this.fieldsList) this.fieldsList.innerHTML = '';
  }

  /**
   * @param {HTMLElement} wrap
   * @param {{ type?: string, sample?: string, key?: string }} field
   */
  _renderSampleControl(wrap, field) {
    const type = field.type || 'text';
    const sample = field.sample ?? '';
    wrap.innerHTML = '';

    if (type === 'image') {
      wrap.className = 'admin-field-sample-wrap admin-field-sample-wrap--image';
      const thumb = document.createElement('div');
      thumb.className = 'admin-field-sample-thumb';
      const img = document.createElement('img');
      img.alt = '';
      if (sample) {
        img.src = sample;
      } else {
        img.classList.add('hidden');
      }
      thumb.appendChild(img);
      if (!sample) {
        const empty = document.createElement('span');
        empty.textContent = '—';
        thumb.appendChild(empty);
      }

      const controls = document.createElement('div');
      controls.className = 'admin-field-sample-image__controls';

      const urlInput = document.createElement('input');
      urlInput.type = 'text';
      urlInput.className = 'text-input admin-field-sample';
      urlInput.dataset.f = 'sample-url';
      urlInput.placeholder = 'Image URL';
      urlInput.value = sample.startsWith('data:') ? '' : sample;

      const fileLabel = document.createElement('label');
      fileLabel.className = 'btn btn-outline btn-sm admin-field-sample-upload';
      fileLabel.textContent = 'Upload';

      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.hidden = true;
      fileInput.dataset.f = 'sample-file';
      fileLabel.appendChild(fileInput);

      const hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.dataset.f = 'sample';
      hidden.value = sample;

      const syncThumb = (value) => {
        hidden.value = value || '';
        if (value) {
          img.src = value;
          img.classList.remove('hidden');
          thumb.querySelector('span')?.remove();
        } else {
          img.removeAttribute('src');
          img.classList.add('hidden');
          if (!thumb.querySelector('span')) {
            const empty = document.createElement('span');
            empty.textContent = '—';
            thumb.appendChild(empty);
          }
        }
        this._scheduleSamplePreview();
      };

      urlInput.addEventListener('input', () => {
        syncThumb(urlInput.value.trim());
      });
      fileInput.addEventListener('change', () => {
        const file = fileInput.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = typeof reader.result === 'string' ? reader.result : '';
          urlInput.value = '';
          syncThumb(dataUrl);
        };
        reader.onerror = () => toast('Failed to read image file', 'error');
        reader.readAsDataURL(file);
      });

      controls.appendChild(urlInput);
      controls.appendChild(fileLabel);
      wrap.appendChild(thumb);
      wrap.appendChild(controls);
      wrap.appendChild(hidden);
      return;
    }

    wrap.className = 'admin-field-sample-wrap';
    const input =
      type === 'textarea' ? document.createElement('textarea') : document.createElement('input');
    if (input instanceof HTMLInputElement) input.type = 'text';
    if (input instanceof HTMLTextAreaElement) {
      input.rows = 3;
    }
    input.className = 'text-input admin-field-sample';
    input.dataset.f = 'sample';
    input.placeholder = 'Sample text shown in gallery preview';
    input.value = sample;
    input.addEventListener('input', () => this._scheduleSamplePreview());
    wrap.appendChild(input);
  }

  _addFieldRow(field = { key: '', label: '', type: 'text', required: true, sample: '' }) {
    if (!this.fieldsList) return;
    const row = document.createElement('div');
    row.className = 'admin-field-row';
    row.innerHTML = `
      <div class="admin-field-row__meta">
        <div class="admin-field-pair admin-field-pair--key">
          <label class="admin-field-pair__label">Field <span class="admin-field-pair__hint">{{KEY}}</span></label>
          <input type="text" class="text-input" data-f="key" placeholder="PHOTO" value="${escapeHtml(field.key)}" required title="Used in HTML as {{KEY}} and as the form label" />
        </div>
        <select class="text-input" data-f="type" aria-label="Field type">
          ${FIELD_TYPES.map(
            (type) =>
              `<option value="${type}" ${field.type === type ? 'selected' : ''}>${type}</option>`
          ).join('')}
        </select>
        <div class="admin-field-row__actions">
          <label class="admin-check"><input type="checkbox" data-f="required" ${field.required ? 'checked' : ''} /> Req</label>
          <button type="button" class="btn-icon" data-f="remove" aria-label="Remove field">✕</button>
        </div>
      </div>
    `;
    const sampleWrap = document.createElement('div');
    sampleWrap.className = 'admin-field-sample-wrap';
    row.appendChild(sampleWrap);
    this._renderSampleControl(sampleWrap, field);

    row.querySelector('[data-f="remove"]')?.addEventListener('click', () => {
      row.remove();
      this._scheduleSamplePreview();
    });
    row.querySelector('[data-f="type"]')?.addEventListener('change', (e) => {
      const type = /** @type {HTMLSelectElement} */ (e.target).value;
      const key = row.querySelector('[data-f="key"]')?.value || '';
      const currentSample = sampleWrap.querySelector('[data-f="sample"]')?.value || '';
      this._renderSampleControl(sampleWrap, { type, key, sample: currentSample });
      this._scheduleSamplePreview();
    });
    row.querySelector('[data-f="key"]')?.addEventListener('input', () => this._scheduleSamplePreview());

    this.fieldsList.appendChild(row);
  }

  _collectFields() {
    /** @type {Array<{key: string, label: string, type: string, required: boolean, sample?: string}>} */
    const fields = [];
    this.fieldsList?.querySelectorAll('.admin-field-row').forEach((row) => {
      const key = row.querySelector('[data-f="key"]')?.value?.trim().toUpperCase() || '';
      const type = row.querySelector('[data-f="type"]')?.value || 'text';
      const required = !!row.querySelector('[data-f="required"]')?.checked;
      let sample = '';
      if (type === 'image') {
        sample = row.querySelector('input[data-f="sample"]')?.value?.trim() || '';
      } else {
        sample =
          row.querySelector('textarea[data-f="sample"], input[data-f="sample"]')?.value?.trim() ||
          '';
      }
      if (!key) return;
      /** @type {{key: string, label: string, type: string, required: boolean, sample?: string}} */
      const entry = { key, label: key, type, required };
      if (sample) entry.sample = sample;
      fields.push(entry);
    });
    return fields;
  }

  /**
   * Prefer stored samples; fall back to builtin/gallery defaults so edit opens filled.
   * @param {object} template
   * @returns {Array<object>}
   */
  _fieldsWithFilledSamples(template) {
    const fields = Array.isArray(template.fields) ? template.fields : [];
    const defaults = getSampleRowForTemplate({
      id: template.id,
      fields,
    });
    return fields.map((f) => {
      const existing =
        typeof f.sample === 'string' && f.sample.trim()
          ? f.sample
          : typeof f.placeholder === 'string' && f.placeholder.trim()
            ? f.placeholder
            : '';
      const sample = existing || defaults[f.key] || '';
      return { ...f, sample };
    });
  }

  _scheduleSamplePreview() {
    if (this._samplePreviewTimer) clearTimeout(this._samplePreviewTimer);
    this._samplePreviewTimer = setTimeout(() => this._refreshSamplePreview(), 120);
  }

  _refreshSamplePreview() {
    if (!this.samplePreviewMount) return;
    const htmlSource = this._htmlEditor?.getValue() ?? '';
    const bucket = this._editingPreviewBucket || 'square';
    const id =
      document.getElementById('admin-template-id')?.value?.trim() ||
      this._editingTemplateId ||
      'preview-template';
    const name =
      document.getElementById('admin-template-name')?.value?.trim() || 'Preview';
    const fields = this._collectFields();

    if (this.samplePreviewFrame) {
      this.samplePreviewFrame.dataset.galleryBucket = bucket;
    }

    if (!htmlSource.trim()) {
      this.samplePreviewMount.innerHTML =
        '<span class="gallery-preview-empty">Add HTML to preview</span>';
      return;
    }

    let parsed;
    try {
      parsed = parseHtmlTemplate(htmlSource, {
        id,
        name,
        category: 'general',
        previewBucket: bucket,
        fields,
      });
    } catch (err) {
      console.warn('[AdminUI] Sample preview parse failed', err);
      this.samplePreviewMount.innerHTML =
        '<span class="gallery-preview-empty">Invalid HTML</span>';
      return;
    }

    const rowData = {};
    for (const field of fields) {
      rowData[field.key] = field.sample || '';
    }
    // Fill any remaining placeholders from defaults
    const defaults = getSampleRowForTemplate(parsed);
    for (const [key, value] of Object.entries(defaults)) {
      if (!rowData[key]) rowData[key] = value;
    }

    renderGalleryPreview(parsed, this.samplePreviewMount, { bucket, rowData });
  }

  async _loadHtmlFileIntoEditor(file) {
    if (!file) return;
    try {
      const text = await file.text();
      const editor = this._ensureHtmlEditor();
      if (editor) editor.setValue(text, { format: true });
      else {
        const textarea = document.getElementById('admin-template-html-source');
        if (textarea) textarea.value = formatHtmlSource(text);
      }
      toast('HTML loaded into editor');
      this._scheduleSamplePreview();
    } catch {
      toast('Failed to read HTML file', 'error');
    }
  }

  async _openTemplateForm(templateId) {
    this._editingTemplateId = templateId;
    this._editingPreviewBucket = 'square';
    this._setFormError(this.templateFormError, '');
    this.templateForm?.reset();
    this._clearFieldsList();
    this._fillCategorySelects();

    const idInput = document.getElementById('admin-template-id');
    const nameInput = document.getElementById('admin-template-name');
    const categorySelect = document.getElementById('admin-template-category');
    const htmlHint = document.getElementById('admin-template-html-hint');
    const htmlFileInput = document.getElementById('admin-template-html');
    const htmlEditor = this._ensureHtmlEditor();
    const htmlTextarea = document.getElementById('admin-template-html-source');

    if (htmlFileInput) htmlFileInput.value = '';
    if (htmlTextarea) htmlTextarea.required = !templateId;
    htmlEditor?.setValue('');
    if (idInput) {
      idInput.disabled = !!templateId;
      idInput.value = '';
    }

    if (this.templateFormTitle) {
      this.templateFormTitle.textContent = templateId ? 'Edit template' : 'Upload template';
    }
    if (this.templateFormSubmit) {
      this.templateFormSubmit.textContent = templateId ? 'Save changes' : 'Upload template';
    }
    if (htmlHint) {
      htmlHint.textContent = templateId
        ? 'Edit the formatted HTML below, or use “Load from file” to replace it.'
        : 'Paste HTML or load a file. It will be formatted for editing. Must include {{FIELD}} placeholders.';
    }

    if (templateId) {
      try {
        const { template } = await api.adminGetTemplate(templateId);
        if (nameInput) nameInput.value = template.name || '';
        if (idInput) idInput.value = template.id || '';
        if (categorySelect) categorySelect.value = template.categoryId || '';
        this._editingPreviewBucket = template.previewBucket || 'square';
        htmlEditor?.setValue(template.htmlSource || '', { format: true });
        const filledFields = this._fieldsWithFilledSamples(template);
        if (filledFields.length === 0) this._addFieldRow();
        else filledFields.forEach((f) => this._addFieldRow(f));
      } catch (error) {
        toast(error instanceof ApiError ? error.message : 'Failed to load template', 'error');
        return;
      }
    } else {
      this._addFieldRow({
        key: 'HEADLINE',
        label: 'Headline',
        type: 'textarea',
        required: true,
        sample: 'Add your headline here.',
      });
      this._addFieldRow({
        key: 'PHOTO',
        label: 'Photo',
        type: 'image',
        required: true,
        sample:
          'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1080&q=80',
      });
      this._editingPreviewBucket = 'square';
      htmlEditor?.setValue(
        `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
html, body { margin: 0; padding: 0; width: 1080px; height: 1080px; overflow: hidden; }
.card { width: 1080px; height: 1080px; }
</style>
</head>
<body>
<div class="card">{{HEADLINE}}</div>
</body>
</html>`,
        { format: true }
      );
    }

    this.templateFormOverlay?.classList.remove('hidden');
    this._scheduleSamplePreview();
    queueMicrotask(() => htmlEditor?.focus());
  }

  _closeTemplateForm() {
    this.templateFormOverlay?.classList.add('hidden');
    this._editingTemplateId = null;
    this._editingPreviewBucket = 'square';
    if (this._samplePreviewTimer) {
      clearTimeout(this._samplePreviewTimer);
      this._samplePreviewTimer = null;
    }
    if (this.samplePreviewMount) this.samplePreviewMount.innerHTML = '';
  }

  _setFormError(el, message) {
    if (!el) return;
    if (!message) {
      el.textContent = '';
      el.classList.add('hidden');
      return;
    }
    el.textContent = message;
    el.classList.remove('hidden');
  }

  async _submitTemplateForm() {
    const name = document.getElementById('admin-template-name')?.value?.trim();
    const id = document.getElementById('admin-template-id')?.value?.trim();
    const categoryId = document.getElementById('admin-template-category')?.value;
    const previewBucket = this._editingPreviewBucket || 'square';
    const htmlSource = this._htmlEditor?.getValue() ?? document.getElementById('admin-template-html-source')?.value ?? '';
    const fields = this._collectFields();

    if (!name || !categoryId) {
      this._setFormError(this.templateFormError, 'Name and category are required');
      return;
    }
    if (fields.length === 0) {
      this._setFormError(this.templateFormError, 'Add at least one field');
      return;
    }
    if (!htmlSource.trim()) {
      this._setFormError(this.templateFormError, 'HTML source is required');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('category_id', categoryId);
    formData.append('preview_bucket', previewBucket);
    formData.append('fields_json', JSON.stringify(fields));
    formData.append('html', htmlSource);
    if (id && !this._editingTemplateId) formData.append('id', id);

    if (this.templateFormSubmit) this.templateFormSubmit.disabled = true;
    this._setFormError(this.templateFormError, '');

    try {
      if (this._editingTemplateId) {
        await api.adminUpdateTemplate(this._editingTemplateId, formData);
        toast('Template updated');
      } else {
        await api.adminCreateTemplate(formData);
        toast('Template uploaded');
      }
      this._closeTemplateForm();
      await this._load();
      await this.onCatalogChanged();
    } catch (error) {
      this._setFormError(
        this.templateFormError,
        error instanceof ApiError ? error.message : 'Save failed'
      );
    } finally {
      if (this.templateFormSubmit) this.templateFormSubmit.disabled = false;
    }
  }

  async _toggleTemplate(template) {
    try {
      await api.adminUpdateTemplate(template.id, { isActive: !template.isActive });
      toast(template.isActive ? 'Template deactivated' : 'Template activated');
      await this._load();
      await this.onCatalogChanged();
    } catch (error) {
      toast(error instanceof ApiError ? error.message : 'Update failed', 'error');
    }
  }

  async _deleteTemplate(template) {
    const ok = window.confirm(
      `Delete template “${template.name}” permanently?\n\nThis cannot be undone.`
    );
    if (!ok) return;
    try {
      await api.adminDeleteTemplate(template.id);
      toast('Template deleted');
      await this._load();
      await this.onCatalogChanged();
    } catch (error) {
      toast(error instanceof ApiError ? error.message : 'Delete failed', 'error');
    }
  }

  _openCategoryForm(category) {
    this._editingCategoryId = category?.id || null;
    this._setFormError(this.categoryFormError, '');
    this.categoryForm?.reset();

    const idInput = document.getElementById('admin-category-id');
    const labelInput = document.getElementById('admin-category-label');
    const sortInput = document.getElementById('admin-category-sort');
    const activeInput = document.getElementById('admin-category-active');

    if (this.categoryFormTitle) {
      this.categoryFormTitle.textContent = category ? 'Edit category' : 'Add category';
    }
    if (idInput) {
      idInput.disabled = !!category;
      idInput.value = category?.id || '';
      idInput.required = !category;
    }
    if (labelInput) labelInput.value = category?.label || '';
    if (sortInput) sortInput.value = category?.sortOrder ?? 0;
    if (activeInput) activeInput.checked = category ? !!category.isActive : true;

    this.categoryFormOverlay?.classList.remove('hidden');
  }

  _closeCategoryForm() {
    this.categoryFormOverlay?.classList.add('hidden');
    this._editingCategoryId = null;
  }

  async _submitCategoryForm() {
    const label = document.getElementById('admin-category-label')?.value?.trim();
    const id = document.getElementById('admin-category-id')?.value?.trim();
    const sortOrder = Number(document.getElementById('admin-category-sort')?.value || 0);
    const isActive = !!document.getElementById('admin-category-active')?.checked;

    if (!label) {
      this._setFormError(this.categoryFormError, 'Label is required');
      return;
    }

    try {
      if (this._editingCategoryId) {
        await api.adminUpdateCategory(this._editingCategoryId, { label, sortOrder, isActive });
        toast('Category updated');
      } else {
        await api.adminCreateCategory({ id: id || undefined, label, sortOrder, isActive });
        toast('Category created');
      }
      this._closeCategoryForm();
      await this._load();
      await this.onCatalogChanged();
    } catch (error) {
      this._setFormError(
        this.categoryFormError,
        error instanceof ApiError ? error.message : 'Save failed'
      );
    }
  }

  async _toggleCategory(category) {
    try {
      await api.adminUpdateCategory(category.id, { isActive: !category.isActive });
      toast(category.isActive ? 'Category deactivated' : 'Category activated');
      await this._load();
      await this.onCatalogChanged();
    } catch (error) {
      toast(error instanceof ApiError ? error.message : 'Update failed', 'error');
    }
  }
}

export { PREVIEW_BUCKETS };
