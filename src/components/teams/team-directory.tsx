"use client";

import Link from "next/link";
import { useState } from "react";
import { filterTeams, type Conference } from "../../lib/teams";

const conferences: readonly (Conference | "All")[] = ["All", "Eastern", "Western"];

export function TeamDirectory() {
  const [query, setQuery] = useState("");
  const [conference, setConference] = useState<Conference | "All">("All");
  const visible = filterTeams(query, conference);

  return (
    <section aria-label="NBA team directory" className="mt-8">
      <div className="flex flex-col gap-4 border border-white/10 bg-[#111722] p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
        <div className="min-w-0 flex-1">
          <label htmlFor="team-search" className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#bfc9d7]">
            Find a team
          </label>
          <input
            id="team-search"
            type="search"
            autoComplete="off"
            placeholder="Search teams or abbreviations"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-h-11 w-full max-w-md border border-white/20 bg-[#0a0d13] px-3 text-sm text-white placeholder:text-[#8d99a8]"
          />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#bfc9d7]">Conference</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by conference">
            {conferences.map((value) => (
              <button
                type="button"
                key={value}
                aria-pressed={conference === value}
                onClick={() => setConference(value)}
                className={`min-h-11 border px-3 text-sm font-semibold transition-colors ${
                  conference === value
                    ? "border-[#f07859] bg-[#e65d40]/15 text-[#ffb89d]"
                    : "border-white/15 text-[#c2ccd7] hover:border-white/40 hover:text-white"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p aria-live="polite" className="mt-5 text-sm text-[#b0bdca]">
        Showing {visible.length} of 30 teams
      </p>
      {visible.length === 0 ? (
        <div className="mt-4 border border-white/10 bg-[#111722] px-6 py-12 text-center">
          <h2 className="text-lg font-bold text-white">No matching teams</h2>
          <p className="mt-2 text-sm text-[#aeb6c3]">Try a different team name or conference.</p>
          <button
            type="button"
            onClick={() => { setQuery(""); setConference("All"); }}
            className="mt-5 min-h-11 border border-white/20 px-5 text-sm font-semibold text-white hover:bg-white/10"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((team) => (
            <li key={team.abbreviation}>
              <Link
                href={`/games?team=${team.abbreviation}`}
                className="group flex min-h-24 items-center gap-4 border border-white/10 bg-[#111722] p-4 transition-colors hover:border-[#f07859]/60 hover:bg-[#17202d]"
              >
                <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center border border-white/20 bg-white/[0.04] font-mono text-sm font-bold text-[#ffe0d3]">
                  {team.abbreviation}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold leading-5 text-white">{team.name}</span>
                  <span className="mt-1 block text-xs text-[#9eacbb]">{team.conference} Conference</span>
                </span>
                <span aria-hidden="true" className="text-lg text-[#f07859] group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-6 text-xs leading-6 text-[#9eacbb]">
        Select a team to view its games for the current NBA calendar date. Team logos and player profiles are not included.
      </p>
    </section>
  );
}
