# Live-score refresh and caching (Group 4)

## Client behavior

`useGames(date)` requests `/api/games?date=YYYY-MM-DD` on page entry and schedules another fetch using `refreshAfterSeconds` from the server response. Automatic updating pauses when the document is hidden or the browser is offline. Returning to a visible/online state triggers a new fetch.

On a recoverable failure, the last successful slate remains visible with a stale warning. Retries back off exponentially, from 30 seconds up to 5 minutes, honoring `Retry-After` if longer. Missing or rejected API credentials stop automatic retries until a manual request or reload.

Manual **Refresh** does not circumvent the CDN or upstream quota; it checks the shared endpoint normally. The home page and the games page are independent consumers.

## Server response and cache intervals

| Situation | Cache/refresh target |
| --- | ---: |
| In-progress games | 30 seconds |
| Tip-off within 1 hour (and up to 1 hour after) | 60 seconds |
| Delayed or suspended | 60 seconds |
| Other scheduled games | 300 seconds |
| Recently final / postponed / canceled | 120 seconds |
| No games | 900 seconds |
| Older dates (over 2 days ago) | 86,400 seconds |
| Failed refresh with cached data | 15 second CDN TTL, retry after cooldown |

Responses use `Cache-Control: public, max-age=0, s-maxage=N, stale-while-revalidate=M`, where `M` is at most 60 seconds. `fetchedAt` is the last successful upstream fetch, not the time an existing cache entry was read. Stale fallback responses have `stale: true` and `X-Data-Stale: 1`; when no cached slate exists, safe errors are returned instead.

## Quota controls and limitations

A `NbaQuotaGuard` reserves one token **before each individual upstream request**, including extra cursor pages, with a default limit of **4 requests per rolling 60-second window per Node.js runtime**. The fifth request is rejected locally, without contacting BALLDONTLIE. An upstream 429 triggers a shared per-runtime cooldown. Per-date in-flight calls are coalesced. Old slate entries are bounded to 64 dates.

**This is not an account-wide hard limit in serverless deployments.** Separate regions, runtime replicas, and cold starts have separate in-memory queues and caches. CDN caching is segmented by region and may be evicted. A public production deployment with meaningful concurrent traffic requires a central distributed rate budget/cache, or an upgraded API tier, with measurements confirming actual upstream call volume. This is a deliberate limitation of the no-database/no-Redis MVP.

Vercel CDN cache headers reduce origin calls on cache hits, but the response can remain stale during `stale-while-revalidate`. Do not promise sub-30-second end-to-end latency. Never use query cache-busting to force upstream refresh. The API key always remains server-only.

## Monitoring and tests

Run `npm test` for fake-clock tests covering intervals, coalescing, pagination-token consumption, cooldowns, stale recovery and terminal authentication failures. CI does not make live BALLDONTLIE calls. Validate real-world score accuracy and provider redistribution permissions before public release.
