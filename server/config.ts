export const APP_ENV = process.env.NODE_ENV || "development";
export const BASE_URL = process.env.BASE_URL || "https://typemasterai.com";
export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "tm_session";
const parsedAdminEmails = (process.env.BLOG_ADMIN_EMAILS || "")
  .split(",")
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);
export const BLOG_ADMIN_EMAILS = Array.from(new Set([...parsedAdminEmails, "amar01pawar80@gmail.com"]));
export const BLOG_ADMIN_ROLES = ["admin", "super_admin"];
export const CSRF_ENABLED = (process.env.CSRF_ENABLED ?? "true") !== "false";

export const SEO = {
  siteName: "TypeMasterAI",
  defaultOgImage: `${BASE_URL}/opengraph.jpg`,
  verification: {
    googleSiteVerification: process.env.GOOGLE_SITE_VERIFICATION || "",
    bingSiteVerification: process.env.BING_SITE_VERIFICATION || "",
  },
};
