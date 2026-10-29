import Link from "next/link";

const navigation = [
  { href: "/games", label: "Games" },
  { href: "/teams", label: "Teams" },
  { href: "/standings", label: "Standings" },
] as const;

export function SiteHeader() {
  return (
    <header className="border-b border-white/10 bg-[#0a0d13]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 px-6 py-5">
        <Link
          href="/"
          className="inline-flex items-center gap-3 text-lg font-black uppercase tracking-tight text-white"
          aria-label="Next NBA home"
        >
          <span aria-hidden="true" className="grid size-9 place-items-center bg-[#e65d40] text-sm text-[#0a0d13]">
            N
          </span>
          <span>Next <span className="text-[#f07859]">NBA</span></span>
        </Link>
        <nav aria-label="Main navigation" className="flex flex-wrap items-center gap-6 text-sm font-medium text-[#b9bfcb]">
          {navigation.map(({ href, label }) => (
            <Link key={href} href={href} className="transition-colors hover:text-white">
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
