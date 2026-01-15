import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

export async function precompressAssets(distPath: string) {
  const assetsDir = path.join(distPath, "assets");
  if (!fs.existsSync(assetsDir)) return;
  const files = fs.readdirSync(assetsDir);
  for (const f of files) {
    const full = path.join(assetsDir, f);
    if (!fs.statSync(full).isFile()) continue;
    if (!/\.(js|css)$/i.test(f)) continue;
    const brFile = full + ".br";
    const gzFile = full + ".gz";
    try {
      if (!fs.existsSync(brFile)) {
        const input = fs.readFileSync(full);
        const out = zlib.brotliCompressSync(input, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 6 } });
        fs.writeFileSync(brFile, out);
      }
      if (!fs.existsSync(gzFile)) {
        const input = fs.readFileSync(full);
        const out = zlib.gzipSync(input, { level: 6 });
        fs.writeFileSync(gzFile, out);
      }
    } catch {}
  }
}

export function servePrecompressed(distPath: string) {
  return (req: any, res: any, next: any) => {
    const ae = (req.headers["accept-encoding"] || "").toString();
    const url = req.url.split("?")[0];
    if (!/\.(js|css)$/i.test(url)) return next();
    const preferBr = ae.includes("br");
    const filePath = path.join(distPath, url.replace(/^\//, ""));
    const candidate = preferBr ? filePath + ".br" : filePath + ".gz";
    if (fs.existsSync(candidate)) {
      res.set("Content-Encoding", preferBr ? "br" : "gzip");
      res.set("Vary", "Accept-Encoding");
      if (url.endsWith(".js")) res.set("Content-Type", "application/javascript");
      if (url.endsWith(".css")) res.set("Content-Type", "text/css");
      try {
        const stream = fs.createReadStream(candidate);
        stream.pipe(res);
        return;
      } catch {}
    }
    next();
  };
}

