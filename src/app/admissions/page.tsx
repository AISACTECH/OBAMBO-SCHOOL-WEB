import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import VerifiedNotice from "@/components/site/VerifiedNotice";
import { getPage } from "@/lib/data";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { eq } from "drizzle-orm";

export const metadata: Metadata = {
  title: "Admissions",
  description: "Admission information, joining instructions, requirements and important dates for St Mark's Secondary School – Obambo.",
};

export const dynamic = "force-dynamic";

const FAQS = [
  { q: "How do I apply for admission?", a: "Contact the school administration directly using the details on our Contact page. Formal online applications will be published here once confirmed by the school." },
  { q: "What documents are required?", a: "Official document requirements are awaiting school verification. Please contact the admissions office for the current list." },
  { q: "Is boarding available?", a: "Boarding arrangement details are awaiting school verification." },
  { q: "How do I access learning resources before joining?", a: "Publicly published study guides are available in our Learning Hub." },
];

export default async function AdmissionsPage() {
  const [page, docs] = await Promise.all([
    getPage("admissions"),
    db.select().from(documents).where(eq(documents.category, "admission")).limit(6),
  ]);

  return (
    <div>
      <PageHero eyebrow="Admissions" title="Join St Mark's Secondary School – Obambo" description="Everything you need to begin the admission process." />
      <div className="container-shell grid gap-10 py-12 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-8">
          <div>
            <h2 className="font-display text-2xl font-bold">Admission Information</h2>
            <p className="mt-3 whitespace-pre-line text-[var(--color-text)]/85">{page?.content}</p>
            <div className="mt-3"><VerifiedNotice /></div>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold">Admission Forms & Downloads</h2>
            {docs.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--color-muted)]">Admission forms will be published here once provided by the school.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {docs.map((d) => (
                  <li key={d.id} className="card-surface flex items-center justify-between p-4 text-sm">
                    <span>{d.title}</span>
                    <a href={d.fileUrl} className="btn btn-outline !py-1.5" download>Download</a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold">Frequently Asked Questions</h2>
            <div className="mt-4 space-y-3">
              {FAQS.map((f) => (
                <details key={f.q} className="card-surface p-4">
                  <summary className="cursor-pointer font-semibold">{f.q}</summary>
                  <p className="mt-2 text-sm text-[var(--color-muted)]">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="card-surface p-5">
            <h3 className="font-display font-semibold">Contact Admissions</h3>
            <p className="mt-2 text-sm text-[var(--color-muted)]">Speak directly with the school administration about admissions.</p>
            <Link href="/contact" className="btn btn-primary mt-4 w-full">Contact School</Link>
          </div>
          <div className="card-surface p-5">
            <h3 className="font-display font-semibold">Download Centre</h3>
            <p className="mt-2 text-sm text-[var(--color-muted)]">Browse all official school documents in one place.</p>
            <Link href="/downloads" className="btn btn-outline mt-4 w-full">Open Download Centre</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
