import { api } from '../auth/api.js';
import { resolvePlatformIcon } from '../shared/platformIcons.js';
import { tokenStorage } from '../auth/tokenStorage.js';

export class ConnectionsModal {
  constructor() {
    this.overlay = document.getElementById('connections-modal-overlay');
    this.container = document.getElementById('connections-list-container');
    this.closeBtn = document.getElementById('connections-modal-close');
    this.activeConnections = [];
    this.platforms = ['facebook', 'instagram', 'linkedin', 'youtube', 'tiktok'];
    
    this._bindEvents();
  }

  _bindEvents() {
    this.closeBtn?.addEventListener('click', () => this.close());
    this.overlay?.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    // Listen for mock OAuth success messages
    window.addEventListener('message', async (event) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data?.type === 'oauth_success') {
        const { platform, profileName, profilePicture } = event.data;
        await this._handleConnectSuccess(platform, profileName, profilePicture);
      }
    });
  }

  async open() {
    this.overlay?.classList.remove('hidden');
    await this.loadConnections();
  }

  close() {
    this.overlay?.classList.add('hidden');
  }

  async loadConnections() {
    if (!this.container) return;
    
    this.container.innerHTML = '<p class="connections-loading">Loading connections…</p>';
    
    try {
      const { connections } = await api.getSocialConnections();
      this.activeConnections = connections || [];
      this.render();
    } catch (error) {
      console.error('Failed to load social connections:', error);
      this.container.innerHTML = `<p class="connections-error">Failed to load: ${error.message}</p>`;
    }
  }

  async _handleConnectSuccess(platform, name, pic) {
    try {
      await api.connectSocialConnection(platform, name, pic);
      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: { message: `Connected to ${platform.charAt(0).toUpperCase() + platform.slice(1)} successfully!`, type: 'success' },
        })
      );
      await this.loadConnections();
    } catch (error) {
      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: { message: `Failed to link connection: ${error.message}`, type: 'error' },
        })
      );
    }
  }

  async disconnect(connectionId, platformName) {
    if (!window.confirm(`Are you sure you want to disconnect your ${platformName} account?`)) return;
    
    try {
      await api.deleteSocialConnection(connectionId);
      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: { message: `Disconnected from ${platformName}.`, type: 'success' },
        })
      );
      await this.loadConnections();
    } catch (error) {
      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: { message: `Failed to disconnect: ${error.message}`, type: 'error' },
        })
      );
    }
  }

  connect(platform) {
    const token = tokenStorage.get();
    if (!token) {
      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: { message: 'Authentication session expired. Please sign in again.', type: 'error' },
        })
      );
      return;
    }

    const width = 500;
    const height = 650;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    window.open(
      `/api/social-connections/auth/${platform}?token=${encodeURIComponent(token)}`,
      'oauth_popup',
      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=no`
    );
  }

  render() {
    if (!this.container) return;
    
    this.container.innerHTML = '';
    
    const connectionMap = new Map(this.activeConnections.map((c) => [c.platform, c]));
    
    const PLATFORM_NAMES = {
      facebook: 'Facebook Page',
      instagram: 'Instagram Profile',
      linkedin: 'LinkedIn Member',
      youtube: 'YouTube Channel',
      tiktok: 'TikTok Profile',
    };

    for (const p of this.platforms) {
      const conn = connectionMap.get(p);
      const row = document.createElement('div');
      row.className = `connection-row connection-row--${p}`;
      
      const title = PLATFORM_NAMES[p] || p;
      const statusText = conn ? `Connected as ${conn.profileName}` : 'Not connected';
      const buttonHtml = conn 
        ? `<button type="button" class="btn btn-outline btn-sm btn-disconnect" data-id="${conn.id}" data-platform="${title}">Disconnect</button>`
        : `<button type="button" class="btn btn-primary btn-sm btn-connect" data-platform="${p}">Connect</button>`;
        
      const iconMeta = resolvePlatformIcon(p);
      const iconSvg = iconMeta ? iconMeta.svg : '';

      const avatarHtml = conn && conn.profilePicture
        ? `<img class="connection-row__avatar" src="${conn.profilePicture}" alt="Avatar">`
        : `<div class="connection-row__icon-badge">${iconSvg}</div>`;

      row.innerHTML = `
        <div class="connection-row__info">
          <div class="connection-row__icon-wrap">
            ${avatarHtml}
          </div>
          <div class="connection-row__details">
            <span class="connection-row__name">${title}</span>
            <span class="connection-row__status ${conn ? 'is-connected' : ''}">${statusText}</span>
          </div>
        </div>
        <div class="connection-row__action">
          ${buttonHtml}
        </div>
      `;

      row.querySelector('.btn-connect')?.addEventListener('click', () => this.connect(p));
      row.querySelector('.btn-disconnect')?.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        const platform = e.target.dataset.platform;
        this.disconnect(id, platform);
      });

      this.container.appendChild(row);
    }
  }
}
