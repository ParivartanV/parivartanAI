// Parivartan Master Admin Portal App
const API_BASE = window.location.origin;

let adminJwt = localStorage.getItem('parivartan_admin_jwt') || null;
let currentClientsList = [];

// DOM References
const adminUserEmail = document.getElementById('adminUserEmail');
const btnAdminSwitchUser = document.getElementById('btnAdminSwitchUser');
const btnAdminSecurity = document.getElementById('btnAdminSecurity');
const btnAdminElevateRole = document.getElementById('btnAdminElevateRole');
const btnAdminLogout = document.getElementById('btnAdminLogout');
const serverStatusBadge = document.getElementById('serverStatusBadge');
const adminNavBar = document.getElementById('adminNavBar');
const paneClientWorkspace = document.getElementById('pane-client-workspace');

// Client Workspace Elements
const clientWorkspaceName = document.getElementById('clientWorkspaceName');
const clientWorkspaceEmail = document.getElementById('clientWorkspaceEmail');
const clientAvatarImg = document.getElementById('clientAvatarImg');
const clientWorkspaceRoleBadge = document.getElementById('clientWorkspaceRoleBadge');
const clientWorkspacePlanBadge = document.getElementById('clientWorkspacePlanBadge');
const clientCountSnippets = document.getElementById('clientCountSnippets');
const clientCountFolders = document.getElementById('clientCountFolders');
const clientCountPrompts = document.getElementById('clientCountPrompts');
const clientCountVariables = document.getElementById('clientCountVariables');
const btnWorkspaceElevateAdmin = document.getElementById('btnWorkspaceElevateAdmin');

// Login Modal References
const modalPortalLogin = document.getElementById('modalPortalLogin');
const formPortalLogin = document.getElementById('formPortalLogin');
const loginEmailInput = document.getElementById('loginEmailInput');
const loginPasswordInput = document.getElementById('loginPasswordInput');
const loginPinInput = document.getElementById('loginPinInput');
const loginNameInput = document.getElementById('loginNameInput');
const loginRoleSelect = document.getElementById('loginRoleSelect');
const loginCompanyInput = document.getElementById('loginCompanyInput');
const btnGoogleWebLogin = document.getElementById('btnGoogleWebLogin');
const presetAdminLogin = document.getElementById('presetAdminLogin');
const presetTechLogin = document.getElementById('presetTechLogin');
const presetNewClientLogin = document.getElementById('presetNewClientLogin');

// Change Master Password Modal References
const modalChangeMasterPassword = document.getElementById('modalChangeMasterPassword');
const formChangeMasterPassword = document.getElementById('formChangeMasterPassword');
const changePassEmail = document.getElementById('changePassEmail');
const changePassCurrent = document.getElementById('changePassCurrent');
const changePassNew = document.getElementById('changePassNew');
const changePassConfirm = document.getElementById('changePassConfirm');
const changePassPin = document.getElementById('changePassPin');

// Tab buttons & panes
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');

// KPI Elements
const kpiClients = document.getElementById('kpiClients');
const kpiRevenue = document.getElementById('kpiRevenue');
const kpiPaidTxnCount = document.getElementById('kpiPaidTxnCount');
const kpiSnippets = document.getElementById('kpiSnippets');
const kpiLogs = document.getElementById('kpiLogs');
const tabCountClients = document.getElementById('tabCountClients');
const tabTotalRevenue = document.getElementById('tabTotalRevenue');

// Tables & Feeds
const tblRecentClients = document.getElementById('tblRecentClients');
const feedRecentLogs = document.getElementById('feedRecentLogs');
const tblClientsList = document.getElementById('tblClientsList');
const tblPaymentsList = document.getElementById('tblPaymentsList');
const tblFullLogs = document.getElementById('tblFullLogs');
const clientSearchInput = document.getElementById('clientSearchInput');
const logCategoryFilter = document.getElementById('logCategoryFilter');

// Modals
const modalClientDossier = document.getElementById('modalClientDossier');
const dossierClientName = document.getElementById('dossierClientName');
const dossierBody = document.getElementById('dossierBody');
const modalNewPayment = document.getElementById('modalNewPayment');
const btnOpenNewPaymentModal = document.getElementById('btnOpenNewPaymentModal');
const formNewPayment = document.getElementById('formNewPayment');
const paymentClientSelect = document.getElementById('paymentClientSelect');

// --- Helper Functions ---
function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminJwt}`
  };
}

function escapeHTML(str) {
  return (str || '').replace(/[&<>'"]/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[tag] || tag));
}

function formatDate(dateStr) {
  if (!dateStr) return 'Never';
  const d = new Date(dateStr);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getPlanBadge(plan) {
  const p = (plan || 'free').toLowerCase();
  if (p === 'enterprise') return `<span class="badge badge-enterprise">Enterprise</span>`;
  if (p === 'pro') return `<span class="badge badge-pro">Pro</span>`;
  return `<span class="badge badge-free">Free</span>`;
}

function getStatusBadge(status) {
  const s = (status || 'active').toLowerCase();
  if (s === 'completed' || s === 'active') return `<span class="badge badge-success">${escapeHTML(s)}</span>`;
  if (s === 'pending' || s === 'trial') return `<span class="badge badge-warning">${escapeHTML(s)}</span>`;
  return `<span class="badge badge-danger">${escapeHTML(s)}</span>`;
}

// --- Tab Navigation ---
tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => b.classList.remove('active'));
    tabPanes.forEach(p => p.classList.remove('active'));

    btn.classList.add('active');
    const tabId = btn.getAttribute('data-tab');
    const targetPane = document.getElementById(`pane-${tabId}`);
    if (targetPane) targetPane.classList.add('active');

    // Trigger tab specific loads
    if (tabId === 'overview') loadOverview();
    if (tabId === 'clients') loadClients();
    if (tabId === 'payments') loadPayments();
    if (tabId === 'logs') loadLogs();
  });
});

document.getElementById('btnGoClientsTab')?.addEventListener('click', () => {
  document.querySelector('.tab-btn[data-tab="clients"]')?.click();
});
document.getElementById('btnGoLogsTab')?.addEventListener('click', () => {
  document.querySelector('.tab-btn[data-tab="logs"]')?.click();
});

// --- Modal Handlers ---
document.querySelectorAll('[data-close]').forEach(btn => {
  btn.addEventListener('click', () => {
    const modalId = btn.getAttribute('data-close');
    document.getElementById(modalId)?.classList.remove('open');
  });
});

// --- User Session & Authentication ---
let currentUser = null;

async function initUserSession() {
  if (adminJwt) {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        currentUser = data.user;
        renderUserState(data.user);
        return true;
      }
    } catch (_) {}
  }

  // Auto-login as Master Admin for zero-friction local desktop testing
  return autoMasterLogin();
}

async function autoMasterLogin() {
  try {
    const res = await fetch(`${API_BASE}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'parivartanvishalsingh@gmail.com',
        name: 'Vishal Singh',
        password: 'kmbl1110',
        pin: '312866'
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.jwt) {
        adminJwt = data.jwt;
        localStorage.setItem('parivartan_admin_jwt', data.jwt);
        currentUser = data.user;
        renderUserState(data.user);
        return true;
      }
    }
  } catch (err) {
    console.error('Master auto login error:', err);
  }
  return false;
}

function renderUserState(user) {
  if (!user) {
    adminUserEmail.textContent = 'Signed Out';
    btnAdminLogout.style.display = 'none';
    btnAdminElevateRole.style.display = 'none';
    if (btnAdminSecurity) btnAdminSecurity.style.display = 'none';
    adminNavBar.style.display = 'none';
    tabPanes.forEach(p => p.classList.remove('active'));
    paneClientWorkspace.style.display = 'none';
    return;
  }

  btnAdminLogout.style.display = 'inline-flex';

  if (user.role === 'admin') {
    adminUserEmail.textContent = `👑 ${user.name || user.email} (Master Admin)`;
    btnAdminElevateRole.style.display = 'none';
    if (btnAdminSecurity) btnAdminSecurity.style.display = 'inline-flex';
    adminNavBar.style.display = 'flex';
    paneClientWorkspace.style.display = 'none';

    // Show active tab
    const activeTab = document.querySelector('.tab-btn.active') || document.querySelector('.tab-btn[data-tab="overview"]');
    if (activeTab) {
      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));
      activeTab.classList.add('active');
      const targetPane = document.getElementById(`pane-${activeTab.getAttribute('data-tab')}`);
      if (targetPane) targetPane.classList.add('active');
    }
    loadAll();
  } else {
    // Client user view
    adminUserEmail.textContent = `👤 ${user.name || user.email} (Client)`;
    btnAdminElevateRole.style.display = 'inline-flex';
    if (btnAdminSecurity) btnAdminSecurity.style.display = 'none';
    adminNavBar.style.display = 'none';
    tabPanes.forEach(p => p.classList.remove('active'));
    paneClientWorkspace.style.display = 'block';

    clientWorkspaceName.textContent = user.name || user.email;
    clientWorkspaceEmail.textContent = user.email;
    if (clientAvatarImg) {
      clientAvatarImg.src = user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || user.email)}`;
    }
    if (clientWorkspacePlanBadge) {
      clientWorkspacePlanBadge.textContent = `${(user.subscriptionPlan || 'Free').toUpperCase()} PLAN`;
    }

    if (user.counts) {
      if (clientCountSnippets) clientCountSnippets.textContent = user.counts.snippets || 0;
      if (clientCountFolders) clientCountFolders.textContent = user.counts.folders || 0;
      if (clientCountPrompts) clientCountPrompts.textContent = user.counts.aiPrompts || 0;
      if (clientCountVariables) clientCountVariables.textContent = user.counts.aiVariables || 0;
    }
  }
}

// Elevate current user to Master Admin role
async function elevateCurrentRole() {
  if (!adminJwt) return;
  try {
    const res = await fetch(`${API_BASE}/api/auth/elevate`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (res.ok) {
      const data = await res.json();
      adminJwt = data.jwt;
      localStorage.setItem('parivartan_admin_jwt', data.jwt);
      currentUser = data.user;
      renderUserState(data.user);
      alert('✓ Account elevated to Master Administrator! Full portal access unlocked.');
    } else {
      const err = await res.json();
      alert(`Elevation failed: ${err.error || 'Server error'}`);
    }
  } catch (err) {
    alert(`Elevation error: ${err.message}`);
  }
}

btnAdminElevateRole?.addEventListener('click', elevateCurrentRole);
btnWorkspaceElevateAdmin?.addEventListener('click', elevateCurrentRole);

// Sign Out
btnAdminLogout.addEventListener('click', () => {
  adminJwt = null;
  currentUser = null;
  localStorage.removeItem('parivartan_admin_jwt');
  renderUserState(null);
  modalPortalLogin.classList.add('open');
});

// Switch User / Open Login Modal
btnAdminSwitchUser?.addEventListener('click', () => {
  modalPortalLogin.classList.add('open');
});

// Quick Presets in Login Modal
presetAdminLogin?.addEventListener('click', () => {
  loginEmailInput.value = 'parivartanvishalsingh@gmail.com';
  if (loginPasswordInput) loginPasswordInput.value = 'kmbl1110';
  if (loginPinInput) loginPinInput.value = '312866';
  loginNameInput.value = 'Vishal Singh';
  loginRoleSelect.value = 'admin';
  loginCompanyInput.value = 'Parivartan HQ';
});

presetTechLogin?.addEventListener('click', () => {
  loginEmailInput.value = 'tech.support@psychz.net';
  if (loginPasswordInput) loginPasswordInput.value = '';
  if (loginPinInput) loginPinInput.value = '';
  loginNameInput.value = 'Support Tech Lead';
  loginRoleSelect.value = 'user';
  loginCompanyInput.value = 'Psychz Support';
});

presetNewClientLogin?.addEventListener('click', () => {
  const rand = Math.floor(Math.random() * 900) + 100;
  loginEmailInput.value = `client.${rand}@psychz.net`;
  if (loginPasswordInput) loginPasswordInput.value = '';
  if (loginPinInput) loginPinInput.value = '';
  loginNameInput.value = `Client User ${rand}`;
  loginRoleSelect.value = 'user';
  loginCompanyInput.value = 'Acme Corp';
});

// Google Authentication for Web Admin Portal
btnGoogleWebLogin?.addEventListener('click', () => {
  if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
    google.accounts.id.initialize({
      client_id: '921345678901-placeholder.apps.googleusercontent.com',
      callback: handleGoogleAuthResponse
    });
    google.accounts.id.prompt();
  } else {
    // Interactive Google account prompt for local testing
    const googleEmail = prompt('Sign in with Google Account:\nEnter Google Email address:', 'parivartanvishalsingh@gmail.com');
    if (!googleEmail) return;
    const isMaster = googleEmail.toLowerCase() === 'parivartanvishalsingh@gmail.com';
    const googleName = isMaster ? 'Vishal Singh' : googleEmail.split('@')[0];

    fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: googleEmail,
        name: googleName,
        password: isMaster ? 'kmbl1110' : undefined,
        pin: isMaster ? '312866' : undefined,
        role: isMaster ? 'admin' : 'user'
      })
    }).then(async res => {
      if (res.ok) {
        const data = await res.json();
        adminJwt = data.jwt;
        localStorage.setItem('parivartan_admin_jwt', data.jwt);
        currentUser = data.user;
        modalPortalLogin.classList.remove('open');
        renderUserState(data.user);
        alert(`✓ Signed in with Google as ${data.user.email} (${data.user.role === 'admin' ? '👑 Master Admin' : '👤 Client User'})!`);
      } else {
        const err = await res.json();
        alert(`Google sign-in error: ${err.error || 'Failed'}`);
      }
    }).catch(err => {
      alert(`Google sign-in error: ${err.message}`);
    });
  }
});

async function handleGoogleAuthResponse(response) {
  if (!response || !response.credential) return;
  try {
    const res = await fetch(`${API_BASE}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: response.credential })
    });
    if (res.ok) {
      const data = await res.json();
      adminJwt = data.jwt;
      localStorage.setItem('parivartan_admin_jwt', data.jwt);
      currentUser = data.user;
      modalPortalLogin.classList.remove('open');
      renderUserState(data.user);
      alert(`✓ Google Authentication successful as ${data.user.email}!`);
    } else {
      const err = await res.json();
      alert(`Google authentication rejected: ${err.error || 'Invalid token'}`);
    }
  } catch (err) {
    alert(`Google Authentication error: ${err.message}`);
  }
}

// Submit Login Form
formPortalLogin?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = loginEmailInput.value.trim().toLowerCase();
  const password = loginPasswordInput ? loginPasswordInput.value.trim() : '';
  const pin = loginPinInput ? loginPinInput.value.trim() : '';
  const name = loginNameInput.value.trim();
  const role = loginRoleSelect.value;
  const company = loginCompanyInput.value.trim();

  if (!email || !email.includes('@')) {
    alert('Please enter a valid email address');
    return;
  }

  // Auto-supply master 2FA PIN if master email
  const finalPin = pin || (email.includes('parivartan') ? '312866' : '');

  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, pin: finalPin, name, role, company })
    });

    const data = await res.json();
    if (res.ok) {
      if (data.require2fa) {
        const userPin = prompt('Two-Factor Authentication: Enter 6-digit Master PIN (312866):', '312866');
        if (!userPin) return;
        return loginWithPin(email, password, userPin, name, role, company);
      }
      adminJwt = data.jwt;
      localStorage.setItem('parivartan_admin_jwt', data.jwt);
      currentUser = data.user;
      modalPortalLogin.classList.remove('open');
      renderUserState(data.user);
    } else {
      alert(`Login failed: ${data.error || 'Server error'}`);
    }
  } catch (err) {
    alert(`Login error: ${err.message}`);
  }
});

async function loginWithPin(email, password, pin, name, role, company) {
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, pin, name, role, company })
    });
    const data = await res.json();
    if (res.ok && data.jwt) {
      adminJwt = data.jwt;
      localStorage.setItem('parivartan_admin_jwt', data.jwt);
      currentUser = data.user;
      modalPortalLogin.classList.remove('open');
      renderUserState(data.user);
      alert(`✓ Two-Factor Authentication Verified! Logged in as ${data.user.email}`);
    } else {
      alert(`2FA Verification Failed: ${data.error || 'Invalid PIN'}`);
    }
  } catch (e) {
    alert(`2FA Error: ${e.message}`);
  }
}

// Open Security & Password Modal
btnAdminSecurity?.addEventListener('click', () => {
  if (changePassEmail && currentUser) {
    changePassEmail.value = currentUser.email || 'parivartanvishalsingh@gmail.com';
  }
  if (changePassPin) changePassPin.value = '312866';
  modalChangeMasterPassword?.classList.add('open');
});

// Submit Password Change
formChangeMasterPassword?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = changePassEmail.value.trim().toLowerCase();
  const currentPassword = changePassCurrent.value.trim();
  const newPassword = changePassNew.value.trim();
  const confirmPassword = changePassConfirm.value.trim();
  const pin = changePassPin.value.trim();

  if (newPassword !== confirmPassword) {
    alert('Error: New password and confirm password do not match.');
    return;
  }

  if (newPassword.length < 4) {
    alert('Error: Password must be at least 4 characters long.');
    return;
  }

  if (!pin) {
    alert('Error: Two-Factor Authentication PIN (312866) is required.');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/admin/change-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email, currentPassword, newPassword, pin })
    });

    const data = await res.json();
    if (res.ok) {
      alert('✓ Master Admin password updated successfully! Please use your new password for future logins.');
      modalChangeMasterPassword.classList.remove('open');
      formChangeMasterPassword.reset();
      if (loginPasswordInput) loginPasswordInput.value = newPassword;
    } else {
      alert(`Password update failed: ${data.error || 'Server error'}`);
    }
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
});

// --- API Calls & Data Rendering ---

// 1. Overview
async function loadOverview() {
  try {
    const res = await fetch(`${API_BASE}/api/admin/overview`, { headers: getAuthHeaders() });
    if (!res.ok) return;
    const data = await res.json();
    const stats = data.stats;

    kpiClients.textContent = stats.totalClients;
    kpiRevenue.textContent = `$${stats.totalRevenue.toFixed(2)}`;
    kpiPaidTxnCount.textContent = `${stats.completedTransactions} completed transactions`;
    kpiSnippets.textContent = stats.totalSnippets;
    kpiLogs.textContent = stats.totalLogs;

    tabCountClients.textContent = stats.totalClients;
    tabTotalRevenue.textContent = `$${stats.totalRevenue.toFixed(0)}`;

    // Render Recent Clients
    if (data.recentClients && data.recentClients.length > 0) {
      tblRecentClients.innerHTML = data.recentClients.map(c => `
        <tr>
          <td>
            <strong>${escapeHTML(c.name || 'Client')}</strong>
            <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHTML(c.email)}</div>
          </td>
          <td>${getPlanBadge(c.subscriptionPlan)}</td>
          <td>${escapeHTML(c.company || '—')}</td>
          <td>${formatDate(c.lastActiveAt || c.createdAt)}</td>
        </tr>
      `).join('');
    } else {
      tblRecentClients.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No clients registered yet</td></tr>`;
    }

    // Render Recent Feed
    if (data.recentLogs && data.recentLogs.length > 0) {
      feedRecentLogs.innerHTML = data.recentLogs.map(l => {
        let icon = '⚡';
        if (l.category === 'auth') icon = '🔑';
        if (l.category === 'sync') icon = '☁️';
        if (l.category === 'billing') icon = '💳';
        if (l.category === 'ai') icon = '✨';

        return `
          <div class="activity-item">
            <span class="activity-icon">${icon}</span>
            <div class="activity-info">
              <div class="activity-title">${escapeHTML(l.action)}</div>
              <div class="activity-meta">
                ${l.user ? `Client: <strong>${escapeHTML(l.user.name || l.user.email)}</strong> • ` : ''}
                ${formatDate(l.createdAt)}
              </div>
            </div>
          </div>
        `;
      }).join('');
    } else {
      feedRecentLogs.innerHTML = `<div class="text-center text-muted" style="padding:20px;">No activity logs recorded yet</div>`;
    }
  } catch (err) {
    console.error('Error loading overview:', err);
  }
}

// 2. Clients List
async function loadClients() {
  try {
    const query = clientSearchInput.value.trim();
    const url = `${API_BASE}/api/admin/clients${query ? `?search=${encodeURIComponent(query)}` : ''}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) return;

    const data = await res.json();
    currentClientsList = data.clients || [];

    // Populate client dropdown for New Payment modal
    paymentClientSelect.innerHTML = currentClientsList.map(c => `
      <option value="${c.id}">${escapeHTML(c.name)} (${escapeHTML(c.email)}) — Current: ${c.plan.toUpperCase()}</option>
    `).join('');

    tabCountClients.textContent = currentClientsList.length;

    if (currentClientsList.length === 0) {
      tblClientsList.innerHTML = `<tr><td colspan="7" class="text-center text-muted" style="padding:24px;">No clients found matching criteria</td></tr>`;
      return;
    }

    tblClientsList.innerHTML = currentClientsList.map(c => `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            <img src="${c.avatarUrl || 'https://lh3.googleusercontent.com/a/default-user'}" alt="Avatar" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border-color);">
            <div>
              <div style="font-weight: 600;">${escapeHTML(c.name)}</div>
              <div style="font-size: 0.76rem; color: var(--text-muted);">${escapeHTML(c.email)}</div>
            </div>
          </div>
        </td>
        <td>${escapeHTML(c.company || '—')}</td>
        <td>
          ${getPlanBadge(c.plan)}
          <div style="margin-top: 2px;">${getStatusBadge(c.status)}</div>
        </td>
        <td>
          <strong style="color: var(--success);">$${c.totalPaid.toFixed(2)}</strong>
          <div style="font-size: 0.72rem; color: var(--text-muted);">${c.paymentCount} payments</div>
        </td>
        <td>
          <div>📁 ${c.counts.snippets} snippets in ${c.counts.folders} folders</div>
          <div style="font-size: 0.74rem; color: var(--text-muted);">✨ ${c.counts.aiPrompts} AI templates</div>
        </td>
        <td>${formatDate(c.lastActiveAt || c.createdAt)}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="openClientDossier('${c.id}')">
            🔍 View Dossier
          </button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Error loading clients:', err);
  }
}

clientSearchInput.addEventListener('input', () => {
  clearTimeout(clientSearchInput._timeout);
  clientSearchInput._timeout = setTimeout(loadClients, 300);
});
document.getElementById('btnRefreshClients')?.addEventListener('click', loadClients);

// 3. Client Dossier Deep-Dive
window.openClientDossier = async function(clientId) {
  modalClientDossier.classList.add('open');
  dossierBody.innerHTML = '<div class="text-center text-muted" style="padding: 30px;">Loading complete client dossier...</div>';

  try {
    const res = await fetch(`${API_BASE}/api/admin/clients/${clientId}`, { headers: getAuthHeaders() });
    if (!res.ok) {
      dossierBody.innerHTML = '<div class="text-center text-muted">Failed to load client profile.</div>';
      return;
    }
    const { client } = await res.json();
    dossierClientName.textContent = `Client Dossier: ${client.name || client.email}`;

    dossierBody.innerHTML = `
      <!-- Profile & Plan Control Bar -->
      <div style="display:flex; justify-content:space-between; align-items:flex-start; background:var(--bg-hover); padding:16px; border-radius:8px; border:1px solid var(--border-color); margin-bottom:20px; flex-wrap:wrap; gap:16px;">
        <div>
          <div style="font-size:1.15rem; font-weight:700;">${escapeHTML(client.name)}</div>
          <div style="font-size:0.84rem; color:var(--text-muted);">${escapeHTML(client.email)} • Company: <strong>${escapeHTML(client.company || 'Not set')}</strong></div>
          <div style="font-size:0.78rem; color:var(--text-dim); margin-top:4px;">Registered: ${formatDate(client.createdAt)} • Last Active: ${formatDate(client.lastActiveAt)}</div>
        </div>
        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px;">
          <div style="display:flex; gap:8px; align-items:center;">
            <label style="font-size:0.8rem; font-weight:600; color:var(--text-muted);">Change Plan:</label>
            <select id="dossierPlanSelect" class="form-input" style="padding:4px 8px; width:auto;">
              <option value="free" ${client.subscriptionPlan === 'free' ? 'selected' : ''}>Free</option>
              <option value="pro" ${client.subscriptionPlan === 'pro' ? 'selected' : ''}>Pro</option>
              <option value="enterprise" ${client.subscriptionPlan === 'enterprise' ? 'selected' : ''}>Enterprise</option>
            </select>
            <button class="btn btn-primary btn-sm" onclick="updateClientPlan('${client.id}')">Apply</button>
          </div>
          <div style="font-size:0.85rem; font-weight:700; color:var(--success);">
            Total Paid: $${client.totalPaid.toFixed(2)}
          </div>
        </div>
      </div>

      <!-- Assets & Snippets -->
      <div style="margin-bottom:20px;">
        <h4 style="margin-bottom:8px; font-size:0.95rem;">📁 Stored Snippets (${client.snippets.length})</h4>
        <div style="max-height:160px; overflow-y:auto; border:1px solid var(--border-color); border-radius:6px; background:var(--bg-page);">
          ${client.snippets.length === 0 ? '<div style="padding:12px; color:var(--text-muted); font-size:0.82rem;">No snippets stored</div>' : `
            <table class="data-table" style="font-size:0.8rem;">
              <thead><tr><th>Shortcut</th><th>Title</th><th>Usage</th><th>Updated</th></tr></thead>
              <tbody>
                ${client.snippets.map(s => `
                  <tr>
                    <td><code>${escapeHTML(s.shortcut)}</code></td>
                    <td>${escapeHTML(s.title)}</td>
                    <td>${s.usageCount} times</td>
                    <td>${formatDate(s.updatedAt)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>
      </div>

      <!-- Payments History -->
      <div style="margin-bottom:20px;">
        <h4 style="margin-bottom:8px; font-size:0.95rem;">💳 Linked Payments & Invoices (${client.payments.length})</h4>
        <div style="max-height:160px; overflow-y:auto; border:1px solid var(--border-color); border-radius:6px; background:var(--bg-page);">
          ${client.payments.length === 0 ? '<div style="padding:12px; color:var(--text-muted); font-size:0.82rem;">No payments on record</div>' : `
            <table class="data-table" style="font-size:0.8rem;">
              <thead><tr><th>Transaction ID</th><th>Plan</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                ${client.payments.map(p => `
                  <tr>
                    <td><code style="font-size:0.75rem;">${escapeHTML(p.transactionId)}</code></td>
                    <td>${escapeHTML(p.planName)}</td>
                    <td><strong>$${p.amount.toFixed(2)}</strong></td>
                    <td>${escapeHTML(p.paymentMethod)}</td>
                    <td>${getStatusBadge(p.status)}</td>
                    <td>${formatDate(p.paidAt)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>
      </div>

      <!-- Activity Logs -->
      <div>
        <h4 style="margin-bottom:8px; font-size:0.95rem;">📜 Client Audit Logs (Recent ${client.activityLogs.length})</h4>
        <div style="max-height:160px; overflow-y:auto; border:1px solid var(--border-color); border-radius:6px; background:var(--bg-page); padding:8px 12px; font-family:'Fira Code', monospace; font-size:0.76rem;">
          ${client.activityLogs.length === 0 ? '<div class="text-muted">No activity logs</div>' : 
            client.activityLogs.map(l => `
              <div style="padding:4px 0; border-bottom:1px solid rgba(51,65,85,0.4);">
                <span style="color:var(--text-muted);">${formatDate(l.createdAt)}</span> • 
                <span style="color:var(--accent); font-weight:600;">[${escapeHTML(l.action)}]</span> 
                ${l.details ? `— <span style="color:var(--text-dim);">${escapeHTML(l.details)}</span>` : ''}
              </div>
            `).join('')
          }
        </div>
      </div>
    `;
  } catch (err) {
    dossierBody.innerHTML = `<div class="text-center text-muted">Error: ${err.message}</div>`;
  }
};

window.updateClientPlan = async function(clientId) {
  const plan = document.getElementById('dossierPlanSelect')?.value;
  try {
    const res = await fetch(`${API_BASE}/api/admin/clients/${clientId}/plan`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ plan, status: 'active' })
    });
    if (res.ok) {
      alert('✓ Client subscription plan updated successfully!');
      loadClients();
      loadOverview();
      openClientDossier(clientId);
    }
  } catch (err) {
    alert(`Failed to update plan: ${err.message}`);
  }
};

// 4. Payments Ledger
async function loadPayments() {
  try {
    const res = await fetch(`${API_BASE}/api/admin/payments`, { headers: getAuthHeaders() });
    if (!res.ok) return;
    const data = await res.json();
    const payments = data.payments || [];

    tabTotalRevenue.textContent = `$${data.totalRevenue.toFixed(0)}`;

    if (payments.length === 0) {
      tblPaymentsList.innerHTML = `<tr><td colspan="7" class="text-center text-muted" style="padding:24px;">No payment records in database</td></tr>`;
      return;
    }

    tblPaymentsList.innerHTML = payments.map(p => `
      <tr>
        <td><code>${escapeHTML(p.transactionId)}</code></td>
        <td>
          <strong>${escapeHTML(p.user?.name || 'Client')}</strong>
          <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHTML(p.user?.email || '—')}</div>
        </td>
        <td>${escapeHTML(p.planName)}</td>
        <td><strong style="color:var(--success); font-size:0.95rem;">$${p.amount.toFixed(2)}</strong></td>
        <td><span style="text-transform: capitalize;">${escapeHTML(p.paymentMethod)}</span></td>
        <td>${getStatusBadge(p.status)}</td>
        <td>${formatDate(p.paidAt)}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Error loading payments:', err);
  }
}

// 5. Record New Payment
btnOpenNewPaymentModal.addEventListener('click', async () => {
  await loadClients();
  modalNewPayment.classList.add('open');
});

formNewPayment.addEventListener('submit', async (e) => {
  e.preventDefault();
  const clientId = paymentClientSelect.value;
  const amount = parseFloat(document.getElementById('paymentAmountInput').value);
  const planName = document.getElementById('paymentPlanInput').value.trim();
  const paymentMethod = document.getElementById('paymentMethodSelect').value;
  const status = document.getElementById('paymentStatusSelect').value;
  const upgradePlan = document.getElementById('paymentUpgradePlanSelect').value;

  try {
    const res = await fetch(`${API_BASE}/api/admin/clients/${clientId}/payments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        amount,
        planName,
        paymentMethod,
        status,
        upgradePlan: upgradePlan || undefined
      })
    });

    if (res.ok) {
      alert('✓ Payment recorded and linked to client profile successfully!');
      modalNewPayment.classList.remove('open');
      formNewPayment.reset();
      loadPayments();
      loadClients();
      loadOverview();
    } else {
      const err = await res.json();
      alert(`Error: ${err.error || 'Failed to record payment'}`);
    }
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
});

// 6. Audit & System Logs
async function loadLogs() {
  try {
    const category = logCategoryFilter.value;
    const url = `${API_BASE}/api/admin/logs${category ? `?category=${category}` : ''}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) return;

    const data = await res.json();
    const logs = data.logs || [];

    if (logs.length === 0) {
      tblFullLogs.innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding:24px;">No logs recorded</td></tr>`;
      return;
    }

    tblFullLogs.innerHTML = logs.map(l => `
      <tr>
        <td style="white-space:nowrap;">${formatDate(l.createdAt)}</td>
        <td><strong style="color:var(--accent);">${escapeHTML(l.action)}</strong></td>
        <td><span class="badge badge-free">${escapeHTML(l.category)}</span></td>
        <td>${l.user ? `${escapeHTML(l.user.name || l.user.email)}` : '<span class="text-muted">System</span>'}</td>
        <td style="color:var(--text-muted); font-size:0.75rem;">${escapeHTML(l.ipAddress || '127.0.0.1')}</td>
        <td style="max-width:320px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--text-dim);" title="${escapeHTML(l.details || '')}">
          ${escapeHTML(l.details || '—')}
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Error loading logs:', err);
  }
}

logCategoryFilter.addEventListener('change', loadLogs);
document.getElementById('btnRefreshLogs')?.addEventListener('click', loadLogs);

// --- Master Initialize ---
async function loadAll() {
  await Promise.all([
    loadOverview(),
    loadClients(),
    loadPayments(),
    loadLogs()
  ]);
}

window.addEventListener('DOMContentLoaded', async () => {
  await initUserSession();
});
