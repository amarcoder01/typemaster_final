-- Blog Categories Table
CREATE TABLE IF NOT EXISTS "blog_categories" (
  "id" serial PRIMARY KEY,
  "name" varchar(100) NOT NULL,
  "slug" varchar(120) NOT NULL UNIQUE,
  "description" text,
  "parent_id" integer,
  "color" varchar(20) DEFAULT '#3b82f6',
  "icon" varchar(50),
  "sort_order" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "blog_categories_slug_idx" ON "blog_categories" ("slug");
CREATE INDEX IF NOT EXISTS "blog_categories_parent_id_idx" ON "blog_categories" ("parent_id");

-- Add new columns to blog_posts
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "author_id" varchar REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "author_bio" text;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "author_avatar_url" text;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "meta_title" varchar(70);
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "meta_description" varchar(160);
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "category_id" integer REFERENCES "blog_categories"("id") ON DELETE SET NULL;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "scheduled_at" timestamp;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "view_count" integer DEFAULT 0 NOT NULL;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "is_featured" boolean DEFAULT false NOT NULL;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "featured_order" integer;

-- Add new indexes
CREATE INDEX IF NOT EXISTS "blog_posts_scheduled_at_idx" ON "blog_posts" ("scheduled_at");
CREATE INDEX IF NOT EXISTS "blog_posts_category_id_idx" ON "blog_posts" ("category_id");
CREATE INDEX IF NOT EXISTS "blog_posts_featured_idx" ON "blog_posts" ("is_featured", "featured_order");
CREATE INDEX IF NOT EXISTS "blog_posts_author_id_idx" ON "blog_posts" ("author_id");

-- Blog Post Views Table for analytics
CREATE TABLE IF NOT EXISTS "blog_post_views" (
  "id" serial PRIMARY KEY,
  "post_id" integer NOT NULL REFERENCES "blog_posts"("id") ON DELETE CASCADE,
  "user_id" varchar REFERENCES "users"("id") ON DELETE SET NULL,
  "session_id" varchar(64),
  "ip_address" varchar(45),
  "user_agent" text,
  "referrer" text,
  "viewed_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "blog_post_views_post_id_idx" ON "blog_post_views" ("post_id");
CREATE INDEX IF NOT EXISTS "blog_post_views_viewed_at_idx" ON "blog_post_views" ("viewed_at");
CREATE INDEX IF NOT EXISTS "blog_post_views_session_post_idx" ON "blog_post_views" ("session_id", "post_id");

