/**
 * @file features/auth/postsUI.js
 * @description My Posts list — saved/scheduled posts from the API.
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

    this.closeBtn?.addEventListener('click', () => this.hide());
    this.overlay?.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.hide();
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
      card.innerHTML = `
        <div class="posts-card__thumb">
          ${
            post.imageUrl
              ? `<img src="${post.imageUrl}" alt="" loading="lazy" />`
              : '<div class="posts-card__thumb-empty"></div>'
          }
        </div>
        <div class="posts-card__body">
          <p class="posts-card__caption">${escapeHtml(caption)}</p>
          <p class="posts-card__meta">
            <span>${escapeHtml(platformLabel(post.platform))}</span>
            ·
            <span>${escapeHtml(formatWhen(post.scheduledAt))}</span>
          </p>
        </div>
        <button type="button" class="btn-icon posts-card__delete" data-id="${post.id}" aria-label="Delete post">✕</button>
      `;
      card.querySelector('.posts-card__delete')?.addEventListener('click', async () => {
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
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
