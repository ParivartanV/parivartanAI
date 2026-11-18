# Parivartan Snippet ⚡

> **A modern, high-performance Text Expander & Quick Reply Suite for browser automation.**
> Inspired by Text Blaze (`https://dashboard.blaze.today/`), **Parivartan Snippet** allows you to type short abbreviation triggers (e.g., `/greet`, `/refund`, `/followup`, `/sign`) and automatically expands them into rich, personalized emails, customer support ticket replies, and messages.

---

## ✨ Features

- **Blaze-style Web Dashboard**:
  - **Folder Organization**: Categorize snippets by Customer Support, Sales, Email Outreach, General Signatures, or custom folders.
  - **Dynamic Variable Toolbar**: Insert today's date (`{date}`), time (`{time}`), recipient name (`{name}`), ticket ID (`{ticket_id}`), amount (`{amount}`), or custom choice dropdowns (`{dropdown:Status|Pending|Resolved}`).
  - **Live Preview Pane**: See real-time rendering of your templates with sample data.
  - **Interactive In-Dashboard Playground**: Test typing your shortcuts directly inside the dashboard before using them live!
  - **Productivity Counter**: Tracks keystrokes and estimated hours saved across all ticket responses.
  - **Backup & Restore**: One-click JSON import and export for team sharing and safety.

- **Full Browser Integration (Manifest V3 Chrome/Edge/Brave Extension)**:
  - **Universal Expansion**: Works across Gmail, Outlook, Zendesk, Freshdesk, Jira, Slack, WhatsApp Web, and any web form.
  - **Smart Variable Prompting**: If a snippet has interactive placeholders (like `{name}` or `{ticket_id}`), a clean in-page dialog pops up so you can fill in the values and press `Enter` to insert.
  - **Instant Static Replacement**: Shortcuts without custom variables expand instantaneously with zero lag.
  - **Rich Text & ContentEditable Support**: Preserves cursor positions and integrates cleanly with rich email composers.
  - **Command Palette (`Alt + Shift + P`)**: Press `Alt + Shift + P` anywhere on the web to search snippets and insert them on the fly.
  - **Quick Action Popup**: View shortcuts, copy templates, or jump to the full dashboard directly from your browser toolbar.

---

## 🚀 How to Install and Test the Browser Extension

### Step 1: Open Chrome / Edge Extension Settings
1. Open your browser (**Google Chrome**, **Microsoft Edge**, **Brave**, or **Opera**).
2. In the URL address bar, navigate to:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
   - Brave: `brave://extensions/`

### Step 2: Enable Developer Mode
- In the top-right corner of the Extensions page, toggle **Developer mode** to **ON**.

### Step 3: Load the Extension
1. Click the **"Load unpacked"** button in the top-left corner.
2. Select the directory containing this project:
   ```
   /home/winlin/Documents/Antigravity project
   ```
3. You will now see **Parivartan Snippet - Text Expander & Quick Replies** installed and active!

---

## 🖥️ How to Use the Web Dashboard Standalone

You can open and manage the dashboard either as the extension's options page or standalone in any web browser:

### Option A: Via Local Web Server
Run this command in the project terminal:
```bash
python3 -m http.server 8080
```
Then visit:
```
http://localhost:8080/dashboard.html
```

### Option B: Via Extension Icon
- Click the **Parivartan Snippet** icon in your browser toolbar, then click the **Open Dashboard** icon in the top right.

---

## 💡 Pre-loaded Shortcuts Cheat Sheet

Try typing any of these inside an email, ticket, or in the dashboard's **Interactive Playground**:

| Shortcut | Description | Dynamic Fields Included |
|---|---|---|
| `/greet` | Support Ticket Greeting & Acknowledgement | `{name}`, `{ticket_id}`, `{my_name}` |
| `/refund` | Refund Processed Confirmation | `{name}`, `{amount}`, `{order_id}`, `{my_name}` |
| `/info` | Request Screenshots & Error Reproduction | `{name}`, `{ticket_id}`, `{my_name}` |
| `/followup` | Post-Meeting / Demo Next Steps | `{name}`, `{objective}`, `{solution}`, `{date}`, `{my_name}` |
| `/resolved` | Ticket Solved Confirmation & Close | `{name}`, `{ticket_id}`, `{my_name}` |
| `/meet` | Schedule a Quick Call Link | `{name}`, `{my_name}` |
| `/sign` | Professional Email Signature | `{my_name}` |

---

## 🧩 Project Structure

```
├── manifest.json              # Chrome Manifest V3 configuration
├── background.js             # Service worker handling hotkeys & context menus
├── content_script.js         # Text expander engine running in web pages & emails
├── content_style.css         # Styling for floating prompt modal & command palette
├── dashboard.html            # Blaze-style replica snippet dashboard
├── dashboard.css             # Dashboard responsive styling & theme
├── dashboard.js              # Dashboard business logic & interactive playground
├── popup.html                # Browser toolbar popup
├── popup.css                 # Popup layout styling
├── popup.js                  # Quick search & copy logic
├── shared/
│   ├── default_snippets.js   # Starter templates for tickets and emails
│   ├── storage.js            # Unified chrome.storage & localStorage bridge
│   └── template_engine.js    # Dynamic variable parser & template evaluator
├── icons/                    # App icons (16px, 48px, 128px, SVG logo)
└── README.md                 # Project documentation
```
