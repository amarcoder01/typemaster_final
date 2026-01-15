export function initAnalytics() {
  const id = (import.meta.env.VITE_GA4_ID as string) || "";
  if (!id) return;
  if ((window as any).dataLayer) return;
  (window as any).dataLayer = (window as any).dataLayer || [];
  function gtag(...args: any[]) {
    (window as any).dataLayer.push(args);
  }
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(s);
  gtag("js", new Date());
  gtag("config", id, { anonymize_ip: true });
}

