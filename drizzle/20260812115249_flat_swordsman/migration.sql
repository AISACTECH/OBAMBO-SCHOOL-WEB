CREATE TABLE "google_oauth_states" (
	"id" serial PRIMARY KEY,
	"state_hash" text NOT NULL,
	"staff_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "google_sheet_connections" (
	"id" serial PRIMARY KEY,
	"google_account_email" text DEFAULT '',
	"spreadsheet_id" text DEFAULT '' NOT NULL,
	"spreadsheet_name" text DEFAULT '',
	"worksheet_title" text DEFAULT 'Performance' NOT NULL,
	"worksheet_id" integer,
	"data_range" text DEFAULT 'A1:M' NOT NULL,
	"access_token_encrypted" text,
	"refresh_token_encrypted" text,
	"token_expires_at" timestamp with time zone,
	"scopes" text DEFAULT '',
	"status" text DEFAULT 'authorized' NOT NULL,
	"last_sync_at" timestamp with time zone,
	"last_error" text DEFAULT '',
	"created_by_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "result_imports" ADD COLUMN "previous_rows" jsonb DEFAULT '[]';--> statement-breakpoint
CREATE UNIQUE INDEX "google_oauth_states_hash_idx" ON "google_oauth_states" ("state_hash");--> statement-breakpoint
CREATE INDEX "google_sheet_connections_status_idx" ON "google_sheet_connections" ("status");