ALTER TABLE "race_participants" ADD COLUMN "join_token" varchar(64);--> statement-breakpoint
ALTER TABLE "races" ADD COLUMN "creator_participant_id" integer;--> statement-breakpoint
ALTER TABLE "stress_tests" ADD COLUMN "attempt_count" integer DEFAULT 1 NOT NULL;