# 🇮🇳 India Visa Bulletin Tracker

Track employment-based (EB) visa bulletin movements for India — filing dates, final action dates, and month-over-month movement analysis.

**Live:** [visa-bulletin-tracker-hrshc6maja-uw.a.run.app](https://visa-bulletin-tracker-hrshc6maja-uw.a.run.app)

## Features

- **EB1 / EB2 / EB3 / EB5** category tabs
- Current vs. upcoming bulletin comparison (with automatic fallback to previous vs. current when next month's data isn't published yet)
- Filing dates & final action dates for each category
- Movement analysis — shows how many days dates moved forward or backward
- Latest deployment info pulled from the GitHub API
- Mobile-responsive layout
- Data scraped live from the [U.S. Department of State Visa Bulletin](https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin.html)

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Node.js + Express |
| **Scraping** | Cheerio |
| **Frontend** | React 18 + Vite 5 |
| **Testing** | Jest (54 server-side tests) |
| **Hosting** | Google Cloud Run |
| **CI/CD** | GitHub Actions → Cloud Run on every push to `master` |

## Project Structure

```
├── server.js                  # Express API + static file serving
├── server.test.js             # Jest test suite
├── package.json               # Root dependencies & scripts
├── client/                    # React frontend (Vite)
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx           # Entry point
│       ├── App.jsx            # Root component
│       ├── api.js             # API fetch helpers
│       ├── config.js          # Category configuration
│       ├── utils.js           # Formatting utilities
│       ├── styles.css         # All styles + responsive breakpoints
│       └── components/
│           ├── BulletinCard.jsx
│           ├── BulletinSection.jsx
│           ├── CategoryTabs.jsx
│           ├── CommitInfo.jsx
│           ├── InfoSection.jsx
│           └── MovementAnalysis.jsx
├── public_build/              # Vite build output (gitignored)
└── .github/workflows/
    └── deploy.yml             # CI/CD pipeline
```

## Getting Started

### Prerequisites

- Node.js ≥ 18

### Install & Run

```bash
npm install
npm run build            # installs client deps + builds React app
npm start                # serves on http://localhost:3000
```

### Development

Run the backend and frontend dev servers separately:

```bash
# Terminal 1 — Express API with auto-reload
npm run dev

# Terminal 2 — Vite dev server with HMR (proxies /api → localhost:3000)
npm run dev:client
```

The Vite dev server runs on `http://localhost:5173` and proxies API requests to the Express server.

### Testing

```bash
npm test
```

Runs 54 tests covering `parseDate`, `calculateMovement`, `getComparisonMonths`, `isBulletinAvailable`, `buildMovements`, helpers, fallback logic, and edge cases.

## API

### `GET /api/visa-bulletin`

Returns bulletin data for two months plus movement analysis for all EB categories.

When the upcoming month's bulletin is available, compares **current → upcoming**. When it's not yet published, falls back to **previous → current**.

```json
{
  "current": {
    "month": "February 2026",
    "date": "15AUG14",
    "finalActionDate": "15NOV13",
    "eb1FilingDate": "01AUG23",
    "eb1FinalActionDate": "01FEB23",
    "eb2FilingDate": "01DEC13",
    "eb2FinalActionDate": "15JUL13",
    "eb5FilingDate": "01MAY24",
    "eb5FinalActionDate": "01MAY22",
    "url": "https://travel.state.gov/..."
  },
  "upcoming": { "..." },
  "comparisonMode": "current-to-upcoming",
  "movement": { "days": 30, "direction": "forward", "description": "Moved forward 30 days" },
  "finalActionMovement": { "..." },
  "eb1Movement": { "..." },
  "eb2Movement": { "..." },
  "eb5Movement": { "..." },
  "lastUpdated": "2026-02-20T12:00:00.000Z"
}
```

### `GET /api/commit-info`

Returns the latest commit from the GitHub repository.

```json
{
  "sha": "a1b2c3d",
  "fullSha": "a1b2c3d...",
  "message": "Fix mobile card layout",
  "author": "rakgogia",
  "date": "2026-02-20T10:00:00Z",
  "url": "https://github.com/rakgogia/visa-bulletin-tracker/commit/..."
}
```

## Deployment

### Automatic (CI/CD)

Every push to `master` triggers a GitHub Actions workflow that deploys to Cloud Run via Workload Identity Federation (keyless auth). Markdown, `.gitignore`, and `LICENSE` changes are skipped.

See [.github/workflows/deploy.yml](.github/workflows/deploy.yml).

### Manual

```bash
gcloud run deploy visa-bulletin-tracker \
  --source . \
  --region us-west1 \
  --allow-unauthenticated \
  --port 3000 \
  --project visa-bulletin-tracker-12629
```

## License

MIT
