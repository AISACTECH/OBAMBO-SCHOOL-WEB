CREATE TABLE "alumni" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"auth_provider" text DEFAULT 'credentials' NOT NULL,
	"graduation_year" integer,
	"profession" text DEFAULT '',
	"industry" text DEFAULT '',
	"location" text DEFAULT '',
	"bio" text DEFAULT '',
	"photo_url" text DEFAULT '',
	"linkedin" text DEFAULT '',
	"website" text DEFAULT '',
	"skills" jsonb DEFAULT '[]',
	"achievements" text DEFAULT '',
	"mentorship_available" boolean DEFAULT false NOT NULL,
	"mentor_types" jsonb DEFAULT '[]',
	"privacy" text DEFAULT 'alumni_only' NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"failed_login_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alumni_stories" (
	"id" serial PRIMARY KEY,
	"alumni_id" integer,
	"name" text NOT NULL,
	"graduation_year" integer,
	"photo_url" text DEFAULT '',
	"title" text NOT NULL,
	"journey" text NOT NULL,
	"current_role" text DEFAULT '',
	"quote" text DEFAULT '',
	"links" jsonb DEFAULT '[]',
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" serial PRIMARY KEY,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"summary" text NOT NULL,
	"content" text NOT NULL,
	"image_url" text DEFAULT '',
	"category" text DEFAULT 'general' NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"author_id" integer,
	"author_name" text DEFAULT 'School Administration',
	"pinned" boolean DEFAULT false NOT NULL,
	"target_audience" text DEFAULT 'everyone' NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"publish_at" timestamp with time zone DEFAULT now(),
	"expiry_at" timestamp with time zone,
	"attachments" jsonb DEFAULT '[]',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY,
	"actor_type" text DEFAULT 'staff' NOT NULL,
	"actor_id" integer,
	"actor_name" text DEFAULT 'System' NOT NULL,
	"action" text NOT NULL,
	"target_type" text DEFAULT '',
	"target_id" integer,
	"details" jsonb DEFAULT '{}',
	"ip_address" text DEFAULT '',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_forms" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"level" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" serial PRIMARY KEY,
	"post_id" integer NOT NULL,
	"author_type" text DEFAULT 'alumni' NOT NULL,
	"author_id" integer,
	"author_name" text NOT NULL,
	"content" text NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text DEFAULT '',
	"subject" text DEFAULT 'General Enquiry',
	"message" text NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "development_projects" (
	"id" serial PRIMARY KEY,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'ongoing' NOT NULL,
	"target" text DEFAULT '',
	"timeline" text DEFAULT '',
	"image_url" text DEFAULT '',
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY,
	"title" text NOT NULL,
	"category" text DEFAULT 'forms' NOT NULL,
	"file_url" text NOT NULL,
	"file_type" text DEFAULT 'pdf' NOT NULL,
	"file_size" integer DEFAULT 0 NOT NULL,
	"visibility" text DEFAULT 'public' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"location" text DEFAULT '',
	"organizer" text DEFAULT 'St Mark''s Secondary School – Obambo',
	"image_url" text DEFAULT '',
	"audience" text DEFAULT 'everyone' NOT NULL,
	"category" text DEFAULT 'events' NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone,
	"status" text DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "examinations" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"term" text DEFAULT 'Term 1' NOT NULL,
	"year" integer NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "facilities" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"category" text DEFAULT 'classrooms' NOT NULL,
	"description" text DEFAULT 'Information awaiting school verification.',
	"image_url" text DEFAULT '',
	"published" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" serial PRIMARY KEY,
	"category" text DEFAULT 'other' NOT NULL,
	"message" text NOT NULL,
	"submitter_name" text DEFAULT '',
	"anonymous" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_members" (
	"id" serial PRIMARY KEY,
	"group_id" integer NOT NULL,
	"member_type" text DEFAULT 'alumni' NOT NULL,
	"member_id" integer NOT NULL,
	"member_name" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text DEFAULT '',
	"cover_image" text DEFAULT '',
	"category" text DEFAULT 'community' NOT NULL,
	"visibility" text DEFAULT 'school_only' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leadership_profiles" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"title" text NOT NULL,
	"department" text DEFAULT '',
	"bio" text DEFAULT 'Information awaiting school verification.',
	"photo_url" text DEFAULT '',
	"order" integer DEFAULT 0 NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" serial PRIMARY KEY,
	"url" text NOT NULL,
	"type" text DEFAULT 'image' NOT NULL,
	"category" text DEFAULT 'campus' NOT NULL,
	"caption" text DEFAULT '',
	"album" text DEFAULT '',
	"consent_status" text DEFAULT 'not_required' NOT NULL,
	"visibility" text DEFAULT 'public' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news" (
	"id" serial PRIMARY KEY,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"excerpt" text NOT NULL,
	"content" text NOT NULL,
	"image_url" text DEFAULT '',
	"category" text DEFAULT 'student-life' NOT NULL,
	"author_id" integer,
	"author_name" text DEFAULT 'Communications Office',
	"reading_time_minutes" integer DEFAULT 3 NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"trending" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"gallery" jsonb DEFAULT '[]',
	"published_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY,
	"recipient_type" text DEFAULT 'student' NOT NULL,
	"recipient_id" integer NOT NULL,
	"type" text DEFAULT 'announcement' NOT NULL,
	"title" text NOT NULL,
	"body" text DEFAULT '',
	"link" text DEFAULT '',
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"id" serial PRIMARY KEY,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"content" text DEFAULT 'Information awaiting school verification.' NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"updated_by_id" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poll_options" (
	"id" serial PRIMARY KEY,
	"poll_id" integer NOT NULL,
	"label" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poll_votes" (
	"id" serial PRIMARY KEY,
	"poll_id" integer NOT NULL,
	"option_id" integer NOT NULL,
	"voter_type" text DEFAULT 'alumni' NOT NULL,
	"voter_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "polls" (
	"id" serial PRIMARY KEY,
	"question" text NOT NULL,
	"description" text DEFAULT '',
	"type" text DEFAULT 'single_choice' NOT NULL,
	"anonymous" boolean DEFAULT true NOT NULL,
	"group_id" integer,
	"closes_at" timestamp with time zone,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" serial PRIMARY KEY,
	"group_id" integer,
	"topic" text DEFAULT 'general' NOT NULL,
	"author_type" text DEFAULT 'alumni' NOT NULL,
	"author_id" integer,
	"author_name" text NOT NULL,
	"title" text DEFAULT '',
	"content" text NOT NULL,
	"image_url" text DEFAULT '',
	"status" text DEFAULT 'published' NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reactions" (
	"id" serial PRIMARY KEY,
	"post_id" integer,
	"comment_id" integer,
	"author_type" text DEFAULT 'alumni' NOT NULL,
	"author_id" integer NOT NULL,
	"type" text DEFAULT 'like' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" serial PRIMARY KEY,
	"target_type" text NOT NULL,
	"target_id" integer NOT NULL,
	"reason" text NOT NULL,
	"details" text DEFAULT '',
	"reporter_type" text DEFAULT 'alumni' NOT NULL,
	"reporter_id" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"resolution" text DEFAULT '',
	"resolved_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" serial PRIMARY KEY,
	"title" text NOT NULL,
	"description" text DEFAULT '',
	"subject" text DEFAULT 'General' NOT NULL,
	"form" text DEFAULT 'Form 1' NOT NULL,
	"term" text DEFAULT 'Term 1' NOT NULL,
	"year" integer NOT NULL,
	"category" text DEFAULT 'notes' NOT NULL,
	"file_url" text NOT NULL,
	"file_type" text DEFAULT 'pdf' NOT NULL,
	"file_size" integer DEFAULT 0 NOT NULL,
	"uploader_name" text DEFAULT 'School Administration',
	"download_count" integer DEFAULT 0 NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"tags" jsonb DEFAULT '[]',
	"status" text DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "result_imports" (
	"id" serial PRIMARY KEY,
	"source" text DEFAULT 'google_sheet_csv' NOT NULL,
	"source_url" text DEFAULT '',
	"imported_by_name" text DEFAULT 'School Administration',
	"total_rows" integer DEFAULT 0 NOT NULL,
	"valid_rows" integer DEFAULT 0 NOT NULL,
	"invalid_rows" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"error_report" jsonb DEFAULT '[]',
	"rolled_back" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "results" (
	"id" serial PRIMARY KEY,
	"student_id" integer NOT NULL,
	"admission_number" text NOT NULL,
	"exam_name" text NOT NULL,
	"subject" text NOT NULL,
	"marks" double precision NOT NULL,
	"grade" text NOT NULL,
	"points" double precision DEFAULT 0,
	"teacher_comment" text DEFAULT '',
	"term" text NOT NULL,
	"year" integer NOT NULL,
	"import_id" integer,
	"status" text DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_resources" (
	"id" serial PRIMARY KEY,
	"student_id" integer NOT NULL,
	"resource_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "school_settings" (
	"id" serial PRIMARY KEY,
	"school_name" text DEFAULT 'St Mark''s Secondary School – Obambo' NOT NULL,
	"motto" text DEFAULT 'Information awaiting school verification.',
	"vision" text DEFAULT 'Information awaiting school verification.',
	"mission" text DEFAULT 'Information awaiting school verification.',
	"core_values" text DEFAULT 'Information awaiting school verification.',
	"history" text DEFAULT 'Information awaiting school verification.',
	"address" text DEFAULT 'Obambo, South West Kisumu Ward, Kisumu West Sub-County, Kisumu County, Kenya',
	"phone" text DEFAULT '',
	"email" text DEFAULT '',
	"map_embed_url" text DEFAULT '',
	"facebook_url" text DEFAULT '',
	"twitter_url" text DEFAULT '',
	"instagram_url" text DEFAULT '',
	"youtube_url" text DEFAULT '',
	"whatsapp_number" text DEFAULT '',
	"primary_color" text DEFAULT '#0b6e4f' NOT NULL,
	"secondary_color" text DEFAULT '#f2b134' NOT NULL,
	"accent_color" text DEFAULT '#0a3d62' NOT NULL,
	"stats_visibility" jsonb DEFAULT '{"students":false,"teachers":false,"alumni":false,"resources":true,"years":false,"clubs":false}',
	"stats_values" jsonb DEFAULT '{}',
	"data_saver_default" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_users" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'content_editor' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"failed_login_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" serial PRIMARY KEY,
	"admission_number" text NOT NULL,
	"name" text NOT NULL,
	"form" text DEFAULT 'Form 1' NOT NULL,
	"stream" text DEFAULT '',
	"password_hash" text NOT NULL,
	"birth_cert_hash" text NOT NULL,
	"birth_cert_last4" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"admitted_year" integer,
	"failed_login_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"department" text DEFAULT 'General'
);
--> statement-breakpoint
CREATE UNIQUE INDEX "alumni_email_idx" ON "alumni" ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "announcements_slug_idx" ON "announcements" ("slug");--> statement-breakpoint
CREATE INDEX "audit_logs_created_idx" ON "audit_logs" ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "events_slug_idx" ON "events" ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "groups_slug_idx" ON "groups" ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "news_slug_idx" ON "news" ("slug");--> statement-breakpoint
CREATE INDEX "notifications_recipient_idx" ON "notifications" ("recipient_type","recipient_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "poll_votes_unique_idx" ON "poll_votes" ("poll_id","voter_type","voter_id");--> statement-breakpoint
CREATE INDEX "results_student_idx" ON "results" ("student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "staff_users_email_idx" ON "staff_users" ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "students_admission_number_idx" ON "students" ("admission_number");