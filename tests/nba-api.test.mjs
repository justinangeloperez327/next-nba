import assert from "node:assert/strict";
import test from "node:test";
import { createBalldontlieProvider, NbaProviderError } from "../src/lib/nba/provider.ts";
import { getNbaScheduleDate, isValidScheduleDate } from "../src/lib/nba/date.ts";
import { serveGames, serveTeams } from "../src/lib/nba/http.ts";

function team(id = 1, overrides = {}) {
  return {
    id,
    name: "Celtics",
    full_name: "Boston Celtics",
    abbreviation: "BOS",
    city: "Boston",
    conference: "East",
    division: "Atlantic",
    ...overrides,
  };
}

function game(id = 100, overrides = {}) {
  return {
    id,
    date: "2026-10-29",
    datetime: "2026-10-29T23:30:00.000Z",
    season: 2026,
    status: "2nd Qtr",
    status_state: "in_progress",
    period: 2,
    time: "05:12",
    postseason: false,
    home_team_score: 42,
    visitor_team_score: 41,
    home_team: team(),
    visitor_team: team(2, {
      name: "Lakers",
      full_name: "Los Angeles Lakers",
      abbreviation: "LAL",
      city: "Los Angeles",
      conference: "West",
      division: "Pacific",
    }),
    ...overrides,
  };
}

function mockedProvider(response) {
  const requests = [];
  const fetcher = async (url, options) => {
    requests.push({ url: String(url), options });
    return typeof response === "function" ? response(url, options, requests.length) : response;
  };
  return { provider: createBalldontlieProvider({ apiKey: "test-private-key", fetcher }), requests };
}

test("date validation rejects impossible calendar dates and malformed input", () => {
  assert.equal(isValidScheduleDate("2024-02-29"), true);
  for (const input of ["2026-02-29", "2026-13-01", "2026-1-1", "2026-10-29junk", ""]) {
    assert.equal(isValidScheduleDate(input), false, input);
  }
});

test("NBA schedule defaults to New York date across DST changes", () => {
  assert.equal(getNbaScheduleDate(new Date("2026-10-29T02:00:00.000Z")), "2026-10-28");
  assert.equal(getNbaScheduleDate(new Date("2026-11-01T05:30:00.000Z")), "2026-11-01");
});

test("game request uses the private Authorization header, exact date, per_page=100", async () => {
  const { provider, requests } = mockedProvider(Response.json({
    data: [game()],
    meta: { per_page: 100, next_cursor: null },
  }));
  const games = await provider.listGamesByDate("2026-10-29");
  assert.equal(games.length, 1);
  assert.equal(games[0].status, "in_progress");
  assert.equal(games[0].homeScore, 42);
  assert.equal(games[0].awayTeam.abbreviation, "LAL");
  assert.equal(games[0].awayTeam.conference, "Western");
  assert.equal(requests.length, 1);
  const request = requests[0];
  assert.equal(new URL(request.url).origin, "https://api.balldontlie.io");
  assert.equal(new URL(request.url).pathname, "/v1/games");
  assert.equal(new URL(request.url).searchParams.get("dates[]"), "2026-10-29");
  assert.equal(new URL(request.url).searchParams.get("per_page"), "100");
  assert.equal(request.options.headers.Authorization, "test-private-key");
  assert.equal(request.options.cache, "no-store");
  assert.equal(request.url.includes("test-private-key"), false);
});

test("cursor pagination fetches subsequent pages without duplicating game IDs", async () => {
  const { provider, requests } = mockedProvider((url, options, count) => {
    if (count === 1) {
      return Response.json({ data: [game(100)], meta: { next_cursor: 100 } });
    }
    return Response.json({ data: [game(100), game(101)], meta: { next_cursor: null } });
  });
  const games = await provider.listGamesByDate("2026-10-29");
  assert.deepEqual(games.map(({ id }) => id), [100, 101]);
  assert.equal(requests.length, 2);
  assert.equal(new URL(requests[1].url).searchParams.get("cursor"), "100");
});

test("repeated cursor and excessive pagination fail instead of returning incomplete data", async () => {
  const { provider } = mockedProvider(Response.json({ data: [game()], meta: { next_cursor: 1 } }));
  await assert.rejects(provider.listGamesByDate("2026-10-29"), (error) =>
    error instanceof NbaProviderError && error.code === "INVALID_RESPONSE");
});

test("missing scores stay null; missing status_state stays unknown", async () => {
  const raw = game(100, {
    status_state: undefined,
    home_team_score: null,
    visitor_team_score: undefined,
    datetime: null,
    postponed: false,
  });
  const { provider } = mockedProvider(Response.json({ data: [raw] }));
  const [value] = await provider.listGamesByDate("2026-10-29");
  assert.equal(value.homeScore, null);
  assert.equal(value.awayScore, null);
  assert.equal(value.tipoffAt, null);
  assert.equal(value.status, "unknown");
});

test("postponed games retain postponed state if lifecycle field is missing", async () => {
  const { provider } = mockedProvider(Response.json({ data: [game(100, { status_state: undefined, postponed: true })] }));
  const [value] = await provider.listGamesByDate("2026-10-29");
  assert.equal(value.status, "postponed");
});

test("teams endpoint validates and normalizes teams", async () => {
  const { provider, requests } = mockedProvider(Response.json({ data: [team(1), team(2, {
    name: "Warriors", full_name: "Golden State Warriors", abbreviation: "GSW",
    city: "Golden State", conference: "West", division: "Pacific",
  })] }));
  const result = await provider.listTeams();
  assert.equal(requests.length, 1);
  assert.equal(new URL(requests[0].url).pathname, "/v1/teams");
  assert.deepEqual(result.map((item) => item.fullName), ["Boston Celtics", "Golden State Warriors"]);
  assert.equal(result[1].conference, "Western");
});

test("fails closed without an API key and does not invoke fetch", async () => {
  let called = false;
  const provider = createBalldontlieProvider({
    apiKey: " ",
    fetcher: async () => { called = true; return Response.json({ data: [] }); },
  });
  await assert.rejects(provider.listGamesByDate("2026-10-29"), (error) =>
    error instanceof NbaProviderError && error.code === "NOT_CONFIGURED");
  assert.equal(called, false);
});

test("HTTP API rejects invalid and duplicate dates before contacting provider", async () => {
  let invoked = false;
  const provider = {
    async listGamesByDate() { invoked = true; return []; },
    async listTeams() { return []; },
  };
  for (const query of ["date=2026-02-29", "date=invalid", "date=2026-10-29&date=2026-10-30"]) {
    const res = await serveGames(new Request("https://example.test/api/games?" + query), provider);
    assert.equal(res.status, 400);
    assert.equal((await res.json()).error.code, "INVALID_DATE");
  }
  assert.equal(invoked, false);
});

test("HTTP API returns typed payload, cached headers and default NBA date", async () => {
  const provider = {
    async listGamesByDate(date) { return [ { id: 42, date } ]; },
    async listTeams() { return []; },
  };
  const res = await serveGames(new Request("https://example.test/api/games"), provider,
    new Date("2026-10-29T02:00:00Z"));
  assert.equal(res.status, 200);
  assert.match(res.headers.get("cache-control"), /s-maxage=60/);
  const payload = await res.json();
  assert.equal(payload.date, "2026-10-28");
  assert.equal(payload.source, "balldontlie");
  assert.deepEqual(payload.games, [{ id: 42, date: "2026-10-28" }]);
  assert.ok(Date.parse(payload.fetchedAt));
});

test("HTTP teams response is cacheable for 24 hours", async () => {
  const res = await serveTeams({
    listTeams: async () => [],
    listGamesByDate: async () => [],
  });
  assert.equal(res.status, 200);
  assert.match(res.headers.get("cache-control"), /s-maxage=86400/);
});

test("HTTP rate limits sanitize messages and forward safe Retry-After", async () => {
  const { provider } = mockedProvider(new Response("secret upstream body", {
    status: 429,
    headers: { "Retry-After": "24" },
  }));
  const response = await serveGames(new Request("https://example.test/api/games?date=2026-10-29"), provider);
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("retry-after"), "24");
  assert.equal(response.headers.get("cache-control"), "no-store");
  const body = JSON.stringify(await response.json());
  assert.equal(body.includes("secret"), false);
  assert.equal(body.includes("test-private-key"), false);
});

test("401 and malformed game payload return safe gateway errors", async () => {
  for (const upstream of [
    new Response("some key-specific detail", { status: 401 }),
    Response.json({ data: [{ id: "invalid" }] }),
  ]) {
    const { provider } = mockedProvider(upstream);
    const res = await serveGames(new Request("https://example.test/api/games?date=2026-10-29"), provider);
    assert.equal(res.status, 502);
    const body = await res.json();
    assert.ok(["AUTH", "INVALID_RESPONSE"].includes(body.error.code));
    assert.equal(JSON.stringify(body).includes("some key-specific"), false);
  }
});

test("network failures and timeouts are mapped to stable codes", async () => {
  const errors = [
    [new Error("internal request with key"), "NETWORK", 502],
    [new DOMException("aborted", "TimeoutError"), "TIMEOUT", 504],
  ];
  for (const [reason, code, status] of errors) {
    const provider = createBalldontlieProvider({
      apiKey: "secret",
      fetcher: async () => { throw reason; },
    });
    const res = await serveTeams(provider);
    assert.equal(res.status, status);
    assert.equal((await res.json()).error.code, code);
  }
});
