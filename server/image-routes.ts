import type { Express, Request, Response } from "express";
import path from "node:path";
import fs from "node:fs";
import sharp from "sharp";
import multer from "multer";
import crypto from "node:crypto";
import { requireRole } from "./rbac";

const requireAdmin = requireRole(["admin", "super_admin"]);

// Configure upload directory
const UPLOAD_DIR = path.resolve(import.meta.dirname, "public", "uploads", "blog");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer configuration for blog images
const blogImageStorage = multer.memoryStorage();
const blogImageUpload = multer({
  storage: blogImageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed."));
    }
  },
});

function safeResolvePublic(filePath: string): string | null {
  if (!filePath || !filePath.startsWith("/")) return null;
  const publicDir = path.resolve(import.meta.dirname, "public");
  const resolved = path.resolve(publicDir, "." + filePath);
  if (!resolved.startsWith(publicDir)) return null;
  if (!fs.existsSync(resolved)) return null;
  return resolved;
}

export function createImageRoutes(app: Express) {
  app.get("/api/image/local", async (req: Request, res: Response) => {
    try {
      const src = typeof req.query.path === "string" ? String(req.query.path) : "";
      const format = typeof req.query.format === "string" ? String(req.query.format) : "webp";
      const width = Math.min(2000, Math.max(100, parseInt(String(req.query.width || "0"), 10) || 0));
      const file = safeResolvePublic(src);
      if (!file) return res.status(400).send("Invalid path");
      const img = sharp(file);
      if (width) img.resize({ width, withoutEnlargement: true });
      if (format === "avif") {
        img.avif({ quality: 60 });
        res.set("Content-Type", "image/avif");
      } else {
        img.webp({ quality: 70 });
        res.set("Content-Type", "image/webp");
      }
      res.set("Cache-Control", "public, max-age=2592000");
      const buf = await img.toBuffer();
      res.send(buf);
    } catch {
      res.status(500).end();
    }
  });

  // ============================================================================
  // BLOG IMAGE UPLOAD
  // ============================================================================

  app.post("/api/admin/blog/upload", requireAdmin, blogImageUpload.single("image"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      const originalName = req.file.originalname;
      const ext = path.extname(originalName).toLowerCase();
      
      // Generate unique filename
      const timestamp = Date.now();
      const randomId = crypto.randomBytes(8).toString("hex");
      const baseName = path.basename(originalName, ext)
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .substring(0, 50);
      
      const filename = `${baseName}-${timestamp}-${randomId}.webp`;
      const filepath = path.join(UPLOAD_DIR, filename);

      // Process image with sharp - optimize and convert to webp
      const maxWidth = parseInt(String(req.body.maxWidth || "1200"), 10) || 1200;
      const quality = parseInt(String(req.body.quality || "80"), 10) || 80;

      const processedImage = await sharp(req.file.buffer)
        .resize({ width: Math.min(2000, maxWidth), withoutEnlargement: true })
        .webp({ quality: Math.min(100, Math.max(50, quality)) })
        .toBuffer();

      // Get image metadata
      const metadata = await sharp(processedImage).metadata();

      // Save to disk
      await fs.promises.writeFile(filepath, processedImage);

      // Return URL
      const publicUrl = `/uploads/blog/${filename}`;
      
      res.json({
        success: true,
        url: publicUrl,
        filename,
        width: metadata.width,
        height: metadata.height,
        size: processedImage.length,
        originalName,
      });
    } catch (err) {
      console.error("[ImageUpload] Error:", err);
      const message = err instanceof Error ? err.message : "Failed to upload image";
      res.status(500).json({ message });
    }
  });

  // List uploaded blog images
  app.get("/api/admin/blog/images", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const files = await fs.promises.readdir(UPLOAD_DIR);
      const images = await Promise.all(
        files
          .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
          .map(async (filename) => {
            const filepath = path.join(UPLOAD_DIR, filename);
            const stats = await fs.promises.stat(filepath);
            return {
              filename,
              url: `/uploads/blog/${filename}`,
              size: stats.size,
              createdAt: stats.birthtime.toISOString(),
            };
          })
      );
      
      // Sort by creation date, newest first
      images.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      res.json({ images });
    } catch (err) {
      console.error("[ImageUpload] Error listing images:", err);
      res.status(500).json({ message: "Failed to list images" });
    }
  });

  // Delete uploaded blog image
  app.delete("/api/admin/blog/image/:filename", requireAdmin, async (req: Request, res: Response) => {
    try {
      const filename = req.params.filename;
      if (!filename || !/^[a-z0-9-]+\.webp$/i.test(filename)) {
        return res.status(400).json({ message: "Invalid filename" });
      }
      
      const filepath = path.join(UPLOAD_DIR, filename);
      
      // Security check - ensure path is within upload dir
      if (!filepath.startsWith(UPLOAD_DIR)) {
        return res.status(400).json({ message: "Invalid path" });
      }
      
      if (!fs.existsSync(filepath)) {
        return res.status(404).json({ message: "Image not found" });
      }
      
      await fs.promises.unlink(filepath);
      res.json({ success: true });
    } catch (err) {
      console.error("[ImageUpload] Error deleting image:", err);
      res.status(500).json({ message: "Failed to delete image" });
    }
  });
}
