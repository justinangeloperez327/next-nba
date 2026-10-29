import { z } from "zod";
import { isValidScheduleDate } from "./date.ts";
import { findTeam } from "../teams.ts";
import { NbaProviderError } from "./provider.ts";
import type { NbaGame, NbaGameStatus, NbaProvider, NbaTeam } from "./types.ts";

const teamSchema = z.object({
  teamId: z.number().int().positive(),
  teamTricode: z.string().min(2),
  teamName: z.string().optional().nullable(),
  teamCity: z.string().optional().nullable(),
  score: z.number().int().nonnegative().nullable().optional(),
});

const gameSchema = z.object({
  gameId: z.string().regex(/^\d{8,12}$/),
  gameStatus: z.number().int(),
  gameStatusText: z.string(),
  gameTimeUTC: z.string().nullable().optional(),
  period: z.number().int().nonnegative().nullable().optional(),
  gameClock: z.string().nullable().optional(),
  poRoundDesc: z.string().nullable().optional(),
  homeTeam: teamSchema,
  awayTeam: teamSchema,
});

const gamesPayloadSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mode: z.enum(["live", "stats"]),
  scoreboard: z.object({ games: z.array(gameSchema) }),
});

const teamsPayloadSchema = z.object({
  teams: z.array(z.object({
    id: z.number().int().positive(),
    full_name: z.string().min(1),
    abbreviation: z.string().min(2),
    nickname: z.string().optional(),
    city: z.string().optional(),
  })),
});

function normalizeTeam(
  team: Pick<z.infer<typeof teamSchema>, "teamId" | "teamTricode" | "teamName" | "teamCity">,
): NbaTeam {
  const known = findTeam(team.teamTricode);
  if (!known) throw new NbaProviderError("INVALID_RESPONSE");
  return {
    id: team.teamId,
    name: team.teamName?.trim() || known.name,
    fullName: known.name,
    abbreviation: known.abbreviation,
    city: team.teamCity?.trim() ?? "",
    conference: known.conference,
    division: "",
  };
}

function normalizeStatus(value: z.infer<typeof gameSchema>): NbaGameStatus {
  const text = value.gameStatusText.toLowerCase();
  if (text.includes("postpon")) return "postponed";
  if (text.includes("cancel")) return "canceled";
  if (text.includes("delay")) return "delayed";
  if (text.includes("suspend")) return "suspended";
  if (value.gameStatus === 1) return "scheduled";
  if (value.gameStatus === 2) return "in_progress";
  if (value.gameStatus === 3) return "final";
  return "unknown";
}

function gameClock(clock: string | null | undefined): string | null {
  if (!clock) return null;
  const match = /^PT(\d{1,3})M(\d{1,2})(?:\.\d+)?S$/.exec(clock);
  if (!match) return clock;
  return `${Number(match[1])}:${match[2].padStart(2, "0")}`;
}

function normalizeGame(game: z.infer<typeof gameSchema>, date: string): NbaGame {
  const status = normalizeStatus(game);
  const parsed = game.gameTimeUTC ? Date.parse(game.gameTimeUTC) : NaN;
  const tipoffAt = Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
  return {
    id: Number(game.gameId),
    date,
    tipoffAt,
    season: Number(date.slice(0, 4)) - (Number(date.slice(5, 7)) < 9 ? 1 : 0),
    status,
    statusText: game.gameStatusText,
    period: game.period ?? null,
    clock: gameClock(game.gameClock),
    postseason: game.gameId.startsWith("004") || Boolean(game.poRoundDesc?.trim()),
    homeTeam: normalizeTeam(game.homeTeam),
    awayTeam: normalizeTeam(game.awayTeam),
    homeScore: status === "scheduled" || status === "postponed" || status === "canceled"
      ? null : game.homeTeam.score ?? null,
    awayScore: status === "scheduled" || status === "postponed" || status === "canceled"
      ? null : game.awayTeam.score ?? null,
  };
}

export type NbaPythonOptions = {
  baseUrl?: string;
  token?: string;
  fetcher?: typeof fetch;
  beforeRequest?: () => void;
  onRateLimit?: (seconds?: number) => void;
};

export function createNbaPythonProvider(options: NbaPythonOptions = {}): NbaProvider {
  const url = options.baseUrl ?? process.env.NBA_API_BRIDGE_URL;
  const token = options.token ?? process.env.NBA_API_BRIDGE_TOKEN;
  const fetcher = options.fetcher ?? fetch;

  async function request(path: "/v1/games" | "/v1/teams", date?: string): Promise<unknown> {
    if (!url?.trim() || !token?.trim()) throw new NbaProviderError("NOT_CONFIGURED");
    let endpoint: URL;
    try {
      const base = new URL(url);
      if (!["http:", "https:"].includes(base.protocol) || base.username || base.password || base.search || base.hash) {
        throw new Error("Invalid bridge URL");
      }
      endpoint = new URL(path, base);
      if (date !== undefined) endpoint.searchParams.set("date", date);
    } catch {
      throw new NbaProviderError("NOT_CONFIGURED");
    }

    options.beforeRequest?.();
    let response: Response;
    try {
      response = await fetcher(endpoint, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(12_000),
      });
    } catch (error) {
      if (error instanceof Error && ["AbortError", "TimeoutError"].includes(error.name)) {
        throw new NbaProviderError("TIMEOUT");
      }
      throw new NbaProviderError("NETWORK");
    }
    if (response.status === 401 || response.status === 403) throw new NbaProviderError("AUTH");
    if (response.status === 429) {
      const delay = response.headers.get("retry-after");
      const seconds = delay && /^\d{1,5}$/.test(delay) ? Math.min(Number(delay), 3600) : undefined;
      options.onRateLimit?.(seconds);
      throw new NbaProviderError("RATE_LIMIT", seconds);
    }
    if (!response.ok) throw new NbaProviderError("UPSTREAM");
    try { return await response.json(); }
    catch { throw new NbaProviderError("INVALID_RESPONSE"); }
  }

  return {
    async listGamesByDate(date: string): Promise<NbaGame[]> {
      if (!isValidScheduleDate(date)) throw new RangeError("Invalid NBA schedule date");
      const validated = gamesPayloadSchema.safeParse(await request("/v1/games", date));
      if (!validated.success || validated.data.date !== date) throw new NbaProviderError("INVALID_RESPONSE");
      const games = validated.data.scoreboard.games.map((game) => normalizeGame(game, date));
      const seen = new Set<number>();
      for (const game of games) {
        if (!Number.isSafeInteger(game.id) || seen.has(game.id)) throw new NbaProviderError("INVALID_RESPONSE");
        seen.add(game.id);
      }
      return games.sort((a, b) => (a.tipoffAt ?? "").localeCompare(b.tipoffAt ?? "") || a.id - b.id);
    },

    async listTeams(): Promise<NbaTeam[]> {
      const validated = teamsPayloadSchema.safeParse(await request("/v1/teams"));
      if (!validated.success) throw new NbaProviderError("INVALID_RESPONSE");
      const found = new Map<string, NbaTeam>();
      for (const raw of validated.data.teams) {
        const known = findTeam(raw.abbreviation);
        if (!known) continue; // Exclude historical/non-current franchises.
        found.set(known.abbreviation, {
          id: raw.id,
          name: raw.nickname ?? known.name,
          fullName: known.name,
          abbreviation: known.abbreviation,
          city: raw.city ?? "",
          conference: known.conference,
          division: "",
        });
      }
      if (found.size !== 30) throw new NbaProviderError("INVALID_RESPONSE");
      return [...found.values()].sort((a, b) => a.fullName.localeCompare(b.fullName));
    },
  };
}
