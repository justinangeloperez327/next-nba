type PageIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PageIntro({ eyebrow, title, description }: PageIntroProps) {
  return (
    <header className="border-b border-white/10 pb-7">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-[#ffab8c]">{eyebrow}</p>
      <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-[#bdc8d5] sm:text-base">{description}</p>
    </header>
  );
}
