# Next NBA

An independent NBA web application built with Next.js 16, TypeScript, React 19 and Tailwind CSS 4.

## Requirements

- Node.js 24 (see `.nvmrc`) and npm
- A BALLDONTLIE API key to display real schedules and scores

## Getting started

```bash
git clone https://github.com/justinangeloperez327/next-nba.git
cd next-nba
npm ci
cp .env.example .env.local
# Edit .env.local and set BALLDONTLIE_API_KEY=your-key
npm run dev
```

Open http://localhost:3000. The API key is kept server-side and is never sent to the browser.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Check TypeScript |
| `npm test` | Run Node.js 24 tests |

## Implemented

- Responsive home page including a current NBA-day slate (up to 3 games).
- NBA games dashboard at `/games` with previous/next day buttons, date picker and Today navigation; shareable `/games?date=YYYY-MM-DD` URLs.
- Scheduled, in-progress, final, postponed, and other provider-supplied states, with correct nullable scores.
- Browser-local tip-off time after hydration; NBA calendar grouping follows Eastern Time.
- Loading placeholders, retry on errors, empty-date messaging and manual Refresh.
- Directory of 30 NBA teams.
- Server-side BALLDONTLIE adapter exposing `/api/games?date=YYYY-MM-DD` and `/api/teams`, validated with Zod.
- Node.js 24 GitHub Actions validation: reproducible `npm ci`, lint, typecheck, unit tests and production build.

**No fabricated scores:** If an API key is missing or the feed fails, pages show an error rather than invented data. Scores are fetched on page entry and date navigation, and may be refreshed manually; **automatic polling is not implemented yet**.

## Remaining groups

1. ~~Repository hardening~~
2. ~~NBA API integration~~
3. ~~Games dashboard~~
4. Live-score refresh, shared caching and quota protection
5. UI completion
6. Testing, security and release readiness

See [NBA API documentation](docs/nba-api.md). This project is independent and not affiliated with or endorsed by the NBA. Validate public data redistribution and logo/trademark rights before launching.
