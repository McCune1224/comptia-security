# Google Calendar integration

The calendar page (`/calendar`) does two things with your Google account:

1. **Reads your real events** — your visible Google calendars are merged into the
   month view (indigo dots + a day-panel list) and into "Next up".
2. **Pushes course deadlines** — a "Sync now" button creates the exam date and every
   assignment deadline as all-day events in a dedicated **"Security+ Prep"** calendar,
   with popup reminders 1 day and 1 hour before. Re-syncing updates or removes events
   as your schedule changes (e.g. when you move the exam date on the Syllabus page).

This is a single-user personal app: the OAuth token is stored in `data/quiz.db`
(`google_oauth` table), and synced events are tracked in `google_synced_events` so
re-syncs never duplicate.

---

## One-time setup (~10 minutes, in Google Cloud Console)

1. **Create a project** (or reuse one):
   <https://console.cloud.google.com/projectselector2/home/dashboard>

2. **Enable the Google Calendar API**:
   <https://console.cloud.google.com/apis/library/calendar.googleapis.com>
   → enable for the project above.

3. **Create an OAuth client** (Web application):
   <https://console.cloud.google.com/apis/credentials>
   → Create credentials → OAuth client ID → Application type: **Web application**.
   Give it a name like "Security+ app".

4. **Add authorized redirect URIs.** You can register several; add the ones you use:
   - Dev on this machine:
     `http://localhost:5173/api/calendar/google/callback`
   - The Raspberry Pi over Tailscale (see HTTPS note below):
     `https://<your-pi>.<your-tailnet>.ts.net/api/calendar/google/callback`

5. **Add yourself as a test user** (the app stays in "Testing" mode — fine for a
   personal app; no verification needed):
   <https://console.cloud.google.com/auth/audience>
   → Test users → Add users → your Google account.

6. **Download the client JSON** (Credentials → your client → download icon).
   The `client_id` and `client_secret` go into `web/.env`:

   ```bash
   # web/.env  (gitignored — never commit this)
   GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-xxxx
   ```

   Copy from `web/.env.example` to start.

## HTTPS note (Raspberry Pi / Tailscale)

Google only accepts **HTTPS** redirect URIs — the only exception is `localhost`.
Your Pi is reachable at `http://<pi-hostname>.<tailnet>.ts.net` (plain HTTP), which
Google will reject. Fix: run **Tailscale Serve** on the Pi so the app gets a real
HTTPS URL:

```bash
sudo tailscale serve --bg 3000   # if the app listens on port 3000
```

Then open the app at `https://<pi-hostname>.<tailnet>.ts.net` and register that
origin's callback as a redirect URI (step 4). No cert management — Tailscale
provisions it automatically.

## Running the app with credentials

- **Dev:** `npm run dev` — Vite loads `web/.env` automatically; connect at
  `http://localhost:5173/calendar`.
- **Pi (adapter-node build):** set the env vars where the service runs, e.g. a
  systemd unit:

  ```ini
  Environment=GOOGLE_CLIENT_ID=...
  Environment=GOOGLE_CLIENT_SECRET=...
  Environment=PORT=3000
  ```

  or `node --env-file=.env build`.

## Day-to-day

- **Connect:** `/calendar` → "Connect Google Calendar" → consent → you land back on
  the calendar with deadlines pushed automatically.
- **Sync again** after changing the exam date or when assignments change → "Sync now".
  It only touches the "Security+ Prep" calendar; your other events are never modified.
- **Show/hide** your Google events in the month view with the "Show Google events" toggle.
- **Disconnect** (calendar page) removes the token locally. Events already in Google
  stay; delete the "Security+ Prep" calendar there if you want them gone.
- **Revoke fully:** <https://myaccount.google.com/permissions> → remove the app, then
  disconnect in the app.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `redirect_uri_mismatch` | The redirect URI in `GOOGLE_REDIRECT_URI` / the URL you're browsing on isn't registered in step 4. Register the exact origin you connect from. |
| `Error 403: access_denied` | You're not a test user — add the account at <https://console.cloud.google.com/auth/audience>. |
| `access_type=offline` returns no refresh token | Revoke at <https://myaccount.google.com/permissions>, reconnect with the consent screen (we force `prompt=consent` so this shouldn't happen). |
| `Calendar API has not been used` | Enable the Calendar API (step 2) for the project that owns the client ID. |
| Token refresh failing | Reconnect: Disconnect on the calendar page, then Connect again. |
