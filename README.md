# Next NBA

A lightweight, independent NBA scoreboard, schedule, and team directory powered by Next.js 16, React 19, TypeScript, and Tailwind CSS 4.

## Local setup

Node.js 24 and npm are required.

```bash
git clone https://github.com/justinangeloperez327/next-nba.git
cd next-nba
npm ci
cp .env.example .env.local
# Set NBA_DATA_PROVIDER and the matching server-side API key
npm run dev
```

**Choose the provider through the server environment**:

- `NBA_DATA_PROVIDER=balldontlie` (default) plus `BALLDONTLIE_API_KEY`.
- `NBA_DATA_PROVIDER=api-nba` plus `API_NBA_KEY` and `API_NBA_PLAN=free`.
- With a real paid API-NBA subscription you can set `API_NBA_PLAN=pro`.

Never use `NEXT_PUBLIC_` for secrets. The provider is server-selected, not visitor-selectable. Changes require server restart or a new deployment. There is no automatic cross-provider fallback.

See [API-NBA setup](docs/api-nba.md).

## Features

- Responsive homepage prioritizing live games, conference/team directory and daily scoreboard.
- `/games` with date navigation, team schedules and status filters.
- BALLDONTLIE and API-NBA adapters sharing one normalized data contract.
- Provider-aware caching, in-process request coalescing and instance-local quota protection.
- Error sanitization, stale-score reporting, accessibility and mobile support.
- Node.js 24 CI: dependency audit, lint, TypeScript, unit tests, production build, Playwright and axe accessibility.

## Important limits

- Real data requires the relevant API key; CI exercises mocks, not live API calls.
- **API-NBA Free** allows 100 requests per UTC day. One NBA Eastern day requires two UTC-date requests; the default API-NBA free scoreboard cache is therefore at least **one hour**. Paid mode uses at least 60 seconds and requires a valid paid plan.
- In-memory quota guards are **not global** across serverless instances, regions or cold starts. Use shared quota enforcement before high-traffic public deployment.
- API-NBA terms do **not** grant permission to publish third-party league data. Verify required NBA rights before a public launch.
- Standings and player-stats UI remain separate future work; no licensed logos or fake scores have been introduced.

## Development checks

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

See [API-NBA](docs/api-nba.md), [live-score cache](docs/live-scores.md), [release checklist](docs/release-readiness.md), and [security policy](SECURITY.md).

Next NBA is an independent project and is not affiliated with or endorsed by the NBA.
