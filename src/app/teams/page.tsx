import type { Metadata } from "next";
import { PageIntro } from "@/components/page-intro";
import { teams, type Conference } from "@/lib/teams";

export const metadata: Metadata = {
  title: "Teams",
  description: "Browse the NBA's 30 teams by conference.",
};

const conferences: readonly Conference[] = ["Eastern", "Western"];

export default function TeamsPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <PageIntro eyebrow="NBA directory" title="Teams" description="All 30 NBA franchises, grouped by conference. Team statistics and individual profiles will be available after data integration." />
      <div className="mt-12 grid gap-12 lg:grid-cols-2">
        {conferences.map((conference) => (
          <section key={conference} aria-labelledby={conference}>
            <div className="mb-5 flex items-baseline justify-between border-b border-white/10 pb-4">
              <h2 id={conference} className="text-2xl font-bold text-white">{conference} Conference</h2>
              <span className="font-mono text-xs text-[#9da7b5]">15 teams</span>
            </div>
            <ul className="grid gap-2">
              {teams.filter((team) => team.conference === conference).map((team, index) => (
                <li key={team.name} className="flex items-center gap-5 border border-white/10 bg-[#111722] px-5 py-4">
                  <span className="w-7 font-mono text-xs text-[#f07859]">{String(index + 1).padStart(2, "0")}</span>
                  <span className="font-semibold text-[#edf0f5]">{team.name}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
