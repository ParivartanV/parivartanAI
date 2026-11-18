/**
 * Parivartan Snippet - Popup Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  let snippets = [];
  let settings = {};

  const searchInput = document.getElementById('popupSearchInput');
  const listEl = document.getElementById('popupSnippetList');
  const btnOpenDashboardTab = document.getElementById('btnOpenDashboardTab');
  const btnQuickCreate = document.getElementById('btnQuickCreate');
  const btnPopupThemeToggle = document.getElementById('btnPopupThemeToggle');
  const popupThemeIcon = document.getElementById('popupThemeIcon');
  const popupUserPill = document.getElementById('popupUserPill');
  const btnPopupLogout = document.getElementById('btnPopupLogout');
  const popupAuthLockScreen = document.getElementById('popupAuthLockScreen');
  const popupMainContent = document.getElementById('popupMainContent');
  const btnPopupGoogleLogin = document.getElementById('btnPopupGoogleLogin');
  const btnPopupPresetMaster = document.getElementById('btnPopupPresetMaster');
  const formPopupLogin = document.getElementById('formPopupLogin');
  const inputPopupEmail = document.getElementById('inputPopupEmail');
  const inputPopupPassword = document.getElementById('inputPopupPassword');
  const inputPopupPin = document.getElementById('inputPopupPin');
  const btnPopupSubmitLogin = document.getElementById('btnPopupSubmitLogin');
  const popupAuthError = document.getElementById('popupAuthError');

  // --- Check Authentication State ---
  async function checkAuthAndRender() {
    let currentUser = null;
    if (window.SyncService) {
      currentUser = await window.SyncService.getCurrentUser();
    } else if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      currentUser = await new Promise(r => chrome.storage.local.get(['cloudUser'], res => r(res?.cloudUser || null)));
    }

    if (!currentUser) {
      // Locked: Access denied until login
      if (popupAuthLockScreen) popupAuthLockScreen.style.display = 'flex';
      if (popupMainContent) popupMainContent.style.display = 'none';
      if (popupUserPill) popupUserPill.style.display = 'none';
      if (btnPopupLogout) btnPopupLogout.style.display = 'none';
      return false;
    }

    // Unlocked: Client is authenticated
    if (popupAuthLockScreen) popupAuthLockScreen.style.display = 'none';
    if (popupMainContent) popupMainContent.style.display = 'flex';
    if (popupUserPill) {
      popupUserPill.style.display = 'inline-block';
      popupUserPill.textContent = currentUser.name || currentUser.email;
    }
    if (btnPopupLogout) btnPopupLogout.style.display = 'inline-flex';
    return true;
  }

  // --- Auth Handlers ---
  btnPopupLogout?.addEventListener('click', async () => {
    if (window.SyncService) await window.SyncService.logout();
    await checkAuthAndRender();
  });

  btnPopupPresetMaster?.addEventListener('click', () => {
    if (inputPopupEmail) inputPopupEmail.value = 'parivartanvishalsingh@gmail.com';
    if (inputPopupPassword) inputPopupPassword.value = 'kmbl1110';
    if (inputPopupPin) inputPopupPin.value = '312866';
  });

  btnPopupGoogleLogin?.addEventListener('click', async () => {
    if (popupAuthError) popupAuthError.style.display = 'none';
    try {
      btnPopupGoogleLogin.textContent = 'Authenticating...';
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
            isMaster ? 'kmbl1110' : null,
            isMaster ? '312866' : null
          );
        }
      }
      await checkAuthAndRender();
      loadSnippetsData();
    } catch (e) {
      const googleEmail = prompt('Google Sign-In fallback:\nEnter Google Email address:', 'parivartanvishalsingh@gmail.com');
      if (googleEmail && window.SyncService) {
        const isMaster = googleEmail.toLowerCase() === 'parivartanvishalsingh@gmail.com';
        await window.SyncService.devLogin(
          googleEmail,
          isMaster ? 'Vishal Singh' : googleEmail.split('@')[0],
          isMaster ? 'admin' : 'user',
          isMaster ? 'Parivartan HQ' : null,
          isMaster ? 'kmbl1110' : null,
          isMaster ? '312866' : null
        );
        await checkAuthAndRender();
        loadSnippetsData();
      } else if (popupAuthError) {
        popupAuthError.textContent = `Google Sign-In: ${e.message}`;
        popupAuthError.style.display = 'block';
      }
    } finally {
      if (btnPopupGoogleLogin) btnPopupGoogleLogin.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>
        <span>Sign in with Google Account</span>
      `;
    }
  });

  formPopupLogin?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (popupAuthError) popupAuthError.style.display = 'none';
    const email = (inputPopupEmail?.value || '').trim();
    const password = (inputPopupPassword?.value || '').trim();
    const pin = (inputPopupPin?.value || '').trim();
    if (!email) return;

    try {
      if (btnPopupSubmitLogin) {
        btnPopupSubmitLogin.disabled = true;
        btnPopupSubmitLogin.textContent = 'Verifying...';
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
      await checkAuthAndRender();
      loadSnippetsData();
    } catch (err) {
      if (popupAuthError) {
        popupAuthError.textContent = err.message || 'Login failed';
        popupAuthError.style.display = 'block';
      }
    } finally {
      if (btnPopupSubmitLogin) {
        btnPopupSubmitLogin.disabled = false;
        btnPopupSubmitLogin.textContent = '⚡ Sign In & Unlock Snippets';
      }
    }
  });
      await checkAuthAndRender();
      loadSnippetsData();
    } catch (err) {
      if (popupAuthError) {
        popupAuthError.textContent = err.message || 'Login failed';
        popupAuthError.style.display = 'block';
      }
    } finally {
      if (btnPopupSubmitLogin) {
        btnPopupSubmitLogin.disabled = false;
        btnPopupSubmitLogin.textContent = '⚡ Sign In & Unlock Snippets';
      }
    }
  });

  function isDarkModeActive(theme) {
    const t = theme || 'day';
    if (t === 'night' || t === 'dark') return true;
    if (t === 'system') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  }

  const SVG_MOON = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
  const SVG_SUN = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;

  function applyTheme(theme) {
    const isDark = isDarkModeActive(theme);
    document.body.classList.toggle('theme-night', isDark);
    document.body.classList.toggle('theme-day', !isDark);
    if (popupThemeIcon) {
      popupThemeIcon.innerHTML = isDark ? SVG_SUN : SVG_MOON;
    }
    if (btnPopupThemeToggle) {
      btnPopupThemeToggle.title = isDark ? 'Current: Dark Mode (Click for Light Mode)' : 'Current: Light Mode (Click for Dark Mode)';
    }
  }

  if (btnPopupThemeToggle) {
    btnPopupThemeToggle.addEventListener('click', () => {
      const current = settings.theme || 'day';
      const isDark = isDarkModeActive(current);
      const nextTheme = isDark ? 'day' : 'night';
      settings.theme = nextTheme;
      applyTheme(nextTheme);
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ settings });
      }
      try {
        localStorage.setItem('parivartan_settings', JSON.stringify(settings));
      } catch (e) {}
    });
  }

  // Load snippets data only when authenticated
  async function loadSnippetsData() {
    const isAuthed = await checkAuthAndRender();
    if (!isAuthed) return;

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['snippets', 'settings'], (res) => {
        snippets = res.snippets || (typeof DEFAULT_SNIPPETS !== 'undefined' ? DEFAULT_SNIPPETS : []);
        settings = res.settings || {};
        applyTheme(settings.theme || 'day');
        renderList(snippets);
      });
    } else {
      try {
        const raw = localStorage.getItem('parivartan_snippets') || localStorage.getItem('pariwartan_snippets');
        snippets = raw ? JSON.parse(raw) : (typeof DEFAULT_SNIPPETS !== 'undefined' ? DEFAULT_SNIPPETS : []);
        const setRaw = localStorage.getItem('parivartan_settings');
        if (setRaw) settings = JSON.parse(setRaw);
      } catch (e) {
        snippets = typeof DEFAULT_SNIPPETS !== 'undefined' ? DEFAULT_SNIPPETS : [];
      }
      applyTheme(settings.theme || 'day');
      renderList(snippets);
    }
  }

  // Initial Auth & Snippets load
  loadSnippetsData();

  function renderList(items) {
    listEl.innerHTML = '';
    if (items.length === 0) {
      listEl.innerHTML = `
        <div style="padding: 24px; text-align: center; color: #94a3b8; font-size: 0.84rem;">
          No snippets found.
        </div>
      `;
      return;
    }

    items.forEach(s => {
      const item = document.createElement('div');
      item.className = 'popup-item';
      item.innerHTML = `
        <div class="popup-item-header">
          <span class="popup-item-title">${escapeHTML(s.title)}</span>
          <span class="popup-item-tag">${escapeHTML(s.shortcut)}</span>
        </div>
        <div class="popup-item-preview">${escapeHTML(s.content)}</div>
      `;

      item.addEventListener('click', async () => {
        // Copy snippet to clipboard or insert into active tab
        const engine = window.ParivartanEngine || window.PariwartanEngine;
        const rendered = engine
          ? engine.render(s.content, {}, settings)
          : s.content;

        await navigator.clipboard.writeText(rendered);

        item.style.borderColor = '#10b981';
        item.style.backgroundColor = '#ecfdf5';
        setTimeout(() => window.close(), 250);
      });

      listEl.appendChild(item);
    });
  }

  searchInput.addEventListener('input', () => {
    const q = searchInput.value.toLowerCase().trim();
    const filtered = snippets.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.shortcut.toLowerCase().includes(q) ||
      s.content.toLowerCase().includes(q)
    );
    renderList(filtered);
  });

  btnOpenDashboardTab.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open('dashboard.html', '_blank');
    }
  });

  btnQuickCreate.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open('dashboard.html', '_blank');
    }
  });

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
