/**
 * @file features/auth/postsUI.js
 * @description My Posts — list/week views, schedule filters, edit caption/platforms/status.
 */

import { api, ApiError } from './api.js';
import { authService } from './auth.js';
import {
  platformsLabel,
  postStatusLabel,
} from '../shared/postMeta.js';
import { platformIconsHtml } from '../shared/platformIcons.js';
import { ScheduleAllModal } from '../modules/ScheduleAllModal.js';
import { summarizeSchedule } from '../domain/schedulePlanner.js';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';

function formatWhen(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

function formatTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Compact status copy for week-view cells (avoids two-line badges). */
const WEEK_STATUS_LABELS = {
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
};

/**
 * @param {string} status
 * @returns {string}
 */
function weekStatusLabel(status) {
  return WEEK_STATUS_LABELS[status] || postStatusLabel(status);
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function splitDateTime(value) {
  const when = value ? new Date(value) : new Date();
  if (Number.isNaN(when.getTime())) {
    const now = new Date();
    return {
      date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
      time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
    };
  }
  return {
    date: `${when.getFullYear()}-${pad(when.getMonth() + 1)}-${pad(when.getDate())}`,
    time: `${pad(when.getHours())}:${pad(when.getMinutes())}`,
  };
}

function postPlatforms(post) {
  if (Array.isArray(post?.platforms) && post.platforms.length) return post.platforms;
  if (post?.platform) return [post.platform];
  return [];
}

function scheduledMs(post) {
  const d = post?.scheduledAt ? new Date(post.scheduledAt) : null;
  if (!d || Number.isNaN(d.getTime())) return Number.POSITIVE_INFINITY;
  return d.getTime();
}

/** Local calendar day key YYYY-MM-DD */
function dayKey(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function startOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 Sun … 6 Sat
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  d.setDate(d.getDate() + diff);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export class PostsUI {
  /**
   * @param {import('./authUI.js').AuthUI} authUI
   * @param {{ standalone?: boolean }} [deps]
   */
  constructor(authUI, deps = {}) {
    this.authUI = authUI;
    this.standalone = !!deps.standalone;

    this.page = document.getElementById('posts-page');
    this.overlay = document.getElementById('posts-modal-overlay');
    this.listEl = document.getElementById('posts-list');
    this.weekEl = document.getElementById('posts-week');
    this.emptyEl = document.getElementById('posts-empty');
    this.closeBtn = document.getElementById('posts-modal-close');
    this.backBtn = document.getElementById('btn-posts-back');
    this.searchInput = document.getElementById('posts-search');
    this.platformFilter = document.getElementById('posts-platform-filter');
    this.statusFilter = document.getElementById('posts-status-filter');
    this.dateRangeInput = document.getElementById('posts-date-range');
    this.dateClear = document.getElementById('posts-date-clear');
    this.viewListBtn = document.getElementById('posts-view-list');
    this.viewGridBtn = document.getElementById('posts-view-grid');
    this.viewWeekBtn = document.getElementById('posts-view-week');
    this.selectAllWrap = document.getElementById('posts-select-all-wrap');
    this.selectAllInput = document.getElementById('posts-select-all');
    this.bulkScheduleBtn = document.getElementById('posts-bulk-schedule');
    this.bulkDeleteBtn = document.getElementById('posts-bulk-delete');
    this.bulkScheduleLabel = document.getElementById('posts-bulk-schedule-label');
    this.bulkDeleteLabel = document.getElementById('posts-bulk-delete-label');
    this.footerActions = document.getElementById('posts-footer-actions');
    this.loading = false;

    this.editOverlay = document.getElementById('post-edit-modal-overlay');
    this.editForm = document.getElementById('post-edit-form');
    this.editCloseBtn = document.getElementById('post-edit-modal-close');
    this.editCancelBtn = document.getElementById('post-edit-cancel');
    this.editError = document.getElementById('post-edit-error');
    this.editSubmitBtn = document.getElementById('post-edit-submit');
    this.editCaption = document.getElementById('post-edit-caption');
    this.editPlatforms = document.getElementById('post-edit-platforms');
    this.editStatus = document.getElementById('post-edit-status');
    this.editDate = document.getElementById('post-edit-date');
    this.editTime = document.getElementById('post-edit-time');
    this.editImage = document.getElementById('post-edit-image');
    this.editMeta = document.getElementById('post-edit-meta');

    /** @type {number|null} */
    this._editingId = null;
    /** @type {Array<object>} */
    this._posts = [];
    /** @type {'list' | 'grid' | 'week'} */
    this._view = 'grid';
    /** Monday of the visible week */
    this._weekStart = startOfWeek(new Date());
    /** @type {Date|null} */
    this._filterFrom = null;
    /** @type {Date|null} */
    this._filterTo = null;
    /** @type {import('flatpickr').Instance | null} */
    this._dateRangePicker = null;
    /** @type {Set<number>} */
    this._selectedIds = new Set();
    /** @type {Array<object>} */
    this._visiblePosts = [];

    this.scheduleAllModal = new ScheduleAllModal({
      onConfirm: (plan) => this._applyBulkSchedule(plan),
    });

    this.closeBtn?.addEventListener('click', () => this.hide());
    this.backBtn?.addEventListener('click', () => this.hide());
    this.overlay?.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.hide();
    });

    this.searchInput?.addEventListener('input', () => this._renderFiltered());
    this.platformFilter?.addEventListener('change', () => this._renderFiltered());
    this.statusFilter?.addEventListener('change', () => this._renderFiltered());
    this.dateClear?.addEventListener('click', () => {
      this._dateRangePicker?.clear();
      this._filterFrom = null;
      this._filterTo = null;
      this._renderFiltered();
    });

    this._initDateRangePicker();

    this.viewListBtn?.addEventListener('click', () => this._setView('list'));
    this.viewGridBtn?.addEventListener('click', () => this._setView('grid'));
    this.viewWeekBtn?.addEventListener('click', () => this._setView('week'));

    this.selectAllInput?.addEventListener('change', () => {
      this._selectAllVisible(!!this.selectAllInput.checked);
    });
    this.bulkScheduleBtn?.addEventListener('click', () => this._openBulkSchedule());
    this.bulkDeleteBtn?.addEventListener('click', () => this._bulkDelete());

    this.weekEl?.addEventListener('click', (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (target.closest('[data-week-prev]')) {
        this._weekStart = addDays(this._weekStart, -7);
        this._renderFiltered();
        return;
      }
      if (target.closest('[data-week-next]')) {
        this._weekStart = addDays(this._weekStart, 7);
        this._renderFiltered();
        return;
      }
      if (target.closest('[data-week-today]')) {
        this._weekStart = startOfWeek(new Date());
        this._renderFiltered();
        return;
      }
      const item = target.closest('[data-post-id]');
      if (item) {
        const id = Number(item.getAttribute('data-post-id'));
        const post = this._posts.find((p) => p.id === id);
        if (post) this._openEdit(post);
      }
    });

    this.editCloseBtn?.addEventListener('click', () => this._closeEdit());
    this.editCancelBtn?.addEventListener('click', () => this._closeEdit());
    this.editOverlay?.addEventListener('click', (e) => {
      if (e.target === this.editOverlay) this._closeEdit();
    });
    this.editForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this._submitEdit();
    });

    this.editPlatforms?.addEventListener('change', (e) => {
      const input = e.target;
      if (!(input instanceof HTMLInputElement) || input.type !== 'checkbox') return;
      input.closest('.platform-chip')?.classList.toggle('is-selected', input.checked);
    });
  }

  async show() {
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
    }

    this.authUI._closeDropdown();

    if (this.standalone) {
      this.page?.classList.add('active');
      await this._load();
      return;
    }

    this.overlay?.classList.remove('hidden');
    await this._load();
  }

  hide() {
    this._closeEdit();
    if (this.standalone) {
      window.location.href = '/';
      return;
    }
    this.overlay?.classList.add('hidden');
  }

  _initDateRangePicker() {
    if (!this.dateRangeInput) return;

    this._dateRangePicker = flatpickr(this.dateRangeInput, {
      mode: 'range',
      dateFormat: 'Y-m-d',
      altInput: true,
      altFormat: 'M j, Y',
      allowInput: false,
      clickOpens: true,
      showMonths: window.matchMedia('(min-width: 720px)').matches ? 2 : 1,
      onChange: (selectedDates) => {
        if (selectedDates.length === 0) {
          this._filterFrom = null;
          this._filterTo = null;
          this._renderFiltered();
          return;
        }
        if (selectedDates.length === 1) {
          this._filterFrom = startOfDay(selectedDates[0]);
          this._filterTo = endOfDay(selectedDates[0]);
          this._renderFiltered();
          return;
        }
        this._filterFrom = startOfDay(selectedDates[0]);
        this._filterTo = endOfDay(selectedDates[1]);
        this._renderFiltered();
      },
      onReady: (_dates, _str, instance) => {
        instance.altInput?.classList.add('text-input', 'posts-date-range__input');
        instance.altInput?.setAttribute('placeholder', 'Select date range');
        instance.altInput?.setAttribute('aria-label', 'Filter by schedule date range');
      },
    });
  }

  async _load() {
    if (!this.listEl && !this.weekEl) return;
    this.loading = true;
    if (this.listEl) this.listEl.innerHTML = '<p class="posts-loading">Loading…</p>';
    this.emptyEl?.classList.add('hidden');

    try {
      const { posts } = await api.getPosts();
      this._posts = posts || [];
      this._renderFiltered();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Failed to load posts';
      if (this.listEl) this.listEl.innerHTML = `<p class="posts-error">${message}</p>`;
      if (this.weekEl) this.weekEl.innerHTML = `<p class="posts-error">${message}</p>`;
    } finally {
      this.loading = false;
    }
  }

  _setView(view) {
    if (view === 'week') this._view = 'week';
    else if (view === 'list') this._view = 'list';
    else this._view = 'grid';

    this.viewListBtn?.classList.toggle('active', this._view === 'list');
    this.viewGridBtn?.classList.toggle('active', this._view === 'grid');
    this.viewWeekBtn?.classList.toggle('active', this._view === 'week');
    this.listEl?.classList.toggle('hidden', this._view === 'week');
    this.weekEl?.classList.toggle('hidden', this._view !== 'week');
    this._syncListLayoutClass();
    this._renderFiltered();
  }

  _syncListLayoutClass() {
    if (!this.listEl) return;
    this.listEl.classList.toggle('posts-page__grid', this._view === 'grid');
    this.listEl.classList.toggle('posts-page__list', this._view === 'list');
  }

  /**
   * @param {{ status?: string, platform?: string }} [overrides]
   */
  _filteredPosts(overrides = {}) {
    const q = (this.searchInput?.value || '').trim().toLowerCase();
    const status = overrides.status ?? (this.statusFilter?.value || 'all');
    const platform = overrides.platform ?? (this.platformFilter?.value || 'all');
    const from = this._filterFrom;
    const to = this._filterTo;

    const filtered = this._posts.filter((post) => {
      if (status !== 'all' && post.status !== status) return false;

      if (platform !== 'all') {
        const platforms = postPlatforms(post);
        if (!platforms.includes(platform)) return false;
      }

      const ms = scheduledMs(post);
      if (from && ms < from.getTime()) return false;
      if (to && ms > to.getTime()) return false;

      if (!q) return true;
      const hay = [
        post.caption,
        platformsLabel(postPlatforms(post)),
        ...postPlatforms(post),
        postStatusLabel(post.status),
        post.status,
        String(post.id),
        formatWhen(post.scheduledAt),
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });

    return filtered.sort((a, b) => scheduledMs(a) - scheduledMs(b));
  }

  _renderFiltered() {
    if (this._view === 'week') {
      this._setBrowseSelectionUi(false);
      // Week view is a scheduling calendar — only Ready for Scheduling posts.
      this._renderWeek(this._filteredPosts({ status: 'ready' }));
    } else {
      this._syncListLayoutClass();
      this._renderBrowse(this._filteredPosts());
    }
  }

  /**
   * @param {boolean} visible
   */
  _setBrowseSelectionUi(visible) {
    this.selectAllWrap?.classList.toggle('hidden', !visible);
    this.footerActions?.classList.toggle('hidden', !visible);
    if (!visible) {
      if (this.bulkScheduleBtn) this.bulkScheduleBtn.disabled = true;
      if (this.bulkDeleteBtn) this.bulkDeleteBtn.disabled = true;
      if (this.bulkScheduleLabel) this.bulkScheduleLabel.textContent = 'Schedule (0)';
      if (this.bulkDeleteLabel) this.bulkDeleteLabel.textContent = 'Delete (0)';
    }
  }

  /**
   * @param {Array<object>} posts
   */
  _renderBrowse(posts) {
    if (!this.listEl) return;
    this.weekEl?.classList.add('hidden');
    this.listEl.classList.remove('hidden');
    this._visiblePosts = posts;

    const visibleIds = new Set(posts.map((p) => p.id));
    for (const id of [...this._selectedIds]) {
      if (!visibleIds.has(id)) this._selectedIds.delete(id);
    }

    if (posts.length === 0) {
      this.listEl.innerHTML = '';
      this._setBrowseSelectionUi(false);
      this.emptyEl?.classList.remove('hidden');
      if (this._posts.length > 0 && this.emptyEl) {
        this.emptyEl.textContent = 'No posts match your filters.';
      } else if (this.emptyEl) {
        this.emptyEl.textContent =
          'No saved posts yet. Save posts from the export step to see them here.';
      }
      this._updateBulkBar();
      return;
    }

    this.emptyEl?.classList.add('hidden');
    this._setBrowseSelectionUi(true);
    this.listEl.innerHTML = '';

    for (const post of posts) {
      this.listEl.appendChild(this._createCard(post));
    }
    this._updateBulkBar();
  }

  /**
   * @param {object} post
   */
  _createCard(post) {
    const card = document.createElement('article');
    const baseClass = this.standalone ? 'posts-page-card' : 'posts-card';
    const selected = this._selectedIds.has(post.id);
    card.className = `${baseClass}${selected ? ' is-selected' : ''}`;
    card.dataset.postId = String(post.id);

    const caption = (post.caption || '').trim() || '(No caption)';
    const platforms = postPlatforms(post);
    const statusLabel = postStatusLabel(post.status);
    const thumbClass = this.standalone ? 'posts-page-card__thumb' : 'posts-card__thumb';
    const bodyClass = this.standalone ? 'posts-page-card__body' : 'posts-card__body';
    const captionClass = this.standalone ? 'posts-page-card__caption' : 'posts-card__caption';
    const metaClass = this.standalone ? 'posts-page-card__meta' : 'posts-card__meta';
    const statusClass = this.standalone ? 'posts-page-card__status' : 'posts-card__meta';
    const actionsClass = this.standalone ? 'posts-page-card__actions' : 'posts-card__actions';

    card.innerHTML = `
      <label class="posts-page-card__select">
        <input type="checkbox" data-select-post="${post.id}" ${selected ? 'checked' : ''} aria-label="Select post ${post.id}" />
      </label>
      <div class="${thumbClass}">
        ${
          post.imageUrl
            ? `<img src="${escapeHtml(post.imageUrl)}" alt="" loading="lazy" />`
            : `<div class="${this.standalone ? 'posts-page-card__thumb-empty' : 'posts-card__thumb-empty'}"></div>`
        }
      </div>
      <div class="${bodyClass}">
        <p class="${captionClass}">${escapeHtml(caption)}</p>
        <p class="${metaClass}">
          <span class="posts-page-card__platforms" aria-label="${escapeHtml(platformsLabel(platforms))}">${platformIconsHtml(platforms)}</span>
          <span class="posts-page-card__when">${escapeHtml(formatWhen(post.scheduledAt))}</span>
        </p>
        <p class="${statusClass}">
          <span class="post-status-badge post-status-badge--${escapeHtml(post.status || 'preparing')}">${escapeHtml(statusLabel)}</span>
        </p>
        <div class="${actionsClass}">
          <button type="button" class="btn btn-outline btn-sm" data-action="edit">Edit</button>
          <button type="button" class="btn btn-ghost btn-sm" data-action="delete">Delete</button>
        </div>
      </div>
    `;

    card.querySelector('[data-select-post]')?.addEventListener('change', (e) => {
      const input = e.target;
      if (!(input instanceof HTMLInputElement)) return;
      this._setSelected(post.id, input.checked);
    });
    card.querySelector('[data-action="edit"]')?.addEventListener('click', () => {
      this._openEdit(post);
    });
    card.querySelector('[data-action="delete"]')?.addEventListener('click', async () => {
      if (!window.confirm('Delete this post?')) return;
      try {
        await api.deletePost(post.id);
        this._selectedIds.delete(post.id);
        await this._load();
        window.dispatchEvent(
          new CustomEvent('toast', {
            detail: { message: 'Post deleted', type: 'success' },
          })
        );
      } catch (error) {
        window.dispatchEvent(
          new CustomEvent('toast', {
            detail: {
              message: error instanceof ApiError ? error.message : 'Delete failed',
              type: 'error',
            },
          })
        );
      }
    });
    return card;
  }

  /**
   * @param {number} id
   * @param {boolean} selected
   */
  _setSelected(id, selected) {
    if (selected) this._selectedIds.add(id);
    else this._selectedIds.delete(id);

    const card = this.listEl?.querySelector(`[data-post-id="${id}"]`);
    card?.classList.toggle('is-selected', selected);
    this._updateBulkBar();
  }

  /**
   * @param {boolean} selected
   */
  _selectAllVisible(selected) {
    for (const post of this._visiblePosts) {
      if (selected) this._selectedIds.add(post.id);
      else this._selectedIds.delete(post.id);
    }
    this.listEl?.querySelectorAll('[data-select-post]').forEach((input) => {
      if (input instanceof HTMLInputElement) {
        input.checked = selected;
        input.closest('[data-post-id]')?.classList.toggle('is-selected', selected);
      }
    });
    this._updateBulkBar();
  }

  _updateBulkBar() {
    const count = this._selectedIds.size;
    const visible = this._visiblePosts.length;
    const allSelected = visible > 0 && this._visiblePosts.every((p) => this._selectedIds.has(p.id));

    if (this.selectAllInput) {
      this.selectAllInput.checked = allSelected;
      this.selectAllInput.indeterminate = count > 0 && !allSelected;
    }
    if (this.bulkScheduleLabel) this.bulkScheduleLabel.textContent = `Schedule (${count})`;
    if (this.bulkDeleteLabel) this.bulkDeleteLabel.textContent = `Delete (${count})`;
    if (this.bulkScheduleBtn) {
      this.bulkScheduleBtn.disabled = count === 0;
      this.bulkScheduleBtn.setAttribute('aria-label', `Schedule ${count} selected posts`);
    }
    if (this.bulkDeleteBtn) {
      this.bulkDeleteBtn.disabled = count === 0;
      this.bulkDeleteBtn.setAttribute('aria-label', `Delete ${count} selected posts`);
    }
  }

  /**
   * Selected posts in current schedule order.
   * @returns {Array<object>}
   */
  _selectedPostsOrdered() {
    return this._visiblePosts.filter((p) => this._selectedIds.has(p.id));
  }

  _openBulkSchedule() {
    const selected = this._selectedPostsOrdered();
    if (selected.length === 0) {
      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: { message: 'Select at least one post to schedule', type: 'error' },
        })
      );
      return;
    }
    this.scheduleAllModal.open({ postCount: selected.length });
  }

  /**
   * @param {{ platforms: string[], scheduledDates: Date[] }} plan
   */
  async _applyBulkSchedule(plan) {
    const selected = this._selectedPostsOrdered();
    if (selected.length === 0) return;
    if (!plan?.scheduledDates || plan.scheduledDates.length !== selected.length) {
      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: { message: 'Schedule length does not match selected posts', type: 'error' },
        })
      );
      return;
    }

    let updated = 0;
    let failed = 0;
    let lastError = '';

    for (let i = 0; i < selected.length; i += 1) {
      const post = selected[i];
      try {
        await api.updatePost(post.id, {
          platforms: plan.platforms,
          scheduled_at: plan.scheduledDates[i].toISOString(),
          status: 'ready',
        });
        updated += 1;
      } catch (error) {
        failed += 1;
        lastError = error instanceof ApiError ? error.message : error.message || 'Update failed';
      }
    }

    this._selectedIds.clear();
    await this._load();

    if (updated > 0 && failed === 0) {
      const summary = summarizeSchedule(plan.scheduledDates);
      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: {
            message:
              updated === 1
                ? `Post scheduled${summary ? ` for ${summary.firstLabel}` : ''}.`
                : `${updated} posts scheduled${
                    summary ? ` from ${summary.firstLabel} to ${summary.lastLabel}` : ''
                  }.`,
            type: 'success',
          },
        })
      );
    } else if (updated > 0) {
      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: {
            message: `Scheduled ${updated} of ${selected.length}. ${failed} failed${
              lastError ? `: ${lastError}` : ''
            }`,
            type: 'error',
          },
        })
      );
    } else {
      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: { message: lastError || 'Failed to schedule posts', type: 'error' },
        })
      );
    }
  }

  async _bulkDelete() {
    const selected = this._selectedPostsOrdered();
    if (selected.length === 0) return;

    const label =
      selected.length === 1
        ? 'Delete 1 selected post?'
        : `Delete ${selected.length} selected posts?`;
    if (!window.confirm(label)) return;

    let deleted = 0;
    let failed = 0;
    let lastError = '';

    for (const post of selected) {
      try {
        await api.deletePost(post.id);
        deleted += 1;
        this._selectedIds.delete(post.id);
      } catch (error) {
        failed += 1;
        lastError = error instanceof ApiError ? error.message : error.message || 'Delete failed';
      }
    }

    await this._load();

    if (deleted > 0 && failed === 0) {
      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: {
            message: deleted === 1 ? 'Post deleted' : `${deleted} posts deleted`,
            type: 'success',
          },
        })
      );
    } else if (deleted > 0) {
      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: {
            message: `Deleted ${deleted} of ${selected.length}. ${failed} failed${
              lastError ? `: ${lastError}` : ''
            }`,
            type: 'error',
          },
        })
      );
    } else {
      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: { message: lastError || 'Failed to delete posts', type: 'error' },
        })
      );
    }
  }

  /**
   * @param {Array<object>} posts
   */
  _renderWeek(posts) {
    if (!this.weekEl) return;
    this.listEl?.classList.add('hidden');
    this.weekEl.classList.remove('hidden');

    const weekStart = this._weekStart;
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const weekEnd = endOfDay(days[6]);

    const weekPosts = posts.filter((post) => {
      if (post.status !== 'ready') return false;
      const ms = scheduledMs(post);
      return ms >= weekStart.getTime() && ms <= weekEnd.getTime();
    });

    const byDay = new Map(days.map((d) => [dayKey(d), []]));
    for (const post of weekPosts) {
      const key = dayKey(post.scheduledAt);
      if (byDay.has(key)) byDay.get(key).push(post);
    }
    for (const list of byDay.values()) {
      list.sort((a, b) => scheduledMs(a) - scheduledMs(b));
    }

    const rangeLabel = `${days[0].toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })} – ${days[6].toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}`;

    const todayKey = dayKey(new Date());

    this.weekEl.innerHTML = `
      <div class="posts-week__nav">
        <button type="button" class="btn btn-outline btn-sm" data-week-prev aria-label="Previous week">← Prev</button>
        <div class="posts-week__nav-center">
          <strong>${escapeHtml(rangeLabel)}</strong>
          <button type="button" class="btn btn-ghost btn-sm" data-week-today>This week</button>
        </div>
        <button type="button" class="btn btn-outline btn-sm" data-week-next aria-label="Next week">Next →</button>
      </div>
      <div class="posts-week__grid">
        ${days
          .map((day) => {
            const key = dayKey(day);
            const items = byDay.get(key) || [];
            const isToday = key === todayKey;
            return `
              <div class="posts-week__day${isToday ? ' is-today' : ''}">
                <header class="posts-week__day-head">
                  <span class="posts-week__day-name">${escapeHtml(
                    day.toLocaleDateString(undefined, { weekday: 'short' })
                  )}</span>
                  <span class="posts-week__day-date">${escapeHtml(String(day.getDate()))}</span>
                </header>
                <div class="posts-week__day-body">
                  ${
                    items.length === 0
                      ? '<p class="posts-week__empty">—</p>'
                      : items
                          .map((post) => {
                            const platforms = postPlatforms(post);
                            const statusId = post.status || 'preparing';
                            const thumb = post.imageUrl
                              ? `<img class="posts-week__item-thumb" src="${escapeHtml(post.imageUrl)}" alt="" loading="lazy" />`
                              : `<span class="posts-week__item-thumb posts-week__item-thumb--empty" aria-hidden="true"></span>`;
                            return `
                            <button type="button" class="posts-week__item" data-post-id="${post.id}">
                              ${thumb}
                              <span class="posts-week__item-time">${escapeHtml(formatTime(post.scheduledAt))}</span>
                              <span class="posts-week__item-platforms" aria-label="${escapeHtml(platformsLabel(platforms))}">${platformIconsHtml(platforms)}</span>
                              <span class="post-status-badge post-status-badge--${escapeHtml(statusId)} posts-week__item-status" title="${escapeHtml(postStatusLabel(statusId))}">${escapeHtml(weekStatusLabel(statusId))}</span>
                            </button>
                          `;
                          })
                          .join('')
                  }
                </div>
              </div>
            `;
          })
          .join('')}
      </div>
    `;

    if (weekPosts.length === 0) {
      this.emptyEl?.classList.remove('hidden');
      if (this.emptyEl) {
        this.emptyEl.textContent =
          this._posts.length === 0
            ? 'No saved posts yet. Save posts from the export step to see them here.'
            : 'No Ready for Scheduling posts in this week.';
      }
    } else {
      this.emptyEl?.classList.add('hidden');
    }
  }

  _setPlatformChecks(selected) {
    const set = new Set(selected || []);
    this.editPlatforms?.querySelectorAll('input[type="checkbox"]').forEach((input) => {
      input.checked = set.has(input.value);
      input.closest('.platform-chip')?.classList.toggle('is-selected', input.checked);
    });
  }

  _getSelectedPlatforms() {
    const root = this.editPlatforms || document.getElementById('post-edit-platforms');
    if (!root) return [];
    return [...root.querySelectorAll('input[type="checkbox"]:checked')].map((input) => input.value);
  }

  /**
   * @param {object} post
   */
  _openEdit(post) {
    this._editingId = post.id;
    if (this.editError) {
      this.editError.textContent = '';
      this.editError.classList.add('hidden');
    }

    if (this.editCaption) this.editCaption.value = post.caption || '';
    this._setPlatformChecks(postPlatforms(post));
    if (this.editStatus) this.editStatus.value = post.status || 'preparing';

    const { date, time } = splitDateTime(post.scheduledAt);
    if (this.editDate) this.editDate.value = date;
    if (this.editTime) this.editTime.value = time;

    if (this.editImage) {
      if (post.imageUrl) {
        this.editImage.src = post.imageUrl;
        this.editImage.classList.remove('hidden');
      } else {
        this.editImage.removeAttribute('src');
        this.editImage.classList.add('hidden');
      }
    }
    if (this.editMeta) {
      this.editMeta.textContent = `#${post.id} · ${post.formatBucket || 'square'}`;
    }

    this.editOverlay?.classList.remove('hidden');
  }

  _closeEdit() {
    this.editOverlay?.classList.add('hidden');
    this._editingId = null;
  }

  async _submitEdit() {
    if (!this._editingId) return;

    const caption = this.editCaption?.value ?? '';
    const platforms = this._getSelectedPlatforms();
    const status = this.editStatus?.value || 'preparing';
    const date = this.editDate?.value;
    const time = this.editTime?.value;

    if (platforms.length === 0) {
      if (this.editError) {
        this.editError.textContent = 'Select at least one platform';
        this.editError.classList.remove('hidden');
      }
      return;
    }

    if (!date || !time) {
      if (this.editError) {
        this.editError.textContent = 'Date and time are required';
        this.editError.classList.remove('hidden');
      }
      return;
    }

    const scheduledAt = new Date(`${date}T${time}`);
    if (Number.isNaN(scheduledAt.getTime())) {
      if (this.editError) {
        this.editError.textContent = 'Invalid date or time';
        this.editError.classList.remove('hidden');
      }
      return;
    }

    if (this.editSubmitBtn) this.editSubmitBtn.disabled = true;
    if (this.editError) {
      this.editError.textContent = '';
      this.editError.classList.add('hidden');
    }

    try {
      await api.updatePost(this._editingId, {
        caption,
        platforms,
        scheduled_at: scheduledAt.toISOString(),
        status,
      });
      this._closeEdit();
      await this._load();
      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: { message: 'Post updated', type: 'success' },
        })
      );
    } catch (error) {
      if (this.editError) {
        this.editError.textContent =
          error instanceof ApiError ? error.message : 'Failed to update post';
        this.editError.classList.remove('hidden');
      }
    } finally {
      if (this.editSubmitBtn) this.editSubmitBtn.disabled = false;
    }
  }
}
