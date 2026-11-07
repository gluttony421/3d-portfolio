function normalizeSiteUrl(value: string) {
  const url = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return new URL(url.endsWith("/") ? url : `${url}/`);
}

const configuredUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.VERCEL_PROJECT_PRODUCTION_URL ??
  "http://localhost:3000";

export const siteUrl = normalizeSiteUrl(configuredUrl.trim());

export function absoluteUrl(pathname: string) {
  return new URL(pathname, siteUrl).toString();
}
