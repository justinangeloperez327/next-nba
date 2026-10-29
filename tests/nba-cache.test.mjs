import assert from "node:assert/strict";
import test from "node:test";
import { NbaFeedCache, NbaQuotaGuard } from "../src/lib/nba/cache.ts";
import { NbaProviderError, createBalldontlieProvider } from "../src/lib/nba/provider.ts";
import { gameCacheSeconds, retryDelaySeconds } from "../src/lib/nba/polling.ts";
import { serveGames } from "../src/lib/nba/http.ts";

const date = "2026-10-29";
const nowAt = "2026-10-29T20:00:00.000Z";
const game = (status, tipoffAt = "2026-10-29T20:30:00.000Z") => ({
  id: 1, date, season: 2026, tipoffAt, status,
  statusText: status, period: null, clock: null, postseason: false,
  homeScore: 0, awayScore: 0,
  homeTeam: { id: 1, fullName: "Boston Celtics", name: "Celtics", abbreviation: "BOS",
    city: "Boston", conference: "Eastern", division: "Atlantic" },
  awayTeam: { id: 2, fullName: "Los Angeles Lakers", name: "Lakers", abbreviation: "LAL",
    city: "Los Angeles", conference: "Western", division: "Pacific" },
});

test("game-aware TTL: live 30s, soon 60s, scheduled 5m, empty 15m, final 2m, historical 1d", () => {
  const current = new Date(nowAt);
  assert.equal(gameCacheSeconds([game("in_progress")], date, current), 30);
  assert.equal(gameCacheSeconds([game("scheduled")], date, current), 60);
  assert.equal(gameCacheSeconds([game("scheduled", "2026-10-30T05:00:00.000Z")], date, current), 300);
  assert.equal(gameCacheSeconds([], date, current), 900);
  assert.equal(gameCacheSeconds([game("final")], date, current), 120);
  assert.equal(gameCacheSeconds([game("delayed")], date, current), 60);
  assert.equal(gameCacheSeconds([game("final")], "2026-10-25", current), 86400);
});

test("exponential backoff caps at 5m, respecting provider Retry-After", () => {
  assert.equal(retryDelaySeconds(1), 30);
  assert.equal(retryDelaySeconds(2), 60);
  assert.equal(retryDelaySeconds(5), 300);
  assert.equal(retryDelaySeconds(20), 300);
  assert.equal(retryDelaySeconds(1, 180), 180);
});

test("same-key concurrent loads coalesce and successful results remain cached", async () => {
  let time = Date.parse(nowAt);
  let calls = 0;
  let release;
  const deferred = new Promise((resolve) => { release = resolve; });
  const provider = {
    async listGamesByDate() { calls++; await deferred; return [game("in_progress")]; },
    async listTeams() { return []; },
  };
  const cache = new NbaFeedCache(provider, () => time);
  const first = cache.getGames(date);
  const second = cache.getGames(date);
  assert.equal(calls, 1);
  release();
  const [a, b] = await Promise.all([first, second]);
  assert.deepEqual(a, b);
  assert.equal(a.stale, false);
  assert.equal(a.ttlSeconds, 30);
  assert.equal((await cache.getGames(date)).ttlSeconds, 30);
  assert.equal(calls, 1);
  time += 30_001;
  await cache.getGames(date);
  assert.equal(calls, 2);
});

test("recoverable upstream error returns stale scores and respects cooldown", async () => {
  let time = Date.parse(nowAt);
  let calls = 0;
  const provider = {
    async listGamesByDate() {
      calls++;
      if (calls > 1) throw new NbaProviderError("RATE_LIMIT", 90);
      return [game("in_progress")];
    },
    async listTeams() { return []; },
  };
  const cache = new NbaFeedCache(provider, () => time);
  const original = await cache.getGames(date);
  time += 30_010;
  const stale = await cache.getGames(date);
  assert.equal(stale.stale, true);
  assert.equal(stale.fetchedAt, original.fetchedAt);
  assert.equal(stale.retryAfterSeconds, 90);
  await cache.getGames(date);
  assert.equal(calls, 2);
  const response = await serveGames(new Request("https://example.test/api/games?date=" + date),
    provider, new Date(time), cache);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-data-stale"), "1");
  assert.match(response.headers.get("cache-control"), /s-maxage=15/);
  assert.equal((await response.json()).stale, true);
});

test("cold upstream failure is throttled with a safe 503 and Retry-After", async () => {
  let calls = 0;
  const provider = {
    async listGamesByDate() { calls++; throw new NbaProviderError("RATE_LIMIT", 50); },
    async listTeams() { return []; },
  };
  const cache = new NbaFeedCache(provider, () => Date.parse(nowAt));
  const first = await serveGames(new Request("https://example.test/api/games?date=" + date),
    provider, new Date(nowAt), cache);
  const second = await serveGames(new Request("https://example.test/api/games?date=" + date),
    provider, new Date(nowAt), cache);
  assert.equal(first.status, 503);
  assert.equal(second.status, 503);
  assert.equal(second.headers.get("retry-after"), "50");
  assert.equal(calls, 1);
});

test("quota guard limits upstream requests per runtime and resets after a minute", () => {
  let time = 1_000_000;
  const guard = new NbaQuotaGuard(() => time, 4);
  for (let i = 0; i < 4; i++) guard.beforeRequest();
  assert.throws(() => guard.beforeRequest(), (error) =>
    error instanceof NbaProviderError && error.code === "RATE_LIMIT" && error.retryAfterSeconds === 60);
  time += 60_000;
  assert.doesNotThrow(() => guard.beforeRequest());
  guard.block(80);
  assert.throws(() => guard.beforeRequest(), (error) =>
    error instanceof NbaProviderError && error.retryAfterSeconds === 80);
  time += 80_000;
  assert.doesNotThrow(() => guard.beforeRequest());
});

test("each upstream cursor page consumes its own budget token", async () => {
  let taken = 0;
  let requested = 0;
  const upstream = async () => {
    requested++;
    return Response.json({ data: [], meta: { next_cursor: requested === 1 ? 10 : null } });
  };
  const provider = createBalldontlieProvider({
    apiKey: "test",
    fetcher: upstream,
    beforeRequest() { taken++; },
  });
  await provider.listGamesByDate(date);
  assert.equal(requested, 2);
  assert.equal(taken, 2);
});

test("local quota error retains RATE_LIMIT code rather than being mapped to NETWORK", async () => {
  const provider = createBalldontlieProvider({
    apiKey: "test",
    beforeRequest: () => { throw new NbaProviderError("RATE_LIMIT", 60); },
    fetcher: async () => { throw new Error("Should not call upstream"); },
  });
  await assert.rejects(provider.listGamesByDate(date), (error) =>
    error instanceof NbaProviderError && error.code === "RATE_LIMIT");
});

test("provider 429 triggers shared cooldown callback", async () => {
  let callback;
  const provider = createBalldontlieProvider({
    apiKey: "test",
    fetcher: async () => new Response(null, { status: 429, headers: { "Retry-After": "45" } }),
    onRateLimit(seconds) { callback = seconds; },
  });
  await assert.rejects(provider.listGamesByDate(date), (error) =>
    error instanceof NbaProviderError && error.retryAfterSeconds === 45);
  assert.equal(callback, 45);
});

test("team requests deduplicate and cache results for 24 hours", async () => {
  let calls = 0;
  let time = Date.parse(nowAt);
  const provider = {
    async listGamesByDate() { return []; },
    async listTeams() { calls++; return [{ id: 1 }]; },
  };
  const cache = new NbaFeedCache(provider, () => time);
  await Promise.all([cache.getTeams(), cache.getTeams()]);
  await cache.getTeams();
  assert.equal(calls, 1);
  time += 86_400_001;
  await cache.getTeams();
  assert.equal(calls, 2);
});

test("unknown or missing key never exposes secrets through responses", async () => {
  const provider = createBalldontlieProvider({ apiKey: " " });
  const cache = new NbaFeedCache(provider, () => Date.parse(nowAt));
  const response = await serveGames(
    new Request("https://example.test/api/games?date=" + date), provider, new Date(nowAt), cache);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error.code, "NOT_CONFIGURED");
});
