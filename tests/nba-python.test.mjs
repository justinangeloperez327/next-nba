import assert from "node:assert/strict";
import test from "node:test";
import { createNbaPythonProvider } from "../src/lib/nba/nba-python.ts";
import { NbaProviderError } from "../src/lib/nba/provider.ts";
import { makeNbaProvider, readProviderConfig } from "../src/lib/nba/selection.ts";
import { serveGames } from "../src/lib/nba/http.ts";

const home = { teamId: 1610612738, teamTricode: "BOS", teamName: "Celtics", teamCity: "Boston", score: 101 };
const away = { teamId: 1610612747, teamTricode: "LAL", teamName: "Lakers", teamCity: "Los Angeles", score: 98 };
const makeGame = (data = {}) => ({
  gameId: "0022600001", gameStatus: 2, gameStatusText: "Q3", gameTimeUTC: "2026-10-29T23:30:00Z",
  period: 3, gameClock: "PT04M21.00S", homeTeam: home, awayTeam: away, ...data,
});
const respond = (games) => Response.json({ date: "2026-10-29", mode: "live", scoreboard: { games } });

function makeProvider(fetcher, extra = {}) {
  return createNbaPythonProvider({
    baseUrl: "http://nba-api-bridge:8765", token: "bridge-secret", fetcher, ...extra,
  });
}

test("third provider is opt-in and existing providers remain default", () => {
  assert.equal(readProviderConfig({}).source, "balldontlie");
  assert.equal(readProviderConfig({ NBA_DATA_PROVIDER: "api-nba" }).source, "api-nba");
  assert.equal(readProviderConfig({ NBA_DATA_PROVIDER: "nba-api" }).source, "nba-api");
  assert.equal(makeNbaProvider({ env: { NBA_DATA_PROVIDER: "nba-api" } }).source, "nba-api");
  assert.throws(() => readProviderConfig({ NBA_DATA_PROVIDER: "unsupported" }));
});

test("bridge auth is server-only and games normalize to existing DTO", async () => {
  let calls = 0;
  const provider = makeProvider(async (url, options) => {
    calls++;
    assert.equal(new URL(url).pathname, "/v1/games");
    assert.equal(new URL(url).searchParams.get("date"), "2026-10-29");
    assert.equal(options.headers.Authorization, "Bearer bridge-secret");
    assert.equal(options.cache, "no-store");
    assert.equal(String(url).includes("bridge-secret"), false);
    return respond([makeGame()]);
  });
  const results = await provider.listGamesByDate("2026-10-29");
  assert.equal(calls, 1);
  assert.equal(results[0].id, 22600001);
  assert.equal(results[0].season, 2026);
  assert.equal(results[0].status, "in_progress");
  assert.equal(results[0].clock, "4:21");
  assert.equal(results[0].homeTeam.fullName, "Boston Celtics");
  assert.equal(results[0].awayTeam.abbreviation, "LAL");
  assert.equal(results[0].homeScore, 101);
});

test("scheduled and postponed scores are null rather than made-up zeroes", async () => {
  const provider = makeProvider(async () => respond([
    makeGame({ gameId: "0022600002", gameStatus: 1, gameStatusText: "7:30 pm ET",
      homeTeam: { ...home, score: 0 }, awayTeam: { ...away, score: 0 } }),
    makeGame({ gameId: "0022600003", gameStatus: 1, gameStatusText: "Postponed" }),
  ]));
  const results = await provider.listGamesByDate("2026-10-29");
  assert.deepEqual(results.map(g => g.status), ["scheduled", "postponed"]);
  assert.deepEqual(results.map(g => g.homeScore), [null, null]);
});

test("final and playoff status are normalized from real game metadata", async () => {
  const provider = makeProvider(async () => respond([makeGame({
    gameId: "0042600001", gameStatus: 3, gameStatusText: "Final", homeTeam: home, awayTeam: away,
  })]));
  const result = (await provider.listGamesByDate("2026-10-29"))[0];
  assert.equal(result.status, "final");
  assert.equal(result.postseason, true);
  assert.equal(result.homeScore, 101);
});

test("malformed or duplicate games cannot masquerade as an empty slate", async () => {
  const cases = [
    { date: "2026-10-29", mode: "live", scoreboard: {} },
    { date: "2026-10-28", mode: "live", scoreboard: { games: [] } },
    { date: "2026-10-29", mode: "live", scoreboard: { games: [{ gameId: "broken" }] } },
    { date: "2026-10-29", mode: "live", scoreboard: { games: [makeGame(), makeGame()] } },
  ];
  for (const body of cases) {
    const provider = makeProvider(async () => Response.json(body));
    await assert.rejects(provider.listGamesByDate("2026-10-29"),
      e => e instanceof NbaProviderError && e.code === "INVALID_RESPONSE");
  }
});

test("missing bridge settings fail closed, not an unauthenticated upstream call", async () => {
  let called = false;
  const provider = createNbaPythonProvider({ baseUrl: " ", token: "", fetcher: async () => {
    called = true; return respond([]);
  } });
  await assert.rejects(provider.listGamesByDate("2026-10-29"),
    e => e instanceof NbaProviderError && e.code === "NOT_CONFIGURED");
  assert.equal(called, false);
});

test("upstream service 502 and 401 produce safe public API errors", async () => {
  for (const [status, code] of [[502, "UPSTREAM"], [401, "AUTH"]]) {
    const provider = makeProvider(async () => new Response("bridge-private-data", { status }));
    const response = await serveGames(
      new Request("https://next-nba.test/api/games?date=2026-10-29"),
      provider, new Date("2026-10-29T20:00:00Z"), undefined, "nba-api",
    );
    assert.equal((await response.json()).error.code, code);
    assert.equal(response.headers.get("cache-control"), "no-store");
  }
});

test("unrelated/unknown teams are not silently assigned to existing franchises", async () => {
  const provider = makeProvider(async () => respond([makeGame({
    homeTeam: { ...home, teamTricode: "UNK" },
  })]));
  await assert.rejects(provider.listGamesByDate("2026-10-29"),
    e => e instanceof NbaProviderError && e.code === "INVALID_RESPONSE");
});

test("network and timeout errors are classified without leaking secrets", async () => {
  const provider = makeProvider(async () => { throw new Error("bridge-secret"); });
  await assert.rejects(provider.listGamesByDate("2026-10-29"),
    e => e instanceof NbaProviderError && e.code === "NETWORK");
  const slow = makeProvider(async () => { throw new DOMException("Timeout", "TimeoutError"); });
  await assert.rejects(slow.listGamesByDate("2026-10-29"),
    e => e instanceof NbaProviderError && e.code === "TIMEOUT");
});
