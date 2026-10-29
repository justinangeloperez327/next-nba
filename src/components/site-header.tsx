"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { href: "/games", label: "Games" },
  { href: "/teams", label: "Teams" },
  { href: "/standings", label: "Standings" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="border-b border-white/10 bg-[#0a0d13]">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link
          href="/"
          aria-current={pathname === "/" ? "page" : undefined}
          className="inline-flex w-fit items-center gap-3 text-lg font-black uppercase tracking-tight text-white"
        >
          <span aria-hidden="true" className="grid size-11 place-items-center bg-[#e65d40] text-sm text-[#0a0d13]">N</span>
          <span>Next <span className="text-[#f07859]">NBA</span></span>
        </Link>
        <nav aria-label="Main navigation" className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          {navigation.map(({ href, label }) => {
            const selected = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={selected ? "page" : undefined}
                className={`inline-flex min-h-11 items-center border px-3 transition-colors ${
                  selected
                    ? "border-[#e65d40]/60 bg-[#e65d40]/10 text-[#ffab8c]"
                    : "border-transparent text-[#bdc8d5] hover:border-white/20 hover:text-white"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
