import { getNbaScheduleDate } from "./date.ts";
import { shiftScheduleDate } from "./view.ts";
import type { NbaGame } from "./types.ts";

export function gameCacheSeconds(games: readonly NbaGame[], date: string, now: Date): number {
  const today = getNbaScheduleDate(now);
  if (date < shiftScheduleDate(today, -2)) return 86_400;
  if (games.some((game) => game.status === "in_progress")) return 30;
  if (games.some((game) => game.status === "delayed" || game.status === "suspended")) return 60;
  if (games.some((game) => game.status === "scheduled" && game.tipoffAt &&
    Number.isFinite(Date.parse(game.tipoffAt)) &&
    Date.parse(game.tipoffAt) - now.getTime() <= 3_600_000 &&
    Date.parse(game.tipoffAt) - now.getTime() >= -3_600_000)) return 60;
  if (games.length === 0) return 900;
  if (games.every((g) => ["final", "postponed", "canceled", "abandoned"].includes(g.status))) return 120;
  return 300;
}

export function retryDelaySeconds(failures: number, retryAfterSeconds?: number): number {
  const backoff = Math.min(300, 30 * 2 ** Math.min(4, Math.max(0, failures - 1)));
  return Math.max(backoff, retryAfterSeconds ?? 0);
}
