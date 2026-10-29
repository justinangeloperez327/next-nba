import type { Metadata } from "next";
import { GamesDashboard } from "../../components/games/games-dashboard";
import { PageIntro } from "../../components/page-intro";
import { getNbaScheduleDate, isValidScheduleDate } from "../../lib/nba/date";
import { findTeam } from "../../lib/teams";

export const metadata: Metadata = {
  title: "Games",
  description: "Browse NBA games, dates, scores, and team schedules.",
};

export const dynamic = "force-dynamic";

type GamesPageProps = {
  searchParams: Promise<{ date?: string | string[]; team?: string | string[] }>;
};

export default async function GamesPage({ searchParams }: GamesPageProps) {
  const params = await searchParams;
  const today = getNbaScheduleDate();
  const requested = params.date;
  const validDate = typeof requested === "string" && isValidScheduleDate(requested);
  const date = validDate ? requested : today;
  const requestedTeam = params.team;
  const team = typeof requestedTeam === "string" ? findTeam(requestedTeam) : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <PageIntro
        eyebrow="Game center"
        title="Games"
        description="Schedules and scores by NBA Eastern calendar date. Game tip-off times appear in your local time zone."
      />
      <GamesDashboard
        key={`${date}:${team?.abbreviation ?? ""}`}
        date={date}
        today={today}
        team={team ?? null}
        invalidRequestedDate={requested !== undefined && !validDate}
        invalidRequestedTeam={requestedTeam !== undefined && !team}
      />
    </div>
  );
}
