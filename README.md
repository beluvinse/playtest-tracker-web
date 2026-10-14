# playtest-tracker-web

[![CI](https://github.com/beluvinse/playtest-tracker-web/actions/workflows/ci.yml/badge.svg)](https://github.com/beluvinse/playtest-tracker-web/actions/workflows/ci.yml)

Frontend for [PlaytestTracker.Api](https://github.com/beluvinse/playtest-tracker-api): a web app to browse projects and manage the bugs found during game playtests.

Built with React, TypeScript and Vite.

## Live demo

**https://beluvinse.github.io/playtest-tracker-web/**

The login page has a panel with demo accounts: pick one to look around an example studio without creating an account.

> The API runs on a free plan that goes to sleep after 15 minutes without visits. If nobody has opened the app for a while, the first request can take about a minute while it wakes up. After that it answers normally.

| Piece | Where it runs |
| --- | --- |
| This frontend | GitHub Pages (static files) |
| [The API](https://github.com/beluvinse/playtest-tracker-api) | Render (Docker container) |
| Database | Neon (PostgreSQL) |

## Getting started

**Requirements**
- [Node.js](https://nodejs.org/) 20 or newer
- PlaytestTracker.Api running locally on `http://localhost:5185` (see its README)

**Run it**

```bash
npm install
npm run dev
```

Then open `http://localhost:5173`.

## Deploy (GitHub Pages)

`.github/workflows/deploy.yml` builds the app and publishes it on GitHub Pages every time something lands on `main`. One-time setup in the repository's **Settings**:

1. **Pages** > Source: **GitHub Actions**.
2. **Secrets and variables > Actions > Variables**: add `API_URL` with the address of the deployed API (not a secret: it is visible in the browser anyway).

Because the site lives at `https://<user>.github.io/<repository>/`, the build uses that folder as its `base` (`BASE_PATH` in `vite.config.ts`) and the router uses it as its `basename`. GitHub Pages doesn't know the app's pages, so the workflow copies `index.html` to `404.html`: opening or reloading an address like `/projects/3` starts the app, which then shows the right screen.
