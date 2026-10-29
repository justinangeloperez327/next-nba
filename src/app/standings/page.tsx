import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";
import { PageIntro } from "@/components/page-intro";

export const metadata: Metadata = {
  title: "Standings",
  description: "NBA conference standings.",
};

export default function StandingsPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <PageIntro eyebrow="League overview" title="Standings" description="Eastern and Western Conference standings, team records, and rankings will be displayed here after data integration." />
      <EmptyState title="Standings feed not connected" description="No live statistics have been configured. This page intentionally avoids outdated or invented league tables." />
    </div>
  );
}
