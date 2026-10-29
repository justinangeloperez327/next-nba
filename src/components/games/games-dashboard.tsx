"use client";

import { useRouter } from "next/navigation";
import { GameCard } from "./game-card";
import { useGames } from "../../hooks/use-games";
import { formatScheduleDate, shiftScheduleDate, summarizeGames } from "../../lib/nba/view";
import { isValidScheduleDate } from "../../lib/nba/date";

type DashboardProps = {
  date: string;
  today: string;
  invalidRequestedDate: boolean;
};

export function GamesDashboard({ date, today, invalidRequestedDate }: DashboardProps) {
  const router = useRouter();
  const { games, loading, error, fetchedAt, refresh } = useGames(date);
  const summary = summarizeGames(games);

  function navigate(next: string) {
    if (isValidScheduleDate(next) && next !== date) {
      router.push(`/games?date=${encodeURIComponent(next)}`);
    }
  }

  return (
    <section aria-label="NBA schedule">
      {invalidRequestedDate && (
        <div role="alert" className="mb-6 border-l-2 border-[#ff9c7e] bg-[#f07859]/10 p-4 text-sm text-[#ffe5da]">
          The requested date is invalid. Showing today&apos;s NBA schedule.
        </div>
      )}

      <div className="mt-9 flex flex-wrap items-center justify-between gap-5 border border-white/10 bg-[#111722] p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Previous day"
            onClick={() => navigate(shiftScheduleDate(date, -1))}
            className="grid size-10 place-items-center border border-white/15 text-lg font-semibold text-white hover:bg-white/10"
          >
            <span aria-hidden="true">‹</span>
          </button>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#f07859]">NBA calendar date · ET</p>
            <p className="mt-1 text-sm font-bold text-white sm:text-base">{formatScheduleDate(date)}</p>
          </div>
          <button
            type="button"
            aria-label="Next day"
            onClick={() => navigate(shiftScheduleDate(date, 1))}
            className="grid size-10 place-items-center border border-white/15 text-lg font-semibold text-white hover:bg-white/10"
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="sr-only" htmlFor="nba-game-date">Choose NBA calendar date</label>
          <input
            id="nba-game-date"
            aria-label="Choose NBA calendar date"
            type="date"
            value={date}
            onChange={(event) => navigate(event.target.value)}
            className="h-10 border border-white/15 bg-[#0a0d13] px-3 text-sm text-white scheme-dark"
          />
          <button
            type="button"
            onClick={() => navigate(today)}
            disabled={date === today}
            className="h-10 border border-white/20 px-4 text-sm font-semibold text-white hover:bg-white/10 disabled:cursor-default disabled:opacity-40"
          >
            Today
          </button>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="h-10 bg-[#e65d40] px-4 text-sm font-bold text-[#141013] hover:bg-[#ff8d6a] disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3 text-xs font-medium text-[#b8c4d1]">
          <span className="border border-white/10 px-3 py-2">{loading ? "—" : summary.total} games</span>
          <span className="border border-white/10 px-3 py-2">{loading ? "—" : summary.live} live</span>
          <span className="border border-white/10 px-3 py-2">{loading ? "—" : summary.final} final</span>
          <span className="border border-white/10 px-3 py-2">{loading ? "—" : summary.scheduled} upcoming</span>
        </div>
        <p className="text-xs text-[#929eac]">
          {fetchedAt && !loading
            ? `Data fetched ${fetchedAt.slice(0, 16).replace("T", " ")} UTC`
            : "Scores refresh manually in this version"}
        </p>
      </div>

      <div aria-live="polite" aria-busy={loading} className="mt-6">
        {loading ? (
          <div role="status" className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} aria-hidden="true" className="h-52 animate-pulse border border-white/10 bg-[#111722]" />
            ))}
            <span className="sr-only">Loading NBA games…</span>
          </div>
        ) : error ? (
          <div role="alert" className="border border-white/15 bg-[#111722] p-8 text-center">
            <h2 className="text-lg font-bold text-white">Scores unavailable</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[#aeb6c3]">{error}</p>
            <button type="button" onClick={refresh} className="mt-5 bg-[#e65d40] px-5 py-3 text-sm font-bold text-[#141013]">
              Try again
            </button>
          </div>
        ) : games.length === 0 ? (
          <div className="border border-white/15 bg-[#111722] p-12 text-center">
            <h2 className="text-lg font-bold text-white">No games scheduled</h2>
            <p className="mt-3 text-sm text-[#aeb6c3]">No NBA games were returned for this calendar date. Select another date to explore.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {games.map((game) => <GameCard key={game.id} game={game} />)}
          </div>
        )}
      </div>
      <p className="mt-6 text-xs leading-6 text-[#8d9aaa]">
        Games are grouped by the NBA&apos;s Eastern calendar date. Tip-off times display in your local time zone after page load.
        Scores are fetched on page entry, date change, or manual refresh; automatic live updates arrive in Group 4.
      </p>
    </section>
  );
}
