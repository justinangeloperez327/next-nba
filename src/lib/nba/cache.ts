import { NbaProviderError } from "./provider.ts";
import { gameCacheSeconds, retryDelaySeconds } from "./polling.ts";
import type { NbaGame, NbaProvider, NbaTeam } from "./types.ts";

export type CacheResult<T> = {
  data: T;
  fetchedAt: string;
  stale: boolean;
  ttlSeconds: number;
  retryAfterSeconds?: number;
};
type Entry<T> = { data: T; fetchedAt: string; expiresAt: number };
type Failure = { error: NbaProviderError; retryAt: number; count: number };

export class NbaQuotaGuard {
  private readonly requests: number[] = [];
  private blockedUntil = 0;

  private readonly now: () => number;
  private readonly limit: number;

  constructor(now: () => number = Date.now, limit = 4) {
    this.now = now;
    this.limit = limit;
  }

  beforeRequest(): void {
    const time = this.now();
    if (time < this.blockedUntil) {
      throw new NbaProviderError("RATE_LIMIT", Math.ceil((this.blockedUntil - time) / 1000));
    }
    while (this.requests.length && this.requests[0] <= time - 60_000) this.requests.shift();
    if (this.requests.length >= this.limit) {
      throw new NbaProviderError("RATE_LIMIT", Math.max(1, Math.ceil((this.requests[0] + 60_000 - time) / 1000)));
    }
    this.requests.push(time);
  }

  block(seconds: number): void {
    this.blockedUntil = Math.max(this.blockedUntil, this.now() + Math.max(1, seconds) * 1000);
  }
}

export class NbaFeedCache {
  private readonly games = new Map<string, Entry<NbaGame[]>>();
  private readonly pending = new Map<string, Promise<CacheResult<NbaGame[]>>>();
  private readonly failures = new Map<string, Failure>();
  private teams: Entry<NbaTeam[]> | undefined;
  private teamsPending: Promise<CacheResult<NbaTeam[]>> | undefined;

  private readonly provider: NbaProvider;
  private readonly now: () => number;

  constructor(provider: NbaProvider, now: () => number = Date.now) {
    this.provider = provider;
    this.now = now;
  }

  async getGames(date: string): Promise<CacheResult<NbaGame[]>> {
    const entry = this.games.get(date);
    const time = this.now();
    if (entry && time < entry.expiresAt) {
      return this.result(entry, Math.max(1, Math.ceil((entry.expiresAt - time) / 1000)), false);
    }

    const previousFailure = this.failures.get(date);
    if (previousFailure && time < previousFailure.retryAt) {
      const seconds = Math.ceil((previousFailure.retryAt - time) / 1000);
      if (entry) return this.result(entry, 15, true, seconds);
      throw new NbaProviderError(previousFailure.error.code, seconds);
    }

    const pending = this.pending.get(date);
    if (pending) return pending;

    const task = (async (): Promise<CacheResult<NbaGame[]>> => {
      try {
        const data = await this.provider.listGamesByDate(date);
        const fetchedAt = new Date(this.now()).toISOString();
        const ttlSeconds = gameCacheSeconds(data, date, new Date(this.now()));
        const fresh = { data, fetchedAt, expiresAt: this.now() + ttlSeconds * 1000 };
        this.games.delete(date);
        this.games.set(date, fresh);
        if (this.games.size > 64) {
          const first = this.games.keys().next().value;
          if (first !== undefined) { this.games.delete(first); this.failures.delete(first); }
        }
        this.failures.delete(date);
        return this.result(fresh, ttlSeconds, false);
      } catch (unknownError) {
        const error = unknownError instanceof NbaProviderError ? unknownError : new NbaProviderError("UPSTREAM");
        const count = (this.failures.get(date)?.count ?? 0) + 1;
        const retry = retryDelaySeconds(count, error.retryAfterSeconds);
        // Avoid retaining an unbounded failure key per arbitrary request date.
        this.failures.delete(date);
        this.failures.set(date, { error, retryAt: this.now() + retry * 1000, count });
        if (this.failures.size > 128) {
          const oldest = this.failures.keys().next().value;
          if (oldest !== undefined) this.failures.delete(oldest);
        }
        const old = this.games.get(date);
        // Never serve indefinitely old live scores or stale data when the
        // provider explicitly rejects the configured credentials.
        if (old && this.now() - Date.parse(old.fetchedAt) <= 6 * 3_600_000 &&
            error.code !== "AUTH" && error.code !== "NOT_CONFIGURED") {
          return this.result(old, 15, true, retry);
        }
        throw new NbaProviderError(error.code, retry);
      }
    })();

    this.pending.set(date, task);
    try { return await task; } finally { this.pending.delete(date); }
  }

  async getTeams(): Promise<CacheResult<NbaTeam[]>> {
    if (this.teams && this.now() < this.teams.expiresAt) {
      return this.result(this.teams, Math.max(1, Math.ceil((this.teams.expiresAt - this.now()) / 1000)), false);
    }
    if (this.teamsPending) return this.teamsPending;
    const task = (async (): Promise<CacheResult<NbaTeam[]>> => {
      const data = await this.provider.listTeams();
      const ttlSeconds = 86_400;
      const fresh = { data, fetchedAt: new Date(this.now()).toISOString(), expiresAt: this.now() + ttlSeconds * 1000 };
      this.teams = fresh;
      return this.result(fresh, ttlSeconds, false);
    })();
    this.teamsPending = task;
    try { return await task; } finally { this.teamsPending = undefined; }
  }

  private result<T>(item: Entry<T>, ttlSeconds: number, stale: boolean, retryAfterSeconds?: number): CacheResult<T> {
    return { data: item.data, fetchedAt: item.fetchedAt, ttlSeconds, stale,
      ...(retryAfterSeconds ? { retryAfterSeconds } : {}) };
  }
}
