const VERSION = "1.1.0";

const endpoint = () => {
  if (typeof process !== "undefined") return process.env?.TELESINK_ENDPOINT;
  if (typeof window !== "undefined") return window.TELESINK_ENDPOINT;
  return null;
};

const enabled = () => {
  if (typeof process !== "undefined") return !process.env?.TELESINK_DISABLED;
  if (typeof window !== "undefined") return !window.TELESINK_DISABLED;
  return true;
};

const uuid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
      });

const urlParts = (url) => {
  if (!url) return {};

  try {
    const parsed = new URL(url);
    return {
      host: parsed.host,
      hostname: parsed.hostname,
      origin: parsed.origin,
      path: parsed.pathname,
    };
  } catch (_) {
    return {};
  }
};

const pageContext = () => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return {};
  }

  const page = urlParts(window.location?.href);
  const referrer = urlParts(document.referrer);
  const colorScheme =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  const timeZone =
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : null;

  return {
    page: {
      title: document.title,
      host: page.host,
      path: page.path,
      url: page.origin && page.path ? `${page.origin}${page.path}` : null,
      referrer_host: referrer.host,
    },
    browser: {
      language: navigator.language,
      languages: Array.from(navigator.languages || []),
      platform: navigator.platform,
      cookie_enabled: navigator.cookieEnabled,
      online: navigator.onLine,
      color_scheme: colorScheme,
      time_zone: timeZone,
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      device_pixel_ratio: window.devicePixelRatio,
      screen_width: window.screen?.width,
      screen_height: window.screen?.height,
    },
  };
};

const compact = (value) => {
  if (Array.isArray(value)) return value.map(compact);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, v]) => v != null)
      .map(([k, v]) => [k, compact(v)]),
  );
};

const track = async ({
  event,
  text,
  emoji,
  properties = {},
  occurredAt,
  idempotencyKey,
} = {}) => {
  if (!enabled() || !endpoint()) return false;
  if (!event || !text) return false;

  const idempotency = idempotencyKey ?? uuid();

  const payload = compact({
    event,
    text,
    emoji,
    properties: {
      app: "Docker Name Generator",
      source: "browser",
      ...pageContext(),
      ...properties,
      telesink_client: { name: "telesink", version: VERSION },
    },
    occurred_at: new Date(occurredAt ?? Date.now()).toISOString(),
    idempotency_key: idempotency,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const res = await fetch(endpoint(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    return res.ok;
  } catch (e) {
    console.error(`[Telesink] ${e.constructor.name}: ${e.message}`);
    return false;
  } finally {
    clearTimeout(timeout);
  }
};

export { track };
export default { track };
