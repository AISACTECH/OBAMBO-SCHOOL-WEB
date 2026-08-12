import type { Metadata } from "next";
import PageHero from "@/components/site/PageHero";
import FeedbackForm from "@/components/site/FeedbackForm";

export const metadata: Metadata = { title: "Voice of the School Community" };

export default function FeedbackPage() {
  return (
    <div>
      <PageHero eyebrow="Voice of the Community" title="Share Your Suggestions & Feedback" description="Help us improve St Mark's — academics, facilities, student life, technology, sports, clubs and community." />
      <div className="container-shell max-w-2xl py-12">
        <FeedbackForm />
      </div>
    </div>
  );
}
