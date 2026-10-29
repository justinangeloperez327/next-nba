# API-NBA as a second NBA data provider

The application can run against BALLDONTLIE (default) or API-NBA. Provider selection is **server-only** so a visitor cannot force the server to spend another provider's quota.

## Activate API-NBA

Copy `.env.example` to `.env.local` and set:

```env
NBA_DATA_PROVIDER=api-nba
API_NBA_KEY=YOUR_PRIVATE_API_SPORTS_KEY
API_NBA_PLAN=free
```

For the existing integration, use `NBA_DATA_PROVIDER=balldontlie` and `BALLDONTLIE_API_KEY=...`. The selected provider supplies both `GET /api/games?date=YYYY-MM-DD` and `GET /api/teams`; normalised responses use `source: "api-nba"` or `source: "balldontlie"`. All existing UI routes remain unchanged. **API keys never enter browser JS.**

Provider settings are loaded at server process startup. Changing `.env.local` requires restarting the server. On Vercel, change environment variables and create a new deployment.

## Provider scope and mapping

API-NBA uses `https://v2.nba.api-sports.io`, the `x-apisports-key` request header, and `/games?league=standard&date=YYYY-MM-DD`. The adapter:
- Reads its `errors` envelope even when HTTP status is 200; an empty `response: []` alone is a legitimate date without games.
- Converts numeric `status.short` 1–6 into Next NBA lifecycle states; missing score values stay null.
- Normalizes known current NBA franchise names/codes to the existing 30-team model without downloading logos.
- Requests *both* UTC dates corresponding to one America/New_York calendar day and filters by the actual game start time, eliminating UTC midnight date slips.
- Does not invent playoff flags from undocumented stage codes.
- Keeps BALLDONTLIE working; there is no silent or automatic cross-provider fallback.

## Free-tier quota protection

API-NBA Free currently allows **100 requests/day and 10/min**. Each NBA league day uses **two API requests** (two UTC days). The default `API_NBA_PLAN=free` deliberately keeps each day's scoreboard cached for at least **3,600 seconds (one hour)**, rather than pretending 30-second live updates are affordable.

An instance-local quota guard limits requests to 8/min and 90/day (UTC); the remainder acts as a safety margin. When the API reports `x-ratelimit-requests-remaining: 0`, the instance stops contacting it until the next UTC day. This is conservative for **one tracked date** but does not guarantee an account-wide ceiling across multiple dates or distributed deployments.

Set `API_NBA_PLAN=pro` only with a genuinely subscribed plan. It lowers the cache minimum to 60 seconds, with instance-local limits of 120/min and 7,000/day. The plan flag **does not upgrade an API subscription**, and all provider limits remain subject to the actual subscription.

API-NBA's documentation lists 100 free requests/day, 10/min and a reset at 00:00 UTC. See <https://api-sports.io/sports/nba> and <https://www.api-football.com/news/post/how-to-get-started-with-api-nba-the-complete-beginners-guide>.

**Important:** in-memory guards are per Node runtime, not distributed across serverless instances, cold starts or regions. A public high-traffic site requires centrally coordinated quota/cache controls and appropriate data display rights.

## Next steps

The scoreboard and team API adapters are implemented and mocked in CI. The standings and player-stat endpoints are **not yet exposed in the website UI**. Confirm coverage and licensing with a real key before adding paid-feature views or retiring the standings placeholder.

Run `npm test`, `npm run typecheck`, `npm run build`, and `npm run test:e2e`. Tests never require a private API key and never call the real provider.
