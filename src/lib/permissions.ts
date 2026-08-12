export type StaffRole =
  | "super_admin"
  | "school_admin"
  | "principal"
  | "teacher"
  | "content_editor"
  | "examination_officer"
  | "moderator"
  | "alumni_admin";

export const STAFF_ROLES: { value: StaffRole; label: string }[] = [
  { value: "super_admin", label: "Super Admin" },
  { value: "school_admin", label: "School Admin" },
  { value: "principal", label: "Principal" },
  { value: "teacher", label: "Teacher" },
  { value: "content_editor", label: "Content Editor" },
  { value: "examination_officer", label: "Examination Officer" },
  { value: "moderator", label: "Moderator" },
  { value: "alumni_admin", label: "Alumni Admin" },
];

export type Permission =
  | "manage_content"
  | "manage_results"
  | "manage_users"
  | "manage_settings"
  | "moderate_community"
  | "manage_alumni"
  | "view_audit_logs";

const ROLE_PERMISSIONS: Record<StaffRole, Permission[]> = {
  super_admin: [
    "manage_content",
    "manage_results",
    "manage_users",
    "manage_settings",
    "moderate_community",
    "manage_alumni",
    "view_audit_logs",
  ],
  school_admin: [
    "manage_content",
    "manage_results",
    "manage_users",
    "manage_settings",
    "moderate_community",
    "manage_alumni",
    "view_audit_logs",
  ],
  principal: ["manage_content", "manage_results", "moderate_community", "manage_alumni", "view_audit_logs"],
  teacher: ["manage_content"],
  content_editor: ["manage_content"],
  examination_officer: ["manage_results"],
  moderator: ["moderate_community"],
  alumni_admin: ["manage_alumni", "manage_content"],
};

export function hasPermission(role: string, permission: Permission) {
  return ROLE_PERMISSIONS[role as StaffRole]?.includes(permission) ?? false;
}

export function roleLabel(role: string) {
  return STAFF_ROLES.find((r) => r.value === role)?.label ?? role;
}
