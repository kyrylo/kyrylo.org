import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const base = new URL(process.env.ELSEWHERE_URL || "http://127.0.0.1:8244/elsewhere/");
const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
try {
  for (const width of [320, 390, 430, 1280]) {
    const context = await browser.newContext({
      viewport: { width, height: 844 }, deviceScaleFactor: 2,
      isMobile: width < 650, hasTouch: width < 650, timezoneId: "Asia/Manila",
    });
    // This regression checks startup even when third-party services or the
    // separate logo asset are unavailable. The wordmark belongs to the page.
    await context.route("**/*", route => {
      const url = new URL(route.request().url());
      return url.origin !== base.origin || url.pathname.includes("kyrylo-silin-logo")
        ? route.abort() : route.continue();
    });
    for (const slash of [true, false]) {
      const page = await context.newPage(), errors = [], missing = [];
      page.on("pageerror", error => errors.push(error.message));
      page.on("response", response => {
        if (new URL(response.url()).origin === base.origin && response.status() >= 400)
          missing.push(`${response.status()} ${response.url()}`);
      });
      const url = new URL(slash ? "/elsewhere/" : "/elsewhere", base).href;
      if (!slash) {
        // Reproduce nginx's former 200 response without its canonical redirect.
        // Assets and the camera wrapper must remain correctly rooted regardless.
        await page.route(url, route => route.fulfill({ contentType: "text/html", body: html }));
      }
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await page.locator(".city-stop").first().waitFor();
      await page.waitForFunction(() => {
        const image = document.querySelector(".real-clock > img");
        return image.complete && image.naturalWidth > 0;
      });
      assert.match(await page.locator("#current-time").textContent(), /^\d{2}:\d{2}$/);
      assert.ok(await page.locator(".author-wordmark path").isVisible());
      assert.equal(await page.locator(".author-block img").count(), 0);
      const layout = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        columns: getComputedStyle(document.querySelector(".time-warp")).gridTemplateColumns,
        logo: getComputedStyle(document.querySelector(".author-wordmark")).color,
      }));
      assert.equal(layout.overflow, false, `${url} overflows at ${width}px`);
      assert.equal(layout.columns.split(" ").length, width < 650 ? 1 : 2);
      assert.equal(layout.logo, "rgb(243, 239, 231)");
      const before = await page.locator("#camera-city").textContent();
      const forward = page.locator("#zoom-in");
      if (width < 650) await forward.tap(); else await forward.click();
      assert.notEqual(await page.locator("#camera-city").textContent(), before);
      await page.locator('.city-stop[data-city="santa-maria"]').click();
      const wrapper = page.locator('#camera-mount iframe[src*="camera-frame.html"]');
      await wrapper.waitFor();
      assert.equal(new URL(await wrapper.getAttribute("src")).pathname, "/elsewhere/camera-frame.html");
      assert.deepEqual(errors, []);
      assert.deepEqual(missing, []);
      console.log(`PASS ${width}px ${slash ? "canonical" : "slashless"}: styled page, clock, inline logo, touch navigation and camera URL`);
      await page.close();
    }
    await context.close();
  }
} finally { await browser.close(); }
