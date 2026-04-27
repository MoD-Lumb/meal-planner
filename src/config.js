// Google OAuth 2.0 Web Client ID.
// This is a PUBLIC value (safe to commit). The real security boundary is the
// "Authorized JavaScript origins" list configured in Google Cloud Console.
// See SETUP.md in the repo root for how to create one.
export const GOOGLE_CLIENT_ID = '309604007549-d3isgibfcms4u6vf2442pm3i07gsb559.apps.googleusercontent.com';

// Name of the single JSON blob stored in the user's Drive appDataFolder.
export const DRIVE_DATA_FILENAME = 'meal-planner-data.json';

// Shared Drive folder that holds today's price catalog JSONs, uploaded by
// upload_to_drive.py. Set by running that script once — it prints the ID on
// folder creation. Read in-browser via the Drive REST API + API key below.
export const DRIVE_CATALOG_FOLDER_ID = '1lij9RURIrSS--AvEyn1oR-4a3lZDxZ1s';

// Browser-safe Drive API key. Restrict in Google Cloud Console to:
//   - HTTP referrers: http://localhost:8080/*, http://127.0.0.1:8080/*,
//                     https://mod-lumb.github.io/*
//   - API: Google Drive API only
// The key is necessarily public (ships in this file); restrictions are the
// real security boundary.
export const GOOGLE_API_KEY = 'AIzaSyDOrYyWNxeViJopTK6e20gQrcep7bMGs9M';

// GitHub repository that hosts the refresh-prices workflow. Used by the
// Developer page's "Run refresh now" button to trigger workflow_dispatch.
export const GITHUB_REPO = 'MoD-Lumb/meal-planner';
export const GITHUB_WORKFLOW_FILE = 'refresh-prices.yml';
export const GITHUB_BRANCH = 'main';
