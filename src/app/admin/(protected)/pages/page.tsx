"use client";

import ContentManager from "@/components/admin/ContentManager";

export default function AdminPagesPage() {
  return (
    <ContentManager
      table="pages"
      title="School Pages (About, Vision, Mission…)"
      columns={["slug", "title", "status"]}
      fields={[
        { name: "title", label: "Title", type: "text" },
        { name: "slug", label: "Slug (used in URL/anchor)", type: "text" },
        { name: "content", label: "Content", type: "textarea" },
        { name: "status", label: "Status", type: "select", options: ["draft", "published"] },
      ]}
    />
  );
}
