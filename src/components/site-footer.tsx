import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs leading-6 text-[#9faebb] sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>Next NBA · Independent project, not affiliated with the NBA.</p>
        <div className="flex flex-wrap items-center gap-5">
          <Link href="/games" className="min-h-11 inline-flex items-center hover:text-white">Games</Link>
          <Link href="/teams" className="min-h-11 inline-flex items-center hover:text-white">Teams</Link>
          <Link href="/" className="min-h-11 inline-flex items-center hover:text-white">Home</Link>
        </div>
      </div>
    </footer>
  );
}
