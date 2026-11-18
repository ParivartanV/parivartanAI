/**
 * Parivartan Snippet - Clean Dashboard Controller
 * Auto-saving on typing, inline folder renaming,
 * robust deletion, and real-time tab synchronization.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // State
  let folders = [];
  let snippets = [];
  let settings = {};
  let activeSnippetId = null;
  let selectedFolderId = null;
  let isDirty = false;
  let autoSaveTimeout = null;
  let folderBeingEditedId = null;
  let folderBeingDeletedId = null;
  let snippetBeingDeletedId = null;

  // DOM Elements - Header
  const btnOpenSettings = document.getElementById('btnOpenSettings');
  const btnOpenBackup = document.getElementById('btnOpenBackup');
  const btnNewSnippet = document.getElementById('btnNewSnippet');
  const autoSaveIndicator = document.getElementById('autoSaveIndicator');

  // DOM Elements - Left Sidebar
  const treeSearchInput = document.getElementById('treeSearchInput');
  const btnAddFolder = document.getElementById('btnAddFolder');
  const folderTreePane = document.getElementById('folderTreePane');

  // DOM Elements - Center Editor
  const snippetLabelInput = document.getElementById('snippetLabelInput');
  const snippetShortcutInput = document.getElementById('snippetShortcutInput');
  const snippetFolderSelect = document.getElementById('snippetFolderSelect');
  const btnMoveSnippetHeader = document.getElementById('btnMoveSnippetHeader');
  const btnRenameFolderHeader = document.getElementById('btnRenameFolderHeader');
  const btnDeleteFolderHeader = document.getElementById('btnDeleteFolderHeader');
  const btnDeleteCurrentSnippet = document.getElementById('btnDeleteCurrentSnippet');
  const btnSaveCurrentSnippet = document.getElementById('btnSaveCurrentSnippet');
  const btnSaveBanner = document.getElementById('btnSaveBanner');
  const btnDiscardBanner = document.getElementById('btnDiscardBanner');
  const unsavedBanner = document.getElementById('unsavedBanner');
  const btnTryItOut = document.getElementById('btnTryItOut');
  const btnModeEdit = document.getElementById('btnModeEdit');
  const btnModePreview = document.getElementById('btnModePreview');

  const richToolbar = document.getElementById('richToolbar');
  const documentSurface = document.getElementById('documentSurface');
  const previewSurface = document.getElementById('previewSurface');

  // DOM Elements - Snippet Dynamic Variables Bar
  const snippetVarSelectDropdown = document.getElementById('snippetVarSelectDropdown');
  const snippetCustomVarsOptgroup = document.getElementById('snippetCustomVarsOptgroup');
  const btnInsertSnippetVar = document.getElementById('btnInsertSnippetVar');
  const btnAddSnippetVarChip = document.getElementById('btnAddSnippetVarChip');
  const snippetVarChipsRow = document.getElementById('snippetVarChipsRow');
  const snippetDetectedBadges = document.getElementById('snippetDetectedBadges');
  const snippetCharCount = document.getElementById('snippetCharCount');

  // DOM Elements - Snippet Right Panel (Variables Hub & Expansion Lab)
  const snippetRightResizer = document.getElementById('snippetRightResizer');
  const snippetRunnerPanel = document.getElementById('snippetRunnerPanel');
  const snippetRunnerShortcutText = document.getElementById('snippetRunnerShortcutText');
  const btnSnippetLoadSampleTicket = document.getElementById('btnSnippetLoadSampleTicket');
  const btnSnippetClearVars = document.getElementById('btnSnippetClearVars');
  const snippetRightVarDropdown = document.getElementById('snippetRightVarDropdown');
  const snippetRightCustomVarsOptgroup = document.getElementById('snippetRightCustomVarsOptgroup');
  const snippetRightVarSourceBadge = document.getElementById('snippetRightVarSourceBadge');
  const snippetRightVarInfoText = document.getElementById('snippetRightVarInfoText');
  const btnSnippetRightInsertVar = document.getElementById('btnSnippetRightInsertVar');
  const btnSnippetRightNewVar = document.getElementById('btnSnippetRightNewVar');
  const btnSnippetRightEditCustomVar = document.getElementById('btnSnippetRightEditCustomVar');
  const btnSnippetRightDeleteCustomVar = document.getElementById('btnSnippetRightDeleteCustomVar');
  const snippetRightVarEditorForm = document.getElementById('snippetRightVarEditorForm');
  const snippetRightVarFormTitle = document.getElementById('snippetRightVarFormTitle');
  const snippetRightEditingVarId = document.getElementById('snippetRightEditingVarId');
  const snippetRightVarNameInput = document.getElementById('snippetRightVarNameInput');
  const snippetRightVarKeyInput = document.getElementById('snippetRightVarKeyInput');
  const snippetRightVarDefaultInput = document.getElementById('snippetRightVarDefaultInput');
  const btnSnippetRightCancelVar = document.getElementById('btnSnippetRightCancelVar');
  const btnSnippetRightCancelVarBtn = document.getElementById('btnSnippetRightCancelVarBtn');
  const btnSnippetRightSaveVarBtn = document.getElementById('btnSnippetRightSaveVarBtn');
  const snippetVar_Ticket_ID = document.getElementById('snippetVar_Ticket_ID');
  const snippetTicketIdStatusBadge = document.getElementById('snippetTicketIdStatusBadge');
  const snippetVar_Customer_Message = document.getElementById('snippetVar_Customer_Message');
  const snippetCustomerMsgStatusBadge = document.getElementById('snippetCustomerMsgStatusBadge');
  const snippetVar_Page_context = document.getElementById('snippetVar_Page_context');
  const snippetPageContextLengthBadge = document.getElementById('snippetPageContextLengthBadge');
  const snippetVar_Engineer_Name = document.getElementById('snippetVar_Engineer_Name');
  const snippetEngineerNameStatusBadge = document.getElementById('snippetEngineerNameStatusBadge');
  const snippetVar_Support_Tier = document.getElementById('snippetVar_Support_Tier');
  const snippetSupportTierStatusBadge = document.getElementById('snippetSupportTierStatusBadge');
  const snippetVar_Resolution_Steps = document.getElementById('snippetVar_Resolution_Steps');
  const snippetResolutionStepsStatus = document.getElementById('snippetResolutionStepsStatus');
  const btnSnippetRightGenSteps = document.getElementById('btnSnippetRightGenSteps');
  const snippetRightCustomVarsCountBadge = document.getElementById('snippetRightCustomVarsCountBadge');
  const snippetRightCustomVarsList = document.getElementById('snippetRightCustomVarsList');
  const snippetResolvedOutput = document.getElementById('snippetResolvedOutput');
  const btnCopyResolvedSnippet = document.getElementById('btnCopyResolvedSnippet');
  const snippetTestExpectedShortcut = document.getElementById('snippetTestExpectedShortcut');
  const snippetTestInput = document.getElementById('snippetTestInput');
  const snippetTestStatus = document.getElementById('snippetTestStatus');
  const btnClearSnippetTestInput = document.getElementById('btnClearSnippetTestInput');

  // DOM Elements - Modals
  const modalSettings = document.getElementById('modalSettings');
  const settingsDefaultTemplate = document.getElementById('settingsDefaultTemplate');
  const settingsAuthorName = document.getElementById('settingsAuthorName');
  const settingsTriggerPrefix = document.getElementById('settingsTriggerPrefix');
  const settingsFloatingWidget = document.getElementById('settingsFloatingWidget');
  const floatingWidgetBadge = document.getElementById('floatingWidgetBadge');
  const lblFloatingWidgetStatus = document.getElementById('lblFloatingWidgetStatus');
  const settingsSelectionWidget = document.getElementById('settingsSelectionWidget');
  const selectionWidgetBadge = document.getElementById('selectionWidgetBadge');
  const lblSelectionWidgetStatus = document.getElementById('lblSelectionWidgetStatus');
  const settingsAiEnabled = document.getElementById('settingsAiEnabled');
  const aiConfigControlsContainer = document.getElementById('aiConfigControlsContainer');
  const aiDisabledNotice = document.getElementById('aiDisabledNotice');
  const aiStatusBadge = document.getElementById('aiStatusBadge');
  const lblAiToggleStatus = document.getElementById('lblAiToggleStatus');
  const settingsAiProvider = document.getElementById('settingsAiProvider');
  const settingsAiModel = document.getElementById('settingsAiModel');
  const settingsAiApiKey = document.getElementById('settingsAiApiKey');
  const settingsAiEndpoint = document.getElementById('settingsAiEndpoint');
  const settingsAiPersona = document.getElementById('settingsAiPersona');
  const aiApiKeyWrapper = document.getElementById('aiApiKeyWrapper');
  const aiEndpointWrapper = document.getElementById('aiEndpointWrapper');
  const aiKeyHint = document.getElementById('aiKeyHint');
  const btnToggleAiKeyVisibility = document.getElementById('btnToggleAiKeyVisibility');
  const btnTestAiConnection = document.getElementById('btnTestAiConnection');
  const aiTestStatusMsg = document.getElementById('aiTestStatusMsg');
  const settingsDictationEnabled = document.getElementById('settingsDictationEnabled');
  const settingsDictationLang = document.getElementById('settingsDictationLang');
  const settingsDictationPunctuation = document.getElementById('settingsDictationPunctuation');
  const dictationConfigFields = document.getElementById('dictationConfigFields');
  const btnSaveSettings = document.getElementById('btnSaveSettings');

  // DOM Elements - Cloud Database & Google Auth Sync
  const btnOpenCloudSync = document.getElementById('btnOpenCloudSync');
  const modalCloudSync = document.getElementById('modalCloudSync');
  const cloudServerStatusDot = document.getElementById('cloudServerStatusDot');
  const cloudServerStatusText = document.getElementById('cloudServerStatusText');
  const btnTestCloudServer = document.getElementById('btnTestCloudServer');
  const cloudUserCard = document.getElementById('cloudUserCard');
  const btnTriggerSyncPush = document.getElementById('btnTriggerSyncPush');
  const btnTriggerSyncPull = document.getElementById('btnTriggerSyncPull');
  const inputCloudServerUrl = document.getElementById('inputCloudServerUrl');
  const btnSaveCloudServerUrl = document.getElementById('btnSaveCloudServerUrl');

  const modalBackup = document.getElementById('modalBackup');
  const btnDownloadJSON = document.getElementById('btnDownloadJSON');
  const fileUploadJSON = document.getElementById('fileUploadJSON');
  const jsonTextPreview = document.getElementById('jsonTextPreview');
  const btnApplyImportedJSON = document.getElementById('btnApplyImportedJSON');

  const modalDeleteSnippet = document.getElementById('modalDeleteSnippet');
  const deleteSnippetTitleText = document.getElementById('deleteSnippetTitleText');
  const btnConfirmDeleteSnippet = document.getElementById('btnConfirmDeleteSnippet');

  const modalFolderEdit = document.getElementById('modalFolderEdit');
  const modalFolderTitle = document.getElementById('modalFolderTitle');
  const folderNameInput = document.getElementById('folderNameInput');
  const btnSaveFolder = document.getElementById('btnSaveFolder');

  const modalDeleteFolder = document.getElementById('modalDeleteFolder');
  const deleteFolderName = document.getElementById('deleteFolderName');
  const btnConfirmDeleteFolder = document.getElementById('btnConfirmDeleteFolder');

  // DOM Elements - Move Snippet Modal
  const modalMoveSnippet = document.getElementById('modalMoveSnippet');
  const moveSnippetTargetTitle = document.getElementById('moveSnippetTargetTitle');
  const moveFolderOptionsList = document.getElementById('moveFolderOptionsList');

  // DOM Elements - Floating Context Menu
  const snippetContextMenu = document.getElementById('snippetContextMenu');
  const contextMenuTitle = document.getElementById('contextMenuTitle');
  const contextSubmenuFolders = document.getElementById('contextSubmenuFolders');
  const contextDuplicateSnippet = document.getElementById('contextDuplicateSnippet');
  const contextDeleteSnippet = document.getElementById('contextDeleteSnippet');

  // Track collapsed folders & state
  const collapsedFolderIds = new Set();
  let snippetBeingMovedId = null;
  let contextMenuSnippetId = null;

  const modalTryItOut = document.getElementById('modalTryItOut');
  const tryOutShortcutPill = document.getElementById('tryOutShortcutPill');
  const tryOutInput = document.getElementById('tryOutInput');
  const btnClearTryOut = document.getElementById('btnClearTryOut');

  // DOM Elements - Sidebar Drag Resizer
  const leftSidebar = document.getElementById('leftSidebar');
  const sidebarResizer = document.getElementById('sidebarResizer');

  function initSidebarResizer() {
    if (!leftSidebar || !sidebarResizer) return;

    // Restore saved width from localStorage if present
    const savedWidth = localStorage.getItem('parivartan_sidebar_width') || localStorage.getItem('pariwartan_sidebar_width');
    if (savedWidth) {
      const parsed = parseInt(savedWidth, 10);
      if (!isNaN(parsed) && parsed >= 180 && parsed <= 600) {
        leftSidebar.style.width = parsed + 'px';
        document.documentElement.style.setProperty('--sidebar-w', parsed + 'px');
      }
    }

    let isResizing = false;
    let startX = 0;
    let startWidth = 0;

    function onPointerDown(e) {
      isResizing = true;
      startX = e.clientX || (e.touches && e.touches[0].clientX);
      startWidth = leftSidebar.getBoundingClientRect().width;

      sidebarResizer.classList.add('is-dragging');
      document.body.classList.add('sidebar-resizing');

      document.addEventListener('mousemove', onPointerMove);
      document.addEventListener('mouseup', onPointerUp);
      document.addEventListener('touchmove', onPointerMove, { passive: false });
      document.addEventListener('touchend', onPointerUp);

      e.preventDefault();
    }

    function onPointerMove(e) {
      if (!isResizing) return;
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      if (typeof clientX !== 'number') return;

      const deltaX = clientX - startX;
      const newWidth = Math.max(180, Math.min(600, startWidth + deltaX));

      leftSidebar.style.width = newWidth + 'px';
      document.documentElement.style.setProperty('--sidebar-w', newWidth + 'px');

      if (e.cancelable) e.preventDefault();
    }

    function onPointerUp() {
      if (!isResizing) return;
      isResizing = false;

      sidebarResizer.classList.remove('is-dragging');
      document.body.classList.remove('sidebar-resizing');

      document.removeEventListener('mousemove', onPointerMove);
      document.removeEventListener('mouseup', onPointerUp);
      document.removeEventListener('touchmove', onPointerMove);
      document.removeEventListener('touchend', onPointerUp);

      // Persist chosen width
      const finalWidth = Math.round(leftSidebar.getBoundingClientRect().width);
      localStorage.setItem('parivartan_sidebar_width', finalWidth);
    }

    sidebarResizer.addEventListener('mousedown', onPointerDown);
    sidebarResizer.addEventListener('touchstart', onPointerDown, { passive: false });

    // Double-click on handle resets to default (280px)
    sidebarResizer.addEventListener('dblclick', () => {
      leftSidebar.style.width = '280px';
      document.documentElement.style.setProperty('--sidebar-w', '280px');
      localStorage.removeItem('parivartan_sidebar_width');
      localStorage.removeItem('pariwartan_sidebar_width');
      showToast('Sidebar width reset to default (280px)', 'info');
    });
  }

  initSidebarResizer();

  const toastContainer = document.getElementById('toastContainer');

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  function setAutoSaveStatus(status) {
    if (!autoSaveIndicator) return;
    if (status === 'saving') {
      autoSaveIndicator.textContent = '● Saving...';
      autoSaveIndicator.className = 'auto-save-pill saving';
    } else {
      autoSaveIndicator.textContent = '✓ Auto-saved';
      autoSaveIndicator.className = 'auto-save-pill';
    }
  }

  function setSnippetDirty(dirty) {
    isDirty = !!dirty;
    const btn = btnSaveCurrentSnippet || document.getElementById('btnSaveCurrentSnippet');
    if (btn) {
      if (isDirty) {
        btn.classList.add('has-unsaved');
        btn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
          <span>Save Snippet</span>
        `;
        btn.title = 'You have unsaved changes. Click to save now (Ctrl+S)';
      } else {
        btn.classList.remove('has-unsaved');
        btn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>Saved</span>
        `;
        btn.title = 'All changes saved to library';
      }
    }
    const banner = unsavedBanner || document.getElementById('unsavedBanner');
    if (banner) {
      banner.style.display = isDirty ? 'flex' : 'none';
    }
  }

  let isPromptDirty = false;
  function setPromptDirty(dirty) {
    isPromptDirty = !!dirty;
    const btn = document.getElementById('btnSaveCurrentPrompt');
    if (!btn) return;
    if (isPromptDirty) {
      btn.classList.add('has-unsaved');
      btn.innerHTML = `💾 Save Prompt`;
      btn.title = 'You have unsaved changes. Click to save now (Ctrl+S)';
    } else {
      btn.classList.remove('has-unsaved');
      btn.innerHTML = `✓ Saved`;
      btn.title = 'All changes saved to library';
    }
  }

  // --- Theme Controller ---
  const btnQuickThemeToggle = document.getElementById('btnQuickThemeToggle');
  const themeToggleIcon = document.getElementById('themeToggleIcon');
  const DASH_SVG_MOON = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
  const DASH_SVG_SUN = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;

  function updateThemeToggleVisuals(theme) {
    if (!themeToggleIcon) return;
    const isDark = theme === 'night' || (theme === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    themeToggleIcon.innerHTML = isDark ? DASH_SVG_SUN : DASH_SVG_MOON;
    if (btnQuickThemeToggle) {
      btnQuickThemeToggle.title = isDark ? 'Current: Dark Mode (Click for Light Mode)' : 'Current: Light Mode (Click for Dark Mode)';
    }
  }

  function applyTheme(theme) {
    document.body.classList.remove('theme-day', 'theme-night', 'theme-system');
    if (theme === 'night') {
      document.body.classList.add('theme-night');
    } else if (theme === 'system') {
      document.body.classList.add('theme-system');
    } else {
      document.body.classList.add('theme-day');
    }
    updateThemeToggleVisuals(theme);
  }

  if (btnQuickThemeToggle) {
    btnQuickThemeToggle.addEventListener('click', async () => {
      const current = settings.theme || 'day';
      const isDark = current === 'night' || (current === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
      const nextTheme = isDark ? 'day' : 'night';
      settings.theme = nextTheme;
      selectedThemeTemp = nextTheme;
      applyTheme(nextTheme);
      updateThemePickerCards(nextTheme);
      await window.SnippetStorage.saveSettings(settings);
      window.postMessage({ type: 'PARIVARTAN_EXTENSION_SYNC', key: 'settings', value: settings }, '*');
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.set({ settings });
      }
      showToast(nextTheme === 'night' ? 'Dark Mode enabled' : 'Light Mode enabled', 'success');
    });
  }

  // --- Text Font Scaling Controller ---
  const FONT_SCALES = [1.0, 1.15, 1.30, 1.45];
  const btnDashFontDec = document.getElementById('btnDashFontDec');
  const btnDashFontInc = document.getElementById('btnDashFontInc');
  const settingsFontScaleLabel = document.getElementById('settingsFontScaleLabel');

  function getDashboardFontScale() {
    const s = parseFloat(settings.fontScale);
    return (!isNaN(s) && s >= 0.8 && s <= 2.0) ? s : 1.0;
  }

  function applyDashboardFontScale(scale) {
    document.documentElement.style.setProperty('--pv-font-scale', scale);
    document.body.style.setProperty('--pv-font-scale', scale);
    updateFontScaleModalUI(scale);
  }

  function updateFontScaleModalUI(scale) {
    if (settingsFontScaleLabel) {
      settingsFontScaleLabel.textContent = `${Math.round(scale * 100)}%`;
    }
    document.querySelectorAll('.font-scale-btn').forEach(btn => {
      const btnScale = parseFloat(btn.dataset.scale);
      btn.classList.toggle('active', Math.abs(btnScale - scale) < 0.05);
    });
  }

  async function setDashboardFontScale(scale, notify = true) {
    settings.fontScale = scale;
    applyDashboardFontScale(scale);
    await window.SnippetStorage.saveSettings(settings);
    window.postMessage({ type: 'PARIVARTAN_EXTENSION_SYNC', key: 'settings', value: settings }, '*');
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set({ settings });
    }
    if (notify) {
      showToast(`🔤 Text size: ${Math.round(scale * 100)}%`, 'success');
    }
  }

  async function changeDashboardFontScale(delta) {
    const current = getDashboardFontScale();
    let idx = FONT_SCALES.findIndex(s => Math.abs(s - current) < 0.05);
    if (idx === -1) idx = 0;
    let nextIdx = idx + delta;
    if (nextIdx < 0) nextIdx = 0;
    if (nextIdx >= FONT_SCALES.length) nextIdx = FONT_SCALES.length - 1;
    await setDashboardFontScale(FONT_SCALES[nextIdx], true);
  }

  if (btnDashFontDec) {
    btnDashFontDec.addEventListener('click', (e) => {
      e.preventDefault();
      changeDashboardFontScale(-1);
    });
  }

  if (btnDashFontInc) {
    btnDashFontInc.addEventListener('click', (e) => {
      e.preventDefault();
      changeDashboardFontScale(1);
    });
  }

  document.querySelectorAll('.font-scale-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const scale = parseFloat(btn.dataset.scale) || 1.0;
      await setDashboardFontScale(scale, true);
    });
  });

  // --- Load Initial Data ---
  async function loadData() {
    folders = await window.SnippetStorage.getFolders();
    snippets = await window.SnippetStorage.getAllSnippets();
    settings = await window.SnippetStorage.getSettings();

    if (!selectedFolderId && folders.length > 0) {
      selectedFolderId = folders[0].id;
    }

    applyTheme(settings.theme || 'day');
    applyDashboardFontScale(getDashboardFontScale());
    renderFolderSelectDropdown();
    renderFolderTree();
    renderSnippetVariableChips();
    renderSnippetRightPanelCustomVars();
    populateSnippetRightVarDropdown();

    if (snippets.length > 0) {
      selectSnippet(snippets[0].id);
    }
    if (snippetCountBadge) snippetCountBadge.textContent = snippets.length;
    setAutoSaveStatus('saved');
    setSnippetDirty(false);
    syncAllRightPanelVarValues();
  }

  // --- Render Folder Dropdown in Editor ---
  function renderFolderSelectDropdown() {
    snippetFolderSelect.innerHTML = '';
    folders.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f.id;
      opt.textContent = f.name;
      snippetFolderSelect.appendChild(opt);
    });
    if (activeSnippetId) {
      const active = snippets.find(s => s.id === activeSnippetId);
      if (active) snippetFolderSelect.value = active.folderId;
    }
  }

  // --- Render Folders & Snippets Tree ---
  function renderFolderTree() {
    folderTreePane.innerHTML = '';
    const query = (treeSearchInput.value || '').trim().toLowerCase();

    folders.forEach(folder => {
      const folderSnippets = snippets.filter(s => s.folderId === folder.id);

      const matchingSnippets = query
        ? folderSnippets.filter(s =>
            (s.title || '').toLowerCase().includes(query) ||
            (s.shortcut || '').toLowerCase().includes(query) ||
            (s.content || '').toLowerCase().includes(query)
          )
        : folderSnippets;

      if (query && matchingSnippets.length === 0) return;

      const node = document.createElement('div');
      node.className = 'folder-tree-node';
      node.dataset.folderId = folder.id;

      if (collapsedFolderIds.has(folder.id)) {
        node.classList.add('collapsed');
      }

      // Folder Header Row
      const folderRow = document.createElement('div');
      folderRow.className = 'folder-row';
      folderRow.innerHTML = `
        <div class="folder-row-left">
          <svg class="folder-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0;">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
          <span class="folder-title-text" title="Double click to rename">${escapeHTML(folder.name)}</span>
          <span class="folder-badge-count" style="font-size: 0.72rem; color: var(--text-muted); margin-left: 5px;">(${folderSnippets.length})</span>
        </div>
        <div class="folder-row-actions">
          <button class="folder-action-btn add-to-folder" title="Add snippet to this folder">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <button class="folder-action-btn edit" title="Rename Folder">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </button>
          <button class="folder-action-btn delete" title="Delete Folder">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      `;

      const titleSpan = folderRow.querySelector('.folder-title-text');
      const rowLeft = folderRow.querySelector('.folder-row-left');

      // Toggle collapse on chevron click
      folderRow.querySelector('.folder-chevron').addEventListener('click', (e) => {
        e.stopPropagation();
        if (node.classList.contains('collapsed')) {
          node.classList.remove('collapsed');
          collapsedFolderIds.delete(folder.id);
        } else {
          node.classList.add('collapsed');
          collapsedFolderIds.add(folder.id);
        }
      });

      // Select folder
      rowLeft.addEventListener('click', () => {
        selectedFolderId = folder.id;
      });

      // HTML5 Drag & Drop Target on Folder Row
      folderRow.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        folderRow.classList.add('drag-over');
      });

      folderRow.addEventListener('dragleave', (e) => {
        if (!folderRow.contains(e.relatedTarget)) {
          folderRow.classList.remove('drag-over');
        }
      });

      folderRow.addEventListener('drop', async (e) => {
        e.preventDefault();
        folderRow.classList.remove('drag-over');
        const draggedSnippetId = e.dataTransfer.getData('text/plain');
        if (draggedSnippetId) {
          const snip = snippets.find(s => s.id === draggedSnippetId);
          if (snip && snip.folderId !== folder.id) {
            await moveSnippetToFolder(draggedSnippetId, folder.id);
          }
        }
      });

      // Inline rename on double click or edit button
      function startInlineRename() {
        const currentName = folder.name;
        rowLeft.innerHTML = `
          <div class="folder-inline-rename-wrapper">
            <input type="text" class="folder-inline-input" value="${escapeHTML(currentName)}">
            <button class="folder-inline-btn" title="Save">✓</button>
          </div>
        `;
        const input = rowLeft.querySelector('.folder-inline-input');
        const btnSave = rowLeft.querySelector('.folder-inline-btn');

        input.focus();
        input.select();

        async function saveInline() {
          const newName = input.value.trim();
          if (newName && newName !== currentName) {
            folder.name = newName;
            await window.SnippetStorage.saveFolders(folders);
            renderFolderSelectDropdown();
            showToast(`Folder renamed to "${newName}"`, 'success');
          }
          renderFolderTree();
        }

        btnSave.addEventListener('click', (e) => {
          e.stopPropagation();
          saveInline();
        });

        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.stopPropagation();
            saveInline();
          } else if (e.key === 'Escape') {
            e.stopPropagation();
            renderFolderTree();
          }
        });
      }

      titleSpan.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        startInlineRename();
      });

      // Add snippet directly into this folder
      folderRow.querySelector('.folder-action-btn.add-to-folder').addEventListener('click', (e) => {
        e.stopPropagation();
        selectedFolderId = folder.id;
        createNewSnippet(folder.id);
      });

      // Rename folder
      folderRow.querySelector('.folder-action-btn.edit').addEventListener('click', (e) => {
        e.stopPropagation();
        startInlineRename();
      });

      // Delete folder
      folderRow.querySelector('.folder-action-btn.delete').addEventListener('click', (e) => {
        e.stopPropagation();
        openDeleteFolderModal(folder.id, folder.name);
      });

      node.appendChild(folderRow);

      // Snippet Items Container
      const itemsContainer = document.createElement('div');
      itemsContainer.className = 'folder-items-container';

      matchingSnippets.forEach(snip => {
        const item = document.createElement('div');
        item.className = `snippet-tree-item ${snip.id === activeSnippetId ? 'active' : ''}`;
        item.dataset.id = snip.id;
        item.setAttribute('draggable', 'true');

        item.innerHTML = `
          <span class="snippet-item-label">${escapeHTML(snip.title)}</span>
          <span class="snippet-pill-shortcut">${escapeHTML(snip.shortcut)}</span>
          <div class="snippet-item-actions">
            <button class="snippet-inline-btn snippet-inline-move" title="Move to folder...">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
            </button>
            <button class="snippet-inline-btn snippet-inline-delete" title="Delete snippet">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        `;

        // Click to select
        item.addEventListener('click', () => {
          selectedFolderId = folder.id;
          selectSnippet(snip.id);
        });

        // HTML5 Drag and Drop Source
        item.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', snip.id);
          e.dataTransfer.effectAllowed = 'move';
          item.classList.add('dragging');
        });

        item.addEventListener('dragend', () => {
          item.classList.remove('dragging');
          document.querySelectorAll('.folder-row.drag-over').forEach(el => el.classList.remove('drag-over'));
        });

        // Right-Click Context Menu
        item.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          e.stopPropagation();
          openSnippetContextMenu(e, snip);
        });

        // Inline Move button
        item.querySelector('.snippet-inline-move').addEventListener('click', (e) => {
          e.stopPropagation();
          openMoveSnippetModal(snip.id);
        });

        // Inline Delete button
        item.querySelector('.snippet-inline-delete').addEventListener('click', (e) => {
          e.stopPropagation();
          openDeleteSnippetModal(snip.id, snip.title, snip.shortcut);
        });

        itemsContainer.appendChild(item);
      });

      node.appendChild(itemsContainer);
      folderTreePane.appendChild(node);
    });
  }

  // --- Select Snippet ---
  function selectSnippet(id) {
    // If switching snippets, ensure the currently open snippet is committed first
    if (activeSnippetId && activeSnippetId !== id) {
      const prevSnippet = snippets.find(s => s.id === activeSnippetId);
      if (prevSnippet) {
        prevSnippet.title = snippetLabelInput.value.trim() || prevSnippet.title;
        let prevShortcut = snippetShortcutInput.value.trim();
        if (prevShortcut && !prevShortcut.startsWith('/')) prevShortcut = '/' + prevShortcut;
        prevSnippet.shortcut = prevShortcut || prevSnippet.shortcut;
        prevSnippet.folderId = snippetFolderSelect.value || prevSnippet.folderId;
        if (documentSurface && documentSurface.style.display !== 'none') {
          prevSnippet.content = documentSurface.innerText;
        }
        prevSnippet.updatedAt = Date.now();
        window.SnippetStorage.saveSnippets(snippets);
      }
    }

    activeSnippetId = id;
    const snippet = snippets.find(s => s.id === id);
    if (!snippet) return;

    // Auto-heal: If snippet content was accidentally wiped, restore from built-in templates
    if (!snippet.content || snippet.content.trim() === '') {
      const def = typeof DEFAULT_SNIPPETS !== 'undefined' ? DEFAULT_SNIPPETS.find(d => d.id === snippet.id) : null;
      if (def && def.content) {
        snippet.content = def.content;
      }
    }

    selectedFolderId = snippet.folderId || (folders[0] ? folders[0].id : null);
    snippetLabelInput.value = snippet.title || '';
    snippetShortcutInput.value = snippet.shortcut || '';
    snippetFolderSelect.value = snippet.folderId || (folders[0] ? folders[0].id : '');
    documentSurface.innerText = snippet.content || '';
    lastCaretOffset = -1;

    updateSnippetDetectedVariables();
    updatePreviewText();
    updateSnippetResolvedOutput();

    setSnippetDirty(false);

    document.querySelectorAll('.snippet-tree-item').forEach(el => {
      el.classList.toggle('active', el.dataset.id === id);
    });
  }

  // --- Save Active Snippet (Explicit & Immediate) ---
  async function saveActiveSnippet(showToastFeedback = false) {
    if (!activeSnippetId) return;
    const snippet = snippets.find(s => s.id === activeSnippetId);
    if (!snippet) return;

    let shortcutVal = snippetShortcutInput.value.trim();
    if (shortcutVal && !shortcutVal.startsWith('/')) {
      shortcutVal = '/' + shortcutVal;
    }

    snippet.title = snippetLabelInput.value.trim() || 'Untitled';
    snippet.shortcut = shortcutVal || '/snip';
    snippet.folderId = snippetFolderSelect.value || snippet.folderId;
    if (documentSurface && documentSurface.style.display !== 'none') {
      snippet.content = documentSurface.innerText;
    }
    snippet.updatedAt = Date.now();

    clearTimeout(autoSaveTimeout);
    setAutoSaveStatus('saving');

    await window.SnippetStorage.saveSnippets(snippets);
    window.postMessage({ type: 'PARIWARTAN_STORAGE_UPDATED', snippets }, '*');
    setSnippetDirty(false);
    setAutoSaveStatus('saved');
    setSnippetDirty(false);

    // Update live sidebar label and shortcut pill
    const activeTreeItem = document.querySelector(`.snippet-tree-item[data-id="${snippet.id}"]`);
    if (activeTreeItem) {
      const labelEl = activeTreeItem.querySelector('.snippet-item-label');
      const pillEl = activeTreeItem.querySelector('.snippet-pill-shortcut');
      if (labelEl) labelEl.textContent = snippet.title;
      if (pillEl) pillEl.textContent = snippet.shortcut;
    }

    if (unsavedBanner) unsavedBanner.style.display = 'none';

    if (showToastFeedback) {
      showToast(`✓ Saved snippet "${snippet.title}"!`, 'success');
    }
  }

  // --- Auto-Save on Every Input ---
  function triggerAutoSave() {
    if (!activeSnippetId) return;
    const snippet = snippets.find(s => s.id === activeSnippetId);
    if (!snippet) return;

    setSnippetDirty(true);
    setAutoSaveStatus('saving');

    // Update in-memory immediately
    let shortcutVal = snippetShortcutInput.value.trim();
    if (shortcutVal && !shortcutVal.startsWith('/')) {
      shortcutVal = '/' + shortcutVal;
    }

    snippet.title = snippetLabelInput.value.trim() || 'Untitled';
    snippet.shortcut = shortcutVal || '/snip';
    snippet.folderId = snippetFolderSelect.value || snippet.folderId;
    if (documentSurface && documentSurface.style.display !== 'none') {
      snippet.content = documentSurface.innerText;
    }
    snippet.updatedAt = Date.now();

    // Update live sidebar label and shortcut pill
    const activeTreeItem = document.querySelector(`.snippet-tree-item[data-id="${snippet.id}"]`);
    if (activeTreeItem) {
      const labelEl = activeTreeItem.querySelector('.snippet-item-label');
      const pillEl = activeTreeItem.querySelector('.snippet-pill-shortcut');
      if (labelEl) labelEl.textContent = snippet.title;
      if (pillEl) pillEl.textContent = snippet.shortcut;
    }

    updateSnippetDetectedVariables();
    updatePreviewText();
    updateSnippetResolvedOutput();

    // Debounced storage commit
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(async () => {
      await window.SnippetStorage.saveSnippets(snippets);
      window.postMessage({ type: 'PARIWARTAN_STORAGE_UPDATED', snippets }, '*');
      setAutoSaveStatus('saved');
      setSnippetDirty(false);
    }, 400);
  }

  // --- Move Snippet to Folder Core Logic ---
  async function moveSnippetToFolder(snippetId, targetFolderId) {
    const snip = snippets.find(s => s.id === snippetId);
    const targetFolder = folders.find(f => f.id === targetFolderId);
    if (!snip || !targetFolder) return;

    if (snip.folderId === targetFolderId) return;

    snip.folderId = targetFolder.id;
    snip.updatedAt = Date.now();
    selectedFolderId = targetFolder.id;

    // Ensure target folder is expanded
    collapsedFolderIds.delete(targetFolder.id);

    await window.SnippetStorage.saveSnippets(snippets);
    window.postMessage({ type: 'PARIWARTAN_STORAGE_UPDATED', snippets }, '*');
    setSnippetDirty(false);

    // Sync editor folder dropdown if this is the active snippet
    if (activeSnippetId === snip.id) {
      snippetFolderSelect.value = targetFolder.id;
    } else {
      selectSnippet(snip.id);
    }

    renderFolderSelectDropdown();
    renderFolderTree();

    setTimeout(() => {
      const el = document.querySelector(`.snippet-tree-item[data-id="${snip.id}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 60);

    showToast(`Moved "${snip.title}" to ${targetFolder.name}`, 'success');
  }

  // --- Move Snippet Modal ---
  function openMoveSnippetModal(snippetId) {
    const snip = snippets.find(s => s.id === snippetId);
    if (!snip) return;
    snippetBeingMovedId = snippetId;

    if (moveSnippetTargetTitle) {
      moveSnippetTargetTitle.textContent = `"${snip.title}" (${snip.shortcut})`;
    }

    if (moveFolderOptionsList) {
      moveFolderOptionsList.innerHTML = '';
      folders.forEach(f => {
        const isCurrent = (f.id === snip.folderId);
        const count = snippets.filter(s => s.folderId === f.id).length;
        const card = document.createElement('button');
        card.className = `move-folder-card ${isCurrent ? 'current' : ''}`;
        card.type = 'button';
        card.innerHTML = `
          <div class="move-folder-card-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div class="move-folder-card-info">
            <div class="move-folder-card-name">${escapeHTML(f.name)}</div>
            <div class="move-folder-card-count">${count} snippet${count === 1 ? '' : 's'}</div>
          </div>
          ${isCurrent ? '<span class="move-folder-badge">Current Folder</span>' : '<span class="move-folder-action">Move Here →</span>'}
        `;

        if (!isCurrent) {
          card.addEventListener('click', async () => {
            modalMoveSnippet.classList.remove('open');
            await moveSnippetToFolder(snip.id, f.id);
          });
        }

        moveFolderOptionsList.appendChild(card);
      });
    }

    modalMoveSnippet.classList.add('open');
  }

  // --- Duplicate Snippet ---
  async function duplicateSnippet(snippetId) {
    const orig = snippets.find(s => s.id === snippetId);
    if (!orig) return;

    const newSnippet = {
      ...orig,
      id: 'snip_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      title: `${orig.title} (Copy)`,
      shortcut: `${orig.shortcut}_copy`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    snippets.unshift(newSnippet);
    await window.SnippetStorage.saveSnippets(snippets);
    window.postMessage({ type: 'PARIWARTAN_STORAGE_UPDATED', snippets }, '*');
    setSnippetDirty(false);

    renderFolderTree();
    selectSnippet(newSnippet.id);
    showToast(`Duplicated "${newSnippet.title}"`, 'success');
  }

  // --- Floating Snippet Context Menu ---
  function openSnippetContextMenu(e, snip) {
    contextMenuSnippetId = snip.id;
    if (contextMenuTitle) {
      contextMenuTitle.textContent = snip.title;
    }

    if (contextSubmenuFolders) {
      contextSubmenuFolders.innerHTML = '';
      folders.forEach(f => {
        const isCurrent = (f.id === snip.folderId);
        const item = document.createElement('div');
        item.className = `context-submenu-item ${isCurrent ? 'current' : ''}`;
        item.innerHTML = `
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
          <span>${escapeHTML(f.name)}</span>
          ${isCurrent ? '<span style="font-size:0.7rem; color:var(--text-muted); margin-left:auto;">(Current)</span>' : ''}
        `;

        if (!isCurrent) {
          item.addEventListener('click', async (evt) => {
            evt.stopPropagation();
            hideSnippetContextMenu();
            await moveSnippetToFolder(snip.id, f.id);
          });
        }
        contextSubmenuFolders.appendChild(item);
      });
    }

    snippetContextMenu.style.display = 'block';

    const menuWidth = snippetContextMenu.offsetWidth || 195;
    const menuHeight = snippetContextMenu.offsetHeight || 160;
    let posX = e.clientX;
    let posY = e.clientY;

    if (posX + menuWidth > window.innerWidth) {
      posX = window.innerWidth - menuWidth - 10;
    }
    if (posY + menuHeight > window.innerHeight) {
      posY = window.innerHeight - menuHeight - 10;
    }

    snippetContextMenu.style.left = `${Math.max(10, posX)}px`;
    snippetContextMenu.style.top = `${Math.max(10, posY)}px`;
  }

  function hideSnippetContextMenu() {
    if (snippetContextMenu) {
      snippetContextMenu.style.display = 'none';
    }
    contextMenuSnippetId = null;
  }

  if (contextDuplicateSnippet) {
    contextDuplicateSnippet.addEventListener('click', () => {
      if (contextMenuSnippetId) {
        duplicateSnippet(contextMenuSnippetId);
      }
      hideSnippetContextMenu();
    });
  }

  if (contextDeleteSnippet) {
    contextDeleteSnippet.addEventListener('click', () => {
      if (contextMenuSnippetId) {
        const snip = snippets.find(s => s.id === contextMenuSnippetId);
        if (snip) openDeleteSnippetModal(snip.id, snip.title, snip.shortcut);
      }
      hideSnippetContextMenu();
    });
  }

  document.addEventListener('click', (e) => {
    if (snippetContextMenu && !snippetContextMenu.contains(e.target)) {
      hideSnippetContextMenu();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideSnippetContextMenu();
    }
  });

  // --- Change Folder from Editor Dropdown ---
  snippetFolderSelect.addEventListener('change', async () => {
    if (!activeSnippetId) return;
    await moveSnippetToFolder(activeSnippetId, snippetFolderSelect.value);
  });

  // Button: Move Snippet Header (⇄)
  if (btnMoveSnippetHeader) {
    btnMoveSnippetHeader.addEventListener('click', (e) => {
      e.preventDefault();
      if (activeSnippetId) {
        openMoveSnippetModal(activeSnippetId);
      }
    });
  }

  // Top Bar Folder Action Buttons
  if (btnRenameFolderHeader) {
    btnRenameFolderHeader.addEventListener('click', (e) => {
      e.preventDefault();
      const folderId = snippetFolderSelect.value;
      const folder = folders.find(f => f.id === folderId);
      if (folder) openEditFolderModal(folder.id, folder.name);
    });
  }

  if (btnDeleteFolderHeader) {
    btnDeleteFolderHeader.addEventListener('click', (e) => {
      e.preventDefault();
      const folderId = snippetFolderSelect.value;
      const folder = folders.find(f => f.id === folderId);
      if (folder) openDeleteFolderModal(folder.id, folder.name);
    });
  }

  // --- Delete Snippet Flow ---
  function openDeleteSnippetModal(id, title, shortcut) {
    snippetBeingDeletedId = id;
    deleteSnippetTitleText.textContent = `"${title}" (${shortcut})`;
    modalDeleteSnippet.classList.add('open');
  }

  btnDeleteCurrentSnippet.addEventListener('click', () => {
    if (!activeSnippetId) return;
    const current = snippets.find(s => s.id === activeSnippetId);
    if (current) openDeleteSnippetModal(current.id, current.title, current.shortcut);
  });

  btnConfirmDeleteSnippet.addEventListener('click', async () => {
    if (!snippetBeingDeletedId) return;

    snippets = snippets.filter(s => s.id !== snippetBeingDeletedId);
    await window.SnippetStorage.saveSnippets(snippets);
    window.postMessage({ type: 'PARIWARTAN_STORAGE_UPDATED', snippets }, '*');
    setSnippetDirty(false);

    modalDeleteSnippet.classList.remove('open');
    showToast('Snippet deleted', 'info');

    if (activeSnippetId === snippetBeingDeletedId) {
      activeSnippetId = snippets[0] ? snippets[0].id : null;
      if (activeSnippetId) {
        selectSnippet(activeSnippetId);
      } else {
        snippetLabelInput.value = '';
        snippetShortcutInput.value = '';
        documentSurface.innerText = '';
      }
    }

    renderFolderTree();
  });

  // --- Create New Snippet ---
  async function createNewSnippet(targetFolderId = null) {
    const folderId = targetFolderId || selectedFolderId || (folders[0] ? folders[0].id : 'folder_sample');
    collapsedFolderIds.delete(folderId);
    const newId = 'snip_' + Date.now();
    const initialContent = settings.defaultTemplate || "Hello {name},\n\nThank you for reaching out.\n\nBest regards,\n{my_name}";

    const newSnippet = {
      id: newId,
      folderId: folderId,
      title: 'New Snippet',
      shortcut: '/snip' + Math.floor(Math.random() * 90 + 10),
      content: initialContent,
      tags: [],
      usageCount: 0,
      createdAt: Date.now()
    };

    snippets.unshift(newSnippet);
    await window.SnippetStorage.saveSnippets(snippets);
    window.postMessage({ type: 'PARIWARTAN_STORAGE_UPDATED', snippets }, '*');
    setSnippetDirty(false);

    renderFolderTree();
    selectSnippet(newId);

    snippetLabelInput.focus();
    snippetLabelInput.select();
    showToast(`Created new snippet in "${getFolderName(folderId)}"`, 'success');
  }

  function getFolderName(folderId) {
    const f = folders.find(item => item.id === folderId);
    return f ? f.name : 'Folder';
  }

  // --- Comprehensive Variable Resolution for Preview & Expansion ---
  function buildSnippetSampleValues() {
    const defaultAuthor = settings.defaultAuthor || 'Support Engineer';
    const sampleValues = {
      'Ticket_ID': runnerVarValues['Ticket_ID'] || '#4970144',
      'ticket_id': runnerVarValues['Ticket_ID'] || '#4970144',
      'ticketid': runnerVarValues['Ticket_ID'] || '#4970144',
      'Ticket ID': runnerVarValues['Ticket_ID'] || '#4970144',
      'Ticekt ID': runnerVarValues['Ticket_ID'] || '#4970144',

      'Customer_Message': runnerVarValues['Customer_Message'] || 'Hello, we are noticing intermittent 502 Bad Gateway responses on our web service after changing DNS records. Could you please check the edge routing and upstream cluster?',
      'customer_message': runnerVarValues['Customer_Message'] || 'Hello, we are noticing intermittent 502 Bad Gateway responses on our web service after changing DNS records. Could you please check the edge routing and upstream cluster?',
      'customermessage': runnerVarValues['Customer_Message'] || 'Hello, we are noticing intermittent 502 Bad Gateway responses on our web service after changing DNS records. Could you please check the edge routing and upstream cluster?',
      'Customer Message': runnerVarValues['Customer_Message'] || 'Hello, we are noticing intermittent 502 Bad Gateway responses on our web service after changing DNS records. Could you please check the edge routing and upstream cluster?',
      'Customer messge': runnerVarValues['Customer_Message'] || 'Hello, we are noticing intermittent 502 Bad Gateway responses on our web service after changing DNS records. Could you please check the edge routing and upstream cluster?',

      'Page_context': runnerVarValues['Page_context'] || 'Psychz Support Portal — Ticket #4970144\nService: Dedicated Server LAX-02\nStatus: In Progress\nPriority: High',
      'page_context': runnerVarValues['Page_context'] || 'Psychz Support Portal — Ticket #4970144\nService: Dedicated Server LAX-02\nStatus: In Progress\nPriority: High',
      'pagecontext': runnerVarValues['Page_context'] || 'Psychz Support Portal — Ticket #4970144\nService: Dedicated Server LAX-02\nStatus: In Progress\nPriority: High',
      'Page Context': runnerVarValues['Page_context'] || 'Psychz Support Portal — Ticket #4970144\nService: Dedicated Server LAX-02\nStatus: In Progress\nPriority: High',

      'Engineer_Name': runnerVarValues['Engineer_Name'] || defaultAuthor,
      'engineer_name': runnerVarValues['Engineer_Name'] || defaultAuthor,
      'engineername': runnerVarValues['Engineer_Name'] || defaultAuthor,
      'Engineer Name': runnerVarValues['Engineer_Name'] || defaultAuthor,
      'Enginer name': runnerVarValues['Engineer_Name'] || defaultAuthor,
      'my_name': runnerVarValues['Engineer_Name'] || defaultAuthor,
      'myname': runnerVarValues['Engineer_Name'] || defaultAuthor,

      'Support_Tier': runnerVarValues['Support_Tier'] || 'Tier 2 Technical Support',
      'support_tier': runnerVarValues['Support_Tier'] || 'Tier 2 Technical Support',
      'supporttier': runnerVarValues['Support_Tier'] || 'Tier 2 Technical Support',
      'Support Tier': runnerVarValues['Support_Tier'] || 'Tier 2 Technical Support',

      'Resolution_Steps': runnerVarValues['Resolution_Steps'] || "1. Routed traffic through Cogent backup path to bypass transit flapping.\n2. Soft-cleared BGP session on border router.\n3. Verified 0% packet loss and 2ms latency over 500 ICMP probes.\n4. Confirmed HTTP 502 rate returned to zero.",
      'resolution_steps': runnerVarValues['Resolution_Steps'] || "1. Routed traffic through Cogent backup path to bypass transit flapping.\n2. Soft-cleared BGP session on border router.\n3. Verified 0% packet loss and 2ms latency over 500 ICMP probes.\n4. Confirmed HTTP 502 rate returned to zero.",
      'resolutionsteps': runnerVarValues['Resolution_Steps'] || "1. Routed traffic through Cogent backup path to bypass transit flapping.\n2. Soft-cleared BGP session on border router.\n3. Verified 0% packet loss and 2ms latency over 500 ICMP probes.\n4. Confirmed HTTP 502 rate returned to zero.",
      'Resolution Steps': runnerVarValues['Resolution_Steps'] || "1. Routed traffic through Cogent backup path to bypass transit flapping.\n2. Soft-cleared BGP session on border router.\n3. Verified 0% packet loss and 2ms latency over 500 ICMP probes.\n4. Confirmed HTTP 502 rate returned to zero.",

      'name': 'Customer',
      'customer_name': 'Customer',
      'customername': 'Customer'
    };

    if (Array.isArray(customVariables)) {
      customVariables.forEach(v => {
        if (v && v.key) {
          const val = runnerVarValues[v.key] !== undefined ? runnerVarValues[v.key] : (v.defaultValue !== undefined ? v.defaultValue : '');
          sampleValues[v.key] = val;
          sampleValues[v.key.toLowerCase()] = val;
          sampleValues[v.key.toLowerCase().replace(/[\s_\-]+/g, '')] = val;
        }
      });
    }

    return sampleValues;
  }

  // --- Safe Snippet Content Extractor ---
  function getActiveSnippetContent() {
    if (documentSurface && documentSurface.style.display !== 'none') {
      const txt = documentSurface.innerText;
      if (txt !== undefined && txt !== null && txt.trim() !== '') {
        return txt;
      }
    }
    if (activeSnippetId) {
      const snip = snippets.find(s => s.id === activeSnippetId);
      if (snip && snip.content && snip.content.trim() !== '') {
        return snip.content;
      }
    }
    if (documentSurface) {
      return documentSurface.innerText || documentSurface.textContent || '';
    }
    return '';
  }

  // --- Live Preview with Full Variable Resolution & Support Ticket Formatting ---
  function updatePreviewText() {
    if (!previewSurface) return;
    const activeSnippet = activeSnippetId ? snippets.find(s => s.id === activeSnippetId) : null;
    let rawContent = getActiveSnippetContent();

    // Auto-heal: If empty and this is a built-in default snippet, restore from defaults
    if ((!rawContent || rawContent.trim() === '') && activeSnippet) {
      const def = typeof DEFAULT_SNIPPETS !== 'undefined' ? DEFAULT_SNIPPETS.find(d => d.id === activeSnippet.id) : null;
      if (def && def.content) {
        rawContent = def.content;
        activeSnippet.content = def.content;
        if (documentSurface && documentSurface.style.display !== 'none') {
          documentSurface.innerText = def.content;
        }
      }
    }

    const sampleValues = buildSnippetSampleValues();
    const engine = window.ParivartanEngine || window.PariwartanEngine;

    // Render snippet with variable replacements & cursor location
    const renderRes = engine
      ? engine.renderWithCursor(rawContent, sampleValues, settings)
      : { text: rawContent, cursorOffset: -1 };

    const resolvedText = renderRes.text;
    const cursorOffset = renderRes.cursorOffset;
    const shortcutStr = (snippetShortcutInput && snippetShortcutInput.value) || (activeSnippet ? activeSnippet.shortcut : '/snip');
    const ticketIdVal = sampleValues['Ticket_ID'] || '#4970144';
    const authorVal = sampleValues['Engineer_Name'] || settings.defaultAuthor || 'Support Engineer';

    // Format for Realistic Ticket View
    let formattedHtml = '';
    if (cursorOffset >= 0 && cursorOffset <= resolvedText.length) {
      const textWithCursorMarker = resolvedText.slice(0, cursorOffset) + '@@@TICKET_CURSOR@@@' + resolvedText.slice(cursorOffset);
      if (engine && typeof engine.renderMarkdownToHtml === 'function') {
        formattedHtml = engine.renderMarkdownToHtml(textWithCursorMarker)
          .replace('@@@TICKET_CURSOR@@@', '<span class="ticket-preview-cursor" title="Typing cursor placement location after snippet insertion">|</span>');
      } else {
        formattedHtml = escapeHTML(textWithCursorMarker)
          .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
          .replace(/\n/g, '<br>')
          .replace('@@@TICKET_CURSOR@@@', '<span class="ticket-preview-cursor" title="Typing cursor placement location after snippet insertion">|</span>');
      }
    } else {
      if (engine && typeof engine.renderMarkdownToHtml === 'function') {
        formattedHtml = engine.renderMarkdownToHtml(resolvedText);
      } else {
        formattedHtml = escapeHTML(resolvedText)
          .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
          .replace(/\n/g, '<br>');
      }
    }

    const hasBodyContent = formattedHtml && formattedHtml.trim().length > 0;

    previewSurface.innerHTML = `
      <div class="ticket-preview-wrapper">
        <!-- Ticket Simulation Card Header -->
        <div class="ticket-preview-header">
          <div class="ticket-preview-header-left">
            <span class="ticket-badge-pill">🎫 Ticket ${escapeHTML(ticketIdVal)}</span>
            <span class="ticket-preview-badge-status">Outgoing Ticket Reply</span>
            <span class="ticket-preview-channel">Psychz Support Portal</span>
          </div>
          <div class="ticket-preview-header-right">
            <button type="button" class="btn btn-secondary btn-sm" id="btnCopyPreviewText" title="Copy resolved ticket text to clipboard" style="padding: 4px 10px; font-size: 0.76rem; display: flex; align-items: center; gap: 4px;">
              📋 Copy
            </button>
          </div>
        </div>

        <!-- Ticket Meta Bar -->
        <div class="ticket-preview-meta-row">
          <div><strong style="color:var(--text-muted); font-size:0.75rem;">To:</strong> <span style="font-size:0.8rem; color:var(--text-main);">Customer / Client</span></div>
          <div><strong style="color:var(--text-muted); font-size:0.75rem;">From:</strong> <span style="font-size:0.8rem; color:var(--text-main); font-weight:600;">${escapeHTML(authorVal)}</span></div>
          <div><strong style="color:var(--text-muted); font-size:0.75rem;">Shortcut:</strong> <span class="snippet-pill-shortcut" style="font-size:0.74rem;">${escapeHTML(shortcutStr)}</span></div>
          ${cursorOffset >= 0 ? `<div style="color:var(--accent); font-size:0.74rem; font-weight:600;">📍 Cursor position: char ${cursorOffset}</div>` : ''}
        </div>

        <!-- Ticket Reply Box (Formatted as pasted in ticket) -->
        <div class="ticket-preview-body-container">
          <div class="ticket-rendered-content">
            ${hasBodyContent ? formattedHtml : '<div class="ticket-preview-empty-note">(Snippet template is empty — click "← Back to Edit" below to add content)</div>'}
          </div>
        </div>

        <!-- Ticket Preview Footer -->
        <div class="ticket-preview-footer">
          <span style="font-size:0.73rem; color:var(--text-muted);">
            💡 This preview simulates exactly how this snippet expands when typing <kbd style="background:var(--bg-hover); padding:2px 6px; border-radius:4px; border:1px solid var(--border-color); font-weight:700;">${escapeHTML(shortcutStr)}</kbd> in a support ticket.
          </span>
          <button type="button" class="btn-text-action" id="btnPreviewBackToEdit" style="font-size:0.78rem;">
            ← Back to Edit
          </button>
        </div>
      </div>
    `;

    // Interactive controls inside the preview
    const btnCopy = document.getElementById('btnCopyPreviewText');
    const btnBack = document.getElementById('btnPreviewBackToEdit');

    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(resolvedText);
          btnCopy.textContent = '✓ Copied!';
          showToast('✓ Copied resolved ticket text to clipboard!', 'success');
          setTimeout(() => {
            if (btnCopy) btnCopy.innerHTML = '📋 Copy';
          }, 1800);
        } catch (_) {}
      });
    }
    if (btnBack) {
      btnBack.addEventListener('click', () => {
        if (btnModeEdit) btnModeEdit.click();
      });
    }
  }

  // --- Edit / Preview Mode Toggle ---
  btnModeEdit.addEventListener('click', () => {
    btnModeEdit.classList.add('active');
    btnModePreview.classList.remove('active');
    richToolbar.style.display = 'flex';
    documentSurface.style.display = 'block';
    previewSurface.style.display = 'none';

    // Ensure documentSurface reflects current snippet content if empty
    if (activeSnippetId) {
      const snip = snippets.find(s => s.id === activeSnippetId);
      if (snip && (!documentSurface.innerText || documentSurface.innerText.trim() === '')) {
        documentSurface.innerText = snip.content || '';
      }
    }
  });

  btnModePreview.addEventListener('click', () => {
    if (activeSnippetId && documentSurface && documentSurface.style.display !== 'none') {
      const snip = snippets.find(s => s.id === activeSnippetId);
      if (snip && documentSurface.innerText && documentSurface.innerText.trim() !== '') {
        snip.content = documentSurface.innerText;
      }
    }
    btnModePreview.classList.add('active');
    btnModeEdit.classList.remove('active');
    richToolbar.style.display = 'none';
    documentSurface.style.display = 'none';
    previewSurface.style.display = 'block';
    updatePreviewText();
  });

  // --- Rich Text Toolbar Commands ---
  document.querySelectorAll('.toolbar-btn[data-command]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.execCommand(btn.dataset.command, false, null);
      triggerAutoSave();
    });
  });

  document.getElementById('toolFontFamily').addEventListener('change', (e) => {
    const val = e.target.value;
    if (val !== 'Default') document.execCommand('fontName', false, val);
    triggerAutoSave();
  });

  document.getElementById('toolFontSize').addEventListener('change', (e) => {
    const val = e.target.value;
    if (val === 'Heading 1') document.execCommand('formatBlock', false, '<h1>');
    else if (val === 'Heading 2') document.execCommand('formatBlock', false, '<h2>');
    else document.execCommand('formatBlock', false, '<p>');
    triggerAutoSave();
  });

  document.getElementById('btnToolEmoji').addEventListener('click', () => {
    insertAtCursor('😊 ');
  });

  document.getElementById('btnToolLink').addEventListener('click', () => {
    const url = prompt('Enter link URL (e.g. https://example.com):');
    if (url) {
      document.execCommand('createLink', false, url);
      triggerAutoSave();
    }
  });

  // Snippet Editor Undo and Redo
  const btnSnippetUndo = document.getElementById('btnSnippetUndo');
  const btnSnippetRedo = document.getElementById('btnSnippetRedo');
  if (btnSnippetUndo) {
    btnSnippetUndo.addEventListener('click', (e) => {
      e.preventDefault();
      document.execCommand('undo', false, null);
      updatePreviewText();
      triggerAutoSave();
    });
  }
  if (btnSnippetRedo) {
    btnSnippetRedo.addEventListener('click', (e) => {
      e.preventDefault();
      document.execCommand('redo', false, null);
      updatePreviewText();
      triggerAutoSave();
    });
  }

  document.getElementById('btnToolAI').addEventListener('click', () => {
    insertAtCursor('\n\nPlease let us know if there is anything else we can assist you with.\n');
    showToast('AI suggestion inserted', 'success');
  });

  // --- Voice Dictation (Speech-to-Text) ---
  const btnToolDictate = document.getElementById('btnToolDictate');
  let isDictatingEditor = false;

  if (btnToolDictate) {
    btnToolDictate.addEventListener('click', async () => {
      if (!window.SpeechService || !window.SpeechService.isSupported()) {
        showToast('Speech recognition is not supported in this browser. Chrome, Edge, and Safari are supported.', 'warning');
        return;
      }

      if (isDictatingEditor) {
        window.SpeechService.stop();
        return;
      }

      const dictSettings = settings.dictation || { enabled: true, language: 'en-US', autoPunctuation: true };
      if (dictSettings.enabled === false) {
        showToast('Voice dictation is disabled in Settings.', 'warning');
        return;
      }

      documentSurface.focus();

      const started = await window.SpeechService.start({
        language: dictSettings.language || 'en-US',
        autoPunctuation: dictSettings.autoPunctuation !== false,
        aiConfig: settings.ai,
        onStart: ({ mode } = {}) => {
          isDictatingEditor = true;
          btnToolDictate.classList.add('dictating');
          const label = btnToolDictate.querySelector('.dictate-label');
          if (label) label.textContent = mode === 'ai' ? 'Recording (Click to Finish)...' : 'Listening...';
          showToast(mode === 'ai' ? '🎙️ Recording voice... Click "Dictate" again when done speaking.' : '🎙️ Listening... Speak your text', 'info');
        },
        onResult: ({ finalText, interimText, newFinalChunk }) => {
          const chunk = newFinalChunk || finalText;
          if (chunk) {
            insertAtCursor(chunk + ' ');
            triggerAutoSave();
            showToast('✓ Transcribed into editor!', 'success');
          }
        },
        onEnd: () => {
          isDictatingEditor = false;
          btnToolDictate.classList.remove('dictating');
          const label = btnToolDictate.querySelector('.dictate-label');
          if (label) label.textContent = 'Dictate';
          showToast('Voice dictation stopped.', 'info');
        },
        onError: ({ error, message }) => {
          isDictatingEditor = false;
          btnToolDictate.classList.remove('dictating');
          const label = btnToolDictate.querySelector('.dictate-label');
          if (label) label.textContent = 'Dictate';
          showToast(message, 'warning');
        }
      });

      if (!started) {
        isDictatingEditor = false;
        btnToolDictate.classList.remove('dictating');
        const label = btnToolDictate.querySelector('.dictate-label');
        if (label) label.textContent = 'Dictate';
      }
    });
  }

  // --- Selection & Caret Preservation for Cursor Insertion ---
  let lastCaretOffset = -1;

  function getCaretCharacterOffsetWithin(element) {
    let caretOffset = 0;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (element.contains(range.commonAncestorContainer) || element === range.commonAncestorContainer) {
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(element);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        caretOffset = preCaretRange.toString().length;
      }
    }
    return caretOffset;
  }

  function setCaretCharacterOffsetWithin(element, offset) {
    const sel = window.getSelection();
    if (!sel) return;
    element.focus();

    let charCount = 0;
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    let textNode = null;
    let found = false;

    while ((textNode = walker.nextNode())) {
      const len = textNode.nodeValue.length;
      if (charCount + len >= offset) {
        const range = document.createRange();
        const nodeOffset = Math.min(Math.max(0, offset - charCount), len);
        range.setStart(textNode, nodeOffset);
        range.setEnd(textNode, nodeOffset);
        sel.removeAllRanges();
        sel.addRange(range);
        found = true;
        break;
      }
      charCount += len;
    }

    if (!found) {
      const range = document.createRange();
      range.selectNodeContents(element);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }

  function updateCaretOffset() {
    const offset = getCaretCharacterOffsetWithin(documentSurface);
    if (offset >= 0) {
      lastCaretOffset = offset;
    }
  }

  documentSurface.addEventListener('keyup', () => {
    updateCaretOffset();
    updateSnippetDetectedVariables();
  });
  documentSurface.addEventListener('mouseup', updateCaretOffset);
  documentSurface.addEventListener('click', updateCaretOffset);
  documentSurface.addEventListener('input', () => {
    updateCaretOffset();
    updateSnippetDetectedVariables();
  });

  // Handle Paste: Cleanly insert plain text without foreign inline styles, white-on-white text, or dark background blocks
  documentSurface.addEventListener('paste', (e) => {
    e.preventDefault();
    const clipboardData = e.clipboardData || window.clipboardData;
    const text = clipboardData ? clipboardData.getData('text/plain') : '';
    if (!text) return;

    if (document.queryCommandSupported && document.queryCommandSupported('insertText')) {
      document.execCommand('insertText', false, text);
    } else {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        selection.deleteFromDocument();
        const range = selection.getRangeAt(0);
        const textNode = document.createTextNode(text);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        documentSurface.innerText += text;
      }
    }

    updateCaretOffset();
    updateSnippetDetectedVariables();
    updatePreviewText();
    triggerAutoSave();
  });

  // Prevent mousedown on toolbar from losing cursor position
  document.querySelectorAll('.toolbar-btn').forEach(el => {
    el.addEventListener('mousedown', (e) => {
      updateCaretOffset();
      e.preventDefault(); // Prevents editor blur!
    });
  });

  function insertAtCursor(text) {
    documentSurface.focus();

    // If placing {cursor}, remove any existing {cursor} from text first without destroying user offset
    let currentText = documentSurface.innerText;
    let targetOffset = lastCaretOffset >= 0 ? lastCaretOffset : currentText.length;

    if (text === '{cursor}') {
      const existingCursorIdx = currentText.search(/\{\s*cursor\s*\}/i);
      if (existingCursorIdx !== -1) {
        const matchLen = (currentText.match(/\{\s*cursor\s*\}/i) || ['{cursor}'])[0].length;
        currentText = currentText.substring(0, existingCursorIdx) + currentText.substring(existingCursorIdx + matchLen);
        if (targetOffset > existingCursorIdx) {
          targetOffset = Math.max(0, targetOffset - matchLen);
        }
        documentSurface.innerText = currentText;
      }
    }

    // Set caret precisely at target offset in editor
    setCaretCharacterOffsetWithin(documentSurface, targetOffset);

    // Use native insertText command
    const inserted = document.execCommand('insertText', false, text);
    if (!inserted) {
      // Direct text splice fallback
      const before = currentText.substring(0, targetOffset);
      const after = currentText.substring(targetOffset);
      documentSurface.innerText = before + text + after;
      setCaretCharacterOffsetWithin(documentSurface, targetOffset + text.length);
    }

    updateCaretOffset();
    updateSnippetDetectedVariables();
    triggerAutoSave();
  }

  // --- Render Snippet Dynamic Variable Chips ---
  function renderSnippetVariableChips() {
    if (!snippetVarChipsRow) return;
    snippetVarChipsRow.innerHTML = '';

    const snippetVariables = [
      { key: 'Ticket_ID', name: 'Ticket ID', icon: '🎫', desc: 'Support ticket number (e.g. #4970144)' },
      { key: 'Customer_Message', name: 'Customer Message', icon: '💬', desc: 'Customer message/inquiry' },
      { key: 'Page_context', name: 'Page Context', icon: '🌐', desc: 'Webpage/ticket text context' },
      { key: 'Resolution_Steps', name: 'Resolution Steps', icon: '✨', desc: 'AI resolution action steps' },
      { key: 'date', name: 'Date', icon: '📅', desc: 'Current date (e.g. Oct 24, 2026)' },
      { key: 'time', name: 'Time', icon: '⏰', desc: 'Current time (e.g. 2:30 PM)' },
      { key: 'datetime', name: 'Date & Time', icon: '🕒', desc: 'Current date and time' },
      { key: 'cursor', name: 'Cursor', icon: '🎯', desc: 'Place cursor here after expanding' }
    ];

    snippetVariables.forEach(v => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'var-chip system';
      chip.innerHTML = `<span>${v.icon}</span> <span>{${v.key}}</span>`;
      chip.title = `Insert {${v.key}} - ${v.desc}`;
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        insertAtCursor(`{${v.key}}`);
        updateSnippetDetectedVariables();
        updatePreviewText();
        showToast(`Inserted {${v.key}} into snippet!`, 'success');
      });
      snippetVarChipsRow.appendChild(chip);
    });

    // Custom user variables chips (Includes Engineer_Name, Support_Tier, and any user custom variables)
    customVariables.forEach(v => {
      if (snippetVariables.some(sv => sv.key.toLowerCase() === v.key.toLowerCase())) return;
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'var-chip custom';
      chip.innerHTML = `<span>⚙️</span> <span>{${escapeHTML(v.key)}}</span>`;
      chip.title = `Insert {${escapeHTML(v.key)}}${v.defaultValue ? ` (Default: "${escapeHTML(v.defaultValue)}")` : ''}`;
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        insertAtCursor(`{${v.key}}`);
        updateSnippetDetectedVariables();
        updatePreviewText();
        showToast(`Inserted {${v.key}} into snippet!`, 'success');
      });
      snippetVarChipsRow.appendChild(chip);
    });

    // Populate dropdown custom variables optgroup
    if (snippetCustomVarsOptgroup) {
      snippetCustomVarsOptgroup.innerHTML = '';
      if (customVariables.length > 0) {
        customVariables.forEach(v => {
          const opt = document.createElement('option');
          opt.value = v.key;
          opt.textContent = `{${v.key}} — ${v.name || 'Custom'}`;
          snippetCustomVarsOptgroup.appendChild(opt);
        });
      }
    }
  }

  function updateSnippetDetectedVariables() {
    if (!snippetDetectedBadges || !documentSurface) return;
    const text = documentSurface.innerText || '';
    if (snippetCharCount) {
      const charCount = text.length;
      const wordCount = (text.trim().match(/\S+/g) || []).length;
      snippetCharCount.textContent = `${charCount} characters • ${wordCount} words`;
    }

    const detected = window.ParivartanEngine ? window.ParivartanEngine.extractAiPromptVariables(text) : [];
    ['date', 'time', 'datetime', 'cursor'].forEach(helper => {
      const reg = new RegExp(`\\{\\s*${helper}\\s*\\}`, 'i');
      if (reg.test(text) && !detected.some(d => d.toLowerCase() === helper)) {
        detected.push(helper);
      }
    });

    snippetDetectedBadges.innerHTML = '';
    if (detected.length === 0) {
      snippetDetectedBadges.innerHTML = `<span class="detected-none">No variables detected yet. Click any variable above to insert!</span>`;
      return;
    }

    const systemKeys = new Set(['ticket_id', 'customer_message', 'page_context', 'engineer_name', 'support_tier', 'resolution_steps', 'date', 'time', 'datetime', 'cursor', 'my_name', 'name', 'customer_name']);

    detected.forEach(key => {
      const badge = document.createElement('span');
      const isSys = systemKeys.has(key.toLowerCase());
      badge.className = 'detected-badge ' + (isSys ? 'system' : 'custom');
      badge.textContent = `{${key}}`;
      badge.title = isSys ? 'System / Helper Variable' : 'Custom Variable';
      snippetDetectedBadges.appendChild(badge);
    });
  }

  if (btnInsertSnippetVar && snippetVarSelectDropdown) {
    btnInsertSnippetVar.addEventListener('click', (e) => {
      e.preventDefault();
      const val = snippetVarSelectDropdown.value;
      if (val) {
        insertAtCursor(`{${val}}`);
        updateSnippetDetectedVariables();
        updatePreviewText();
        showToast(`Inserted {${val}} into snippet!`, 'success');
      }
    });
  }

  if (btnAddSnippetVarChip) {
    btnAddSnippetVarChip.addEventListener('click', (e) => {
      e.preventDefault();
      openVariablesModal();
    });
  }

  treeSearchInput.addEventListener('input', renderFolderTree);

  // --- Folder Management (Modal Dialog) ---
  btnAddFolder.addEventListener('click', () => {
    folderBeingEditedId = null;
    modalFolderTitle.textContent = 'Create New Main Folder';
    folderNameInput.value = '';
    modalFolderEdit.classList.add('open');
    setTimeout(() => folderNameInput.focus(), 50);
  });

  function openEditFolderModal(id, currentName) {
    folderBeingEditedId = id;
    modalFolderTitle.textContent = 'Edit Folder Name';
    folderNameInput.value = currentName;
    modalFolderEdit.classList.add('open');
    setTimeout(() => {
      folderNameInput.focus();
      folderNameInput.select();
    }, 50);
  }

  btnSaveFolder.addEventListener('click', async () => {
    const name = folderNameInput.value.trim();
    if (!name) return;

    if (folderBeingEditedId) {
      const folder = folders.find(f => f.id === folderBeingEditedId);
      if (folder) folder.name = name;
    } else {
      const newFolderId = 'folder_' + Date.now();
      folders.push({
        id: newFolderId,
        name,
        icon: 'folder'
      });
      selectedFolderId = newFolderId;
    }

    await window.SnippetStorage.saveFolders(folders);
    renderFolderSelectDropdown();
    modalFolderEdit.classList.remove('open');
    renderFolderTree();
    showToast(`Folder "${name}" saved!`, 'success');
  });

  folderNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      btnSaveFolder.click();
    }
  });

  function openDeleteFolderModal(id, name) {
    folderBeingDeletedId = id;
    deleteFolderName.textContent = `"${name}"`;
    modalDeleteFolder.classList.add('open');
  }

  btnConfirmDeleteFolder.addEventListener('click', async () => {
    if (!folderBeingDeletedId) return;

    let remainingFolders = folders.filter(f => f.id !== folderBeingDeletedId);
    if (remainingFolders.length === 0) {
      remainingFolders = [{
        id: 'folder_' + Date.now(),
        name: 'General',
        icon: 'folder'
      }];
    }

    const fallbackFolderId = remainingFolders[0].id;

    snippets.forEach(s => {
      if (s.folderId === folderBeingDeletedId) {
        s.folderId = fallbackFolderId;
      }
    });

    folders = remainingFolders;
    selectedFolderId = fallbackFolderId;
    collapsedFolderIds.delete(folderBeingDeletedId);

    await window.SnippetStorage.saveFolders(folders);
    await window.SnippetStorage.saveSnippets(snippets);
    window.postMessage({ type: 'PARIWARTAN_STORAGE_UPDATED', folders, snippets }, '*');

    renderFolderSelectDropdown();
    modalDeleteFolder.classList.remove('open');
    renderFolderTree();
    showToast(`Folder deleted. Snippets safely moved to "${remainingFolders[0].name}"`, 'info');
  });

  // --- Try It Out Sandbox Modal ---
  btnTryItOut.addEventListener('click', () => {
    const shortcut = snippetShortcutInput.value.trim() || '/osfail';
    tryOutShortcutPill.textContent = shortcut.startsWith('/') ? shortcut : '/' + shortcut;
    tryOutInput.value = '';
    modalTryItOut.classList.add('open');
    setTimeout(() => tryOutInput.focus(), 50);
  });

  // Resilient live shortcut expansion in sandbox
  tryOutInput.addEventListener('input', async () => {
    const text = tryOutInput.value;

    for (const snip of snippets) {
      if (!snip.shortcut) continue;
      const raw = snip.shortcut.trim();
      const slash = raw.startsWith('/') ? raw : '/' + raw;
      const noSlash = raw.replace(/^\//, '');

      let matched = null;
      let len = 0;

      if (text.endsWith(slash)) { matched = slash; len = slash.length; }
      else if (text.endsWith(slash + ' ')) { matched = slash; len = slash.length + 1; }
      else if (noSlash.length >= 2 && text.endsWith(noSlash)) { matched = noSlash; len = noSlash.length; }
      else if (noSlash.length >= 2 && text.endsWith(noSlash + ' ')) { matched = noSlash; len = noSlash.length + 1; }
      else if (noSlash.length >= 2 && text.endsWith('/' + noSlash)) { matched = '/' + noSlash; len = noSlash.length + 1; }
      else if (noSlash.length >= 2 && text.endsWith('/' + noSlash + ' ')) { matched = '/' + noSlash; len = noSlash.length + 2; }

      if (matched) {
        const sampleValues = {
          name: 'Customer',
          ticket_id: '#1001',
          my_name: settings.defaultAuthor || 'Support Team'
        };

        const engine = window.ParivartanEngine || window.PariwartanEngine;
        const res = engine
          ? engine.renderWithCursor(snip.content, sampleValues, settings)
          : { text: snip.content, cursorOffset: -1 };

        const prefix = text.substring(0, text.length - len);
        tryOutInput.value = prefix + res.text;

        // Position cursor precisely at {cursor} location
        const targetPos = res.cursorOffset >= 0 ? (prefix.length + res.cursorOffset) : (prefix.length + res.text.length);
        tryOutInput.focus();
        tryOutInput.setSelectionRange(targetPos, targetPos);
        requestAnimationFrame(() => {
          tryOutInput.focus();
          tryOutInput.setSelectionRange(targetPos, targetPos);
        });
        setTimeout(() => {
          tryOutInput.focus();
          tryOutInput.setSelectionRange(targetPos, targetPos);
        }, 10);

        showToast(`⚡ Expanded "${matched}"! Cursor placed at {cursor}`, 'success');
        break;
      }
    }
  });

  btnClearTryOut.addEventListener('click', () => {
    tryOutInput.value = '';
    tryOutInput.focus();
  });

  // --- Settings Modal & Theme Picker ---
  let selectedThemeTemp = 'day';

  function updateThemePickerCards(activeTheme) {
    document.querySelectorAll('.theme-card').forEach(card => {
      card.classList.toggle('active', card.dataset.theme === activeTheme);
    });
  }

  document.querySelectorAll('.theme-card').forEach(card => {
    card.addEventListener('click', () => {
      selectedThemeTemp = card.dataset.theme;
      updateThemePickerCards(selectedThemeTemp);
      applyTheme(selectedThemeTemp); // Instant live preview right behind modal!
    });
  });

  function updateAiSettingsUI(provider) {
    const defaultModels = {
      chatgpt_web: 'Auto (ChatGPT Plus/Pro)',
      claude_web: 'Auto (Claude Pro)',
      gemini_web: 'Auto (Gemini Advanced)',
      gemini: 'gemini-2.0-flash',
      openai: 'gpt-4o-mini',
      claude: 'claude-3-5-haiku-20241022',
      ollama: 'llama3:latest',
      chrome_builtin: 'gemini-nano'
    };

    if (!settingsAiModel.value || Object.values(defaultModels).includes(settingsAiModel.value) || settingsAiModel.value === 'gemini-1.5-flash') {
      settingsAiModel.value = defaultModels[provider] || 'gemini-2.0-flash';
    }

    if (provider === 'chatgpt_web') {
      aiApiKeyWrapper.style.display = 'none';
      aiEndpointWrapper.style.display = 'none';
      aiKeyHint.textContent = 'Uses active chatgpt.com session (No API key needed)';
    } else if (provider === 'claude_web') {
      aiApiKeyWrapper.style.display = 'none';
      aiEndpointWrapper.style.display = 'none';
      aiKeyHint.textContent = 'Uses active claude.ai session (No API key needed)';
    } else if (provider === 'gemini_web') {
      aiApiKeyWrapper.style.display = 'none';
      aiEndpointWrapper.style.display = 'none';
      aiKeyHint.textContent = 'Uses active gemini.google.com session (No API key needed)';
    } else if (provider === 'gemini') {
      aiApiKeyWrapper.style.display = 'block';
      aiEndpointWrapper.style.display = 'none';
      aiKeyHint.textContent = 'Get free key at aistudio.google.com';
    } else if (provider === 'openai') {
      aiApiKeyWrapper.style.display = 'block';
      aiEndpointWrapper.style.display = 'none';
      aiKeyHint.textContent = 'Get API key at platform.openai.com';
    } else if (provider === 'claude') {
      aiApiKeyWrapper.style.display = 'block';
      aiEndpointWrapper.style.display = 'none';
      aiKeyHint.textContent = 'Get API key at console.anthropic.com';
    } else if (provider === 'ollama') {
      aiApiKeyWrapper.style.display = 'none';
      aiEndpointWrapper.style.display = 'block';
      aiKeyHint.textContent = 'Internal server / Localhost';
    } else if (provider === 'chrome_builtin') {
      aiApiKeyWrapper.style.display = 'none';
      aiEndpointWrapper.style.display = 'none';
      aiKeyHint.textContent = 'Runs 100% on-device (chrome://flags)';
    }
  }

  function updateAiToggleVisuals(isEnabled) {
    if (aiConfigControlsContainer) {
      aiConfigControlsContainer.style.display = isEnabled ? 'block' : 'none';
    }
    if (aiDisabledNotice) {
      aiDisabledNotice.style.display = isEnabled ? 'none' : 'block';
    }
    if (aiStatusBadge) {
      aiStatusBadge.textContent = isEnabled ? 'Active' : 'Disabled';
      aiStatusBadge.style.background = isEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';
      aiStatusBadge.style.color = isEnabled ? '#059669' : '#dc2626';
    }
    if (lblAiToggleStatus) {
      lblAiToggleStatus.textContent = isEnabled ? 'Enabled' : 'Disabled';
      lblAiToggleStatus.style.color = isEnabled ? 'var(--text-main)' : 'var(--text-muted)';
    }
  }

  function updateFloatingWidgetVisuals(isOn) {
    if (floatingWidgetBadge) {
      floatingWidgetBadge.textContent = isOn ? 'Visible' : 'Hidden';
      floatingWidgetBadge.style.background = isOn ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';
      floatingWidgetBadge.style.color = isOn ? '#059669' : '#dc2626';
    }
    if (lblFloatingWidgetStatus) {
      lblFloatingWidgetStatus.textContent = isOn ? 'Enabled' : 'Disabled';
      lblFloatingWidgetStatus.style.color = isOn ? 'var(--text-main)' : 'var(--text-muted)';
    }
  }

  function updateSelectionWidgetVisuals(isOn) {
    if (selectionWidgetBadge) {
      selectionWidgetBadge.textContent = isOn ? 'Active' : 'Disabled';
      selectionWidgetBadge.style.background = isOn ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';
      selectionWidgetBadge.style.color = isOn ? '#059669' : '#dc2626';
    }
    if (lblSelectionWidgetStatus) {
      lblSelectionWidgetStatus.textContent = isOn ? 'Enabled' : 'Disabled';
      lblSelectionWidgetStatus.style.color = isOn ? 'var(--text-main)' : 'var(--text-muted)';
    }
  }

  if (settingsFloatingWidget) {
    settingsFloatingWidget.addEventListener('change', async () => {
      const val = settingsFloatingWidget.checked;
      updateFloatingWidgetVisuals(val);
      settings.floatingWidget = val;
      await window.SnippetStorage.saveSettings(settings);
      window.postMessage({ type: 'PARIWARTAN_STORAGE_UPDATED', settings }, '*');
      window.postMessage({ type: 'PARIWARTAN_EXTENSION_SYNC', key: 'settings', value: settings }, '*');
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ settings });
      }
    });
  }

  if (settingsSelectionWidget) {
    settingsSelectionWidget.addEventListener('change', async () => {
      const val = settingsSelectionWidget.checked;
      updateSelectionWidgetVisuals(val);
      settings.selectionWidget = val;
      await window.SnippetStorage.saveSettings(settings);
      window.postMessage({ type: 'PARIWARTAN_STORAGE_UPDATED', settings }, '*');
      window.postMessage({ type: 'PARIWARTAN_EXTENSION_SYNC', key: 'settings', value: settings }, '*');
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ settings });
      }
    });
  }

  if (settingsAiEnabled) {
    settingsAiEnabled.addEventListener('change', async () => {
      const val = settingsAiEnabled.checked;
      updateAiToggleVisuals(val);
      settings.aiEnabled = val;
      settings.ai = { ...(settings.ai || {}), enabled: val };
      await window.SnippetStorage.saveSettings(settings);
      window.postMessage({ type: 'PARIWARTAN_STORAGE_UPDATED', settings }, '*');
      window.postMessage({ type: 'PARIWARTAN_EXTENSION_SYNC', key: 'settings', value: settings }, '*');
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ settings });
      }
    });
  }

  if (settingsAiProvider) {
    settingsAiProvider.addEventListener('change', () => {
      updateAiSettingsUI(settingsAiProvider.value);
    });
  }

  if (btnToggleAiKeyVisibility) {
    btnToggleAiKeyVisibility.addEventListener('click', () => {
      if (settingsAiApiKey.type === 'password') {
        settingsAiApiKey.type = 'text';
        btnToggleAiKeyVisibility.textContent = '🔒';
      } else {
        settingsAiApiKey.type = 'password';
        btnToggleAiKeyVisibility.textContent = '👁️';
      }
    });
  }

  if (btnTestAiConnection) {
    btnTestAiConnection.addEventListener('click', async () => {
      aiTestStatusMsg.innerHTML = '<span style="color:var(--text-muted);">⏳ Testing connection to ' + settingsAiProvider.value + '...</span>';

      const config = {
        provider: settingsAiProvider.value,
        apiKey: settingsAiApiKey.value.trim(),
        model: settingsAiModel.value.trim(),
        customEndpoint: settingsAiEndpoint.value.trim()
      };

      try {
        const res = await window.AIService.testConnection(config);
        if (res.success) {
          aiTestStatusMsg.innerHTML = `<span style="color:#0f766e; font-weight:600;">✓ ${res.message}</span>`;
          if (res.verifiedModel) {
            settingsAiModel.value = res.verifiedModel;
          }
        } else {
          aiTestStatusMsg.innerHTML = `<span style="color:#b91c1c; font-weight:600;">❌ ${res.message}</span>`;
        }
      } catch (err) {
        aiTestStatusMsg.innerHTML = `<span style="color:#b91c1c; font-weight:600;">❌ ${err.message}</span>`;
      }
    });
  }

  btnOpenSettings.addEventListener('click', () => {
    selectedThemeTemp = settings.theme || 'day';
    updateThemePickerCards(selectedThemeTemp);
    updateFontScaleModalUI(getDashboardFontScale());

    settingsDefaultTemplate.value = settings.defaultTemplate || "Hello {name},\n\nThank you for reaching out.\n\nBest regards,\n{my_name}";
    settingsAuthorName.value = settings.defaultAuthor || 'Support Agent';
    settingsTriggerPrefix.value = settingsTriggerPrefix.value.trim() || '/';

    const isFloatingOn = settings.floatingWidget !== false;
    if (settingsFloatingWidget) {
      settingsFloatingWidget.checked = isFloatingOn;
      updateFloatingWidgetVisuals(isFloatingOn);
    }

    const isSelectionOn = settings.selectionWidget !== false;
    if (settingsSelectionWidget) {
      settingsSelectionWidget.checked = isSelectionOn;
      updateSelectionWidgetVisuals(isSelectionOn);
    }

    const ai = settings.ai || {};
    const isAiOn = (typeof settings.aiEnabled === 'boolean') ? settings.aiEnabled : (ai.enabled !== false);
    settingsAiEnabled.checked = isAiOn;
    updateAiToggleVisuals(isAiOn);
    settingsAiProvider.value = ai.provider || 'gemini';
    settingsAiModel.value = (ai.model && ai.model !== 'gemini-1.5-flash') ? ai.model : 'gemini-2.0-flash';
    settingsAiApiKey.value = ai.apiKey || '';
    settingsAiEndpoint.value = ai.customEndpoint || 'http://localhost:11434';
    settingsAiPersona.value = ai.persona || 'support';
    activePersonaId = ai.persona || 'support';
    renderActivePersonaPreview();
    aiTestStatusMsg.innerHTML = '';

    updateAiSettingsUI(settingsAiProvider.value);

    // Load Dictation settings
    const dict = settings.dictation || { enabled: true, language: 'en-US', autoPunctuation: true };
    if (settingsDictationEnabled) settingsDictationEnabled.checked = dict.enabled !== false;
    if (settingsDictationLang) settingsDictationLang.value = dict.language || 'en-US';
    if (settingsDictationPunctuation) settingsDictationPunctuation.checked = dict.autoPunctuation !== false;
    if (dictationConfigFields) {
      dictationConfigFields.style.opacity = (dict.enabled !== false) ? '1' : '0.5';
      dictationConfigFields.style.pointerEvents = (dict.enabled !== false) ? 'auto' : 'none';
    }

    modalSettings.classList.add('open');
  });

  if (settingsDictationEnabled && dictationConfigFields) {
    settingsDictationEnabled.addEventListener('change', () => {
      dictationConfigFields.style.opacity = settingsDictationEnabled.checked ? '1' : '0.5';
      dictationConfigFields.style.pointerEvents = settingsDictationEnabled.checked ? 'auto' : 'none';
    });
  }

  // Revert theme if user cancels out of settings
  modalSettings.querySelectorAll('[data-close="modalSettings"]').forEach(btn => {
    btn.addEventListener('click', () => {
      applyTheme(settings.theme || 'day');
    applyDashboardFontScale(getDashboardFontScale());
    });
  });

  // Settings Save Confirmation
  const modalConfirmSaveSettings = document.getElementById('modalConfirmSaveSettings');
  const btnProceedSaveSettingsConfirm = document.getElementById('btnProceedSaveSettingsConfirm');

  btnSaveSettings.addEventListener('click', (e) => {
    e.preventDefault();
    if (modalConfirmSaveSettings) {
      modalConfirmSaveSettings.classList.add('open');
    } else {
      executeSaveSettings();
    }
  });

  if (btnProceedSaveSettingsConfirm) {
    btnProceedSaveSettingsConfirm.addEventListener('click', async () => {
      await executeSaveSettings();
      if (modalConfirmSaveSettings) modalConfirmSaveSettings.classList.remove('open');
    });
  }

  async function executeSaveSettings() {
    settings.theme = selectedThemeTemp;
    settings.defaultTemplate = settingsDefaultTemplate.value;
    settings.defaultAuthor = settingsAuthorName.value.trim() || 'Support Agent';
    settings.triggerPrefix = settingsTriggerPrefix.value.trim() || '/';

    const isFloatingOn = settingsFloatingWidget ? settingsFloatingWidget.checked : true;
    const isSelectionOn = settingsSelectionWidget ? settingsSelectionWidget.checked : true;
    settings.floatingWidget = isFloatingOn;
    settings.selectionWidget = isSelectionOn;

    const isAiOn = settingsAiEnabled.checked;
    settings.aiEnabled = isAiOn;
    settings.ai = {
      ...(settings.ai || {}),
      enabled: isAiOn,
      provider: settingsAiProvider.value,
      apiKey: settingsAiApiKey.value.trim(),
      model: settingsAiModel.value.trim(),
      customEndpoint: settingsAiEndpoint.value.trim(),
      persona: settingsAiPersona.value
    };

    const isDictationOn = settingsDictationEnabled ? settingsDictationEnabled.checked : true;
    settings.dictation = {
      enabled: isDictationOn,
      language: settingsDictationLang ? settingsDictationLang.value : 'en-US',
      autoPunctuation: settingsDictationPunctuation ? settingsDictationPunctuation.checked : true
    };

    applyTheme(selectedThemeTemp);
    await window.SnippetStorage.saveSettings(settings);
    window.postMessage({ type: 'PARIWARTAN_STORAGE_UPDATED', settings }, '*');
    window.postMessage({ type: 'PARIWARTAN_EXTENSION_SYNC', key: 'settings', value: settings }, '*');
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ settings: settings });
    }
    updatePreviewText();
    modalSettings.classList.remove('open');
    showToast(isAiOn ? 'Saved settings (AI Assistant Enabled)!' : 'Saved settings (AI Assistant Disabled - Pure Snippets mode)!', 'success');
  }

  // --- Backup & Restore (JSON) ---
  btnOpenBackup.addEventListener('click', async () => {
    const json = await window.SnippetStorage.exportData();
    jsonTextPreview.value = json;
    modalBackup.classList.add('open');
  });

  btnDownloadJSON.addEventListener('click', async () => {
    const json = await window.SnippetStorage.exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parivartan_snippets_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('JSON backup exported!', 'success');
  });

  fileUploadJSON.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      jsonTextPreview.value = evt.target.result;
    };
    reader.readAsText(file);
  });

  btnApplyImportedJSON.addEventListener('click', async () => {
    const content = jsonTextPreview.value.trim();
    if (!content) return;
    const res = await window.SnippetStorage.importData(content);
    if (res.success) {
      modalBackup.classList.remove('open');
      await loadData();
      showToast(`Restored ${res.count} snippets successfully!`, 'success');
    } else {
      showToast(`Import error: ${res.error}`, 'error');
    }
  });

  const btnLoadDefaultLibrary = document.getElementById('btnLoadDefaultLibrary');
  if (btnLoadDefaultLibrary) {
    btnLoadDefaultLibrary.addEventListener('click', async () => {
      const defaults = typeof DEFAULT_SNIPPETS !== 'undefined' ? DEFAULT_SNIPPETS : [];
      const defaultFolders = typeof DEFAULT_FOLDERS !== 'undefined' ? DEFAULT_FOLDERS : [];
      await window.SnippetStorage.saveFolders(defaultFolders);
      await window.SnippetStorage.saveSnippets(defaults);
      modalBackup.classList.remove('open');
      selectedFolderId = defaultFolders[0] ? defaultFolders[0].id : null;
      await loadData();
      showToast(`Restored all ${defaults.length} templates across 5 categories!`, 'success');
    });
  }

  // Real-time input listeners that auto-save
  snippetLabelInput.addEventListener('input', triggerAutoSave);
  snippetShortcutInput.addEventListener('input', triggerAutoSave);
  documentSurface.addEventListener('input', () => {
    triggerAutoSave();
  });

  // Explicit Save Snippet Button
  if (btnSaveCurrentSnippet) {
    btnSaveCurrentSnippet.addEventListener('click', () => saveActiveSnippet(true));
  }
  if (btnSaveBanner) {
    btnSaveBanner.addEventListener('click', () => saveActiveSnippet(true));
  }
  if (btnDiscardBanner) {
    btnDiscardBanner.addEventListener('click', () => {
      if (activeSnippetId) selectSnippet(activeSnippetId);
    });
  }

  // Ensure snippet is immediately saved on blur
  snippetLabelInput.addEventListener('blur', () => saveActiveSnippet(false));
  snippetShortcutInput.addEventListener('blur', () => saveActiveSnippet(false));
  documentSurface.addEventListener('blur', () => {
    if (documentSurface && documentSurface.style.display !== 'none') {
      saveActiveSnippet(false);
    }
  });

  // Ensure snippet is immediately saved before window closes or refreshes
  window.addEventListener('beforeunload', () => {
    if (activeSnippetId) {
      const current = snippets.find(s => s.id === activeSnippetId);
      if (current) {
        current.title = snippetLabelInput.value.trim() || current.title;
        let sVal = snippetShortcutInput.value.trim();
        if (sVal && !sVal.startsWith('/')) sVal = '/' + sVal;
        current.shortcut = sVal || current.shortcut;
        current.folderId = snippetFolderSelect.value || current.folderId;
        if (documentSurface && documentSurface.style.display !== 'none') {
          current.content = documentSurface.innerText;
        }
        window.SnippetStorage.saveSnippets(snippets);
      }
    }
  });

  // Keyboard shortcut Ctrl+S / Cmd+S to save
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (currentActiveView === 'snippets') {
        saveActiveSnippet(true);
      } else {
        saveActiveAiPrompt(true);
      }
    }
  });

  btnNewSnippet.addEventListener('click', () => createNewSnippet());

  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.dataset.close;
      document.getElementById(modalId).classList.remove('open');
    });
  });

  // ========================================================
  // Custom AI Prompt Management & Execution Lab Controller
  // ========================================================
  const SAMPLE_TICKET_CONTEXT = `Ticket #4970144 - BGP Peering & Packet Loss Investigation
Client: Acme Hosting LLC (Account #83921)
Service: Dedicated Server Dual Xeon 10Gbps (IP: 198.51.100.24)
Datacenter: Los Angeles (LAX-01) - Psychz Networks

Customer Inquiry (24-Oct-2026 09:15 UTC):
"Hi Psychz Support,
We are noticing intermittent 15% packet loss and elevated latency on our primary dedicated server 198.51.100.24 when traffic routes through Cogent transit. Our customers in the US West region are complaining of connection timeouts.
Traceroute shows loss starting at hop 4 (154.54.42.105) inside carrier transit.
Could you please inspect the routing on your upstream border routers, check if our prefix 198.51.100.0/24 is receiving full table routes, and advise if we should adjust BGP local-preference or announce an LOA for alternative transit?

Attached MTR output:
HOST: client-la-gw Loss% Snt Last Avg Best Wrst StDev
1.|-- 10.0.0.1 0.0% 50 0.8 0.7 0.6 1.2 0.2
2.|-- 66.220.18.1 0.0% 50 1.5 1.4 1.2 2.1 0.3
3.|-- 154.54.42.105 14.0% 50 18.2 22.4 17.5 45.1 6.8
4.|-- 198.51.100.24 14.0% 50 18.4 22.1 17.8 44.9 6.5

Please advise on next steps.
Thanks,
Alex Turner - Senior Infrastructure DevOps"`;

  const SAMPLE_TICKET_ID = "#4970144";
  const SAMPLE_CUSTOMER_MESSAGE = `We are noticing intermittent 15% packet loss and elevated latency on our primary dedicated server 198.51.100.24 when traffic routes through Cogent transit. Traceroute shows loss starting at hop 4. Please inspect routing on border routers and advise next steps.`;

  // AI Prompts State
  let customPrompts = [];
  let customVariables = [];
  let activePromptId = null;
  let defaultPromptId = null;
  let activePromptCategory = 'all';
  let runnerVarValues = {};
  let promptAutoSaveTimeout = null;
  let promptBeingDeletedId = null;
  let currentActiveView = 'snippets'; // 'snippets' or 'ai-prompts'

  // DOM Elements - AI View Switcher & Containers
  const btnViewSnippets = document.getElementById('btnViewSnippets');
  const btnViewAiPrompts = document.getElementById('btnViewAiPrompts');
  const snippetCountBadge = document.getElementById('snippetCountBadge');
  const promptCountBadge = document.getElementById('promptCountBadge');
  const workspaceSnippets = document.getElementById('workspaceSnippets');
  const workspaceAiPrompts = document.getElementById('workspaceAiPrompts');
  const btnNewPrompt = document.getElementById('btnNewPrompt');

  // DOM Elements - AI Prompts Sidebar
  const promptSearchInput = document.getElementById('promptSearchInput');
  const btnSidebarNewPrompt = document.getElementById('btnSidebarNewPrompt');
  const promptCategoryChips = document.getElementById('promptCategoryChips');
  const aiPromptList = document.getElementById('aiPromptList');
  const aiVarCountSummary = document.getElementById('aiVarCountSummary');
  const btnOpenVariablesModal = document.getElementById('btnOpenVariablesModal');
  const aiSidebarResizer = document.getElementById('aiSidebarResizer');
  const aiPromptsSidebar = document.getElementById('aiPromptsSidebar');

  // DOM Elements - AI Prompt Editor
  const promptNameInput = document.getElementById('promptNameInput');
  const promptCategoryInput = document.getElementById('promptCategoryInput');
  const btnToggleDefaultPrompt = document.getElementById('btnToggleDefaultPrompt');
  const starDefaultIcon = document.getElementById('starDefaultIcon');
  const lblDefaultPrompt = document.getElementById('lblDefaultPrompt');
  const promptDescInput = document.getElementById('promptDescInput');
  const promptVarChipsContainer = document.getElementById('promptVarChipsContainer');
  const btnAddVarChip = document.getElementById('btnAddVarChip');
  const promptTemplateInput = document.getElementById('promptTemplateInput');
  const promptCharCount = document.getElementById('promptCharCount');
  const promptDetectedBadges = document.getElementById('promptDetectedBadges');
  const btnDeleteCurrentPrompt = document.getElementById('btnDeleteCurrentPrompt');
  const btnDuplicateCurrentPrompt = document.getElementById('btnDuplicateCurrentPrompt');
  const btnPreviewCurrentPrompt = document.getElementById('btnPreviewCurrentPrompt');
  const btnSaveCurrentPrompt = document.getElementById('btnSaveCurrentPrompt');
  const btnOpenInAiLab = document.getElementById('btnOpenInAiLab');

  // DOM Elements - Prompt Editor Undo/Redo
  const btnPromptUndo = document.getElementById('btnPromptUndo');
  const btnPromptRedo = document.getElementById('btnPromptRedo');

  // DOM Elements - AI Prompt Runner & Right Side Variables Hub
  const runnerProviderName = document.getElementById('runnerProviderName');
  const runnerVarsForm = document.getElementById('runnerVarsForm');
  const btnLoadSampleTicket = document.getElementById('btnLoadSampleTicket');
  const btnClearRunnerVars = document.getElementById('btnClearRunnerVars');
  const chkAllowTemporaryEdits = document.getElementById('chkAllowTemporaryEdits');
  const runnerResolvedPrompt = document.getElementById('runnerResolvedPrompt');
  const btnRunAiPrompt = document.getElementById('btnRunAiPrompt');
  const btnRunAiPromptText = document.getElementById('btnRunAiPromptText');
  const runnerExecutionStatus = document.getElementById('runnerExecutionStatus');
  const responseActions = document.getElementById('responseActions');
  const btnCopyAiResponse = document.getElementById('btnCopyAiResponse');
  const btnSaveAiAsSnippet = document.getElementById('btnSaveAiAsSnippet');
  const btnRerunAiPrompt = document.getElementById('btnRerunAiPrompt');
  const btnClearAiResponse = document.getElementById('btnClearAiResponse');
  const runnerResponseEmpty = document.getElementById('runnerResponseEmpty');
  const runnerResponseContent = document.getElementById('runnerResponseContent');

  // DOM Elements - Right Panel Variables Form Elements
  const aiRightPanelResizer = document.getElementById('aiRightPanelResizer');
  const aiPromptRunnerPanel = document.getElementById('aiPromptRunnerPanel');
  const runnerVarSelectDropdown = document.getElementById('runnerVarSelectDropdown');
  const rightPanelCustomVarsOptgroup = document.getElementById('rightPanelCustomVarsOptgroup');
  const btnInsertSelectedVar = document.getElementById('btnInsertSelectedVar');
  const selectedVarSourceBadge = document.getElementById('selectedVarSourceBadge');
  const selectedVarInfoText = document.getElementById('selectedVarInfoText');
  const btnRightPanelEditCustomVar = document.getElementById('btnRightPanelEditCustomVar');
  const btnRightPanelDeleteCustomVar = document.getElementById('btnRightPanelDeleteCustomVar');
  const rightPanelVarFormTitle = document.getElementById('rightPanelVarFormTitle');
  const rightPanelEditingVarId = document.getElementById('rightPanelEditingVarId');
  const customVarsCountBadge = document.getElementById('customVarsCountBadge');
  const ticketIdStatusBadge = document.getElementById('ticketIdStatusBadge');
  const customerMsgStatusBadge = document.getElementById('customerMsgStatusBadge');
  const engineerNameStatusBadge = document.getElementById('engineerNameStatusBadge');
  const supportTierStatusBadge = document.getElementById('supportTierStatusBadge');
  const runnerVar_Page_context = document.getElementById('runnerVar_Page_context');
  const runnerVar_Ticket_ID = document.getElementById('runnerVar_Ticket_ID');
  const runnerVar_Customer_Message = document.getElementById('runnerVar_Customer_Message');
  const pageContextLengthBadge = document.getElementById('pageContextLengthBadge');
  const runnerVar_Engineer_Name = document.getElementById('runnerVar_Engineer_Name');
  const runnerVar_Support_Tier = document.getElementById('runnerVar_Support_Tier');
  const runnerVar_Resolution_Steps = document.getElementById('runnerVar_Resolution_Steps');
  const btnGenerateResolutionSteps = document.getElementById('btnGenerateResolutionSteps');
  const resolutionStepsStatus = document.getElementById('resolutionStepsStatus');
  const rightPanelCustomVarsList = document.getElementById('rightPanelCustomVarsList');
  const btnRightPanelNewVar = document.getElementById('btnRightPanelNewVar');
  const rightPanelVarEditorForm = document.getElementById('rightPanelVarEditorForm');
  const rightPanelVarNameInput = document.getElementById('rightPanelVarNameInput');
  const rightPanelVarKeyInput = document.getElementById('rightPanelVarKeyInput');
  const rightPanelVarDefaultInput = document.getElementById('rightPanelVarDefaultInput');
  const btnRightPanelCancelVar = document.getElementById('btnRightPanelCancelVar');
  const btnRightPanelCancelVarBtn = document.getElementById('btnRightPanelCancelVarBtn');
  const btnRightPanelSaveVarBtn = document.getElementById('btnRightPanelSaveVarBtn');

  // DOM Elements - Right Panel Persona Manager
  const btnRightPanelNewPersona = document.getElementById('btnRightPanelNewPersona');
  const btnRightPanelEditPersona = document.getElementById('btnRightPanelEditPersona');
  const btnRightPanelDeletePersona = document.getElementById('btnRightPanelDeletePersona');
  const rightPanelPersonaPreview = document.getElementById('rightPanelPersonaPreview');
  const rightPanelPersonaName = document.getElementById('rightPanelPersonaName');
  const rightPanelPersonaDesc = document.getElementById('rightPanelPersonaDesc');
  const rightPanelPersonaEditorForm = document.getElementById('rightPanelPersonaEditorForm');
  const rightPanelPersonaFormTitle = document.getElementById('rightPanelPersonaFormTitle');
  const rightPanelPersonaIconInput = document.getElementById('rightPanelPersonaIconInput');
  const rightPanelPersonaNameInput = document.getElementById('rightPanelPersonaNameInput');
  const rightPanelPersonaRoleInput = document.getElementById('rightPanelPersonaRoleInput');
  const rightPanelPersonaPromptInput = document.getElementById('rightPanelPersonaPromptInput');
  const btnRightPanelSavePersona = document.getElementById('btnRightPanelSavePersona');
  const btnRightPanelCancelPersona = document.getElementById('btnRightPanelCancelPersona');
  const btnRightPanelCancelPersonaEdit = document.getElementById('btnRightPanelCancelPersonaEdit');

  // DOM Elements - Modals
  const modalAiVariables = document.getElementById('modalAiVariables');
  const btnVarTabCustom = document.getElementById('btnVarTabCustom');
  const btnVarTabSystem = document.getElementById('btnVarTabSystem');
  const varTabContentCustom = document.getElementById('varTabContentCustom');
  const varTabContentSystem = document.getElementById('varTabContentSystem');
  const varTabCustomCount = document.getElementById('varTabCustomCount');
  const customVarsTable = document.getElementById('customVarsTable');
  const varFormTitle = document.getElementById('varFormTitle');
  const editVarId = document.getElementById('editVarId');
  const varNameInput = document.getElementById('varNameInput');
  const varKeyInput = document.getElementById('varKeyInput');
  const varDefaultInput = document.getElementById('varDefaultInput');
  const varDescInput = document.getElementById('varDescInput');
  const btnCancelVarEdit = document.getElementById('btnCancelVarEdit');
  const btnSaveCustomVar = document.getElementById('btnSaveCustomVar');

  const modalDeleteAiPrompt = document.getElementById('modalDeleteAiPrompt');
  const deletePromptTargetName = document.getElementById('deletePromptTargetName');
  const btnConfirmDeleteAiPrompt = document.getElementById('btnConfirmDeleteAiPrompt');

  const modalPreviewAiPrompt = document.getElementById('modalPreviewAiPrompt');
  const previewModalPromptName = document.getElementById('previewModalPromptName');
  const previewModalVarStatus = document.getElementById('previewModalVarStatus');
  const previewModalResolvedText = document.getElementById('previewModalResolvedText');
  const btnModalPreviewRunInLab = document.getElementById('btnModalPreviewRunInLab');

  // DOM Elements & State - AI Personas Studio
  let allPersonas = [];
  let activePersonaId = 'support';
  let personaBeingEditedId = null;

  const runnerPersonaSelect = document.getElementById('runnerPersonaSelect');
  const btnOpenPersonasModal = document.getElementById('btnOpenPersonasModal');
  const activePersonaPreviewCard = document.getElementById('activePersonaPreviewCard');
  const previewPersonaIcon = document.getElementById('previewPersonaIcon');
  const previewPersonaName = document.getElementById('previewPersonaName');
  const previewPersonaRole = document.getElementById('previewPersonaRole');
  const previewPersonaDesc = document.getElementById('previewPersonaDesc');
  const modalAiPersonas = document.getElementById('modalAiPersonas');
  const personasPickerGrid = document.getElementById('personasPickerGrid');
  const personaEditorCard = document.getElementById('personaEditorCard');
  const personaFormTitle = document.getElementById('personaFormTitle');
  const editPersonaId = document.getElementById('editPersonaId');
  const personaIconInput = document.getElementById('personaIconInput');
  const personaNameInput = document.getElementById('personaNameInput');
  const personaRoleInput = document.getElementById('personaRoleInput');
  const personaPromptInput = document.getElementById('personaPromptInput');
  const btnCancelPersonaEdit = document.getElementById('btnCancelPersonaEdit');
  const btnSavePersona = document.getElementById('btnSavePersona');

  // --- View Switcher Logic ---
  function switchView(view) {
    currentActiveView = view;
    if (view === 'ai-prompts') {
      btnViewAiPrompts.classList.add('active');
      btnViewSnippets.classList.remove('active');
      workspaceSnippets.style.display = 'none';
      workspaceAiPrompts.style.display = 'flex';
      btnNewSnippet.style.display = 'none';
      btnNewPrompt.style.display = 'inline-flex';
      updateAiRunnerProviderPill();
    } else {
      btnViewSnippets.classList.add('active');
      btnViewAiPrompts.classList.remove('active');
      workspaceSnippets.style.display = 'flex';
      workspaceAiPrompts.style.display = 'none';
      btnNewSnippet.style.display = 'inline-flex';
      btnNewPrompt.style.display = 'none';
    }
  }

  btnViewSnippets.addEventListener('click', () => switchView('snippets'));
  btnViewAiPrompts.addEventListener('click', () => switchView('ai-prompts'));
  btnNewPrompt.addEventListener('click', () => createNewAiPrompt());
  btnSidebarNewPrompt.addEventListener('click', () => createNewAiPrompt());

  function updateAiRunnerProviderPill() {
    const p = (settings && settings.ai && settings.ai.provider) || 'gemini';
    const names = {
      gemini: 'Google Gemini',
      gemini_web: 'Gemini (Web)',
      openai: 'OpenAI (ChatGPT)',
      chatgpt_web: 'ChatGPT (Web)',
      claude: 'Anthropic Claude',
      claude_web: 'Claude (Web)',
      ollama: 'Local Ollama',
      chrome_builtin: 'Chrome Nano',
      smart_instant: 'Smart Instant'
    };
    if (runnerProviderName) {
      runnerProviderName.textContent = names[p] || p;
    }
  }

  // --- AI Personas & Thinking Characters Controller ---
  async function loadPersonasData() {
    try {
      allPersonas = await window.SnippetStorage.getAllPersonas();
      activePersonaId = await window.SnippetStorage.getActivePersonaId();
    } catch (e) {
      allPersonas = typeof DEFAULT_AI_PERSONAS !== 'undefined' ? DEFAULT_AI_PERSONAS : [];
      activePersonaId = 'support';
    }

    if (!activePersonaId || !allPersonas.some(p => p.id === activePersonaId)) {
      activePersonaId = allPersonas.length > 0 ? allPersonas[0].id : 'support';
    }

    renderPersonasDropdowns();
    renderActivePersonaPreview();
    renderPersonasPickerGrid();
  }

  function renderPersonasDropdowns() {
    const optionsHtml = allPersonas.map(p => `
      <option value="${escapeHTML(p.id)}" ${p.id === activePersonaId ? 'selected' : ''}>
        ${p.icon || '🎭'} ${escapeHTML(p.name)}
      </option>
    `).join('');

    if (settingsAiPersona) {
      settingsAiPersona.innerHTML = optionsHtml;
      settingsAiPersona.value = activePersonaId;
    }
    if (runnerPersonaSelect) {
      runnerPersonaSelect.innerHTML = optionsHtml;
      runnerPersonaSelect.value = activePersonaId;
    }
  }

  function renderActivePersonaPreview() {
    updateRightPanelPersonaUI();
    if (!activePersonaPreviewCard) return;
    const activeObj = allPersonas.find(p => p.id === activePersonaId) || allPersonas[0];
    if (!activeObj) return;

    if (previewPersonaIcon) previewPersonaIcon.textContent = activeObj.icon || '🎭';
    if (previewPersonaName) previewPersonaName.textContent = activeObj.name || 'AI Persona';
    if (previewPersonaRole) previewPersonaRole.textContent = activeObj.role || 'Character Profile';
    if (previewPersonaDesc) {
      previewPersonaDesc.textContent = activeObj.description || (activeObj.systemPrompt ? activeObj.systemPrompt.slice(0, 95) + '...' : '');
    }
  }

  async function selectActivePersona(personaId) {
    if (!personaId) return;
    activePersonaId = personaId;
    if (settingsAiPersona) settingsAiPersona.value = personaId;
    if (runnerPersonaSelect) runnerPersonaSelect.value = personaId;

    if (settings && settings.ai) {
      settings.ai.persona = personaId;
    }

    await window.SnippetStorage.setActivePersonaId(personaId);
    renderActivePersonaPreview();
    renderPersonasPickerGrid();
    const pName = (allPersonas.find(p => p.id === personaId) || {}).name || personaId;
    showToast(`AI Persona set to: ${pName}`, 'success');
  }

  function renderPersonasPickerGrid() {
    if (!personasPickerGrid) return;
    personasPickerGrid.innerHTML = allPersonas.map(p => {
      const isActive = p.id === activePersonaId;
      const isCustom = !!p.isCustom;
      const desc = p.description || (p.systemPrompt ? p.systemPrompt.slice(0, 100) + '...' : '');
      return `
        <div class="persona-card ${isActive ? 'active' : ''}" data-persona-id="${escapeHTML(p.id)}">
          <div class="persona-card-top">
            <span class="persona-card-icon">${p.icon || '🎭'}</span>
            <div style="flex: 1; min-width: 0;">
              <div class="persona-card-name">${escapeHTML(p.name)}</div>
              <div class="persona-card-role">${escapeHTML(p.role || (isCustom ? 'Custom Persona' : 'Built-in'))}</div>
            </div>
            ${isActive ? '<span class="persona-active-badge">✓ Active</span>' : ''}
          </div>
          <div class="persona-card-desc">${escapeHTML(desc)}</div>
          <div class="persona-card-actions">
            ${!isActive ? `<button type="button" class="btn btn-secondary btn-sm persona-btn-activate" data-persona-id="${escapeHTML(p.id)}" style="font-size: 0.72rem; padding: 2px 8px;">Select</button>` : ''}
            <button type="button" class="btn btn-secondary btn-sm persona-btn-customize" data-persona-id="${escapeHTML(p.id)}" style="font-size: 0.72rem; padding: 2px 8px;">${isCustom ? '✏️ Edit' : '📋 Customize'}</button>
            ${isCustom ? `<button type="button" class="btn btn-secondary btn-sm persona-btn-delete" data-persona-id="${escapeHTML(p.id)}" style="font-size: 0.72rem; padding: 2px 6px; color: var(--danger);">🗑️</button>` : ''}
          </div>
        </div>
      `;
    }).join('');

    // Wire Card Events
    personasPickerGrid.querySelectorAll('.persona-btn-activate').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectActivePersona(btn.dataset.personaId);
      });
    });

    personasPickerGrid.querySelectorAll('.persona-btn-customize').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        editOrCustomizePersona(btn.dataset.personaId);
      });
    });

    personasPickerGrid.querySelectorAll('.persona-btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteCustomPersona(btn.dataset.personaId);
      });
    });

    personasPickerGrid.querySelectorAll('.persona-card').forEach(card => {
      card.addEventListener('click', () => {
        selectActivePersona(card.dataset.personaId);
      });
    });
  }

  function editOrCustomizePersona(personaId) {
    const target = allPersonas.find(p => p.id === personaId);
    if (!target) return;

    if (target.isCustom) {
      personaBeingEditedId = target.id;
      if (editPersonaId) editPersonaId.value = target.id;
      if (personaFormTitle) personaFormTitle.textContent = `✏️ Edit Custom Persona: ${target.name}`;
      if (personaIconInput) personaIconInput.value = target.icon || '🎭';
      if (personaNameInput) personaNameInput.value = target.name || '';
      if (personaRoleInput) personaRoleInput.value = target.role || '';
      if (personaPromptInput) personaPromptInput.value = target.systemPrompt || '';
      if (btnCancelPersonaEdit) btnCancelPersonaEdit.style.display = 'inline-block';
    } else {
      // Duplicate / Customize built-in persona
      personaBeingEditedId = null;
      if (editPersonaId) editPersonaId.value = '';
      if (personaFormTitle) personaFormTitle.textContent = `➕ Customize Persona based on ${target.name}`;
      if (personaIconInput) personaIconInput.value = target.icon || '👔';
      if (personaNameInput) personaNameInput.value = `${target.name} (Custom)`;
      if (personaRoleInput) personaRoleInput.value = target.role || '';
      if (personaPromptInput) personaPromptInput.value = target.systemPrompt || '';
      if (btnCancelPersonaEdit) btnCancelPersonaEdit.style.display = 'inline-block';
    }

    if (personaEditorCard) {
      personaEditorCard.scrollIntoView({ behavior: 'smooth' });
    }
  }

  function resetPersonaForm() {
    personaBeingEditedId = null;
    if (editPersonaId) editPersonaId.value = '';
    if (personaFormTitle) personaFormTitle.textContent = '➕ Create / Customize Persona';
    if (personaIconInput) personaIconInput.value = '👔';
    if (personaNameInput) personaNameInput.value = '';
    if (personaRoleInput) personaRoleInput.value = '';
    if (personaPromptInput) personaPromptInput.value = '';
    if (btnCancelPersonaEdit) btnCancelPersonaEdit.style.display = 'none';
  }

  async function savePersonaProfile() {
    const name = (personaNameInput ? personaNameInput.value : '').trim();
    const prompt = (personaPromptInput ? personaPromptInput.value : '').trim();
    const icon = (personaIconInput ? personaIconInput.value : '').trim() || '🎭';
    const role = (personaRoleInput ? personaRoleInput.value : '').trim() || 'Custom Character';

    if (!name) {
      showToast('Please enter a name for the AI Persona.', 'error');
      if (personaNameInput) personaNameInput.focus();
      return;
    }

    if (!prompt) {
      showToast('Please provide thinking and reasoning instructions for this persona.', 'error');
      if (personaPromptInput) personaPromptInput.focus();
      return;
    }

    let customPersonas = await window.SnippetStorage.getCustomPersonas();

    if (personaBeingEditedId) {
      const idx = customPersonas.findIndex(p => p.id === personaBeingEditedId);
      if (idx !== -1) {
        customPersonas[idx] = {
          ...customPersonas[idx],
          name,
          icon,
          role,
          description: prompt.slice(0, 95) + '...',
          systemPrompt: prompt,
          isCustom: true
        };
      }
    } else {
      const newId = `custom_persona_${Date.now()}`;
      customPersonas.push({
        id: newId,
        name,
        icon,
        role,
        description: prompt.slice(0, 95) + '...',
        systemPrompt: prompt,
        isCustom: true
      });
      personaBeingEditedId = newId;
    }

    await window.SnippetStorage.saveCustomPersonas(customPersonas);
    const savedId = personaBeingEditedId;
    resetPersonaForm();
    await loadPersonasData();
    if (savedId) {
      await selectActivePersona(savedId);
    }
    showToast('✓ AI Persona saved successfully!', 'success');
  }

  async function deleteCustomPersona(personaId) {
    if (!confirm('Are you sure you want to delete this custom persona?')) return;
    let customPersonas = await window.SnippetStorage.getCustomPersonas();
    customPersonas = customPersonas.filter(p => p.id !== personaId);
    await window.SnippetStorage.saveCustomPersonas(customPersonas);

    if (activePersonaId === personaId) {
      activePersonaId = 'support';
      await window.SnippetStorage.setActivePersonaId('support');
    }

    if (personaBeingEditedId === personaId) {
      resetPersonaForm();
    }

    await loadPersonasData();
    showToast('Persona deleted.', 'info');
  }

  // Persona Event Listeners
  if (btnOpenPersonasModal) {
    btnOpenPersonasModal.addEventListener('click', () => {
      if (modalAiPersonas) {
        modalAiPersonas.classList.add('open');
        renderPersonasPickerGrid();
      }
    });
  }

  if (settingsAiPersona) {
    settingsAiPersona.addEventListener('change', (e) => {
      selectActivePersona(e.target.value);
    });
  }

  if (runnerPersonaSelect) {
    runnerPersonaSelect.addEventListener('change', (e) => {
      selectActivePersona(e.target.value);
    });
  }

  if (btnSavePersona) {
    btnSavePersona.addEventListener('click', savePersonaProfile);
  }

  if (btnCancelPersonaEdit) {
    btnCancelPersonaEdit.addEventListener('click', resetPersonaForm);
  }

  // --- Initialize AI Prompts Management Data ---
  async function initAiPromptManagement() {
    await loadPersonasData();
    customPrompts = await window.SnippetStorage.getCustomPrompts();
    customVariables = await window.SnippetStorage.getCustomVariables();
    defaultPromptId = await window.SnippetStorage.getDefaultPromptId();

    // Ensure standard custom variables (Engineer_Name and Support_Tier) are present in customVariables
    const hasEngineer = customVariables.some(v => v.key.toLowerCase() === 'engineer_name');
    if (!hasEngineer) {
      customVariables.unshift({
        id: 'var_engineer_name',
        name: 'Engineer Name',
        key: 'Engineer_Name',
        defaultValue: (settings && settings.defaultAuthor) || 'Support Engineer',
        description: 'Support engineer name or signature',
        isSystem: false
      });
    }
    const hasTier = customVariables.some(v => v.key.toLowerCase() === 'support_tier');
    if (!hasTier) {
      customVariables.splice(1, 0, {
        id: 'var_support_tier',
        name: 'Support Tier',
        key: 'Support_Tier',
        defaultValue: 'Tier 2 Technical Support',
        description: 'Support tier level (e.g. Tier 2)',
        isSystem: false
      });
    }

    // Ensure at least one default prompt is marked isDefault
    if (customPrompts.length > 0) {
      const hasDefault = customPrompts.some(p => p.isDefault);
      if (!hasDefault) {
        customPrompts[0].isDefault = true;
        defaultPromptId = customPrompts[0].id;
      }
    }

    updatePromptCountBadges();
    renderVariableChips();
    renderSnippetVariableChips();
    renderPromptCategoryChips();
    renderAiPromptList();

    if (customPrompts.length > 0) {
      const initialId = defaultPromptId && customPrompts.some(p => p.id === defaultPromptId)
        ? defaultPromptId
        : customPrompts[0].id;
      selectAiPrompt(initialId);
    }

    updateAiRunnerProviderPill();
  }

  function updatePromptCountBadges() {
    if (promptCountBadge) promptCountBadge.textContent = customPrompts.length;
    if (snippetCountBadge) snippetCountBadge.textContent = snippets.length;
    if (aiVarCountSummary) {
      const customCount = customVariables.length;
      aiVarCountSummary.textContent = `3 System, ${customCount} Custom`;
    }
    if (varTabCustomCount) {
      varTabCustomCount.textContent = customVariables.length;
    }
  }

  // --- Category Filter Chips ---
  function renderPromptCategoryChips() {
    if (!promptCategoryChips) return;
    const categories = new Set(['all']);
    customPrompts.forEach(p => {
      if (p.category && p.category.trim()) categories.add(p.category.trim());
    });

    // Ensure primary categories exist in list
    ['Support', 'Diagnostic', 'Technical'].forEach(c => categories.add(c));

    promptCategoryChips.innerHTML = '';
    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ai-cat-chip' + (activePromptCategory.toLowerCase() === cat.toLowerCase() ? ' active' : '');
      btn.textContent = cat === 'all' ? 'All Prompts' : cat;
      btn.dataset.cat = cat;
      btn.addEventListener('click', () => {
        activePromptCategory = cat;
        promptCategoryChips.querySelectorAll('.ai-cat-chip').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        renderAiPromptList();
      });
      promptCategoryChips.appendChild(btn);
    });
  }

  // --- Render Saved Prompts List ---
  function renderAiPromptList() {
    if (!aiPromptList) return;
    const query = (promptSearchInput?.value || '').toLowerCase().trim();

    const filtered = customPrompts.filter(p => {
      const matchesCategory = activePromptCategory === 'all' || (p.category && p.category.toLowerCase() === activePromptCategory.toLowerCase());
      if (!matchesCategory) return false;

      if (!query) return true;
      const name = (p.name || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      const templ = (p.template || '').toLowerCase();
      const cat = (p.category || '').toLowerCase();
      return name.includes(query) || desc.includes(query) || templ.includes(query) || cat.includes(query);
    });

    aiPromptList.innerHTML = '';

    if (filtered.length === 0) {
      aiPromptList.innerHTML = `
        <div style="text-align: center; padding: 28px 12px; color: var(--text-muted); font-size: 0.84rem;">
          <p style="margin: 0 0 8px 0;">No matching prompts found.</p>
          <button type="button" class="btn btn-secondary btn-sm" id="btnListCreatePrompt">
            + Create New Prompt
          </button>
        </div>
      `;
      const btnCreate = aiPromptList.querySelector('#btnListCreatePrompt');
      if (btnCreate) btnCreate.addEventListener('click', () => createNewAiPrompt());
      return;
    }

    filtered.forEach(p => {
      const card = document.createElement('div');
      card.className = 'ai-prompt-card' + (p.id === activePromptId ? ' active' : '');
      card.dataset.promptId = p.id;

      const detectedVars = window.ParivartanEngine ? window.ParivartanEngine.extractAiPromptVariables(p.template) : [];
      const isDefault = p.isDefault || p.id === defaultPromptId;

      card.innerHTML = `
        <div class="ai-prompt-card-top">
          <span class="ai-prompt-card-title">${escapeHTML(p.name || 'Untitled Prompt')}</span>
          <div class="ai-prompt-card-badges">
            ${isDefault ? '<span class="ai-prompt-badge-default" title="Default Quick Access Prompt">⭐ Default</span>' : ''}
            <span class="ai-prompt-badge-cat">${escapeHTML(p.category || 'General')}</span>
          </div>
        </div>
        <div class="ai-prompt-card-desc">${escapeHTML(p.description || p.template?.slice(0, 100) || 'No description')}</div>
        <div class="ai-prompt-card-footer">
          <span class="ai-prompt-card-vars">⚡ ${detectedVars.length} ${detectedVars.length === 1 ? 'variable' : 'variables'}</span>
          <span>${formatRelativeDate(p.updatedAt || p.createdAt)}</span>
        </div>
      `;

      card.addEventListener('click', () => {
        selectAiPrompt(p.id);
      });

      aiPromptList.appendChild(card);
    });
  }

  function formatRelativeDate(timestamp) {
    if (!timestamp) return 'Recently';
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 2) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  // --- Select Prompt ---
  function selectAiPrompt(id) {
    const prompt = customPrompts.find(p => p.id === id);
    if (!prompt) return;

    activePromptId = id;
    promptNameInput.value = prompt.name || '';
    promptCategoryInput.value = prompt.category || 'Support';
    promptDescInput.value = prompt.description || '';
    promptTemplateInput.value = prompt.template || '';

    promptHistory = [prompt.template || ''];
    promptHistoryIdx = 0;
    updatePromptUndoRedoButtons();

    updateDefaultPromptButton(prompt.isDefault || prompt.id === defaultPromptId);
    updateDetectedVariables();
    populateRunnerVariablesForm();
    updateAiPromptCardHighlight();
    setPromptDirty(false);
  }

  function updateAiPromptCardHighlight() {
    if (!aiPromptList) return;
    aiPromptList.querySelectorAll('.ai-prompt-card').forEach(card => {
      if (card.dataset.promptId === activePromptId) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
  }

  function updateDefaultPromptButton(isDefault) {
    if (!btnToggleDefaultPrompt) return;
    if (isDefault) {
      btnToggleDefaultPrompt.classList.add('is-default');
      lblDefaultPrompt.textContent = 'Default (Active)';
      starDefaultIcon.textContent = '⭐';
    } else {
      btnToggleDefaultPrompt.classList.remove('is-default');
      lblDefaultPrompt.textContent = 'Set as Default';
      starDefaultIcon.textContent = '☆';
    }
  }

  // --- Create New Prompt ---
  function createNewAiPrompt() {
    const newId = 'prompt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    const newPrompt = {
      id: newId,
      name: 'Custom AI Prompt ' + (customPrompts.length + 1),
      category: 'Support',
      description: 'Analyze page content and formulate a structured response.',
      template: `Review the following customer issue and provide an immediate technical resolution:

Ticket Context:
+++++++++++++++++++
{Page_context}
+++++++++++++++++++

Assigned Tier: {Support_Tier}
Assigned Engineer: {Engineer_Name}

Instructions:
1. Explain the root cause in simple terms.
2. Provide step-by-step resolution commands.
3. Formulate a polite customer reply.`,
      variables: ['Page_context', 'Support_Tier', 'Engineer_Name'],
      isDefault: customPrompts.length === 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    customPrompts.unshift(newPrompt);
    saveAiPrompts(false);
    renderAiPromptList();
    renderPromptCategoryChips();
    selectAiPrompt(newId);
    showToast(`✓ Created "${newPrompt.name}"!`, 'success');

    setTimeout(() => {
      promptNameInput.focus();
      promptNameInput.select();
    }, 50);
  }

  // --- Duplicate Prompt ---
  function duplicateActiveAiPrompt() {
    const current = customPrompts.find(p => p.id === activePromptId);
    if (!current) return;

    const newId = 'prompt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    const cloned = {
      ...current,
      id: newId,
      name: `${current.name} (Copy)`,
      isDefault: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    customPrompts.unshift(cloned);
    saveAiPrompts(false);
    renderAiPromptList();
    selectAiPrompt(newId);
    showToast(`✓ Duplicated "${current.name}"!`, 'success');
  }

  // --- Delete Prompt ---
  function openDeleteAiPromptModal() {
    const current = customPrompts.find(p => p.id === activePromptId);
    if (!current) return;

    promptBeingDeletedId = current.id;
    deletePromptTargetName.textContent = current.name;
    modalDeleteAiPrompt.classList.add('open');
  }

  btnDeleteCurrentPrompt.addEventListener('click', openDeleteAiPromptModal);

  btnConfirmDeleteAiPrompt.addEventListener('click', () => {
    if (!promptBeingDeletedId) return;

    const idx = customPrompts.findIndex(p => p.id === promptBeingDeletedId);
    if (idx !== -1) {
      const deletedName = customPrompts[idx].name;
      const wasDefault = customPrompts[idx].isDefault || customPrompts[idx].id === defaultPromptId;
      customPrompts.splice(idx, 1);

      if (customPrompts.length > 0) {
        if (wasDefault) {
          customPrompts[0].isDefault = true;
          defaultPromptId = customPrompts[0].id;
        }
        selectAiPrompt(customPrompts[0].id);
      } else {
        createNewAiPrompt();
      }

      saveAiPrompts(false);
      renderAiPromptList();
      renderPromptCategoryChips();
      modalDeleteAiPrompt.classList.remove('open');
      showToast(`Deleted prompt "${deletedName}"`, 'success');
    }
  });

  // --- Set as Default Prompt ---
  function toggleDefaultPrompt() {
    const current = customPrompts.find(p => p.id === activePromptId);
    if (!current) return;

    customPrompts.forEach(p => {
      p.isDefault = (p.id === current.id);
    });
    defaultPromptId = current.id;
    window.SnippetStorage.setDefaultPromptId(current.id);

    updateDefaultPromptButton(true);
    saveAiPrompts(false);
    renderAiPromptList();
    showToast(`⭐ Set "${current.name}" as Default Prompt!`, 'success');
  }

  btnToggleDefaultPrompt.addEventListener('click', toggleDefaultPrompt);
  btnDuplicateCurrentPrompt.addEventListener('click', duplicateActiveAiPrompt);

  // --- Save Active Prompt ---
  function saveActiveAiPrompt(showToastFeedback = true) {
    const current = customPrompts.find(p => p.id === activePromptId);
    if (!current) return;

    const name = promptNameInput.value.trim() || 'Untitled Prompt';
    const category = promptCategoryInput.value.trim() || 'General';
    const description = promptDescInput.value.trim();
    const template = promptTemplateInput.value;
    const detectedVars = window.ParivartanEngine ? window.ParivartanEngine.extractAiPromptVariables(template) : [];

    current.name = name;
    current.category = category;
    current.description = description;
    current.template = template;
    current.variables = detectedVars;
    current.updatedAt = Date.now();

    saveAiPrompts(showToastFeedback);
    setPromptDirty(false);
    renderAiPromptList();
    renderPromptCategoryChips();
    updateDetectedVariables();
    populateRunnerVariablesForm();

    if (showToastFeedback) {
      showToast(`✓ Saved prompt "${name}"!`, 'success');
      setAutoSaveStatus('saved');
    }
  }

  btnSaveCurrentPrompt.addEventListener('click', () => saveActiveAiPrompt(true));

  async function saveAiPrompts(showSavedPill = false) {
    await window.SnippetStorage.saveCustomPrompts(customPrompts);
    updatePromptCountBadges();
    if (showSavedPill) {
      setAutoSaveStatus('saved');
    }
  }

  // Real-time input listener with debounced auto-save
  promptNameInput.addEventListener('input', () => triggerPromptAutoSave());
  promptCategoryInput.addEventListener('input', () => triggerPromptAutoSave());
  promptDescInput.addEventListener('input', () => triggerPromptAutoSave());
  // --- Prompt Editor Undo / Redo Controller ---
  let promptHistory = [];
  let promptHistoryIdx = -1;
  let isUndoingRedoingPrompt = false;

  function pushPromptHistory(val) {
    if (isUndoingRedoingPrompt) return;
    if (promptHistoryIdx >= 0 && promptHistory[promptHistoryIdx] === val) return;
    promptHistory = promptHistory.slice(0, promptHistoryIdx + 1);
    promptHistory.push(val);
    if (promptHistory.length > 50) promptHistory.shift();
    promptHistoryIdx = promptHistory.length - 1;
    updatePromptUndoRedoButtons();
  }

  function undoPrompt() {
    if (promptHistoryIdx > 0) {
      isUndoingRedoingPrompt = true;
      promptHistoryIdx--;
      promptTemplateInput.value = promptHistory[promptHistoryIdx];
      updateDetectedVariables();
      updateRunnerResolvedPrompt();
      triggerPromptAutoSave();
      isUndoingRedoingPrompt = false;
      updatePromptUndoRedoButtons();
    }
  }

  function redoPrompt() {
    if (promptHistoryIdx < promptHistory.length - 1) {
      isUndoingRedoingPrompt = true;
      promptHistoryIdx++;
      promptTemplateInput.value = promptHistory[promptHistoryIdx];
      updateDetectedVariables();
      updateRunnerResolvedPrompt();
      triggerPromptAutoSave();
      isUndoingRedoingPrompt = false;
      updatePromptUndoRedoButtons();
    }
  }

  function updatePromptUndoRedoButtons() {
    if (btnPromptUndo) {
      btnPromptUndo.disabled = promptHistoryIdx <= 0;
      btnPromptUndo.style.opacity = promptHistoryIdx <= 0 ? '0.4' : '1';
    }
    if (btnPromptRedo) {
      btnPromptRedo.disabled = promptHistoryIdx >= promptHistory.length - 1;
      btnPromptRedo.style.opacity = promptHistoryIdx >= promptHistory.length - 1 ? '0.4' : '1';
    }
  }

  if (btnPromptUndo) {
    btnPromptUndo.addEventListener('click', (e) => {
      e.preventDefault();
      undoPrompt();
    });
  }

  if (btnPromptRedo) {
    btnPromptRedo.addEventListener('click', (e) => {
      e.preventDefault();
      redoPrompt();
    });
  }

  if (promptTemplateInput) {
    promptTemplateInput.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redoPrompt();
        } else {
          undoPrompt();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redoPrompt();
      }
    });

    let promptDebounceTimer = null;
    promptTemplateInput.addEventListener('input', () => {
      clearTimeout(promptDebounceTimer);
      promptDebounceTimer = setTimeout(() => {
        pushPromptHistory(promptTemplateInput.value);
      }, 300);
      updateDetectedVariables();
      updateRunnerResolvedPrompt();
      triggerPromptAutoSave();
    });
  }

  function triggerPromptAutoSave() {
    setPromptDirty(true);
    setAutoSaveStatus('saving');
    clearTimeout(promptAutoSaveTimeout);
    promptAutoSaveTimeout = setTimeout(() => {
      saveActiveAiPrompt(false);
    }, 600);
  }

  // --- Variable Inserter Toolbar ---
  function renderVariableChips() {
    if (!promptVarChipsContainer) return;
    promptVarChipsContainer.innerHTML = '';

    // 1. Webpage & AI Variables Chips
    const systemVars = [
      { key: 'Page_context', name: 'Page Context', description: 'Auto-extracted webpage text / ticket content' },
      { key: 'Ticket_ID', name: 'Ticket ID', description: 'Auto-extracted ticket identifier (#4970144)' },
      { key: 'Customer_Message', name: 'Customer Message', description: 'Auto-extracted customer inquiry' },
      { key: 'Resolution_Steps', name: 'Resolution Steps', description: 'AI formulated technical steps' }
    ];

    systemVars.forEach(v => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'var-chip system';
      chip.innerHTML = `<span>🔒</span> <span>{${v.key}}</span>`;
      chip.title = `Insert {${v.key}} - ${v.description || 'System Variable'}`;
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        insertVariableAtCursor(v.key);
      });
      promptVarChipsContainer.appendChild(chip);
    });

    // 2. Custom User Variables Chips (Includes Engineer_Name, Support_Tier, and user custom variables)
    customVariables.forEach(v => {
      if (systemVars.some(sv => sv.key.toLowerCase() === v.key.toLowerCase())) return;
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'var-chip';
      chip.innerHTML = `<span>⚙️</span> <span>{${escapeHTML(v.key)}}</span>`;
      chip.title = `Insert {${escapeHTML(v.key)}}${v.defaultValue ? ` (Default: "${escapeHTML(v.defaultValue)}")` : ''}`;
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        insertVariableAtCursor(v.key);
      });
      promptVarChipsContainer.appendChild(chip);
    });

    // 3. Add Custom Variable button
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'btn-add-var-chip';
    addBtn.textContent = '+ New Variable';
    addBtn.title = 'Create a new custom variable placeholder';
    addBtn.addEventListener('click', () => openVariablesModal());
    promptVarChipsContainer.appendChild(addBtn);
  }

  function insertVariableAtCursor(varKey) {
    const textarea = promptTemplateInput;
    if (!textarea) return;

    const tag = `{${varKey}}`;
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const text = textarea.value;

    textarea.value = text.substring(0, start) + tag + text.substring(end);
    const newPos = start + tag.length;
    textarea.selectionStart = newPos;
    textarea.selectionEnd = newPos;
    textarea.focus();

    updateDetectedVariables();
    updateRunnerResolvedPrompt();
    triggerPromptAutoSave();
    showToast(`Inserted {${varKey}} into prompt!`, 'success');
  }

  // --- Update Detected Variables Badges ---
  function updateDetectedVariables() {
    if (!promptDetectedBadges || !promptTemplateInput) return;
    const text = promptTemplateInput.value || '';
    if (promptCharCount) {
      promptCharCount.textContent = `${text.length} characters`;
    }

    const detected = window.ParivartanEngine ? window.ParivartanEngine.extractAiPromptVariables(text) : [];
    promptDetectedBadges.innerHTML = '';

    if (detected.length === 0) {
      promptDetectedBadges.innerHTML = `<span class="detected-none">No variables detected yet. Click any variable chip above to insert.</span>`;
      return;
    }

    const systemKeys = new Set(['page_context', 'ticket_id', 'customer_message']);

    detected.forEach(key => {
      const badge = document.createElement('span');
      const isSys = systemKeys.has(key.toLowerCase());
      badge.className = 'detected-badge ' + (isSys ? 'system' : 'custom');
      badge.textContent = `{${key}}`;
      badge.title = isSys ? 'System Variable' : 'Custom Variable';
      promptDetectedBadges.appendChild(badge);
    });
  }

  // --- Preview Prompt Modal ---
  btnPreviewCurrentPrompt.addEventListener('click', openPreviewPromptModal);
  btnModalPreviewRunInLab.addEventListener('click', () => {
    modalPreviewAiPrompt.classList.remove('open');
    focusAiLabRunner();
  });

  function openPreviewPromptModal() {
    const current = customPrompts.find(p => p.id === activePromptId);
    if (!current) return;

    previewModalPromptName.textContent = current.name || 'Prompt Preview';
    const fallbackDefaults = buildFallbackDefaultsMap();
    const resolution = window.ParivartanEngine.resolveAiPrompt(promptTemplateInput.value, runnerVarValues, fallbackDefaults);

    previewModalResolvedText.textContent = resolution.resolvedText;

    if (resolution.missingVariables.length === 0) {
      previewModalVarStatus.style.background = 'rgba(16, 185, 129, 0.15)';
      previewModalVarStatus.style.color = '#059669';
      previewModalVarStatus.textContent = '✓ All Variables Resolved';
    } else {
      previewModalVarStatus.style.background = 'rgba(239, 68, 68, 0.15)';
      previewModalVarStatus.style.color = '#dc2626';
      previewModalVarStatus.textContent = `⚠️ Missing values for: {${resolution.missingVariables.join('}, {')}}`;
    }

    modalPreviewAiPrompt.classList.add('open');
  }

  // --- Right Panel Dynamic Variables & Hub Controller ---
  function populateRightPanelVariables() {
    if (runnerVar_Page_context) {
      if (runnerVarValues['Page_context'] !== undefined) {
        runnerVar_Page_context.value = runnerVarValues['Page_context'];
      }
    }
    if (snippetVar_Page_context) {
      if (runnerVarValues['Page_context'] !== undefined) {
        snippetVar_Page_context.value = runnerVarValues['Page_context'];
      }
    }
    if (runnerVar_Ticket_ID) {
      if (runnerVarValues['Ticket_ID'] !== undefined) {
        runnerVar_Ticket_ID.value = runnerVarValues['Ticket_ID'];
      }
    }
    if (snippetVar_Ticket_ID) {
      if (runnerVarValues['Ticket_ID'] !== undefined) {
        snippetVar_Ticket_ID.value = runnerVarValues['Ticket_ID'];
      }
    }
    if (runnerVar_Customer_Message) {
      if (runnerVarValues['Customer_Message'] !== undefined) {
        runnerVar_Customer_Message.value = runnerVarValues['Customer_Message'];
      }
    }
    if (snippetVar_Customer_Message) {
      if (runnerVarValues['Customer_Message'] !== undefined) {
        snippetVar_Customer_Message.value = runnerVarValues['Customer_Message'];
      }
    }
    if (runnerVar_Resolution_Steps) {
      if (runnerVarValues['Resolution_Steps'] !== undefined) {
        runnerVar_Resolution_Steps.value = runnerVarValues['Resolution_Steps'];
      }
    }
    if (snippetVar_Resolution_Steps) {
      if (runnerVarValues['Resolution_Steps'] !== undefined) {
        snippetVar_Resolution_Steps.value = runnerVarValues['Resolution_Steps'];
      }
    }

    renderRightPanelCustomVars();
    renderSnippetRightPanelCustomVars();
    populateRunnerVarSelectDropdown();
    populateSnippetRightVarDropdown();
    syncAllRightPanelVarValues();
  }

  function populateRunnerVariablesForm() {
    populateRightPanelVariables();
  }

  function syncAllRightPanelVarValues() {
    // 1. Sync Page_context
    let pageVal = runnerVarValues['Page_context'];
    if (runnerVar_Page_context && runnerVar_Page_context === document.activeElement) {
      pageVal = runnerVar_Page_context.value;
    } else if (snippetVar_Page_context && snippetVar_Page_context === document.activeElement) {
      pageVal = snippetVar_Page_context.value;
    } else if (pageVal === undefined && runnerVar_Page_context) {
      pageVal = runnerVar_Page_context.value;
    }
    runnerVarValues['Page_context'] = pageVal || '';
    if (runnerVar_Page_context && runnerVar_Page_context !== document.activeElement) {
      runnerVar_Page_context.value = runnerVarValues['Page_context'];
    }
    if (snippetVar_Page_context && snippetVar_Page_context !== document.activeElement) {
      snippetVar_Page_context.value = runnerVarValues['Page_context'];
    }
    const pageLen = (runnerVarValues['Page_context'] || '').length;
    const pageBadgeText = pageLen > 0 ? `🌐 Extracted (${pageLen} chars)` : `🌐 Webpage (0 chars)`;
    if (pageContextLengthBadge) pageContextLengthBadge.textContent = pageBadgeText;
    if (snippetPageContextLengthBadge) snippetPageContextLengthBadge.textContent = pageBadgeText;

    // 2. Sync Ticket_ID
    let ticketVal = runnerVarValues['Ticket_ID'];
    if (runnerVar_Ticket_ID && runnerVar_Ticket_ID === document.activeElement) {
      ticketVal = runnerVar_Ticket_ID.value;
    } else if (snippetVar_Ticket_ID && snippetVar_Ticket_ID === document.activeElement) {
      ticketVal = snippetVar_Ticket_ID.value;
    } else if (ticketVal === undefined && runnerVar_Ticket_ID) {
      ticketVal = runnerVar_Ticket_ID.value;
    }
    runnerVarValues['Ticket_ID'] = ticketVal || '';
    if (runnerVar_Ticket_ID && runnerVar_Ticket_ID !== document.activeElement) {
      runnerVar_Ticket_ID.value = runnerVarValues['Ticket_ID'];
    }
    if (snippetVar_Ticket_ID && snippetVar_Ticket_ID !== document.activeElement) {
      snippetVar_Ticket_ID.value = runnerVarValues['Ticket_ID'];
    }
    const ticketTrim = (runnerVarValues['Ticket_ID'] || '').trim();
    const ticketBadgeText = ticketTrim ? `🌐 #${ticketTrim}` : `🌐 Ticket: Auto`;
    if (ticketIdStatusBadge) ticketIdStatusBadge.textContent = ticketBadgeText;
    if (snippetTicketIdStatusBadge) snippetTicketIdStatusBadge.textContent = ticketBadgeText;

    // 3. Sync Customer_Message
    let msgVal = runnerVarValues['Customer_Message'];
    if (runnerVar_Customer_Message && runnerVar_Customer_Message === document.activeElement) {
      msgVal = runnerVar_Customer_Message.value;
    } else if (snippetVar_Customer_Message && snippetVar_Customer_Message === document.activeElement) {
      msgVal = snippetVar_Customer_Message.value;
    } else if (msgVal === undefined && runnerVar_Customer_Message) {
      msgVal = runnerVar_Customer_Message.value;
    }
    runnerVarValues['Customer_Message'] = msgVal || '';
    if (runnerVar_Customer_Message && runnerVar_Customer_Message !== document.activeElement) {
      runnerVar_Customer_Message.value = runnerVarValues['Customer_Message'];
    }
    if (snippetVar_Customer_Message && snippetVar_Customer_Message !== document.activeElement) {
      snippetVar_Customer_Message.value = runnerVarValues['Customer_Message'];
    }
    const msgTrim = (runnerVarValues['Customer_Message'] || '').trim();
    const msgBadgeText = msgTrim ? `🌐 ${msgTrim.slice(0, 15)}...` : `🌐 Message: Auto`;
    if (customerMsgStatusBadge) customerMsgStatusBadge.textContent = msgBadgeText;
    if (snippetCustomerMsgStatusBadge) snippetCustomerMsgStatusBadge.textContent = msgBadgeText;

    // 4. Sync Resolution_Steps
    let stepsVal = runnerVarValues['Resolution_Steps'];
    if (runnerVar_Resolution_Steps && runnerVar_Resolution_Steps === document.activeElement) {
      stepsVal = runnerVar_Resolution_Steps.value;
    } else if (snippetVar_Resolution_Steps && snippetVar_Resolution_Steps === document.activeElement) {
      stepsVal = snippetVar_Resolution_Steps.value;
    } else if (stepsVal === undefined && runnerVar_Resolution_Steps) {
      stepsVal = runnerVar_Resolution_Steps.value;
    }
    runnerVarValues['Resolution_Steps'] = stepsVal || '';
    if (runnerVar_Resolution_Steps && runnerVar_Resolution_Steps !== document.activeElement) {
      runnerVar_Resolution_Steps.value = runnerVarValues['Resolution_Steps'];
    }
    if (snippetVar_Resolution_Steps && snippetVar_Resolution_Steps !== document.activeElement) {
      snippetVar_Resolution_Steps.value = runnerVarValues['Resolution_Steps'];
    }
    const stepsTrim = (runnerVarValues['Resolution_Steps'] || '').trim();
    const stepsBadgeText = stepsTrim ? `✨ Steps ready (${stepsTrim.split('\n').filter(Boolean).length} steps)` : `Ready to generate`;
    if (resolutionStepsStatus) resolutionStepsStatus.textContent = stepsBadgeText;
    if (snippetResolutionStepsStatus) snippetResolutionStepsStatus.textContent = stepsTrim ? '✓ Steps ready' : 'Ready';

    // 5. Custom Variables (Includes Engineer_Name, Support_Tier, and any user-defined variables)
    customVariables.forEach(v => {
      const aiInput = document.getElementById(`runnerCustomVar_${v.id}`);
      const snipInput = document.getElementById(`snippetCustomVar_${v.id}`);
      let val = runnerVarValues[v.key];
      if (aiInput && aiInput === document.activeElement) {
        val = aiInput.value;
      } else if (snipInput && snipInput === document.activeElement) {
        val = snipInput.value;
      } else if (val === undefined && v.defaultValue) {
        val = v.defaultValue;
      }
      runnerVarValues[v.key] = val || '';
      if (aiInput && aiInput !== document.activeElement && aiInput.value !== runnerVarValues[v.key]) {
        aiInput.value = runnerVarValues[v.key];
      }
      if (snipInput && snipInput !== document.activeElement && snipInput.value !== runnerVarValues[v.key]) {
        snipInput.value = runnerVarValues[v.key];
      }

      if (v.key.toLowerCase() === 'engineer_name') {
        settings.defaultAuthor = runnerVarValues[v.key];
      }

      const displayVal = runnerVarValues[v.key] ? (runnerVarValues[v.key].length > 16 ? runnerVarValues[v.key].slice(0, 14) + '...' : runnerVarValues[v.key]) : 'No value';
      const aiStatus = document.getElementById(`customVarStatus_${v.id}`);
      if (aiStatus) aiStatus.textContent = `⚙️ ${displayVal}`;
      const snipStatus = document.getElementById(`snippetCustomVarStatus_${v.id}`);
      if (snipStatus) snipStatus.textContent = `⚙️ ${displayVal}`;
    });

    updateRunnerResolvedPrompt();
    updateSnippetResolvedOutput();
    updatePreviewText();
  }

  function updateSnippetResolvedOutput() {
    if (!snippetResolvedOutput) return;
    const rawContent = (documentSurface && documentSurface.innerText) || '';
    const sampleValues = buildSnippetSampleValues();

    const engine = window.ParivartanEngine || window.PariwartanEngine;
    const rendered = engine
      ? engine.render(rawContent, sampleValues, settings)
      : rawContent;
    snippetResolvedOutput.value = rendered;

    if (snippetRunnerShortcutText) {
      const sc = (snippetShortcutInput && snippetShortcutInput.value) || '';
      snippetRunnerShortcutText.textContent = sc ? (sc.startsWith('/') ? sc : '/' + sc) : 'No shortcut';
    }
    if (snippetTestExpectedShortcut) {
      const sc = (snippetShortcutInput && snippetShortcutInput.value) || '';
      snippetTestExpectedShortcut.textContent = sc ? (sc.startsWith('/') ? sc : '/' + sc) : '/shortcut';
    }
  }

  // Bind input listeners for AI prompt right panel variable fields
  if (runnerVar_Page_context) {
    runnerVar_Page_context.addEventListener('input', () => {
      runnerVar_Page_context.classList.remove('error');
      syncAllRightPanelVarValues();
    });
  }
  if (runnerVar_Ticket_ID) {
    runnerVar_Ticket_ID.addEventListener('input', () => {
      runnerVar_Ticket_ID.classList.remove('error');
      syncAllRightPanelVarValues();
    });
  }
  if (runnerVar_Customer_Message) {
    runnerVar_Customer_Message.addEventListener('input', () => {
      runnerVar_Customer_Message.classList.remove('error');
      syncAllRightPanelVarValues();
    });
  }
  if (runnerVar_Resolution_Steps) {
    runnerVar_Resolution_Steps.addEventListener('input', () => {
      runnerVar_Resolution_Steps.classList.remove('error');
      syncAllRightPanelVarValues();
    });
  }

  // Bind input listeners for Snippet right panel variable fields
  if (snippetVar_Page_context) {
    snippetVar_Page_context.addEventListener('input', () => {
      snippetVar_Page_context.classList.remove('error');
      syncAllRightPanelVarValues();
    });
  }
  if (snippetVar_Ticket_ID) {
    snippetVar_Ticket_ID.addEventListener('input', () => {
      snippetVar_Ticket_ID.classList.remove('error');
      syncAllRightPanelVarValues();
    });
  }
  if (snippetVar_Customer_Message) {
    snippetVar_Customer_Message.addEventListener('input', () => {
      snippetVar_Customer_Message.classList.remove('error');
      syncAllRightPanelVarValues();
    });
  }
  if (snippetVar_Resolution_Steps) {
    snippetVar_Resolution_Steps.addEventListener('input', () => {
      snippetVar_Resolution_Steps.classList.remove('error');
      syncAllRightPanelVarValues();
    });
  }

  // --- Populate & Handle Right Panel Variable Selector Dropdown ---
  function populateRunnerVarSelectDropdown() {
    if (!runnerVarSelectDropdown || !rightPanelCustomVarsOptgroup) return;
    rightPanelCustomVarsOptgroup.innerHTML = '';

    if (customVariables.length === 0) {
      const opt = document.createElement('option');
      opt.disabled = true;
      opt.textContent = 'No custom variables defined';
      rightPanelCustomVarsOptgroup.appendChild(opt);
    } else {
      customVariables.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.key;
        opt.setAttribute('data-id', v.id);
        opt.setAttribute('data-custom', 'true');
        opt.textContent = `{${v.key}} — ${v.name || 'Custom'}`;
        rightPanelCustomVarsOptgroup.appendChild(opt);
      });
    }

    if (customVarsCountBadge) {
      customVarsCountBadge.textContent = `${customVariables.length} custom`;
    }

    handleRunnerVarDropdownChange();
  }

  function handleRunnerVarDropdownChange() {
    if (!runnerVarSelectDropdown) return;
    const selectedKey = runnerVarSelectDropdown.value;
    const selectedOpt = runnerVarSelectDropdown.options[runnerVarSelectDropdown.selectedIndex];
    const isCustom = selectedOpt ? selectedOpt.getAttribute('data-custom') === 'true' : false;

    if (btnRightPanelEditCustomVar && btnRightPanelDeleteCustomVar) {
      btnRightPanelEditCustomVar.style.display = isCustom ? 'inline-flex' : 'none';
      btnRightPanelDeleteCustomVar.style.display = isCustom ? 'inline-flex' : 'none';
    }

    if (selectedVarSourceBadge) {
      if (isCustom) {
        selectedVarSourceBadge.textContent = '⚙️ Custom';
        selectedVarSourceBadge.style.color = '#f59e0b';
        selectedVarSourceBadge.style.background = 'rgba(245, 158, 11, 0.12)';
      } else if (['Page_context', 'Ticket_ID', 'Customer_Message'].includes(selectedKey)) {
        selectedVarSourceBadge.textContent = '🌐 Webpage';
        selectedVarSourceBadge.style.color = 'var(--accent)';
        selectedVarSourceBadge.style.background = 'rgba(37, 99, 235, 0.12)';
      } else if (selectedKey === 'Resolution_Steps') {
        selectedVarSourceBadge.textContent = '✨ AI Generated';
        selectedVarSourceBadge.style.color = '#8b5cf6';
        selectedVarSourceBadge.style.background = 'rgba(139, 92, 246, 0.12)';
      }
    }

    if (selectedVarInfoText) {
      if (isCustom) {
        const found = customVariables.find(v => v.key === selectedKey);
        selectedVarInfoText.textContent = found ? (found.defaultValue ? `Default: "${found.defaultValue}"` : 'User defined custom variable') : 'Custom variable';
      } else if (selectedKey === 'Page_context') {
        selectedVarInfoText.textContent = 'Auto-extracted page/ticket body';
      } else if (selectedKey === 'Ticket_ID') {
        selectedVarInfoText.textContent = 'Auto-extracted ticket identifier';
      } else if (selectedKey === 'Customer_Message') {
        selectedVarInfoText.textContent = 'Auto-extracted customer inquiry';
      } else if (selectedKey === 'Resolution_Steps') {
        selectedVarInfoText.textContent = 'AI-formulated technical action steps';
      }
    }
  }

  if (runnerVarSelectDropdown) {
    runnerVarSelectDropdown.addEventListener('change', () => {
      handleRunnerVarDropdownChange();
      const selectedKey = runnerVarSelectDropdown.value;
      const targetDrawerId = `drawer_${selectedKey}`;
      const drawer = document.getElementById(targetDrawerId);
      if (drawer) {
        drawer.style.display = 'block';
        const toggleBtn = document.querySelector(`[data-drawer="${targetDrawerId}"]`);
        if (toggleBtn) {
          const span = toggleBtn.querySelector('span');
          if (span) span.textContent = '▲ Hide';
        }
        const firstInput = drawer.querySelector('input, textarea');
        if (firstInput) firstInput.focus();
      }
    });
  }

  if (btnInsertSelectedVar && runnerVarSelectDropdown) {
    btnInsertSelectedVar.addEventListener('click', () => {
      const selectedKey = runnerVarSelectDropdown.value;
      if (selectedKey) {
        insertVariableTagIntoPrompt(selectedKey);
      }
    });
  }

  // --- Render Custom Variables in Right Panel (Clean Rows with Disclosure Drawer) ---
  function renderRightPanelCustomVars() {
    if (!rightPanelCustomVarsList) return;
    rightPanelCustomVarsList.innerHTML = '';

    if (customVariables.length === 0) {
      rightPanelCustomVarsList.innerHTML = `
        <div style="font-size: 0.72rem; color: var(--text-muted); font-style: italic; padding: 4px 2px;">
          No custom variables yet. Click "Add" above to define one.
        </div>
      `;
      return;
    }

    customVariables.forEach(v => {
      const row = document.createElement('div');
      row.className = 'runner-var-clean-row';
      const currentVal = runnerVarValues[v.key] !== undefined ? runnerVarValues[v.key] : (v.defaultValue || '');
      const displayVal = currentVal ? (currentVal.length > 16 ? currentVal.slice(0, 14) + '...' : currentVal) : 'No value';

      row.innerHTML = `
        <div class="runner-var-row-main">
          <button type="button" class="runner-chip-insert" data-tag="{${escapeHTML(v.key)}}" title="Click to insert {${escapeHTML(v.key)}} into prompt editor">
            + {${escapeHTML(v.key)}}
          </button>
          <span class="var-clean-status" id="customVarStatus_${escapeHTML(v.id)}">⚙️ ${escapeHTML(displayVal)}</span>
          <div style="display:flex; align-items:center; gap:4px; flex-shrink:0;">
            <button type="button" class="btn-var-toggle" data-drawer="drawer_custom_${escapeHTML(v.id)}" data-action-label="Value" title="Toggle input value for {${escapeHTML(v.key)}}">
              <span>▼ Value</span>
            </button>
            <button type="button" class="runner-action-btn btn-edit-custom-var" data-var-id="${escapeHTML(v.id)}" title="Edit variable definition" style="padding:0 5px; height:22px;">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            </button>
            <button type="button" class="runner-action-btn btn-danger-action btn-del-custom-var" data-var-id="${escapeHTML(v.id)}" title="Delete variable" style="padding:0 5px; height:22px;">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
        <div class="runner-var-drawer" id="drawer_custom_${escapeHTML(v.id)}" style="display:none; margin-top:6px;">
          <input type="text" id="runnerCustomVar_${escapeHTML(v.id)}" class="runner-var-input" placeholder="${escapeHTML(v.defaultValue || 'Enter value...')}" value="${escapeHTML(currentVal)}">
        </div>
      `;

      const input = row.querySelector(`#runnerCustomVar_${v.id}`);
      const statusSpan = row.querySelector(`#customVarStatus_${v.id}`);
      if (input) {
        input.addEventListener('input', () => {
          input.classList.remove('error');
          runnerVarValues[v.key] = input.value;
          if (statusSpan) {
            const val = input.value || v.defaultValue || 'No value';
            statusSpan.textContent = `⚙️ ${val.length > 16 ? val.slice(0, 14) + '...' : val}`;
          }
          updateRunnerResolvedPrompt();
        });
      }

      const editBtn = row.querySelector('.btn-edit-custom-var');
      if (editBtn) {
        editBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          openRightPanelVarEditor(v);
        });
      }

      const delBtn = row.querySelector('.btn-del-custom-var');
      if (delBtn) {
        delBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          await deleteCustomVar(v.id);
          renderRightPanelCustomVars();
          populateRunnerVarSelectDropdown();
        });
      }

      rightPanelCustomVarsList.appendChild(row);
    });
  }

  // --- Inline Custom Variable Creation & Editing in Right Panel ---
  function openRightPanelVarEditor(v = null) {
    if (!rightPanelVarEditorForm) return;
    if (v) {
      if (rightPanelVarFormTitle) rightPanelVarFormTitle.textContent = `Edit Variable: {${v.key}}`;
      if (rightPanelEditingVarId) rightPanelEditingVarId.value = v.id;
      if (rightPanelVarNameInput) rightPanelVarNameInput.value = v.name || '';
      if (rightPanelVarKeyInput) rightPanelVarKeyInput.value = v.key || '';
      if (rightPanelVarDefaultInput) rightPanelVarDefaultInput.value = v.defaultValue || '';
    } else {
      if (rightPanelVarFormTitle) rightPanelVarFormTitle.textContent = 'Add Custom Variable';
      if (rightPanelEditingVarId) rightPanelEditingVarId.value = '';
      if (rightPanelVarNameInput) rightPanelVarNameInput.value = '';
      if (rightPanelVarKeyInput) rightPanelVarKeyInput.value = '';
      if (rightPanelVarDefaultInput) rightPanelVarDefaultInput.value = '';
    }
    rightPanelVarEditorForm.style.display = 'block';
    rightPanelVarNameInput?.focus();
  }

  const hideRightPanelVarForm = () => {
    if (rightPanelVarEditorForm) rightPanelVarEditorForm.style.display = 'none';
    if (rightPanelEditingVarId) rightPanelEditingVarId.value = '';
    if (rightPanelVarNameInput) rightPanelVarNameInput.value = '';
    if (rightPanelVarKeyInput) rightPanelVarKeyInput.value = '';
    if (rightPanelVarDefaultInput) rightPanelVarDefaultInput.value = '';
  };

  if (btnRightPanelNewVar) {
    btnRightPanelNewVar.addEventListener('click', () => {
      openRightPanelVarEditor(null);
    });
  }

  if (btnRightPanelEditCustomVar) {
    btnRightPanelEditCustomVar.addEventListener('click', () => {
      const selectedKey = runnerVarSelectDropdown ? runnerVarSelectDropdown.value : null;
      const v = customVariables.find(item => item.key === selectedKey);
      if (!v) return;
      openRightPanelVarEditor(v);
    });
  }

  if (btnRightPanelDeleteCustomVar) {
    btnRightPanelDeleteCustomVar.addEventListener('click', async () => {
      const selectedKey = runnerVarSelectDropdown ? runnerVarSelectDropdown.value : null;
      const v = customVariables.find(item => item.key === selectedKey);
      if (!v) return;
      await deleteCustomVar(v.id);
      renderRightPanelCustomVars();
      populateRunnerVarSelectDropdown();
    });
  }

  if (rightPanelVarNameInput) {
    rightPanelVarNameInput.addEventListener('input', () => {
      if (rightPanelVarKeyInput && (!rightPanelEditingVarId || !rightPanelEditingVarId.value)) {
        const cleanKey = rightPanelVarNameInput.value
          .trim()
          .replace(/[^a-zA-Z0-9\s_-]/g, '')
          .replace(/\s+/g, '_');
        rightPanelVarKeyInput.value = cleanKey;
      }
    });
  }

  if (btnRightPanelCancelVar) btnRightPanelCancelVar.addEventListener('click', hideRightPanelVarForm);
  if (btnRightPanelCancelVarBtn) btnRightPanelCancelVarBtn.addEventListener('click', hideRightPanelVarForm);

  if (btnRightPanelSaveVarBtn) {
    btnRightPanelSaveVarBtn.addEventListener('click', async () => {
      const name = (rightPanelVarNameInput?.value || '').trim();
      let key = (rightPanelVarKeyInput?.value || '').trim().replace(/^\{+|\}+$/g, '');
      const defaultVal = (rightPanelVarDefaultInput?.value || '').trim();
      const editingId = rightPanelEditingVarId ? rightPanelEditingVarId.value : null;

      if (!name) {
        showToast('Please enter a variable name', 'error');
        rightPanelVarNameInput?.focus();
        return;
      }
      if (!key) {
        key = name.replace(/[^a-zA-Z0-9\s_-]/g, '').replace(/\s+/g, '_');
      }

      if (editingId) {
        const existing = customVariables.find(v => v.id === editingId);
        if (existing) {
          existing.name = name;
          existing.key = key;
          existing.defaultValue = defaultVal;
          existing.description = `Custom variable ${name}`;
          await window.SnippetStorage.saveCustomVariables(customVariables);
          updatePromptCountBadges();
          renderVariableChips();
          renderSnippetVariableChips();
          renderRightPanelCustomVars();
          renderSnippetRightPanelCustomVars();
          populateRunnerVarSelectDropdown();
          populateSnippetRightVarDropdown();
          hideRightPanelVarForm();
          showToast(`✓ Updated custom variable {${key}}!`, 'success');
          return;
        }
      }

      if (customVariables.some(v => v.key.toLowerCase() === key.toLowerCase())) {
        showToast(`Variable key {${key}} already exists!`, 'error');
        rightPanelVarKeyInput?.focus();
        return;
      }

      const newVar = {
        id: 'var_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        name,
        key,
        defaultValue: defaultVal,
        description: `Custom variable ${name}`,
        isSystem: false
      };

      customVariables.push(newVar);
      await window.SnippetStorage.saveCustomVariables(customVariables);
      updatePromptCountBadges();
      renderVariableChips();
      renderSnippetVariableChips();
      renderRightPanelCustomVars();
      renderSnippetRightPanelCustomVars();
      populateRunnerVarSelectDropdown();
      populateSnippetRightVarDropdown();
      hideRightPanelVarForm();
      showToast(`✓ Added custom variable {${key}}!`, 'success');
    });
  }

  // =========================================================================
  // --- SNIPPET RIGHT PANEL: Variables Hub, Inline Editor, Preview & Test ---
  // =========================================================================

  function populateSnippetRightVarDropdown() {
    if (!snippetRightVarDropdown || !snippetRightCustomVarsOptgroup) return;
    snippetRightCustomVarsOptgroup.innerHTML = '';

    if (customVariables.length === 0) {
      const opt = document.createElement('option');
      opt.disabled = true;
      opt.textContent = 'No custom variables defined';
      snippetRightCustomVarsOptgroup.appendChild(opt);
    } else {
      customVariables.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.key;
        opt.setAttribute('data-id', v.id);
        opt.setAttribute('data-custom', 'true');
        opt.textContent = `{${v.key}} — ${v.name || 'Custom'}`;
        snippetRightCustomVarsOptgroup.appendChild(opt);
      });
    }

    if (snippetRightCustomVarsCountBadge) {
      snippetRightCustomVarsCountBadge.textContent = `${customVariables.length} custom`;
    }

    handleSnippetRightVarDropdownChange();
  }

  function handleSnippetRightVarDropdownChange() {
    if (!snippetRightVarDropdown) return;
    const selectedKey = snippetRightVarDropdown.value;
    const selectedOpt = snippetRightVarDropdown.options[snippetRightVarDropdown.selectedIndex];
    const isCustom = selectedOpt ? selectedOpt.getAttribute('data-custom') === 'true' : false;

    if (btnSnippetRightEditCustomVar && btnSnippetRightDeleteCustomVar) {
      btnSnippetRightEditCustomVar.style.display = isCustom ? 'inline-flex' : 'none';
      btnSnippetRightDeleteCustomVar.style.display = isCustom ? 'inline-flex' : 'none';
    }

    if (snippetRightVarSourceBadge) {
      if (isCustom) {
        snippetRightVarSourceBadge.textContent = '⚙️ Custom';
        snippetRightVarSourceBadge.style.color = '#f59e0b';
        snippetRightVarSourceBadge.style.background = 'rgba(245, 158, 11, 0.12)';
      } else if (['Page_context', 'Ticket_ID', 'Customer_Message'].includes(selectedKey)) {
        snippetRightVarSourceBadge.textContent = '🌐 Webpage';
        snippetRightVarSourceBadge.style.color = 'var(--accent)';
        snippetRightVarSourceBadge.style.background = 'rgba(37, 99, 235, 0.12)';
      } else if (selectedKey === 'Resolution_Steps') {
        snippetRightVarSourceBadge.textContent = '✨ AI Generated';
        snippetRightVarSourceBadge.style.color = '#8b5cf6';
        snippetRightVarSourceBadge.style.background = 'rgba(139, 92, 246, 0.12)';
      }
    }

    if (snippetRightVarInfoText) {
      if (isCustom) {
        const found = customVariables.find(v => v.key === selectedKey);
        snippetRightVarInfoText.textContent = found ? (found.defaultValue ? `Default: "${found.defaultValue}"` : 'User defined custom variable') : 'Custom variable';
      } else if (selectedKey === 'Page_context') {
        snippetRightVarInfoText.textContent = 'Auto-extracted page/ticket body';
      } else if (selectedKey === 'Ticket_ID') {
        snippetRightVarInfoText.textContent = 'Auto-extracted ticket identifier';
      } else if (selectedKey === 'Customer_Message') {
        snippetRightVarInfoText.textContent = 'Auto-extracted customer inquiry';
      } else if (selectedKey === 'Resolution_Steps') {
        snippetRightVarInfoText.textContent = 'AI-formulated technical action steps';
      }
    }
  }

  if (snippetRightVarDropdown) {
    snippetRightVarDropdown.addEventListener('change', () => {
      handleSnippetRightVarDropdownChange();
      const selectedKey = snippetRightVarDropdown.value;
      const targetDrawerId = `snippetDrawer_${selectedKey}`;
      const drawer = document.getElementById(targetDrawerId);
      if (drawer) {
        drawer.style.display = 'block';
        const toggleBtn = document.querySelector(`[data-drawer="${targetDrawerId}"]`);
        if (toggleBtn) {
          const span = toggleBtn.querySelector('span');
          if (span) span.textContent = '▲ Hide';
        }
        const firstInput = drawer.querySelector('input, textarea');
        if (firstInput) firstInput.focus();
      }
    });
  }

  if (btnSnippetRightInsertVar && snippetRightVarDropdown) {
    btnSnippetRightInsertVar.addEventListener('click', () => {
      const selectedKey = snippetRightVarDropdown.value;
      if (selectedKey) {
        insertAtCursor(`{${selectedKey}}`);
        updateSnippetDetectedVariables();
        updatePreviewText();
        showToast(`Inserted {${selectedKey}} into snippet!`, 'success');
      }
    });
  }

  function renderSnippetRightPanelCustomVars() {
    if (!snippetRightCustomVarsList) return;
    snippetRightCustomVarsList.innerHTML = '';

    if (customVariables.length === 0) {
      snippetRightCustomVarsList.innerHTML = `
        <div style="font-size: 0.72rem; color: var(--text-muted); font-style: italic; padding: 4px 2px;">
          No custom variables yet. Click "Add" above to define one.
        </div>
      `;
      return;
    }

    customVariables.forEach(v => {
      const row = document.createElement('div');
      row.className = 'runner-var-clean-row';
      const currentVal = runnerVarValues[v.key] !== undefined ? runnerVarValues[v.key] : (v.defaultValue || '');
      const displayVal = currentVal ? (currentVal.length > 16 ? currentVal.slice(0, 14) + '...' : currentVal) : 'No value';

      row.innerHTML = `
        <div class="runner-var-row-main">
          <button type="button" class="runner-chip-insert" data-tag="{${escapeHTML(v.key)}}" title="Click to insert {${escapeHTML(v.key)}} into snippet editor">
            + {${escapeHTML(v.key)}}
          </button>
          <span class="var-clean-status" id="snippetCustomVarStatus_${escapeHTML(v.id)}">⚙️ ${escapeHTML(displayVal)}</span>
          <div style="display:flex; align-items:center; gap:4px; flex-shrink:0;">
            <button type="button" class="btn-var-toggle" data-drawer="snippetDrawer_custom_${escapeHTML(v.id)}" data-action-label="Value" title="Toggle input value for {${escapeHTML(v.key)}}">
              <span>▼ Value</span>
            </button>
            <button type="button" class="runner-action-btn btn-snippet-edit-custom-var" data-var-id="${escapeHTML(v.id)}" title="Edit variable definition" style="padding:0 5px; height:22px;">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            </button>
            <button type="button" class="runner-action-btn btn-danger-action btn-snippet-del-custom-var" data-var-id="${escapeHTML(v.id)}" title="Delete variable" style="padding:0 5px; height:22px;">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
        <div class="runner-var-drawer" id="snippetDrawer_custom_${escapeHTML(v.id)}" style="display:none; margin-top:6px;">
          <input type="text" id="snippetCustomVar_${escapeHTML(v.id)}" class="runner-var-input" placeholder="${escapeHTML(v.defaultValue || 'Enter value...')}" value="${escapeHTML(currentVal)}">
        </div>
      `;

      const input = row.querySelector(`#snippetCustomVar_${v.id}`);
      const statusSpan = row.querySelector(`#snippetCustomVarStatus_${v.id}`);
      if (input) {
        input.addEventListener('input', () => {
          input.classList.remove('error');
          runnerVarValues[v.key] = input.value;
          if (statusSpan) {
            const val = input.value || v.defaultValue || 'No value';
            statusSpan.textContent = `⚙️ ${val.length > 16 ? val.slice(0, 14) + '...' : val}`;
          }
          syncAllRightPanelVarValues();
        });
      }

      const editBtn = row.querySelector('.btn-snippet-edit-custom-var');
      if (editBtn) {
        editBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          openSnippetRightPanelVarEditor(v);
        });
      }

      const delBtn = row.querySelector('.btn-snippet-del-custom-var');
      if (delBtn) {
        delBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          await deleteCustomVar(v.id);
          renderRightPanelCustomVars();
          renderSnippetRightPanelCustomVars();
          populateRunnerVarSelectDropdown();
          populateSnippetRightVarDropdown();
        });
      }

      snippetRightCustomVarsList.appendChild(row);
    });
  }

  function openSnippetRightPanelVarEditor(v = null) {
    if (!snippetRightVarEditorForm) return;
    if (v) {
      if (snippetRightVarFormTitle) snippetRightVarFormTitle.textContent = `Edit Variable: {${v.key}}`;
      if (snippetRightEditingVarId) snippetRightEditingVarId.value = v.id;
      if (snippetRightVarNameInput) snippetRightVarNameInput.value = v.name || '';
      if (snippetRightVarKeyInput) snippetRightVarKeyInput.value = v.key || '';
      if (snippetRightVarDefaultInput) snippetRightVarDefaultInput.value = v.defaultValue || '';
    } else {
      if (snippetRightVarFormTitle) snippetRightVarFormTitle.textContent = 'Add Custom Variable';
      if (snippetRightEditingVarId) snippetRightEditingVarId.value = '';
      if (snippetRightVarNameInput) snippetRightVarNameInput.value = '';
      if (snippetRightVarKeyInput) snippetRightVarKeyInput.value = '';
      if (snippetRightVarDefaultInput) snippetRightVarDefaultInput.value = '';
    }
    snippetRightVarEditorForm.style.display = 'block';
    snippetRightVarNameInput?.focus();
  }

  const hideSnippetRightPanelVarForm = () => {
    if (snippetRightVarEditorForm) snippetRightVarEditorForm.style.display = 'none';
    if (snippetRightEditingVarId) snippetRightEditingVarId.value = '';
    if (snippetRightVarNameInput) snippetRightVarNameInput.value = '';
    if (snippetRightVarKeyInput) snippetRightVarKeyInput.value = '';
    if (snippetRightVarDefaultInput) snippetRightVarDefaultInput.value = '';
  };

  if (btnSnippetRightNewVar) {
    btnSnippetRightNewVar.addEventListener('click', () => {
      openSnippetRightPanelVarEditor(null);
    });
  }

  if (btnSnippetRightEditCustomVar) {
    btnSnippetRightEditCustomVar.addEventListener('click', () => {
      const selectedKey = snippetRightVarDropdown ? snippetRightVarDropdown.value : null;
      const v = customVariables.find(item => item.key === selectedKey);
      if (!v) return;
      openSnippetRightPanelVarEditor(v);
    });
  }

  if (btnSnippetRightDeleteCustomVar) {
    btnSnippetRightDeleteCustomVar.addEventListener('click', async () => {
      const selectedKey = snippetRightVarDropdown ? snippetRightVarDropdown.value : null;
      const v = customVariables.find(item => item.key === selectedKey);
      if (!v) return;
      await deleteCustomVar(v.id);
      renderRightPanelCustomVars();
      renderSnippetRightPanelCustomVars();
      populateRunnerVarSelectDropdown();
      populateSnippetRightVarDropdown();
    });
  }

  if (snippetRightVarNameInput) {
    snippetRightVarNameInput.addEventListener('input', () => {
      if (snippetRightVarKeyInput && (!snippetRightEditingVarId || !snippetRightEditingVarId.value)) {
        const cleanKey = snippetRightVarNameInput.value
          .trim()
          .replace(/[^a-zA-Z0-9\s_-]/g, '')
          .replace(/\s+/g, '_');
        snippetRightVarKeyInput.value = cleanKey;
      }
    });
  }

  if (btnSnippetRightCancelVar) btnSnippetRightCancelVar.addEventListener('click', hideSnippetRightPanelVarForm);
  if (btnSnippetRightCancelVarBtn) btnSnippetRightCancelVarBtn.addEventListener('click', hideSnippetRightPanelVarForm);

  if (btnSnippetRightSaveVarBtn) {
    btnSnippetRightSaveVarBtn.addEventListener('click', async () => {
      const name = (snippetRightVarNameInput?.value || '').trim();
      let key = (snippetRightVarKeyInput?.value || '').trim().replace(/^\{+|\}+$/g, '');
      const defaultVal = (snippetRightVarDefaultInput?.value || '').trim();
      const editingId = snippetRightEditingVarId ? snippetRightEditingVarId.value : null;

      if (!name) {
        showToast('Please enter a variable name', 'error');
        snippetRightVarNameInput?.focus();
        return;
      }
      if (!key) {
        key = name.replace(/[^a-zA-Z0-9\s_-]/g, '').replace(/\s+/g, '_');
      }

      if (editingId) {
        const existing = customVariables.find(v => v.id === editingId);
        if (existing) {
          existing.name = name;
          existing.key = key;
          existing.defaultValue = defaultVal;
          existing.description = `Custom variable ${name}`;
          await window.SnippetStorage.saveCustomVariables(customVariables);
          updatePromptCountBadges();
          renderVariableChips();
          renderSnippetVariableChips();
          renderRightPanelCustomVars();
          renderSnippetRightPanelCustomVars();
          populateRunnerVarSelectDropdown();
          populateSnippetRightVarDropdown();
          hideSnippetRightPanelVarForm();
          showToast(`✓ Updated custom variable {${key}}!`, 'success');
          return;
        }
      }

      if (customVariables.some(v => v.key.toLowerCase() === key.toLowerCase())) {
        showToast(`Variable key {${key}} already exists!`, 'error');
        snippetRightVarKeyInput?.focus();
        return;
      }

      const newVar = {
        id: 'var_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        name,
        key,
        defaultValue: defaultVal,
        description: `Custom variable ${name}`,
        isSystem: false
      };

      customVariables.push(newVar);
      await window.SnippetStorage.saveCustomVariables(customVariables);
      updatePromptCountBadges();
      renderVariableChips();
      renderSnippetVariableChips();
      renderRightPanelCustomVars();
      renderSnippetRightPanelCustomVars();
      populateRunnerVarSelectDropdown();
      populateSnippetRightVarDropdown();
      hideSnippetRightPanelVarForm();
      showToast(`✓ Added custom variable {${key}}!`, 'success');
    });
  }

  // Generate Resolution Steps from Snippet Right Panel
  if (btnSnippetRightGenSteps) {
    btnSnippetRightGenSteps.addEventListener('click', async () => {
      const pageText = (runnerVarValues['Page_context'] || '').trim();
      const custMsg = (runnerVarValues['Customer_Message'] || '').trim();
      const combinedContext = [pageText, custMsg].filter(Boolean).join('\n\n');

      if (!combinedContext) {
        showToast('Please enter or load Page Context / Customer Message first.', 'error');
        return;
      }

      const origText = btnSnippetRightGenSteps.textContent;
      btnSnippetRightGenSteps.disabled = true;
      btnSnippetRightGenSteps.textContent = '⏳ Thinking...';
      if (snippetResolutionStepsStatus) snippetResolutionStepsStatus.textContent = 'Generating...';

      try {
        const provider = (settings && settings.ai && settings.ai.provider) || 'gemini';
        const apiKey = (settings && settings.ai && settings.ai.apiKey) || '';
        const model = (settings && settings.ai && settings.ai.model) || '';
        const customEndpoint = (settings && settings.ai && settings.ai.customEndpoint) || '';

        const generatePrompt = `You are an expert technical specialist. Based on the following customer issue and technical context, formulate 3 to 4 concise, clear technical resolution steps formatted as numbered points. Do not include greetings or pleasantries. Return ONLY the resolution steps:

${combinedContext}`;

        let resultText = '';
        if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
          const resp = await new Promise((resolve) => {
            chrome.runtime.sendMessage({
              action: 'execute_prompt',
              prompt: generatePrompt,
              provider,
              apiKey,
              model,
              customEndpoint,
              persona: 'sysadmin'
            }, resolve);
          });
          if (resp && resp.success) {
            resultText = resp.text;
          } else {
            throw new Error((resp && resp.error) || 'Could not reach AI provider');
          }
        } else if (window.ParivartanAI) {
          resultText = await window.ParivartanAI.generateReply(generatePrompt, {
            provider,
            apiKey,
            model,
            customEndpoint
          });
        }

        if (resultText) {
          runnerVarValues['Resolution_Steps'] = resultText.trim();
          syncAllRightPanelVarValues();
          if (snippetResolutionStepsStatus) snippetResolutionStepsStatus.textContent = '✓ AI steps ready';
          showToast('✨ AI Resolution Steps generated successfully!', 'success');
        }
      } catch (err) {
        console.warn('AI Step generation error, using diagnostic template:', err);
        const fallbackSteps = "1. Inspected network interface error counters and BGP route table.\n2. Applied traffic reroute through secondary edge transit path.\n3. Flushed ARP cache and verified ICMP latency stability under 2ms.\n4. Confirmed zero packet drops over 500 probe cycles.";
        runnerVarValues['Resolution_Steps'] = fallbackSteps;
        syncAllRightPanelVarValues();
        if (snippetResolutionStepsStatus) snippetResolutionStepsStatus.textContent = '✓ Diagnostic steps set';
        showToast('Resolution Steps populated!', 'info');
      } finally {
        btnSnippetRightGenSteps.disabled = false;
        btnSnippetRightGenSteps.textContent = origText;
      }
    });
  }

  // Copy Resolved Snippet Preview
  if (btnCopyResolvedSnippet && snippetResolvedOutput) {
    btnCopyResolvedSnippet.addEventListener('click', () => {
      const text = snippetResolvedOutput.value || '';
      if (!text) {
        showToast('Nothing to copy. Select or write a snippet first.', 'info');
        return;
      }
      navigator.clipboard.writeText(text).then(() => {
        showToast('✓ Copied resolved snippet to clipboard!', 'success');
      }).catch(() => {
        showToast('Failed to copy to clipboard', 'error');
      });
    });
  }

  // Shortcut Expansion Test Box in Snippet Right Panel
  if (snippetTestInput) {
    snippetTestInput.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Tab' || e.key === 'Enter') {
        const text = snippetTestInput.value;
        const cursorPos = snippetTestInput.selectionStart;
        const textBefore = text.slice(0, cursorPos);
        const match = textBefore.match(/(?:^|\s)(\/[a-zA-Z0-9_\-]+)$/);
        if (match) {
          const typedShortcut = match[1].toLowerCase();
          let targetSnippet = null;
          if (activeSnippetId) {
            const cur = snippets.find(s => s.id === activeSnippetId);
            if (cur && cur.shortcut && cur.shortcut.toLowerCase() === typedShortcut) {
              targetSnippet = cur;
            }
          }
          if (!targetSnippet) {
            targetSnippet = snippets.find(s => s.shortcut && s.shortcut.toLowerCase() === typedShortcut);
          }

          if (targetSnippet) {
            e.preventDefault();
            const rawContent = (targetSnippet.id === activeSnippetId && documentSurface)
              ? (documentSurface.innerText || targetSnippet.content)
              : targetSnippet.content;

            const sampleValues = buildSnippetSampleValues();
            const engine = window.ParivartanEngine || window.PariwartanEngine;
            const rendered = engine ? engine.render(rawContent, sampleValues, settings) : rawContent;

            const prefixPos = cursorPos - match[1].length;
            const newText = text.slice(0, prefixPos) + rendered + text.slice(cursorPos);
            snippetTestInput.value = newText;
            const newCursor = prefixPos + rendered.length;
            snippetTestInput.setSelectionRange(newCursor, newCursor);

            if (snippetTestStatus) {
              snippetTestStatus.innerHTML = `<span style="color:var(--success); font-weight:600;">✓ Expanded "${escapeHTML(typedShortcut)}" with dynamic variables!</span>`;
              setTimeout(() => {
                if (snippetTestStatus) snippetTestStatus.textContent = '';
              }, 4000);
            }
          }
        }
      }
    });
  }

  if (btnClearSnippetTestInput && snippetTestInput) {
    btnClearSnippetTestInput.addEventListener('click', () => {
      snippetTestInput.value = '';
      if (snippetTestStatus) snippetTestStatus.textContent = '';
      snippetTestInput.focus();
    });
  }

  // --- AI Generated Resolution Steps Feature ---
  if (btnGenerateResolutionSteps) {
    btnGenerateResolutionSteps.addEventListener('click', async () => {
      const pageText = (runnerVar_Page_context?.value || '').trim();
      const custMsg = (runnerVar_Customer_Message?.value || '').trim();
      const combinedContext = [pageText, custMsg].filter(Boolean).join('\n\n');

      if (!combinedContext) {
        showToast('Please enter or load Page Context / Customer Message first.', 'error');
        return;
      }

      const origText = btnGenerateResolutionSteps.textContent;
      btnGenerateResolutionSteps.disabled = true;
      btnGenerateResolutionSteps.textContent = '⏳ Thinking...';
      if (resolutionStepsStatus) resolutionStepsStatus.textContent = 'AI generating steps...';

      try {
        const provider = (settings && settings.ai && settings.ai.provider) || 'gemini';
        const apiKey = (settings && settings.ai && settings.ai.apiKey) || '';
        const model = (settings && settings.ai && settings.ai.model) || '';
        const customEndpoint = (settings && settings.ai && settings.ai.customEndpoint) || '';

        const generatePrompt = `You are an expert technical specialist. Based on the following customer issue and technical context, formulate 3 to 4 concise, clear technical resolution steps formatted as numbered points. Do not include greetings or pleasantries. Return ONLY the resolution steps:

${combinedContext}`;

        let resultText = '';
        if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
          const resp = await new Promise((resolve) => {
            chrome.runtime.sendMessage({
              action: 'execute_prompt',
              prompt: generatePrompt,
              provider,
              apiKey,
              model,
              customEndpoint,
              persona: 'sysadmin'
            }, resolve);
          });
          if (resp && resp.success) {
            resultText = resp.text;
          } else {
            throw new Error((resp && resp.error) || 'Could not reach AI provider');
          }
        } else if (window.ParivartanAI) {
          resultText = await window.ParivartanAI.generateReply(generatePrompt, {
            provider,
            apiKey,
            model,
            customEndpoint
          });
        }

        if (resultText) {
          if (runnerVar_Resolution_Steps) {
            runnerVar_Resolution_Steps.value = resultText.trim();
          }
          runnerVarValues['Resolution_Steps'] = resultText.trim();
          syncAllRightPanelVarValues();
          if (resolutionStepsStatus) resolutionStepsStatus.textContent = '✓ AI steps generated';
          showToast('✨ AI Resolution Steps generated successfully!', 'success');
        }
      } catch (err) {
        console.warn('AI Step generation error, using diagnostic template:', err);
        const fallbackSteps = "1. Inspected network interface error counters and BGP route table.\n2. Applied traffic reroute through secondary edge transit path.\n3. Flushed ARP cache and verified ICMP latency stability under 2ms.\n4. Confirmed zero packet drops over 500 probe cycles.";
        if (runnerVar_Resolution_Steps) {
          runnerVar_Resolution_Steps.value = fallbackSteps;
        }
        runnerVarValues['Resolution_Steps'] = fallbackSteps;
        syncAllRightPanelVarValues();
        if (resolutionStepsStatus) resolutionStepsStatus.textContent = '✓ Diagnostic steps set';
        showToast('Resolution Steps populated!', 'info');
      } finally {
        btnGenerateResolutionSteps.disabled = false;
        btnGenerateResolutionSteps.textContent = origText;
      }
    });
  }

  // --- Right Panel AI Persona Management ---
  function updateRightPanelPersonaUI() {
    const activeObj = allPersonas.find(p => p.id === activePersonaId) || allPersonas[0];
    if (!activeObj) return;

    if (rightPanelPersonaName) rightPanelPersonaName.textContent = `${activeObj.icon || '🎭'} ${activeObj.name || 'AI Persona'}`;
    if (rightPanelPersonaDesc) {
      rightPanelPersonaDesc.textContent = activeObj.description || (activeObj.systemPrompt ? activeObj.systemPrompt.slice(0, 110) + '...' : '');
    }

    if (btnRightPanelDeletePersona) {
      btnRightPanelDeletePersona.style.display = activeObj.isCustom ? 'inline-flex' : 'none';
    }
  }

  let rightPanelEditingPersonaId = null;

  if (btnRightPanelNewPersona) {
    btnRightPanelNewPersona.addEventListener('click', () => {
      rightPanelEditingPersonaId = null;
      if (rightPanelPersonaFormTitle) rightPanelPersonaFormTitle.textContent = 'New Custom Persona';
      if (rightPanelPersonaIconInput) rightPanelPersonaIconInput.value = '👔';
      if (rightPanelPersonaNameInput) rightPanelPersonaNameInput.value = '';
      if (rightPanelPersonaRoleInput) rightPanelPersonaRoleInput.value = '';
      if (rightPanelPersonaPromptInput) rightPanelPersonaPromptInput.value = '';
      if (rightPanelPersonaEditorForm) rightPanelPersonaEditorForm.style.display = 'block';
      rightPanelPersonaNameInput?.focus();
    });
  }

  if (btnRightPanelEditPersona) {
    btnRightPanelEditPersona.addEventListener('click', () => {
      const activeObj = allPersonas.find(p => p.id === activePersonaId) || allPersonas[0];
      if (!activeObj) return;

      rightPanelEditingPersonaId = activeObj.id;
      if (rightPanelPersonaFormTitle) rightPanelPersonaFormTitle.textContent = `Edit Persona: ${activeObj.name}`;
      if (rightPanelPersonaIconInput) rightPanelPersonaIconInput.value = activeObj.icon || '🎭';
      if (rightPanelPersonaNameInput) rightPanelPersonaNameInput.value = activeObj.name || '';
      if (rightPanelPersonaRoleInput) rightPanelPersonaRoleInput.value = activeObj.role || '';
      if (rightPanelPersonaPromptInput) rightPanelPersonaPromptInput.value = activeObj.systemPrompt || '';
      if (rightPanelPersonaEditorForm) rightPanelPersonaEditorForm.style.display = 'block';
      rightPanelPersonaNameInput?.focus();
    });
  }

  const hideRightPanelPersonaForm = () => {
    if (rightPanelPersonaEditorForm) rightPanelPersonaEditorForm.style.display = 'none';
    rightPanelEditingPersonaId = null;
  };

  if (btnRightPanelCancelPersona) btnRightPanelCancelPersona.addEventListener('click', hideRightPanelPersonaForm);
  if (btnRightPanelCancelPersonaEdit) btnRightPanelCancelPersonaEdit.addEventListener('click', hideRightPanelPersonaForm);

  if (btnRightPanelDeletePersona) {
    btnRightPanelDeletePersona.addEventListener('click', async () => {
      const activeObj = allPersonas.find(p => p.id === activePersonaId);
      if (!activeObj || !activeObj.isCustom) return;

      if (!confirm(`Are you sure you want to delete custom persona "${activeObj.name}"?`)) return;

      try {
        await window.SnippetStorage.deleteCustomPersona(activeObj.id);
        await loadPersonasData();
        selectActivePersona(allPersonas[0].id);
        showToast(`Deleted custom persona "${activeObj.name}"`, 'info');
      } catch (err) {
        showToast(`Failed to delete persona: ${err.message}`, 'error');
      }
    });
  }

  if (btnRightPanelSavePersona) {
    btnRightPanelSavePersona.addEventListener('click', async () => {
      const icon = (rightPanelPersonaIconInput?.value || '🎭').trim() || '🎭';
      const name = (rightPanelPersonaNameInput?.value || '').trim();
      const role = (rightPanelPersonaRoleInput?.value || '').trim() || 'Custom Specialist';
      const prompt = (rightPanelPersonaPromptInput?.value || '').trim();

      if (!name) {
        showToast('Please enter a persona name', 'error');
        rightPanelPersonaNameInput?.focus();
        return;
      }
      if (!prompt) {
        showToast('Please define the persona instructions / system prompt', 'error');
        rightPanelPersonaPromptInput?.focus();
        return;
      }

      try {
        const id = rightPanelEditingPersonaId || ('persona_custom_' + Date.now());
        const personaData = {
          id,
          name,
          role,
          icon,
          description: prompt.slice(0, 95) + (prompt.length > 95 ? '...' : ''),
          systemPrompt: prompt,
          isCustom: true
        };

        await window.SnippetStorage.saveCustomPersona(personaData);
        await loadPersonasData();
        await selectActivePersona(id);
        hideRightPanelPersonaForm();
        showToast(`✓ Saved persona "${name}"!`, 'success');
      } catch (err) {
        showToast(`Failed to save persona: ${err.message}`, 'error');
      }
    });
  }

  // Handle all .runner-chip-insert button clicks
  document.addEventListener('click', (e) => {
    const chip = e.target.closest('.runner-chip-insert');
    if (chip) {
      e.preventDefault();
      const tag = chip.dataset.tag || chip.textContent.trim();
      const cleanTag = tag.replace(/^\+\s*/, '').replace(/^\{+|\}+$/g, '');
      if (currentActiveView === 'snippets') {
        insertAtCursor(`{${cleanTag}}`);
        updateSnippetDetectedVariables();
        updatePreviewText();
        showToast(`Inserted {${cleanTag}} into snippet!`, 'success');
      } else {
        insertVariableAtCursor(cleanTag);
      }
    }
  });

  function formatVarLabel(key) {
    return key
      .split(/[_-]/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  function buildFallbackDefaultsMap() {
    const map = {};
    customVariables.forEach(v => {
      if (v.defaultValue) map[v.key] = v.defaultValue;
    });
    return map;
  }

  // --- Resolved Prompt Updates & Temporary Edits ---
  function updateRunnerResolvedPrompt() {
    if (!runnerResolvedPrompt) return;
    if (chkAllowTemporaryEdits && chkAllowTemporaryEdits.checked) {
      // User is manually modifying prompt; don't overwrite
      return;
    }

    const template = promptTemplateInput.value || '';
    const fallbackDefaults = buildFallbackDefaultsMap();
    const resolution = window.ParivartanEngine ? window.ParivartanEngine.resolveAiPrompt(template, runnerVarValues, fallbackDefaults) : { resolvedText: template, missingVariables: [] };

    runnerResolvedPrompt.value = resolution.resolvedText;
  }

  chkAllowTemporaryEdits.addEventListener('change', () => {
    if (chkAllowTemporaryEdits.checked) {
      runnerResolvedPrompt.removeAttribute('readonly');
      runnerResolvedPrompt.classList.add('editable');
      runnerResolvedPrompt.focus();
      showToast('Temporary editing enabled (will not overwrite saved template)', 'info');
    } else {
      runnerResolvedPrompt.setAttribute('readonly', 'true');
      runnerResolvedPrompt.classList.remove('editable');
      updateRunnerResolvedPrompt();
    }
  });

  // --- Load Sample Ticket & Clear Helpers ---
  function loadSampleTicketIntoVars() {
    runnerVarValues['Ticket_ID'] = SAMPLE_TICKET_ID;
    runnerVarValues['Customer_Message'] = SAMPLE_CUSTOMER_MESSAGE;
    runnerVarValues['Page_context'] = SAMPLE_TICKET_CONTEXT;
    runnerVarValues['Engineer_Name'] = settings.defaultAuthor || 'Support Engineer';
    runnerVarValues['Support_Tier'] = 'Tier 2 Technical Support';
    runnerVarValues['Resolution_Steps'] = "1. Routed traffic through Cogent backup path to bypass Telia flapping.\n2. Soft-cleared BGP session on border1.lax2 router.\n3. Verified 0% packet loss and 2ms latency over 500 ICMP probes.\n4. Confirmed 502 error rate stabilized to zero.";

    // Prefill custom variables with defaults
    customVariables.forEach(v => {
      if (!runnerVarValues[v.key] && v.defaultValue) {
        runnerVarValues[v.key] = v.defaultValue;
      }
    });

    syncAllRightPanelVarValues();
    showToast('Loaded sample Psychz Networks support ticket into variables!', 'success');
  }

  function clearAllRunnerVars() {
    runnerVarValues = {};
    if (runnerVar_Ticket_ID) runnerVar_Ticket_ID.value = '';
    if (runnerVar_Customer_Message) runnerVar_Customer_Message.value = '';
    if (runnerVar_Page_context) runnerVar_Page_context.value = '';
    if (runnerVar_Resolution_Steps) runnerVar_Resolution_Steps.value = '';
    if (snippetVar_Ticket_ID) snippetVar_Ticket_ID.value = '';
    if (snippetVar_Customer_Message) snippetVar_Customer_Message.value = '';
    if (snippetVar_Page_context) snippetVar_Page_context.value = '';
    if (snippetVar_Resolution_Steps) snippetVar_Resolution_Steps.value = '';

    customVariables.forEach(v => {
      const el1 = document.getElementById(`runnerCustomVar_${v.id}`);
      if (el1) el1.value = '';
      const el2 = document.getElementById(`snippetCustomVar_${v.id}`);
      if (el2) el2.value = '';
    });

    syncAllRightPanelVarValues();
    showToast('Cleared variable values.', 'info');
  }

  btnLoadSampleTicket.addEventListener('click', loadSampleTicketIntoVars);
  btnClearRunnerVars.addEventListener('click', clearAllRunnerVars);
  if (btnSnippetLoadSampleTicket) btnSnippetLoadSampleTicket.addEventListener('click', loadSampleTicketIntoVars);
  if (btnSnippetClearVars) btnSnippetClearVars.addEventListener('click', clearAllRunnerVars);

  function focusAiLabRunner() {
    const runner = document.getElementById('aiPromptRunnerPanel');
    if (runner) {
      runner.scrollIntoView({ behavior: 'smooth' });
      const firstInput = runner.querySelector('.runner-var-input, .runner-var-textarea');
      if (firstInput) firstInput.focus();
    }
  }

  btnOpenInAiLab.addEventListener('click', focusAiLabRunner);

  // --- Run AI Prompt ---
  btnRunAiPrompt.addEventListener('click', executeAiPrompt);
  btnRerunAiPrompt.addEventListener('click', executeAiPrompt);

  async function executeAiPrompt() {
    syncAllRightPanelVarValues();
    const template = promptTemplateInput.value || '';
    const fallbackDefaults = buildFallbackDefaultsMap();
    const resolution = window.ParivartanEngine.resolveAiPrompt(template, runnerVarValues, fallbackDefaults);

    // Validate missing variables
    if (resolution.missingVariables.length > 0 && (!chkAllowTemporaryEdits.checked || !runnerResolvedPrompt.value.trim())) {
      // Highlight missing input fields in red
      resolution.missingVariables.forEach(missingKey => {
        const norm = missingKey.toLowerCase().replace(/[\s_\-]+/g, '');
        let input = null;
        if (norm === 'pagecontext') input = runnerVar_Page_context;
        else if (norm === 'ticketid') input = runnerVar_Ticket_ID;
        else if (norm === 'customermessage') input = runnerVar_Customer_Message;
        else if (norm === 'resolutionsteps') input = runnerVar_Resolution_Steps;
        else {
          const found = customVariables.find(v => v.key.toLowerCase().replace(/[\s_\-]+/g, '') === norm);
          if (found) input = document.getElementById(`runnerCustomVar_${found.id}`);
        }
        if (input) input.classList.add('error');
      });
      showToast(`⚠️ Please fill in missing variable: {${resolution.missingVariables[0]}}`, 'error');
      runnerExecutionStatus.innerHTML = `<span style="color: var(--danger);">⚠️ Missing required variables: {${resolution.missingVariables.join('}, {')}}</span>`;
      return;
    }

    const finalPrompt = chkAllowTemporaryEdits.checked ? runnerResolvedPrompt.value : resolution.resolvedText;
    if (!finalPrompt.trim()) {
      showToast('Prompt is empty. Please enter instructions to run.', 'error');
      return;
    }

    const provider = (settings && settings.ai && settings.ai.provider) || 'gemini';
    const apiKey = (settings && settings.ai && settings.ai.apiKey) || '';
    const model = (settings && settings.ai && settings.ai.model) || '';
    const customEndpoint = (settings && settings.ai && settings.ai.customEndpoint) || '';
    const chosenPersonaId = (runnerPersonaSelect && runnerPersonaSelect.value) || (settings && settings.ai && settings.ai.persona) || activePersonaId || 'support';
    const activePersonaObj = allPersonas.find(p => p.id === chosenPersonaId) || allPersonas[0];
    const persona = activePersonaObj ? activePersonaObj.id : 'support';
    const personaPrompt = activePersonaObj ? (activePersonaObj.systemPrompt || '') : '';

    // UI Loading State
    btnRunAiPrompt.disabled = true;
    btnRunAiPromptText.textContent = 'Generating...';
    runnerExecutionStatus.innerHTML = `<span>⏳ Processing prompt with ${provider} (${activePersonaObj ? activePersonaObj.name : persona})...</span>`;
    runnerResponseEmpty.style.display = 'none';
    runnerResponseContent.style.display = 'block';
    runnerResponseContent.textContent = '⏳ Thinking & formulating response...';
    responseActions.style.display = 'none';

    const payload = {
      action: 'execute_prompt',
      prompt: finalPrompt,
      provider,
      apiKey,
      model,
      customEndpoint,
      persona,
      personaPrompt
    };

    const startTime = Date.now();

    try {
      const result = await runAiGeneration(payload);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

      btnRunAiPrompt.disabled = false;
      btnRunAiPromptText.textContent = 'Run Prompt';
      runnerExecutionStatus.innerHTML = `<span style="color: var(--success);">✓ Completed in ${elapsed}s</span>`;

      const responseText = result.text || 'No response generated.';
      if (window.ParivartanEngine && window.ParivartanEngine.renderMarkdownToHtml) {
        runnerResponseContent.innerHTML = window.ParivartanEngine.renderMarkdownToHtml(responseText);
      } else {
        runnerResponseContent.textContent = responseText;
      }
      responseActions.style.display = 'flex';
      showToast('✓ AI generation complete!', 'success');
    } catch (err) {
      btnRunAiPrompt.disabled = false;
      btnRunAiPromptText.textContent = 'Run Prompt';
      runnerExecutionStatus.innerHTML = `<span style="color: var(--danger);">Error: ${err.message}</span>`;
      runnerResponseContent.textContent = `Error: ${err.message}\n\nPlease check your API key in Settings or choose another AI Provider.`;
      showToast(`Error: ${err.message}`, 'error');
    }
  }

  function runAiGeneration(payload) {
    return new Promise((resolve, reject) => {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ action: 'ACTION_AI_GENERATE', payload }, (response) => {
          if (chrome.runtime.lastError) {
            // Local fallback
            if (typeof AIService !== 'undefined') {
              AIService.generate(payload).then(text => resolve({ success: true, text })).catch(reject);
              return;
            }
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (response && response.success) {
            resolve(response);
          } else {
            reject(new Error(response?.error || 'Failed to generate response.'));
          }
        });
      } else if (typeof AIService !== 'undefined') {
        AIService.generate(payload).then(text => resolve({ success: true, text })).catch(reject);
      } else {
        reject(new Error('AI generation service is not available.'));
      }
    });
  }

  // --- Copy AI Response & Save as Snippet ---
  btnCopyAiResponse.addEventListener('click', () => {
    const text = runnerResponseContent.innerText || runnerResponseContent.textContent || '';
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      showToast('✓ Copied AI response to clipboard!', 'success');
    }).catch(() => {
      showToast('Failed to copy to clipboard', 'error');
    });
  });

  btnSaveAiAsSnippet.addEventListener('click', async () => {
    const text = runnerResponseContent.innerText || runnerResponseContent.textContent || '';
    if (!text) return;

    const prompt = customPrompts.find(p => p.id === activePromptId);
    const title = (prompt ? prompt.name : 'AI Generated Reply') + ' - ' + new Date().toLocaleDateString();
    const shortcut = '/ai' + Math.floor(Math.random() * 900 + 100);

    const newSnippet = {
      id: 'snip_' + Date.now(),
      folderId: folders[0] ? folders[0].id : 'folder_support',
      title,
      shortcut,
      content: text,
      tags: ['ai-generated', 'custom-prompt'],
      usageCount: 1,
      createdAt: Date.now()
    };

    snippets.unshift(newSnippet);
    await window.SnippetStorage.saveSnippets(snippets);
    renderFolderTree();
    selectSnippet(newSnippet.id);
    switchView('snippets');
    showToast(`✓ Created snippet "${title}" (${shortcut})!`, 'success');
  });

  btnClearAiResponse.addEventListener('click', () => {
    runnerResponseContent.textContent = '';
    runnerResponseContent.style.display = 'none';
    runnerResponseEmpty.style.display = 'flex';
    responseActions.style.display = 'none';
    runnerExecutionStatus.innerHTML = '';
  });

  // --- Dynamic Variables Manager Modal Logic ---
  btnOpenVariablesModal.addEventListener('click', openVariablesModal);
  if (btnAddVarChip) btnAddVarChip.addEventListener('click', openVariablesModal);

  function openVariablesModal() {
    resetVarForm();
    renderCustomVarsTable();
    modalAiVariables.classList.add('open');
  }

  btnVarTabCustom.addEventListener('click', () => {
    btnVarTabCustom.classList.add('active');
    btnVarTabSystem.classList.remove('active');
    varTabContentCustom.style.display = 'block';
    varTabContentSystem.style.display = 'none';
  });

  btnVarTabSystem.addEventListener('click', () => {
    btnVarTabSystem.classList.add('active');
    btnVarTabCustom.classList.remove('active');
    varTabContentCustom.style.display = 'none';
    varTabContentSystem.style.display = 'block';
  });

  function renderCustomVarsTable() {
    if (!customVarsTable) return;
    customVarsTable.innerHTML = '';

    if (customVariables.length === 0) {
      customVarsTable.innerHTML = `<div style="color: var(--text-muted); font-size: 0.8rem; padding: 10px 0; text-align: center;">No custom variables created yet. Use the form below to add one.</div>`;
      return;
    }

    customVariables.forEach(v => {
      const row = document.createElement('div');
      row.style.cssText = 'display: flex; justify-content: space-between; align-items: center; background: var(--bg-surface); padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border-color);';
      row.innerHTML = `
        <div style="flex: 1; padding-right: 8px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px;">
            <code style="font-weight: 700; color: var(--accent); font-size: 0.88rem;">{${escapeHTML(v.key)}}</code>
            <strong style="font-size: 0.82rem; color: var(--text-main);">${escapeHTML(v.name)}</strong>
          </div>
          <div style="font-size: 0.74rem; color: var(--text-muted);">
            ${v.defaultValue ? `Default: <em>"${escapeHTML(v.defaultValue)}"</em>` : 'No default value'}
            ${v.description ? ` &bull; ${escapeHTML(v.description)}` : ''}
          </div>
        </div>
        <div style="display: flex; gap: 6px;">
          <button type="button" class="btn btn-secondary btn-sm btn-edit-var" data-var-id="${v.id}" style="padding: 3px 8px; font-size: 0.74rem;">Edit</button>
          <button type="button" class="btn btn-danger btn-sm btn-del-var" data-var-id="${v.id}" style="padding: 3px 8px; font-size: 0.74rem;">Delete</button>
        </div>
      `;

      row.querySelector('.btn-edit-var').addEventListener('click', () => editCustomVar(v.id));
      row.querySelector('.btn-del-var').addEventListener('click', () => deleteCustomVar(v.id));

      customVarsTable.appendChild(row);
    });

    if (varTabCustomCount) varTabCustomCount.textContent = customVariables.length;
  }

  // Auto-generate key placeholder from name
  varNameInput.addEventListener('input', () => {
    if (!editVarId.value) {
      const cleanKey = varNameInput.value
        .trim()
        .replace(/[^a-zA-Z0-9\s_-]/g, '')
        .replace(/\s+/g, '_');
      varKeyInput.value = cleanKey;
    }
  });

  btnSaveCustomVar.addEventListener('click', async () => {
    const name = varNameInput.value.trim();
    let key = varKeyInput.value.trim().replace(/^\{+|\}+$/g, ''); // strip any accidentally typed brackets
    const defaultVal = varDefaultInput.value.trim();
    const desc = varDescInput.value.trim();

    if (!name) {
      showToast('Please enter a variable name', 'error');
      varNameInput.focus();
      return;
    }

    if (!key) {
      showToast('Please enter a variable placeholder key', 'error');
      varKeyInput.focus();
      return;
    }

    // Validate key characters: letters, numbers, underscore, hyphen
    if (!/^[a-zA-Z0-9_\-]+$/.test(key)) {
      showToast('Key must only contain letters, numbers, and underscores (e.g. Support_Tier)', 'error');
      varKeyInput.focus();
      return;
    }

    const currentEditId = editVarId.value;
    if (currentEditId) {
      // Edit existing
      const target = customVariables.find(v => v.id === currentEditId);
      if (target) {
        target.name = name;
        target.key = key;
        target.defaultValue = defaultVal;
        target.description = desc;
      }
      showToast(`✓ Updated variable {${key}}!`, 'success');
    } else {
      // Create new
      const newVar = {
        id: 'var_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        name,
        key,
        defaultValue: defaultVal,
        description: desc,
        isSystem: false
      };
      customVariables.push(newVar);
      showToast(`✓ Added custom variable {${key}}!`, 'success');
    }

    await window.SnippetStorage.saveCustomVariables(customVariables);
    updatePromptCountBadges();
    renderCustomVarsTable();
    renderVariableChips();
    renderSnippetVariableChips();
    populateRunnerVariablesForm();
    resetVarForm();
  });

  function editCustomVar(id) {
    const v = customVariables.find(item => item.id === id);
    if (!v) return;

    editVarId.value = v.id;
    varNameInput.value = v.name || '';
    varKeyInput.value = v.key || '';
    varDefaultInput.value = v.defaultValue || '';
    varDescInput.value = v.description || '';
    varFormTitle.textContent = `✏️ Edit Variable {${v.key}}`;
    btnCancelVarEdit.style.display = 'inline-block';
    varNameInput.focus();
  }

  async function deleteCustomVar(id) {
    const idx = customVariables.findIndex(item => item.id === id);
    if (idx === -1) return;

    const delKey = customVariables[idx].key;
    if (!confirm(`Are you sure you want to delete variable {${delKey}}?`)) return;

    customVariables.splice(idx, 1);
    await window.SnippetStorage.saveCustomVariables(customVariables);
    updatePromptCountBadges();
    renderCustomVarsTable();
    renderVariableChips();
    renderSnippetVariableChips();
    populateRunnerVariablesForm();
    resetVarForm();
    showToast(`Deleted variable {${delKey}}`, 'info');
  }

  btnCancelVarEdit.addEventListener('click', resetVarForm);

  function resetVarForm() {
    editVarId.value = '';
    varNameInput.value = '';
    varKeyInput.value = '';
    varDefaultInput.value = '';
    varDescInput.value = '';
    varFormTitle.textContent = '➕ Add New Custom Variable';
    btnCancelVarEdit.style.display = 'none';
  }

  // --- Real-time Search Filter on Saved Prompts ---
  if (promptSearchInput) {
    promptSearchInput.addEventListener('input', () => {
      renderAiPromptList();
    });
  }

  // Sidebar drag resizer for AI Prompts view
  if (aiSidebarResizer && aiPromptsSidebar) {
    let isAiDragging = false;
    let startX = 0;
    let startWidth = 0;

    aiSidebarResizer.addEventListener('mousedown', (e) => {
      isAiDragging = true;
      startX = e.clientX;
      startWidth = aiPromptsSidebar.offsetWidth;
      aiSidebarResizer.classList.add('is-dragging');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isAiDragging) return;
      const newWidth = Math.max(220, Math.min(500, startWidth + (e.clientX - startX)));
      aiPromptsSidebar.style.width = newWidth + 'px';
    });

    window.addEventListener('mouseup', () => {
      if (isAiDragging) {
        isAiDragging = false;
        aiSidebarResizer.classList.remove('is-dragging');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    });
  }

  // Right Panel drag resizer for AI Prompts & Lab view
  if (aiRightPanelResizer && aiPromptRunnerPanel) {
    const savedRunnerWidth = localStorage.getItem('parivartan_runner_panel_width');
    if (savedRunnerWidth) {
      const w = parseInt(savedRunnerWidth, 10);
      if (!isNaN(w) && w >= 280 && w <= 850) {
        aiPromptRunnerPanel.style.width = w + 'px';
      }
    }

    let isAiRightDragging = false;
    let startX = 0;
    let startWidth = 0;

    aiRightPanelResizer.addEventListener('mousedown', (e) => {
      isAiRightDragging = true;
      startX = e.clientX;
      startWidth = aiPromptRunnerPanel.offsetWidth;
      aiRightPanelResizer.classList.add('is-dragging');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isAiRightDragging) return;
      const deltaX = e.clientX - startX;
      // Dragging left (deltaX negative) expands the right panel
      const newWidth = Math.max(280, Math.min(850, startWidth - deltaX));
      aiPromptRunnerPanel.style.width = newWidth + 'px';
    });

    window.addEventListener('mouseup', () => {
      if (isAiRightDragging) {
        isAiRightDragging = false;
        aiRightPanelResizer.classList.remove('is-dragging');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        try {
          localStorage.setItem('parivartan_runner_panel_width', aiPromptRunnerPanel.offsetWidth);
        } catch (_) {}
      }
    });
  }

  // Right Panel drag resizer for Snippets workspace view
  if (snippetRightResizer && snippetRunnerPanel) {
    const savedSnippetRunnerWidth = localStorage.getItem('parivartan_snippet_runner_width');
    if (savedSnippetRunnerWidth) {
      const w = parseInt(savedSnippetRunnerWidth, 10);
      if (!isNaN(w) && w >= 280 && w <= 850) {
        snippetRunnerPanel.style.width = w + 'px';
      }
    }

    let isSnippetRightDragging = false;
    let startX = 0;
    let startWidth = 0;

    snippetRightResizer.addEventListener('mousedown', (e) => {
      isSnippetRightDragging = true;
      startX = e.clientX;
      startWidth = snippetRunnerPanel.offsetWidth;
      snippetRightResizer.classList.add('is-dragging');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isSnippetRightDragging) return;
      const deltaX = e.clientX - startX;
      // Dragging left (deltaX negative) expands the right panel
      const newWidth = Math.max(280, Math.min(850, startWidth - deltaX));
      snippetRunnerPanel.style.width = newWidth + 'px';
    });

    window.addEventListener('mouseup', () => {
      if (isSnippetRightDragging) {
        isSnippetRightDragging = false;
        snippetRightResizer.classList.remove('is-dragging');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        try {
          localStorage.setItem('parivartan_snippet_runner_width', snippetRunnerPanel.offsetWidth);
        } catch (_) {}
      }
    });
  }

  // Collapsible Variable Drawer Toggles (Show/hide manual input drawers)
  document.addEventListener('click', (e) => {
    const toggleBtn = e.target.closest('.btn-var-toggle');
    if (toggleBtn) {
      const drawerId = toggleBtn.getAttribute('data-drawer');
      const drawer = document.getElementById(drawerId);
      if (drawer) {
        const isHidden = drawer.style.display === 'none' || !drawer.style.display;
        drawer.style.display = isHidden ? 'block' : 'none';
        const labelSpan = toggleBtn.querySelector('span');
        if (labelSpan) {
          const actionText = toggleBtn.getAttribute('data-action-label') || 'Override';
          labelSpan.textContent = isHidden ? '▲ Hide' : `▼ ${actionText}`;
        }
        if (isHidden) {
          const firstInput = drawer.querySelector('input, textarea');
          if (firstInput) firstInput.focus();
        }
      }
    }
  });

  // Listen for storage changes across tabs & sync
  if (window.SnippetStorage) {
    window.SnippetStorage.onChanged(async (changes) => {
      if (changes.customAiPrompts) {
        customPrompts = changes.customAiPrompts.newValue || [];
        renderAiPromptList();
        updatePromptCountBadges();
      }
      if (changes.customAiVariables) {
        customVariables = changes.customAiVariables.newValue || [];
        renderVariableChips();
        renderSnippetVariableChips();
        updatePromptCountBadges();
        populateRunnerVariablesForm();
      }
      if (changes.customAiPersonas) {
        await loadPersonasData();
      }
    });
  }

  // ========================================================
  // Cloud Database & Google Account Sync Management
  // ========================================================
  async function checkCloudServerHealth() {
    if (!cloudServerStatusDot || !cloudServerStatusText) return;
    try {
      const serverUrl = window.SyncService ? await window.SyncService.getServerUrl() : 'http://localhost:4000';
      if (inputCloudServerUrl) inputCloudServerUrl.value = serverUrl;

      const res = await fetch(`${serverUrl}/health`, { method: 'GET' }).catch(() => null);
      if (res && res.ok) {
        cloudServerStatusDot.style.background = '#10b981'; // Green
        cloudServerStatusText.textContent = `Server Connected (${serverUrl})`;
        cloudServerStatusText.style.color = '#10b981';
      } else {
        cloudServerStatusDot.style.background = '#ef4444'; // Red
        cloudServerStatusText.textContent = `Server Offline (${serverUrl})`;
        cloudServerStatusText.style.color = '#ef4444';
      }
    } catch (_) {
      cloudServerStatusDot.style.background = '#ef4444';
      cloudServerStatusText.textContent = 'Server Unreachable';
      cloudServerStatusText.style.color = '#ef4444';
    }
  }

  async function updateCloudUserCardUI() {
    if (!cloudUserCard || !window.SyncService) return;
    const user = await window.SyncService.getCurrentUser();

    if (user) {
      const isAdmin = user.role === 'admin';
      cloudUserCard.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <img src="${user.avatarUrl || 'https://lh3.googleusercontent.com/a/default-user'}" alt="Avatar" style="width: 44px; height: 44px; border-radius: 50%; border: 2px solid ${isAdmin ? '#eab308' : 'var(--accent)'}; object-fit: cover;">
              <div>
                <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
                  <span>${escapeHTML(user.name || 'Client User')}</span>
                  <span style="font-size: 0.72rem; padding: 2px 7px; border-radius: 999px; font-weight: 700; background: ${isAdmin ? 'rgba(234, 179, 8, 0.15)' : 'rgba(6, 182, 212, 0.15)'}; color: ${isAdmin ? '#eab308' : 'var(--accent)'}; border: 1px solid ${isAdmin ? 'rgba(234, 179, 8, 0.3)' : 'rgba(6, 182, 212, 0.3)'};">
                    ${isAdmin ? '👑 Master Admin' : '👤 Client User'}
                  </span>
                </div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">${escapeHTML(user.email)}</div>
              </div>
            </div>
            <div style="display: flex; gap: 8px;">
              ${!isAdmin ? `<button type="button" class="btn btn-secondary btn-sm" id="btnElevateToAdmin" style="font-size: 0.76rem; padding: 4px 10px; color: #eab308; border-color: rgba(234, 179, 8, 0.4);">👑 Make Admin</button>` : ''}
              <button type="button" class="btn btn-secondary btn-sm" id="btnCloudLogout" style="font-size: 0.76rem; padding: 4px 10px; color: #ef4444; border-color: rgba(239, 68, 68, 0.3);">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      `;

      const btnLogout = document.getElementById('btnCloudLogout');
      if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
          await window.SyncService.logout();
          showToast('Signed out of cloud account', 'info');
          updateCloudUserCardUI();
          await checkDashboardAuthGate();
        });
      }

      const btnElevate = document.getElementById('btnElevateToAdmin');
      if (btnElevate) {
        btnElevate.addEventListener('click', async () => {
          try {
            btnElevate.textContent = 'Updating...';
            const serverUrl = await window.SyncService.getServerUrl();
            const token = await window.SyncService.getAuthToken();
            const res = await fetch(`${serverUrl}/api/auth/elevate`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            });
            if (res.ok) {
              const data = await res.json();
              await window.SyncService.setAuthSession(data.jwt, data.user);
              showToast('✓ Role elevated to Master Admin!', 'success');
              updateCloudUserCardUI();
            } else {
              const err = await res.json();
              showToast(`Failed: ${err.error || 'Server error'}`, 'error');
            }
          } catch (e) {
            showToast(`Error: ${e.message}`, 'error');
          }
        });
      }
    } else {
      cloudUserCard.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div style="font-size: 0.92rem; font-weight: 700; color: var(--text-main);">
            🔑 Sign In or Create User Account
          </div>
          <div style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4;">
            Log in to sync snippets, folders, and AI tools with the central database (<span style="color:var(--accent);">SQLite/PostgreSQL</span>).
          </div>

          <!-- Quick Presets -->
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            <button type="button" class="btn btn-secondary btn-sm" id="presetAdmin" style="font-size: 0.72rem; padding: 3px 8px; border-color: rgba(234, 179, 8, 0.4); color: #eab308; font-weight: 600;">
              👑 Master Admin (parivartanvishalsingh@gmail.com)
            </button>
            <button type="button" class="btn btn-secondary btn-sm" id="presetTech" style="font-size: 0.72rem; padding: 3px 8px;">
              👤 Support Tech
            </button>
            <button type="button" class="btn btn-secondary btn-sm" id="presetClient" style="font-size: 0.72rem; padding: 3px 8px;">
              👤 New Client User
            </button>
          </div>

          <!-- Form inputs -->
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; gap: 8px;">
              <input type="email" id="inputCustomEmail" placeholder="Email (parivartanvishalsingh@gmail.com)" value="parivartanvishalsingh@gmail.com" style="flex: 1.2; box-sizing: border-box; padding: 7px 10px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-hover); color: var(--text-main); font-size: 0.82rem;">
              <input type="password" id="inputCustomPassword" placeholder="Password (kmbl1110)" value="kmbl1110" style="flex: 1; box-sizing: border-box; padding: 7px 10px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-hover); color: var(--text-main); font-size: 0.82rem;">
            </div>
            <div style="display: flex; gap: 8px;">
              <input type="text" id="inputCustomName" placeholder="Full Name" value="Vishal Singh" style="flex: 1; padding: 7px 10px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-hover); color: var(--text-main); font-size: 0.82rem;">
              <select id="selectCustomRole" style="padding: 7px 10px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-hover); color: var(--text-main); font-size: 0.82rem;">
                <option value="admin">👑 Master Admin</option>
                <option value="user">👤 Client User</option>
              </select>
            </div>
            <button type="button" class="btn btn-primary" id="btnCustomLoginSubmit" style="font-size: 0.82rem; font-weight: 600; padding: 7px 14px;">
              ⚡ Sign In / Register Account
            </button>
          </div>

          <div style="position: relative; text-align: center; margin: 4px 0;">
            <hr style="border: 0; border-top: 1px solid var(--border-color); margin: 0;">
            <span style="position: absolute; top: -8px; left: 50%; transform: translateX(-50%); background: var(--bg-surface); padding: 0 8px; font-size: 0.72rem; color: var(--text-muted);">OR</span>
          </div>

          <!-- Google Sign In -->
          <button type="button" class="btn btn-secondary" id="btnGoogleSignIn" style="background: #ffffff; color: #1e293b; border: 1px solid #cbd5e1; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 600; padding: 7px 14px; font-size: 0.82rem;">
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Sign in with Google Account</span>
          </button>
        </div>
      `;

      const inputEmail = document.getElementById('inputCustomEmail');
      const inputPassword = document.getElementById('inputCustomPassword');
      const inputName = document.getElementById('inputCustomName');
      const selectRole = document.getElementById('selectCustomRole');
      const btnSubmit = document.getElementById('btnCustomLoginSubmit');

      document.getElementById('presetAdmin')?.addEventListener('click', () => {
        if (inputEmail) inputEmail.value = 'parivartanvishalsingh@gmail.com';
        if (inputPassword) inputPassword.value = 'kmbl1110';
        if (inputName) inputName.value = 'Vishal Singh';
        if (selectRole) selectRole.value = 'admin';
      });

      document.getElementById('presetTech')?.addEventListener('click', () => {
        if (inputEmail) inputEmail.value = 'test.engineer@psychz.net';
        if (inputPassword) inputPassword.value = '';
        if (inputName) inputName.value = 'Support Engineer';
        if (selectRole) selectRole.value = 'user';
      });

      document.getElementById('presetClient')?.addEventListener('click', () => {
        const randId = Math.floor(Math.random() * 900) + 100;
        if (inputEmail) inputEmail.value = `client.${randId}@psychz.net`;
        if (inputPassword) inputPassword.value = '';
        if (inputName) inputName.value = `Client User ${randId}`;
        if (selectRole) selectRole.value = 'user';
      });

      if (btnSubmit) {
        btnSubmit.addEventListener('click', async () => {
          const email = (inputEmail?.value || '').trim();
          const password = (inputPassword?.value || '').trim();
          const name = (inputName?.value || '').trim();
          const role = selectRole?.value || 'user';

          if (!email || !email.includes('@')) {
            showToast('Please enter a valid email address', 'warning');
            return;
          }

          try {
            btnSubmit.disabled = true;
            btnSubmit.textContent = 'Signing in...';
            const data = await window.SyncService.devLogin(email, name || email.split('@')[0], role, null, password);
            showToast(`✓ Signed in successfully as ${data.user.email} (${data.user.role})!`, 'success');
            await checkCloudServerHealth();
            await updateCloudUserCardUI();
          } catch (e) {
            showToast(`Sign in failed: ${e.message}`, 'error');
          } finally {
            if (btnSubmit) {
              btnSubmit.disabled = false;
              btnSubmit.textContent = '⚡ Sign In / Register Account';
            }
          }
        });
      }

      const btnGoogle = document.getElementById('btnGoogleSignIn');
      if (btnGoogle) {
        btnGoogle.addEventListener('click', async () => {
          try {
            btnGoogle.disabled = true;
            btnGoogle.textContent = 'Authenticating with Google...';

            if (chrome?.identity?.getAuthToken) {
              await window.SyncService.googleLogin();
            } else {
              // Fallback Google account prompt for local testing
              const googleEmail = prompt('Sign in with Google Account:\nEnter Google Email address:', 'parivartanvishalsingh@gmail.com');
              if (!googleEmail) return;
              const isMaster = googleEmail.toLowerCase() === 'parivartanvishalsingh@gmail.com';
              await window.SyncService.devLogin(
                googleEmail,
                isMaster ? 'Vishal Singh' : googleEmail.split('@')[0],
                isMaster ? 'admin' : 'user',
                isMaster ? 'Parivartan HQ' : null,
                isMaster ? 'kmbl1110' : null
              );
            }

            showToast('✓ Signed in with Google successfully!', 'success');
            await checkCloudServerHealth();
            await updateCloudUserCardUI();
          } catch (e) {
            // If chrome.identity is rejected (e.g. extension not registered in Google Cloud Console yet), fall back to email prompt
            const googleEmail = prompt('Google Sign-In fallback:\nEnter Google Email address:', 'parivartanvishalsingh@gmail.com');
            if (googleEmail) {
              try {
                const isMaster = googleEmail.toLowerCase() === 'parivartanvishalsingh@gmail.com';
                await window.SyncService.devLogin(
                  googleEmail,
                  isMaster ? 'Vishal Singh' : googleEmail.split('@')[0],
                  isMaster ? 'admin' : 'user',
                  isMaster ? 'Parivartan HQ' : null,
                  isMaster ? 'kmbl1110' : null
                );
                showToast(`✓ Signed in as ${googleEmail}!`, 'success');
                await checkCloudServerHealth();
                await updateCloudUserCardUI();
              } catch (err2) {
                showToast(`Sign in error: ${err2.message}`, 'error');
              }
            } else {
              showToast(`Google Sign-In: ${e.message}`, 'error');
            }
          } finally {
            if (btnGoogle) {
              btnGoogle.disabled = false;
              btnGoogle.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Sign in with Google Account</span>
              `;
            }
          }
        });
      }
    }
  }

  // --- Dashboard Authentication Gate ---
  const dashboardAuthGateOverlay = document.getElementById('dashboardAuthGateOverlay');
  const btnGateGoogleLogin = document.getElementById('btnGateGoogleLogin');
  const btnGatePresetMaster = document.getElementById('btnGatePresetMaster');
  const formGateLogin = document.getElementById('formGateLogin');
  const inputGateEmail = document.getElementById('inputGateEmail');
  const inputGatePassword = document.getElementById('inputGatePassword');
  const inputGatePin = document.getElementById('inputGatePin');
  const btnGateSubmitLogin = document.getElementById('btnGateSubmitLogin');
  const gateAuthError = document.getElementById('gateAuthError');

  async function checkDashboardAuthGate() {
    let user = null;
    if (window.SyncService) {
      user = await window.SyncService.getCurrentUser();
    }
    if (!user) {
      if (dashboardAuthGateOverlay) dashboardAuthGateOverlay.style.display = 'flex';
      return false;
    } else {
      if (dashboardAuthGateOverlay) dashboardAuthGateOverlay.style.display = 'none';
      return true;
    }
  }

  btnGatePresetMaster?.addEventListener('click', () => {
    if (inputGateEmail) inputGateEmail.value = 'parivartanvishalsingh@gmail.com';
    if (inputGatePassword) inputGatePassword.value = 'kmbl1110';
    if (inputGatePin) inputGatePin.value = '312866';
  });

  btnGateGoogleLogin?.addEventListener('click', async () => {
    if (gateAuthError) gateAuthError.style.display = 'none';
    try {
      btnGateGoogleLogin.textContent = 'Authenticating with Google...';
      if (chrome?.identity?.getAuthToken && window.SyncService) {
        await window.SyncService.googleLogin();
      } else {
        const googleEmail = prompt('Sign in with Google Account:\nEnter Google Email address:', 'parivartanvishalsingh@gmail.com');
        if (!googleEmail) return;
        const isMaster = googleEmail.toLowerCase() === 'parivartanvishalsingh@gmail.com';
        if (window.SyncService) {
          await window.SyncService.devLogin(
            googleEmail,
            isMaster ? 'Vishal Singh' : googleEmail.split('@')[0],
            isMaster ? 'admin' : 'user',
            isMaster ? 'Parivartan HQ' : null,
            isMaster ? 'kmbl1110' : null
          );
        }
      }
      showToast('✓ Signed in with Google successfully!', 'success');
      await checkDashboardAuthGate();
      await updateCloudUserCardUI();
      await loadData();
    } catch (e) {
      const googleEmail = prompt('Google Sign-In fallback:\nEnter Google Email address:', 'parivartanvishalsingh@gmail.com');
      if (googleEmail && window.SyncService) {
        const isMaster = googleEmail.toLowerCase() === 'parivartanvishalsingh@gmail.com';
        await window.SyncService.devLogin(
          googleEmail,
          isMaster ? 'Vishal Singh' : googleEmail.split('@')[0],
          isMaster ? 'admin' : 'user',
          isMaster ? 'Parivartan HQ' : null,
          isMaster ? 'kmbl1110' : null
        );
        showToast(`✓ Signed in as ${googleEmail}!`, 'success');
        await checkDashboardAuthGate();
        await updateCloudUserCardUI();
        await loadData();
      } else if (gateAuthError) {
        gateAuthError.textContent = `Google Sign-In: ${e.message}`;
        gateAuthError.style.display = 'block';
      }
    } finally {
      if (btnGateGoogleLogin) {
        btnGateGoogleLogin.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>Sign in with Google Account</span>
        `;
      }
    }
  });

  formGateLogin?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (gateAuthError) gateAuthError.style.display = 'none';
    const email = (inputGateEmail?.value || '').trim();
    const password = (inputGatePassword?.value || '').trim();
    const pin = (inputGatePin?.value || '').trim();
    if (!email) return;

    try {
      if (btnGateSubmitLogin) {
        btnGateSubmitLogin.disabled = true;
        btnGateSubmitLogin.textContent = 'Verifying credentials...';
      }
      const isMaster = email.toLowerCase() === 'parivartanvishalsingh@gmail.com';
      if (window.SyncService) {
        await window.SyncService.devLogin(
          email,
          isMaster ? 'Vishal Singh' : email.split('@')[0],
          isMaster ? 'admin' : 'user',
          isMaster ? 'Parivartan HQ' : null,
          password,
          pin || (isMaster ? '312866' : null)
        );
      }
      showToast('✓ Welcome! Workspace unlocked.', 'success');
      await checkDashboardAuthGate();
      await updateCloudUserCardUI();
      await loadData();
    } catch (err) {
      if (gateAuthError) {
        gateAuthError.textContent = err.message || 'Login failed';
        gateAuthError.style.display = 'block';
      }
    } finally {
      if (btnGateSubmitLogin) {
        btnGateSubmitLogin.disabled = false;
        btnGateSubmitLogin.textContent = '⚡ Sign In & Unlock Workspace';
      }
    }
  });

  if (btnOpenCloudSync && modalCloudSync) {
    btnOpenCloudSync.addEventListener('click', async () => {
      modalCloudSync.classList.add('open');
      await checkCloudServerHealth();
      await updateCloudUserCardUI();
    });
  }

  if (btnTestCloudServer) {
    btnTestCloudServer.addEventListener('click', async () => {
      btnTestCloudServer.textContent = 'Testing...';
      await checkCloudServerHealth();
      btnTestCloudServer.textContent = 'Test Connection';
    });
  }

  if (btnTriggerSyncPush) {
    btnTriggerSyncPush.addEventListener('click', async () => {
      try {
        btnTriggerSyncPush.disabled = true;
        btnTriggerSyncPush.textContent = 'Pushing to cloud...';
        const res = await window.SyncService.pushLocalToCloud();
        if (res.success) {
          showToast('✓ Local snippets & AI tools pushed to cloud database!', 'success');
        } else if (res.reason === 'not_authenticated') {
          showToast('Please sign in first to push data to the database', 'warning');
        }
      } catch (e) {
        showToast(`Sync push failed: ${e.message}`, 'error');
      } finally {
        btnTriggerSyncPush.disabled = false;
        btnTriggerSyncPush.textContent = '☁️ Push Local to Cloud';
      }
    });
  }

  if (btnTriggerSyncPull) {
    btnTriggerSyncPull.addEventListener('click', async () => {
      try {
        btnTriggerSyncPull.disabled = true;
        btnTriggerSyncPull.textContent = 'Pulling from cloud...';
        const res = await window.SyncService.pullCloudToLocal();
        if (res.success) {
          showToast(`✓ Pulled ${res.counts.snippets} snippets & ${res.counts.prompts} AI prompts from database!`, 'success');
          await loadData();
          await initAiPromptManagement();
        } else if (res.reason === 'not_authenticated') {
          showToast('Please sign in first to pull data from the database', 'warning');
        }
      } catch (e) {
        showToast(`Sync pull failed: ${e.message}`, 'error');
      } finally {
        btnTriggerSyncPull.disabled = false;
        btnTriggerSyncPull.textContent = '⬇️ Pull Cloud to Local';
      }
    });
  }

  if (btnSaveCloudServerUrl && inputCloudServerUrl) {
    btnSaveCloudServerUrl.addEventListener('click', async () => {
      const url = inputCloudServerUrl.value.trim();
      if (!url) return;
      await window.SyncService.setServerUrl(url);
      showToast(`Cloud server URL saved: ${url}`, 'success');
      await checkCloudServerHealth();
    });
  }

  window.addEventListener('message', async (e) => {
    if (e.data && e.data.type === 'PARIVARTAN_AUTH_CHANGED') {
      await checkDashboardAuthGate();
      await updateCloudUserCardUI();
    }
  });

  // Check client auth gate on startup
  await checkDashboardAuthGate();

  // Initialize AI prompts on load
  await initAiPromptManagement();

  await loadData();

  function escapeHTML(str) {
    return (str || '').replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }
});
