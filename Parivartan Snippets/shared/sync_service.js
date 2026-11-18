/**
 * Parivartan Cloud Sync & Authentication Service
 * Manages Google Sign-In, Dev Sign-In, and Two-Way Hybrid Synchronization
 * between local Chrome storage and the central Node.js/PostgreSQL/SQLite database.
 */

const SyncService = {
  DEFAULT_SERVER_URL: 'http://localhost:4000',

  async getServerUrl() {
    return new Promise(resolve => {
      chrome.storage.local.get(['cloudServerUrl'], res => {
        resolve(res.cloudServerUrl || this.DEFAULT_SERVER_URL);
      });
    });
  },

  async setServerUrl(url) {
    const cleanUrl = (url || this.DEFAULT_SERVER_URL).replace(/\/+$/, '');
    await chrome.storage.local.set({ cloudServerUrl: cleanUrl });
    return cleanUrl;
  },

  async getAuthToken() {
    return new Promise(resolve => {
      chrome.storage.local.get(['cloudAuthToken'], res => {
        resolve(res.cloudAuthToken || null);
      });
    });
  },

  async getCurrentUser() {
    return new Promise(resolve => {
      chrome.storage.local.get(['cloudUser'], res => {
        resolve(res.cloudUser || null);
      });
    });
  },

  async setAuthSession(jwt, user) {
    return new Promise(resolve => {
      chrome.storage.local.set({ cloudAuthToken: jwt, cloudUser: user }, () => {
        window.postMessage({ type: 'PARIVARTAN_AUTH_CHANGED', user }, '*');
        resolve();
      });
    });
  },

  async logout() {
    return new Promise(resolve => {
      chrome.storage.local.remove(['cloudAuthToken', 'cloudUser'], () => {
        window.postMessage({ type: 'PARIVARTAN_AUTH_CHANGED', user: null }, '*');
        resolve();
      });
    });
  },

  /**
   * One-Click Sign-In / Register (Supports master email, password, 2FA PIN, and clients)
   */
  async devLogin(email = 'parivartanvishalsingh@gmail.com', name = 'Vishal Singh', role = 'admin', company = null, password = null, pin = null) {
    const serverUrl = await this.getServerUrl();
    const isMaster = (email || '').toLowerCase().includes('parivartan');
    const finalPin = pin || (isMaster ? '312866' : null);

    const res = await fetch(`${serverUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, role, company, password, pin: finalPin })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server responded with ${res.status}`);
    }

    const data = await res.json();
    if (data.require2fa) {
      const promptPin = prompt('Two-Factor Authentication: Enter 6-digit Master PIN (312866):', '312866');
      if (!promptPin) throw new Error('2FA verification cancelled');
      return this.devLogin(email, name, role, company, password, promptPin);
    }

    await this.setAuthSession(data.jwt, data.user);
    return data;
  },

  /**
   * Real Google OAuth Sign-In
   */
  async googleLogin() {
    return new Promise((resolve, reject) => {
      if (!chrome.identity || !chrome.identity.getAuthToken) {
        // Fallback for non-extension environment or web
        reject(new Error('chrome.identity API is not available. Use Dev Sign-In for local testing.'));
        return;
      }

      chrome.identity.getAuthToken({ interactive: true }, async (token) => {
        if (chrome.runtime.lastError || !token) {
          reject(new Error(chrome.runtime.lastError?.message || 'Google Sign-In was cancelled'));
          return;
        }

        try {
          const serverUrl = await this.getServerUrl();
          const res = await fetch(`${serverUrl}/api/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Server rejected Google token');
          }

          const data = await res.json();
          await this.setAuthSession(data.jwt, data.user);
          resolve(data);
        } catch (e) {
          reject(e);
        }
      });
    });
  },

  /**
   * PUSH: Upload local snippets, folders, AI prompts, variables, and settings to server
   */
  async pushLocalToCloud() {
    const token = await this.getAuthToken();
    if (!token) return { success: false, reason: 'not_authenticated' };

    const serverUrl = await this.getServerUrl();

    // Gather local state
    const snippets = await window.SnippetStorage.getAllSnippets();
    const folders = await window.SnippetStorage.getFolders();
    const prompts = await window.SnippetStorage.getCustomPrompts();
    const variables = await window.SnippetStorage.getCustomVariables();
    const personas = await window.SnippetStorage.getCustomPersonas();
    const settings = await window.SnippetStorage.getSettings();

    const res = await fetch(`${serverUrl}/api/sync/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        snippets,
        folders,
        prompts,
        variables,
        personas,
        settings
      })
    });

    if (!res.ok) {
      if (res.status === 401) {
        await this.logout();
        throw new Error('Session expired. Please log in again.');
      }
      throw new Error(`Sync push failed (${res.status})`);
    }

    const data = await res.json();
    await chrome.storage.local.set({ lastCloudSyncTime: Date.now() });
    return data;
  },

  /**
   * PULL: Download cloud database records and merge into local Chrome storage
   */
  async pullCloudToLocal() {
    const token = await this.getAuthToken();
    if (!token) return { success: false, reason: 'not_authenticated' };

    const serverUrl = await this.getServerUrl();
    const res = await fetch(`${serverUrl}/api/sync/pull`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      if (res.status === 401) {
        await this.logout();
        throw new Error('Session expired. Please log in again.');
      }
      throw new Error(`Sync pull failed (${res.status})`);
    }

    const json = await res.json();
    if (!json.success || !json.data) {
      throw new Error('Malformed sync data from server');
    }

    const cloud = json.data;

    // Merge folders
    if (Array.isArray(cloud.folders) && cloud.folders.length > 0) {
      await window.SnippetStorage.saveFolders(cloud.folders);
    }

    // Merge snippets
    if (Array.isArray(cloud.snippets) && cloud.snippets.length > 0) {
      await window.SnippetStorage.saveSnippets(cloud.snippets);
    }

    // Merge AI prompts
    if (Array.isArray(cloud.prompts) && cloud.prompts.length > 0) {
      await window.SnippetStorage.saveCustomPrompts(cloud.prompts);
    }

    // Merge AI variables
    if (Array.isArray(cloud.variables) && cloud.variables.length > 0) {
      await window.SnippetStorage.saveCustomVariables(cloud.variables);
    }

    // Merge personas
    if (Array.isArray(cloud.personas) && cloud.personas.length > 0) {
      await window.SnippetStorage.saveCustomPersonas(cloud.personas);
    }

    await chrome.storage.local.set({ lastCloudSyncTime: Date.now() });

    // Notify open extension views to re-render
    window.postMessage({ type: 'PARIVARTAN_STORAGE_UPDATED' }, '*');

    return { success: true, counts: {
      snippets: cloud.snippets?.length || 0,
      folders: cloud.folders?.length || 0,
      prompts: cloud.prompts?.length || 0
    }};
  }
};

if (typeof window !== 'undefined') {
  window.SyncService = SyncService;
}
