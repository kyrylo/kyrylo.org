import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const built = process.env.SITE_DESTINATION || path.join(root, "_site");
const base = "/docker-name-generator/";
const origin = "https://kyrylo.org";
const slugs = ["", "docker-names/", "docker-compose-container-name/", "about/", "contact/", "privacy/"];
const read = (relative) => readFileSync(path.join(built, relative), "utf8");
const pages = () => slugs.map((slug) => [base + slug, read(`${base}${slug}index.html`)]);

test("all six migrated pages have matching canonical and social URLs", () => {
  const titles = new Set();
  for (const [route, html] of pages()) {
    const canonicals = [...html.matchAll(/<link rel="canonical" href="([^"]+)"/g)];
    assert.equal(canonicals.length, 1, route);
    assert.equal(canonicals[0][1], origin + route);
    assert.ok(html.includes(`<meta property="og:url" content="${origin}${route}">`), route);
    assert.equal([...html.matchAll(/<h1\b/g)].length, 1, route);
    assert.doesNotMatch(html, /<!--#|dockernamegenerator\.com|noindex|plausible/i, route);
    titles.add(html.match(/<title>(.*?)<\/title>/s)[1]);
  }
  assert.equal(titles.size, slugs.length);
});

test("each migrated page tracks one pageview under kyrylo.org", () => {
  for (const [route, html] of pages()) {
    const scripts = [...html.matchAll(/<script\b[^>]*src="https:\/\/owlytics\.kyrylo\.org\/script\.js"[^>]*>/g)];
    assert.equal(scripts.length, 1, route);
    assert.match(scripts[0][0], /\bdefer\b/);
    assert.match(scripts[0][0], /data-domain="kyrylo\.org"/);
    assert.doesNotMatch(html, /analytics\.kyrylo\.org|window\.plausible/);
  }
});

test("all local page, stylesheet, image, and script links resolve in the built site", () => {
  for (const [route, html] of pages()) {
    for (const [, raw] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (!raw.startsWith("/") || raw.startsWith("//")) continue;
      const file = new URL(raw, origin).pathname;
      const candidates = [path.join(built, file), path.join(built, file, "index.html"), path.join(built, file + ".html")];
      assert.ok(candidates.some(existsSync), `${route}: ${raw}`);
    }
  }
});

test("structured data describes the tool and guides at their new URLs", () => {
  for (const [route, html] of pages().slice(0, 3)) {
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(([, text]) => JSON.parse(text));
    assert.equal(blocks.length, 1, route);
    assert.equal(blocks[0].url, origin + route);
    assert.equal(blocks[0]["@type"], route === base ? "WebApplication" : "TechArticle");
    if (route !== base) assert.equal(blocks[0].mainEntityOfPage, origin + route);
  }
});

test("the main sitemap includes all migrated canonical URLs exactly once", () => {
  const urls = [...read("sitemap.xml").matchAll(/<loc>(.*?)<\/loc>/g)].map(([, url]) => url);
  for (const slug of slugs) {
    assert.equal(urls.filter((url) => url === origin + base + slug).length, 1, slug);
  }
  assert.ok(!urls.some((url) => url.startsWith(origin + base) && url.endsWith("index.html")));
});

test("the tool shares the site's Atom feed and does not create a separate feed", () => {
  for (const [route, html] of pages()) {
    assert.equal([...html.matchAll(/type="application\/atom\+xml"/g)].length, 1, route);
    assert.match(html, /href="https:\/\/kyrylo\.org\/feed\.xml"/);
  }
  assert.ok(!existsSync(path.join(built, base, "feed.xml")));
});

test("the manifest and project links stay under the new host and path", () => {
  const manifest = JSON.parse(read(`${base}assets/images/favicons/site.webmanifest`));
  assert.equal(manifest.start_url, base);
  assert.equal(manifest.scope, base);
  assert.equal(manifest.id, base);
  for (const icon of manifest.icons) {
    assert.ok(icon.src.startsWith(base));
    assert.ok(existsSync(path.join(built, icon.src)));
  }
  const collection = existsSync(path.join(built, "tools/index.html")) ? "tools/index.html" : "projects/index.html";
  for (const page of [collection, "tech-debt/index.html"]) {
    assert.match(read(page), /href="\/docker-name-generator\/"/);
    assert.doesNotMatch(read(page), /https:\/\/dockernamegenerator\.com/);
  }
  assert.match(read(base + "index.html"), /utm_source=kyrylo\.org&amp;utm_medium=referral/);
});
