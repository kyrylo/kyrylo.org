import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const built = process.env.SITE_DESTINATION || path.join(root, "_site");
const base = "docker-name-generator/";
const endpoint = "https://feeds.kyrylo.org/api/v1/feeds/G4TrwrwV1KJ4cfUvoAt28wEc/events";
const read = (relative) => readFileSync(path.join(built, relative), "utf8");

const inlineConfiguration = () => [...read(base + "index.html").matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map(([, body]) => body).filter((body) => body.includes("TELESINK_ENDPOINT"));

test("only the generator page configures the existing Feeds feed", () => {
  assert.equal(inlineConfiguration().length, 1);
  assert.ok(inlineConfiguration()[0].includes(endpoint));
  for (const slug of ["docker-names", "docker-compose-container-name", "about", "contact", "privacy"]) {
    assert.doesNotMatch(read(`${base}${slug}/index.html`), /TELESINK_ENDPOINT|names_generator\.js|javascripts\/script\.js/);
  }
  const collection = existsSync(path.join(built, "tools/index.html")) ? "tools/index.html" : "projects/index.html";
  for (const page of ["index.html", collection, "tech-debt/index.html"]) {
    assert.doesNotMatch(read(page), /TELESINK_ENDPOINT|G4TrwrwV1KJ4cfUvoAt28wEc/);
  }
  assert.match(read(`${base}privacy/index.html`), /existing Feeds event feed/);
});

test("an action sends one event to the existing feed with the new page context; previews stay quiet", async () => {
  // Evaluate the actual browser client in an isolated JS context with fetch
  // replaced. Only its two ESM export declarations are omitted for vm.Script.
  const client = read(base + "assets/javascripts/modules/telesink.js").replace(/^export .*;$/gm, "");
  for (const hostname of ["kyrylo.org", "localhost", "127.0.0.1", "preview.example"]) {
    const requests = [];
    const context = vm.createContext({
      window: { location: { hostname, href: `https://${hostname}/${base}?utm_source=test` } },
      document: { title: "Docker Name Generator", referrer: "https://www.google.com/search?q=names" },
      navigator: { language: "en", languages: ["en"] },
      URL, AbortController, setTimeout, clearTimeout, console,
      fetch: async (url, options) => { requests.push({ url, options }); return { ok: true }; },
    });
    vm.runInContext(inlineConfiguration()[0], context);
    vm.runInContext(client, context);
    assert.equal(requests.length, 0, "Loading the page must not send a Feeds pageview");
    const sent = await vm.runInContext('track({ event: "Names generated", text: "Generated a Docker name", properties: { count_generated: 1 } })', context);
    assert.equal(sent, hostname === "kyrylo.org");
    assert.equal(requests.length, hostname === "kyrylo.org" ? 1 : 0, hostname);
    if (!sent) continue;

    assert.equal(requests[0].url, endpoint);
    assert.equal(requests[0].options.method, "POST");
    const payload = JSON.parse(requests[0].options.body);
    assert.equal(payload.event, "Names generated");
    assert.equal(payload.properties.app, "Docker Name Generator");
    assert.equal(payload.properties.page.host, "kyrylo.org");
    assert.equal(payload.properties.page.path, "/docker-name-generator/");
    assert.equal(payload.properties.page.url, "https://kyrylo.org/docker-name-generator/");
    assert.equal(payload.properties.page.referrer_host, "www.google.com");
    assert.equal(payload.properties.count_generated, 1);
  }
});
