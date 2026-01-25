/**
 * Dynamic Sitemap Generator for TypeMasterAI
 * Generates sitemaps with real-time content URLs for better SEO
 */

import { storage } from './storage';
import { BASE_URL } from './config';

// BASE_URL now comes from env-driven config

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: string;
  images?: Array<{ loc: string; title: string }>;
}

/**
 * Static pages with their SEO configuration
 */
const STATIC_PAGES: SitemapUrl[] = [
  // Core pages - highest priority
  { loc: '/', lastmod: new Date().toISOString().split('T')[0], changefreq: 'daily', priority: '1.0', images: [{ loc: `${BASE_URL}/opengraph.jpg`, title: 'TypeMasterAI - Free Online Typing Speed Test' }] },
  { loc: '/code-mode', lastmod: new Date().toISOString().split('T')[0], changefreq: 'daily', priority: '0.9' },
  { loc: '/multiplayer', lastmod: new Date().toISOString().split('T')[0], changefreq: 'daily', priority: '0.9' },

  // SEO Landing Pages - high priority
  { loc: '/1-minute-typing-test', lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: '0.9' },
  { loc: '/3-minute-typing-test', lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: '0.9' },
  { loc: '/5-minute-typing-test', lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: '0.9' },
  { loc: '/monkeytype-alternative', lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: '0.9' },
  { loc: '/typeracer-alternative', lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: '0.9' },
  { loc: '/10fastfingers-alternative', lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: '0.9' },
  { loc: '/typingcom-alternative', lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: '0.9' },

  // New SEO landing pages
  { loc: '/typing-practice', lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: '0.9' },
  { loc: '/wpm-test', lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: '0.9' },
  { loc: '/typing-games', lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: '0.9' },
  { loc: '/keyboard-test', lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: '0.9' },
  { loc: '/typing-certificate', lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: '0.8' },

  // Phase 3 Pillar Pages
  { loc: '/average-typing-speed', lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: '0.8' },
  { loc: '/typing-speed-chart', lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: '0.8' },
  { loc: '/typing-test-jobs', lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: '0.8' },
  { loc: '/touch-typing', lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: '0.9' },
  { loc: '/keybr-alternative', lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: '0.9' },
  { loc: '/es/typing-test', lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: '0.8' },
  { loc: '/fr/typing-test', lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: '0.8' },
  { loc: '/de/typing-test', lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: '0.8' },

  // Pillar-Cluster Content Pages (Topical Authority)
  { loc: '/what-is-wpm', lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: '0.9' },
  { loc: '/how-to-type-faster', lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: '0.9' },
  { loc: '/keyboard-layouts', lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: '0.8' },
  { loc: '/typing-for-beginners', lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: '0.9' },
  { loc: '/data-entry-typing-test', lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: '0.8' },
  { loc: '/typing-test-for-kids', lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: '0.8' },
  { loc: '/mobile-typing-test', lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: '0.8' },
  { loc: '/javascript-typing-test', lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: '0.8' },
  { loc: '/python-typing-test', lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: '0.8' },

  // Additional SEO Landing Pages
  { loc: '/free-online-typing-test', lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: '0.9' },
  { loc: '/cpm-test', lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: '0.8' },
  { loc: '/typing-speed-requirements', lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: '0.8' },
  { loc: '/typing-accuracy-test', lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: '0.8' },
  { loc: '/professional-typing-test', lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: '0.8' },
  { loc: '/student-typing-test', lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: '0.8' },

  // Feature pages
  { loc: '/dictation-mode', lastmod: new Date().toISOString().split('T')[0], changefreq: 'daily', priority: '0.9', images: [{ loc: `${BASE_URL}/opengraph.jpg`, title: 'TypeMasterAI Dictation Typing Test - Listen & Type Practice' }] },
  { loc: '/dictation-test', lastmod: new Date().toISOString().split('T')[0], changefreq: 'daily', priority: '0.9', images: [{ loc: `${BASE_URL}/opengraph.jpg`, title: 'Free Dictation Typing Test - Audio Transcription Practice' }] },
  { loc: '/stress-test', lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: '0.8' },

  // Leaderboards - frequently updated
  { loc: '/leaderboard', lastmod: new Date().toISOString().split('T')[0], changefreq: 'hourly', priority: '0.8' },
  { loc: '/leaderboards', lastmod: new Date().toISOString().split('T')[0], changefreq: 'daily', priority: '0.8' },
  { loc: '/code-leaderboard', lastmod: new Date().toISOString().split('T')[0], changefreq: 'daily', priority: '0.7' },
  { loc: '/stress-leaderboard', lastmod: new Date().toISOString().split('T')[0], changefreq: 'daily', priority: '0.7' },

  // User features
  { loc: '/analytics', lastmod: new Date().toISOString().split('T')[0], changefreq: 'daily', priority: '0.7' },
  { loc: '/profile', lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: '0.6' },
  { loc: '/settings', lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: '0.5' },

  // Educational content
  { loc: '/learn', lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: '0.8' },
  { loc: '/faq', lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: '0.7' },
  { loc: '/knowledge', lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: '0.7' },
  { loc: '/chat', lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: '0.7' },

  // About & Contact
  { loc: '/about', lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: '0.6' },
  { loc: '/contact', lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: '0.5' },

  // Blog landing pages
  { loc: '/blog', lastmod: new Date().toISOString().split('T')[0], changefreq: 'daily', priority: '0.8' },
  { loc: '/blog/tags', lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: '0.6' },

  // Verification
  { loc: '/verify', lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: '0.5' },

  // Legal pages
  { loc: '/privacy-policy', lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: '0.3' },
  { loc: '/terms-of-service', lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: '0.3' },
  { loc: '/cookie-policy', lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: '0.3' },
  { loc: '/ai-transparency', lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: '0.3' },
  { loc: '/accessibility', lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: '0.3' },
];

/**
 * Generate URL element for sitemap
 */
function generateUrlElement(url: SitemapUrl): string {
  let element = `  <url>
    <loc>${BASE_URL}${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
    <mobile:mobile/>`;

  // Add hreflang alternates for known language pairs
  if (url.loc === '/') {
    element += `
    <xhtml:link rel="alternate" hreflang="es" href="${BASE_URL}/es/typing-test" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}/" />`;
  } else if (url.loc === '/es/typing-test') {
    element += `
    <xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}/" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}/" />`;
  }

  if (url.images && url.images.length > 0) {
    for (const image of url.images) {
      element += `
    <image:image>
      <image:loc>${image.loc}</image:loc>
      <image:title>${escapeXml(image.title)}</image:title>
    </image:image>`;
    }
  }

  element += `
  </url>`;

  return element;
}

/**
 * Escape special XML characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generate the main sitemap with static pages
 */
export async function generateMainSitemap(): Promise<string> {
  const urlElements = STATIC_PAGES.map(generateUrlElement).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlElements}
</urlset>`;
}

/**
 * Generate sitemap for shared results (dynamic content)
 */
export async function generateSharedResultsSitemap(): Promise<string> {
  const today = new Date().toISOString().split('T')[0];

  try {
    // Get recent shared results from database
    const sharedResults = await storage.getRecentSharedResults(1000);

    const urlElements = sharedResults.map(result => {
      const lastmod = result.createdAt
        ? new Date(result.createdAt).toISOString().split('T')[0]
        : today;

      return `  <url>
    <loc>${BASE_URL}/share/${result.shareToken}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>`;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;
  } catch (error) {
    console.error('[Sitemap] Error generating shared results sitemap:', error);
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;
  }
}

export async function generateBlogSitemap(): Promise<string> {
  const today = new Date().toISOString().split('T')[0];
  try {
    const posts = await storage.getRecentPublishedBlogPosts(1000);
    const urlElements = posts.map((post) => {
      const lastmod = (post.updatedAt ? new Date(post.updatedAt as any) : new Date()).toISOString().split('T')[0];
      const images = post.coverImageUrl
        ? `\n    <image:image>\n      <image:loc>${post.coverImageUrl}</image:loc>\n      <image:title>${escapeXml(post.title)}</image:title>\n    </image:image>`
        : '';
      return `  <url>
    <loc>${BASE_URL}/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>${images}
  </url>`;
    }).join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlElements}
</urlset>`;
  } catch (error) {
    console.error('[Sitemap] Error generating blog sitemap:', error);
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;
  }
}
/**
 * Generate sitemap for verified certificates
 */
export async function generateCertificatesSitemap(): Promise<string> {
  const today = new Date().toISOString().split('T')[0];

  try {
    // Get recent verified certificates
    const certificates = await storage.getRecentCertificates(500);

    const urlElements = certificates.map(cert => {
      const lastmod = cert.createdAt
        ? new Date(cert.createdAt).toISOString().split('T')[0]
        : today;

      return `  <url>
    <loc>${BASE_URL}/verify/${cert.verificationId}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>`;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;
  } catch (error) {
    console.error('[Sitemap] Error generating certificates sitemap:', error);
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;
  }
}

/**
 * Generate sitemap index pointing to all sitemaps
 */
export function generateSitemapIndex(): string {
  const today = new Date().toISOString().split('T')[0];

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${BASE_URL}/sitemap-pages.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-shared.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-certificates.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-blog.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>`;
}

/**
 * Generate images sitemap for better image SEO
 */
export function generateImagesSitemap(): string {
  const images = [
    { page: '/', image: '/opengraph.jpg', title: 'TypeMasterAI - Free Online Typing Speed Test' },
    { page: '/', image: '/icon-512x512.png', title: 'TypeMasterAI Logo' },
    { page: '/', image: '/logo-horizontal.svg', title: 'TypeMasterAI Horizontal Logo' },
    { page: '/', image: '/icon-192x192.png', title: 'TypeMasterAI App Icon' },
    { page: '/', image: '/favicon.png', title: 'TypeMasterAI Favicon' },
    // Dictation Mode Images
    { page: '/dictation-mode', image: '/opengraph.jpg', title: 'Dictation Typing Test - Listen and Type Practice' },
    { page: '/dictation-test', image: '/opengraph.jpg', title: 'Free Dictation Typing Test - Audio Transcription Practice' },
  ];

  const urlElements = images.map(img => `  <url>
    <loc>${BASE_URL}${img.page}</loc>
    <image:image>
      <image:loc>${BASE_URL}${img.image}</image:loc>
      <image:title>${escapeXml(img.title)}</image:title>
    </image:image>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlElements}
</urlset>`;
}

