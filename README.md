# Next NBA

Free-first, independently developed NBA schedule, live score and team-directory web app using **Next.js 16**, **Node.js 24** and [`swar/nba_api`](https://github.com/swar/nba_api).

## Default: no paid NBA API subscription

**`nba-api` is the default provider** in both Node.js configuration and Docker Compose. It uses the Python `swar/nba_api` package, which accesses NBA.com data endpoints without a paid API key. We keep the previous BALLDONTLIE and API-Sports integrations in the repository for optional use, but they are **not called or billed by the default configuration**. No automatic fallback is enabled.

Using the library without a subscription does not guarantee that NBA.com will serve requests indefinitely, allow data redistribution, or permit commercial use. Official NBA.com data is governed by the [NBA.com terms](https://www.nba.com/termsofuse). The free data library is independent of the NBA, and `stats.nba.com` frequently restricts access from cloud-hosting IP addresses.

## Run for free on your own computer

Requires Docker Desktop (or Docker Engine with Compose).

1. Clone the repository.
2. In the repository root create a local **`.env` file** containing `NBA_API_BRIDGE_TOKEN=<your long random secret>`. This is **not** an NBA API subscription key; it protects communication between the Node.js app and private Python bridge.
3. Run:

```bash
docker compose up --build -d
```

4. Open **http://localhost:3000**.

Docker Compose starts the Next.js web app and Python bridge on a private network. No subscription, credit card, or third-party NBA API key is required. Running locally avoids paying for cloud hosting; hosting the two containers on a remote server may still cost money.

For Node.js and Python development outside Docker, copy `.env.example` to `.env.local`, configure the same bridge token in the Python server's environment, start `python bridge/server.py`, then `npm run dev`. See [complete Python bridge setup](docs/nba-python.md).

## Features

- Today's NBA schedule and scores using the NBA live CDN scoreboard.
- Date-specific games using `nba_api.stats.endpoints.ScoreboardV3`.
- Searchable directory of all 30 NBA teams using offline package reference data.
- Adaptive refresh, provider failure handling, server-side cache, and rate limiting.
- Responsive mobile/desktop UI, team filters and accessibility checks.
- Node.js 24 and Python 3.12 automated tests, Playwright, container build and startup smoke tests.

**No scores are invented.** If NBA.com times out, changes its data format or blocks a request, the app shows an error/stale-data state instead of fabricated results.

## Optional alternative providers

The previous integrations remain available **only if you explicitly select them** by setting `NBA_DATA_PROVIDER=balldontlie` or `NBA_DATA_PROVIDER=api-nba` and configuring their respective keys. Neither is needed for the free default. Provider selection is server-side; viewers cannot trigger another provider.

## Validation

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
python -m unittest discover -s bridge/tests -v
npx playwright install chromium
npm run test:e2e
```

Review [Python bridge documentation](docs/nba-python.md), [release checklist](docs/release-readiness.md) and [security policy](SECURITY.md) before publicly deploying. Live NBA.com requests and permission to publicly display game data are **not verified by CI**.

This independent project is not affiliated with or endorsed by the NBA.
