import assert from "node:assert/strict";
import test from "node:test";
import { createApiNbaProvider } from "../src/lib/nba/api-nba.ts";
import { readProviderConfig, makeNbaProvider } from "../src/lib/nba/selection.ts";
import { NbaProviderError } from "../src/lib/nba/provider.ts";
import { NbaFeedCache, NbaQuotaGuard } from "../src/lib/nba/cache.ts";
import { serveGames, serveTeams } from "../src/lib/nba/http.ts";

function team(id, code, name) {
  return { id, code, name, nickname: name.split(" ").at(-1), city: "",
    nbaFranchise: true, allStar: false };
}
function game(id, start, short = 1, other = {}) {
  return {
    id, league: "standard", season: 2026, date: { start, end: null },
    stage: 2, status: { short, long: short === 2 ? "In Play" : short === 3 ? "Finished" : "Not Started", clock: short === 2 ? "04:21" : null },
    periods: { current: short === 1 ? 0 : 2 },
    teams: { home: team(2, "BOS", "Boston Celtics"), visitors: team(17, "LAL", "Los Angeles Lakers") },
    scores: { home: { points: short === 1 ? null : 75 }, visitors: { points: short === 1 ? null : 70 } },
    ...other,
  };
}
const envelope = (response, errors = []) => Response.json({ get: "games", parameters: {}, errors, results: response.length, response });
function mockedProvider(reply, options = {}) {
  const calls = [];
  const provider = createApiNbaProvider({
    apiKey: "private-api-nba-key",
    fetcher: async (url, init) => {
      calls.push({ url: String(url), init });
      return typeof reply === "function" ? reply(url, init, calls.length) : reply;
    }, ...options,
  });
  return { provider, calls };
}

test("selection defaults to BALLDONTLIE and explicitly opts into API-NBA", () => {
  assert.deepEqual(readProviderConfig({}), { source: "balldontlie", plan: "free" });
  assert.deepEqual(readProviderConfig({ NBA_DATA_PROVIDER: "api-nba" }), { source: "api-nba", plan: "free" });
  assert.deepEqual(readProviderConfig({ NBA_DATA_PROVIDER: "api-nba", API_NBA_PLAN: "pro" }), { source: "api-nba", plan: "pro" });
  assert.throws(() => readProviderConfig({ NBA_DATA_PROVIDER: "unknown" }));
  assert.throws(() => readProviderConfig({ API_NBA_PLAN: "mega" }));
  assert.equal(makeNbaProvider({ env: {} }).source, "balldontlie");
  assert.equal(makeNbaProvider({ env: { NBA_DATA_PROVIDER: "api-nba" } }).source, "api-nba");
});

test("API-NBA reads x-apisports-key server side, fetches both UTC dates and filters Eastern day", async () => {
  const { provider, calls } = mockedProvider((url) => {
    const utc = new URL(url).searchParams.get("date");
    return utc === "2026-10-29" ? envelope([
      game(100, "2026-10-29T22:00:00.000Z", 2),
      game(101, "2026-10-29T02:00:00.000Z", 3), // October 28 in NY
    ]) : envelope([
      game(102, "2026-10-30T02:30:00.000Z", 1), // October 29 in NY
      game(103, "2026-10-30T23:00:00.000Z", 1), // October 30 in NY
      game(100, "2026-10-29T22:00:00.000Z", 2), // overlapping duplicate
    ]);
  });
  const games = await provider.listGamesByDate("2026-10-29");
  assert.deepEqual(games.map(g => g.id), [100, 102]);
  assert.deepEqual(games.map(g => g.date), ["2026-10-29", "2026-10-29"]);
  assert.equal(games[0].status, "in_progress");
  assert.equal(games[0].homeScore, 75);
  assert.equal(games[0].awayTeam.abbreviation, "LAL");
  assert.equal(games[1].status, "scheduled");
  assert.equal(games[1].awayScore, null);
  assert.equal(games[1].postseason, false);
  assert.equal(calls.length, 2);
  assert.deepEqual(calls.map(c => new URL(c.url).searchParams.get("date")), ["2026-10-29", "2026-10-30"]);
  for (const call of calls) {
    assert.equal(new URL(call.url).origin, "https://v2.nba.api-sports.io");
    assert.equal(new URL(call.url).searchParams.get("league"), "standard");
    assert.equal(call.init.headers["x-apisports-key"], "private-api-nba-key");
    assert.equal(call.init.cache, "no-store");
    assert.equal(call.url.includes("private-api-nba-key"), false);
  }
});

test("timezones and DST do not move scores to the wrong NBA date", async () => {
  const { provider } = mockedProvider((url) => {
    const date = new URL(url).searchParams.get("date");
    return envelope(date === "2026-11-01"
      ? [game(20, "2026-11-01T03:30:00.000Z", 3), game(21, "2026-11-01T06:30:00.000Z", 2)]
      : []);
  });
  const games = await provider.listGamesByDate("2026-11-01");
  assert.deepEqual(games.map(g => g.id), [21]);
});

test("known statuses normalize correctly; no guessed scores or unknown-state inference", async () => {
  const cases = [[1,"scheduled"],[2,"in_progress"],[3,"final"],[4,"postponed"],
    [5,"delayed"],[6,"canceled"],[7,"unknown"]];
  for (const [number, expected] of cases) {
    const { provider } = mockedProvider((url) => envelope(
      new URL(url).searchParams.get("date") === "2026-10-29" ?
        [game(100, "2026-10-29T23:30:00Z", number)] : []));
    const [g] = await provider.listGamesByDate("2026-10-29");
    assert.equal(g.status, expected);
    assert.equal(g.statusText, number === 2 ? "In Play" : number === 3 ? "Finished" : "Not Started");
    if (number === 1) assert.equal(g.homeScore, null);
  }
});

test("teams endpoint excludes historical and unrelated teams and normalizes current clubs", async () => {
  const { provider, calls } = mockedProvider(envelope([
    team(2, "BOS", "Boston Celtics"),
    team(17, "LAL", "Los Angeles Lakers"),
    team(999, "OLD", "Seattle SuperSonics"),
    { ...team(88, "ABA", "East All-Stars"), allStar: true },
    { ...team(89, "PHI", "Philadelphia 76ers"), nbaFranchise: false },
  ]));
  const found = await provider.listTeams();
  assert.deepEqual(found.map(t => t.abbreviation), ["BOS", "LAL"]);
  assert.equal(new URL(calls[0].url).pathname, "/teams");
  assert.equal(new URL(calls[0].url).searchParams.get("league"), "standard");
});

test("API-NBA HTTP 200 response errors are not treated as empty schedules", async () => {
  const { provider } = mockedProvider(envelope([], { token: "Forbidden" }));
  await assert.rejects(provider.listGamesByDate("2026-10-29"),
    error => error instanceof NbaProviderError && error.code === "UPSTREAM");
});

test("API-NBA 429 reports retry-after and quota exhaustion callbacks, no leaked secrets", async () => {
  let retry;
  let dailyExceeded = false;
  const { provider } = mockedProvider(new Response("private-api-nba-key", {
    status: 429,
    headers: { "retry-after": "45", "x-ratelimit-requests-remaining": "0" },
  }), { onRateLimit: n => { retry = n; }, onQuotaExhausted: () => { dailyExceeded = true; } });
  const res = await serveGames(new Request("https://test.local/api/games?date=2026-10-29"), provider);
  assert.equal(res.status, 503);
  assert.equal(res.headers.get("retry-after"), "45");
  assert.equal((await res.json()).error.code, "RATE_LIMIT");
  assert.equal(retry, 45);
  assert.equal(dailyExceeded, true);
});

test("API-NBA 403, invalid envelope, malformed and network errors map safely", async () => {
  for (const [response, expected] of [
    [new Response("secret", { status: 403 }), "AUTH"],
    [Response.json({ response: "no array" }), "INVALID_RESPONSE"],
    [Response.json({ errors: [], response: [{ id: "bad" }] }), "INVALID_RESPONSE"],
  ]) {
    const { provider } = mockedProvider(response);
    const res = await serveTeams(provider, undefined, "api-nba");
    assert.equal(res.status, 502);
    assert.equal((await res.json()).error.code, expected);
  }
  const { provider } = mockedProvider(async () => { throw new Error("secret upstream message"); });
  const result = await serveGames(new Request("https://test.local/api/games?date=2026-10-29"), provider);
  assert.equal(result.status, 502);
  assert.equal((await result.json()).error.code, "NETWORK");
});

test("missing API-NBA key fails closed and cannot fall back to BALLDONTLIE", async () => {
  let fetched = false;
  const provider = createApiNbaProvider({ apiKey: " ", fetcher: async () => {
    fetched = true;
    return envelope([]);
  }});
  const res = await serveGames(new Request("https://test.local/api/games?date=2026-10-29"), provider);
  assert.equal(res.status, 503);
  assert.equal((await res.json()).error.code, "NOT_CONFIGURED");
  assert.equal(fetched, false);
});

test("API-NBA free tier enforces one-hour cache minimum, source and remaining TTL", async () => {
  let time = Date.parse("2026-10-29T20:00:00Z");
  let calls = 0;
  const { provider } = mockedProvider((url) => {
    calls++;
    return envelope(new URL(url).searchParams.get("date") === "2026-10-29"
      ? [game(10, "2026-10-29T20:30:00Z", 2)] : []);
  });
  const cache = new NbaFeedCache(provider, () => time);
  const first = await serveGames(new Request("https://test.local/api/games?date=2026-10-29"),
    provider, new Date(time), cache, "api-nba");
  assert.equal(first.status, 200);
  assert.equal((await first.json()).source, "api-nba");
  assert.match(first.headers.get("cache-control"), /s-maxage=3600/);
  time += 20 * 60_000;
  await cache.getGames("2026-10-29");
  assert.equal(calls, 2);
  time += 41 * 60_000;
  await cache.getGames("2026-10-29");
  assert.equal(calls, 4);
});

test("API-NBA paid tier respects a 60s minimum; source is exposed on teams", async () => {
  const { provider } = mockedProvider((url) => new URL(url).pathname === "/teams"
    ? envelope([team(2, "BOS", "Boston Celtics")])
    : envelope([]), { plan: "pro" });
  assert.equal(provider.minimumGameCacheSeconds, 60);
  const teams = await serveTeams(provider, undefined, "api-nba");
  assert.equal(teams.status, 200);
  assert.equal((await teams.json()).source, "api-nba");
});

test("per-instance free daily allowance resets at UTC midnight", () => {
  let now = Date.parse("2026-10-29T23:59:00Z");
  const guard = new NbaQuotaGuard(() => now, 8, 2);
  guard.beforeRequest();
  guard.beforeRequest();
  assert.throws(() => guard.beforeRequest(), (error) =>
    error instanceof NbaProviderError && error.code === "RATE_LIMIT");
  now = Date.parse("2026-10-30T00:00:00Z");
  assert.doesNotThrow(() => guard.beforeRequest());
  guard.blockToNextUtcDay();
  assert.throws(() => guard.beforeRequest(), (error) =>
    error instanceof NbaProviderError && error.code === "RATE_LIMIT");
});
