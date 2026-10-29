import Link from "next/link";

const sections = [
  {
    number: "01",
    title: "Games",
    description: "A future home for schedules, scores, and game details.",
    href: "/games",
    cta: "View games",
  },
  {
    number: "02",
    title: "Teams",
    description: "Browse all 30 NBA franchises, organized by conference.",
    href: "/teams",
    cta: "Browse teams",
  },
  {
    number: "03",
    title: "Standings",
    description: "Conference rankings and records once a data source is connected.",
    href: "/standings",
    cta: "View standings",
  },
] as const;

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10">
        <div aria-hidden="true" className="hero-grid pointer-events-none absolute inset-0" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <p className="mb-5 inline-flex items-center gap-3 border border-[#e65d40]/40 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#ff967a]">
              <span className="size-2 bg-[#e65d40]" aria-hidden="true" />
              Basketball, simplified
            </p>
            <h1 className="max-w-xl text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
              THE GAME.<br />
              <span className="text-[#f07859]">ONE PLACE.</span>
            </h1>
            <p className="mt-7 max-w-lg text-base leading-8 text-[#b8c0cc]">
              A clean foundation for NBA schedules, scores, team profiles, and standings. Built for the basketball fan who wants the essentials.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/teams" className="inline-flex items-center justify-center bg-[#e65d40] px-6 py-3 text-sm font-bold text-[#141013] transition-colors hover:bg-[#ff8d6a]">
                Explore teams
              </Link>
              <Link href="/games" className="inline-flex items-center justify-center border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10">
                Games hub
              </Link>
            </div>
          </div>

          <div aria-hidden="true" className="relative mx-auto grid aspect-square w-full max-w-[480px] place-items-center">
            <div className="absolute inset-[9%] rounded-full border border-[#ea7359]/15" />
            <div className="absolute inset-[1%] rounded-full border border-white/5" />
            <svg viewBox="0 0 440 440" role="presentation" className="relative z-10 h-full w-full drop-shadow-[0_25px_90px_rgba(230,93,64,0.22)]">
              <defs>
                <linearGradient id="ball" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="#ffac79" />
                  <stop offset="52%" stopColor="#e66546" />
                  <stop offset="100%" stopColor="#9a3029" />
                </linearGradient>
                <clipPath id="ball-shape"><circle cx="220" cy="220" r="151" /></clipPath>
              </defs>
              <circle cx="220" cy="220" r="151" fill="url(#ball)" />
              <g clipPath="url(#ball-shape)" stroke="#592521" strokeWidth="7" fill="none">
                <path d="M69 220H371M220 69V371" />
                <path d="M95 116C215 160 215 280 95 324M345 116C225 160 225 280 345 324" />
                <path d="M118 86C150 179 290 179 322 86M118 354C150 261 290 261 322 354" />
              </g>
              <circle cx="220" cy="220" r="151" fill="none" stroke="#ffb28c" strokeOpacity=".35" strokeWidth="2" />
            </svg>
            <span className="absolute bottom-[3%] right-[1%] font-mono text-[11px] uppercase tracking-[0.25em] text-[#777f8d]">
              Built for the game
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#f07859]">Explore</p>
            <h2 className="text-3xl font-black tracking-tight text-white">Everything in reach.</h2>
          </div>
          <p className="max-w-xs text-sm leading-6 text-[#9fa9b8]">Starting with team directories, then expanding into live basketball data.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {sections.map((section) => (
            <Link key={section.href} href={section.href} className="group flex min-h-60 flex-col justify-between border border-white/10 bg-[#111722] p-7 transition-colors hover:border-[#e65d40]/60 hover:bg-[#151d2b]">
              <div>
                <span className="font-mono text-xs text-[#f07859]">{section.number} / NBA</span>
                <h3 className="mt-7 text-2xl font-extrabold text-white">{section.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#aeb6c3]">{section.description}</p>
              </div>
              <span className="mt-8 text-sm font-semibold text-[#ff9979] group-hover:text-white">{section.cta} <span aria-hidden="true">→</span></span>
            </Link>
          ))}
        </div>
        <p className="mt-8 border-l-2 border-[#e65d40] pl-4 text-sm leading-6 text-[#aeb6c3]">
          Live games and standings are not connected yet. No fabricated match data is displayed.
        </p>
      </section>
    </>
  );
}
