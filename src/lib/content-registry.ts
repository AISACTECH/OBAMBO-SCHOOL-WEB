import {
  alumniStories,
  announcements,
  developmentProjects,
  documents,
  events,
  examinations,
  facilities,
  leadershipProfiles,
  media,
  news,
  pages,
  resources,
} from "@/db/schema";
import type { Permission } from "@/lib/permissions";

// Drizzle's table type is intentionally erased here because this registry is
// selected by a URL segment. The writable field list is the important safety
// boundary: admin clients must not be able to mutate IDs, counters, hashes or
// timestamps by sending arbitrary JSON to the generic content endpoint.
export type ContentEntry = { table: any; permission: Permission; hasSlug?: boolean; titleField?: string; writable: string[] };

export const CONTENT_REGISTRY: Record<string, ContentEntry> = {
  announcements: {
    table: announcements,
    permission: "manage_content",
    hasSlug: true,
    titleField: "title",
    writable: ["title", "summary", "content", "imageUrl", "category", "priority", "authorName", "pinned", "targetAudience", "status", "publishAt", "expiryAt", "attachments"],
  },
  news: {
    table: news,
    permission: "manage_content",
    hasSlug: true,
    titleField: "title",
    writable: ["title", "excerpt", "content", "imageUrl", "category", "authorName", "readingTimeMinutes", "featured", "trending", "status", "gallery", "publishedAt"],
  },
  events: {
    table: events,
    permission: "manage_content",
    hasSlug: true,
    titleField: "title",
    writable: ["title", "description", "location", "organizer", "imageUrl", "audience", "category", "startAt", "endAt", "status"],
  },
  resources: {
    table: resources,
    permission: "manage_content",
    titleField: "title",
    writable: ["title", "description", "subject", "form", "term", "year", "category", "fileUrl", "fileType", "fileSize", "uploaderName", "tags", "status"],
  },
  leadership: {
    table: leadershipProfiles,
    permission: "manage_content",
    titleField: "name",
    writable: ["name", "title", "department", "bio", "photoUrl", "order", "published"],
  },
  documents: {
    table: documents,
    permission: "manage_content",
    titleField: "title",
    writable: ["title", "category", "fileUrl", "fileType", "fileSize", "visibility"],
  },
  media: {
    table: media,
    permission: "manage_content",
    writable: ["url", "type", "category", "caption", "album", "consentStatus", "visibility"],
  },
  "development-projects": {
    table: developmentProjects,
    permission: "manage_content",
    titleField: "title",
    writable: ["title", "description", "status", "target", "timeline", "imageUrl", "published"],
  },
  facilities: {
    table: facilities,
    permission: "manage_content",
    titleField: "name",
    writable: ["name", "category", "description", "imageUrl", "published"],
  },
  examinations: {
    table: examinations,
    permission: "manage_results",
    titleField: "name",
    writable: ["name", "term", "year", "status"],
  },
  "alumni-stories": {
    table: alumniStories,
    permission: "manage_alumni",
    titleField: "title",
    writable: ["alumniId", "name", "graduationYear", "photoUrl", "title", "journey", "currentRole", "quote", "links", "published"],
  },
  pages: {
    table: pages,
    permission: "manage_content",
    titleField: "title",
    writable: ["slug", "title", "content", "status"],
  },
};

export function pickWritableFields(body: unknown, entry: ContentEntry): Record<string, unknown> | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const source = body as Record<string, unknown>;
  const picked = Object.fromEntries(
    Object.entries(source).filter(([key]) => entry.writable.includes(key)),
  );
  return Object.keys(picked).length > 0 ? picked : null;
}
