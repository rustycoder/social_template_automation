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
    this.statusFilter = document.getElementById('posts-status-filter');
    this.dateRangeInput = document.getElementById('posts-date-range');
    this.dateClear = document.getElementById('posts-date-clear');
    this.viewListBtn = document.getElementById('posts-view-list');
    this.viewWeekBtn = document.getElementById('posts-view-week');
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
    /** @type {'list' | 'week'} */
    this._view = 'list';
    /** Monday of the visible week */
    this._weekStart = startOfWeek(new Date());
    /** @type {Date|null} */
    this._filterFrom = null;
    /** @type {Date|null} */
    this._filterTo = null;
    /** @type {import('flatpickr').Instance | null} */
    this._dateRangePicker = null;

    this.closeBtn?.addEventListener('click', () => this.hide());
    this.backBtn?.addEventListener('click', () => this.hide());
    this.overlay?.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.hide();
    });

    this.searchInput?.addEventListener('input', () => this._renderFiltered());
    this.statusFilter?.addEventListener('change', () => this._renderFiltered());
    this.dateClear?.addEventListener('click', () => {
      this._dateRangePicker?.clear();
      this._filterFrom = null;
      this._filterTo = null;
      this._renderFiltered();
    });

    this._initDateRangePicker();

    this.viewListBtn?.addEventListener('click', () => this._setView('list'));
    this.viewWeekBtn?.addEventListener('click', () => this._setView('week'));

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
    this._view = view === 'week' ? 'week' : 'list';
    this.viewListBtn?.classList.toggle('active', this._view === 'list');
    this.viewWeekBtn?.classList.toggle('active', this._view === 'week');
    this.listEl?.classList.toggle('hidden', this._view !== 'list');
    this.weekEl?.classList.toggle('hidden', this._view !== 'week');
    this._renderFiltered();
  }

  /**
   * @param {{ status?: string }} [overrides]
   */
  _filteredPosts(overrides = {}) {
    const q = (this.searchInput?.value || '').trim().toLowerCase();
    const status = overrides.status ?? (this.statusFilter?.value || 'all');
    const from = this._filterFrom;
    const to = this._filterTo;

    const filtered = this._posts.filter((post) => {
      if (status !== 'all' && post.status !== status) return false;

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
      // Week view is a scheduling calendar — only Ready for Scheduling posts.
      this._renderWeek(this._filteredPosts({ status: 'ready' }));
    } else {
      this._renderList(this._filteredPosts());
    }
  }

  /**
   * @param {Array<object>} posts
   */
  _renderList(posts) {
    if (!this.listEl) return;
    this.weekEl?.classList.add('hidden');
    this.listEl.classList.remove('hidden');

    if (posts.length === 0) {
      this.listEl.innerHTML = '';
      this.emptyEl?.classList.remove('hidden');
      if (this._posts.length > 0 && this.emptyEl) {
        this.emptyEl.textContent = 'No posts match your filters.';
      } else if (this.emptyEl) {
        this.emptyEl.textContent =
          'No saved posts yet. Save posts from the export step to see them here.';
      }
      return;
    }

    this.emptyEl?.classList.add('hidden');
    this.listEl.innerHTML = '';

    for (const post of posts) {
      this.listEl.appendChild(this._createCard(post));
    }
  }

  /**
   * @param {object} post
   */
  _createCard(post) {
    const card = document.createElement('article');
    card.className = this.standalone ? 'posts-page-card' : 'posts-card';
    const caption = (post.caption || '').trim() || '(No caption)';
    const platforms = postPlatforms(post);
    const statusLabel = postStatusLabel(post.status);
    card.innerHTML = `
      <div class="${this.standalone ? 'posts-page-card__thumb' : 'posts-card__thumb'}">
        ${
          post.imageUrl
            ? `<img src="${escapeHtml(post.imageUrl)}" alt="" loading="lazy" />`
            : `<div class="${this.standalone ? 'posts-page-card__thumb-empty' : 'posts-card__thumb-empty'}"></div>`
        }
      </div>
      <div class="${this.standalone ? 'posts-page-card__body' : 'posts-card__body'}">
        <p class="${this.standalone ? 'posts-page-card__caption' : 'posts-card__caption'}">${escapeHtml(caption)}</p>
        <p class="${this.standalone ? 'posts-page-card__meta' : 'posts-card__meta'}">
          <span>${escapeHtml(platformsLabel(platforms))}</span>
          ·
          <span>${escapeHtml(formatWhen(post.scheduledAt))}</span>
        </p>
        <p class="${this.standalone ? 'posts-page-card__status' : 'posts-card__meta'}">
          <span class="post-status-badge post-status-badge--${escapeHtml(post.status || 'preparing')}">${escapeHtml(statusLabel)}</span>
        </p>
        <div class="${this.standalone ? 'posts-page-card__actions' : 'posts-card__actions'}">
          <button type="button" class="btn btn-outline btn-sm" data-action="edit">Edit</button>
          <button type="button" class="btn btn-ghost btn-sm" data-action="delete">Delete</button>
        </div>
      </div>
    `;

    card.querySelector('[data-action="edit"]')?.addEventListener('click', () => {
      this._openEdit(post);
    });
    card.querySelector('[data-action="delete"]')?.addEventListener('click', async () => {
      if (!window.confirm('Delete this post?')) return;
      try {
        await api.deletePost(post.id);
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
                            const caption = (post.caption || '').trim() || '(No caption)';
                            return `
                            <button type="button" class="posts-week__item" data-post-id="${post.id}">
                              <span class="posts-week__item-time">${escapeHtml(formatTime(post.scheduledAt))}</span>
                              <span class="posts-week__item-title">${escapeHtml(caption.slice(0, 48))}${
                                caption.length > 48 ? '…' : ''
                              }</span>
                              <span class="posts-week__item-meta">${escapeHtml(
                                platformsLabel(postPlatforms(post))
                              )}</span>
                              <span class="post-status-badge post-status-badge--${escapeHtml(
                                post.status || 'preparing'
                              )}">${escapeHtml(postStatusLabel(post.status))}</span>
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
