/**
 * @file features/auth/postsUI.js
 * @description My Posts list — view, edit caption/platform/schedule, and delete.
 */

import { api, ApiError } from './api.js';
import { authService } from './auth.js';
import { SAVE_PLATFORMS } from '../shared/postMeta.js';

function platformLabel(id) {
  return SAVE_PLATFORMS.find((p) => p.id === id)?.label ?? id;
}

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

export class PostsUI {
  /**
   * @param {import('./authUI.js').AuthUI} authUI
   */
  constructor(authUI) {
    this.authUI = authUI;
    this.overlay = document.getElementById('posts-modal-overlay');
    this.listEl = document.getElementById('posts-list');
    this.emptyEl = document.getElementById('posts-empty');
    this.closeBtn = document.getElementById('posts-modal-close');
    this.loading = false;

    this.editOverlay = document.getElementById('post-edit-modal-overlay');
    this.editForm = document.getElementById('post-edit-form');
    this.editCloseBtn = document.getElementById('post-edit-modal-close');
    this.editCancelBtn = document.getElementById('post-edit-cancel');
    this.editError = document.getElementById('post-edit-error');
    this.editSubmitBtn = document.getElementById('post-edit-submit');
    this.editCaption = document.getElementById('post-edit-caption');
    this.editPlatform = document.getElementById('post-edit-platform');
    this.editDate = document.getElementById('post-edit-date');
    this.editTime = document.getElementById('post-edit-time');
    this.editImage = document.getElementById('post-edit-image');
    this.editMeta = document.getElementById('post-edit-meta');

    /** @type {number|null} */
    this._editingId = null;

    this.closeBtn?.addEventListener('click', () => this.hide());
    this.overlay?.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.hide();
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
  }

  async show() {
    if (!authService.isLoggedIn()) {
      await this.authUI.open('login');
      if (!authService.isLoggedIn()) return;
    }

    this.overlay?.classList.remove('hidden');
    await this._load();
  }

  hide() {
    this._closeEdit();
    this.overlay?.classList.add('hidden');
  }

  async _load() {
    if (!this.listEl) return;
    this.loading = true;
    this.listEl.innerHTML = '<p class="posts-loading">Loading…</p>';
    this.emptyEl?.classList.add('hidden');

    try {
      const { posts } = await api.getPosts();
      this._render(posts || []);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Failed to load posts';
      this.listEl.innerHTML = `<p class="posts-error">${message}</p>`;
    } finally {
      this.loading = false;
    }
  }

  /**
   * @param {Array<object>} posts
   */
  _render(posts) {
    if (!this.listEl) return;

    if (posts.length === 0) {
      this.listEl.innerHTML = '';
      this.emptyEl?.classList.remove('hidden');
      return;
    }

    this.emptyEl?.classList.add('hidden');
    this.listEl.innerHTML = '';

    for (const post of posts) {
      const card = document.createElement('article');
      card.className = 'posts-card';
      const caption = (post.caption || '').trim() || '(No caption)';
      const statusLabel = post.status === 'scheduled' ? 'Scheduled' : 'Saved';
      card.innerHTML = `
        <div class="posts-card__thumb">
          ${
            post.imageUrl
              ? `<img src="${escapeHtml(post.imageUrl)}" alt="" loading="lazy" />`
              : '<div class="posts-card__thumb-empty"></div>'
          }
        </div>
        <div class="posts-card__body">
          <p class="posts-card__caption">${escapeHtml(caption)}</p>
          <p class="posts-card__meta">
            <span>${escapeHtml(platformLabel(post.platform))}</span>
            ·
            <span>${escapeHtml(formatWhen(post.scheduledAt))}</span>
            ·
            <span>${escapeHtml(statusLabel)}</span>
          </p>
          <div class="posts-card__actions">
            <button type="button" class="btn btn-outline btn-sm posts-card__edit" data-action="edit">Edit</button>
            <button type="button" class="btn btn-ghost btn-sm posts-card__delete" data-action="delete">Delete</button>
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
    if (this.editPlatform) this.editPlatform.value = post.platform || 'instagram';

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
    const platform = this.editPlatform?.value;
    const date = this.editDate?.value;
    const time = this.editTime?.value;

    if (!platform || !date || !time) {
      if (this.editError) {
        this.editError.textContent = 'Platform, date, and time are required';
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
        platform,
        scheduled_at: scheduledAt.toISOString(),
        status: 'scheduled',
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
