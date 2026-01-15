/**
 * Blog System Configuration
 * Centralized configuration for the blog system with environment variable overrides
 */

export const blogConfig = {
  // Site info
  siteUrl: process.env.BLOG_SITE_URL || 'https://typemasterai.com',
  siteName: process.env.BLOG_SITE_NAME || 'TypeMasterAI Blog',
  
  // Default author
  defaultAuthorName: process.env.BLOG_DEFAULT_AUTHOR || 'TypeMasterAI',
  defaultAuthorBio: process.env.BLOG_DEFAULT_AUTHOR_BIO || 'TypeMasterAI is a free AI-powered typing test platform.',
  
  // Pagination
  postsPerPage: parseInt(process.env.BLOG_POSTS_PER_PAGE || '10', 10),
  maxPostsPerPage: 50,
  
  // Featured posts
  maxFeaturedPosts: parseInt(process.env.BLOG_MAX_FEATURED || '5', 10),
  
  // Cache TTL (milliseconds)
  cacheTtlMs: parseInt(process.env.BLOG_CACHE_TTL_MS || '60000', 10), // 1 minute default
  
  // Image settings
  imageBaseUrl: process.env.BLOG_IMAGE_BASE_URL || '',
  allowedImageExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
  maxImageSizeMb: parseInt(process.env.BLOG_MAX_IMAGE_SIZE_MB || '5', 10),
  
  // Reading time calculation
  wordsPerMinute: parseInt(process.env.BLOG_WORDS_PER_MINUTE || '200', 10),
  
  // Feature flags
  enableComments: process.env.BLOG_ENABLE_COMMENTS === 'true',
  enableNewsletterCta: process.env.BLOG_ENABLE_NEWSLETTER !== 'false', // enabled by default
  enableViewTracking: process.env.BLOG_ENABLE_VIEW_TRACKING !== 'false', // enabled by default
  enableScheduledPublishing: process.env.BLOG_ENABLE_SCHEDULED !== 'false', // enabled by default
  
  // SEO
  defaultMetaDescription: 'Professional articles on typing, productivity, learning, and product updates from TypeMasterAI.',
  defaultKeywords: 'typing blog, productivity tips, typing guides, learning, updates',
  
  // RSS/Atom
  rssMaxItems: parseInt(process.env.BLOG_RSS_MAX_ITEMS || '50', 10),
  
  // Analytics
  popularPostsDays: parseInt(process.env.BLOG_POPULAR_POSTS_DAYS || '30', 10),
  
  // Scheduled publishing check interval (milliseconds)
  scheduledCheckIntervalMs: parseInt(process.env.BLOG_SCHEDULED_CHECK_INTERVAL_MS || '60000', 10), // 1 minute
};

/**
 * Calculate reading time from word count
 */
export function calculateReadingTime(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / blogConfig.wordsPerMinute));
}

/**
 * Generate slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .substring(0, 200); // Limit length
}

/**
 * Count words in markdown content
 */
export function countWords(md: string): number {
  const text = md
    .replace(/```[\s\S]*?```/g, ' ') // Remove code blocks
    .replace(/`[^`]*`/g, ' ') // Remove inline code
    .replace(/[#*_>\-\[\]\(\)!]/g, ' ') // Remove markdown symbols
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return 0;
  return text.split(' ').length;
}

