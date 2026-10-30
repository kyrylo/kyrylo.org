const categories = new Set([
  "Page", "Website", "App", "SaaS", "Company", "Service",
  "Subscription", "Platform", "Tool", "Feature",
]);
const defaultReason = "it made my eyeballs bleed";

export function siteUrl(site) {
  try {
    const value = site.trim();
    if (!value) return null;
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`);
    return ["http:", "https:"].includes(url.protocol) ? url : null;
  } catch {
    return null;
  }
}

export function readShareState(search) {
  const params = new URLSearchParams(search);
  const site = (params.get("url") || "").trim();
  const url = siteUrl(site);
  if (!url) return null;
  return {
    site,
    url,
    because: (params.get("because") || "").trim() || defaultReason,
    category: categories.has(params.get("c")) ? params.get("c") : "Page",
  };
}

export function createShareUrl(site, because, category, origin) {
  if (!siteUrl(site)) return null;
  const url = new URL("/fuck-this-page/", origin);
  url.searchParams.set("url", site.trim());
  url.searchParams.set("because", because.trim() || defaultReason);
  if (categories.has(category) && category !== "Page") {
    url.searchParams.set("c", category);
  }
  return url.href;
}
