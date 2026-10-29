"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GameCard } from "./game-card";
import { useGames } from "../../hooks/use-games";
import { gameFilterCounts, filterGames, type GameViewFilter } from "../../lib/nba/filters";
import { formatScheduleDate, shiftScheduleDate } from "../../lib/nba/view";
import { isValidScheduleDate } from "../../lib/nba/date";
import type { Team } from "../../lib/teams";

type DashboardProps = {
  date: string;
  today: string;
  team: Team | null;
  invalidRequestedDate: boolean;
  invalidRequestedTeam: boolean;
};

const filters: readonly { key: GameViewFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "final", label: "Final" },
  { key: "upcoming", label: "Upcoming" },
];

export function GamesDashboard({
  date, today, team, invalidRequestedDate, invalidRequestedTeam,
}: DashboardProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<GameViewFilter>("all");
  const { games, loading, refreshing, stale, online, error, fetchedAt, refresh, refreshAfterSeconds } = useGames(date);
  const teamGames = filterGames(games, team?.abbreviation ?? null);
  const counts = gameFilterCounts(teamGames);
  const visible = filterGames(teamGames, null, filter);

  function navigate(next: string) {
    if (isValidScheduleDate(next) && next !== date) {
      const code = team ? `&team=${encodeURIComponent(team.abbreviation)}` : "";
      router.push(`/games?date=${encodeURIComponent(next)}${code}`);
    }
  }

  return (
    <section aria-label="NBA schedule">
      {invalidRequestedDate && (
        <p role="alert" className="mt-6 border-l-2 border-[#ff9c7e] bg-[#f07859]/10 p-4 text-sm text-[#ffe5da]">
          The requested date is invalid. Showing today&apos;s NBA schedule.
        </p>
      )}
      {invalidRequestedTeam && (
        <p role="alert" className="mt-6 border-l-2 border-[#ff9c7e] bg-[#f07859]/10 p-4 text-sm text-[#ffe5da]">
          That team is not recognized. Showing the league-wide schedule.
        </p>
      )}

      <div className="mt-7 flex flex-col gap-4 border border-white/10 bg-[#111722] p-4 lg:flex-row lg:items-center lg:justify-between sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" aria-label="Previous NBA day" onClick={() => navigate(shiftScheduleDate(date, -1))}
            className="grid size-11 shrink-0 place-items-center border border-white/20 text-xl text-white hover:bg-white/10">
            <span aria-hidden="true">‹</span>
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#ffab8c]">NBA calendar · ET</p>
            <p className="mt-1 text-sm font-bold leading-5 text-white sm:text-base">{formatScheduleDate(date)}</p>
          </div>
          <button type="button" aria-label="Next NBA day" onClick={() => navigate(shiftScheduleDate(date, 1))}
            className="grid size-11 shrink-0 place-items-center border border-white/20 text-xl text-white hover:bg-white/10">
            <span aria-hidden="true">›</span>
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="nba-game-date">Choose NBA calendar date</label>
          <input id="nba-game-date" type="date" value={date} onChange={(event) => navigate(event.target.value)}
            aria-label="Choose NBA calendar date"
            className="h-11 min-w-0 max-w-full flex-1 border border-white/20 bg-[#0a0d13] px-3 text-sm text-white scheme-dark sm:flex-none" />
          <button type="button" onClick={() => navigate(today)} disabled={date === today}
            className="h-11 border border-white/20 px-4 text-sm font-semibold text-white hover:bg-white/10 disabled:cursor-default disabled:opacity-40">Today</button>
          <button type="button" onClick={refresh} disabled={loading || refreshing}
            className="h-11 bg-[#e65d40] px-4 text-sm font-bold text-[#141013] hover:bg-[#ff9a77] disabled:opacity-50">
            {refreshing ? "Updating…" : "Refresh"}
          </button>
        </div>
      </div>

      {team && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border border-[#e65d40]/30 bg-[#e65d40]/10 px-4 py-3">
          <p className="text-sm text-[#ffe0d3]">
            Team: <strong>{team.name}</strong> <span className="text-[#c9aa9f]">({team.abbreviation})</span>
          </p>
          <div className="flex gap-4 text-sm font-semibold">
            <Link href={`/games?date=${date}`} className="text-[#ffe0d3] underline underline-offset-4 hover:text-white">All teams</Link>
            <Link href="/teams" className="text-[#ffe0d3] underline underline-offset-4 hover:text-white">Change team</Link>
          </div>
        </div>
      )}

      <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#b5c3d2]">
            Filter games
          </p>
          <div role="group" aria-label="Filter game statuses" className="flex flex-wrap gap-2">
            {filters.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                aria-pressed={filter === key}
                onClick={() => setFilter(key)}
                className={`min-h-11 border px-3 text-sm font-semibold transition-colors ${
                  filter === key
                    ? "border-[#e65d40] bg-[#e65d40]/15 text-[#ffb89d]"
                    : "border-white/15 text-[#c3cfdb] hover:border-white/40 hover:text-white"
                }`}
              >
                {label} <span className="ml-1 font-mono text-xs">{loading ? "—" : counts[key]}</span>
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs leading-5 text-[#a5b3c2]">
          {fetchedAt && !loading ? `Last fetched: ${fetchedAt.slice(0, 16).replace("T", " ")} UTC` : "Awaiting game data"}
          {refreshing ? " · Updating…" : ""}
          {refreshAfterSeconds && !loading ? ` · ${refreshAfterSeconds}s interval` : ""}
        </p>
      </div>

      {stale && teamGames.length > 0 && !loading && (
        <p role="status" className="mt-5 border-l-2 border-[#f07859] bg-[#f07859]/10 p-4 text-sm text-[#ffccb9]">
          Showing last-known scores. {error ?? "Waiting for a fresh provider update."}
        </p>
      )}
      {!online && !loading && !stale && (
        <p role="status" className="mt-5 text-sm text-[#ffccb9]">Offline — updates are paused.</p>
      )}

      <div aria-busy={loading} className="mt-5">
        {loading ? (
          <div role="status" className="grid gap-3 md:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} aria-hidden="true" className="h-48 animate-pulse border border-white/10 bg-[#111722]" />
            ))}
            <span className="sr-only">Loading NBA games…</span>
          </div>
        ) : error && games.length === 0 ? (
          <div role="alert" className="border border-white/15 bg-[#111722] p-7 text-center">
            <h2 className="text-lg font-bold text-white">Scores unavailable</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#bbc6d2]">{error}</p>
            <button type="button" onClick={refresh} className="mt-5 min-h-11 bg-[#e65d40] px-5 text-sm font-bold text-[#141013]">Try again</button>
          </div>
        ) : games.length === 0 ? (
          <div className="border border-white/15 bg-[#111722] px-6 py-12 text-center">
            <h2 className="text-lg font-bold text-white">No games scheduled</h2>
            <p className="mt-3 text-sm text-[#bbc6d2]">No games were returned for this NBA calendar date. Try another date.</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="border border-white/15 bg-[#111722] px-6 py-12 text-center">
            <h2 className="text-lg font-bold text-white">No matching games</h2>
            <p className="mt-3 text-sm text-[#bbc6d2]">
              {team && teamGames.length === 0
                ? `${team.name} has no games listed for this date.`
                : "There are no games matching this status filter."}
            </p>
            <button type="button" onClick={() => setFilter("all")}
              className="mt-5 min-h-11 border border-white/20 px-5 text-sm font-semibold text-white hover:bg-white/10">
              Show all statuses
            </button>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {visible.map((game) => <GameCard key={game.id} game={game} />)}
          </div>
        )}
      </div>

      <p className="mt-6 text-xs leading-6 text-[#9eacbb]">
        Scores are provider-supplied, not simulated. Games follow the NBA Eastern calendar.
        Updates automatically adapt to game state and pause while the tab is hidden or offline.
      </p>
    </section>
  );
}
