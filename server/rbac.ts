import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { BLOG_ADMIN_EMAILS, BLOG_ADMIN_ROLES } from "./config";

export async function userHasRole(userId: string | undefined, email: string | undefined, roles: string[]): Promise<boolean> {
  if (!userId && !email) return false;
  if (email && BLOG_ADMIN_EMAILS.includes(email.toLowerCase())) return true;
  if (!userId) return false;
  const admin = await storage.getFeedbackAdmin(userId);
  if (!admin) return false;
  return roles.includes(admin.role);
}

export function requireRole(roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ok = await userHasRole((req.user as any)?.id, (req.user as any)?.email, roles);
      if (ok) return next();
      return res.status(403).json({ message: "Forbidden" });
    } catch {
      return res.status(500).json({ message: "Authorization failed" });
    }
  };
}
