import assert from "node:assert/strict";
import test from "node:test";
import { isSupportedScheduleDate } from "../src/lib/nba/date.ts";
import { NbaFeedCache } from "../src/lib/nba/cache.ts";
import { NbaProviderError } from "../src/lib/nba/provider.ts";
import { serveGames } from "../src/lib/nba/http.ts";

const now = new Date("2026-10-29T12:00:00.000Z");
const today = "2026-10-29";

test("supported date range rejects dates that waste provider quota", () => {
  assert.equal(isSupportedScheduleDate("1946-01-01", now), true);
  assert.equal(isSupportedScheduleDate(today, now), true);
  assert.equal(isSupportedScheduleDate("1945-12-31", now), false);
  assert.equal(isSupportedScheduleDate("9999-12-31", now), false);
  assert.equal(isSupportedScheduleDate("0000-01-01", now), false);
  assert.equal(isSupportedScheduleDate("2026-02-29", now), false);
  assert.equal(isSupportedScheduleDate("2027-10-31", now), false);
});

test("unsupported dates return 400 without contacting the NBA provider", async () => {
  let calls = 0;
  const provider = {
    async listGamesByDate() { calls++; return []; },
    async listTeams() { return []; },
  };
  for (const date of ["1945-12-31", "9999-12-31", "2027-10-31"]) {
    const response = await serveGames(new Request(`https://example.test/api/games?date=${date}`),
      provider, now);
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error.code, "INVALID_DATE");
  }
  assert.equal(calls, 0);
});

test("failed date lookup keys are bounded under repeated unique failures", async () => {
  const provider = {
    async listGamesByDate() { throw new NbaProviderError("RATE_LIMIT", 60); },
    async listTeams() { return []; },
  };
  const cache = new NbaFeedCache(provider, () => now.getTime());
  for (let i = 0; i < 220; i++) {
    const date = new Date(now.getTime() - i * 86_400_000).toISOString().slice(0, 10);
    await assert.rejects(cache.getGames(date), NbaProviderError);
  }
  assert.ok(cache.failures.size <= 128, "failure state must not grow without bounds");
});

test("six-hour-old live scores cannot be returned as a fresh fallback", async () => {
  let time = now.getTime();
  let calls = 0;
  const provider = {
    async listGamesByDate() {
      calls++;
      if (calls === 1) return [{ status: "in_progress" }];
      throw new NbaProviderError("UPSTREAM");
    },
    async listTeams() { return []; },
  };
  const cache = new NbaFeedCache(provider, () => time);
  await cache.getGames(today);
  time += 6 * 3_600_000 + 1;
  await assert.rejects(cache.getGames(today), NbaProviderError);
});

test("authorization failure never masks itself by serving previous cached scores", async () => {
  let time = now.getTime();
  let calls = 0;
  const provider = {
    async listGamesByDate() {
      calls++;
      if (calls === 1) return [{ status: "in_progress" }];
      throw new NbaProviderError("AUTH");
    },
    async listTeams() { return []; },
  };
  const cache = new NbaFeedCache(provider, () => time);
  await cache.getGames(today);
  time += 31_000;
  await assert.rejects(cache.getGames(today), (error) =>
    error instanceof NbaProviderError && error.code === "AUTH");
});
