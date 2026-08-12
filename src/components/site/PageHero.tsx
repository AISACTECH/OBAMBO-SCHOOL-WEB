export default function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <section className="border-b border-[var(--color-border)]" style={{ background: "var(--gradient-hero)" }}>
      <div className="container-shell py-14 text-white">
        <span className="badge bg-white/15 text-white">{eyebrow}</span>
        <h1 className="font-display mt-4 text-3xl font-bold md:text-4xl">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-white/85">{description}</p>}
      </div>
    </section>
  );
}
