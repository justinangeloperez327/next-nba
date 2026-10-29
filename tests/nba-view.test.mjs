import assert from "node:assert/strict";
import test from "node:test";
import {
  shiftScheduleDate,
  formatScheduleDate,
  formatTipoff,
  displayGameScore,
  getGameStatusLabel,
  isGameWinner,
  summarizeGames,
} from "../src/lib/nba/view.ts";

function makeGame(overrides = {}) {
  return {
    id: 101,
    date: "2026-10-29",
    tipoffAt: "2026-10-30T00:30:00.000Z",
    season: 2026,
    status: "scheduled",
    statusText: "2026-10-30T00:30:00.000Z",
    period: null,
    clock: null,
    postseason: false,
    homeTeam: { id: 1, name: "Celtics", fullName: "Boston Celtics", abbreviation: "BOS", city: "Boston", conference: "Eastern", division: "Atlantic" },
    awayTeam: { id: 2, name: "Lakers", fullName: "Los Angeles Lakers", abbreviation: "LAL", city: "Los Angeles", conference: "Western", division: "Pacific" },
    homeScore: 0,
    awayScore: 0,
    ...overrides,
  };
}

test("NBA calendar navigation handles month, year and leap-year boundaries", () => {
  assert.equal(shiftScheduleDate("2026-10-31", 1), "2026-11-01");
  assert.equal(shiftScheduleDate("2026-01-01", -1), "2025-12-31");
  assert.equal(shiftScheduleDate("2024-02-28", 1), "2024-02-29");
  assert.equal(shiftScheduleDate("2024-02-29", 1), "2024-03-01");
  assert.equal(shiftScheduleDate("2026-03-08", 1), "2026-03-09");
});

test("NBA calendar navigation rejects bad dates and offsets", () => {
  assert.throws(() => shiftScheduleDate("2026-02-29", 1), RangeError);
  assert.throws(() => shiftScheduleDate("invalid", -1), RangeError);
  assert.throws(() => shiftScheduleDate("2026-10-29", 999), RangeError);
  assert.throws(() => shiftScheduleDate("2026-10-29", 0.5), RangeError);
});

test("calendar date formatting does not drift with runtime time zone", () => {
  assert.equal(formatScheduleDate("2026-10-29"), "Thursday, October 29, 2026");
  assert.equal(formatScheduleDate("2026-02-29"), "Unknown date");
});

test("tipoff formatting uses NBA Eastern zone for SSR and handles missing times", () => {
  assert.match(formatTipoff("2026-10-30T00:30:00.000Z"), /8:30 PM EDT/);
  assert.match(formatTipoff("2026-12-30T00:30:00.000Z"), /7:30 PM EST/);
  assert.equal(formatTipoff(null), "Time TBD");
  assert.equal(formatTipoff("not-a-timestamp"), "Time TBD");
});

test("upcoming and canceled games never display unplayed zero scores", () => {
  assert.equal(displayGameScore(makeGame(), "home"), "—");
  assert.equal(displayGameScore(makeGame({ status: "postponed" }), "away"), "—");
  assert.equal(displayGameScore(makeGame({ status: "canceled" }), "home"), "—");
});

test("live and final games show actual zero and nonzero scores without guessing missing scores", () => {
  assert.equal(displayGameScore(makeGame({ status: "in_progress", homeScore: 0 }), "home"), "0");
  assert.equal(displayGameScore(makeGame({ status: "final", homeScore: 122, awayScore: 117 }), "home"), "122");
  assert.equal(displayGameScore(makeGame({ status: "final", awayScore: null }), "away"), "—");
});

test("live game status includes supplied quarter and clock only", () => {
  assert.equal(getGameStatusLabel(makeGame({ status: "in_progress", period: 3, clock: "07:21" })), "LIVE · Q3 · 07:21");
  assert.equal(getGameStatusLabel(makeGame({ status: "in_progress", period: null, clock: null })), "LIVE");
  assert.equal(getGameStatusLabel(makeGame({ status: "unknown" })), "Status unavailable");
  assert.equal(getGameStatusLabel(makeGame({ status: "postponed" })), "Postponed");
});

test("winner indicators require final status and two known scores", () => {
  assert.equal(isGameWinner(makeGame({ status: "in_progress", homeScore: 103, awayScore: 98 }), "home"), false);
  assert.equal(isGameWinner(makeGame({ status: "final", homeScore: 103, awayScore: 98 }), "home"), true);
  assert.equal(isGameWinner(makeGame({ status: "final", homeScore: 103, awayScore: 98 }), "away"), false);
  assert.equal(isGameWinner(makeGame({ status: "final", homeScore: 103, awayScore: 103 }), "home"), false);
  assert.equal(isGameWinner(makeGame({ status: "final", homeScore: 103, awayScore: null }), "home"), false);
});

test("summary counts are based on actual provider states", () => {
  assert.deepEqual(
    summarizeGames([
      makeGame(),
      makeGame({ id: 102, status: "in_progress" }),
      makeGame({ id: 103, status: "final" }),
      makeGame({ id: 104, status: "postponed" }),
    ]),
    { total: 4, live: 1, final: 1, scheduled: 1 },
  );
});
