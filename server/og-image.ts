import type { Request, Response } from "express";
import sharp from "sharp";

function titleToSvg(title: string) {
  const safe = title.slice(0, 120);
  return Buffer.from(
    `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="630" fill="#0b1220"/>
      <text x="60" y="180" font-size="64" font-family="DM Sans, Arial, sans-serif" fill="#f5f7ff">${safe}</text>
      <text x="60" y="260" font-size="28" font-family="DM Sans, Arial, sans-serif" fill="#c8ccff">TypeMasterAI — Free Typing Test</text>
    </svg>`
  );
}

export async function handleOgImage(req: Request, res: Response) {
  try {
    const title = typeof req.query.title === "string" ? req.query.title : "TypeMasterAI — Free Typing Test";
    const base = sharp({
      create: {
        width: 1200,
        height: 630,
        channels: 3,
        background: "#0b1220",
      },
    }).png();
    const svg = titleToSvg(title);
    const img = await base
      .composite([{ input: svg, top: 0, left: 0 }])
      .png()
      .toBuffer();
    res.set("Content-Type", "image/png");
    res.set("Cache-Control", "public, max-age=86400");
    res.send(img);
  } catch {
    res.status(500).end();
  }
}

