/**
 * Storage Bridge for Parivartan Snippet
 * Supports chrome.storage.local and window.localStorage
 */

class SnippetStorage {
  constructor() {
    this.isChromeStorage = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
    this.listeners = [];
    this._initStorageChangeListener();
  }

  _initStorageChangeListener() {
    if (this.isChromeStorage) {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local') {
          this.listeners.forEach(fn => fn(changes));
        }
      });
    } else if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key && (e.key.startsWith('parivartan_') || e.key.startsWith('pariwartan_'))) {
          this.listeners.forEach(fn => fn({ [e.key]: { newValue: JSON.parse(e.newValue || 'null') } }));
        }
      });
      const handleLocalChange = (e) => {
        if (e.detail) {
          this.listeners.forEach(fn => fn({ [e.detail.key]: { newValue: e.detail.value } }));
        }
      };
      window.addEventListener('parivartan_local_change', handleLocalChange);
      window.addEventListener('pariwartan_local_change', handleLocalChange);
    }
  }

  onChanged(callback) {
    this.listeners.push(callback);
  }

  async get(key, defaultValue = null) {
    return new Promise((resolve) => {
      if (this.isChromeStorage) {
        chrome.storage.local.get([key], (res) => {
          if (chrome.runtime.lastError) {
            resolve(defaultValue);
          } else {
            resolve(res[key] !== undefined ? res[key] : defaultValue);
          }
        });
      } else {
        try {
          const item = localStorage.getItem(`parivartan_${key}`) || localStorage.getItem(`pariwartan_${key}`);
          resolve(item !== null ? JSON.parse(item) : defaultValue);
        } catch (e) {
          resolve(defaultValue);
        }
      }
    });
  }

  async set(key, value) {
    return new Promise((resolve) => {
      // Keep localStorage synchronized as secondary fallback
      try {
        localStorage.setItem(`parivartan_${key}`, JSON.stringify(value));
      } catch (e) {}

      if (this.isChromeStorage) {
        chrome.storage.local.set({ [key]: value }, () => {
          resolve(true);
        });
      } else {
        try {
          window.dispatchEvent(new CustomEvent('parivartan_local_change', { detail: { key, value } }));
          // Broadcast to content script for chrome.storage.local synchronization
          window.postMessage({ type: 'PARIVARTAN_EXTENSION_SYNC', key, value }, '*');
          resolve(true);
        } catch (e) {
          resolve(false);
        }
      }
    });
  }

  async getAllSnippets() {
    let snippets = await this.get('snippets');
    const defaults = typeof DEFAULT_SNIPPETS !== 'undefined' ? DEFAULT_SNIPPETS : [];

    if (!snippets || !Array.isArray(snippets) || snippets.length === 0) {
      await this.set('snippets', defaults);
      return defaults;
    }

    // Build map of canonical default templates
    const defaultMap = {};
    defaults.forEach(d => { defaultMap[d.id] = d; });

    let updated = false;
    // 1. Re-align folderId and auto-heal any accidentally wiped template content
    snippets = snippets.map(s => {
      let changed = false;
      let newSnippet = { ...s };
      if (defaultMap[s.id] && s.folderId !== defaultMap[s.id].folderId) {
        newSnippet.folderId = defaultMap[s.id].folderId;
        changed = true;
      }
      // Auto-heal: If snippet content was wiped or empty on a built-in default snippet, restore it
      if (defaultMap[s.id] && (!newSnippet.content || newSnippet.content.trim() === '')) {
        newSnippet.content = defaultMap[s.id].content;
        changed = true;
      }
      if (changed) updated = true;
      return newSnippet;
    });

    // 2. Restore any accidentally deleted default templates
    const existingIds = new Set(snippets.map(s => s.id));
    const missing = defaults.filter(d => !existingIds.has(d.id));
    if (missing.length > 0) {
      snippets = [...snippets, ...missing];
      updated = true;
    }

    if (updated) {
      await this.set('snippets', snippets);
    }

    return snippets;
  }

  async saveSnippets(snippets) {
    return this.set('snippets', snippets);
  }

  async getFolders() {
    const folders = await this.get('folders');
    const defaults = typeof DEFAULT_FOLDERS !== 'undefined' ? DEFAULT_FOLDERS : [];

    if (!folders || !Array.isArray(folders) || folders.length === 0) {
      await this.set('folders', defaults);
      return defaults;
    }

    // Ensure the 5 canonical categories (Support, Network, Abuse, General, Common) are present
    const canonicalIds = new Set(defaults.map(d => d.id));
    const hasAllCanonical = defaults.every(d => folders.some(f => f.id === d.id));

    if (!hasAllCanonical) {
      // Filter out deprecated folders like folder_sample and merge with new 5 categories
      const customFolders = folders.filter(f => !canonicalIds.has(f.id) && f.id !== 'folder_sample' && f.id !== 'folder_billing');
      const synchronizedFolders = [...defaults, ...customFolders];
      await this.set('folders', synchronizedFolders);
      return synchronizedFolders;
    }

    return folders;
  }

  async saveFolders(folders) {
    return this.set('folders', folders);
  }

  async getSettings() {
    const settings = await this.get('settings');
    const defaults = typeof DEFAULT_SETTINGS !== 'undefined' ? DEFAULT_SETTINGS : {};
    return { ...defaults, ...(settings || {}) };
  }

  async saveSettings(settings) {
    return this.set('settings', settings);
  }

  async recordSnippetUsage(snippetId, charsSaved = 0) {
    const snippets = await this.getAllSnippets();
    const idx = snippets.findIndex(s => s.id === snippetId);
    if (idx !== -1) {
      snippets[idx].usageCount = (snippets[idx].usageCount || 0) + 1;
      snippets[idx].lastUsed = Date.now();
      await this.saveSnippets(snippets);
    }
    const settings = await this.getSettings();
    settings.totalKeystrokesSaved = (settings.totalKeystrokesSaved || 0) + charsSaved;
    await this.saveSettings(settings);
  }

  // --- Custom AI Prompts Management ---
  async getCustomPrompts() {
    let prompts = await this.get('customAiPrompts');
    const defaults = typeof DEFAULT_AI_PROMPTS !== 'undefined' ? DEFAULT_AI_PROMPTS : [];
    if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
      await this.set('customAiPrompts', defaults);
      return defaults;
    }
    return prompts;
  }

  async saveCustomPrompts(prompts) {
    return this.set('customAiPrompts', prompts);
  }

  // --- Dynamic Prompt Variables Management ---
  async getCustomVariables() {
    let vars = await this.get('customAiVariables');
    const defaults = typeof DEFAULT_AI_VARIABLES !== 'undefined' ? DEFAULT_AI_VARIABLES : [];
    if (!vars || !Array.isArray(vars) || vars.length === 0) {
      await this.set('customAiVariables', defaults);
      return defaults;
    }
    return vars;
  }

  async saveCustomVariables(vars) {
    return this.set('customAiVariables', vars);
  }

  async getDefaultPromptId() {
    return this.get('defaultPromptId', 'prompt_diagnose');
  }

  async setDefaultPromptId(id) {
    return this.set('defaultPromptId', id);
  }

  // --- AI Personas & Thinking Characters Management ---
  async getCustomPersonas() {
    let list = await this.get('customAiPersonas');
    return Array.isArray(list) ? list : [];
  }

  async saveCustomPersonas(personas) {
    return this.set('customAiPersonas', personas);
  }

  async getAllPersonas() {
    const defaults = typeof DEFAULT_AI_PERSONAS !== 'undefined' ? DEFAULT_AI_PERSONAS : [];
    const custom = await this.getCustomPersonas();
    return [...defaults, ...custom];
  }

  async getActivePersonaId() {
    const settings = await this.getSettings();
    return settings.ai?.persona || 'support';
  }

  async setActivePersonaId(id) {
    const settings = await this.getSettings();
    settings.ai = settings.ai || {};
    settings.ai.persona = id;
    await this.saveSettings(settings);
    return id;
  }

  /**
   * Export in clean, human-readable format
   */
  async exportData() {
    const snippets = await this.getAllSnippets();
    const folders = await this.getFolders();
    const settings = await this.getSettings();
    const prompts = await this.getCustomPrompts();
    const variables = await this.getCustomVariables();
    const customPersonas = await this.getCustomPersonas();

    // Map folders to id -> name
    const folderMap = {};
    folders.forEach(f => { folderMap[f.id] = f.name; });

    const simplifiedSnippets = snippets.map(s => ({
      label: s.title || 'Untitled',
      shortcut: s.shortcut || '',
      folder: folderMap[s.folderId] || 'My Sample Snippets',
      content: s.content || '',
      tags: s.tags || []
    }));

    const simplifiedFolders = folders.map(f => ({
      id: f.id,
      name: f.name
    }));

    return JSON.stringify({
      application: "Parivartan Snippet",
      version: "1.0",
      exportedAt: new Date().toISOString(),
      settings: {
        theme: settings.theme || "day",
        defaultAuthor: settings.defaultAuthor || "Support Agent",
        defaultTemplate: settings.defaultTemplate || "Hello {name},\n\nThank you for reaching out.\n\nBest regards,\n{my_name}",
        triggerPrefix: settings.triggerPrefix || "/",
        floatingWidget: settings.floatingWidget !== false
      },
      folders: simplifiedFolders,
      snippets: simplifiedSnippets,
      prompts: prompts,
      variables: variables,
      personas: customPersonas
    }, null, 2);
  }

  /**
   * Import data from clean JSON format (supports both new simplified & original format)
   */
  async importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);

      // Restore settings
      if (data.settings) {
        const cur = await this.getSettings();
        await this.saveSettings({ ...cur, ...data.settings });
      }

      // Restore custom AI prompts
      if (data.prompts && Array.isArray(data.prompts)) {
        await this.saveCustomPrompts(data.prompts);
      }

      // Restore custom AI variables
      if (data.variables && Array.isArray(data.variables)) {
        await this.saveCustomVariables(data.variables);
      }

      // Restore custom AI personas
      if (data.personas && Array.isArray(data.personas)) {
        await this.saveCustomPersonas(data.personas);
      }

      // Restore folders
      let folderList = [];
      const folderNameToId = {};

      if (data.folders && Array.isArray(data.folders)) {
        folderList = data.folders.map((f, i) => {
          const id = f.id || `folder_${Date.now()}_${i}`;
          folderNameToId[f.name] = id;
          return { id, name: f.name, icon: "folder" };
        });
        await this.saveFolders(folderList);
      } else {
        folderList = await this.getFolders();
        folderList.forEach(f => { folderNameToId[f.name] = f.id; });
      }

      // Restore snippets
      if (data.snippets && Array.isArray(data.snippets)) {
        const defaultFolderId = folderList[0] ? folderList[0].id : "folder_sample";

        const restoredSnippets = data.snippets.map((s, idx) => {
          // Detect whether format is simplified (label) or original (title)
          const title = s.label || s.title || 'Untitled Snippet';
          const shortcut = s.shortcut ? (s.shortcut.startsWith('/') ? s.shortcut : '/' + s.shortcut) : `/snip${idx}`;
          const content = s.content || '';
          
          let folderId = s.folderId;
          if (!folderId && s.folder && folderNameToId[s.folder]) {
            folderId = folderNameToId[s.folder];
          }
          if (!folderId) {
            folderId = defaultFolderId;
          }

          return {
            id: s.id || `snip_${Date.now()}_${idx}`,
            folderId,
            title,
            shortcut,
            content,
            tags: s.tags || [],
            usageCount: s.usageCount || 0,
            createdAt: s.createdAt || Date.now()
          };
        });

        await this.saveSnippets(restoredSnippets);
        return { success: true, count: restoredSnippets.length };
      }

      return { success: true, count: 0 };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

window.SnippetStorage = new SnippetStorage();
