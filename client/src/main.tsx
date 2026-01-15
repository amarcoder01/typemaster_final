import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initWebVitals } from "./lib/webvitals";
import { initAnalytics } from "./lib/analytics";

// Initialize analytics and web vitals immediately
if (import.meta.env.PROD) {
  initWebVitals();
}
initAnalytics();

// Track if app has been rendered to prevent double-render
let appRendered = false;

function renderApp() {
  if (appRendered) return;
  appRendered = true;
  
  const container = document.getElementById("root");
  if (!container) {
    console.error('[Bootstrap] Root element not found');
    return;
  }
  
  const root = createRoot(container);
  root.render(<App />);
}

/**
 * Bootstrap the application with version check
 * 
 * This checks if there's a version mismatch between the currently loaded
 * code and what's stored in the browser. If there is, it clears caches
 * and reloads to ensure fresh content.
 */
async function bootstrap() {
  // Set a timeout to ensure app always renders within 3 seconds
  // This prevents black screen if version check hangs
  const renderTimeout = setTimeout(() => {
    console.warn('[Bootstrap] Timeout reached, rendering app without version check');
    renderApp();
  }, 3000);
  
  try {
    // Dynamic import to prevent blocking if version-manager has issues
    const { checkAndRecoverVersion, saveCurrentVersion, initVisibilityChangeListener } = await import("./lib/version-manager");
    const { checkQueryCacheVersion } = await import("./lib/queryClient");
    
    // Check for version mismatch and perform recovery if needed
    const needsReload = await checkAndRecoverVersion();
    
    if (needsReload) {
      clearTimeout(renderTimeout);
      console.log('[Bootstrap] Version mismatch detected, reloading...');
      // Small delay to ensure cleanup completes
      await new Promise(resolve => setTimeout(resolve, 100));
      window.location.reload();
      return; // Don't render - we're reloading
    }
    
    // Ensure version is saved
    saveCurrentVersion();
    
    // Check and clear query cache if version changed
    checkQueryCacheVersion();
    
    // Initialize visibility change listener for update detection
    initVisibilityChangeListener();
    
    // Clear timeout and render
    clearTimeout(renderTimeout);
    renderApp();
  } catch (error) {
    clearTimeout(renderTimeout);
    console.error('[Bootstrap] Error during version check:', error);
    // If version check fails, still render the app
    renderApp();
  }
}

// Start the app immediately
bootstrap();
