# Setup: host the Meal Planner online + enable Google Drive sync

This guide walks you through three one-time setup steps so your meal-planner
data syncs across all your devices via your own Google Drive.

Total time: about **30 minutes** (mostly waiting).

Prerequisites:
- A Google account (the one whose Drive will store the data).
- A GitHub account (free — sign up at https://github.com if you don't have one).

---

## Part A — Set up Google Cloud OAuth (one-time, ~10 min)

### A1. Create a Google Cloud project

1. Open https://console.cloud.google.com/ and sign in.
2. Top bar → **Select a project** → **New Project**.
3. Name it `meal-planner` → **Create**. Wait for the spinner. Click **Select Project** in the notification.

### A2. Enable the Drive API

1. Left menu → **APIs & Services** → **Library**.
2. Search for **Google Drive API** → click it → **Enable**.

### A3. Configure the OAuth consent screen

1. Left menu → **APIs & Services** → **OAuth consent screen**.
2. User type: **External** → **Create**.
3. Fill in:
   - App name: `Meal Planner`
   - User support email: your email
   - Developer contact: your email
   - Save and Continue.
4. Scopes page → **Add or Remove Scopes** → search `drive.appdata` → tick
   `.../auth/drive.appdata` → **Update** → Save and Continue.
5. Test users → **Add Users** → your Google email → Save and Continue.
6. Back on the dashboard, leave the publishing status as **Testing**.
   You do **not** need to verify the app — Google allows up to 100 test users
   in Testing mode, and it's just you.

### A4. Create the OAuth Client ID

1. Left menu → **APIs & Services** → **Credentials**.
2. **Create Credentials** → **OAuth client ID**.
3. Application type: **Web application**. Name: `Meal Planner Web`.
4. **Authorized JavaScript origins** → **Add URI** twice:
   - `http://localhost:8080` — for local testing.
   - `https://<your-github-username>.github.io` — your live URL. Replace
     `<your-github-username>` with your actual GitHub username. **No trailing
     slash, no `/meal-planner/` path here — just the origin.**
5. Leave **Authorized redirect URIs** empty. We don't use the redirect flow.
6. **Create** → copy the **Client ID** (it ends in `.apps.googleusercontent.com`).

### A5. Paste the Client ID into the code

1. Open `meal-planner/src/config.js` in any text editor.
2. Replace `PASTE-YOUR-CLIENT-ID.apps.googleusercontent.com` with the ID you
   just copied. Save the file.

---

## Part B — Push the code to GitHub

Easiest path if you're new to git: use **GitHub Desktop**
(https://desktop.github.com/).

1. Install GitHub Desktop → sign in with your GitHub account.
2. File → **Add Local Repository** → browse to
   `D:\ClaudeCodeTest\meal-planner` (the `meal-planner` folder, **not** the
   parent `ClaudeCodeTest`).
3. GitHub Desktop will say it's not a repository. Click **create a repository**
   in the dialog → name `meal-planner` → **Create Repository**.
4. Top bar → **Publish repository**. Unchecking "Keep this code private" is
   fine (makes no difference to how it works), but private also works on
   GitHub Pages.

---

## Part C — Enable GitHub Pages

1. On github.com, open your `meal-planner` repo.
2. **Settings** → left menu **Pages**.
3. Source: **Deploy from a branch**. Branch: `main`. Folder: `/ (root)` →
   **Save**.
4. Wait ~1 minute, then refresh the page. You'll see
   **Your site is live at `https://<your-username>.github.io/meal-planner/`**.
5. Open that URL in a browser. The meal planner should load. (It will say
   "Connect Google Drive" in the sidebar — we're about to make that work.)

### C1. Verify the OAuth origin matches

Go back to https://console.cloud.google.com/ → **Credentials** → click your
`Meal Planner Web` client → check the **Authorized JavaScript origins** list
has exactly `https://<your-username>.github.io` (origin only, no path).

If wrong, edit, save, and **wait 5 full minutes** for Google to propagate the
change. Then hard-refresh the meal-planner page (**Ctrl+Shift+R**).

---

## Part D — Sign in and start syncing

1. Open the meal-planner at your `*.github.io/meal-planner/` URL.
2. Sidebar footer → click **Connect Google Drive**.
3. A Google popup appears. Sign in with the account you configured as a test
   user in A3.
4. You'll see a warning that says "This app isn't verified". **This is
   expected.** Click **Advanced → Go to Meal Planner (unsafe)**. It's only
   "unsafe" because you haven't gone through Google's app-verification
   process, which isn't needed for personal use.
5. Grant the `drive.appdata` permission. The popup closes.
6. Sidebar pill changes to **✓ Synced**. Your current data has been uploaded
   to your Drive's hidden app-data folder.
7. Open the same URL on another device, sign in with the same Google account,
   and the data appears.

---

## Troubleshooting

**"redirect_uri_mismatch" or "idpiframe_initialization_failed" on sign-in**
Your Authorized JavaScript origin doesn't match the URL you're visiting.
Compare them character-for-character. Common traps:
- Using `https://user.github.io/meal-planner/` (with path) instead of
  `https://user.github.io` (origin only) in the Google Cloud allowlist.
- Trailing slash in the allowlist — remove it.
- Just saved the change and tried immediately — wait 5 full minutes and
  hard-refresh (Ctrl+Shift+R).

**"This app isn't verified" warning**
Normal — see Part D step 4. Click Advanced → proceed.

**"Connect Google Drive" button does nothing**
Check the browser console (F12 → Console tab). If you see a message about
`PASTE-YOUR-CLIENT-ID`, you didn't paste the real ID into `src/config.js`.

**Sidebar pill stuck on "Syncing…"**
Likely a network issue or the Drive API isn't enabled. Check Part A2. The
app keeps retrying; check DevTools → Network for failing requests.

**Data doesn't appear on the second device**
- Confirm you signed in with the **same** Google account on both devices.
- Refresh the page on device 2 — sync only runs at page load, not
  continuously.

**I edited `src/config.js` but GitHub Pages still shows the old version**
GitHub Pages caches aggressively. After pushing (GitHub Desktop → Commit →
Push), wait ~2 minutes, then hard-refresh (Ctrl+Shift+R). If still stale,
check the Actions tab in your repo for the Pages build status.

---

## How it works (brief)

- All your meal-planner data lives in `localStorage` on each device, just
  like before — the app keeps working offline.
- When signed in, every change is also written (with a 2-second debounce) to
  a single JSON file in your Drive's hidden `appDataFolder`. That folder is
  invisible in the normal Drive UI — it's just for this app.
- On each page load, the app checks Drive's last-modified timestamp. If
  Drive is newer than your local copy, it downloads and replaces. If local
  is newer, it uploads.
- If you edit on two devices without reloading in between, the later save
  catches it via a version check and prompts you to resolve the conflict.

The data stays private to you: only someone signed in to your Google account
can see this file, and the `drive.appdata` scope means even *other* apps
can't.
