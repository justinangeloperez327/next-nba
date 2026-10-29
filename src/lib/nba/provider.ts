import { gamesPageSchema, normalizeGame, normalizeTeam, teamsPageSchema } from "./schemas.ts";
import { isValidScheduleDate } from "./date.ts";
import type { NbaGame, NbaProvider, NbaTeam } from "./types.ts";

const API_BASE = "https://api.balldontlie.io";
const MAX_GAME_PAGES = 3;
const REQUEST_TIMEOUT_MS = 8_000;

export type NbaProviderErrorCode =
  | "NOT_CONFIGURED"
  | "AUTH"
  | "RATE_LIMIT"
  | "TIMEOUT"
  | "NETWORK"
  | "UPSTREAM"
  | "INVALID_RESPONSE";

export class NbaProviderError extends Error {
  readonly code: NbaProviderErrorCode;
  readonly retryAfterSeconds: number | undefined;

  constructor(code: NbaProviderErrorCode, retryAfterSeconds?: number) {
    super(code);
    this.name = "NbaProviderError";
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export type ProviderOptions = {
  apiKey?: string;
  fetcher?: typeof fetch;
};

function safeRetryAfter(header: string | null): number | undefined {
  if (!header || !/^\d{1,4}$/.test(header)) return undefined;
  return Math.min(Number(header), 3600);
}

export function createBalldontlieProvider(options: ProviderOptions = {}): NbaProvider {
  // The key is read on the server only. Do not expose it as NEXT_PUBLIC_*.
  const apiKey = options.apiKey ?? process.env.BALLDONTLIE_API_KEY;
  const fetcher = options.fetcher ?? fetch;

  async function request(url: URL): Promise<unknown> {
    if (!apiKey?.trim()) throw new NbaProviderError("NOT_CONFIGURED");
    let response: Response;
    try {
      response = await fetcher(url, {
        method: "GET",
        headers: { Authorization: apiKey, Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
        throw new NbaProviderError("TIMEOUT");
      }
      throw new NbaProviderError("NETWORK");
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) throw new NbaProviderError("AUTH");
      if (response.status === 429) {
        throw new NbaProviderError("RATE_LIMIT", safeRetryAfter(response.headers.get("retry-after")));
      }
      throw new NbaProviderError("UPSTREAM");
    }

    try {
      return await response.json();
    } catch {
      throw new NbaProviderError("INVALID_RESPONSE");
    }
  }

  return {
    async listGamesByDate(date: string): Promise<NbaGame[]> {
      if (!isValidScheduleDate(date)) throw new RangeError("Invalid NBA schedule date");
      const results: NbaGame[] = [];
      const visited = new Set<number>();
      let cursor: number | undefined;

      for (let page = 0; page < MAX_GAME_PAGES; page++) {
        const url = new URL("/v1/games", API_BASE);
        url.searchParams.append("dates[]", date);
        url.searchParams.set("per_page", "100");
        if (cursor !== undefined) url.searchParams.set("cursor", String(cursor));
        const parsed = gamesPageSchema.safeParse(await request(url));
        if (!parsed.success) throw new NbaProviderError("INVALID_RESPONSE");

        for (const raw of parsed.data.data) {
          // Avoid duplicates if an upstream cursor overlaps earlier results.
          if (!visited.has(raw.id)) {
            results.push(normalizeGame(raw));
            visited.add(raw.id);
          }
        }
        const nextCursor = parsed.data.meta?.next_cursor;
        if (nextCursor == null) return results.sort((a, b) =>
          (a.tipoffAt ?? a.date).localeCompare(b.tipoffAt ?? b.date) || a.id - b.id
        );
        if (cursor === nextCursor) throw new NbaProviderError("INVALID_RESPONSE");
        cursor = nextCursor;
      }
      // Do not silently return an incomplete slate after exhausting the safety cap.
      throw new NbaProviderError("INVALID_RESPONSE");
    },

    async listTeams(): Promise<NbaTeam[]> {
      const parsed = teamsPageSchema.safeParse(await request(new URL("/v1/teams", API_BASE)));
      if (!parsed.success) throw new NbaProviderError("INVALID_RESPONSE");
      return parsed.data.data.map(normalizeTeam).sort((a, b) => a.fullName.localeCompare(b.fullName));
    },
  };
}
