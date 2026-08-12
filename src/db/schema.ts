import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  jsonb,
  doublePrecision,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

/* -------------------------------------------------------------------------- */
/*  CORE IDENTITY & SETTINGS                                                  */
/* -------------------------------------------------------------------------- */

export const schoolSettings = pgTable("school_settings", {
  id: serial("id").primaryKey(),
  schoolName: text("school_name").notNull().default("St Mark's Secondary School – Obambo"),
  motto: text("motto").default("Information awaiting school verification."),
  vision: text("vision").default("Information awaiting school verification."),
  mission: text("mission").default("Information awaiting school verification."),
  coreValues: text("core_values").default("Information awaiting school verification."),
  history: text("history").default("Information awaiting school verification."),
  address: text("address").default("Obambo, South West Kisumu Ward, Kisumu West Sub-County, Kisumu County, Kenya"),
  phone: text("phone").default(""),
  email: text("email").default(""),
  mapEmbedUrl: text("map_embed_url").default(""),
  facebookUrl: text("facebook_url").default(""),
  twitterUrl: text("twitter_url").default(""),
  instagramUrl: text("instagram_url").default(""),
  youtubeUrl: text("youtube_url").default(""),
  whatsappNumber: text("whatsapp_number").default(""),
  primaryColor: text("primary_color").notNull().default("#0b6e4f"),
  secondaryColor: text("secondary_color").notNull().default("#f2b134"),
  accentColor: text("accent_color").notNull().default("#0a3d62"),
  statsVisibility: jsonb("stats_visibility").$type<Record<string, boolean>>().default({
    students: false,
    teachers: false,
    alumni: false,
    resources: true,
    years: false,
    clubs: false,
  }),
  statsValues: jsonb("stats_values").$type<Record<string, number>>().default({}),
  dataSaverDefault: boolean("data_saver_default").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Roles: super_admin, school_admin, principal, teacher, content_editor, examination_officer, moderator, alumni_admin
export const staffUsers = pgTable(
  "staff_users",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("content_editor"),
    active: boolean("active").notNull().default(true),
    failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("staff_users_email_idx").on(t.email)],
);

/* -------------------------------------------------------------------------- */
/*  STUDENTS                                                                  */
/* -------------------------------------------------------------------------- */

export const students = pgTable(
  "students",
  {
    id: serial("id").primaryKey(),
    admissionNumber: text("admission_number").notNull(),
    name: text("name").notNull(),
    form: text("form").notNull().default("Form 1"),
    stream: text("stream").default(""),
    passwordHash: text("password_hash").notNull(),
    birthCertHash: text("birth_cert_hash").notNull(),
    birthCertLast4: text("birth_cert_last4").notNull().default(""),
    status: text("status").notNull().default("active"),
    admittedYear: integer("admitted_year"),
    failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("students_admission_number_idx").on(t.admissionNumber)],
);

export const savedResources = pgTable("saved_resources", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  resourceId: integer("resource_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("saved_resources_student_resource_idx").on(t.studentId, t.resourceId)]);

/* -------------------------------------------------------------------------- */
/*  ALUMNI                                                                    */
/* -------------------------------------------------------------------------- */

export const alumni = pgTable(
  "alumni",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash"),
    authProvider: text("auth_provider").notNull().default("credentials"),
    graduationYear: integer("graduation_year"),
    profession: text("profession").default(""),
    industry: text("industry").default(""),
    location: text("location").default(""),
    bio: text("bio").default(""),
    photoUrl: text("photo_url").default(""),
    linkedin: text("linkedin").default(""),
    website: text("website").default(""),
    skills: jsonb("skills").$type<string[]>().default([]),
    achievements: text("achievements").default(""),
    mentorshipAvailable: boolean("mentorship_available").notNull().default(false),
    mentorTypes: jsonb("mentor_types").$type<string[]>().default([]),
    privacy: text("privacy").notNull().default("alumni_only"),
    verified: boolean("verified").notNull().default(false),
    active: boolean("active").notNull().default(true),
    failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("alumni_email_idx").on(t.email)],
);

export const alumniStories = pgTable("alumni_stories", {
  id: serial("id").primaryKey(),
  alumniId: integer("alumni_id"),
  name: text("name").notNull(),
  graduationYear: integer("graduation_year"),
  photoUrl: text("photo_url").default(""),
  title: text("title").notNull(),
  journey: text("journey").notNull(),
  currentRole: text("current_role").default(""),
  quote: text("quote").default(""),
  links: jsonb("links").$type<{ label: string; url: string }[]>().default([]),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* -------------------------------------------------------------------------- */
/*  STAFF / LEADERSHIP PROFILES (public)                                     */
/* -------------------------------------------------------------------------- */

export const leadershipProfiles = pgTable("leadership_profiles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  department: text("department").default(""),
  bio: text("bio").default("Information awaiting school verification."),
  photoUrl: text("photo_url").default(""),
  order: integer("order").notNull().default(0),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* -------------------------------------------------------------------------- */
/*  CONTENT: ANNOUNCEMENTS / NEWS / EVENTS / PAGES                            */
/* -------------------------------------------------------------------------- */

export const announcements = pgTable(
  "announcements",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    summary: text("summary").notNull(),
    content: text("content").notNull(),
    imageUrl: text("image_url").default(""),
    category: text("category").notNull().default("general"),
    priority: text("priority").notNull().default("normal"),
    authorId: integer("author_id"),
    authorName: text("author_name").default("School Administration"),
    pinned: boolean("pinned").notNull().default(false),
    targetAudience: text("target_audience").notNull().default("everyone"),
    status: text("status").notNull().default("published"),
    publishAt: timestamp("publish_at", { withTimezone: true }).defaultNow(),
    expiryAt: timestamp("expiry_at", { withTimezone: true }),
    attachments: jsonb("attachments").$type<{ name: string; url: string }[]>().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("announcements_slug_idx").on(t.slug)],
);

export const news = pgTable(
  "news",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    excerpt: text("excerpt").notNull(),
    content: text("content").notNull(),
    imageUrl: text("image_url").default(""),
    category: text("category").notNull().default("student-life"),
    authorId: integer("author_id"),
    authorName: text("author_name").default("Communications Office"),
    readingTimeMinutes: integer("reading_time_minutes").notNull().default(3),
    featured: boolean("featured").notNull().default(false),
    trending: boolean("trending").notNull().default(false),
    status: text("status").notNull().default("published"),
    gallery: jsonb("gallery").$type<string[]>().default([]),
    publishedAt: timestamp("published_at", { withTimezone: true }).defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("news_slug_idx").on(t.slug)],
);

export const events = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    description: text("description").notNull(),
    location: text("location").default(""),
    organizer: text("organizer").default("St Mark's Secondary School – Obambo"),
    imageUrl: text("image_url").default(""),
    audience: text("audience").notNull().default("everyone"),
    category: text("category").notNull().default("events"),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }),
    status: text("status").notNull().default("published"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("events_slug_idx").on(t.slug)],
);

export const pages = pgTable(
  "pages",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    content: text("content").notNull().default("Information awaiting school verification."),
    status: text("status").notNull().default("published"),
    updatedById: integer("updated_by_id"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("pages_slug_idx").on(t.slug)],
);

/* -------------------------------------------------------------------------- */
/*  ACADEMICS + LEARNING HUB                                                  */
/* -------------------------------------------------------------------------- */

export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  department: text("department").default("General"),
});

export const classForms = pgTable("class_forms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  level: integer("level").notNull().default(1),
});

export const examinations = pgTable("examinations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  term: text("term").notNull().default("Term 1"),
  year: integer("year").notNull(),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").default(""),
  subject: text("subject").notNull().default("General"),
  form: text("form").notNull().default("Form 1"),
  term: text("term").notNull().default("Term 1"),
  year: integer("year").notNull(),
  category: text("category").notNull().default("notes"),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type").notNull().default("pdf"),
  fileSize: integer("file_size").notNull().default(0),
  uploaderName: text("uploader_name").default("School Administration"),
  downloadCount: integer("download_count").notNull().default(0),
  viewCount: integer("view_count").notNull().default(0),
  tags: jsonb("tags").$type<string[]>().default([]),
  status: text("status").notNull().default("published"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* -------------------------------------------------------------------------- */
/*  RESULTS ENGINE (private)                                                  */
/* -------------------------------------------------------------------------- */

export const results = pgTable(
  "results",
  {
    id: serial("id").primaryKey(),
    studentId: integer("student_id").notNull(),
    admissionNumber: text("admission_number").notNull(),
    examName: text("exam_name").notNull(),
    subject: text("subject").notNull(),
    marks: doublePrecision("marks").notNull(),
    grade: text("grade").notNull(),
    points: doublePrecision("points").default(0),
    teacherComment: text("teacher_comment").default(""),
    term: text("term").notNull(),
    year: integer("year").notNull(),
    logicalKey: text("logical_key"),
    importId: integer("import_id"),
    status: text("status").notNull().default("published"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("results_student_idx").on(t.studentId), uniqueIndex("results_logical_key_idx").on(t.logicalKey)],
);

type ResultSnapshot = {
  id: number;
  studentId: number;
  admissionNumber: string;
  examName: string;
  subject: string;
  marks: number;
  grade: string;
  points: number | null;
  teacherComment: string | null;
  term: string;
  year: number;
  logicalKey: string | null;
  importId: number | null;
  status: string;
};

export const resultImports = pgTable("result_imports", {
  id: serial("id").primaryKey(),
  source: text("source").notNull().default("google_sheet_csv"),
  sourceUrl: text("source_url").default(""),
  importedByName: text("imported_by_name").default("School Administration"),
  totalRows: integer("total_rows").notNull().default(0),
  validRows: integer("valid_rows").notNull().default(0),
  invalidRows: integer("invalid_rows").notNull().default(0),
  status: text("status").notNull().default("pending"),
  errorReport: jsonb("error_report").$type<
    { row: number; field: string; value: string; error: string; suggestedFix: string }[]
  >().default([]),
  previousRows: jsonb("previous_rows").$type<ResultSnapshot[]>().default([]),
  rolledBack: boolean("rolled_back").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* -------------------------------------------------------------------------- */
/*  GOOGLE SHEETS INTEGRATION                                                  */
/* -------------------------------------------------------------------------- */

export const googleSheetConnections = pgTable(
  "google_sheet_connections",
  {
    id: serial("id").primaryKey(),
    googleAccountEmail: text("google_account_email").default(""),
    spreadsheetId: text("spreadsheet_id").notNull().default(""),
    spreadsheetName: text("spreadsheet_name").default(""),
    worksheetTitle: text("worksheet_title").notNull().default("Performance"),
    worksheetId: integer("worksheet_id"),
    dataRange: text("data_range").notNull().default("A1:M"),
    accessTokenEncrypted: text("access_token_encrypted"),
    refreshTokenEncrypted: text("refresh_token_encrypted"),
    tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
    scopes: text("scopes").default(""),
    status: text("status").notNull().default("authorized"),
    lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
    lastError: text("last_error").default(""),
    createdById: integer("created_by_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("google_sheet_connections_status_idx").on(t.status)],
);

export const googleOAuthStates = pgTable(
  "google_oauth_states",
  {
    id: serial("id").primaryKey(),
    stateHash: text("state_hash").notNull(),
    staffId: integer("staff_id").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("google_oauth_states_hash_idx").on(t.stateHash)],
);

/* -------------------------------------------------------------------------- */
/*  COMMUNITY: GROUPS / POSTS / COMMENTS / REACTIONS / POLLS                  */
/* -------------------------------------------------------------------------- */

export const groups = pgTable(
  "groups",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description").default(""),
    coverImage: text("cover_image").default(""),
    category: text("category").notNull().default("community"),
    visibility: text("visibility").notNull().default("school_only"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("groups_slug_idx").on(t.slug)],
);

export const groupMembers = pgTable("group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  memberType: text("member_type").notNull().default("alumni"),
  memberId: integer("member_id").notNull(),
  memberName: text("member_name").notNull(),
  role: text("role").notNull().default("member"),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id"),
  topic: text("topic").notNull().default("general"),
  authorType: text("author_type").notNull().default("alumni"),
  authorId: integer("author_id"),
  authorName: text("author_name").notNull(),
  title: text("title").default(""),
  content: text("content").notNull(),
  imageUrl: text("image_url").default(""),
  status: text("status").notNull().default("published"),
  pinned: boolean("pinned").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  authorType: text("author_type").notNull().default("alumni"),
  authorId: integer("author_id"),
  authorName: text("author_name").notNull(),
  content: text("content").notNull(),
  status: text("status").notNull().default("published"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reactions = pgTable("reactions", {
  id: serial("id").primaryKey(),
  postId: integer("post_id"),
  commentId: integer("comment_id"),
  authorType: text("author_type").notNull().default("alumni"),
  authorId: integer("author_id").notNull(),
  type: text("type").notNull().default("like"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const polls = pgTable("polls", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  description: text("description").default(""),
  type: text("type").notNull().default("single_choice"),
  anonymous: boolean("anonymous").notNull().default(true),
  groupId: integer("group_id"),
  closesAt: timestamp("closes_at", { withTimezone: true }),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pollOptions = pgTable("poll_options", {
  id: serial("id").primaryKey(),
  pollId: integer("poll_id").notNull(),
  label: text("label").notNull(),
  order: integer("order").notNull().default(0),
});

export const pollVotes = pgTable(
  "poll_votes",
  {
    id: serial("id").primaryKey(),
    pollId: integer("poll_id").notNull(),
    optionId: integer("option_id").notNull(),
    voterType: text("voter_type").notNull().default("alumni"),
    voterId: integer("voter_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("poll_votes_unique_idx").on(t.pollId, t.voterType, t.voterId)],
);

/* -------------------------------------------------------------------------- */
/*  MODERATION                                                                */
/* -------------------------------------------------------------------------- */

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  targetType: text("target_type").notNull(),
  targetId: integer("target_id").notNull(),
  reason: text("reason").notNull(),
  details: text("details").default(""),
  reporterType: text("reporter_type").notNull().default("alumni"),
  reporterId: integer("reporter_id"),
  status: text("status").notNull().default("pending"),
  resolution: text("resolution").default(""),
  resolvedById: integer("resolved_by_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* -------------------------------------------------------------------------- */
/*  NOTIFICATIONS                                                             */
/* -------------------------------------------------------------------------- */

export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    recipientType: text("recipient_type").notNull().default("student"),
    recipientId: integer("recipient_id").notNull(),
    type: text("type").notNull().default("announcement"),
    title: text("title").notNull(),
    body: text("body").default(""),
    link: text("link").default(""),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notifications_recipient_idx").on(t.recipientType, t.recipientId)],
);

/* -------------------------------------------------------------------------- */
/*  MEDIA / DOCUMENTS                                                         */
/* -------------------------------------------------------------------------- */

export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  type: text("type").notNull().default("image"),
  category: text("category").notNull().default("campus"),
  caption: text("caption").default(""),
  album: text("album").default(""),
  consentStatus: text("consent_status").notNull().default("not_required"),
  visibility: text("visibility").notNull().default("public"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull().default("forms"),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type").notNull().default("pdf"),
  fileSize: integer("file_size").notNull().default(0),
  visibility: text("visibility").notNull().default("public"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* -------------------------------------------------------------------------- */
/*  DEVELOPMENT PROJECTS / FACILITIES                                         */
/* -------------------------------------------------------------------------- */

export const developmentProjects = pgTable("development_projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("ongoing"),
  target: text("target").default(""),
  timeline: text("timeline").default(""),
  imageUrl: text("image_url").default(""),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const facilities = pgTable("facilities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull().default("classrooms"),
  description: text("description").default("Information awaiting school verification."),
  imageUrl: text("image_url").default(""),
  published: boolean("published").notNull().default(false),
});

/* -------------------------------------------------------------------------- */
/*  CONTACT / FEEDBACK                                                        */
/* -------------------------------------------------------------------------- */

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").default(""),
  subject: text("subject").default("General Enquiry"),
  message: text("message").notNull(),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  category: text("category").notNull().default("other"),
  message: text("message").notNull(),
  submitterName: text("submitter_name").default(""),
  anonymous: boolean("anonymous").notNull().default(true),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* -------------------------------------------------------------------------- */
/*  AUDIT LOG                                                                 */
/* -------------------------------------------------------------------------- */

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: serial("id").primaryKey(),
    actorType: text("actor_type").notNull().default("staff"),
    actorId: integer("actor_id"),
    actorName: text("actor_name").notNull().default("System"),
    action: text("action").notNull(),
    targetType: text("target_type").default(""),
    targetId: integer("target_id"),
    details: jsonb("details").$type<Record<string, unknown>>().default({}),
    ipAddress: text("ip_address").default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_logs_created_idx").on(t.createdAt)],
);
