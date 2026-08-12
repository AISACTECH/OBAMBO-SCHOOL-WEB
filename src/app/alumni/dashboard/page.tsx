"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Profile = {
  name: string; email: string; graduationYear: number | null; profession: string | null; industry: string | null;
  location: string | null; bio: string | null; linkedin: string | null; website: string | null;
  mentorshipAvailable: boolean; privacy: string; verified: boolean;
};

export default function AlumniDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/alumni/profile", { signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401 || response.status === 403) {
          router.replace("/alumni/login");
          throw new Error("Your alumni session is no longer active.");
        }
        if (!response.ok) throw new Error("Could not load your alumni profile.");
        return response.json();
      })
      .then((data) => {
        if (!controller.signal.aborted) setProfile(data.profile || null);
      })
      .catch((caught: unknown) => {
        if (!controller.signal.aborted && !(caught instanceof DOMException && caught.name === "AbortError")) setError(caught instanceof Error ? caught.message : "Could not load your alumni profile.");
      });
    return () => controller.abort();
  }, [router]);

  async function logout() {
    await fetch("/api/alumni/logout", { method: "POST" });
    router.push("/alumni/login");
    router.refresh();
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    const res = await fetch("/api/alumni/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        graduationYear: profile.graduationYear,
        profession: profile.profession,
        industry: profile.industry,
        location: profile.location,
        bio: profile.bio,
        linkedin: profile.linkedin,
        website: profile.website,
        mentorshipAvailable: profile.mentorshipAvailable,
        privacy: profile.privacy,
      }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  if (error) return <div className="container-shell py-12"><div className="card-surface p-8 text-center text-sm text-[var(--color-danger)]">{error}</div></div>;
  if (!profile) return <div className="container-shell py-12"><div className="skeleton h-64 w-full" /></div>;

  return (
    <div className="container-shell max-w-3xl py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Welcome back, {profile.name.split(" ")[0]}</h1>
          {!profile.verified && <p className="mt-1 text-sm text-[var(--color-warning)]">Your alumni profile is pending verification.</p>}
        </div>
        <button onClick={logout} className="btn btn-outline">Sign Out</button>
      </div>

      <form onSubmit={save} className="card-surface mt-6 space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Graduation Year"><input type="number" value={profile.graduationYear || ""} onChange={(e) => setProfile({ ...profile, graduationYear: Number(e.target.value) })} className="input" /></Field>
          <Field label="Profession"><input value={profile.profession || ""} onChange={(e) => setProfile({ ...profile, profession: e.target.value })} className="input" /></Field>
          <Field label="Industry"><input value={profile.industry || ""} onChange={(e) => setProfile({ ...profile, industry: e.target.value })} className="input" /></Field>
          <Field label="Location (city/country)"><input value={profile.location || ""} onChange={(e) => setProfile({ ...profile, location: e.target.value })} className="input" /></Field>
          <Field label="LinkedIn / Website"><input value={profile.linkedin || ""} onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })} className="input" /></Field>
          <Field label="Profile Visibility">
            <select value={profile.privacy} onChange={(e) => setProfile({ ...profile, privacy: e.target.value })} className="input">
              <option value="public">Public</option>
              <option value="alumni_only">Alumni Only</option>
              <option value="private">Private</option>
            </select>
          </Field>
        </div>
        <Field label="Biography"><textarea rows={4} value={profile.bio || ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} className="input" /></Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={profile.mentorshipAvailable} onChange={(e) => setProfile({ ...profile, mentorshipAvailable: e.target.checked })} />
          I am available as a mentor for current students
        </label>
        <button className="btn btn-primary">Save Profile</button>
        {saved && <p className="text-sm text-[var(--color-success)]">Profile updated successfully.</p>}
      </form>

      <style>{`.input { width: 100%; margin-top: 4px; border-radius: 0.5rem; border: 1px solid var(--color-border); padding: 0.5rem 0.75rem; font-size: 0.875rem; }`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      {children}
    </label>
  );
}
