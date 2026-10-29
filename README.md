# Next NBA

An independent NBA scoreboard, schedules, and teams website built with Next.js 16, React 19, TypeScript and Tailwind CSS 4.

## NBA data providers

Three mutually exclusive, server-selected adapters share the same game/team contract:

| `NBA_DATA_PROVIDER` | Upstream | Setup |
| --- | --- | --- |
| `nba-api` | [swar/nba_api](https://github.com/swar/nba_api) via an authenticated local Python bridge | No NBA API key; run Python 3.12 / Docker Compose |
| `balldontlie` | BALLDONTLIE (existing default) | `BALLDONTLIE_API_KEY` |
| `api-nba` | API-Sports API-NBA (commercial, unrelated to swar/nba_api) | `API_NBA_KEY` and `API_NBA_PLAN` |

**To run the swar/nba_api integration with one command:**

```bash
git clone https://github.com/justinangeloperez327/next-nba.git
cd next-nba
# Create a private random bridge token in a local .env file:
# NBA_API_BRIDGE_TOKEN=<random value>
docker compose up --build
```

Open http://localhost:3000. The Compose Python bridge is private to the Compose network and authenticates requests with a bearer token. For local development without Docker, follow [Python bridge instructions](docs/nba-python.md).

The Python library wraps the *unofficial* endpoints behind NBA.com. It is **not an NBA data license**, is not endorsed by the NBA, and can be rate-limited or blocked from cloud-hosting IPs (especially `stats.nba.com`). Today's games use its live CDN scoreboard; other dates use `ScoreboardV3`. A blocked historical request is an error, not an invented empty game day. Do not assume this is safe for public commercial redistribution without separate NBA rights.

### Existing Node.js workflow

```bash
npm ci
cp .env.example .env.local
# Set NBA_DATA_PROVIDER and the matching server-side settings
npm run dev
```

The existing providers remain available. Switching providers requires restarting or redeploying the backend. There is no automatic fallback or browser-controlled provider selection. Never expose `NBA_API_BRIDGE_TOKEN` or provider keys via `NEXT_PUBLIC_`.

## Features

- Responsive live-first home and date/team-filtered game dashboard.
- Searchable 30-team directory, game states, scores, Eastern/UTC date handling.
- Server caching, rate guards and stale-data warnings (all instance-local).
- CI: Node.js 24, Python bridge tests, TypeScript, unit/API tests, production builds, Playwright, axe accessibility, container configuration/build.

## Validation

```bash
npm run lint
npm run typecheck
npm test
npm run build
python -m unittest discover -s bridge/tests -v
npx playwright install chromium
npm run test:e2e
```

Check [Python bridge deployment](docs/nba-python.md), [release readiness](docs/release-readiness.md), [API-NBA](docs/api-nba.md), and [live caching](docs/live-scores.md).

This application is independent and is not affiliated with or endorsed by the NBA.
