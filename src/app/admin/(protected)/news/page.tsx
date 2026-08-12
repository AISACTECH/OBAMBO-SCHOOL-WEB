"use client";

import ContentManager from "@/components/admin/ContentManager";

export default function AdminNewsPage() {
  return (
    <ContentManager
      table="news"
      title="School News"
      columns={["title", "category", "status", "featured", "trending"]}
      fields={[
        { name: "title", label: "Headline", type: "text" },
        { name: "excerpt", label: "Excerpt", type: "textarea" },
        { name: "content", label: "Full Story", type: "textarea" },
        { name: "imageUrl", label: "Cover Image", type: "file", uploadCategory: "news", accept: "image/*" },
        { name: "category", label: "Category", type: "select", options: ["academic-achievements", "sports", "clubs", "leadership", "student-life", "community", "events", "alumni", "school-development"] },
        { name: "authorName", label: "Author", type: "text" },
        { name: "readingTimeMinutes", label: "Reading Time (minutes)", type: "number" },
        { name: "featured", label: "Featured Story", type: "checkbox" },
        { name: "trending", label: "Trending", type: "checkbox" },
        { name: "status", label: "Status", type: "select", options: ["draft", "published", "scheduled", "archived"] },
      ]}
    />
  );
}
