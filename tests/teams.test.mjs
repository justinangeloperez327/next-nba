import assert from "node:assert/strict";
import test from "node:test";
import { teams } from "../src/lib/teams.ts";

test("NBA directory includes exactly 30 teams", () => {
  assert.equal(teams.length, 30);
});

test("NBA team names are unique and non-empty", () => {
  const names = teams.map(({ name }) => name);
  assert.equal(new Set(names).size, names.length);
  assert.ok(names.every((name) => typeof name === "string" && name.trim().length > 0));
});

test("NBA teams are divided equally into Eastern and Western conferences", () => {
  for (const conference of ["Eastern", "Western"]) {
    assert.equal(
      teams.filter((team) => team.conference === conference).length,
      15,
      `Expected 15 teams in ${conference} Conference`,
    );
  }
});

test("Every team belongs to a supported conference", () => {
  assert.ok(teams.every(({ conference }) => conference === "Eastern" || conference === "Western"));
});
