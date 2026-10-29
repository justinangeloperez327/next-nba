import type { Metadata } from "next";
import { GamesDashboard } from "../../components/games/games-dashboard";
import { PageIntro } from "../../components/page-intro";
import { getNbaScheduleDate, isValidScheduleDate } from "../../lib/nba/date";

export const metadata: Metadata = {
  title: "Games",
  description: "NBA game schedules, scores, and results by calendar date.",
};

export const dynamic = "force-dynamic";

type GamesPageProps = {
  searchParams: Promise<{ date?: string | string[] }>;
};

export default async function GamesPage({ searchParams }: GamesPageProps) {
  const params = await searchParams;
  const today = getNbaScheduleDate();
  const requested = params.date;
  const valid = typeof requested === "string" && isValidScheduleDate(requested);
  const date = valid ? requested : today;

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <PageIntro
        eyebrow="Game center"
        title="Games"
        description="Explore NBA matchups, schedules, scores and results. All games are grouped by Eastern calendar date, with tip-off times shown in your local time zone."
      />
      <GamesDashboard date={date} today={today} invalidRequestedDate={requested !== undefined && !valid} />
    </div>
  );
}
