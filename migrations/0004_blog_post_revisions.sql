-- Blog Post Revisions table for version history
CREATE TABLE IF NOT EXISTS blog_post_revisions (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content_md TEXT NOT NULL,
  excerpt TEXT,
  cover_image_url TEXT,
  author_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  author_name VARCHAR(120),
  revision_number INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS blog_post_revisions_post_id_idx ON blog_post_revisions(post_id);
CREATE INDEX IF NOT EXISTS blog_post_revisions_created_at_idx ON blog_post_revisions(created_at);
