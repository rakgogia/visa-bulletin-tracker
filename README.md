# 🇮🇳 India Visa Bulletin Tracker

Track employment-based (EB) visa bulletin movements for India — filing dates, final action dates, and month-over-month movement analysis.

**Live:** [visa-bulletin-tracker-hrshc6maja-uw.a.run.app](https://visa-bulletin-tracker-hrshc6maja-uw.a.run.app)

## Features

- **EB1 / EB2 / EB3 / EB5** category tabs
- Current and upcoming bulletin filing dates & final action dates
- Movement analysis — shows how many days dates moved forward or backward
- Data scraped live from the [U.S. Department of State Visa Bulletin](https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin.html)

## Tech Stack

- **Backend:** Node.js + Express
- **Scraping:** Cheerio
- **Frontend:** Vanilla HTML/CSS/JS
- **Hosting:** Google Cloud Run
- **CI/CD:** GitHub Actions → Cloud Run on every push to `master`

## Getting Started

### Prerequisites

- Node.js ≥ 18

### Install & Run

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

For development with auto-reload:

```bash
npm run dev
```

## API

### `GET /api/visa-bulletin`

Returns JSON with current and upcoming bulletin data for all EB categories:

```json
{
  "current": {
    "month": "February 2026",
    "date": "15AUG14",
    "finalActionDate": "15NOV13",
    "eb2FilingDate": "01DEC13",
    "eb2FinalActionDate": "15JUL13",
    "eb1FilingDate": "01AUG23",
    "eb1FinalActionDate": "01FEB23",
    "eb5FilingDate": "01MAY24",
    "eb5FinalActionDate": "01MAY22",
    "url": "https://travel.state.gov/..."
  },
  "upcoming": { ... },
  "movement": { "days": 0, "direction": "forward", "description": "..." },
  ...
}
```

## Deployment

### Manual

```bash
gcloud run deploy visa-bulletin-tracker \
  --source . \
  --region us-west1 \
  --allow-unauthenticated \
  --port 3000
```

### Automatic (CI/CD)

Every push to `master` triggers a GitHub Actions workflow that deploys to Cloud Run via Workload Identity Federation (keyless auth).

See [.github/workflows/deploy.yml](.github/workflows/deploy.yml).

## License

MIT
