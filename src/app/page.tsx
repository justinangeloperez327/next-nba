import Link from "next/link";
import { TodaysGames } from "../components/games/todays-games";
import { getNbaScheduleDate } from "../lib/nba/date";

// Request-time NBA date prevents a stale homepage after the server date changes.
export const dynamic = "force-dynamic";

export default function Home() {
  const nbaDate = getNbaScheduleDate();
  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10">
        <div aria-hidden="true" className="hero-grid pointer-events-none absolute inset-0" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-18 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-22">
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[#ffab8c]">
              NBA · Games and scores
            </p>
            <h1 className="max-w-2xl text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Basketball.<span className="block text-[#f07859]">At a glance.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#bdc8d5]">
              Follow the NBA schedule, check scores, and browse all 30 teams.
              Clear information, without the clutter.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={`/games?date=${nbaDate}`}
                className="inline-flex min-h-11 items-center justify-center bg-[#e65d40] px-5 text-sm font-bold text-[#141013] transition-colors hover:bg-[#ff9a77]">
                View today&apos;s games <span aria-hidden="true" className="ml-3">→</span>
              </Link>
              <Link href="/teams"
                className="inline-flex min-h-11 items-center justify-center border border-white/20 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10">
                Explore teams
              </Link>
            </div>
          </div>

          <div className="border border-white/10 bg-[#111722]/90 p-5 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#ffab8c]">League essentials</p>
            <div className="mt-5 divide-y divide-white/10">
              <div className="flex items-baseline justify-between py-4">
                <span className="text-sm text-[#bdc8d5]">NBA teams</span>
                <span className="font-mono text-3xl font-bold tabular-nums text-white">30</span>
              </div>
              <div className="flex items-baseline justify-between py-4">
                <span className="text-sm text-[#bdc8d5]">Conferences</span>
                <span className="font-mono text-3xl font-bold tabular-nums text-white">02</span>
              </div>
              <div className="flex items-baseline justify-between py-4">
                <span className="text-sm text-[#bdc8d5]">Game updates</span>
                <span className="text-sm font-semibold text-[#ffb89d]">Automatic*</span>
              </div>
            </div>
            <p className="mt-4 text-xs leading-6 text-[#a4b2c0]">
              *Automatic refresh uses the configured data provider and pauses when inactive. No scores are simulated.
            </p>
          </div>
        </div>
      </section>

      <TodaysGames date={nbaDate} />

      <section className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#ffab8c]">Explore</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Find what matters.</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link href="/games" className="group flex min-h-36 flex-col justify-between border border-white/10 bg-[#111722] p-5 transition-colors hover:border-[#f07859]/60">
              <div>
                <h3 className="text-xl font-bold text-white">Games</h3>
                <p className="mt-2 text-sm leading-6 text-[#bdc8d5]">Schedules, results, and live game states by date.</p>
              </div>
              <span className="mt-4 text-sm font-semibold text-[#ffab8c]">Open scoreboard <span aria-hidden="true">→</span></span>
            </Link>
            <Link href="/teams" className="group flex min-h-36 flex-col justify-between border border-white/10 bg-[#111722] p-5 transition-colors hover:border-[#f07859]/60">
              <div>
                <h3 className="text-xl font-bold text-white">Teams</h3>
                <p className="mt-2 text-sm leading-6 text-[#bdc8d5]">All franchises, conference filters, and team schedules.</p>
              </div>
              <span className="mt-4 text-sm font-semibold text-[#ffab8c]">Browse directory <span aria-hidden="true">→</span></span>
            </Link>
          </div>
          <p className="mt-6 text-xs leading-6 text-[#9cabb9]">
            Standings and detailed player statistics are not yet connected. NBA game data requires a server-side provider key.
          </p>
        </div>
      </section>
    </>
  );
}
