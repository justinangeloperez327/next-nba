import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";
import { PageIntro } from "@/components/page-intro";

export const metadata: Metadata = {
  title: "Games",
  description: "NBA schedule and score hub.",
};

export default function GamesPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <PageIntro eyebrow="Game center" title="Games" description="Scores, fixtures, and game details will appear here once an authorized NBA data source is integrated." />
      <EmptyState title="Game feed not connected" description="This is the initial application scaffold. A data provider must be configured before schedules or live scores can be displayed." />
    </div>
  );
}
