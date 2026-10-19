# Calendar files (.ics)

The calendar page (`/calendar`) has two file-based actions that need no accounts,
no API keys, and no Google Cloud project:

1. **Export** — download the exam date and every assignment deadline as an
   `.ics` file (iCalendar, RFC 5545) and import it into any calendar app.
2. **Import** — upload an `.ics` exported from another calendar to overlay those
   events on the course month view and in "Next up".

If you already have Google credentials set up, the [Google Calendar
integration](GOOGLE-CALENDAR.md) still works alongside this. Nothing here
requires it.

---

## Export: getting your deadlines into Proton Calendar

1. Open `/calendar`.
2. Click **Download .ics** in the "Calendar files (.ics)" card. You get
   `<course>-deadlines-YYYYMMDD.ics`.
3. In Proton: **Settings → All settings → Import/export → Import from ICS**,
   pick the file, choose the calendar to import into, and click Import.

Every event is an all-day event with popup reminders 1 day and 1 hour before.

**Re-importing updates instead of duplicating.** Each event carries a UID that is
stable for a given profile, course, and deadline
(`assignment-<id>@<profile>.<course>.study-app.local`). Proton matches on UID, so
downloading again after you move the exam date and importing the new file
updates the existing events.

The export honors the same schedule as the rest of the app: the exam date from
`course_meta` plus per-assignment due-date overrides.

### Other apps

The file is plain iCalendar, so the same steps work in Apple Calendar
(_File → Import_), Thunderbird, Outlook, and Google Calendar
(_Settings → Import & export_).

### Subscribing instead of importing

Clients that support a calendar URL (Proton: **Other calendars → Add calendar
from URL**, Thunderbird, Apple) can subscribe to
`https://<your-host>/api/calendar/export.ics`. Two caveats:

- The scope comes from the `profile_id` / `course_id` cookies, and an external
  calendar server sends none, so a subscription always resolves to the **default
  profile and course**.
- The host has to be reachable from the calendar provider's servers. A Pi on
  Tailscale is not, so download-and-import is the path there.

## Import: seeing your own calendar here

1. Export an `.ics` from your calendar app (Proton: **Settings → All settings →
   Import/export → Export**, pick the calendar, **Download ICS**).
2. On `/calendar`, click **Import .ics** and choose the file.

The imported events appear as brass dots on the month grid and in the day panel
under "Your calendar", labeled with the file name. **Show imported events**
toggles them; **Remove import** deletes the copy from the app (your real
calendar is never touched).

Import is one calendar per profile + course — importing again replaces the
previous file. Limits: 4 MB, 5,000 events, and duplicate UIDs collapse to the
first occurrence. Events without a start date are skipped and counted in the
confirmation message.

### Two things the deployed app needs

**1. The `calendar_imports` table — automatic.** The server applies the schema
itself at startup (`hooks.server.ts` → `applyPgSchema`, every statement
`CREATE ... IF NOT EXISTS`), so a deploy creates any new table without a manual
step. Nothing to run.

**2. `BODY_SIZE_LIMIT`.** `adapter-node` refuses request bodies over it, and it
defaults to **512 KB** — below the 4 MB import cap, so a large calendar would fail
with a "too large for the server to accept" error. Set it where the production
server runs:

```bash
BODY_SIZE_LIMIT=6M
```

The Dockerfile sets this for Railway and container deployments; on the Pi add it to
the systemd unit (see [GOOGLE-CALENDAR.md](GOOGLE-CALENDAR.md) for the unit file).
`npm run dev` is unaffected.

## How it fits together

| Piece                                      | File                                                    |
| ------------------------------------------ | ------------------------------------------------------- |
| iCalendar serialize/parse                  | `src/lib/server/ics.ts`                                 |
| Deadline planning + the shared event shape | `src/lib/server/calendar-events.ts`                     |
| Export/import service                      | `src/lib/server/calendar-files.ts`                      |
| `GET /api/calendar/export.ics`             | `src/routes/api/calendar/export.ics/+server.ts`         |
| `GET`/`POST`/`DELETE /api/calendar/import` | `src/routes/api/calendar/import/+server.ts`             |
| Stored import                              | `calendar_imports` table (one row per profile + course) |

`planDeadlineEvents` is the single source of truth for "what are this course's
deadlines" — the Google push and the `.ics` export both build on it, so a
deadline can never disagree between them.
