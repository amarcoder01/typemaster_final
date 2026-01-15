CREATE TABLE "blog_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"description" text,
	"parent_id" integer,
	"color" varchar(20) DEFAULT '#3b82f6',
	"icon" varchar(50),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "blog_post_revisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"content_md" text NOT NULL,
	"excerpt" text,
	"cover_image_url" text,
	"author_id" varchar,
	"author_name" varchar(120),
	"revision_number" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_post_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"tag_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_post_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"user_id" varchar,
	"session_id" varchar(64),
	"ip_address" varchar(45),
	"user_agent" text,
	"referrer" text,
	"viewed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(200) NOT NULL,
	"title" varchar(200) NOT NULL,
	"excerpt" text,
	"content_md" text NOT NULL,
	"cover_image_url" text,
	"author_id" varchar,
	"author_name" varchar(120) DEFAULT 'TypeMasterAI' NOT NULL,
	"author_bio" text,
	"author_avatar_url" text,
	"meta_title" varchar(70),
	"meta_description" varchar(160),
	"category_id" integer,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"scheduled_at" timestamp,
	"published_at" timestamp,
	"view_count" integer DEFAULT 0 NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"featured_order" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "blog_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(80) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_tags_name_unique" UNIQUE("name"),
	CONSTRAINT "blog_tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "certificate_verification_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"certificate_id" integer,
	"verification_id" varchar(20),
	"ip_address" varchar(45),
	"user_agent" text,
	"success" boolean NOT NULL,
	"failure_reason" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "dictation_test_id" integer;--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "stress_test_id" integer;--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "verification_id" varchar(20);--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "signature_hash" varchar(64);--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "issued_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "revoked_at" timestamp;--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "revoked_reason" text;--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "verification_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "last_verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "issuer_version" varchar(10) DEFAULT '1.0';--> statement-breakpoint
ALTER TABLE "typing_paragraphs" ADD COLUMN "is_typing_related" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_test_data" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "blog_post_revisions" ADD CONSTRAINT "blog_post_revisions_post_id_blog_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_post_revisions" ADD CONSTRAINT "blog_post_revisions_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_post_tags" ADD CONSTRAINT "blog_post_tags_post_id_blog_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_post_tags" ADD CONSTRAINT "blog_post_tags_tag_id_blog_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."blog_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_post_views" ADD CONSTRAINT "blog_post_views_post_id_blog_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_post_views" ADD CONSTRAINT "blog_post_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_category_id_blog_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."blog_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificate_verification_logs" ADD CONSTRAINT "certificate_verification_logs_certificate_id_certificates_id_fk" FOREIGN KEY ("certificate_id") REFERENCES "public"."certificates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blog_categories_slug_idx" ON "blog_categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "blog_categories_parent_id_idx" ON "blog_categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "blog_post_revisions_post_id_idx" ON "blog_post_revisions" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "blog_post_revisions_created_at_idx" ON "blog_post_revisions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "blog_post_tags_post_tag_idx" ON "blog_post_tags" USING btree ("post_id","tag_id");--> statement-breakpoint
CREATE INDEX "blog_post_views_post_id_idx" ON "blog_post_views" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "blog_post_views_viewed_at_idx" ON "blog_post_views" USING btree ("viewed_at");--> statement-breakpoint
CREATE INDEX "blog_post_views_session_post_idx" ON "blog_post_views" USING btree ("session_id","post_id");--> statement-breakpoint
CREATE INDEX "blog_posts_slug_idx" ON "blog_posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "blog_posts_status_idx" ON "blog_posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "blog_posts_published_at_idx" ON "blog_posts" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "blog_posts_scheduled_at_idx" ON "blog_posts" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "blog_posts_category_id_idx" ON "blog_posts" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "blog_posts_featured_idx" ON "blog_posts" USING btree ("is_featured","featured_order");--> statement-breakpoint
CREATE INDEX "blog_posts_author_id_idx" ON "blog_posts" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "cert_verify_logs_certificate_id_idx" ON "certificate_verification_logs" USING btree ("certificate_id");--> statement-breakpoint
CREATE INDEX "cert_verify_logs_verification_id_idx" ON "certificate_verification_logs" USING btree ("verification_id");--> statement-breakpoint
CREATE INDEX "cert_verify_logs_created_at_idx" ON "certificate_verification_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "cert_verify_logs_success_idx" ON "certificate_verification_logs" USING btree ("success");--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_dictation_test_id_dictation_tests_id_fk" FOREIGN KEY ("dictation_test_id") REFERENCES "public"."dictation_tests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_stress_test_id_stress_tests_id_fk" FOREIGN KEY ("stress_test_id") REFERENCES "public"."stress_tests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "certificates_verification_id_idx" ON "certificates" USING btree ("verification_id");--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_verification_id_unique" UNIQUE("verification_id");