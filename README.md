# Next NBA

An independent NBA scoreboard, schedule and team directory built with Next.js 16, TypeScript, React 19 and Tailwind CSS 4.

## Start locally

Requirements: Node.js 24, npm, and a BALLDONTLIE NBA API key.

```bash
git clone https://github.com/justinangeloperez327/next-nba.git
cd next-nba
npm ci
cp .env.example .env.local
# Edit .env.local and set BALLDONTLIE_API_KEY=your-key
npm run dev
```

Open http://localhost:3000. API credentials must remain server-only.

## Features

- Responsive scoreboard homepage with priority given to games in progress.
- `/games` with shareable `?date=YYYY-MM-DD&team=BOS` URLs, team and game-state filters, and NBA-day navigation.
- `/teams` with 30 franchises, name/abbreviation search, conference tabs, and direct links to team schedules.
- Compact accessible game cards, local tip-off times, loading/empty/error states and stale score notices.
- Automatic game-aware refresh, server caching, per-runtime quota control and last-known score recovery.
- Responsive navigation with active link indicators, accessible touch targets and reduced-motion preference support.
- NBA data through a typed, validated, server-only BALLDONTLIE API adapter.
- `/standings` remains an explicit placeholder until an authorized compatible standings feed is available.

## Important limits

Actual scores require `BALLDONTLIE_API_KEY`. No fabricated games or rankings are displayed.
The free provider tier does **not** include all detailed stats and standings.
The four-request-per-minute budget is per Node.js runtime, **not account-wide across serverless instances**.
Live provider requests and multi-device screen testing still need verification before public release.
Do not use protected league branding or images without the necessary rights.

## Development checks

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

See [NBA API integration](docs/nba-api.md) and [live score behavior](docs/live-scores.md).

## Implementation groups

1. ~~Repository hardening~~
2. ~~NBA API integration~~
3. ~~Games dashboard~~
4. ~~Live-score polling and cache~~
5. ~~Responsive UI and team navigation~~
6. Final security, end-to-end checks and release readiness

Next NBA is independent and is not affiliated with or endorsed by the NBA.
