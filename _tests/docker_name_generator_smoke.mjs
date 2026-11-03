// Run against a local nginx preview or the deployed destination before cutover.
// Requests deliberately do not follow redirects or execute tracking scripts.
import assert from "node:assert/strict";

const server = process.argv[2] || "http://127.0.0.1:18882";
const base = "/docker-name-generator";
const canonical = "https://kyrylo.org";
let checked = 0;

async function check(route, status, location) {
  const response = await fetch(server + route, { redirect: "manual" });
  assert.equal(response.status, status, route);
  assert.equal(response.headers.get("location"), location ?? null, route);
  const body = await response.text();
  if (status === 301) assert.doesNotMatch(body, /owlytics|telesink|feeds\.kyrylo/i, route);
  checked++;
  return body;
}

for (const query of ["", "?utm_source=migration-test&separator=_"]) {
  for (const alias of [base, `${base}.html`, `${base}/index.html`]) {
    await check(alias + query, 301, canonical + base + "/" + query);
  }
  await check(base + "/" + query, 200);
  for (const slug of ["docker-names", "docker-compose-container-name", "about", "contact", "privacy"]) {
    const route = `${base}/${slug}`;
    for (const alias of [route, `${route}.html`, `${route}/index.html`]) {
      await check(alias + query, 301, canonical + route + "/" + query);
    }
    await check(route + "/" + query, 200);
  }
}

await check(base + "/missing", 404);
for (const asset of ["assets/javascripts/script.js", "assets/javascripts/guide.js", "assets/javascripts/modules/names_generator.js", "assets/javascripts/modules/container_name_validator.js", "assets/javascripts/modules/telesink.js", "assets/stylesheets/styles.css", "assets/images/og.png", "assets/images/favicons/site.webmanifest"]) {
  await check(`${base}/${asset}`, 200);
}

const sitemap = await check("/sitemap.xml", 200);
assert.ok(sitemap.includes(`<loc>${canonical}${base}/</loc>`));
await check("/feed.xml", 200);
console.log(`Destination smoke tests passed: ${checked} canonical, redirect, query, asset, sitemap, feed, and 404 responses at ${server}`);
