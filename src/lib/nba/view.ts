import { isValidScheduleDate } from "./date.ts";
import type { NbaGame } from "./types.ts";

export function shiftScheduleDate(date: string, days: number): string {
  if (!isValidScheduleDate(date) || !Number.isInteger(days) || Math.abs(days) > 366) {
    throw new RangeError("Invalid schedule date or offset");
  }
  // UTC calendar arithmetic avoids DST shifts around NBA game days.
  const value = new Date(`${date}T12:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function formatScheduleDate(date: string): string {
  if (!isValidScheduleDate(date)) return "Unknown date";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00.000Z`));
}

export function formatTipoff(value: string | null, local = false): string {
  if (!value) return "Time TBD";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time TBD";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
    ...(local ? {} : { timeZone: "America/New_York" }),
  }).format(date);
}

export function displayGameScore(game: NbaGame, side: "home" | "away"): string {
  if (game.status === "scheduled" || game.status === "postponed" || game.status === "canceled") {
    return "—";
  }
  const score = side === "home" ? game.homeScore : game.awayScore;
  return score === null ? "—" : String(score);
}

export function isGameWinner(game: NbaGame, side: "home" | "away"): boolean {
  if (game.status !== "final" || game.homeScore === null || game.awayScore === null) return false;
  return side === "home"
    ? game.homeScore > game.awayScore
    : game.awayScore > game.homeScore;
}

export function getGameStatusLabel(game: NbaGame): string {
  switch (game.status) {
    case "scheduled":
      return "Scheduled";
    case "in_progress": {
      const quarter = game.period ? `Q${game.period}` : "";
      const clock = game.clock?.trim() ?? "";
      const detail = [quarter, clock].filter(Boolean).join(" · ");
      return detail ? `LIVE · ${detail}` : "LIVE";
    }
    case "final":
      return "Final";
    case "postponed":
      return "Postponed";
    case "canceled":
      return "Canceled";
    case "delayed":
      return "Delayed";
    case "suspended":
      return "Suspended";
    case "abandoned":
      return "Abandoned";
    default:
      return "Status unavailable";
  }
}

export function summarizeGames(games: readonly NbaGame[]) {
  return {
    total: games.length,
    live: games.filter((game) => game.status === "in_progress").length,
    final: games.filter((game) => game.status === "final").length,
    scheduled: games.filter((game) => game.status === "scheduled").length,
  };
}
