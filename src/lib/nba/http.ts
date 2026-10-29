import { getNbaScheduleDate, isValidScheduleDate } from "./date.ts";
import { NbaProviderError } from "./provider.ts";
import type { GamesPayload, NbaProvider, TeamsPayload } from "./types.ts";

function json(body: unknown, status: number, cacheControl = "no-store", extras: HeadersInit = {}) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": cacheControl, ...extras },
  });
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
  if (error.code === "RATE_LIMIT" && error.retryAfterSeconds !== undefined) {
    headers["Retry-After"] = String(error.retryAfterSeconds);
  }
  return json({ error: { code: error.code, message } }, status, "no-store", headers);
}

export async function serveGames(
  request: Request,
  provider: NbaProvider,
  now: Date = new Date(),
): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const allDates = params.getAll("date");
  if (allDates.length > 1) {
    return json({ error: { code: "INVALID_DATE", message: "Specify exactly one date." } }, 400);
  }
  const date = allDates.length === 1 ? allDates[0] : getNbaScheduleDate(now);
  if (!isValidScheduleDate(date)) {
    return json({ error: { code: "INVALID_DATE", message: "Date must be a real YYYY-MM-DD calendar date." } }, 400);
  }

  try {
    const games = await provider.listGamesByDate(date);
    const payload: GamesPayload = {
      date,
      games,
      source: "balldontlie",
      fetchedAt: new Date().toISOString(),
    };
    // CDN-level caching is a conservative interim policy. Group 4 will add
    // game-aware cache durations, quota management, and request coalescing.
    return json(payload, 200, "public, s-maxage=60, stale-while-revalidate=120");
  } catch (error) {
    return upstreamFailure(error);
  }
}

export async function serveTeams(provider: NbaProvider): Promise<Response> {
  try {
    const teams = await provider.listTeams();
    const payload: TeamsPayload = {
      teams,
      source: "balldontlie",
      fetchedAt: new Date().toISOString(),
    };
    return json(payload, 200, "public, s-maxage=86400, stale-while-revalidate=86400");
  } catch (error) {
    return upstreamFailure(error);
  }
}
