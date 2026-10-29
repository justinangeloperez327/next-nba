# Next NBA

An independent NBA scoreboard and schedule web app built with Next.js 16, TypeScript, React 19 and Tailwind CSS 4.

## Start locally

Requirements: Node.js 24, npm, and a BALLDONTLIE NBA API key.

```bash
git clone https://github.com/justinangeloperez327/next-nba.git
cd next-nba
npm ci
cp .env.example .env.local
# Put BALLDONTLIE_API_KEY=your-key in .env.local
npm run dev
```

Open http://localhost:3000. Never prefix the API key with `NEXT_PUBLIC_`.

## Available features

- Homepage displaying today's NBA slate (up to three games).
- Games dashboard at `/games`, shareable `?date=YYYY-MM-DD`, date navigation, local tip-off times, current game status and scores.
- Automatic game-aware refresh; pauses for hidden tabs/offline and resumes when back online.
- Last-known scores with stale indicators on transient provider failure.
- Server-side response caching, in-process in-flight request deduplication, and a local upstream rate budget.
- NBA team directory, and placeholder standings page.
- Server-only BALLDONTLIE integration with validated, normalized responses.
- Node.js 24 CI with `npm ci`, lint, type-check, tests and production build.

## Important deployment limitation

BALLDONTLIE Free permits **5 upstream requests per minute per API key**. The app deliberately limits each live server runtime to 4 upstream requests/minute, and sets shared CDN caching headers. On a multi-instance/serverless deployment, those instance-local budgets **do not combine into a globally enforced five-request limit**. CDN caching is regional and best effort. For significant public traffic, use a centrally coordinated quota/cache service or a paid plan and load-test before launch.

Cached score ages and refresh intervals are approximate. There is no WebSocket push, background worker or database in this group. An API key is required to view real games; tests use mocked upstream responses.

## Validation

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

See [NBA API documentation](docs/nba-api.md) and [live updating](docs/live-scores.md).

## Project groups

1. ~~Repository hardening~~
2. ~~NBA API integration~~
3. ~~Games dashboard~~
4. ~~Automatic live scores, cache, local rate budget and recovery~~
5. UI completion
6. Testing, security and release readiness

This project is independent and not affiliated with or endorsed by the NBA. Verify public redistribution and trademark rights before launch.
