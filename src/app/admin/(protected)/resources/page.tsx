"use client";

import ContentManager from "@/components/admin/ContentManager";

export default function AdminResourcesPage() {
  return (
    <ContentManager
      table="resources"
      title="Learning Hub — Resources"
      columns={["title", "subject", "form", "term", "year", "downloadCount"]}
      fields={[
        { name: "title", label: "Title", type: "text" },
        { name: "description", label: "Description", type: "textarea" },
        { name: "subject", label: "Subject", type: "text" },
        { name: "form", label: "Form / Grade", type: "select", options: ["Form 1", "Form 2", "Form 3", "Form 4"] },
        { name: "term", label: "Term", type: "select", options: ["Term 1", "Term 2", "Term 3"] },
        { name: "year", label: "Year", type: "number" },
        { name: "category", label: "Category", type: "select", options: ["notes", "revision-papers", "past-papers", "marking-schemes", "assignments", "study-guides", "school-documents"] },
        { name: "fileUrl", label: "Upload File", type: "file", uploadCategory: "resources", accept: ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" },
        { name: "uploaderName", label: "Uploaded By", type: "text" },
        { name: "status", label: "Status", type: "select", options: ["draft", "published", "archived"] },
      ]}
    />
  );
}
