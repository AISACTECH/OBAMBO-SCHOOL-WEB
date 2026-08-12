ALTER TABLE "results" ADD COLUMN "logical_key" text;--> statement-breakpoint
CREATE UNIQUE INDEX "results_logical_key_idx" ON "results" ("logical_key");