type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <section className="mt-8 border border-dashed border-white/20 bg-white/[0.02] px-6 py-16 text-center">
      <div aria-hidden="true" className="mx-auto mb-6 grid size-14 place-items-center border border-[#e65d40]/40 text-2xl text-[#f07859]">
        —
      </div>
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[#aeb6c3]">{description}</p>
    </section>
  );
}
