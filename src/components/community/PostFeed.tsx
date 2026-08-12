"use client";

import { useEffect, useState } from "react";

type Post = { id: number; authorName: string; title: string; content: string; createdAt: string; pinned: boolean };
type Comment = { id: number; authorName: string; content: string; createdAt: string };

export default function PostFeed({ groupSlug }: { groupSlug?: string }) {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [openComments, setOpenComments] = useState<number | null>(null);
  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [commentDraft, setCommentDraft] = useState("");

  async function load() {
    const qs = groupSlug ? `?group=${encodeURIComponent(groupSlug)}` : "";
    const res = await fetch(`/api/community/posts${qs}`);
    const data = await res.json();
    setPosts(data.posts || []);
  }

  useEffect(() => {
    const controller = new AbortController();
    const qs = groupSlug ? `?group=${encodeURIComponent(groupSlug)}` : "";
    void fetch(`/api/community/posts${qs}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not load posts");
        return res.json();
      })
      .then((data) => {
        if (!controller.signal.aborted) setPosts(data.posts || []);
      })
      .catch(() => {
        if (!controller.signal.aborted) setPosts([]);
      });
    return () => controller.abort();
  }, [groupSlug]);

  async function submitPost(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/community/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, groupSlug }),
    });
    if (res.ok) {
      setContent("");
      load();
    } else {
      const data = await res.json();
      setError(data.error);
    }
  }

  async function toggleComments(postId: number) {
    if (openComments === postId) {
      setOpenComments(null);
      return;
    }
    setOpenComments(postId);
    if (!comments[postId]) {
      const res = await fetch(`/api/community/comments?postId=${postId}`);
      const data = await res.json();
      setComments((prev) => ({ ...prev, [postId]: data.comments || [] }));
    }
  }

  async function submitComment(postId: number) {
    if (!commentDraft.trim()) return;
    const res = await fetch("/api/community/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, content: commentDraft }),
    });
    if (res.ok) {
      setCommentDraft("");
      const refreshed = await fetch(`/api/community/comments?postId=${postId}`);
      const data = await refreshed.json();
      setComments((prev) => ({ ...prev, [postId]: data.comments || [] }));
    }
  }

  async function react(postId: number) {
    await fetch("/api/community/react", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId }) });
  }

  async function report(postId: number) {
    const reason = window.prompt("Why are you reporting this post?");
    if (!reason) return;
    await fetch("/api/community/report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetType: "post", targetId: postId, reason }) });
    alert("Thank you. Our moderation team will review this post.");
  }

  return (
    <div>
      <form onSubmit={submitPost} className="card-surface p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share something with the St Mark's community..."
          rows={3}
          className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
        />
        {error && <p className="mt-2 text-xs text-[var(--color-danger)]">{error}</p>}
        <div className="mt-2 flex justify-end">
          <button className="btn btn-primary !py-1.5 text-xs">Post</button>
        </div>
      </form>

      <div className="mt-4 space-y-3">
        {posts === null && <div className="skeleton h-24 w-full" />}
        {posts?.length === 0 && <p className="text-sm text-[var(--color-muted)]">No posts yet — be the first to start a conversation.</p>}
        {posts?.map((p) => (
          <div key={p.id} className="card-surface p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{p.authorName}</p>
              <p className="text-xs text-[var(--color-muted)]">{new Date(p.createdAt).toLocaleDateString("en-KE")}</p>
            </div>
            <p className="mt-2 whitespace-pre-line text-sm">{p.content}</p>
            <div className="mt-3 flex gap-3 text-xs font-medium text-[var(--color-muted)]">
              <button onClick={() => react(p.id)} className="hover:text-[var(--color-primary)]">👍 Like</button>
              <button onClick={() => toggleComments(p.id)} className="hover:text-[var(--color-primary)]">💬 Comment</button>
              <button onClick={() => report(p.id)} className="hover:text-[var(--color-danger)]">🚩 Report</button>
            </div>
            {openComments === p.id && (
              <div className="mt-3 space-y-2 border-t border-[var(--color-border)] pt-3">
                {(comments[p.id] || []).map((c) => (
                  <div key={c.id} className="rounded-lg bg-[var(--color-bg)] p-2 text-xs">
                    <span className="font-semibold">{c.authorName}: </span>{c.content}
                  </div>
                ))}
                <div className="flex gap-2">
                  <input value={commentDraft} onChange={(e) => setCommentDraft(e.target.value)} placeholder="Write a comment..." className="flex-1 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs" />
                  <button onClick={() => submitComment(p.id)} className="btn btn-outline !py-1.5 text-xs">Send</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
