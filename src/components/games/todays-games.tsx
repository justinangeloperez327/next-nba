"use client";

import Link from "next/link";
import { useGames } from "../../hooks/use-games";
import { selectHomepageGames } from "../../lib/nba/filters";
import { formatScheduleDate } from "../../lib/nba/view";
import { GameCard } from "./game-card";

export function TodaysGames({ date }: { date: string }) {
  const { games, loading, refreshing, stale, online, error, refresh, fetchedAt, refreshAfterSeconds } = useGames(date);
  const highlighted = selectHomepageGames(games, 3);

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14" aria-labelledby="todays-games">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-[#ffab8c]">NBA calendar · Eastern Time</p>
          <h2 id="todays-games" className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Today&apos;s games</h2>
          <p className="mt-2 text-sm text-[#b5c3d2]">{formatScheduleDate(date)}</p>
        </div>
        <Link href={`/games?date=${date}`}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-[#ffab8c] hover:text-white">
          Full schedule <span aria-hidden="true" className="ml-2">→</span>
        </Link>
      </div>

      {stale && games.length > 0 && (
        <p role="status" className="mb-5 border-l-2 border-[#f07859] bg-[#f07859]/10 px-4 py-3 text-sm text-[#ffccb9]">
          Last-known scores. {error ?? "Waiting for an updated feed."}
        </p>
      )}
      {!online && !stale && (
        <p role="status" className="mb-5 text-sm text-[#ffccb9]">You are offline. Updates are paused.</p>
      )}
      <div aria-busy={loading}>
        {loading ? (
          <div role="status" className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => <div key={item} aria-hidden="true" className="h-48 animate-pulse border border-white/10 bg-[#111722]" />)}
            <span className="sr-only">Loading today&apos;s NBA games.</span>
          </div>
        ) : error && games.length === 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-4 border border-white/10 bg-[#111722] p-6">
            <p role="alert" className="text-sm leading-6 text-[#bdc8d5]">{error}</p>
            <button type="button" onClick={refresh}
              className="min-h-11 border border-white/20 px-4 text-sm font-semibold text-white hover:bg-white/10">
              Retry
            </button>
          </div>
        ) : games.length === 0 ? (
          <div className="border border-white/10 bg-[#111722] p-7">
            <h3 className="font-bold text-white">No games today</h3>
            <p className="mt-2 text-sm text-[#b5c3d2]">Browse other dates in the games hub.</p>
            <Link href="/games" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-[#ffab8c] hover:text-white">Explore schedule →</Link>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {highlighted.map((game) => <GameCard key={game.id} game={game} />)}
          </div>
        )}
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs leading-6 text-[#a2b1c0]">
        <p aria-live="off">
          {fetchedAt ? `Last fetched ${fetchedAt.slice(0, 16).replace("T", " ")} UTC` : "Score data is provider-supplied"}
          {refreshAfterSeconds ? ` · ${refreshAfterSeconds}s refresh interval` : ""}
          {refreshing ? " · Updating…" : ""}
        </p>
        <button type="button" onClick={refresh} disabled={loading || refreshing}
          className="min-h-11 border border-white/15 px-4 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-50">
          Refresh scores
        </button>
      </div>
    </section>
  );
}
