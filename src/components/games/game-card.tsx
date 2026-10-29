"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import type { NbaGame } from "../../lib/nba/types";
import {
  displayGameScore,
  formatTipoff,
  getGameStatusLabel,
  isGameWinner,
} from "../../lib/nba/view";

const subscribe = () => () => {};
function useIsHydrated() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

function TeamLine({ game, side }: { game: NbaGame; side: "home" | "away" }) {
  const team = side === "home" ? game.homeTeam : game.awayTeam;
  const winner = isGameWinner(game, side);
  const score = displayGameScore(game, side);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          href={`/games?date=${game.date}&team=${encodeURIComponent(team.abbreviation)}`}

          className="grid size-11 shrink-0 place-items-center border border-white/20 bg-white/[0.04] font-mono text-xs font-bold text-[#ffe0d3] transition-colors hover:border-[#f07859] hover:bg-[#f07859]/10"
        >
          {team.abbreviation}
          <span className="sr-only"> — View {team.fullName} games for {game.date}</span>
        </Link>
        <div className="min-w-0">
          <p className={`text-sm leading-5 sm:text-base ${
            winner ? "font-extrabold text-white" : "font-semibold text-[#dce4ee]"
          }`}>
            {team.fullName}
          </p>
          <p className="mt-0.5 text-xs text-[#a1afbe]">{side === "home" ? "Home" : "Away"}</p>
        </div>
      </div>
      <span
        aria-label={`${team.fullName}: ${score === "—" ? "score not available" : `${score} points`}`}
        className={`min-w-9 text-right font-mono text-2xl tabular-nums sm:text-3xl ${
          winner ? "font-bold text-white" : "font-semibold text-[#b9c6d5]"
        }`}
      >
        {score}
      </span>
    </div>
  );
}

export function GameCard({ game }: { game: NbaGame }) {
  const hydrated = useIsHydrated();
  const isLive = game.status === "in_progress";
  const status = getGameStatusLabel(game);
  const tipoff = formatTipoff(game.tipoffAt, hydrated);

  return (
    <article
      aria-label={`${game.awayTeam.fullName} at ${game.homeTeam.fullName}: ${status}`}
      className="h-full min-w-0 border border-white/10 bg-[#111722] p-4 sm:p-5"
    >
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <span className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.06em] ${
          isLive ? "text-[#ffab8c]" : "text-[#bbc7d5]"
        }`}>
          {isLive && <span aria-hidden="true" className="size-2 rounded-full bg-[#f07859]" />}
          {status}
        </span>
        <time
          dateTime={game.tipoffAt ?? undefined}
          title="Tip-off time in your local time zone"
          className="text-xs text-[#a5b2c1]"
        >
          {tipoff}
        </time>
      </header>
      <div className="space-y-1">
        <TeamLine game={game} side="away" />
        <TeamLine game={game} side="home" />
      </div>
      {game.postseason && (
        <p className="mt-3 border-t border-white/10 pt-3 text-xs font-medium text-[#b3c0ce]">
          Playoff game
        </p>
      )}
    </article>
  );
}
