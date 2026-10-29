import Link from "next/link";
import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";
import { PageIntro } from "@/components/page-intro";

export const metadata: Metadata = {
  title: "Standings",
  description: "NBA standings will be available when a supported data feed is configured.",
};

export default function StandingsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <PageIntro
        eyebrow="League overview"
        title="Standings"
        description="Conference rankings and team records require an additional supported data feed."
      />
      <EmptyState
        title="Standings are not available yet"
        description="The currently integrated free scoreboard feed does not provide the full standings table. We will not display invented rankings."
      />
      <Link href="/games"
        className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-[#ffab8c] hover:text-white">
        Browse games instead <span aria-hidden="true" className="ml-2">→</span>
      </Link>
    </div>
  );
}
