import { getNbaScheduleDate, isSupportedScheduleDate } from "./date.ts";
import { NbaProviderError } from "./provider.ts";
import { gameCacheSeconds } from "./polling.ts";
import type { NbaFeedCache } from "./cache.ts";
import type { GamesPayload, NbaDataSource, NbaProvider, TeamsPayload } from "./types.ts";

function json(body: unknown, status: number, cacheControl = "no-store", extras: HeadersInit = {}) {
  return Response.json(body, { status, headers: { "Cache-Control": cacheControl, ...extras } });
}

function headersFor(ttl: number): string {
  const seconds = Math.max(1, Math.floor(ttl));
  return `public, max-age=0, s-maxage=${seconds}, stale-while-revalidate=${Math.min(seconds, 60)}`;
}

function upstreamFailure(error: unknown): Response {
  if (!(error instanceof NbaProviderError)) {
    return json({ error: { code: "INTERNAL_ERROR", message: "Unable to load NBA data." } }, 500);
  }
  const failures = {
    NOT_CONFIGURED: [503, "NBA data service is not configured."],
    AUTH: [502, "NBA provider authorization failed."],
    RATE_LIMIT: [503, "NBA data provider is temporarily rate limited."],
    TIMEOUT: [504, "NBA data provider timed out."],
    NETWORK: [502, "NBA data provider is unavailable."],
    UPSTREAM: [502, "NBA data provider returned an error."],
    INVALID_RESPONSE: [502, "NBA data provider returned invalid data."],
  } as const;
  const [status, message] = failures[error.code];
  const headers: Record<string, string> = {};
  if (error.retryAfterSeconds !== undefined) headers["Retry-After"] = String(error.retryAfterSeconds);
  return json({ error: { code: error.code, message } }, status, "no-store", headers);
}

export async function serveGames(
  request: Request,
  provider: NbaProvider,
  now: Date = new Date(),
  feed?: NbaFeedCache,
  source: NbaDataSource = "balldontlie",
): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const dates = params.getAll("date");
  if (dates.length > 1) {
    return json({ error: { code: "INVALID_DATE", message: "Specify exactly one date." } }, 400);
  }
  const date = dates.length === 1 ? dates[0] : getNbaScheduleDate(now);
  if (!isSupportedScheduleDate(date, now)) {
    return json({ error: { code: "INVALID_DATE", message: "Date must be a supported NBA schedule date (1946 through one year ahead)." } }, 400);
  }

  try {
    const result = feed ? await feed.getGames(date) : undefined;
    const games = result?.data ?? await provider.listGamesByDate(date);
    const ttl = result?.ttlSeconds ?? Math.max(gameCacheSeconds(games, date, now), provider.minimumGameCacheSeconds ?? 0);
    const stale = result?.stale ?? false;
    const payload: GamesPayload = {
      date, games, source,
      fetchedAt: result?.fetchedAt ?? new Date().toISOString(),
      stale,
      refreshAfterSeconds: stale ? Math.max(30, result?.retryAfterSeconds ?? ttl) : ttl,
    };
    const response = json(payload, 200, headersFor(stale ? 15 : ttl));
    if (stale) response.headers.set("X-Data-Stale", "1");
    return response;
  } catch (error) {
    return upstreamFailure(error);
  }
}

export async function serveTeams(provider: NbaProvider, feed?: NbaFeedCache, source: NbaDataSource = "balldontlie"): Promise<Response> {
  try {
    const result = feed ? await feed.getTeams() : undefined;
    const teams = result?.data ?? await provider.listTeams();
    const payload: TeamsPayload = {
      teams, source, fetchedAt: result?.fetchedAt ?? new Date().toISOString(),
    };
    return json(payload, 200, headersFor(result?.ttlSeconds ?? 86_400));
  } catch (error) {
    return upstreamFailure(error);
  }
}
