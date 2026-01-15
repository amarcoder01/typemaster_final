export const BASE_URL =
  (import.meta.env.VITE_BASE_URL as string) ||
  (typeof window !== 'undefined' ? window.location.origin : 'https://typemasterai.com');

