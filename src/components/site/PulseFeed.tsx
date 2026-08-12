import Link from "next/link";

type PulseItem = {
  id: string;
  kind: "announcement" | "event" | "resource";
  title: string;
  detail: string;
  href: string;
  date: Date;
  priority?: string;
};

const KIND_ICON: Record<string, string> = {
  announcement: "📣",
  event: "📅",
  resource: "📘",
};

export default function PulseFeed({ items }: { items: PulseItem[] }) {
  if (items.length === 0) {
    return (
      <div className="card-surface p-6 text-sm text-[var(--color-muted)]">
        You&apos;re all caught up. New school updates will appear here as soon as they are published.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className="card-surface group flex items-start gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] text-lg">
            {KIND_ICON[item.kind]}
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-2">
              <span className="line-clamp-1 font-display text-sm font-semibold group-hover:text-[var(--color-primary)]">
                {item.title}
              </span>
              {item.priority && item.priority !== "normal" && (
                <span className={`badge badge-${item.priority} shrink-0`}>{item.priority}</span>
              )}
            </span>
            <span className="mt-1 line-clamp-2 block text-xs text-[var(--color-muted)]">{item.detail}</span>
            <span className="mt-1 block text-[11px] font-medium text-[var(--color-muted)]">
              {new Date(item.date).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}
