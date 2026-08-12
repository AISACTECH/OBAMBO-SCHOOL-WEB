import type { Metadata } from "next";
import PageHero from "@/components/site/PageHero";
import ContactForm from "@/components/site/ContactForm";
import { getSchoolSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Contact St Mark's Secondary School – Obambo: phone, email, physical location and directions.",
};

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const settings = await getSchoolSettings();
  const waNumber = settings.whatsappNumber?.replace(/[^0-9]/g, "");

  return (
    <div>
      <PageHero eyebrow="Contact" title="Get in Touch with St Mark's" description="We would love to hear from parents, guardians, students and partners." />
      <div className="container-shell grid gap-10 py-12 lg:grid-cols-2">
        <div>
          <div className="card-surface space-y-4 p-6">
            <div>
              <h3 className="font-display font-semibold">Physical Address</h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{settings.address}</p>
            </div>
            <div>
              <h3 className="font-display font-semibold">Phone</h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{settings.phone || "Information awaiting school verification."}</p>
            </div>
            <div>
              <h3 className="font-display font-semibold">Email</h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{settings.email || "Information awaiting school verification."}</p>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              {settings.phone && <a href={`tel:${settings.phone}`} className="btn btn-primary">Call School</a>}
              {settings.email && <a href={`mailto:${settings.email}`} className="btn btn-outline">Email School</a>}
              {waNumber && <a href={`https://wa.me/${waNumber}`} className="btn btn-secondary" target="_blank" rel="noreferrer">WhatsApp</a>}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address || "")}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline"
              >
                Get Directions
              </a>
            </div>
          </div>
          <div className="card-surface mt-6 overflow-hidden">
            {settings.mapEmbedUrl ? (
              <iframe src={settings.mapEmbedUrl} className="h-72 w-full" loading="lazy" title="School location map" />
            ) : (
              <div className="grid h-56 place-items-center text-sm text-[var(--color-muted)]">
                Map embed will appear here once configured by the school administration.
              </div>
            )}
          </div>
        </div>
        <ContactForm />
      </div>
    </div>
  );
}
