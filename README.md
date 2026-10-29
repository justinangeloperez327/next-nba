# Next NBA

A lightweight, independent NBA scoreboard, schedule, and team directory powered by Next.js 16, React 19, TypeScript, Tailwind CSS 4 and BALLDONTLIE.

## Local setup

Requirements: **Node.js 24** and npm.

```bash
git clone https://github.com/justinangeloperez327/next-nba.git
cd next-nba
npm ci
cp .env.example .env.local
# Add your private BALLDONTLIE_API_KEY to .env.local
npm run dev
```

Open http://localhost:3000. Never use `NEXT_PUBLIC_` for provider keys.

## Features

- Responsive homepage prioritizing active NBA matchups.
- `/games` daily scoreboard, game status filtering, date navigation, and team-specific schedule links.
- `/teams` 30-team searchable directory and conference filters.
- Game-state-aware score refresh, process-level request coalescing and cached last-known results.
- Server-side BALLDONTLIE adapter with validated response schemas, bounded error state, historical-date constraints, and sanitized errors.
- Server response security headers, disabled framework-identification header, reduced-motion behavior.
- Automated Node.js 24 CI for dependency audit, lint, type checking, unit/API tests, production build, mobile/desktop browser tests and accessibility scans.

No provider credentials or fabricated NBA scores are used in CI; browser tests mock responses at the network boundary.

## Development commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start development mode |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm test` | Node.js unit, API and cache tests |
| `npm run build` | Production build |
| `npx playwright install chromium` | Install local browser |
| `npm run test:e2e` | Run browser tests after `npm run build` |
| `npm run test:e2e:ui` | Interactive browser test UI |
| `npm audit --omit=dev --audit-level=high` | Production dependency audit |

## Deployment status

**CI-ready does not mean publicly released.** No production deployment has been made automatically. The following must be checked before public release:

1. Configure a real `BALLDONTLIE_API_KEY` in the hosting environment and verify legitimate provider data.
2. Verify permitted redistribution of scores and legal use of any NBA/club trademarks.
3. Confirm provider request volume under intended concurrent traffic. The four-requests/minute quota is **per server instance**, not global.
4. For meaningful public serverless traffic, implement a distributed provider quota and cache, or choose a plan/architecture that safely supports traffic.
5. Manually inspect mobile layouts, keyboard and screen-reader use and assess a strict CSP for the chosen deployment platform.
6. Complete live-game score/status transition testing and incident recovery.

See [release checklist](docs/release-readiness.md), [security policy](SECURITY.md), [NBA API](docs/nba-api.md) and [refresh strategy](docs/live-scores.md).

## Project groups

1. ~~Repository hardening~~
2. ~~NBA API integration~~
3. ~~Games dashboard~~
4. ~~Live-score engine~~
5. ~~UI completion~~
6. ~~Release hardening and automated verification~~

This is an independent project, not affiliated with or endorsed by the NBA.
