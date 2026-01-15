import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { metaImagesPlugin } from "./vite-plugin-meta-images";

// Generate a unique BUILD_ID for cache busting
// Uses timestamp + random hash for uniqueness per deployment
const BUILD_ID = Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
const BUILD_TIME = new Date().toISOString();

// Plugin to inject BUILD_ID into service worker at build time
function serviceWorkerVersionPlugin() {
  return {
    name: 'service-worker-version',
    writeBundle() {
      const swPath = path.resolve(import.meta.dirname, 'dist/public/service-worker.js');
      if (fs.existsSync(swPath)) {
        let content = fs.readFileSync(swPath, 'utf-8');
        content = content.replace(/__BUILD_ID__/g, BUILD_ID);
        content = content.replace(/__BUILD_TIME__/g, BUILD_TIME);
        fs.writeFileSync(swPath, content);
        console.log(`[Build] Injected BUILD_ID ${BUILD_ID} into service-worker.js`);
      }
    }
  };
}

const plugins = [
  react(),
  runtimeErrorOverlay(),
  tailwindcss(),
  metaImagesPlugin(),
  serviceWorkerVersionPlugin(),
];

if (process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined) {
  (async () => {
    try {
      const { cartographer } = await import("@replit/vite-plugin-cartographer");
      const { devBanner } = await import("@replit/vite-plugin-dev-banner");
      plugins.push(cartographer(), devBanner());
    } catch (error) {
      // Replit plugins not available, skip
    }
  })();
}

export default defineConfig({
  plugins,
  // Inject build-time constants for version tracking and cache management
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
    __BUILD_TIME__: JSON.stringify(BUILD_TIME),
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
    preserveSymlinks: false,
  },
  optimizeDeps: {
    include: ['remark-math', 'rehype-katex'],
  },
  cacheDir: path.resolve(import.meta.dirname, "node_modules", ".vite"),
  css: {
    postcss: {
      plugins: [],
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    // Enable minification for smaller bundle sizes
    minify: 'esbuild',
    // Generate source maps for production debugging
    sourcemap: false,
    // Target modern browsers for better optimization
    target: 'es2020',
    // Chunk size warning limit (in KB)
    chunkSizeWarningLimit: 500,
    // CSS code splitting
    cssCodeSplit: true,
    // Rollup options for advanced code splitting
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunks - rarely change, cached well
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['wouter'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-tabs',
            '@radix-ui/react-select',
            '@radix-ui/react-popover',
          ],
          'vendor-charts': ['recharts'],
          'vendor-motion': ['framer-motion'],
          // Feature chunks
          'feature-markdown': ['react-markdown', 'remark-gfm', 'remark-math', 'rehype-katex'],
        },
        // Optimize chunk file names for caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Optimize asset handling
    assetsInlineLimit: 4096, // Inline assets < 4KB
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
