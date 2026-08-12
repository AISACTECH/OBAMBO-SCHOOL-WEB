import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { groups, pollOptions, pollVotes, polls } from "@/db/schema";
import { and, asc, eq, sql } from "drizzle-orm";
import { currentIdentity } from "@/lib/identity";
import { canAccessGroup } from "@/lib/community-access";

const voteSchema = z.object({ optionId: z.coerce.number().int().positive() });

async function getAccessiblePoll(pollId: number) {
  const [poll] = await db.select().from(polls).where(eq(polls.id, pollId)).limit(1);
  if (!poll) return null;
  if (!poll.groupId) return poll;
  const [group] = await db.select().from(groups).where(eq(groups.id, poll.groupId)).limit(1);
  const identity = await currentIdentity();
  return group && await canAccessGroup(group, identity) ? poll : null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pollId = Number(id);
  if (!Number.isSafeInteger(pollId) || pollId < 1) return NextResponse.json({ error: "Poll not found." }, { status: 404 });
  const poll = await getAccessiblePoll(pollId);
  if (!poll) return NextResponse.json({ error: "Poll not found." }, { status: 404 });

  const [options, groupedVotes, totalVoteRows] = await Promise.all([
    db.select().from(pollOptions).where(eq(pollOptions.pollId, pollId)).orderBy(asc(pollOptions.order)),
    db.select({ optionId: pollVotes.optionId, count: sql<number>`count(*)` }).from(pollVotes).where(eq(pollVotes.pollId, pollId)).groupBy(pollVotes.optionId),
    db.select({ count: sql<number>`count(*)` }).from(pollVotes).where(eq(pollVotes.pollId, pollId)),
  ]);
  const voteCounts = new Map(groupedVotes.map((vote) => [vote.optionId, Number(vote.count)]));
  const counts = options.map((option) => ({ id: option.id, label: option.label, votes: voteCounts.get(option.id) || 0 }));
  const identity = await currentIdentity();
  const myVote = identity ? await db.select({ optionId: pollVotes.optionId }).from(pollVotes).where(and(eq(pollVotes.pollId, pollId), eq(pollVotes.voterType, identity.type), eq(pollVotes.voterId, identity.id))).limit(1) : [];

  return NextResponse.json({ poll, options: counts, totalVotes: Number(totalVoteRows[0]?.count || 0), myVoteOptionId: myVote[0]?.optionId ?? null });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const identity = await currentIdentity();
  if (!identity) return NextResponse.json({ error: "Please sign in to vote." }, { status: 401 });

  const { id } = await params;
  const pollId = Number(id);
  if (!Number.isSafeInteger(pollId) || pollId < 1) return NextResponse.json({ error: "Poll not found." }, { status: 404 });
  const poll = await getAccessiblePoll(pollId);
  if (!poll || poll.status !== "open") return NextResponse.json({ error: "This poll is closed." }, { status: 400 });
  if (poll.closesAt && new Date(poll.closesAt) <= new Date()) return NextResponse.json({ error: "This poll is closed." }, { status: 400 });

  const parsed = voteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please select an option." }, { status: 400 });
  const [option] = await db
    .select({ id: pollOptions.id })
    .from(pollOptions)
    .where(and(eq(pollOptions.id, parsed.data.optionId), eq(pollOptions.pollId, pollId)))
    .limit(1);
  if (!option) return NextResponse.json({ error: "That option does not belong to this poll." }, { status: 400 });

  try {
    await db.insert(pollVotes).values({ pollId, optionId: option.id, voterType: identity.type, voterId: identity.id });
  } catch {
    return NextResponse.json({ error: "You have already voted in this poll." }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}
