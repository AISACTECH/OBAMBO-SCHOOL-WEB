"use client";

import ContentManager from "@/components/admin/ContentManager";

export default function AdminMediaPage() {
  return (
    <ContentManager
      table="media"
      title="Media Library — School Gallery"
      columns={["category", "caption", "visibility", "consentStatus"]}
      fields={[
        { name: "url", label: "Photo / Video", type: "file", uploadCategory: "gallery", accept: "image/*" },
        { name: "type", label: "Type", type: "select", options: ["image", "video"] },
        { name: "category", label: "Category", type: "select", options: ["campus", "classrooms", "sports", "academics", "clubs", "events", "students", "staff", "community", "alumni"] },
        { name: "caption", label: "Caption", type: "text" },
        { name: "album", label: "Album", type: "text" },
        { name: "consentStatus", label: "Consent Status", type: "select", options: ["not_required", "consent_required", "consent_confirmed"] },
        { name: "visibility", label: "Visibility", type: "select", options: ["public", "school_only", "private"] },
      ]}
    />
  );
}
