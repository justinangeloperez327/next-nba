import type { Metadata } from "next";
import { PageIntro } from "@/components/page-intro";
import { TeamDirectory } from "@/components/teams/team-directory";

export const metadata: Metadata = {
  title: "Teams",
  description: "Search all 30 NBA teams and find their scheduled games.",
};

export default function TeamsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <PageIntro
        eyebrow="NBA directory"
        title="Teams"
        description="Browse all 30 franchises, filter by conference, and open the schedule for your favorite team."
      />
      <TeamDirectory />
    </div>
  );
}
