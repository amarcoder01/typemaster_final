/// <reference types="vite/client" />

// Build-time constants injected by Vite
declare const __BUILD_ID__: string;
declare const __BUILD_TIME__: string;

// Global functions for service worker control (defined in index.html)
declare function __forceServiceWorkerUpdate(): Promise<void>;
declare function __clearServiceWorkerCache(): Promise<boolean>;

interface Window {
  __forceServiceWorkerUpdate: () => Promise<void>;
  __clearServiceWorkerCache: () => Promise<boolean>;
}
