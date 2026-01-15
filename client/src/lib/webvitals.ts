type Metric = {
  name: string;
  value: number;
  id: string;
};

function send(metric: Metric) {
  try {
    navigator.sendBeacon(
      "/api/webvitals",
      JSON.stringify({
        name: metric.name,
        value: metric.value,
        id: metric.id,
        url: location.pathname,
        ua: navigator.userAgent,
        ts: Date.now(),
      }),
    );
  } catch {
    fetch("/api/webvitals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: metric.name,
        value: metric.value,
        id: metric.id,
        url: location.pathname,
        ua: navigator.userAgent,
        ts: Date.now(),
      }),
      keepalive: true,
    });
  }
}

export function initWebVitals() {
  try {
    const po = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === "largest-contentful-paint") {
          send({ name: "LCP", value: entry.startTime, id: (entry as any).id || "lcp" });
        } else if (entry.entryType === "layout-shift") {
          const shifted = (entry as any).value || 0;
          if (!(entry as any).hadRecentInput) {
            send({ name: "CLS", value: shifted, id: (entry as any).id || "cls" });
          }
        } else if (entry.entryType === "first-input") {
          const fi = entry as PerformanceEventTiming;
          send({ name: "FID", value: fi.processingStart - fi.startTime, id: (entry as any).id || "fid" });
        }
      }
    });
    po.observe({ type: "largest-contentful-paint", buffered: true });
    po.observe({ type: "layout-shift", buffered: true });
    po.observe({ type: "first-input", buffered: true });
  } catch {}
}

