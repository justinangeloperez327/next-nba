"use client";

import Link from "next/link";
import { useGames } from "../../hooks/use-games";
import { formatScheduleDate } from "../../lib/nba/view";
import { GameCard } from "./game-card";

export function TodaysGames({ date }: { date: string }) {
  const { games, loading, refreshing, stale, error, refresh, fetchedAt, refreshAfterSeconds } = useGames(date);

  return (
    <section className="mx-auto max-w-6xl px-6 py-14 lg:py-16" aria-label="Today's NBA games">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#f07859]">Today&apos;s slate · NBA calendar</p>
          <h2 className="text-3xl font-black tracking-tight text-white">Around the league.</h2>
          <p className="mt-2 text-sm text-[#9eabb9]">{formatScheduleDate(date)}</p>
        </div>
        <Link href={`/games?date=${date}`} className="text-sm font-semibold text-[#ff9979] hover:text-white">
          Full schedule <span aria-hidden="true">→</span>
        </Link>
      </div>
      {stale && games.length > 0 && (
        <p role="status" className="mb-5 border-l-2 border-[#f07859] bg-[#f07859]/10 px-4 py-3 text-xs text-[#ffccb9]">
          Last-known scores — {error ?? "Awaiting a fresh update."}
        </p>
      )}
      <div aria-live="polite" aria-busy={loading}>
        {loading ? (
          <div role="status" className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} aria-hidden="true" className="h-52 animate-pulse border border-white/10 bg-[#111722]" />
            ))}
            <span className="sr-only">Loading today&apos;s games…</span>
          </div>
        ) : error && games.length === 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-4 border border-white/10 bg-[#111722] p-6">
            <p role="alert" className="text-sm text-[#b8c3d0]">{error}</p>
            <button type="button" onClick={refresh} className="border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
              Retry
            </button>
          </div>
        ) : games.length === 0 ? (
          <div className="border border-white/10 bg-[#111722] p-8 text-sm text-[#b8c3d0]">
            No games scheduled for today. Browse other dates in the games hub.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {games.slice(0, 3).map((game) => <GameCard key={game.id} game={game} />)}
          </div>
        )}
      </div>
      <p className="mt-5 text-xs text-[#8e9ba9]">
        {refreshing ? "Updating scores… " : ""}
        {fetchedAt ? `Last fetched ${fetchedAt.slice(0, 16).replace("T", " ")} UTC. ` : ""}
        Automatic refresh {refreshAfterSeconds ? `every ${refreshAfterSeconds}s while active.` : "pauses when data is unavailable."}
        <button type="button" onClick={refresh} disabled={loading || refreshing} className="ml-2 underline hover:text-white disabled:opacity-50">Refresh now</button>
      </p>
    </section>
  );
}
