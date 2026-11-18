/**
 * Parivartan Snippet - Content Script
 * Injected on all web pages to expand shortcuts in Gmail, Outlook, Zendesk, forms, and editors.
 */

(() => {
  // --- Check if Running Inside an Embedded AI Iframe (ChatGPT / Claude / Gemini) ---
  const isInsideAiIframe = window !== window.top && (
    window.location.hostname.includes('chatgpt.com') ||
    window.location.hostname.includes('openai.com') ||
    window.location.hostname.includes('claude.ai') ||
    window.location.hostname.includes('gemini.google.com')
  );

  if (isInsideAiIframe) {
    window.addEventListener('message', (event) => {
      if (!event.data || typeof event.data !== 'object') return;

      if (event.data.type === 'PV_INJECT_PROMPT') {
        const text = event.data.text || '';
        const autoSubmit = !!event.data.autoSubmit;
        let success = false;

        // 1. ChatGPT
        const gptInput = document.querySelector('#prompt-textarea') ||
                         document.querySelector('div[contenteditable="true"]') ||
                         document.querySelector('textarea');
        if (gptInput) {
          gptInput.focus();
          try {
            document.execCommand('selectAll', false, null);
            document.execCommand('insertText', false, text);
          } catch (e) {
            if (gptInput.tagName === 'TEXTAREA') {
              gptInput.value = text;
              gptInput.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
              gptInput.innerHTML = '<p>' + text.replace(/\n/g, '<br>') + '</p>';
              gptInput.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
            }
          }
          if (autoSubmit) {
            setTimeout(() => {
              const sendBtn = document.querySelector('button[data-testid="send-button"]') ||
                              document.querySelector('button[aria-label="Send prompt"]') ||
                              document.querySelector('button[aria-label="Send message"]') ||
                              gptInput.closest('form')?.querySelector('button[type="submit"]');
              if (sendBtn && !sendBtn.disabled) sendBtn.click();
            }, 300);
          }
          success = true;
        }

        // 2. Claude
        const claudeInput = document.querySelector('div[contenteditable="true"].ProseMirror') ||
                            document.querySelector('div[contenteditable="true"]');
        if (!success && claudeInput) {
          claudeInput.focus();
          try {
            document.execCommand('selectAll', false, null);
            document.execCommand('insertText', false, text);
          } catch (e) {
            claudeInput.innerHTML = '<p>' + text.replace(/\n/g, '<br>') + '</p>';
            claudeInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
          if (autoSubmit) {
            setTimeout(() => {
              const sendBtn = document.querySelector('button[aria-label="Send Message"]') ||
                              document.querySelector('button[type="submit"]') ||
                              claudeInput.closest('fieldset')?.querySelector('button');
              if (sendBtn && !sendBtn.disabled) sendBtn.click();
            }, 300);
          }
          success = true;
        }

        // 3. Gemini
        const geminiInput = document.querySelector('.ql-editor') ||
                            document.querySelector('rich-textarea') ||
                            document.querySelector('div[contenteditable="true"]');
        if (!success && geminiInput) {
          geminiInput.focus();
          try {
            document.execCommand('selectAll', false, null);
            document.execCommand('insertText', false, text);
          } catch (e) {
            geminiInput.innerText = text;
            geminiInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
          if (autoSubmit) {
            setTimeout(() => {
              const sendBtn = document.querySelector('button[aria-label="Send message"]') ||
                              document.querySelector('.send-button');
              if (sendBtn && !sendBtn.disabled) sendBtn.click();
            }, 300);
          }
          success = true;
        }

        try {
          window.parent.postMessage({ type: 'PV_INJECT_RESULT', success }, '*');
        } catch (e) {}
      } else if (event.data.type === 'PV_GET_LATEST_REPLY') {
        let reply = '';
        const gptMsgs = document.querySelectorAll('div[data-message-author-role="assistant"]');
        if (gptMsgs.length > 0) {
          reply = gptMsgs[gptMsgs.length - 1].innerText;
        }
        if (!reply) {
          const claudeMsgs = document.querySelectorAll('.font-claude-message, [data-is-streaming]');
          if (claudeMsgs.length > 0) reply = claudeMsgs[claudeMsgs.length - 1].innerText;
        }
        if (!reply) {
          const geminiMsgs = document.querySelectorAll('model-response, .response-content');
          if (geminiMsgs.length > 0) reply = geminiMsgs[geminiMsgs.length - 1].innerText;
        }

        try {
          window.parent.postMessage({ type: 'PV_LATEST_REPLY_RESULT', reply }, '*');
        } catch (e) {}
      }
    });
    return;
  }

  let snippets = [];
  let folders = [];
  let settings = {
    triggerPrefix: '/',
    quickExpand: true,
    floatingWidget: true,
    selectionWidget: true,
    defaultAuthor: 'Support Team'
  };

  let typedBuffer = '';
  let activeEditableElement = null;
  let savedSelectionStart = 0;
  let savedSelectionEnd = 0;
  let savedSelectionRange = null;

  let activeFolderFilter = 'all';
  let menuSearchQuery = '';
  let isFloatingMenuOpen = false;
  let activeMenuTab = 'snippets'; // 'snippets' | 'ai'
  let isMenuExpanded = false;
  let savedMenuWidth = null;
  let savedMenuHeight = null;
  let savedMenuLeft = null;
  let savedMenuTop = null;
  let hasCustomMenuSize = false;
  let hasCustomMenuPos = false;
  let isRecentOpen = true;
  let isSelectionAttached = true;
  let isPageAttached = true;
  let isContextExpanded = false;
  let isInlineKeyBoxOpen = false;
  let currentCustomPromptText = '';
  let currentAiContext = '';
  let lastSelectedPageText = '';
  let isAiGenerating = false;
  let lastAiResult = '';
  let selectionPill = null;
  let selectionCheckTimeout = null;
  let toastTimeout = null;
  let isDictatingDrawer = false;
  let isDictatingSearch = false;
  let aiChatMessages = [];
  let temporaryChatTurn = 0; // Tracks turns in temporary chat session (0 = fresh, 1 = first turn with context, 2+ = follow-ups without context)
  let customAiPrompts = [];
  let customAiVariables = [];
  let customAiPersonas = [];

  // --- Extension Context Validation & Safe Wrappers ---
  function isExtensionValid() {
    try {
      return typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id;
    } catch (e) {
      return false;
    }
  }

  function safeStorageSet(items, callback) {
    try {
      if (items.settings) {
        localStorage.setItem('parivartan_settings', JSON.stringify(items.settings));
      }
      if (items.snippets) {
        localStorage.setItem('parivartan_snippets', JSON.stringify(items.snippets));
      }
      if (items.folders) {
        localStorage.setItem('parivartan_folders', JSON.stringify(items.folders));
      }
      if (items.menuBounds) {
        localStorage.setItem('parivartan_menu_bounds', JSON.stringify(items.menuBounds));
      }
      if (items.customAiPrompts) {
        localStorage.setItem('parivartan_customAiPrompts', JSON.stringify(items.customAiPrompts));
      }
      if (items.customAiVariables) {
        localStorage.setItem('parivartan_customAiVariables', JSON.stringify(items.customAiVariables));
      }
      if (items.customAiPersonas) {
        localStorage.setItem('parivartan_customAiPersonas', JSON.stringify(items.customAiPersonas));
      }
    } catch (e) {}

    try {
      if (isExtensionValid() && chrome.storage?.local) {
        chrome.storage.local.set(items, () => {
          if (chrome.runtime?.lastError) {
            console.warn('[Parivartan] Storage set error:', chrome.runtime.lastError.message);
          }
          if (callback) callback();
        });
        return;
      }
    } catch (err) {
      console.warn('[Parivartan] Storage access skipped (context invalidated):', err.message);
    }
    if (callback) callback();
  }

  function safeSendMessage(payload, callback) {
    try {
      if (isExtensionValid() && chrome.runtime?.sendMessage) {
        chrome.runtime.sendMessage(payload, (response) => {
          if (chrome.runtime?.lastError) {
            const msg = chrome.runtime.lastError.message || '';
            if (msg.includes('context invalidated') || msg.includes('Extension context invalidated')) {
              showInPageToast('⚠️ Extension updated. Please refresh (F5) this tab to reconnect.');
              if (callback) callback({ success: false, error: 'Extension context invalidated. Please refresh (F5) this tab.' });
              return;
            }
            if (callback) callback({ success: false, error: msg });
            return;
          }
          if (callback) callback(response);
        });
        return;
      }
    } catch (err) {
      console.warn('[Parivartan] SendMessage skipped (context invalidated):', err.message);
      showInPageToast('⚠️ Extension reloaded. Please refresh (F5) this tab to reconnect.');
      if (callback) callback({ success: false, error: 'Extension reloaded. Please refresh (F5) this tab.' });
      return;
    }
    if (callback) callback({ success: false, error: 'Extension disconnected. Please refresh (F5).' });
  }

  function loadFromLocalStorage() {
    try {
      const raw = localStorage.getItem('parivartan_snippets') || localStorage.getItem('pariwartan_snippets');
      if (raw) snippets = JSON.parse(raw);
      else if (typeof DEFAULT_SNIPPETS !== 'undefined') snippets = DEFAULT_SNIPPETS;

      const fraw = localStorage.getItem('parivartan_folders') || localStorage.getItem('pariwartan_folders');
      if (fraw) folders = JSON.parse(fraw);
      else if (typeof DEFAULT_FOLDERS !== 'undefined') folders = DEFAULT_FOLDERS;

      const setRaw = localStorage.getItem('parivartan_settings') || localStorage.getItem('pariwartan_settings');
      if (setRaw) settings = { ...settings, ...JSON.parse(setRaw) };

      const pRaw = localStorage.getItem('parivartan_customAiPrompts') || localStorage.getItem('pariwartan_customAiPrompts');
      if (pRaw) customAiPrompts = JSON.parse(pRaw);
      else if (typeof DEFAULT_AI_PROMPTS !== 'undefined') customAiPrompts = DEFAULT_AI_PROMPTS;

      const vRaw = localStorage.getItem('parivartan_customAiVariables') || localStorage.getItem('pariwartan_customAiVariables');
      if (vRaw) customAiVariables = JSON.parse(vRaw);
      else if (typeof DEFAULT_AI_VARIABLES !== 'undefined') customAiVariables = DEFAULT_AI_VARIABLES;

      const perRaw = localStorage.getItem('parivartan_customAiPersonas') || localStorage.getItem('pariwartan_customAiPersonas');
      if (perRaw) customAiPersonas = JSON.parse(perRaw);
      else customAiPersonas = [];
    } catch (e) {}
    loadSavedMenuBounds();
    setupFloatingWidget();
  }

  // --- Client Authentication Enforcement ---
  let isClientLoggedIn = false;
  let currentClientUser = null;

  // --- Load Data from Storage ---
  function loadSnippetsAndSettings() {
    if (isExtensionValid() && chrome.storage?.local) {
      try {
        chrome.storage.local.get(['snippets', 'settings', 'folders', 'customAiPrompts', 'customAiVariables', 'customAiPersonas', 'cloudAuthToken', 'cloudUser'], (res) => {
          if (chrome.runtime?.lastError) {
            loadFromLocalStorage();
            return;
          }
          isClientLoggedIn = !!(res && res.cloudAuthToken && res.cloudUser);
          currentClientUser = res ? res.cloudUser : null;

          let storageSnippets = res ? res.snippets : null;
          let storageFolders = res ? res.folders : null;

          // Only check localStorage as fallback if chrome.storage.local is empty
          if (!storageSnippets || !Array.isArray(storageSnippets) || storageSnippets.length === 0) {
            try {
              const localRaw = localStorage.getItem('parivartan_snippets') || localStorage.getItem('pariwartan_snippets');
              if (localRaw) {
                const localSnippets = JSON.parse(localRaw);
                if (Array.isArray(localSnippets) && localSnippets.length > 0) {
                  storageSnippets = localSnippets;
                  safeStorageSet({ snippets: localSnippets });
                }
              }
            } catch (e) {}
          }

          if (!storageFolders || !Array.isArray(storageFolders) || storageFolders.length === 0) {
            try {
              const localFoldersRaw = localStorage.getItem('parivartan_folders') || localStorage.getItem('pariwartan_folders');
              if (localFoldersRaw) {
                const localFolders = JSON.parse(localFoldersRaw);
                if (Array.isArray(localFolders) && localFolders.length > 0) {
                  storageFolders = localFolders;
                  safeStorageSet({ folders: localFolders });
                }
              }
            } catch (e) {}
          }

          if (!res || !res.settings) {
            try {
              const localSettingsRaw = localStorage.getItem('parivartan_settings') || localStorage.getItem('pariwartan_settings');
              if (localSettingsRaw) {
                const localSettings = JSON.parse(localSettingsRaw);
                if (localSettings && typeof localSettings === 'object') {
                  settings = { ...settings, ...localSettings };
                }
              }
            } catch (e) {}
          }

          if (storageSnippets && Array.isArray(storageSnippets) && storageSnippets.length > 0) {
            snippets = storageSnippets;
          } else if (typeof DEFAULT_SNIPPETS !== 'undefined') {
            snippets = DEFAULT_SNIPPETS;
          }

          if (storageFolders && Array.isArray(storageFolders) && storageFolders.length > 0) {
            folders = storageFolders;
          } else if (typeof DEFAULT_FOLDERS !== 'undefined') {
            folders = DEFAULT_FOLDERS;
          }

          if (res && res.customAiPrompts && Array.isArray(res.customAiPrompts)) {
            customAiPrompts = res.customAiPrompts;
          } else {
            try {
              const pRaw = localStorage.getItem('parivartan_customAiPrompts') || localStorage.getItem('pariwartan_customAiPrompts');
              if (pRaw) customAiPrompts = JSON.parse(pRaw);
              else if (typeof DEFAULT_AI_PROMPTS !== 'undefined') customAiPrompts = DEFAULT_AI_PROMPTS;
            } catch (e) {}
          }

          if (res && res.customAiVariables && Array.isArray(res.customAiVariables)) {
            customAiVariables = res.customAiVariables;
          } else {
            try {
              const vRaw = localStorage.getItem('parivartan_customAiVariables') || localStorage.getItem('pariwartan_customAiVariables');
              if (vRaw) customAiVariables = JSON.parse(vRaw);
              else if (typeof DEFAULT_AI_VARIABLES !== 'undefined') customAiVariables = DEFAULT_AI_VARIABLES;
            } catch (e) {}
          }

          if (res && res.customAiPersonas && Array.isArray(res.customAiPersonas)) {
            customAiPersonas = res.customAiPersonas;
          } else {
            try {
              const perRaw = localStorage.getItem('parivartan_customAiPersonas') || localStorage.getItem('pariwartan_customAiPersonas');
              if (perRaw) customAiPersonas = JSON.parse(perRaw);
              else customAiPersonas = [];
            } catch (e) {}
          }

          if (res && res.settings) {
            settings = { ...settings, ...res.settings };
          }
          loadSavedMenuBounds();
          setupFloatingWidget();
        });
      } catch (err) {
        console.warn('[Parivartan] Storage get failed, using localStorage:', err.message);
        loadFromLocalStorage();
      }
    } else {
      loadFromLocalStorage();
    }
  }

  // Check if AI Assistant is enabled by user in dashboard settings
  function isAiAssistantEnabled() {
    if (!settings) return true;
    if (typeof settings.aiEnabled === 'boolean') return settings.aiEnabled;
    if (settings.ai && typeof settings.ai.enabled === 'boolean') return settings.ai.enabled;
    return true;
  }

  // Check if Floating Browser Launcher Icon is enabled
  function isFloatingWidgetEnabled() {
    if (!settings) return true;
    if (typeof settings.floatingWidget === 'boolean') return settings.floatingWidget;
    return true;
  }

  // Check if Text Selection Action Pill Icon is enabled
  function isTextSelectionIconEnabled() {
    if (!settings) return true;
    if (typeof settings.selectionWidget === 'boolean') return settings.selectionWidget;
    if (typeof settings.textSelectionIcon === 'boolean') return settings.textSelectionIcon;
    return true;
  }

  // Listen to window postMessage from dashboard tab to sync storage immediately
  window.addEventListener('message', (event) => {
    if (event.data && (event.data.type === 'PARIVARTAN_EXTENSION_SYNC' || event.data.type === 'PARIWARTAN_EXTENSION_SYNC')) {
      const { key, value } = event.data;
      if (key === 'snippets' && Array.isArray(value)) {
        snippets = value;
      } else if (key === 'folders' && Array.isArray(value)) {
        folders = value;
      } else if (key === 'customAiPrompts' && Array.isArray(value)) {
        customAiPrompts = value;
      } else if (key === 'customAiVariables' && Array.isArray(value)) {
        customAiVariables = value;
      } else if (key === 'customAiPersonas' && Array.isArray(value)) {
        customAiPersonas = value;
      } else if (key === 'settings' && value) {
        settings = { ...settings, ...value };
        setupFloatingWidget();
        applyThemeToInPageUI();
        applyTextScaleToInPageUI();
        if (!isTextSelectionIconEnabled()) {
          removeSelectionPill();
        }
      }
      safeStorageSet({ [key]: value });
      if (isFloatingMenuOpen) {
        if (!isAiAssistantEnabled() && activeMenuTab === 'ai') {
          activeMenuTab = 'snippets';
        }
        openFloatingMenu(activeMenuTab);
      }
    }

    if (event.data && event.data.type === 'PV_LATEST_REPLY_RESULT' && event.data.reply) {
      pasteAiTextToCursor(event.data.reply);
      showInPageToast('↵ Pasted AI reply directly at cursor!');
    }
  });

  // Listen for storage changes across tabs & dashboard
  if (isExtensionValid() && chrome.storage?.onChanged) {
    try {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local') {
          if (changes.cloudAuthToken || changes.cloudUser) {
            chrome.storage.local.get(['cloudAuthToken', 'cloudUser'], (res) => {
              isClientLoggedIn = !!(res && res.cloudAuthToken && res.cloudUser);
              currentClientUser = res ? res.cloudUser : null;
            });
          }
          if (changes.snippets && changes.snippets.newValue) {
            snippets = changes.snippets.newValue;
          }
          if (changes.folders && changes.folders.newValue) {
            folders = changes.folders.newValue;
          }
          if (changes.customAiPrompts && changes.customAiPrompts.newValue) {
            customAiPrompts = changes.customAiPrompts.newValue;
          }
          if (changes.customAiVariables && changes.customAiVariables.newValue) {
            customAiVariables = changes.customAiVariables.newValue;
          }
          if (changes.customAiPersonas && changes.customAiPersonas.newValue) {
            customAiPersonas = changes.customAiPersonas.newValue;
          }
          if (changes.settings && changes.settings.newValue) {
            settings = { ...settings, ...changes.settings.newValue };
            setupFloatingWidget();
            applyThemeToInPageUI();
            applyTextScaleToInPageUI();
            if (!isTextSelectionIconEnabled()) {
              removeSelectionPill();
            }
          }
          if (isFloatingMenuOpen) {
            if (!isAiAssistantEnabled() && activeMenuTab === 'ai') {
              activeMenuTab = 'snippets';
            }
            openFloatingMenu(activeMenuTab);
          }
        }
      });
    } catch (e) {}
  }

  // --- Date & Time Formatters ---
  function getFormattedDate() {
    const d = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }

  function getFormattedTime() {
    const d = new Date();
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  }

  // Extract variables
  function extractVariables(content) {
    if (!content) return [];
    const vars = [];
    const seen = new Set();
    const regex = /\{([^}]+)\}/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const inner = match[1].trim();
      if (['date', 'time', 'cursor'].includes(inner.toLowerCase())) {
        continue;
      }
      if (inner.startsWith('dropdown:') || inner.startsWith('choice:')) {
        const parts = inner.replace(/^(dropdown|choice):/, '').split('|');
        const key = parts[0].trim();
        const options = parts.slice(1).map(s => s.trim());
        if (!seen.has(key)) {
          seen.add(key);
          vars.push({ key, type: 'dropdown', label: key, options });
        }
      } else {
        const key = inner;
        if (!seen.has(key)) {
          seen.add(key);
          const label = key.split(/[_-]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          vars.push({ key, type: 'text', label });
        }
      }
    }
    return vars;
  }

  // Render snippet template
  function renderSnippet(content, values = {}) {
    let result = content;
    result = result.replace(/\{date\}/gi, getFormattedDate());
    result = result.replace(/\{time\}/gi, getFormattedTime());
    const myName = values.my_name || settings.defaultAuthor || 'Support Team';
    result = result.replace(/\{my_name\}/gi, myName);

    result = result.replace(/\{(?:dropdown|choice):([^}|]+)\|([^}]+)\}/g, (match, key, opts) => {
      if (values[key] !== undefined && values[key] !== '') return values[key];
      return opts.split('|')[0] || '';
    });

    result = result.replace(/\{([a-zA-Z0-9_\-]+)\}/g, (match, key) => {
      if (key.toLowerCase() === 'cursor') return '';
      if (values[key] !== undefined && values[key] !== '') return values[key];
      // If no value provided, fill with user-friendly placeholder or leave clean
      if (['name', 'customer_name'].includes(key.toLowerCase())) return 'there';
      if (['ticket_id'].includes(key.toLowerCase())) return '#1001';
      return match;
    });

    return result;
  }

  // --- Insertion Logic into Editable Elements ---
  function insertTextIntoElement(target, textToInsert, deleteCharsCount = 0, cursorOffset = -1) {
    if (!target) return;
    target.focus();

    const isContentEditable = target.isContentEditable || target.getAttribute('contenteditable') === 'true';

    if (isContentEditable) {
      let sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) {
        const range = document.createRange();
        range.selectNodeContents(target);
        range.collapse(false);
        sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }

      // Delete typed shortcut if needed
      if (deleteCharsCount > 0) {
        const node = sel.anchorNode;
        const currentOffset = sel.anchorOffset;
        if (node && node.nodeType === Node.TEXT_NODE && currentOffset >= deleteCharsCount) {
          const deleteRange = document.createRange();
          deleteRange.setStart(node, currentOffset - deleteCharsCount);
          deleteRange.setEnd(node, currentOffset);
          sel.removeAllRanges();
          sel.addRange(deleteRange);
          document.execCommand('delete', false, null);
        } else {
          for (let i = 0; i < deleteCharsCount; i++) {
            document.execCommand('delete', false, null);
          }
        }
      }

      // Insert text
      let inserted = false;
      try {
        inserted = document.execCommand('insertText', false, textToInsert);
      } catch (e) {}

      if (!inserted && sel && sel.rangeCount > 0) {
        try {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          const lines = textToInsert.split('\n');
          const fragment = document.createDocumentFragment();
          lines.forEach((line, index) => {
            if (index > 0) fragment.appendChild(document.createElement('br'));
            fragment.appendChild(document.createTextNode(line));
          });
          range.insertNode(fragment);
        } catch (e) {}
      }

      try {
        target.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: textToInsert }));
      } catch (e) {
        target.dispatchEvent(new Event('input', { bubbles: true }));
      }
      target.dispatchEvent(new Event('change', { bubbles: true }));

    } else {
      // Standard input or textarea
      target.focus();

      let start = 0;
      let end = 0;
      try {
        start = target.selectionStart ?? (target.value ? target.value.length : 0);
        end = target.selectionEnd ?? start;
      } catch (e) {
        start = target.value ? target.value.length : 0;
        end = start;
      }

      // Delete typed shortcut if needed
      if (deleteCharsCount > 0) {
        const removeStart = Math.max(0, start - deleteCharsCount);
        try {
          target.setSelectionRange(removeStart, start);
        } catch (e) {}
      }

      // Tier 1: Try native document.execCommand('insertText')
      let inserted = false;
      try {
        inserted = document.execCommand('insertText', false, textToInsert);
      } catch (e) {}

      // Tier 2: Value setter with React synthetic event tracker bypass
      if (!inserted) {
        const removeStart = deleteCharsCount > 0 ? Math.max(0, start - deleteCharsCount) : start;
        const oldVal = target.value || '';
        const newVal = oldVal.substring(0, removeStart) + textToInsert + oldVal.substring(end);

        const proto = Object.getPrototypeOf(target);
        const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
        if (descriptor && descriptor.set) {
          descriptor.set.call(target, newVal);
        } else {
          target.value = newVal;
        }

        const finalCursorPos = cursorOffset >= 0
          ? (removeStart + cursorOffset)
          : (removeStart + textToInsert.length);

        try {
          target.setSelectionRange(finalCursorPos, finalCursorPos);
        } catch (e) {}
      }

      try {
        target.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: textToInsert }));
      } catch (e) {
        target.dispatchEvent(new Event('input', { bubbles: true }));
      }
      target.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  // --- Helper to inspect text right before cursor ---
  function getTextBeforeCursor(target) {
    if (!target) return '';
    const isContentEditable = target.isContentEditable || target.getAttribute('contenteditable') === 'true';

    if (isContentEditable) {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return '';
      try {
        const range = sel.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(target);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        return preCaretRange.toString().slice(-40);
      } catch (err) {
        const node = sel.anchorNode;
        if (node && node.nodeType === Node.TEXT_NODE) {
          return node.textContent.substring(0, sel.anchorOffset);
        }
        return '';
      }
    } else if (typeof target.selectionStart === 'number') {
      return target.value.substring(0, target.selectionStart);
    }
    return '';
  }

  // --- Shortcut Matcher ---
  function findMatchingShortcut(target) {
    const textBefore = getTextBeforeCursor(target);

    if (!snippets || snippets.length === 0) return null;

    for (const snippet of snippets) {
      if (!snippet.shortcut) continue;
      const raw = snippet.shortcut.trim();
      const slash = raw.startsWith('/') ? raw : '/' + raw;
      const noSlash = raw.replace(/^\//, '');

      // 1. Direct exact match (e.g. /kkmon)
      if (textBefore.endsWith(slash) || typedBuffer.endsWith(slash)) {
        return { snippet, shortcutLen: slash.length };
      }

      // 2. Space appended match (e.g. user typed /kkmon followed by space)
      if (textBefore.endsWith(slash + ' ') || typedBuffer.endsWith(slash + ' ')) {
        return { snippet, shortcutLen: slash.length + 1 };
      }

      // 3. Omitted leading slash typed after slash (e.g. user defined 'kkmon' but types '/kkmon')
      if (noSlash.length >= 2) {
        if (textBefore.endsWith('/' + noSlash) || typedBuffer.endsWith('/' + noSlash)) {
          return { snippet, shortcutLen: noSlash.length + 1 };
        }
        if (textBefore.endsWith('/' + noSlash + ' ') || typedBuffer.endsWith('/' + noSlash + ' ')) {
          return { snippet, shortcutLen: noSlash.length + 2 };
        }
      }
    }
    return null;
  }

  function buildActiveContextValues() {
    const vals = {
      'Ticket_ID': extractTicketId(),
      'Customer_Message': extractCustomerMessage(),
      'Page_context': extractPageContext(),
      'Engineer_Name': (settings && settings.defaultAuthor) || 'Support Engineer',
      'my_name': (settings && settings.defaultAuthor) || 'Support Engineer',
      'Support_Tier': 'Tier 2 Technical Support'
    };
    if (Array.isArray(customAiVariables)) {
      customAiVariables.forEach(v => {
        if (v && v.key && v.defaultValue !== undefined) {
          vals[v.key] = v.defaultValue;
        }
      });
    }
    return vals;
  }

  // --- Process Shortcut Expansion ---
  async function triggerExpansion(target, match) {
    if (!isClientLoggedIn) {
      showAuthRequiredToast();
      return;
    }

    const { snippet, shortcutLen } = match;
    typedBuffer = ''; // Reset buffer immediately

    const engine = window.ParivartanEngine || window.PariwartanEngine;
    const activeValues = buildActiveContextValues();
    const renderRes = engine
      ? engine.renderWithCursor(snippet.content, activeValues, settings)
      : { text: snippet.content, cursorOffset: -1 };

    insertTextIntoElement(target, renderRes.text, shortcutLen, renderRes.cursorOffset);
    recordSnippetUsage(snippet.id, renderRes.text.length);
  }

  // --- Event Listeners for Typing ---
  let isExpanding = false;

  function handleInputEvent(e) {
    const target = e.target;
    if (!target) return;
    if (target.closest && (target.closest('#pariwartan-floating-menu') || target.closest('#pariwartan-floating-widget'))) return;

    const isInput = target.tagName === 'INPUT' && ['text', 'search', 'email', 'url'].includes(target.type);
    const isTextArea = target.tagName === 'TEXTAREA';
    const isContentEditable = target.isContentEditable || target.getAttribute('contenteditable') === 'true';

    if (!isInput && !isTextArea && !isContentEditable) return;

    activeEditableElement = target;
    saveActiveCursorPosition();

    // Track typed characters in buffer without doubling
    if (e.data) {
      typedBuffer += e.data;
      if (typedBuffer.length > 30) typedBuffer = typedBuffer.slice(-30);
    } else if (e.inputType === 'deleteContentBackward') {
      typedBuffer = typedBuffer.slice(0, -1);
    }

    if (isExpanding) return;

    const match = findMatchingShortcut(target);
    if (match) {
      isExpanding = true;
      typedBuffer = '';
      try {
        triggerExpansion(target, match);
      } finally {
        setTimeout(() => { isExpanding = false; }, 120);
      }
    }
  }

  function handleKeyDown(e) {
    const target = e.target;
    if (!target) return;
    if (target.closest && (target.closest('#pariwartan-floating-menu') || target.closest('#pariwartan-floating-widget'))) return;

    if (target && (target.isContentEditable || ['INPUT', 'TEXTAREA'].includes(target.tagName))) {
      activeEditableElement = target;
      saveActiveCursorPosition();
    }

    if (['Enter', 'Tab', 'Escape'].includes(e.key)) {
      typedBuffer = '';
    } else if (e.key === 'Backspace') {
      typedBuffer = typedBuffer.slice(0, -1);
    }
  }

  function removeModal() {
    const existing = document.getElementById('pariwartan-active-modal');
    if (existing) existing.remove();
  }

  // --- Command Palette (Alt+Shift+P) ---
  function showAuthRequiredModal() {
    removeModal();
    const overlay = document.createElement('div');
    overlay.className = 'pariwartan-overlay';
    overlay.id = 'pariwartan-active-modal';
    overlay.innerHTML = `
      <div class="pariwartan-dialog" style="max-width: 440px; text-align: center; padding: 26px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(79, 70, 229, 0.1); color: #4f46e5; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <h3 style="font-size: 1.05rem; font-weight: 700; color: #0f172a; margin: 0 0 8px 0;">Client Sign-In Required</h3>
        <p style="font-size: 0.82rem; color: #64748b; line-height: 1.5; margin: 0 0 18px 0;">
          Access to Parivartan Snippet is restricted. Please sign in to your client account or Google account to use shortcuts and templates.
        </p>
        <div style="display: flex; gap: 8px; justify-content: center;">
          <button id="pvBtnOpenDashboardLogin" style="background: #4f46e5; color: #ffffff; border: none; border-radius: 6px; padding: 8px 16px; font-weight: 600; font-size: 0.82rem; cursor: pointer;">
            🔑 Sign In / Open Dashboard
          </button>
          <button id="pvBtnCloseAuthModal" style="background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; font-weight: 600; font-size: 0.82rem; cursor: pointer;">
            Close
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#pvBtnOpenDashboardLogin')?.addEventListener('click', () => {
      removeModal();
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      }
    });

    overlay.querySelector('#pvBtnCloseAuthModal')?.addEventListener('click', removeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) removeModal();
    });
  }

  let authToastDebounce = 0;
  function showAuthRequiredToast() {
    const now = Date.now();
    if (now - authToastDebounce < 3000) return;
    authToastDebounce = now;
    showInPageToast('🔒 Parivartan Snippet is locked. Please sign in to expand shortcuts.');
  }

  function showCommandPalette() {
    removeModal();

    if (!isClientLoggedIn) {
      showAuthRequiredModal();
      return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'pariwartan-overlay';
    overlay.id = 'pariwartan-active-modal';

    overlay.innerHTML = `
      <div class="pariwartan-dialog" style="max-width: 520px;">
        <input type="text" id="pvPaletteSearch" class="pariwartan-palette-search" placeholder="Type to search snippets (e.g. /greet, refund)..." autofocus>
        <ul class="pariwartan-palette-list" id="pvPaletteList"></ul>
        <div class="pariwartan-dialog-footer" style="justify-content: space-between; font-size: 0.78rem; color: #64748b;">
          <span>Press <strong>Enter</strong> to insert, <strong>Esc</strong> to close</span>
          <span style="color: #4f46e5; font-weight: 600;">⚡ Parivartan Snippet</span>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const searchInput = overlay.querySelector('#pvPaletteSearch');
    const listEl = overlay.querySelector('#pvPaletteList');

    let selectedIdx = 0;
    let filteredList = [...snippets];

    function renderList() {
      listEl.innerHTML = '';
      if (filteredList.length === 0) {
        listEl.innerHTML = `<li style="padding: 14px; text-align: center; color: #94a3b8; font-size: 0.88rem;">No matching snippets found</li>`;
        return;
      }

      filteredList.forEach((snip, idx) => {
        const li = document.createElement('li');
        li.className = `pariwartan-palette-item ${idx === selectedIdx ? 'active' : ''}`;
        li.innerHTML = `
          <div>
            <div class="pariwartan-item-title">${escapeText(snip.title)}</div>
            <div style="font-size: 0.75rem; color: #64748b; margin-top: 2px;">${escapeText((snip.content || '').slice(0, 60))}...</div>
          </div>
          <span class="pariwartan-item-shortcut">${escapeText(snip.shortcut)}</span>
        `;

        li.addEventListener('click', () => {
          applySnippetFromPalette(snip);
        });

        listEl.appendChild(li);
      });
    }

    function applySnippetFromPalette(snippet) {
      removeModal();
      const target = activeEditableElement || document.activeElement;

      const engine = window.ParivartanEngine || window.PariwartanEngine;
      const activeValues = buildActiveContextValues();
      const renderRes = engine
        ? engine.renderWithCursor(snippet.content, activeValues, settings)
        : { text: snippet.content, cursorOffset: -1 };
      insertTextIntoElement(target, renderRes.text, 0, renderRes.cursorOffset);
      recordSnippetUsage(snippet.id, renderRes.text.length);
    }

    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase().trim();
      filteredList = snippets.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.shortcut.toLowerCase().includes(q) ||
        s.content.toLowerCase().includes(q)
      );
      selectedIdx = 0;
      renderList();
    });

    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIdx = (selectedIdx + 1) % Math.max(1, filteredList.length);
        renderList();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIdx = (selectedIdx - 1 + filteredList.length) % Math.max(1, filteredList.length);
        renderList();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredList[selectedIdx]) {
          applySnippetFromPalette(filteredList[selectedIdx]);
        }
      } else if (e.key === 'Escape') {
        removeModal();
      }
    });

    renderList();
    setTimeout(() => searchInput.focus(), 50);
  }

  // --- Record Snippet Usage Helper ---
  function recordSnippetUsage(snippetId, length = 0) {
    if (isExtensionValid() && chrome.storage?.local) {
      try {
        chrome.storage.local.get(['snippets', 'settings'], (res) => {
          if (chrome.runtime?.lastError) return;
          const list = (res && res.snippets) || [];
          const item = list.find(s => s.id === snippetId);
          if (item) {
            item.usageCount = (item.usageCount || 0) + 1;
            item.lastUsed = Date.now();
          }
          const set = (res && res.settings) || {};
          set.totalKeystrokesSaved = (set.totalKeystrokesSaved || 0) + length;
          safeStorageSet({ snippets: list, settings: set });
        });
      } catch (e) {}
    }
  }

  // --- Editable Element Detectors & Helpers ---
  function isEditable(el) {
    if (!el) return false;
    if (el.isContentEditable || el.getAttribute('contenteditable') === 'true') return true;
    if (['TEXTAREA', 'INPUT'].includes(el.tagName)) {
      const type = (el.type || 'text').toLowerCase();
      return !['button', 'submit', 'reset', 'checkbox', 'radio', 'file', 'image', 'range', 'color'].includes(type);
    }
    return false;
  }

  function getActiveEditable() {
    // 1. Currently focused element if editable and not part of our floating UI
    const active = document.activeElement;
    if (active && !active.closest('#pariwartan-floating-menu') && !active.closest('#pariwartan-floating-widget') && isEditable(active)) {
      activeEditableElement = active;
      return active;
    }

    // 2. Previously tracked activeEditableElement if still in document
    if (activeEditableElement && document.contains(activeEditableElement) && isEditable(activeEditableElement)) {
      return activeEditableElement;
    }

    // 3. Any focused editable element in document
    const focused = document.querySelector('textarea:focus, input:focus, [contenteditable="true"]:focus');
    if (focused && !focused.closest('#pariwartan-floating-menu')) {
      activeEditableElement = focused;
      return focused;
    }

    // 4. Any visible textarea or contenteditable on page
    const all = Array.from(document.querySelectorAll('textarea, [contenteditable="true"], input[type="text"]'));
    const visible = all.find(item => {
      if (item.closest('#pariwartan-floating-menu') || item.closest('#pariwartan-floating-widget')) return false;
      const rect = item.getBoundingClientRect();
      return rect.width > 30 && rect.height > 15;
    });
    if (visible) {
      activeEditableElement = visible;
      return visible;
    }

    return null;
  }

  // --- Cursor & Focus Position Tracking ---
  function saveActiveCursorPosition() {
    const el = document.activeElement;
    if (!el) return;
    if (el.closest && (el.closest('#pariwartan-floating-menu') || el.closest('#pariwartan-floating-widget'))) {
      return;
    }
    if (isEditable(el)) {
      activeEditableElement = el;
      if (el.isContentEditable || el.getAttribute('contenteditable') === 'true') {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          try {
            savedSelectionRange = sel.getRangeAt(0).cloneRange();
          } catch (err) {}
        }
      } else if (typeof el.selectionStart === 'number') {
        savedSelectionStart = el.selectionStart;
        savedSelectionEnd = el.selectionEnd;
      }
    }
  }

  // --- Folder Helpers ---
  function getFolderName(folderId) {
    if (!folderId) return 'General';
    const f = folders.find(item => item.id === folderId);
    return f ? f.name : 'General';
  }

  function getFolderIcon(name) {
    const lower = (name || '').toLowerCase();
    if (lower.includes('support')) return '🎧';
    if (lower.includes('network')) return '⚡';
    if (lower.includes('abuse')) return '🛡️';
    if (lower.includes('general')) return '🖥️';
    if (lower.includes('common')) return '⭐';
    return '📁';
  }

  // --- Floating Quick Launcher Widget (Movable 32px with Pointer Events) ---
  function setupFloatingWidget() {
    let widget = document.getElementById('pariwartan-floating-widget');
    if (!isFloatingWidgetEnabled()) {
      if (widget) widget.remove();
      closeFloatingMenu();
      return;
    }

    if (!widget) {
      widget = document.createElement('div');
      widget.id = 'pariwartan-floating-widget';
      widget.title = 'Parivartan Snippets (Drag to move, click to browse)';
      widget.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
      `;
      (document.body || document.documentElement).appendChild(widget);

      // Restore saved position if valid
      try {
        const savedPos = JSON.parse(localStorage.getItem('parivartan_floating_pos') || localStorage.getItem('pariwartan_floating_pos'));
        if (savedPos && typeof savedPos.left === 'number' && typeof savedPos.top === 'number') {
          const w = 32, h = 32;
          const left = Math.max(6, Math.min(window.innerWidth - w - 6, savedPos.left));
          const top = Math.max(6, Math.min(window.innerHeight - h - 6, savedPos.top));
          widget.style.left = `${left}px`;
          widget.style.top = `${top}px`;
          widget.style.right = 'auto';
          widget.style.bottom = 'auto';
        }
      } catch (e) {}

      // Pointer drag implementation - works reliably with mouse, touch, and trackpad!
      let isDragging = false;
      let startX = 0, startY = 0;
      let startLeft = 0, startTop = 0;
      let hasMoved = false;

      widget.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 && e.pointerType === 'mouse') return;

        // Capture any selected text before focus shifts
        const currentSel = window.getSelection();
        if (currentSel && !currentSel.isCollapsed) {
          const s = currentSel.toString().trim();
          if (s.length >= 6) {
            lastSelectedPageText = s;
          }
        }

        saveActiveCursorPosition();

        isDragging = true;
        hasMoved = false;
        startX = e.clientX;
        startY = e.clientY;

        const rect = widget.getBoundingClientRect();
        startLeft = rect.left;
        startTop = rect.top;

        try {
          widget.setPointerCapture(e.pointerId);
        } catch (err) {}

        widget.classList.add('pariwartan-dragging');
      });

      widget.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          hasMoved = true;
        }

        if (!hasMoved) return;

        const w = widget.offsetWidth || 32;
        const h = widget.offsetHeight || 32;
        let newLeft = startLeft + dx;
        let newTop = startTop + dy;

        newLeft = Math.max(6, Math.min(window.innerWidth - w - 6, newLeft));
        newTop = Math.max(6, Math.min(window.innerHeight - h - 6, newTop));

        widget.style.left = `${newLeft}px`;
        widget.style.top = `${newTop}px`;
        widget.style.right = 'auto';
        widget.style.bottom = 'auto';

        if (isFloatingMenuOpen) {
          updateMenuPosition();
        }
      });

      widget.addEventListener('pointerup', (e) => {
        if (!isDragging) return;
        isDragging = false;
        try {
          widget.releasePointerCapture(e.pointerId);
        } catch (err) {}
        widget.classList.remove('pariwartan-dragging');

        if (hasMoved) {
          const rect = widget.getBoundingClientRect();
          try {
            localStorage.setItem('parivartan_floating_pos', JSON.stringify({
              left: Math.round(rect.left),
              top: Math.round(rect.top)
            }));
          } catch (err) {}
        } else {
          toggleFloatingMenu();
        }
      });

      widget.addEventListener('pointercancel', (e) => {
        isDragging = false;
        try {
          widget.releasePointerCapture(e.pointerId);
        } catch (err) {}
        widget.classList.remove('pariwartan-dragging');
      });

      // Keep inside bounds on resize
      window.addEventListener('resize', () => {
        const rect = widget.getBoundingClientRect();
        const w = widget.offsetWidth || 32;
        const h = widget.offsetHeight || 32;
        const safeLeft = Math.max(6, Math.min(window.innerWidth - w - 6, rect.left));
        const safeTop = Math.max(6, Math.min(window.innerHeight - h - 6, rect.top));
        if (safeLeft !== rect.left || safeTop !== rect.top) {
          widget.style.left = `${safeLeft}px`;
          widget.style.top = `${safeTop}px`;
        }
        if (isFloatingMenuOpen) updateMenuPosition();
      });
    }
  }

  // --- Floating Snippets Menu Drawer ---
  function toggleFloatingMenu() {
    if (isFloatingMenuOpen) {
      closeFloatingMenu();
    } else {
      openFloatingMenu(isAiAssistantEnabled() ? activeMenuTab : 'snippets');
    }
  }

  function closeFloatingMenu() {
    isFloatingMenuOpen = false;
    const menu = document.getElementById('pariwartan-floating-menu');
    if (menu) menu.remove();
    const widget = document.getElementById('pariwartan-floating-widget');
    if (widget) widget.classList.remove('pariwartan-active');
  }

  // --- Floating Menu Dimensions & Position Persistence ---
  function loadSavedMenuBounds() {
    try {
      const raw = localStorage.getItem('parivartan_menu_bounds') || localStorage.getItem('pariwartan_menu_bounds');
      if (raw) {
        const bounds = JSON.parse(raw);
        if (bounds && typeof bounds.width === 'number' && typeof bounds.height === 'number') {
          savedMenuWidth = bounds.width;
          savedMenuHeight = bounds.height;
          hasCustomMenuSize = true;
        }
        if (bounds && typeof bounds.left === 'number' && typeof bounds.top === 'number') {
          savedMenuLeft = bounds.left;
          savedMenuTop = bounds.top;
          hasCustomMenuPos = true;
        }
      }
    } catch (e) {}

    if (isExtensionValid() && chrome.storage?.local) {
      try {
        chrome.storage.local.get(['menuBounds'], (res) => {
          if (chrome.runtime?.lastError) return;
          if (res && res.menuBounds) {
            const b = res.menuBounds;
            if (typeof b.width === 'number' && typeof b.height === 'number') {
              savedMenuWidth = b.width;
              savedMenuHeight = b.height;
              hasCustomMenuSize = true;
            }
            if (typeof b.left === 'number' && typeof b.top === 'number') {
              savedMenuLeft = b.left;
              savedMenuTop = b.top;
              hasCustomMenuPos = true;
            }
          }
        });
      } catch (e) {}
    }
  }

  function saveMenuBounds(width, height, left, top) {
    const data = {
      width: Math.round(width),
      height: Math.round(height),
      left: Math.round(left),
      top: Math.round(top)
    };
    savedMenuWidth = data.width;
    savedMenuHeight = data.height;
    savedMenuLeft = data.left;
    savedMenuTop = data.top;
    hasCustomMenuSize = true;
    hasCustomMenuPos = true;

    safeStorageSet({ menuBounds: data });
  }

  function getEffectiveMenuDimensions() {
    const minW = 320;
    const maxW = Math.max(minW, window.innerWidth - 16);
    const minH = 380;
    const maxH = Math.max(minH, window.innerHeight - 16);

    let width, height;
    if (hasCustomMenuSize && savedMenuWidth && savedMenuHeight) {
      width = Math.max(minW, Math.min(maxW, savedMenuWidth));
      height = Math.max(minH, Math.min(maxH, savedMenuHeight));
    } else {
      width = isMenuExpanded ? 580 : 440;
      width = Math.min(width, maxW);
      height = Math.min(580, maxH);
    }
    return { width, height };
  }

  function updateMenuPosition() {
    const menu = document.getElementById('pariwartan-floating-menu');
    const widget = document.getElementById('pariwartan-floating-widget');
    if (!menu) return;

    const { width, height } = getEffectiveMenuDimensions();
    menu.style.width = `${width}px`;
    menu.style.height = `${height}px`;

    let left, top;

    if (hasCustomMenuPos && typeof savedMenuLeft === 'number' && typeof savedMenuTop === 'number') {
      left = Math.max(8, Math.min(window.innerWidth - width - 8, savedMenuLeft));
      top = Math.max(8, Math.min(window.innerHeight - height - 8, savedMenuTop));
    } else if (widget) {
      const widgetRect = widget.getBoundingClientRect();
      if (widgetRect.left > width + 16) {
        left = widgetRect.left - width - 8;
      } else {
        left = widgetRect.right + 8;
      }
      top = widgetRect.top - 40;
      top = Math.max(8, Math.min(window.innerHeight - height - 8, top));
      left = Math.max(8, Math.min(window.innerWidth - width - 8, left));
    } else {
      left = Math.max(8, (window.innerWidth - width) / 2);
      top = Math.max(8, (window.innerHeight - height) / 2);
    }

    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
  }

  function setupMenuResizers(menu) {
    const directions = ['nw', 'ne', 'sw', 'se', 'l', 'r', 't', 'b'];
    directions.forEach(dir => {
      const handle = document.createElement('div');
      handle.className = `pariwartan-resizer pariwartan-resizer-${dir}`;
      handle.setAttribute('data-direction', dir);
      menu.appendChild(handle);

      let isDragging = false;
      let startX = 0, startY = 0;
      let startRect = null;

      handle.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        e.preventDefault();
        e.stopPropagation();

        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startRect = menu.getBoundingClientRect();

        menu.classList.add('pariwartan-resizing');

        try {
          handle.setPointerCapture(e.pointerId);
        } catch (err) {}
      });

      handle.addEventListener('pointermove', (e) => {
        if (!isDragging || !startRect) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        const minW = 320;
        const maxW = Math.max(minW, window.innerWidth - 16);
        const minH = 380;
        const maxH = Math.max(minH, window.innerHeight - 16);

        let newWidth = startRect.width;
        let newHeight = startRect.height;
        let newLeft = startRect.left;
        let newTop = startRect.top;

        // Horizontal resizing
        if (dir === 'r' || dir === 'ne' || dir === 'se') {
          newWidth = Math.max(minW, Math.min(maxW, startRect.width + dx));
          if (newLeft + newWidth > window.innerWidth - 8) {
            newWidth = window.innerWidth - 8 - newLeft;
          }
        } else if (dir === 'l' || dir === 'nw' || dir === 'sw') {
          newWidth = Math.max(minW, Math.min(maxW, startRect.width - dx));
          let proposedLeft = startRect.right - newWidth;
          if (proposedLeft < 8) {
            proposedLeft = 8;
            newWidth = startRect.right - proposedLeft;
          }
          newLeft = proposedLeft;
        }

        // Vertical resizing
        if (dir === 'b' || dir === 'se' || dir === 'sw') {
          newHeight = Math.max(minH, Math.min(maxH, startRect.height + dy));
          if (newTop + newHeight > window.innerHeight - 8) {
            newHeight = window.innerHeight - 8 - newTop;
          }
        } else if (dir === 't' || dir === 'nw' || dir === 'ne') {
          newHeight = Math.max(minH, Math.min(maxH, startRect.height - dy));
          let proposedTop = startRect.bottom - newHeight;
          if (proposedTop < 8) {
            proposedTop = 8;
            newHeight = startRect.bottom - proposedTop;
          }
          newTop = proposedTop;
        }

        menu.style.width = `${newWidth}px`;
        menu.style.height = `${newHeight}px`;
        menu.style.left = `${newLeft}px`;
        menu.style.top = `${newTop}px`;
      });

      const stopDrag = (e) => {
        if (!isDragging) return;
        isDragging = false;
        menu.classList.remove('pariwartan-resizing');

        try {
          handle.releasePointerCapture(e.pointerId);
        } catch (err) {}

        const rect = menu.getBoundingClientRect();
        saveMenuBounds(rect.width, rect.height, rect.left, rect.top);
      };

      handle.addEventListener('pointerup', stopDrag);
      handle.addEventListener('pointercancel', stopDrag);
    });
  }

  function setupHeaderDrag(header, menu) {
    if (!header || !menu) return;

    let isDragging = false;
    let startX = 0, startY = 0;
    let startLeft = 0, startTop = 0;
    let hasMoved = false;

    header.addEventListener('pointerdown', (e) => {
      if (e.target && (e.target.closest('button') || e.target.closest('input') || e.target.closest('a'))) {
        return;
      }
      if (e.button !== 0 && e.pointerType === 'mouse') return;

      isDragging = true;
      hasMoved = false;
      startX = e.clientX;
      startY = e.clientY;

      const rect = menu.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;

      menu.classList.add('pariwartan-resizing');

      try {
        header.setPointerCapture(e.pointerId);
      } catch (err) {}
    });

    header.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        hasMoved = true;
      }

      if (!hasMoved) return;

      const w = menu.offsetWidth;
      const h = menu.offsetHeight;
      let newLeft = startLeft + dx;
      let newTop = startTop + dy;

      newLeft = Math.max(8, Math.min(window.innerWidth - w - 8, newLeft));
      newTop = Math.max(8, Math.min(window.innerHeight - h - 8, newTop));

      menu.style.left = `${newLeft}px`;
      menu.style.top = `${newTop}px`;
    });

    const stopDrag = (e) => {
      if (!isDragging) return;
      isDragging = false;
      menu.classList.remove('pariwartan-resizing');

      try {
        header.releasePointerCapture(e.pointerId);
      } catch (err) {}

      if (hasMoved) {
        const rect = menu.getBoundingClientRect();
        saveMenuBounds(rect.width, rect.height, rect.left, rect.top);
      }
    };

    header.addEventListener('pointerup', stopDrag);
    header.addEventListener('pointercancel', stopDrag);
  }

  // --- Intelligent Page Context Extractor ---
  function extractPageContext() {
    // 1. Current selected/highlighted text if present
    if (lastSelectedPageText && lastSelectedPageText.trim().length >= 10) {
      return lastSelectedPageText.trim().slice(0, 5000);
    }
    const currentSel = window.getSelection();
    if (currentSel && !currentSel.isCollapsed) {
      const s = currentSel.toString().trim();
      if (s.length >= 10) {
        lastSelectedPageText = s;
        return s.slice(0, 5000);
      }
    }

    // 2. High-priority conversation, ticket, and thread containers across popular web apps
    const conversationSelectors = [
      // Zendesk, Freshdesk, Help Scout, Kayako, Intercom, Crisp
      '[data-test-id="ticket-pane-conversation-thread"]',
      '.ticket-conversation',
      '.conversation__content',
      '.ember-view.comment',
      '.ticket-comment',
      '.comment__body',
      '.ticket-message',
      '.client-message',
      '.staff-message',
      '.ticket-details',
      '.message-body',
      '.ticket-thread',
      '.intercom-conversation-body',
      '.conversation-comment',
      // Gmail, Outlook, Webmail
      '.a3s.aiL',
      '.ii.gt',
      '[aria-label="Message Body"]',
      '[data-message-id]',
      '.rps_',
      'div[role="document"]',
      // Jira, GitHub, GitLab, Linear, Bug trackers
      '[data-testid="issue.activity.feed"]',
      '.timeline-comment-group .comment-body',
      '.timeline-comment .comment-body',
      '.user-content-block',
      '#description-val',
      // Discussion & Community forums
      '.post-text',
      '.s-prose',
      '[data-test-id="post-content"]',
      '.cooked',
      '.topic-body',
      // Standard article and content areas
      'article',
      'main',
      '[role="main"]',
      '.entry-content',
      '.post-content',
      '.markdown-body',
      '#content',
      '.content'
    ];

    let foundBlocks = [];

    for (const selector of conversationSelectors) {
      const nodes = document.querySelectorAll(selector);
      if (nodes && nodes.length > 0) {
        nodes.forEach(node => {
          if (node.closest('#pariwartan-floating-menu') || node.closest('#pariwartan-floating-widget') || node.closest('#pariwartan-selection-pill')) return;
          const text = (node.innerText || '').trim();
          if (text.length >= 20 && !foundBlocks.some(b => b.includes(text) || text.includes(b))) {
            foundBlocks.push(text);
          }
        });
        if (foundBlocks.length > 0) break;
      }
    }

    // 3. Fallback: Clean readable text from live visible content elements
    if (foundBlocks.length === 0) {
      const candidates = document.querySelectorAll('h1, h2, h3, h4, p, li, blockquote, pre, td');
      const seenTexts = new Set();
      candidates.forEach(el => {
        if (el.closest('#pariwartan-floating-menu') || el.closest('#pariwartan-floating-widget') || el.closest('#pariwartan-selection-pill') || el.closest('#pariwartan-floating-toast')) return;
        if (el.closest('nav, footer, header, aside, [aria-hidden="true"]')) return;
        if (el.offsetParent === null && el.tagName !== 'BODY') return;

        const t = (el.innerText || '').replace(/\s+/g, ' ').trim();
        if (t.length >= 25 && !seenTexts.has(t)) {
          seenTexts.add(t);
          foundBlocks.push(t);
        }
      });
    }

    const title = document.title ? `Page Title: ${document.title}\n` : '';
    const url = window.location.href ? `URL: ${window.location.href}\n\n` : '\n';

    if (foundBlocks.length > 0) {
      const combined = foundBlocks.join('\n\n');
      return (title + url + combined).slice(0, 5000).trim();
    }

    // 4. Ultimate fallback: document.body clean text
    if (document.body) {
      const raw = (document.body.innerText || '').replace(/\s+/g, ' ').trim();
      if (raw.length > 30) {
        return (title + url + raw).slice(0, 4000).trim();
      }
    }

    return title.trim();
  }

  function extractTicketId() {
    try {
      const urlMatch = window.location.href.match(/ticket[=_](\d+)/i) || window.location.href.match(/[?&]id=(\d+)/i);
      if (urlMatch) return '#' + urlMatch[1];

      const titleMatch = document.title.match(/#?(\d{5,})/);
      if (titleMatch) return '#' + titleMatch[1];

      const el = document.querySelector('.ticket-id, #ticket_id, .ticket-header .id, [data-ticket-id], .ticket-number');
      if (el) {
        const t = (el.innerText || el.dataset.ticketId || '').trim();
        if (t) return t.startsWith('#') ? t : '#' + t;
      }
    } catch (e) {}
    return '#Ticket';
  }

  function extractCustomerMessage() {
    try {
      const clientMsg = document.querySelector('.client-message, .customer-message, .ticket-message-client, .user-comment, .timeline-comment:not(.current-user), .comment__body');
      if (clientMsg) {
        const text = (clientMsg.innerText || '').trim();
        if (text.length > 10) return text.slice(0, 3000);
      }
      const ctx = extractPageContext();
      return ctx ? ctx.slice(0, 1500) : '';
    } catch (e) {
      return '';
    }
  }

  function getAllAiPersonas() {
    const defaults = typeof DEFAULT_AI_PERSONAS !== 'undefined' ? DEFAULT_AI_PERSONAS : [];
    return [...defaults, ...(Array.isArray(customAiPersonas) ? customAiPersonas : [])];
  }

  // --- Temporary Chat Controller Helpers ---
  function resetTemporaryChat() {
    aiChatMessages = [];
    temporaryChatTurn = 0;
    lastAiResult = '';
    currentCustomPromptText = '';
  }

  function submitTemporaryChat(text) {
    if (!text || !text.trim()) return;
    const cleanText = text.trim();
    const isFirstIteration = (temporaryChatTurn === 0);

    // Requirement 2: use page_context ONLY in the first chat iteration in temporary chat
    let ctxToSend = '';
    if (isFirstIteration) {
      ctxToSend = currentAiContext || extractPageContext();
      currentAiContext = ctxToSend;
    } else {
      ctxToSend = ''; // Follow-up turns do not re-send page_context
    }
    temporaryChatTurn++;

    // Requirement 3: Do not use default template when just chatting. Pass action = 'chat'
    performAiGeneration('chat', cleanText, ctxToSend, cleanText);
  }

  // --- Universal AI Generation Relay ---
  function performAiGeneration(action = 'custom', customPrompt = '', customContext = null, promptLabel = '') {
    if (isAiGenerating) return;

    const aiConfig = settings.ai || {
      enabled: true,
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      apiKey: '',
      customEndpoint: 'http://localhost:11434',
      persona: 'support'
    };

    const ctx = (customContext !== null && customContext !== undefined)
      ? customContext
      : (currentAiContext || extractPageContext());
    if (customContext === null) {
      currentAiContext = ctx;
    }

    const provider = aiConfig.provider || 'gemini';
    const apiKey = (aiConfig.apiKey || '').trim();

    const allPers = getAllAiPersonas();
    const activePers = allPers.find(p => p.id === (aiConfig.persona || 'support')) || allPers[0];
    const personaId = activePers ? activePers.id : (aiConfig.persona || 'support');
    const personaPrompt = activePers ? (activePers.systemPrompt || '') : '';
    const personaName = activePers ? activePers.name : personaId;

    // Auto-expand panel into spacious interactive mode
    const menu = document.getElementById('pariwartan-floating-menu');
    if (menu && !menu.classList.contains('pariwartan-expanded')) {
      menu.classList.add('pariwartan-expanded');
      const expandBtn = menu.querySelector('#pariwartanMenuExpand');
      if (expandBtn) {
        expandBtn.textContent = '❐';
        expandBtn.title = 'Compact (440px)';
      }
      isMenuExpanded = true;
      savedMenuWidth = 620;
      savedMenuHeight = 640;
      updateMenuPosition();
    }

    const userDisplayText = promptLabel || customPrompt || 'Reply to Ticket';

    // Collect previous completed messages for multi-turn history
    const history = aiChatMessages
      .filter(m => !m.isGenerating && m.text && m.text.trim())
      .map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        text: m.text
      }));

    // Push user message into chat stream
    aiChatMessages.push({
      role: 'user',
      text: userDisplayText,
      action: action,
      timestamp: Date.now()
    });

    // Push thinking assistant message
    aiChatMessages.push({
      role: 'assistant',
      text: '',
      isGenerating: true,
      action: action,
      timestamp: Date.now()
    });

    isAiGenerating = true;
    lastAiResult = `⏳ Thinking & drafting with ${provider} (${personaName})...`;
    currentCustomPromptText = '';
    renderAiPanel();

    setTimeout(() => {
      const stream = document.getElementById('pvChatStream');
      if (stream) stream.scrollTop = stream.scrollHeight;
    }, 40);

    const payload = {
      action,
      prompt: customPrompt || userDisplayText,
      context: ctx,
      provider: provider,
      apiKey: apiKey,
      model: aiConfig.model || '',
      customEndpoint: aiConfig.customEndpoint || '',
      persona: personaId,
      personaPrompt: personaPrompt,
      history: history
    };

    safeSendMessage({ action: 'ACTION_AI_GENERATE', payload }, (response) => {
      isAiGenerating = false;
      const lastMsg = aiChatMessages[aiChatMessages.length - 1];
      if (lastMsg && lastMsg.role === 'assistant') {
        lastMsg.isGenerating = false;
        if (response && response.success) {
          lastMsg.text = response.text || '';
          if (action !== 'chat') {
            saveRecentChat(userDisplayText, response.text || '');
          }
        } else {
          lastMsg.text = `Error: ${response?.error || 'Failed to generate response. Check your API key and connection.'}`;
        }
      }
      lastAiResult = (lastMsg && lastMsg.text) || '';
      renderAiPanel();

      setTimeout(() => {
        const stream = document.getElementById('pvChatStream');
        if (stream) stream.scrollTop = stream.scrollHeight;
      }, 50);
    });
  }

  // --- Theme Controller for In-Page UI ---
  function isDarkModeActive() {
    const t = (settings && settings.theme) || 'day';
    if (t === 'night' || t === 'dark') return true;
    if (t === 'system') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  }

  const PV_SVG_MOON = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
  const PV_SVG_SUN = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
  const PV_SVG_REFRESH = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:3px;"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`;

  function applyThemeToInPageUI() {
    const menu = document.getElementById('pariwartan-floating-menu');
    const isDark = isDarkModeActive();
    if (menu) {
      menu.classList.toggle('pariwartan-theme-dark', isDark);
      const themeBtn = menu.querySelector('#pvHeaderThemeBtn');
      if (themeBtn) {
        themeBtn.innerHTML = isDark ? PV_SVG_SUN : PV_SVG_MOON;
        themeBtn.title = isDark ? 'Current: Dark Mode (Click for Light Mode)' : 'Current: Light Mode (Click for Dark Mode)';
      }
    }
  }

  // --- Font & Text Scaling Controller for In-Page UI ---
  const FONT_SCALES = [1.0, 1.15, 1.30, 1.45];

  function getTextScale() {
    const s = parseFloat(settings && settings.fontScale);
    return !isNaN(s) && s >= 1.0 ? s : 1.0;
  }

  function applyTextScaleToInPageUI() {
    const menu = document.getElementById('pariwartan-floating-menu');
    const scale = getTextScale();
    if (menu) {
      menu.style.setProperty('--pv-font-scale', scale);
    }
  }

  function changeTextScale(delta) {
    const current = getTextScale();
    let idx = FONT_SCALES.findIndex(s => Math.abs(s - current) < 0.05);
    if (idx === -1) idx = 0;
    let nextIdx = idx + delta;
    if (nextIdx < 0) nextIdx = 0;
    if (nextIdx >= FONT_SCALES.length) nextIdx = FONT_SCALES.length - 1;
    const nextScale = FONT_SCALES[nextIdx];
    settings.fontScale = nextScale;
    safeStorageSet({ settings });
    applyTextScaleToInPageUI();
    const pct = Math.round(nextScale * 100);
    showInPageToast(`🔤 Text size: ${pct}%`);
  }

  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (settings && settings.theme === 'system') {
        applyThemeToInPageUI();
      }
    });
  }

  // --- Floating Snippets & AI Menu Drawer ---
  function openFloatingMenu(initialTab = null, initialAiOptions = null) {
    closeFloatingMenu();
    isFloatingMenuOpen = true;

    const aiEnabled = isAiAssistantEnabled();
    if (!aiEnabled) {
      activeMenuTab = 'snippets';
    } else if (initialTab) {
      activeMenuTab = initialTab;
    }

    if (aiEnabled) {
      if (initialAiOptions && initialAiOptions.context) {
        currentAiContext = initialAiOptions.context;
      } else {
        currentAiContext = extractPageContext();
      }
    }

    const widget = document.getElementById('pariwartan-floating-widget');
    if (widget) widget.classList.add('pariwartan-active');

    const isExpandedNow = (savedMenuWidth && savedMenuWidth >= 550) || isMenuExpanded;
    const isDarkNow = isDarkModeActive();
    const currentScale = getTextScale();

    const menu = document.createElement('div');
    menu.id = 'pariwartan-floating-menu';
    menu.style.setProperty('--pv-font-scale', currentScale);
    if (isExpandedNow) {
      menu.classList.add('pariwartan-expanded');
    }
    if (isDarkNow) {
      menu.classList.add('pariwartan-theme-dark');
    }

    // Prevent mousedown from stealing focus from activeEditableElement
    // EXCEPT inside inputs, textareas, selects, contenteditables, and resizer handles
    menu.addEventListener('mousedown', (e) => {
      if (e.target && e.target.closest && e.target.closest('.pariwartan-resizer')) {
        return;
      }
      const tag = (e.target && e.target.tagName) ? e.target.tagName : '';
      if (['INPUT', 'TEXTAREA', 'SELECT', 'OPTION'].includes(tag) || (e.target && (e.target.isContentEditable || e.target.getAttribute('contenteditable') === 'true'))) {
        return;
      }
      if (e.target && (e.target.closest('button') || e.target.closest('.pariwartan-snippet-item') || e.target.closest('.pariwartan-folder-chip') || e.target.closest('.pariwartan-ai-action-btn') || e.target.closest('.pariwartan-ai-cat-btn') || e.target.closest('.pariwartan-ai-refine-pill'))) {
        e.preventDefault();
      }
    });

    menu.innerHTML = `
      <div class="pariwartan-menu-header">
        <div class="pariwartan-menu-title">
          <div style="width:26px; height:26px; border-radius:50% 50% 12% 50%; background:linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #a855f7 100%); display:flex; align-items:center; justify-content:center; box-shadow:0 2px 8px rgba(124,58,237,0.35); flex-shrink:0;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
          </div>
          <span>Parivartan</span>
        </div>
        <div class="pariwartan-menu-actions">
          <button class="pariwartan-menu-btn" id="pvHeaderFontDecBtn" title="Decrease Text Size (A-)" style="background:none; border:none; cursor:pointer; font-size:0.75rem; font-weight:700; color:#64748b; padding:2px 4px; border-radius:4px; line-height:1;">A-</button>
          <button class="pariwartan-menu-btn" id="pvHeaderFontIncBtn" title="Increase Text Size (A+)" style="background:none; border:none; cursor:pointer; font-size:0.85rem; font-weight:700; color:#64748b; padding:2px 4px; border-radius:4px; line-height:1;">A+</button>
          <button class="pariwartan-menu-btn" id="pvHeaderThemeBtn" title="${isDarkNow ? 'Current: Dark Mode (Click for Light Mode)' : 'Current: Light Mode (Click for Dark Mode)'}" style="background:none; border:none; cursor:pointer; padding:2px 5px; border-radius:4px; display:inline-flex; align-items:center; justify-content:center; color:inherit;">${isDarkNow ? PV_SVG_SUN : PV_SVG_MOON}</button>
          <button class="pariwartan-menu-btn" id="pvHeaderSettingsBtn" title="Settings" style="background:none; border:none; cursor:pointer; font-size:1rem; color:#64748b; padding:2px 5px; border-radius:4px;">⚙</button>
          <button class="pariwartan-menu-expand" id="pariwartanMenuExpand" title="${isExpandedNow ? 'Compact (440px)' : 'Expand (580px)'}">${isExpandedNow ? '❐' : '⛶'}</button>
          <button class="pariwartan-menu-close" id="pariwartanMenuClose" title="Close (Esc)">&times;</button>
        </div>
      </div>

      ${aiEnabled ? `
      <div class="pariwartan-tab-nav">
        <button type="button" class="pariwartan-tab-btn ${activeMenuTab === 'snippets' ? 'active' : ''}" id="pariwartanTabSnippets">
          <span>⚡ Snippets</span>
          <span class="pariwartan-menu-count" id="pariwartanMenuCount">${snippets.length}</span>
        </button>
        <button type="button" class="pariwartan-tab-btn ${activeMenuTab === 'ai' ? 'active' : ''}" id="pariwartanTabAi">
          <span>✨ AI Assistant</span>
        </button>
      </div>
      ` : ''}

      <div id="pariwartanSnippetsTabContent" style="${activeMenuTab === 'snippets' ? 'display:flex !important; flex-direction:column !important; flex:1 !important; min-height:0 !important; overflow:hidden !important; width:100% !important;' : 'display:none !important;'}">
        <div class="pariwartan-menu-search-wrapper">
          <svg class="pariwartan-menu-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" class="pariwartan-menu-search" id="pariwartanMenuSearch" placeholder="Search snippets or shortcuts (/ack, /bgp)..." value="${escapeAttr(menuSearchQuery)}">
          <button type="button" class="pariwartan-menu-search-mic ${isDictatingSearch ? 'dictating' : ''}" id="pariwartanSearchMic" title="Voice Search Snippets">🎙️</button>
          <button class="pariwartan-menu-search-clear" id="pariwartanSearchClear" style="${menuSearchQuery ? 'display:block' : 'display:none'}">&times;</button>
        </div>

        <div class="pariwartan-folder-chips-wrapper">
          <button type="button" class="pariwartan-folder-scroll-btn left" id="pvFolderScrollLeft" title="Scroll folders left">‹</button>
          <div class="pariwartan-folder-chips" id="pariwartanFolderChips"></div>
          <button type="button" class="pariwartan-folder-scroll-btn right" id="pvFolderScrollRight" title="Scroll folders right">›</button>
        </div>

        <div class="pariwartan-menu-list" id="pariwartanMenuList"></div>

        <div class="pariwartan-menu-footer">
          <span>💡 Click any snippet to paste at cursor</span>
          <span style="font-size: 0.68rem; opacity: 0.8;">Alt+Shift+P</span>
        </div>
      </div>

      ${aiEnabled ? `
      <div id="pariwartanAiTabContent" style="${activeMenuTab === 'ai' ? 'display:flex !important; flex-direction:column !important; flex:1 !important; min-height:0 !important; overflow:hidden !important; width:100% !important;' : 'display:none !important;'}">
        <div class="pariwartan-ai-panel" id="pariwartanAiPanel"></div>
      </div>
      ` : ''}
    `;

    document.body.appendChild(menu);
    setupMenuResizers(menu);
    const menuHeader = menu.querySelector('.pariwartan-menu-header');
    setupHeaderDrag(menuHeader, menu);
    setupFolderScroller(menu);
    updateMenuPosition();

    // Wire Text Scaling A- / A+ Buttons
    const fontDecBtn = menu.querySelector('#pvHeaderFontDecBtn');
    if (fontDecBtn) {
      fontDecBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        changeTextScale(-1);
      });
    }
    const fontIncBtn = menu.querySelector('#pvHeaderFontIncBtn');
    if (fontIncBtn) {
      fontIncBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        changeTextScale(1);
      });
    }

    // Wire Header Theme Toggle Button
    const headerThemeBtn = menu.querySelector('#pvHeaderThemeBtn');
    if (headerThemeBtn) {
      headerThemeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const currentlyDark = isDarkModeActive();
        const nextTheme = currentlyDark ? 'day' : 'night';
        settings.theme = nextTheme;
        safeStorageSet({ settings });
        applyThemeToInPageUI();
        showInPageToast(nextTheme === 'night' ? 'Dark Mode enabled' : 'Light Mode enabled');
      });
    }

    // Wire Header Settings Gear Button
    const headerSettingsBtn = menu.querySelector('#pvHeaderSettingsBtn');
    if (headerSettingsBtn) {
      headerSettingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        safeSendMessage({ action: 'OPEN_DASHBOARD' });
      });
    }

    // Wire Expand/Compact button
    const expandBtn = menu.querySelector('#pariwartanMenuExpand');
    if (expandBtn) {
      expandBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const currentlyExpanded = (savedMenuWidth && savedMenuWidth >= 550) || isMenuExpanded;
        isMenuExpanded = !currentlyExpanded;
        const targetW = isMenuExpanded ? 620 : 440;
        const targetH = isMenuExpanded ? 640 : 580;
        savedMenuWidth = targetW;
        savedMenuHeight = targetH;
        hasCustomMenuSize = true;
        if (isMenuExpanded) {
          menu.classList.add('pariwartan-expanded');
          expandBtn.textContent = '❐';
          expandBtn.title = 'Compact (440px)';
        } else {
          menu.classList.remove('pariwartan-expanded');
          expandBtn.textContent = '⛶';
          expandBtn.title = 'Expand (620px)';
        }
        updateMenuPosition();
        const rect = menu.getBoundingClientRect();
        saveMenuBounds(rect.width, rect.height, rect.left, rect.top);
      });
    }

    // Wire close button
    menu.querySelector('#pariwartanMenuClose').addEventListener('click', () => {
      closeFloatingMenu();
    });

    // Wire Tab Switchers if AI is enabled
    const tabSnippets = menu.querySelector('#pariwartanTabSnippets');
    const tabAi = menu.querySelector('#pariwartanTabAi');
    const viewSnippets = menu.querySelector('#pariwartanSnippetsTabContent');
    const viewAi = menu.querySelector('#pariwartanAiTabContent');

    if (tabSnippets && tabAi && viewAi) {
      tabSnippets.addEventListener('click', () => {
        activeMenuTab = 'snippets';
        tabSnippets.classList.add('active');
        tabAi.classList.remove('active');
        viewSnippets.style.setProperty('display', 'flex', 'important');
        viewSnippets.style.setProperty('flex-direction', 'column', 'important');
        viewAi.style.setProperty('display', 'none', 'important');
        renderFolderChips();
        renderFloatingMenuList();
      });

      tabAi.addEventListener('click', () => {
        activeMenuTab = 'ai';
        tabAi.classList.add('active');
        tabSnippets.classList.remove('active');
        viewSnippets.style.setProperty('display', 'none', 'important');
        viewAi.style.setProperty('display', 'flex', 'important');
        viewAi.style.setProperty('flex-direction', 'column', 'important');
        currentAiContext = extractPageContext();
        renderAiPanel();
      });
    }

    // Wire search input in Snippets tab
    const searchInput = menu.querySelector('#pariwartanMenuSearch');
    const clearBtn = menu.querySelector('#pariwartanSearchClear');

    searchInput.addEventListener('input', () => {
      menuSearchQuery = searchInput.value;
      clearBtn.style.display = menuSearchQuery ? 'block' : 'none';
      renderFloatingMenuList();
    });

    clearBtn.addEventListener('click', () => {
      menuSearchQuery = '';
      searchInput.value = '';
      clearBtn.style.display = 'none';
      searchInput.focus();
      renderFloatingMenuList();
    });

    const searchMicBtn = menu.querySelector('#pariwartanSearchMic');
    if (searchMicBtn) {
      searchMicBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!window.SpeechService || !window.SpeechService.isSupported()) {
          showInPageToast('Speech recognition not supported in this browser.');
          return;
        }

        if (isDictatingSearch) {
          window.SpeechService.stop();
          isDictatingSearch = false;
          searchMicBtn.classList.remove('dictating');
          return;
        }

        const dictSettings = settings.dictation || { enabled: true, language: 'en-US', autoPunctuation: true };
        await window.SpeechService.start({
          language: dictSettings.language || 'en-US',
          autoPunctuation: false,
          onStart: () => {
            isDictatingSearch = true;
            searchMicBtn.classList.add('dictating');
            showInPageToast('🎙️ Say snippet name or shortcut...');
          },
          onResult: ({ finalText, interimText }) => {
            const query = (finalText || interimText || '').trim();
            menuSearchQuery = query;
            if (searchInput) {
              searchInput.value = query;
              clearBtn.style.display = query ? 'block' : 'none';
            }
            renderFloatingMenuList();
          },
          onEnd: () => {
            isDictatingSearch = false;
            searchMicBtn.classList.remove('dictating');
          },
          onError: ({ error, message }) => {
            isDictatingSearch = false;
            searchMicBtn.classList.remove('dictating');
            showInPageToast(message);
          }
        });
      });
    }

    if (activeMenuTab === 'snippets' || !aiEnabled) {
      renderFolderChips();
      renderFloatingMenuList();
    } else {
      if (!currentAiContext) currentAiContext = extractPageContext();
      renderAiPanel();
      if (initialAiOptions && initialAiOptions.action) {
        performAiGeneration(initialAiOptions.action, initialAiOptions.prompt || '', initialAiOptions.context || currentAiContext);
      }
    }

    // Stop all clicks and mousedowns inside menu from bubbling to document
    menu.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    menu.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });

    // Dismiss only on genuine outside clicks
    const onDocClick = (e) => {
      if (!isFloatingMenuOpen) {
        document.removeEventListener('click', onDocClick, false);
        return;
      }
      const path = (e.composedPath && e.composedPath()) || [];
      if (menu && (menu.contains(e.target) || path.includes(menu))) {
        return;
      }
      if (widget && (widget.contains(e.target) || path.includes(widget))) {
        return;
      }
      const toast = document.getElementById('pariwartan-floating-toast');
      if (toast && (toast.contains(e.target) || path.includes(toast))) {
        return;
      }
      closeFloatingMenu();
      document.removeEventListener('click', onDocClick, false);
    };

    setTimeout(() => {
      document.addEventListener('click', onDocClick, false);
    }, 150);

    // Escape key
    const onDocKey = (e) => {
      if (e.key === 'Escape' && isFloatingMenuOpen) {
        closeFloatingMenu();
        document.removeEventListener('keydown', onDocKey, true);
      }
    };
    document.addEventListener('keydown', onDocKey, true);
  }

  // --- Recent Chats Storage Helpers ---
  function getRecentChats() {
    try {
      const raw = localStorage.getItem('parivartan_ai_recent');
      return raw ? JSON.parse(raw) : [
        { prompt: 'how is this tool working and give pointers to create such a tool', result: 'AI Blaze and Parivartan work through content script injection and LLM background relay.', time: Date.now() - 3600000 },
        { prompt: 'give suggestions to make the dashboard more useful', result: '1. Add quick analytics.\n2. Add folder bulk export.\n3. Add AI tone selector.', time: Date.now() - 7200000 }
      ];
    } catch (e) {
      return [];
    }
  }

  function saveRecentChat(promptText, resultText) {
    if (!promptText) return;
    try {
      let list = getRecentChats();
      list = list.filter(item => item.prompt !== promptText);
      list.unshift({ prompt: promptText, result: resultText, time: Date.now() });
      if (list.length > 5) list = list.slice(0, 5);
      localStorage.setItem('parivartan_ai_recent', JSON.stringify(list));
    } catch (e) {}
  }

  function removeRecentChat(idx) {
    try {
      let list = getRecentChats();
      list.splice(idx, 1);
      localStorage.setItem('parivartan_ai_recent', JSON.stringify(list));
    } catch (e) {}
  }

  // --- Saved Prompts Library (Primary Solution & Reply Cards) ---
  const AI_PRIMARY_PROMPTS = [
    { id: 'diagnose', icon: '🔍', title: 'Find Solution & Diagnose', shortcut: '/solve', desc: 'Analyzes root cause & provides step-by-step technical fix' },
    { id: 'draft_reply', icon: '💬', title: 'Draft Resolution Reply', shortcut: '/reply', desc: 'Drafts comprehensive resolution reply for customer' },
    { id: 'summarize', icon: '📋', title: 'Summarize Ticket', shortcut: '/tldr', desc: 'Extracts core issue, affected service & current status' },
    { id: 'improve', icon: '✨', title: 'Improve & Polish', shortcut: '/improve', desc: 'Enhances tone, clarity, and fixes grammar/errors' }
  ];

  // --- Render AI Assistant Panel View ---
  function renderAiPanel() {
    const container = document.getElementById('pariwartanAiPanel');
    if (!container) return;

    const aiConfig = settings.ai || {
      enabled: true,
      provider: 'gemini',
      model: 'gemini-flash-lite-latest',
      apiKey: '',
      customEndpoint: 'http://localhost:11434',
      persona: 'support'
    };

    const provider = aiConfig.provider || 'gemini';
    const apiKey = (aiConfig.apiKey || '').trim();
    const hasKey = !!apiKey || ['ollama', 'chrome_builtin', 'smart_instant', 'chatgpt_web', 'claude_web', 'gemini_web'].includes(provider);

    const recentChats = getRecentChats();

    // Ensure page context is freshly populated
    if (!currentAiContext) {
      currentAiContext = extractPageContext();
    }
    const contextLength = (currentAiContext || '').trim().length;
    const contextSnippet = (currentAiContext || '').trim().replace(/\s+/g, ' ');

    const isWebWorkspace = ['chatgpt_web', 'claude_web', 'gemini_web'].includes(provider);
    const menuEl = document.getElementById('pariwartan-floating-menu');

    if (isWebWorkspace) {
      container.className = 'pariwartan-ai-panel in-web-mode';
      if (menuEl) {
        menuEl.classList.add('pariwartan-web-expanded');
      }

      const frameUrls = {
        chatgpt_web: 'https://chatgpt.com/',
        claude_web: 'https://claude.ai/new',
        gemini_web: 'https://gemini.google.com/app'
      };
      const frameUrl = frameUrls[provider] || 'https://chatgpt.com/';

      container.innerHTML = `
        <!-- Web Workspace Header & Action Toolbar -->
        <div class="pariwartan-web-toolbar">
          <div class="pariwartan-web-tabs">
            <button type="button" class="pariwartan-web-tab-btn ${provider === 'chatgpt_web' ? 'active' : ''}" data-web-prov="chatgpt_web" title="ChatGPT Pro (Signed in)">
              <span>🟢 ChatGPT Pro</span>
            </button>
            <button type="button" class="pariwartan-web-tab-btn ${provider === 'claude_web' ? 'active' : ''}" data-web-prov="claude_web" title="Claude Pro (Signed in)">
              <span>🟣 Claude Pro</span>
            </button>
            <button type="button" class="pariwartan-web-tab-btn ${provider === 'gemini_web' ? 'active' : ''}" data-web-prov="gemini_web" title="Google Gemini (Signed in)">
              <span>⚡ Gemini Pro</span>
            </button>
            <button type="button" class="pariwartan-web-tab-btn" data-web-prov="direct_chat" title="Switch to direct prompt cards & API mode">
              <span>💬 Direct</span>
            </button>
          </div>

          <div class="pariwartan-web-actions">
            <button type="button" class="pariwartan-web-action-btn primary" id="pvBtnInjectTicket" title="Inject current page context and prompt directly into chat">
              <span>⚡ Inject Ticket</span>
            </button>
            <button type="button" class="pariwartan-web-action-btn ${isDictatingDrawer ? 'dictating' : ''}" id="pvBtnWebMic" title="Voice Dictation into Prompt">
              <span>🎙️ Voice</span>
            </button>
            <button type="button" class="pariwartan-web-action-btn" id="pvBtnInsertWebReply" title="Copy response from chat and insert at cursor in your ticket">
              <span>↵ Insert Reply</span>
            </button>
            <button type="button" class="pariwartan-web-action-btn" id="pvBtnReloadFrame" title="Reload Web Page">
              <span>${PV_SVG_REFRESH}</span>
            </button>
          </div>
        </div>

        <!-- Embedded Web Frame Container -->
        <div class="pariwartan-embedded-frame-container">
          <iframe id="pvEmbeddedAiFrame" src="${frameUrl}" class="pariwartan-embedded-frame" allow="clipboard-read; clipboard-write; microphone;"></iframe>
        </div>
      `;

      // Wire Tab Switchers
      container.querySelectorAll('.pariwartan-web-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const targetProv = btn.dataset.webProv;
          if (targetProv === 'direct_chat') {
            settings.ai = settings.ai || {};
            settings.ai.provider = 'gemini';
            safeStorageSet({ settings });
            if (menuEl) menuEl.classList.remove('pariwartan-web-expanded');
            renderAiPanel();
            return;
          }
          settings.ai = settings.ai || {};
          settings.ai.provider = targetProv;
          safeStorageSet({ settings });
          renderAiPanel();
        });
      });

      // Wire Inject Ticket Button
      const injectBtn = container.querySelector('#pvBtnInjectTicket');
      if (injectBtn) {
        injectBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          let ctx = currentAiContext || extractPageContext();
          currentAiContext = ctx;
          const ticketPrompt = `Here is the customer ticket context from the page:
"""
${ctx}
"""

Please analyze this ticket and provide:
1. 🔍 Root Cause Analysis: Explain what is causing the error or failure based on the report/logs.
2. 🛠️ Step-by-Step Technical Fix: Provide the exact technical resolution, commands, or configuration changes needed.
3. 💬 Customer Resolution Reply: Draft a clear, polite, and reassuring response explaining the fix for the customer.`;

          const frame = container.querySelector('#pvEmbeddedAiFrame');
          if (frame && frame.contentWindow) {
            try {
              frame.contentWindow.postMessage({ type: 'PV_INJECT_PROMPT', text: ticketPrompt, autoSubmit: false }, '*');
            } catch (err) {}
          }

          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(ticketPrompt);
          }
          showInPageToast('⚡ Ticket & Solution prompt injected! (Copied to clipboard, Ctrl+V to paste)');
        });
      }

      // Wire Voice Dictation Button in Web View
      const webMicBtn = container.querySelector('#pvBtnWebMic');
      if (webMicBtn) {
        webMicBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!window.SpeechService || !window.SpeechService.isSupported()) {
            showInPageToast('Speech recognition not supported in this browser.');
            return;
          }

          if (isDictatingDrawer) {
            window.SpeechService.stop();
            isDictatingDrawer = false;
            webMicBtn.classList.remove('dictating');
            return;
          }

          const dictSettings = settings.dictation || { enabled: true, language: 'en-US', autoPunctuation: true };
          await window.SpeechService.start({
            language: dictSettings.language || 'en-US',
            autoPunctuation: dictSettings.autoPunctuation !== false,
            aiConfig: settings.ai,
            onStart: () => {
              isDictatingDrawer = true;
              webMicBtn.classList.add('dictating');
              showInPageToast('🎙️ Listening... Speak your prompt now');
            },
            onResult: ({ finalText, newFinalChunk }) => {
              const chunk = newFinalChunk || finalText;
              if (chunk) {
                const frame = container.querySelector('#pvEmbeddedAiFrame');
                if (frame && frame.contentWindow) {
                  try {
                    frame.contentWindow.postMessage({ type: 'PV_INJECT_PROMPT', text: chunk, autoSubmit: false }, '*');
                  } catch (err) {}
                }
                if (navigator.clipboard && navigator.clipboard.writeText) {
                  navigator.clipboard.writeText(chunk);
                }
                showInPageToast('✓ Transcribed speech! (Ctrl+V to paste)');
              }
            },
            onEnd: () => {
              isDictatingDrawer = false;
              webMicBtn.classList.remove('dictating');
            },
            onError: ({ message }) => {
              isDictatingDrawer = false;
              webMicBtn.classList.remove('dictating');
              showInPageToast(message);
            }
          });
        });
      }

      // Wire Insert Reply Button
      const insertReplyBtn = container.querySelector('#pvBtnInsertWebReply');
      if (insertReplyBtn) {
        insertReplyBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const frame = container.querySelector('#pvEmbeddedAiFrame');
          if (frame && frame.contentWindow) {
            try {
              frame.contentWindow.postMessage({ type: 'PV_GET_LATEST_REPLY' }, '*');
            } catch (err) {}
          }

          if (navigator.clipboard && navigator.clipboard.readText) {
            navigator.clipboard.readText().then(txt => {
              if (txt && txt.trim().length > 5) {
                pasteAiTextToCursor(txt.trim());
              } else {
                showInPageToast('Please copy the reply from the chat, then click Insert Reply.');
              }
            }).catch(() => {
              showInPageToast('Please copy the reply from the chat, then click Insert Reply.');
            });
          }
        });
      }

      // Wire Reload Frame Button
      const reloadBtn = container.querySelector('#pvBtnReloadFrame');
      if (reloadBtn) {
        reloadBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const frame = container.querySelector('#pvEmbeddedAiFrame');
          if (frame) frame.src = frame.src;
          showInPageToast('Reloading AI web page...');
        });
      }

      return;
    }

    if (menuEl) {
      menuEl.classList.remove('pariwartan-web-expanded');
    }

    const isInChatMode = aiChatMessages.length > 0;

    if (isInChatMode) {
      container.classList.add('in-chat-mode');
      container.innerHTML = `
        <!-- Chat Navigation Bar -->
        <div class="pariwartan-chat-header-bar">
          <button type="button" class="pariwartan-btn-back-prompts" id="pvBtnBackPrompts" title="Back to Prompt Hub (starts new temporary chat)">
            <span>←</span> <span>New Chat / Prompts</span>
          </button>
          <div class="pariwartan-chat-badge" id="pvBadgeContext" title="Temporary Session: Page context is used in 1st turn only">
            <span>⚡</span> <span>Temporary Chat (${temporaryChatTurn <= 1 ? 'Turn 1: Context Included' : 'Turn ' + temporaryChatTurn + ': Follow-up'})</span>
          </div>
          <button type="button" class="pariwartan-context-btn" id="pvBtnClearChat" title="Clear current conversation and start new temporary chat">
            <span>🗑️</span> <span>Clear</span>
          </button>
        </div>

        <!-- Chat Stream -->
        <div class="pariwartan-chat-stream" id="pvChatStream">
          ${aiChatMessages.map((msg, idx) => `
            ${msg.role === 'user' ? `
              <div class="pariwartan-chat-bubble-row user">
                <div class="pariwartan-chat-bubble user">
                  ${escapeText(msg.text)}
                </div>
              </div>
            ` : `
              <div class="pariwartan-chat-bubble-row assistant">
                <div class="pariwartan-chat-bubble assistant">
                  <div class="pariwartan-bubble-header">
                    <div style="display:flex; align-items:center; gap:6px;">
                      <span style="font-size:0.9rem;">✨</span>
                      <span style="font-weight:700; font-size:0.76rem; color:#475569;">Parivartan AI</span>
                    </div>
                    <span style="font-size:0.68rem; color:#94a3b8;">${provider === 'gemini' ? 'Gemini Flash' : provider}</span>
                  </div>
                  ${msg.isGenerating ? `
                    <div style="display:flex; align-items:center; gap:8px; padding:10px 0; color:#6366f1; font-weight:600; font-size:0.84rem;">
                      <span class="pariwartan-spinner" style="width:16px; height:16px; border:2px solid #e0e7ff; border-top-color:#6366f1; border-radius:50%; animation:pariwartanSpin 0.7s linear infinite;"></span>
                      <span>Thinking & drafting response...</span>
                    </div>
                  ` : `
                    <div class="pariwartan-chat-bubble-text" contenteditable="true" data-msg-idx="${idx}">${(window.ParivartanEngine ? window.ParivartanEngine.renderMarkdownToHtml(msg.text) : escapeText(msg.text))}</div>
                    
                    <div class="pariwartan-ai-actions-bar" style="margin-top:10px;">
                      <button type="button" class="pariwartan-ai-btn-insert pv-msg-insert" data-msg-idx="${idx}" title="Paste directly into your active text editor at cursor">
                        <span>↵</span> <span>Insert at Cursor</span>
                      </button>
                      <button type="button" class="pariwartan-ai-btn-secondary pv-msg-replace" data-msg-idx="${idx}" title="Replace entire content of active textbox">
                        <span>${PV_SVG_REFRESH}</span> <span>Replace All</span>
                      </button>
                      <button type="button" class="pariwartan-ai-btn-secondary pv-msg-copy" data-msg-idx="${idx}" title="Copy text to clipboard">
                        <span>📋</span> <span>Copy</span>
                      </button>
                      <button type="button" class="pariwartan-ai-btn-secondary pv-msg-save" data-msg-idx="${idx}" title="Save this response into your Snippets library">
                        <span>💾</span> <span>Save Snippet</span>
                      </button>
                    </div>

                    <div class="pariwartan-ai-refine-bar" style="margin-top:8px;">
                      <span style="font-size:0.68rem; color:#64748b; font-weight:700;">Tweak:</span>
                      <button type="button" class="pariwartan-ai-refine-pill pv-msg-tweak" data-msg-idx="${idx}" data-refine="shorten">✂️ Shorter</button>
                      <button type="button" class="pariwartan-ai-refine-pill pv-msg-tweak" data-msg-idx="${idx}" data-refine="make_longer">➕ Add Detail</button>
                      <button type="button" class="pariwartan-ai-refine-pill pv-msg-tweak" data-msg-idx="${idx}" data-refine="deescalate">🕊️ Softer Tone</button>
                      <button type="button" class="pariwartan-ai-refine-pill pv-msg-tweak" data-msg-idx="${idx}" data-refine="regenerate">${PV_SVG_REFRESH}Regenerate</button>
                    </div>
                  `}
                </div>
              </div>
            `}
          `).join('')}
        </div>

        <!-- Pinned Bottom Chat Container -->
        <div class="pariwartan-chat-section" style="margin-top:0;">
          <div class="pariwartan-chat-container">
            <textarea class="pariwartan-chat-input" id="pvChatInput" placeholder="Message Parivartan AI (temporary follow-up)...">${escapeText(currentCustomPromptText)}</textarea>
            
            <div class="pariwartan-chat-bottom-bar">
              <div class="pariwartan-chat-attachments">
                <button type="button" class="pariwartan-clip-btn" id="pvClipBtn" title="Rescrape / Attach page text for next turn">📎</button>
                <button type="button" class="pariwartan-clip-btn ${isDictatingDrawer ? 'dictating' : ''}" id="pvAiDictateBtn" title="Voice Dictation (Speech to text)">🎙️</button>
                
                ${temporaryChatTurn <= 1 ? (isPageAttached ? `
                  <span class="pariwartan-context-chip" id="pvChipPage" title="Ticket/Page text is attached for 1st turn">
                    <span>📄 Page (1st Turn)</span>
                    <button type="button" class="pariwartan-context-chip-remove" id="pvRemovePageChip">✕</button>
                  </span>
                ` : '') : `
                  <span class="pariwartan-context-chip" style="opacity:0.75;" title="Page context was captured in Turn 1">
                    <span>✓ Context In Session</span>
                  </span>
                `}
              </div>

              <button type="button" class="pariwartan-send-btn ${(currentCustomPromptText.trim() || isAiGenerating) ? 'active' : ''}" id="pvSendBtn" title="Send (Enter)">
                ${isAiGenerating ? '<span class="pariwartan-spinner" style="width:12px;height:12px;"></span>' : '↑'}
              </button>
            </div>
          </div>

          <!-- Chat Footer Bar -->
          <div class="pariwartan-chat-footer">
            <div style="display:flex; align-items:center; gap:6px;">
              <select class="pariwartan-model-select" id="pvBottomModelSelect" title="Select AI Engine">
                <optgroup label="🌐 Logged-in Web Sessions (No Key)">
                  <option value="chatgpt_web" ${provider === 'chatgpt_web' ? 'selected' : ''}>🟢 ChatGPT (Web Session)</option>
                  <option value="claude_web" ${provider === 'claude_web' ? 'selected' : ''}>🟣 Claude (Web Session)</option>
                  <option value="gemini_web" ${provider === 'gemini_web' ? 'selected' : ''}>⚡ Gemini (Web Session)</option>
                </optgroup>
                <optgroup label="🔑 Developer API Keys (Direct API)">
                  <option value="gemini" ${provider === 'gemini' ? 'selected' : ''}>⚡ Gemini API (Free Tier)</option>
                  <option value="openai" ${provider === 'openai' ? 'selected' : ''}>🟢 OpenAI API (GPT-4o)</option>
                  <option value="claude" ${provider === 'claude' ? 'selected' : ''}>🟣 Claude API (Claude 3.5)</option>
                  <option value="ollama" ${provider === 'ollama' ? 'selected' : ''}>💻 Local Ollama</option>
                  <option value="chrome_builtin" ${provider === 'chrome_builtin' ? 'selected' : ''}>💻 Chrome Nano</option>
                </optgroup>
              </select>

              <select class="pariwartan-model-select" id="pvBottomPersonaSelect" title="Select AI Thinking Character / Persona" style="max-width:130px;">
                ${getAllAiPersonas().map(p => `
                  <option value="${p.id}" ${p.id === (aiConfig.persona || 'support') ? 'selected' : ''}>${p.icon || '🎭'} ${escapeText(p.name)}</option>
                `).join('')}
              </select>
            </div>

            <div class="pariwartan-footer-links">
              <a class="pariwartan-footer-link" id="pvSettingsLink" title="Configure Keys & Settings">Settings ⚙</a>
            </div>
          </div>
        </div>
      `;
    } else {
      // --- Prompts Hub Mode (Clean 4 Primary Cards + Collapsible More Prompts) ---
      container.classList.remove('in-chat-mode');
      container.innerHTML = `
        <!-- Attached Page Context Live Preview Card -->
        <div class="pariwartan-context-preview-card">
          <div class="pariwartan-context-preview-header">
            <div style="display:flex; align-items:center; gap:6px; min-width:0; flex:1;">
              <span style="font-size:0.9rem; flex-shrink:0;">📄</span>
              <span class="pariwartan-context-preview-title" title="${escapeAttr(document.title || 'Current Webpage')}">
                ${escapeText(document.title ? document.title.slice(0, 32) + '...' : 'Current Webpage')}
              </span>
              <span class="pariwartan-context-preview-length">(${contextLength} chars)</span>
            </div>
            <div style="display:flex; align-items:center; gap:4px; flex-shrink:0;">
              <button type="button" class="pariwartan-context-btn" id="pvBtnRereadPage" title="Re-read current page content">${PV_SVG_REFRESH}Re-read</button>
              <button type="button" class="pariwartan-context-btn" id="pvBtnToggleContextView" title="Inspect or edit extracted page text">👁️ ${isContextExpanded ? 'Hide' : 'Inspect'}</button>
            </div>
          </div>
          ${isContextExpanded ? `
            <textarea class="pariwartan-context-edit-box" id="pvContextEditBox" placeholder="Page text the AI is referencing...">${escapeText(currentAiContext)}</textarea>
          ` : `
            <div class="pariwartan-context-snippet" id="pvContextSnippet" title="Click to inspect full page text">${escapeText(contextSnippet ? contextSnippet.slice(0, 140) + '...' : '(No text found on page. Click Re-read or highlight text)')}</div>
          `}
        </div>

        <!-- Quick API Key Setup Banner (if no key configured) -->
        ${!hasKey ? `
          <div class="pariwartan-api-key-banner">
            <div style="display:flex; align-items:center; justify-content:space-between;">
              <div style="display:flex; align-items:center; gap:6px; font-weight:700; font-size:0.78rem; color:#1e293b;">
                <span>🔑</span> <span>Connect ${provider === 'openai' ? 'OpenAI' : (provider === 'claude' ? 'Claude' : 'Google Gemini')} Key</span>
              </div>
              <a href="${provider === 'openai' ? 'https://platform.openai.com/api-keys' : (provider === 'claude' ? 'https://console.anthropic.com/' : 'https://aistudio.google.com/app/apikey')}" target="_blank" style="font-size:0.7rem; color:#6366f1; text-decoration:underline;">Get Free Key ↗</a>
            </div>
            <div style="font-size:0.72rem; color:#64748b; margin-top:3px;">
              Enter your key to enable full AI reading and replies:
            </div>
            <div style="display:flex; gap:6px; margin-top:6px;">
              <input type="password" id="pvQuickApiKeyInput" placeholder="Paste API Key here..." class="pariwartan-quick-key-input" />
              <button type="button" id="pvQuickSaveKeyBtn" class="pariwartan-quick-key-btn">Save Key</button>
            </div>
          </div>
        ` : ''}

        <!-- Use a saved prompt (Clean 2x2 Essential Cards) -->
        <div class="pariwartan-saved-prompts-section">
          <div class="pariwartan-section-title">
            <span>Use a saved prompt</span>
            <span style="font-size:0.7rem; color:#64748b; font-weight:normal;">1-Click AI Actions</span>
          </div>

          <div class="pariwartan-prompts-grid">
            ${(customAiPrompts && customAiPrompts.length > 0 ? customAiPrompts : (typeof DEFAULT_AI_PROMPTS !== 'undefined' ? DEFAULT_AI_PROMPTS : AI_PRIMARY_PROMPTS)).slice(0, 6).map(p => {
              const pTitle = p.name || p.title || 'AI Prompt';
              const pDesc = p.description || p.desc || (p.template ? p.template.slice(0, 70) + '...' : '');
              const icon = p.icon || (p.category === 'Diagnostic' ? '🔍' : (p.category === 'Technical' ? '⚡' : '🤖'));
              return `
              <div class="pariwartan-prompt-card pv-prompt-card" data-prompt-id="${p.id}" data-action="${p.id}" data-title="${escapeAttr(pTitle)}" title="${escapeAttr(pDesc)}">
                <div class="pariwartan-prompt-card-top">
                  <span class="pariwartan-prompt-card-title">
                    <span>${icon}</span> <span>${escapeText(pTitle)}</span>
                  </span>
                  ${p.isDefault ? '<span class="pariwartan-prompt-shortcut" style="color:#d97706; font-weight:700;">⭐ Default</span>' : (p.shortcut ? `<span class="pariwartan-prompt-shortcut">${p.shortcut}</span>` : '')}
                </div>
                <div class="pariwartan-prompt-card-desc">${escapeText(pDesc)}</div>
              </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Recent Chats Section (Collapsible) -->
        <div class="pariwartan-recent-section">
          <div class="pariwartan-recent-header" id="pvBtnToggleRecent">
            <span>Recent chats</span>
            <span class="pariwartan-caret">${isRecentOpen ? '▴' : '▾'}</span>
          </div>
          ${isRecentOpen && recentChats.length > 0 ? `
            <div class="pariwartan-recent-list">
              ${recentChats.map((item, idx) => `
                <div class="pariwartan-recent-item" data-idx="${idx}">
                  <span class="pariwartan-recent-item-text" title="${escapeAttr(item.prompt)}">${escapeText(item.prompt)}</span>
                  <div class="pariwartan-recent-actions">
                    <button type="button" class="pariwartan-recent-btn pv-recent-reuse" title="Re-run prompt">💬</button>
                    <button type="button" class="pariwartan-recent-btn pv-recent-copy" title="Copy result">📋</button>
                    <button type="button" class="pariwartan-recent-btn pv-recent-delete" title="Delete">🗑️</button>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>

        <!-- Bottom Chat Box ("Or, start temporary chat with this page.") -->
        <div class="pariwartan-chat-section">
          <div class="pariwartan-chat-heading">Or, start temporary chat with this page.</div>
          <div class="pariwartan-chat-container">
            <textarea class="pariwartan-chat-input" id="pvChatInput" placeholder="Message Parivartan AI (Temporary chat — page context used in 1st turn)...">${escapeText(currentCustomPromptText)}</textarea>
            
            <div class="pariwartan-chat-bottom-bar">
              <div class="pariwartan-chat-attachments">
                <button type="button" class="pariwartan-clip-btn" id="pvClipBtn" title="Rescrape / Attach page text">📎</button>
                <button type="button" class="pariwartan-clip-btn ${isDictatingDrawer ? 'dictating' : ''}" id="pvAiDictateBtn" title="Voice Dictation (Speech to text)">🎙️</button>
                
                ${isPageAttached ? `
                  <span class="pariwartan-context-chip" id="pvChipPage" title="Ticket/Page text will be attached for 1st turn">
                    <span>📄 Page (1st Turn)</span>
                    <button type="button" class="pariwartan-context-chip-remove" id="pvRemovePageChip">✕</button>
                  </span>
                ` : ''}
              </div>

              <button type="button" class="pariwartan-send-btn ${(currentCustomPromptText.trim() || isAiGenerating) ? 'active' : ''}" id="pvSendBtn" title="Send (Enter)">
                ${isAiGenerating ? '<span class="pariwartan-spinner" style="width:12px;height:12px;"></span>' : '↑'}
              </button>
            </div>
          </div>

          <!-- Chat Footer Bar -->
          <div class="pariwartan-chat-footer">
            <div style="display:flex; align-items:center; gap:6px;">
              <select class="pariwartan-model-select" id="pvBottomModelSelect" title="Select AI Engine">
                <optgroup label="🌐 Logged-in Web Sessions (No Key)">
                  <option value="chatgpt_web" ${provider === 'chatgpt_web' ? 'selected' : ''}>🟢 ChatGPT (Web Session)</option>
                  <option value="claude_web" ${provider === 'claude_web' ? 'selected' : ''}>🟣 Claude (Web Session)</option>
                  <option value="gemini_web" ${provider === 'gemini_web' ? 'selected' : ''}>⚡ Gemini (Web Session)</option>
                </optgroup>
                <optgroup label="🔑 Developer API Keys (Direct API)">
                  <option value="gemini" ${provider === 'gemini' ? 'selected' : ''}>⚡ Gemini API (Free Tier)</option>
                  <option value="openai" ${provider === 'openai' ? 'selected' : ''}>🟢 OpenAI API (GPT-4o)</option>
                  <option value="claude" ${provider === 'claude' ? 'selected' : ''}>🟣 Claude API (Claude 3.5)</option>
                  <option value="ollama" ${provider === 'ollama' ? 'selected' : ''}>💻 Local Ollama</option>
                  <option value="chrome_builtin" ${provider === 'chrome_builtin' ? 'selected' : ''}>💻 Chrome Nano</option>
                </optgroup>
              </select>

              <select class="pariwartan-model-select" id="pvBottomPersonaSelect" title="Select AI Thinking Character / Persona" style="max-width:130px;">
                ${getAllAiPersonas().map(p => `
                  <option value="${p.id}" ${p.id === (aiConfig.persona || 'support') ? 'selected' : ''}>${p.icon || '🎭'} ${escapeText(p.name)}</option>
                `).join('')}
              </select>
            </div>

            <div class="pariwartan-footer-links">
              <a class="pariwartan-footer-link" id="pvSettingsLink" title="Configure Keys & Settings">Settings ⚙</a>
            </div>
          </div>
        </div>
      `;
    }

    // --- Wire Event Handlers ---

    // Chat Mode Back Button
    const backBtn = container.querySelector('#pvBtnBackPrompts');
    if (backBtn) {
      backBtn.addEventListener('click', (e) => {
        e.preventDefault();
        resetTemporaryChat();
        renderAiPanel();
      });
    }

    // Chat Mode Clear Button
    const clearChatBtn = container.querySelector('#pvBtnClearChat');
    if (clearChatBtn) {
      clearChatBtn.addEventListener('click', (e) => {
        e.preventDefault();
        resetTemporaryChat();
        renderAiPanel();
        showInPageToast('Temporary chat cleared. Started new session.');
      });
    }

    // Chat Mode Per-Message Actions (Insert, Replace, Copy, Save, Tweak)
    container.querySelectorAll('.pv-msg-insert').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const idx = parseInt(btn.dataset.msgIdx, 10);
        const bubbleEl = container.querySelector(`.pariwartan-chat-bubble-text[data-msg-idx="${idx}"]`);
        const txt = bubbleEl ? (bubbleEl.innerText || bubbleEl.textContent) : (aiChatMessages[idx]?.text || '');
        pasteAiTextToCursor(txt);
      });
    });

    container.querySelectorAll('.pv-msg-replace').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const idx = parseInt(btn.dataset.msgIdx, 10);
        const bubbleEl = container.querySelector(`.pariwartan-chat-bubble-text[data-msg-idx="${idx}"]`);
        const txt = bubbleEl ? (bubbleEl.innerText || bubbleEl.textContent) : (aiChatMessages[idx]?.text || '');
        replaceEntireMessage(txt);
      });
    });

    container.querySelectorAll('.pv-msg-copy').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const idx = parseInt(btn.dataset.msgIdx, 10);
        const bubbleEl = container.querySelector(`.pariwartan-chat-bubble-text[data-msg-idx="${idx}"]`);
        const txt = bubbleEl ? (bubbleEl.innerText || bubbleEl.textContent) : (aiChatMessages[idx]?.text || '');
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(txt).then(() => {
            showInPageToast('📋 Copied AI text to clipboard!');
          });
        }
      });
    });

    container.querySelectorAll('.pv-msg-save').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const idx = parseInt(btn.dataset.msgIdx, 10);
        const bubbleEl = container.querySelector(`.pariwartan-chat-bubble-text[data-msg-idx="${idx}"]`);
        const txt = bubbleEl ? (bubbleEl.innerText || bubbleEl.textContent) : (aiChatMessages[idx]?.text || '');
        saveAiReplyAsSnippet(txt);
      });
    });

    container.querySelectorAll('.pv-msg-tweak').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const idx = parseInt(btn.dataset.msgIdx, 10);
        const refineType = btn.dataset.refine;
        const bubbleEl = container.querySelector(`.pariwartan-chat-bubble-text[data-msg-idx="${idx}"]`);
        const txt = bubbleEl ? (bubbleEl.innerText || bubbleEl.textContent) : (aiChatMessages[idx]?.text || '');
        if (refineType === 'regenerate') {
          const origMsg = aiChatMessages[idx - 1];
          performAiGeneration(origMsg?.action || 'draft_reply', origMsg?.text || '', currentAiContext, 'Regenerate');
        } else {
          const tweakTitles = {
            shorten: 'Make it shorter',
            make_longer: 'Add detail & verification',
            deescalate: 'Soften tone & empathize'
          };
          performAiGeneration(refineType, '', txt, tweakTitles[refineType] || 'Tweak');
        }
      });
    });

    // Contenteditable bubble updates in memory
    container.querySelectorAll('.pariwartan-chat-bubble-text').forEach(el => {
      el.addEventListener('input', () => {
        const idx = parseInt(el.dataset.msgIdx, 10);
        if (aiChatMessages[idx]) {
          aiChatMessages[idx].text = el.innerText;
          lastAiResult = el.innerText;
        }
      });
    });

    // Auto-scroll chat stream to bottom
    if (isInChatMode) {
      setTimeout(() => {
        const stream = container.querySelector('#pvChatStream');
        if (stream) stream.scrollTop = stream.scrollHeight;
      }, 30);
    }

    // Prompts Hub: Saved Prompt Cards click (uses structured prompt templates)
    container.querySelectorAll('.pv-prompt-card').forEach(card => {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        const pId = card.dataset.promptId;
        const title = card.dataset.title || '';
        let ctx = currentAiContext || extractPageContext();
        currentAiContext = ctx;

        // Running a saved prompt sets session turn to 1 with context
        temporaryChatTurn = 1;

        const promptsPool = (customAiPrompts && customAiPrompts.length > 0)
          ? customAiPrompts
          : (typeof DEFAULT_AI_PROMPTS !== 'undefined' ? DEFAULT_AI_PROMPTS : []);

        const foundCustom = promptsPool.find(p => p.id === pId);
        if (foundCustom && foundCustom.template) {
          const ticketId = extractTicketId();
          const customerMsg = extractCustomerMessage();
          const varValues = {
            'Page_context': ctx,
            'Ticket_ID': ticketId,
            'Customer_Message': customerMsg,
            'Engineer_Name': settings.defaultAuthor || 'Support Engineer',
            'Resolution_Steps': 'Diagnostic checks completed and verified',
            'Support_Tier': 'Tier 2 Technical Support'
          };
          const fallbackDefaults = {};
          (customAiVariables || []).forEach(v => {
            if (v.defaultValue) fallbackDefaults[v.key] = v.defaultValue;
          });

          const resolution = window.ParivartanEngine
            ? window.ParivartanEngine.resolveAiPrompt(foundCustom.template, varValues, fallbackDefaults)
            : { resolvedText: foundCustom.template };

          performAiGeneration('execute_prompt', resolution.resolvedText, ctx, title);
        } else {
          const action = card.dataset.action || 'custom';
          performAiGeneration(action, '', ctx, title);
        }
      });
    });

    // Context Card Actions (Re-read, Inspect/Edit)
    const rereadBtn = container.querySelector('#pvBtnRereadPage');
    if (rereadBtn) {
      rereadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        lastSelectedPageText = '';
        currentAiContext = extractPageContext();
        renderAiPanel();
        showInPageToast(`✓ Read ${currentAiContext.length} characters from page!`);
      });
    }

    const toggleContextBtn = container.querySelector('#pvBtnToggleContextView');
    if (toggleContextBtn) {
      toggleContextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        isContextExpanded = !isContextExpanded;
        renderAiPanel();
      });
    }

    const contextSnippetEl = container.querySelector('#pvContextSnippet');
    if (contextSnippetEl) {
      contextSnippetEl.addEventListener('click', () => {
        isContextExpanded = true;
        renderAiPanel();
      });
    }

    const contextEditBox = container.querySelector('#pvContextEditBox');
    if (contextEditBox) {
      contextEditBox.addEventListener('input', () => {
        currentAiContext = contextEditBox.value;
      });
    }

    // Quick API Key Save
    const quickKeyInput = container.querySelector('#pvQuickApiKeyInput');
    const quickKeyBtn = container.querySelector('#pvQuickSaveKeyBtn');
    if (quickKeyBtn && quickKeyInput) {
      quickKeyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const key = quickKeyInput.value.trim();
        if (!key) {
          showInPageToast('Please paste an API key first.');
          return;
        }
        settings.ai = settings.ai || {};
        settings.ai.apiKey = key;
        safeStorageSet({ settings });
        showInPageToast(`✓ Saved ${settings.ai.provider || 'AI'} API key!`);
        renderAiPanel();
      });
    }

    // Recent Chats Toggle
    const toggleRecentBtn = container.querySelector('#pvBtnToggleRecent');
    if (toggleRecentBtn) {
      toggleRecentBtn.addEventListener('click', () => {
        isRecentOpen = !isRecentOpen;
        renderAiPanel();
      });
    }

    // Recent Items Actions
    container.querySelectorAll('.pariwartan-recent-item').forEach(item => {
      const idx = parseInt(item.dataset.idx, 10);
      const data = recentChats[idx];
      if (!data) return;

      item.querySelector('.pariwartan-recent-item-text')?.addEventListener('click', () => {
        currentCustomPromptText = data.prompt;
        performAiGeneration('custom', data.prompt, currentAiContext, data.prompt);
      });

      item.querySelector('.pv-recent-reuse')?.addEventListener('click', (e) => {
        e.stopPropagation();
        currentCustomPromptText = data.prompt;
        performAiGeneration('custom', data.prompt, currentAiContext, data.prompt);
      });

      item.querySelector('.pv-recent-copy')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (navigator.clipboard) {
          navigator.clipboard.writeText(data.result || data.prompt).then(() => {
            showInPageToast('📋 Copied recent result!');
          });
        }
      });

      item.querySelector('.pv-recent-delete')?.addEventListener('click', (e) => {
        e.stopPropagation();
        removeRecentChat(idx);
        renderAiPanel();
      });
    });

    // Chat Textarea & Send Button
    const chatInput = container.querySelector('#pvChatInput');
    const sendBtn = container.querySelector('#pvSendBtn');
    if (chatInput) {
      chatInput.addEventListener('input', () => {
        currentCustomPromptText = chatInput.value;
        if (sendBtn) {
          if (currentCustomPromptText.trim()) sendBtn.classList.add('active');
          else sendBtn.classList.remove('active');
        }
      });

      chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          const text = chatInput.value.trim();
          if (text) {
            submitTemporaryChat(text);
          }
        }
      });
    }

    if (sendBtn) {
      sendBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const text = (chatInput?.value || currentCustomPromptText).trim();
        submitTemporaryChat(text || 'Please review this page and reply accordingly.');
      });
    }

    // Attach Context Button (Paperclip)
    const clipBtn = container.querySelector('#pvClipBtn');
    if (clipBtn) {
      clipBtn.addEventListener('click', () => {
        currentAiContext = extractPageContext();
        isPageAttached = true;
        temporaryChatTurn = 0; // Resets turn counter so next chat message re-captures fresh page context
        renderAiPanel();
        showInPageToast('✓ Fresh page context attached for next turn!');
      });
    }

    // Context Chip Remove
    const removePageChip = container.querySelector('#pvRemovePageChip');
    if (removePageChip) {
      removePageChip.addEventListener('click', () => {
        isPageAttached = false;
        temporaryChatTurn = 1;
        renderAiPanel();
      });
    }

    // Dictate Button
    const dictateBtn = container.querySelector('#pvAiDictateBtn');
    if (dictateBtn) {
      dictateBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!window.SpeechService || !window.SpeechService.isSupported()) {
          showInPageToast('Speech recognition not supported in this browser.');
          return;
        }

        if (isDictatingDrawer) {
          window.SpeechService.stop();
          isDictatingDrawer = false;
          dictateBtn.classList.remove('dictating');
          return;
        }

        const dictSettings = settings.dictation || { enabled: true, language: 'en-US', autoPunctuation: true };
        if (dictSettings.enabled === false) {
          showInPageToast('Voice dictation is disabled in Settings.');
          return;
        }

        const baseText = chatInput ? chatInput.value : currentCustomPromptText;

        const started = await window.SpeechService.start({
          language: dictSettings.language || 'en-US',
          autoPunctuation: dictSettings.autoPunctuation !== false,
          aiConfig: settings.ai,
          initialText: baseText,
          onStart: ({ mode } = {}) => {
            isDictatingDrawer = true;
            dictateBtn.classList.add('dictating');
            showInPageToast(mode === 'ai' ? '🎙️ Recording voice... Click mic again when done.' : '🎙️ Listening... Speak your prompt');
          },
          onResult: ({ finalText, interimText, newFinalChunk }) => {
            const chunk = newFinalChunk || finalText;
            const display = (baseText ? baseText + ' ' : '') + (chunk || '');
            currentCustomPromptText = display;
            if (chatInput) {
              chatInput.value = display;
              chatInput.scrollTop = chatInput.scrollHeight;
              if (sendBtn) sendBtn.classList.add('active');
            }
            showInPageToast('✓ Transcribed speech into prompt!');
          },
          onEnd: () => {
            isDictatingDrawer = false;
            dictateBtn.classList.remove('dictating');
          },
          onError: ({ error, message }) => {
            isDictatingDrawer = false;
            dictateBtn.classList.remove('dictating');
            showInPageToast(message);
          }
        });

        if (!started) {
          isDictatingDrawer = false;
          dictateBtn.classList.remove('dictating');
        }
      });
    }

    // Model Selector Dropdown
    const modelSelect = container.querySelector('#pvBottomModelSelect');
    if (modelSelect) {
      modelSelect.addEventListener('change', () => {
        settings.ai = settings.ai || {};
        settings.ai.provider = modelSelect.value;
        safeStorageSet({ settings });
        showInPageToast(`✓ Switched to ${modelSelect.options[modelSelect.selectedIndex].text}`);
        renderAiPanel();
      });
    }

    // Persona Selector Dropdown
    const personaSelect = container.querySelector('#pvBottomPersonaSelect');
    if (personaSelect) {
      personaSelect.addEventListener('change', () => {
        settings.ai = settings.ai || {};
        settings.ai.persona = personaSelect.value;
        safeStorageSet({ settings });
        const chosen = getAllAiPersonas().find(p => p.id === personaSelect.value);
        showInPageToast(`✓ Character: ${(chosen && chosen.name) || personaSelect.value}`);
      });
    }

    // Settings Link
    const settingsLink = container.querySelector('#pvSettingsLink');
    if (settingsLink) {
      settingsLink.addEventListener('click', () => {
        safeSendMessage({ action: 'OPEN_DASHBOARD' });
      });
    }
  }

  // --- Paste AI Text Directly at Cursor ---
  function pasteAiTextToCursor(text) {
    if (!text) return;
    const target = getActiveEditable();
    closeFloatingMenu();

    if (target) {
      target.focus();

      // Restore saved selection/range if available
      if (savedSelectionRange && (target.isContentEditable || target.getAttribute('contenteditable') === 'true')) {
        const sel = window.getSelection();
        if (sel) {
          try {
            sel.removeAllRanges();
            sel.addRange(savedSelectionRange);
          } catch (e) {}
        }
      } else if (typeof savedSelectionStart === 'number' && typeof target.setSelectionRange === 'function') {
        try {
          target.setSelectionRange(savedSelectionStart, savedSelectionEnd);
        } catch (e) {}
      }

      insertTextIntoElement(target, text, 0);
      showInPageToast('✓ AI reply inserted at cursor!');
    } else {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          showInPageToast('📋 Copied AI reply to clipboard! (Paste with Ctrl+V)');
        });
      } else {
        showInPageToast('✓ AI reply generated');
      }
    }
  }

  // --- Replace Entire Target Textbox with AI Text ---
  function replaceEntireMessage(text) {
    if (!text) return;
    const target = getActiveEditable();
    closeFloatingMenu();

    if (target) {
      target.focus();
      const isContentEditable = target.isContentEditable || target.getAttribute('contenteditable') === 'true';
      if (isContentEditable) {
        target.innerHTML = '';
        insertTextIntoElement(target, text, 0);
      } else {
        target.value = '';
        if (typeof target.setSelectionRange === 'function') {
          target.setSelectionRange(0, 0);
        }
        insertTextIntoElement(target, text, 0);
      }
      showInPageToast('✓ Replaced entire message with AI reply!');
    } else {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          showInPageToast('📋 Copied AI text to clipboard!');
        });
      }
    }
  }

  // --- Save AI Generated Reply into Snippets Library ---
  function saveAiReplyAsSnippet(text) {
    if (!text) return;
    const title = prompt('Enter a name for this new snippet:', 'AI Quick Reply');
    if (!title) return;
    const shortcutRaw = prompt('Enter shortcut (e.g. /myreply):', '/reply' + Math.floor(Math.random() * 90 + 10));
    if (!shortcutRaw) return;
    const shortcut = shortcutRaw.startsWith('/') ? shortcutRaw : '/' + shortcutRaw;

    const newSnippet = {
      id: 'snip_' + Date.now(),
      folderId: 'folder_sample',
      title: title.trim(),
      shortcut: shortcut.trim(),
      content: text.trim(),
      tags: ['ai-generated', 'quick-reply'],
      usageCount: 1,
      createdAt: Date.now()
    };

    snippets.unshift(newSnippet);
    safeStorageSet({ snippets: snippets });
    showInPageToast(`✓ Saved snippet "${title}" (${shortcut})!`);
  }

  // --- Highlighted Text Selection Pill ---
  function removeSelectionPill() {
    if (selectionPill) {
      selectionPill.remove();
      selectionPill = null;
    }
  }

  function showSelectionPill(rect, selectedText) {
    removeSelectionPill();
    if (!isAiAssistantEnabled() || !isTextSelectionIconEnabled()) return;

    selectionPill = document.createElement('div');
    selectionPill.id = 'pariwartan-selection-pill';

    selectionPill.innerHTML = `
      <button type="button" class="pariwartan-pill-btn primary" id="pvPillReply">
        <span>🤖</span> <span>Draft Reply</span>
      </button>
      <div class="pariwartan-pill-divider"></div>
      <button type="button" class="pariwartan-pill-btn" id="pvPillSummarize">
        <span>📝</span> <span>Summarize</span>
      </button>
      <div class="pariwartan-pill-divider"></div>
      <button type="button" class="pariwartan-pill-btn" id="pvPillTroubleshoot">
        <span>🔍</span> <span>Troubleshoot</span>
      </button>
      <div class="pariwartan-pill-divider"></div>
      <button type="button" class="pariwartan-pill-btn" id="pvPillDismiss" title="Dismiss">&times;</button>
    `;

    document.body.appendChild(selectionPill);

    // Prevent mousedown on pill from unselecting text or stealing input focus
    selectionPill.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    // Position pill near selection
    const pillHeight = 32;
    let top = rect.top + window.scrollY - pillHeight - 8;
    if (top < window.scrollY + 6) {
      top = rect.bottom + window.scrollY + 8;
    }
    let left = rect.left + window.scrollX;
    left = Math.max(10, Math.min(window.innerWidth - 320, left));

    selectionPill.style.top = `${top}px`;
    selectionPill.style.left = `${left}px`;

    // Wire actions
    selectionPill.querySelector('#pvPillReply').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      removeSelectionPill();
      openFloatingMenu('ai', { action: 'draft_reply', context: selectedText });
    });

    selectionPill.querySelector('#pvPillSummarize').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      removeSelectionPill();
      openFloatingMenu('ai', { action: 'shorten', context: selectedText });
    });

    selectionPill.querySelector('#pvPillTroubleshoot').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      removeSelectionPill();
      openFloatingMenu('ai', { action: 'troubleshoot', context: selectedText });
    });

    selectionPill.querySelector('#pvPillDismiss').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      removeSelectionPill();
    });
  }

  function handleSelectionChange() {
    clearTimeout(selectionCheckTimeout);
    if (!isTextSelectionIconEnabled()) {
      removeSelectionPill();
      return;
    }
    selectionCheckTimeout = setTimeout(() => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) {
        removeSelectionPill();
        return;
      }

      const text = sel.toString().trim();
      if (text.length < 5) {
        removeSelectionPill();
        return;
      }

      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        removeSelectionPill();
        return;
      }

      const container = range.commonAncestorContainer;
      const parentEl = container.nodeType === Node.ELEMENT_NODE ? container : container.parentElement;
      if (parentEl && (parentEl.closest('#pariwartan-floating-menu') || parentEl.closest('#pariwartan-floating-widget') || parentEl.closest('#pariwartan-selection-pill'))) {
        return;
      }

      showSelectionPill(rect, text);
    }, 150);
  }

  // --- Folder Chips Horizontal Scroller Controls ---
  function setupFolderScroller(menu) {
    const chipsEl = menu.querySelector('#pariwartanFolderChips');
    const leftBtn = menu.querySelector('#pvFolderScrollLeft');
    const rightBtn = menu.querySelector('#pvFolderScrollRight');
    if (!chipsEl || !leftBtn || !rightBtn) return;

    const updateScrollButtons = () => {
      const maxScroll = chipsEl.scrollWidth - chipsEl.clientWidth;
      if (maxScroll <= 2) {
        leftBtn.style.display = 'none';
        rightBtn.style.display = 'none';
        return;
      }
      leftBtn.style.display = 'flex';
      rightBtn.style.display = 'flex';
      leftBtn.disabled = chipsEl.scrollLeft <= 4;
      leftBtn.classList.toggle('hidden', chipsEl.scrollLeft <= 4);
      rightBtn.disabled = chipsEl.scrollLeft >= maxScroll - 4;
      rightBtn.classList.toggle('hidden', chipsEl.scrollLeft >= maxScroll - 4);
    };

    leftBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      chipsEl.scrollBy({ left: -180, behavior: 'smooth' });
    });

    rightBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      chipsEl.scrollBy({ left: 180, behavior: 'smooth' });
    });

    chipsEl.addEventListener('scroll', updateScrollButtons, { passive: true });

    // Enable horizontal mouse wheel scrolling without needing to hold Shift
    chipsEl.addEventListener('wheel', (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        chipsEl.scrollLeft += e.deltaY;
        updateScrollButtons();
      }
    }, { passive: false });

    // Drag-to-scroll functionality for mouse
    let isDown = false;
    let startX = 0;
    let scrollStart = 0;

    chipsEl.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      isDown = true;
      startX = e.pageX - chipsEl.offsetLeft;
      scrollStart = chipsEl.scrollLeft;
    });

    window.addEventListener('mouseup', () => {
      isDown = false;
    });

    chipsEl.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      const x = e.pageX - chipsEl.offsetLeft;
      const walk = (x - startX) * 1.4;
      chipsEl.scrollLeft = scrollStart - walk;
      updateScrollButtons();
    });

    window.addEventListener('resize', updateScrollButtons);
    setTimeout(updateScrollButtons, 50);
  }

  function renderFolderChips() {
    const container = document.getElementById('pariwartanFolderChips');
    if (!container) return;
    container.innerHTML = '';

    // "All" chip
    const allChip = document.createElement('button');
    allChip.type = 'button';
    allChip.className = `pariwartan-folder-chip ${activeFolderFilter === 'all' ? 'active' : ''}`;
    allChip.innerHTML = `<span>All</span> <span class="pariwartan-folder-chip-count">(${snippets.length})</span>`;
    allChip.addEventListener('click', () => {
      activeFolderFilter = 'all';
      renderFolderChips();
      renderFloatingMenuList();
    });
    container.appendChild(allChip);

    // Individual folder chips
    folders.forEach(f => {
      const count = snippets.filter(s => s.folderId === f.id).length;
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `pariwartan-folder-chip ${activeFolderFilter === f.id ? 'active' : ''}`;
      chip.innerHTML = `<span>${getFolderIcon(f.name)} ${escapeText(f.name)}</span> <span class="pariwartan-folder-chip-count">(${count})</span>`;
      chip.addEventListener('click', () => {
        activeFolderFilter = f.id;
        renderFolderChips();
        renderFloatingMenuList();
      });
      container.appendChild(chip);

      if (activeFolderFilter === f.id) {
        setTimeout(() => {
          chip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }, 30);
      }
    });

    // Update scroll buttons state
    setTimeout(() => {
      const menu = document.getElementById('pariwartan-floating-menu');
      if (menu) {
        const leftBtn = menu.querySelector('#pvFolderScrollLeft');
        const rightBtn = menu.querySelector('#pvFolderScrollRight');
        if (leftBtn && rightBtn && container) {
          const maxScroll = container.scrollWidth - container.clientWidth;
          if (maxScroll <= 2) {
            leftBtn.style.display = 'none';
            rightBtn.style.display = 'none';
          } else {
            leftBtn.style.display = 'flex';
            rightBtn.style.display = 'flex';
            leftBtn.disabled = container.scrollLeft <= 4;
            leftBtn.classList.toggle('hidden', container.scrollLeft <= 4);
            rightBtn.disabled = container.scrollLeft >= maxScroll - 4;
            rightBtn.classList.toggle('hidden', container.scrollLeft >= maxScroll - 4);
          }
        }
      }
    }, 40);
  }

  function renderFloatingMenuList() {
    const listEl = document.getElementById('pariwartanMenuList');
    if (!listEl) return;
    listEl.innerHTML = '';

    const q = menuSearchQuery.toLowerCase().trim();

    // Filter snippets
    let filtered = snippets;
    if (activeFolderFilter !== 'all') {
      filtered = filtered.filter(s => s.folderId === activeFolderFilter);
    }
    if (q) {
      filtered = filtered.filter(s => {
        const folderName = getFolderName(s.folderId).toLowerCase();
        return (
          (s.title || '').toLowerCase().includes(q) ||
          (s.shortcut || '').toLowerCase().includes(q) ||
          (s.content || '').toLowerCase().includes(q) ||
          folderName.includes(q)
        );
      });
    }

    const countEl = document.getElementById('pariwartanMenuCount');
    if (countEl) countEl.textContent = filtered.length;

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div class="pariwartan-menu-empty">
          <div>🔍 No matching snippets found</div>
          <div style="font-size: 0.74rem; margin-top: 4px; color: #94a3b8;">Try a different search or folder filter</div>
        </div>
      `;
      return;
    }

    filtered.forEach(snip => {
      const folderName = getFolderName(snip.folderId);
      const item = document.createElement('div');
      item.className = 'pariwartan-snippet-item';
      item.innerHTML = `
        <div class="pariwartan-snippet-item-header">
          <span class="pariwartan-snippet-title" title="${escapeAttr(snip.title)}">${escapeText(snip.title)}</span>
          <div class="pariwartan-snippet-meta">
            <span class="pariwartan-folder-badge">${getFolderIcon(folderName)} ${escapeText(folderName)}</span>
            <span class="pariwartan-shortcut-pill">${escapeText(snip.shortcut)}</span>
          </div>
        </div>
        <div class="pariwartan-snippet-preview">${escapeText(snip.content || '')}</div>
      `;

      item.addEventListener('mousedown', (e) => {
        // Prevent mousedown from stealing focus from the active text box!
        e.preventDefault();
      });

      item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        pasteSnippetToCursor(snip);
      });

      listEl.appendChild(item);
    });
  }

  // --- Paste Snippet Directly at Cursor ---
  function pasteSnippetToCursor(snippet) {
    const target = getActiveEditable();

    closeFloatingMenu();

    const engine = window.ParivartanEngine || window.PariwartanEngine;
    const activeValues = buildActiveContextValues();
    const renderRes = engine
      ? engine.renderWithCursor(snippet.content, activeValues, settings)
      : { text: snippet.content, cursorOffset: -1 };

    if (target) {
      target.focus();

      // Restore saved range or selection
      if (savedSelectionRange && (target.isContentEditable || target.getAttribute('contenteditable') === 'true')) {
        const sel = window.getSelection();
        if (sel) {
          try {
            sel.removeAllRanges();
            sel.addRange(savedSelectionRange);
          } catch (e) {}
        }
      } else if (typeof savedSelectionStart === 'number' && typeof target.setSelectionRange === 'function') {
        try {
          target.setSelectionRange(savedSelectionStart, savedSelectionEnd);
        } catch (e) {}
      }

      insertTextIntoElement(target, renderRes.text, 0, renderRes.cursorOffset);
      recordSnippetUsage(snippet.id, renderRes.text.length);
      showInPageToast(`✓ Pasted "${snippet.title}" at cursor!`);
    } else {
      // Fallback to clipboard if user didn't have an input focused
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(renderRes.text).then(() => {
          showInPageToast(`📋 Copied "${snippet.title}" to clipboard! Paste with Ctrl+V`);
        }).catch(() => {
          showInPageToast(`✓ "${snippet.title}" selected`);
        });
      } else {
        showInPageToast(`✓ "${snippet.title}" selected`);
      }
      recordSnippetUsage(snippet.id, renderRes.text.length);
    }
  }

  // --- In-Page Toast Notification ---
  function showInPageToast(message) {
    let toast = document.getElementById('pariwartan-floating-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'pariwartan-floating-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('visible');

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove('visible');
    }, 2500);
  }

  // --- Listen to global hotkey Alt + Shift + P ---
  window.addEventListener('keydown', (e) => {
    if (e.altKey && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
      e.preventDefault();
      toggleFloatingMenu();
    }
  });

  // Keep floating menu within screen boundaries on window resize
  window.addEventListener('resize', () => {
    if (isFloatingMenuOpen) {
      updateMenuPosition();
    }
  });

  // Track active element focus & cursor position
  document.addEventListener('focusin', (e) => {
    if (e.target && !(e.target.closest && (e.target.closest('#pariwartan-floating-menu') || e.target.closest('#pariwartan-floating-widget')))) {
      if (isEditable(e.target)) {
        activeEditableElement = e.target;
        saveActiveCursorPosition();
      }
    }
  }, true);

  document.addEventListener('selectionchange', () => {
    saveActiveCursorPosition();
    handleSelectionChange();
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) {
      const s = sel.toString().trim();
      if (s.length >= 6) {
        lastSelectedPageText = s;
      }
    }
  });

  document.addEventListener('keyup', () => {
    saveActiveCursorPosition();
    handleSelectionChange();
  }, true);

  document.addEventListener('mouseup', (e) => {
    if (!(e.target && e.target.closest && (e.target.closest('#pariwartan-floating-menu') || e.target.closest('#pariwartan-floating-widget') || e.target.closest('#pariwartan-selection-pill')))) {
      saveActiveCursorPosition();
      handleSelectionChange();
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed) {
        const s = sel.toString().trim();
        if (s.length >= 6) {
          lastSelectedPageText = s;
        }
      }
    }
  }, true);

  // Main input and keydown event listeners
  document.addEventListener('input', handleInputEvent, true);
  document.addEventListener('keydown', handleKeyDown, true);

  // Sanitizers
  function escapeText(str) {
    return (str || '').replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  function escapeAttr(str) {
    return (str || '').replace(/"/g, '&quot;');
  }

  // Initialize
  loadSnippetsAndSettings();
})();
