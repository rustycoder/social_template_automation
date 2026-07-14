/**
 * @file features/auth/postsUI.js
 * @description My Posts list — view, edit caption/platforms/schedule/status, and delete.
 *              Supports modal (main app) or standalone full-page mode (`post.html`).
 */

import { api, ApiError } from './api.js';
import { authService } from './auth.js';
import {
  platformsLabel,
  postStatusLabel,
} from '../shared/postMeta.js';

function formatWhen(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
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
    this.emptyEl = document.getElementById('posts-empty');
    this.closeBtn = document.getElementById('posts-modal-close');
    this.backBtn = document.getElementById('btn-posts-back');
    this.searchInput = document.getElementById('posts-search');
    this.statusFilter = document.getElementById('posts-status-filter');
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

    this.closeBtn?.addEventListener('click', () => this.hide());
    this.backBtn?.addEventListener('click', () => this.hide());
    this.overlay?.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.hide();
    });

    this.searchInput?.addEventListener('input', () => this._renderFiltered());
    this.statusFilter?.addEventListener('change', () => this._renderFiltered());

    this.editCloseBtn?.addEventListener('click', () => this._closeEdit());
    this.editCancelBtn?.addEventListener('click', () => this._closeEdit());
    this.editOverlay?.addEventListener('click', (e) => {
      if (e.target === this.editOverlay) this._closeEdit();
    });
    this.editForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this._submitEdit();
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

  async _load() {
    if (!this.listEl) return;
    this.loading = true;
    this.listEl.innerHTML = '<p class="posts-loading">Loading…</p>';
    this.emptyEl?.classList.add('hidden');

    try {
      const { posts } = await api.getPosts();
      this._posts = posts || [];
      this._renderFiltered();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Failed to load posts';
      this.listEl.innerHTML = `<p class="posts-error">${message}</p>`;
    } finally {
      this.loading = false;
    }
  }

  _filteredPosts() {
    const q = (this.searchInput?.value || '').trim().toLowerCase();
    const status = this.statusFilter?.value || 'all';

    return this._posts.filter((post) => {
      if (status !== 'all' && post.status !== status) return false;
      if (!q) return true;
      const hay = [
        post.caption,
        platformsLabel(postPlatforms(post)),
        ...postPlatforms(post),
        postStatusLabel(post.status),
        post.status,
        String(post.id),
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }

  _renderFiltered() {
    this._render(this._filteredPosts());
  }

  /**
   * @param {Array<object>} posts
   */
  _render(posts) {
    if (!this.listEl) return;

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
      this.listEl.appendChild(card);
    }
  }

  _setPlatformChecks(selected) {
    const set = new Set(selected || []);
    this.editPlatforms?.querySelectorAll('input[type="checkbox"]').forEach((input) => {
      input.checked = set.has(input.value);
    });
  }

  _getSelectedPlatforms() {
    return [...(this.editPlatforms?.querySelectorAll('input[type="checkbox"]:checked') || [])].map(
      (input) => input.value
    );
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
