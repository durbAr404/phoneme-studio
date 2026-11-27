# Architecture

## Layout

```
apps/
  api/                 FastAPI service (Python 3.13)
    app/
      main.py          app factory, middleware order, routers
      config.py        settings from environment
      models.py        SQLAlchemy tables
      schemas.py       Pydantic request models (limits are security boundaries)
      phonemes.py      HCE inventory, validation, Wordle scoring
      security/        CSRF and header middleware, rate limits, IP hashing, session helpers
      observability/   JSON logging, request ID and metrics middleware, Sentry
      services/        daily challenge, save codes, alerts, site settings
      routers/         public (library, gallery, config), play (shares, plays, saves), daily, ops (health, cleanup)
      seed.py          word library and official games
    alembic/           migrations
    tests/             pytest (security, API, engine)
  web/                 Next.js 15 app
    app/(site)/        pages with the navbar: home, play, create, library, sounds, about, settings, my activities
    app/(bare)/        full-screen pages: play screens, shared links, classroom, print
    components/        ui kit, site shell, games, builder
    lib/               API client, local workspace store, preferences, game engine, offline export
    middleware.ts      CSP nonce and security headers
    tests/             Vitest unit tests, Playwright end-to-end and axe accessibility tests
```

## Request flow

1. The browser requests a page from Next.js. Middleware creates a CSP nonce and sets security headers.
2. Server components fetch public data (gallery, shared games) from FastAPI directly, with Next.js caching and a short timeout so a sleeping API never leaves a page hanging.
3. Client components call `/api/...` on the same origin. A Next.js rewrite forwards the call to FastAPI, so there's no CORS setup.
4. FastAPI middleware runs from the outside in: observability (request ID, timing, error capture), then CSRF, then security headers. Route dependencies then apply rate limits, and Pydantic models validate the body.

## Data model

| Table | Purpose |
| --- | --- |
| `words`, `word_lists`, `word_list_items` | Official library |
| `activities`, `activity_versions` | Official games shown in the gallery |
| `shares` | Immutable snapshot behind each share link |
| `plays` | Results (anonymous player ID, optional nickname); deleted after 90 days |
| `save_codes` | Device-to-device sync without an account; updates need a secret edit token |
| `request_metrics`, `error_events`, `web_vitals` | Observability data |
| `site_settings` | Feature switches and the maintenance banner |

The schema also has tables for optional features that are off on the public site.

## Why snapshots

A share link stores a copy of the game, not a reference. A teacher can edit or delete their copy without breaking a link a class is already using.

## Saving progress without accounts

| Who | Where it's saved |
| --- | --- |
| Visitor | `localStorage` (games, custom words, stars, daily streak), plus an optional backup file |
| Visitor on two devices | Save code: a server-side JSON blob found by a readable code, readable by anyone with the code, writable only with the edit token kept on the creating device |

## The daily challenge

The daily word has to be the same for everyone, change at midnight, and work without a scheduled job. Days since 1 January 2026 index into the word list after a seeded shuffle. When the list runs out it reshuffles with a new seed, so no word repeats within a cycle and the order can't be guessed. The browser sends its local date, and the server accepts it if it's within a day of server time, so midnight works in every timezone. The answer is checked on the server and only revealed when the game is over.

## Optional showcase features

Sign-in, the admin dashboard, teacher accounts and their read-only demos are kept in separate folders (`apps/api/app/showcase`, `apps/web/app/(showcase)`) that the app detects when it starts or builds. Without them, the API doesn't register those routes and the site shows no links to them, so the public game site builds, runs and passes its tests on its own.
