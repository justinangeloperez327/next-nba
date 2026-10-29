import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-8 text-xs text-[#929aa9]">
        <p>Next NBA · Independent basketball project</p>
        <Link className="hover:text-white" href="/">Back to home</Link>
      </div>
    </footer>
  );
}
