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

## Part E — Automatic daily price refresh (optional, ~15 min)

This is the setup for the **Refresh prices** GitHub Action that runs
`pipeline/downloader.py` → `build_prices_index.py` → `upload_to_drive.py` on
GitHub's runners. It refreshes the on-site catalog (via a commit) and also
uploads the JSONs to a shared Google Drive folder so the Developer page's
"Run refresh now" button can hot-reload the running app without waiting for
GitHub Pages to rebuild.

After this part, prices refresh:
- Automatically every day at 04:00 UTC.
- On demand when you click **Run refresh now** on `#/developer`.

### E1. Create the Drive folder

1. drive.google.com → **New** → **Folder** → name it `meal-planner-prices`.
2. Open the folder. Copy the ID from the URL — everything after
   `/folders/`. You'll paste this twice below.
3. Right-click the folder → **Share** → **General access** → set to
   **Anyone with the link**, role **Viewer**. This is what lets the web app
   fetch the catalog with just an API key (no user sign-in).

### E2. Create a service account for the GitHub Action

The Action needs credentials to *write* into the folder. A service account
(a robot Google account) is the right fit.

1. https://console.cloud.google.com/ → select your `meal-planner` project
   (same one from Part A) → **APIs & Services** → **Credentials**.
2. **Create Credentials** → **Service account**.
3. Name it `meal-planner-prices-uploader`. Skip the optional role step.
   **Done**.
4. Open the new service account → **Keys** tab → **Add Key** →
   **Create new key** → **JSON** → **Create**. A `.json` file downloads.
   Keep it — you'll paste its contents into a GitHub secret below. Do NOT
   commit it anywhere.
5. Copy the service account's email (looks like
   `meal-planner-prices-uploader@your-project.iam.gserviceaccount.com`).
6. Back in Drive: right-click the `meal-planner-prices` folder → **Share**
   → paste that email → role **Editor** → **Send**. (Ignore Drive's warning
   about sending to an external address.)

### E3. Create a browser API key

Used by the web app to *read* the folder without a login.

1. Back in **APIs & Services** → **Credentials** → **Create Credentials**
   → **API key**. Copy the key.
2. Click the new key → **Application restrictions** → **HTTP referrers** →
   add these URLs one per line (replace the last one with your actual site):
   ```
   http://localhost:8080/*
   http://127.0.0.1:8080/*
   https://<your-username>.github.io/*
   ```
3. **API restrictions** → **Restrict key** → tick **Google Drive API** →
   **Save**.

### E4. Paste both values into `src/config.js`

```js
export const DRIVE_CATALOG_FOLDER_ID = 'FOLDER_ID_FROM_E1';
export const GOOGLE_API_KEY           = 'API_KEY_FROM_E3';
```

While you're there, if your repo is not `MoD-Lumb/meal-planner`, update
`GITHUB_REPO` to match your fork.

### E5. Add the GitHub secrets

1. github.com → open your `meal-planner` repo → **Settings** → **Secrets
   and variables** → **Actions** → **New repository secret**.
2. Create **`DRIVE_FOLDER_ID`** — paste the folder ID from E1.
3. Create **`DRIVE_SA_JSON`** — open the `.json` file from E2 in a text
   editor, copy the **entire file contents**, paste into the secret value.

### E6. Allow the Action to push commits

1. Same **Settings** page → **Actions** → **General** → scroll to
   **Workflow permissions** → select **Read and write permissions** →
   **Save**. This lets the workflow commit the refreshed catalog back to
   `main` (which triggers a GitHub Pages rebuild).

### E7. (Optional) Create a fine-grained PAT for the "Run refresh now" button

Only needed if you want the on-demand button in the web app. The
scheduled daily run works without this.

1. https://github.com/settings/personal-access-tokens/new
2. Token name: `meal-planner-dispatch`. Expiration: 90 days (or longer).
3. **Repository access** → **Only select repositories** → choose your
   `meal-planner` repo.
4. **Repository permissions** → **Actions** → **Read and write**. Leave
   everything else at No access.
5. **Generate token**. Copy the `github_pat_...` value.
6. In the live app open `#/developer`, paste the PAT into the GitHub card,
   click **Save**. Stored in that browser's localStorage.

### E8. Verify it works

1. Commit and push the `.github/workflows/refresh-prices.yml`, `pipeline/`,
   `.gitignore`, and the updated `src/config.js`/`src/pages/developer.js`.
2. On github.com → **Actions** tab → **Refresh prices** → **Run workflow**
   → **Run workflow**. Watch the run — it should take 2–4 minutes.
3. After it finishes: Drive folder should have 18 JSONs updated to today's
   modifiedTime. The repo should have a new commit from
   `github-actions[bot]` touching `data/prices/`.
4. Open `https://<your-username>.github.io/meal-planner/#/developer`.
   - Click **Refresh from Drive (skip GitHub run)** — should load the
     catalog, spot-check `#/prices` for a known product.
   - If you set up the PAT, click **Run refresh now** — dispatches the
     workflow, polls to completion, then auto-loads the Drive catalog.
     First full cycle takes ~3 min.

### E9. Troubleshooting

**Action fails at "Upload to Drive" with 403**
The service account can't write to the folder. Double-check E2 step 6 —
the folder must be shared with the service account's email as Editor.

**Action fails at "Commit updated catalog" with "Permission denied"**
Workflow permissions aren't set to Read and write (E6). Fix and re-run.

**"Run refresh now" button errors with "HTTP 401" or "Bad credentials"**
PAT is missing, expired, or doesn't grant Actions: R/W on this repo.
Regenerate per E7 and click **Clear** then **Save** in the PAT card.

**"Run refresh now" errors with "HTTP 404"**
Your `GITHUB_REPO` in `src/config.js` doesn't match the actual repo, or
the workflow file hasn't been pushed yet. Verify both.

**Drive folder shows 0 files after a successful Action**
`DRIVE_FOLDER_ID` secret is wrong, or the folder was shared with the
wrong service account. Check E2 step 5 and E5 step 2.

**Prices on the live site don't update after the Action runs**
Two separate paths: (a) Drive is updated instantly — the Developer page
sees it via "Refresh from Drive". (b) The committed fallback under
`data/prices/` triggers a GitHub Pages rebuild (~1–2 min after push).
Hard-refresh after waiting.

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
