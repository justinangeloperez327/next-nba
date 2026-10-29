# Next NBA

An independent NBA web app built with Next.js 16, TypeScript, React 19 and Tailwind CSS 4.

## Requirements

- Node.js 24 and npm (see `.nvmrc`)
- BALLDONTLIE API key for real data; CI/test suite uses mocks without a key.

## Getting started

```bash
git clone https://github.com/justinangeloperez327/next-nba.git
cd next-nba
npm ci
cp .env.example .env.local
# Add BALLDONTLIE_API_KEY=your-key to .env.local
npm run dev
```

Open http://localhost:3000.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript checking |
| `npm test` | Node.js automated tests |

## Current functionality

- Responsive starter page, NBA team directory, games and standings placeholders.
- BALLDONTLIE server-only integration with typed/validated game and team data.
- `GET /api/games?date=YYYY-MM-DD` and `GET /api/teams` endpoints.
- API errors, pagination, input validation and CDN cache headers.
- Node.js 24 GitHub Actions checks for lint, type-check, tests and build.

The frontend does **not** yet display live NBA data. Connecting schedules and results to the UI is Group 3. Live refresh and quota-aware caching will be introduced in Group 4.

See [API integration details](docs/nba-api.md) for environment setup, API shape, and limitations.

## Roadmap

1. ~~Repository hardening and deterministic CI~~
2. ~~NBA API integration~~
3. Games dashboard and schedule navigation
4. Live-score engine, shared caching and quota protection
5. UI completion
6. Testing, security and release readiness

This project is independent and not affiliated with or endorsed by the NBA. Verify publication rights before public launch.
