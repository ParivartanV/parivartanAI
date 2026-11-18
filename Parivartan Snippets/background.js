/**
 * Parivartan Snippet - Background Service Worker (Manifest V3)
 */

try {
  if (typeof importScripts === 'function') {
    importScripts('shared/default_snippets.js', 'shared/ai_service.js');
  }
} catch (err) {
  console.error('[Parivartan Background] Error importing scripts:', err);
}

// On Extension Install or Update
chrome.runtime.onInstalled.addListener(async (details) => {
  // Initialize default data or merge new defaults on update
  chrome.storage.local.get(['snippets', 'folders', 'settings'], (res) => {
    const updates = {};
    const defaultSnippets = typeof DEFAULT_SNIPPETS !== 'undefined' ? DEFAULT_SNIPPETS : [];
    const defaultFolders = typeof DEFAULT_FOLDERS !== 'undefined' ? DEFAULT_FOLDERS : [];

    if (!res.snippets || !Array.isArray(res.snippets) || res.snippets.length === 0) {
      updates.snippets = defaultSnippets;
    } else {
      const existingIds = new Set(res.snippets.map(s => s.id));
      const missing = defaultSnippets.filter(d => !existingIds.has(d.id));
      if (missing.length > 0) {
        updates.snippets = [...res.snippets, ...missing];
      }
    }

    if (!res.folders || !Array.isArray(res.folders) || res.folders.length === 0) {
      updates.folders = defaultFolders;
    } else {
      const existingFolderIds = new Set(res.folders.map(f => f.id));
      const missingFolders = defaultFolders.filter(f => !existingFolderIds.has(f.id));
      if (missingFolders.length > 0) {
        updates.folders = [...res.folders, ...missingFolders];
      }
    }

    if (!res.settings) {
      updates.settings = typeof DEFAULT_SETTINGS !== 'undefined' ? DEFAULT_SETTINGS : {};
    }

    if (Object.keys(updates).length > 0) {
      chrome.storage.local.set(updates);
    }
  });

  // Create Context Menus safely after clearing previous instances
  if (chrome.contextMenus && chrome.contextMenus.removeAll) {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: 'open_dashboard',
        title: '⚡ Open Parivartan Snippet Dashboard',
        contexts: ['action']
      });

      chrome.contextMenus.create({
        id: 'save_selection_as_snippet',
        title: '➕ Save selection as Parivartan Snippet',
        contexts: ['selection']
      });
    });
  }
});

// Handle Context Menu Clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'open_dashboard') {
    chrome.runtime.openOptionsPage();
  } else if (info.menuItemId === 'save_selection_as_snippet') {
    const selectedText = info.selectionText || '';
    if (selectedText) {
      // Save to storage as a new snippet draft
      chrome.storage.local.get(['snippets'], (res) => {
        const list = res.snippets || [];
        const newSnippet = {
          id: 'snip_' + Date.now(),
          folderId: 'folder_sample',
          title: 'Quick Snippet ' + new Date().toLocaleTimeString(),
          shortcut: '/snip' + Math.floor(Math.random() * 90 + 10),
          content: selectedText,
          tags: ['captured'],
          usageCount: 0,
          createdAt: Date.now()
        };
        list.unshift(newSnippet);
        chrome.storage.local.set({ snippets: list }, () => {
          chrome.runtime.openOptionsPage();
        });
      });
    }
  }
});

// Handle Extension Command hotkeys (e.g. Alt+Shift+P)
chrome.commands.onCommand.addListener((command, tab) => {
  if (command === 'open-palette' && tab && tab.id) {
    chrome.tabs.sendMessage(tab.id, { action: 'toggle-palette' }).catch(() => {
      // Content script may not be loaded on internal chrome:// pages
    });
  }
});

// Universal AI Service Handler (Relays requests to Gemini, OpenAI, Claude, Ollama without CORS issues)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ACTION_AI_GENERATE') {
    if (typeof AIService !== 'undefined') {
      AIService.generate(request.payload)
        .then(result => sendResponse({ success: true, text: result }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true; // Keep message channel open for asynchronous response
    } else {
      sendResponse({ success: false, error: 'AIService is not loaded in background worker.' });
    }
  } else if (request.action === 'ACTION_TEST_AI_CONNECTION') {
    if (typeof AIService !== 'undefined') {
      AIService.testConnection(request.payload)
        .then(result => sendResponse(result))
        .catch(err => sendResponse({ success: false, message: err.message }));
      return true;
    } else {
      sendResponse({ success: false, message: 'AIService is not loaded in background worker.' });
    }
  } else if (request.action === 'OPEN_DASHBOARD') {
    chrome.runtime.openOptionsPage();
    sendResponse({ success: true });
    return true;
  }
});
