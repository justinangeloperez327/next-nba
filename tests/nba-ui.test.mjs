import assert from "node:assert/strict";
import test from "node:test";
import { teams, findTeam, filterTeams } from "../src/lib/teams.ts";
import { filterGames, gameFilterCounts, selectHomepageGames } from "../src/lib/nba/filters.ts";

function game(id, status, home = "BOS", away = "LAL") {
  return {
    id, status,
    homeTeam: { abbreviation: home },
    awayTeam: { abbreviation: away },
  };
}

test("team directory includes 30 unique NBA abbreviations", () => {
  assert.equal(teams.length, 30);
  assert.equal(new Set(teams.map((team) => team.abbreviation)).size, 30);
  assert.ok(teams.every((team) => /^[A-Z]{3}$/.test(team.abbreviation)));
});

test("team lookup is case insensitive; invalid teams are rejected", () => {
  assert.equal(findTeam("bos")?.name, "Boston Celtics");
  assert.equal(findTeam("LAL")?.conference, "Western");
  assert.equal(findTeam("NOPE"), undefined);
});

test("conference filtering and search work together without mutating the team directory", () => {
  assert.equal(filterTeams("", "All").length, 30);
  assert.equal(filterTeams("", "Eastern").length, 15);
  assert.equal(filterTeams("", "Western").length, 15);
  assert.deepEqual(filterTeams(" lakers ").map((team) => team.abbreviation), ["LAL"]);
  assert.deepEqual(filterTeams("BOS", "Western"), []);
  assert.deepEqual(filterTeams("BOS", "Eastern").map((team) => team.abbreviation), ["BOS"]);
  assert.equal(teams.length, 30);
});

test("game status and team filters can be combined safely", () => {
  const games = [
    game(1, "in_progress", "BOS", "LAL"),
    game(2, "scheduled", "NYK", "BOS"),
    game(3, "final", "DEN", "GSW"),
    game(4, "postponed", "CHI", "BOS"),
  ];
  assert.deepEqual(filterGames(games, "bos").map((item) => item.id), [1, 2, 4]);
  assert.deepEqual(filterGames(games, null, "live").map((item) => item.id), [1]);
  assert.deepEqual(filterGames(games, "BOS", "upcoming").map((item) => item.id), [2]);
  assert.deepEqual(filterGames(games, "BOS", "final"), []);
  assert.deepEqual(gameFilterCounts(filterGames(games, "BOS")), {
    all: 3, live: 1, final: 0, upcoming: 1,
  });
  assert.equal(games.length, 4);
});

test("homepage selection prioritizes live games over completed games", () => {
  const games = [
    game(1, "final"),
    game(2, "scheduled"),
    game(3, "in_progress"),
    game(4, "in_progress"),
    game(5, "scheduled"),
  ];
  assert.deepEqual(selectHomepageGames(games, 3).map((item) => item.id), [3, 4, 2]);
  assert.deepEqual(games.map((item) => item.id), [1, 2, 3, 4, 5]);
  assert.deepEqual(selectHomepageGames(games, 0), []);
});
