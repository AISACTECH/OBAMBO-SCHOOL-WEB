"use client";

import ContentManager from "@/components/admin/ContentManager";

export default function AdminAnnouncementsPage() {
  return (
    <ContentManager
      table="announcements"
      title="Announcements"
      columns={["title", "category", "priority", "status", "pinned"]}
      fields={[
        { name: "title", label: "Title", type: "text" },
        { name: "summary", label: "Summary", type: "textarea" },
        { name: "content", label: "Full Content", type: "textarea" },
        { name: "imageUrl", label: "Image", type: "file", uploadCategory: "announcements", accept: "image/*" },
        { name: "category", label: "Category", type: "select", options: ["general", "academic", "examination", "admission", "students", "parents", "teachers", "events", "clubs", "sports", "emergency", "alumni", "community"] },
        { name: "priority", label: "Priority", type: "select", options: ["normal", "important", "urgent", "emergency"] },
        { name: "targetAudience", label: "Target Audience", type: "select", options: ["everyone", "students", "parents", "teachers", "alumni"] },
        { name: "pinned", label: "Pinned", type: "checkbox" },
        { name: "status", label: "Status", type: "select", options: ["draft", "published", "scheduled", "archived"] },
        { name: "authorName", label: "Author", type: "text" },
      ]}
    />
  );
}
