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

  async getTrialStatus() {
    return new Promise(resolve => {
      chrome.storage.local.get(['cloudTrial'], res => {
        resolve(res.cloudTrial || null);
      });
    });
  },

  async setAuthSession(jwt, user, trial = null) {
    return new Promise(resolve => {
      chrome.storage.local.set({ cloudAuthToken: jwt, cloudUser: user, cloudTrial: trial }, () => {
        window.postMessage({ type: 'PARIVARTAN_AUTH_CHANGED', user, trial }, '*');
        resolve();
      });
    });
  },

  async logout() {
    return new Promise(resolve => {
      chrome.storage.local.remove(['cloudAuthToken', 'cloudUser', 'cloudTrial'], () => {
        window.postMessage({ type: 'PARIVARTAN_AUTH_CHANGED', user: null, trial: null }, '*');
        resolve();
      });
    });
  },

  /**
   * Fetch live trial, credits, and billing status from server
   */
  async fetchLiveBillingStatus() {
    const token = await this.getAuthToken();
    if (!token) return null;
    const serverUrl = await this.getServerUrl();
    try {
      const res = await fetch(`${serverUrl}/api/billing/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.user && data.trial) {
        await this.setAuthSession(token, data.user, data.trial);
      }
      return data;
    } catch (_) {
      return null;
    }
  },

  /**
   * Buy Credits Pack
   */
  async buyCredits(pack = 'small', paymentMethod = 'credit_card') {
    const token = await this.getAuthToken();
    if (!token) throw new Error('Authentication required');
    const serverUrl = await this.getServerUrl();
    const res = await fetch(`${serverUrl}/api/billing/buy-credits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ pack, paymentMethod })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to purchase credits');
    await this.fetchLiveBillingStatus();
    return data;
  },

  /**
   * Subscribe to Monthly Plan ($9.99/mo Pro or $29.99/mo Enterprise)
   */
  async subscribeMonthly(plan = 'pro', paymentMethod = 'credit_card') {
    const token = await this.getAuthToken();
    if (!token) throw new Error('Authentication required');
    const serverUrl = await this.getServerUrl();
    const res = await fetch(`${serverUrl}/api/billing/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ plan, paymentMethod })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to activate subscription');
    await this.fetchLiveBillingStatus();
    return data;
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

    await this.setAuthSession(data.jwt, data.user, data.trial);
    return data;
  },

  /**
   * Real Google OAuth Sign-In (with automatic local dev fallback)
   */
  async googleLogin(googleEmail = null, pin = null) {
    const serverUrl = await this.getServerUrl();

    // Check if server has a real Google OAuth Client ID configured
    let hasGoogleClient = false;
    try {
      const cfgRes = await fetch(`${serverUrl}/api/auth/google/config`);
      if (cfgRes.ok) {
        const cfg = await cfgRes.json();
        hasGoogleClient = Boolean(cfg.configured);
      }
    } catch (_) {}

    if (hasGoogleClient && typeof chrome !== 'undefined' && chrome?.identity?.getAuthToken) {
      try {
        const token = await new Promise((resolve, reject) => {
          chrome.identity.getAuthToken({ interactive: true }, (authToken) => {
            if (chrome.runtime.lastError || !authToken) {
              reject(new Error(chrome.runtime.lastError?.message || 'Google Sign-In was cancelled'));
            } else {
              resolve(authToken);
            }
          });
        });

        const res = await fetch(`${serverUrl}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, pin })
        });

        const data = await res.json();
        if (data.require2fa) {
          const promptPin = prompt('Two-Factor Authentication: Enter 6-digit Master PIN (312866):', '312866');
          if (!promptPin) throw new Error('2FA verification cancelled');
          return this.googleLogin(googleEmail, promptPin);
        }
        if (!res.ok) {
          throw new Error(data.error || 'Server rejected Google authentication token');
        }

        await this.setAuthSession(data.jwt, data.user, data.trial);
        return data;
      } catch (err) {
        console.warn('Google identity token flow failed, using fallback:', err.message);
      }
    }

    // Local development mode / Google Cloud Client ID not yet linked
    const targetEmail = googleEmail || prompt('Sign in with Google Account:\nEnter Google Email address:', 'parivartanvishalsingh@gmail.com');
    if (!targetEmail) throw new Error('Google Sign-In cancelled');
    const isMaster = targetEmail.toLowerCase() === 'parivartanvishalsingh@gmail.com';
    const finalPin = pin || (isMaster ? '312866' : null);

    return this.devLogin(
      targetEmail,
      isMaster ? 'Vishal Singh' : targetEmail.split('@')[0],
      isMaster ? 'admin' : 'user',
      isMaster ? 'Parivartan HQ' : null,
      isMaster ? 'kmbl1110' : null,
      finalPin
    );
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
