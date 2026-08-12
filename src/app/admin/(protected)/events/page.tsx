"use client";

import ContentManager from "@/components/admin/ContentManager";

export default function AdminEventsPage() {
  return (
    <ContentManager
      table="events"
      title="Events & Calendar"
      columns={["title", "category", "location", "status"]}
      fields={[
        { name: "title", label: "Title", type: "text" },
        { name: "description", label: "Description", type: "textarea" },
        { name: "location", label: "Location", type: "text" },
        { name: "organizer", label: "Organizer", type: "text" },
        { name: "imageUrl", label: "Image", type: "file", uploadCategory: "events", accept: "image/*" },
        { name: "audience", label: "Audience", type: "select", options: ["everyone", "students", "parents", "teachers", "alumni"] },
        { name: "category", label: "Category", type: "select", options: ["events", "sports", "meetings", "examinations", "holidays", "clubs", "admissions"] },
        { name: "startAt", label: "Start Date & Time", type: "date" },
        { name: "status", label: "Status", type: "select", options: ["draft", "published", "archived"] },
      ]}
    />
  );
}
