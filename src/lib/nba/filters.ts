import type { NbaGame } from "./types.ts";

export type GameViewFilter = "all" | "live" | "final" | "upcoming";

export function filterGames(
  games: readonly NbaGame[],
  team: string | null = null,
  filter: GameViewFilter = "all",
): NbaGame[] {
  const code = team?.toUpperCase() ?? null;
  return games.filter((game) => {
    const matchesTeam = !code ||
      game.homeTeam.abbreviation.toUpperCase() === code ||
      game.awayTeam.abbreviation.toUpperCase() === code;
    if (!matchesTeam) return false;
    switch (filter) {
      case "live": return game.status === "in_progress";
      case "final": return game.status === "final";
      case "upcoming": return game.status === "scheduled";
      default: return true;
    }
  });
}

export function gameFilterCounts(games: readonly NbaGame[]) {
  return {
    all: games.length,
    live: games.filter((game) => game.status === "in_progress").length,
    final: games.filter((game) => game.status === "final").length,
    upcoming: games.filter((game) => game.status === "scheduled").length,
  };
}

const statusPriority: Record<NbaGame["status"], number> = {
  in_progress: 0,
  scheduled: 1,
  delayed: 2,
  suspended: 3,
  final: 4,
  postponed: 5,
  canceled: 6,
  abandoned: 7,
  unknown: 8,
};

// On the homepage prioritize live games, then upcoming games.
// Never mutate the chronological order of the full games dashboard.
export function selectHomepageGames(games: readonly NbaGame[], limit = 3): NbaGame[] {
  return games
    .map((game, index) => ({ game, index }))
    .sort((a, b) =>
      statusPriority[a.game.status] - statusPriority[b.game.status] || a.index - b.index)
    .slice(0, Math.max(0, limit))
    .map(({ game }) => game);
}
