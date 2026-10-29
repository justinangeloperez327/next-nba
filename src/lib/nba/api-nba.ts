import { z } from "zod";
import { getNbaScheduleDate, isValidScheduleDate } from "./date.ts";
import { shiftScheduleDate } from "./view.ts";
import { findTeam, teams } from "../teams.ts";
import { NbaProviderError } from "./provider.ts";
import type { NbaGame, NbaGameStatus, NbaProvider, NbaTeam } from "./types.ts";

const API_BASE = "https://v2.nba.api-sports.io";
const TIMEOUT_MS = 8_000;

const apiTeam = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  nickname: z.string().nullish(),
  code: z.string().nullish(),
  city: z.string().nullish(),
  nbaFranchise: z.boolean().nullish(),
  allStar: z.boolean().nullish(),
  leagues: z.object({
    standard: z.object({
      conference: z.string().nullish(),
      division: z.string().nullish(),
    }).nullish(),
  }).nullish(),
});

const gameSchema = z.object({
  id: z.number().int().positive(),
  league: z.string().optional(),
  season: z.number().int(),
  date: z.object({
    start: z.string().datetime({ offset: true }).nullable(),
  }),
  stage: z.number().int().nullish(),
  status: z.object({
    short: z.number().int(),
    long: z.string().nullish(),
    clock: z.string().nullish(),
  }),
  periods: z.object({ current: z.number().int().nonnegative().nullish() }).nullish(),
  teams: z.object({ home: apiTeam, visitors: apiTeam }),
  scores: z.object({
    home: z.object({ points: z.number().int().nonnegative().nullish() }),
    visitors: z.object({ points: z.number().int().nonnegative().nullish() }),
  }),
});

const responseEnvelope = z.object({
  errors: z.union([z.record(z.string(), z.unknown()), z.array(z.unknown())]).optional(),
  response: z.unknown(),
});

export type ApiNbaOptions = {
  apiKey?: string;
  fetcher?: typeof fetch;
  beforeRequest?: () => void;
  onRateLimit?: (seconds?: number) => void;
  onQuotaExhausted?: () => void;
  // Free: 100 calls/day, a single NBA day needs two UTC-date calls.
  plan?: "free" | "pro";
};

function hasErrors(errors: Record<string, unknown> | unknown[] | undefined): boolean {
  return errors !== undefined && (Array.isArray(errors)
    ? errors.length > 0 : Object.keys(errors).length > 0);
}

function parseRetrySeconds(value: string | null): number | undefined {
  if (!value || !/^\d{1,4}$/.test(value)) return undefined;
  return Math.max(1, Math.min(3600, Number(value)));
}

function normalizedTeam(input: z.infer<typeof apiTeam>): NbaTeam {
  const abbreviation = input.code?.trim().toUpperCase();
  const staticTeam = abbreviation ? findTeam(abbreviation) : teams.find((t) =>
    t.name.toLowerCase() === input.name.toLowerCase());
  if (!staticTeam) throw new NbaProviderError("INVALID_RESPONSE");
  const league = input.leagues?.standard;
  const conference = league?.conference?.toLowerCase() === "east" ? "Eastern"
    : league?.conference?.toLowerCase() === "west" ? "Western" : staticTeam.conference;
  return {
    id: input.id,
    abbreviation: staticTeam.abbreviation,
    fullName: staticTeam.name,
    name: input.nickname?.trim() || staticTeam.name,
    city: input.city ?? "",
    conference,
    division: league?.division ?? "",
  };
}

function statusOf(short: number): NbaGameStatus {
  switch (short) {
    case 1: return "scheduled";
    case 2: return "in_progress";
    case 3: return "final";
    case 4: return "postponed";
    case 5: return "delayed";
    case 6: return "canceled";
    default: return "unknown";
  }
}

export function createApiNbaProvider(options: ApiNbaOptions = {}): NbaProvider {
  const apiKey = options.apiKey ?? process.env.API_NBA_KEY;
  const fetcher = options.fetcher ?? fetch;
  const plan = options.plan ?? "free";

  async function request(path: string, params: Record<string, string>): Promise<unknown> {
    if (!apiKey?.trim()) throw new NbaProviderError("NOT_CONFIGURED");
    const url = new URL(path, API_BASE);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

    // Reserve one upstream quota token for each requested UTC day.
    options.beforeRequest?.();
    let result: Response;
    try {
      result = await fetcher(url, {
        method: "GET",
        headers: { "x-apisports-key": apiKey, Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (error) {
      if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
        throw new NbaProviderError("TIMEOUT");
      }
      throw new NbaProviderError("NETWORK");
    }

    if (result.headers.get("x-ratelimit-requests-remaining") === "0") {
      options.onQuotaExhausted?.();
    }
    if (result.status === 401 || result.status === 403) throw new NbaProviderError("AUTH");
    if (result.status === 429) {
      const delay = parseRetrySeconds(result.headers.get("retry-after"));
      options.onRateLimit?.(delay);
      throw new NbaProviderError("RATE_LIMIT", delay);
    }
    if (!result.ok) throw new NbaProviderError("UPSTREAM");
    let raw: unknown;
    try { raw = await result.json(); } catch { throw new NbaProviderError("INVALID_RESPONSE"); }
    const envelope = responseEnvelope.safeParse(raw);
    if (!envelope.success) throw new NbaProviderError("INVALID_RESPONSE");
    if (hasErrors(envelope.data.errors)) throw new NbaProviderError("UPSTREAM");
    return envelope.data.response;
  }

  return {
    // The API date parameter follows UTC, while Next NBA uses America/New_York
    // league dates. Query both UTC dates then filter the game's actual start.
    // Never send a client-supplied API key or choose a provider via query string.
    minimumGameCacheSeconds: plan === "free" ? 3600 : 60,
    async listGamesByDate(date: string): Promise<NbaGame[]> {
      if (!isValidScheduleDate(date)) throw new RangeError("Invalid NBA schedule date");
      const results: NbaGame[] = [];
      const seen = new Set<number>();
      for (const utcDate of [date, shiftScheduleDate(date, 1)]) {
        const raw = await request("/games", { league: "standard", date: utcDate });
        const parsed = z.array(gameSchema).safeParse(raw);
        if (!parsed.success) throw new NbaProviderError("INVALID_RESPONSE");
        for (const entry of parsed.data) {
          if (seen.has(entry.id) || (entry.league && entry.league !== "standard")) continue;
          // Do not leak next-day games into the requested NBA Eastern day.
          if (!entry.date.start || getNbaScheduleDate(new Date(entry.date.start)) !== date) continue;
          const home = normalizedTeam(entry.teams.home);
          const away = normalizedTeam(entry.teams.visitors);
          results.push({
            id: entry.id, date, tipoffAt: entry.date.start, season: entry.season,
            status: statusOf(entry.status.short),
            statusText: entry.status.long ?? "Status unavailable",
            clock: entry.status.clock ?? null,
            period: entry.periods?.current ?? null,
            postseason: false, // Stage values do not reliably identify playoffs.
            homeTeam: home, awayTeam: away,
            homeScore: entry.scores.home.points,
            awayScore: entry.scores.visitors.points,
          });
          seen.add(entry.id);
        }
      }
      return results.sort((a, b) =>
        (a.tipoffAt ?? "").localeCompare(b.tipoffAt ?? "") || a.id - b.id);
    },

    async listTeams(): Promise<NbaTeam[]> {
      const raw = await request("/teams", { league: "standard" });
      const array = z.array(z.unknown()).safeParse(raw);
      if (!array.success) throw new NbaProviderError("INVALID_RESPONSE");
      const selected = new Map<string, NbaTeam>();
      for (const item of array.data) {
        const parsed = apiTeam.safeParse(item);
        if (!parsed.success) throw new NbaProviderError("INVALID_RESPONSE");
        if (parsed.data.allStar === true || parsed.data.nbaFranchise === false) continue;
        try {
          const team = normalizedTeam(parsed.data);
          if (!selected.has(team.abbreviation)) selected.set(team.abbreviation, team);
        } catch (error) {
          if (!(error instanceof NbaProviderError)) throw error;
          // Older or unrelated team entries are not part of the active 30 teams.
        }
      }
      return [...selected.values()].sort((a, b) => a.fullName.localeCompare(b.fullName));
    },
  };
}
