# BALLDONTLIE API integration — Group 2

The app now exposes two server-side JSON endpoints backed by BALLDONTLIE:

- `GET /api/games?date=YYYY-MM-DD` (date optional, defaults to New York calendar day)
- `GET /api/teams`

**No frontend live scoreboard is connected yet** — the UI changes are Group 3 and 4.

## API key setup

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
- CDN caching headers: games 60 seconds, teams 24 hours. **This does not yet guarantee global rate-limit compliance**; shared request coalescing and game-aware refresh are in Group 4.
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
