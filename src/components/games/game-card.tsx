"use client";

import { useSyncExternalStore } from "react";
import type { NbaGame } from "../../lib/nba/types";
import {
  displayGameScore,
  formatTipoff,
  getGameStatusLabel,
  isGameWinner,
} from "../../lib/nba/view";

function subscribe() {
  return () => {};
}

function useIsHydrated() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

function TeamLine({ game, side }: { game: NbaGame; side: "home" | "away" }) {
  const team = side === "home" ? game.homeTeam : game.awayTeam;
  const winner = isGameWinner(game, side);
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center border border-white/15 bg-white/[0.04] text-xs font-extrabold text-[#e9ecf1]">
          {team.abbreviation}
        </span>
        <div className="min-w-0">
          <p className={`truncate text-sm sm:text-base ${winner ? "font-extrabold text-white" : "font-semibold text-[#dbe1ea]"}`}>
            {team.fullName}
          </p>
          <p className="text-xs text-[#8995a6]">{side === "home" ? "Home" : "Away"}</p>
        </div>
      </div>
      <span
        aria-label={`${team.fullName}: ${displayGameScore(game, side) === "—" ? "score unavailable" : `${displayGameScore(game, side)} points`}`}
        className={`shrink-0 font-mono text-2xl tabular-nums sm:text-3xl ${winner ? "font-bold text-white" : "font-semibold text-[#b5c0cc]"}`}
      >
        {displayGameScore(game, side)}
      </span>
    </div>
  );
}

export function GameCard({ game }: { game: NbaGame }) {
  const isHydrated = useIsHydrated();
  const isLive = game.status === "in_progress";
  const tipoff = formatTipoff(game.tipoffAt, isHydrated);

  return (
    <article
      aria-label={`${game.awayTeam.fullName} at ${game.homeTeam.fullName}: ${getGameStatusLabel(game)}`}
      className="border border-white/10 bg-[#111722] p-5 sm:p-6"
    >
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
        <span className={`text-xs font-bold uppercase tracking-[0.08em] ${isLive ? "text-[#ff9578]" : "text-[#aeb7c5]"}`}>
          {isLive && <span aria-hidden="true" className="mr-2 inline-block size-2 rounded-full bg-[#f07859]" />}
          {getGameStatusLabel(game)}
        </span>
        <time dateTime={game.tipoffAt ?? undefined} className="text-xs text-[#96a3b4]">
          {tipoff}
        </time>
      </header>
      <div className="space-y-2">
        <TeamLine game={game} side="away" />
        <TeamLine game={game} side="home" />
      </div>
      {game.postseason && (
        <p className="mt-4 border-t border-white/10 pt-3 text-xs font-medium text-[#a2b0c1]">
          Playoffs
        </p>
      )}
    </article>
  );
}
