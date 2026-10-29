type PageIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PageIntro({ eyebrow, title, description }: PageIntroProps) {
  return (
    <div className="border-b border-white/10 pb-10">
      <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-[#f07859]">{eyebrow}</p>
      <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">{title}</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-[#aeb6c3]">{description}</p>
    </div>
  );
}
