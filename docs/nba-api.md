# BALLDONTLIE API integration — Group 2

The app exposes two server-side JSON endpoints through the selected provider (default: free `swar/nba_api`). When BALLDONTLIE is explicitly selected, it backs these endpoints:

- `GET /api/games?date=YYYY-MM-DD` (date optional, defaults to New York calendar day)
- `GET /api/teams`

**The live scoreboard is connected.** This document describes the historical BALLDONTLIE adapter; use [Python bridge setup](nba-python.md) for the free default.

## Optional BALLDONTLIE API key setup

To use this *non-default* adapter, set `NBA_DATA_PROVIDER=balldontlie` explicitly.

1. Get an NBA API key from https://app.balldontlie.io/
2. Copy `.env.example` to `.env.local`.
3. Set `BALLDONTLIE_API_KEY=your-key` in `.env.local`.
4. Run `npm ci && npm run dev`.

Never put this value in a `NEXT_PUBLIC_*` variable. The upstream `Authorization` header is set only inside server-side Route Handlers. Without a key the endpoints return a safe HTTP 503 `NOT_CONFIGURED` response rather than contacting the provider.

## Example

```bash
curl "http://localhost:3000/api/games?date=2026-10-29"
curl "http://localhost:3000/api/teams"
```

Successful game responses contain `date`, `games`, `source`, `fetchedAt`. Game scores and tip-off timestamps may be `null` when the provider omits them. Game lifecycle values are `scheduled`, `in_progress`, `final`, `postponed`, `canceled`, `delayed`, `suspended`, `abandoned`, or `unknown`.

The scheduled date is an NBA/New York calendar date; tip-off timestamps stay in UTC so the UI can present them in the viewer's time zone.

## Error response

```json
{
  "error": {
    "code": "RATE_LIMIT",
    "message": "NBA data provider is temporarily rate limited."
  }
}
```

- Invalid date: 400
- Missing key or upstream rate limit: 503
- Upstream invalid credentials/response/network error: 502
- Upstream timeout: 504

Error messages never contain API keys or raw provider responses. Upstream 429 `Retry-After` seconds are safely forwarded when present.

## API behavior and limits

- Uses the documented free-tier `/v1/games` and `/v1/teams` endpoints.
- Uses `dates[]` with cursor pagination, `per_page=100`, deduplication, and a three-page safety cap; unexpected larger responses fail instead of silently truncating.
- Each provider response is validated using Zod and normalized into application-facing types.
- Game-aware CDN caching: 30 seconds for live games, longer for schedules/results, and 24 hours for teams. Local concurrency deduplication, a four-requests/minute upstream budget per runtime, stale fallback, and adaptive browser polling are implemented. This **does not guarantee global rate-limit compliance** across multiple serverless instances; see [live score caching](live-scores.md).
- No database, credentials in client bundles, or fake scores.

See https://docs.balldontlie.io/ for official API documentation. Confirm redistribution and trademark rights before public launch.

## Development verification

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

The Node.js 24 test runner uses TypeScript type-stripping. Tests mock `fetch`; CI does not require credentials or live API requests.
