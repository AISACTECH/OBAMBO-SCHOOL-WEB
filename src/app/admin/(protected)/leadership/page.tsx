"use client";

import ContentManager from "@/components/admin/ContentManager";

export default function AdminLeadershipPage() {
  return (
    <ContentManager
      table="leadership"
      title="School Leadership"
      columns={["name", "title", "department", "published"]}
      fields={[
        { name: "name", label: "Full Name", type: "text" },
        { name: "title", label: "Title / Role", type: "text" },
        { name: "department", label: "Department", type: "text" },
        { name: "bio", label: "Biography", type: "textarea" },
        { name: "photoUrl", label: "Photo", type: "file", uploadCategory: "leadership", accept: "image/*" },
        { name: "order", label: "Display Order", type: "number" },
        { name: "published", label: "Published", type: "checkbox" },
      ]}
    />
  );
}
