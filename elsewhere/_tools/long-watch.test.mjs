import assert from "node:assert/strict";
import { worldRoute } from "../world-route.js";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage();
  await page.route("https://www.youtube.com/**", (route) => route.abort());
  await page.addInitScript(() => {
    const ActualDate = Date;
    window.testNow = ActualDate.parse("2026-10-25T00:59:30Z");
    window.Date = class extends ActualDate {
      constructor(...args) {
        super(...(args.length ? args : [window.testNow]));
      }
      static now() {
        return window.testNow;
      }
    };
  });
  await page.goto(process.env.ELSEWHERE_URL || "http://127.0.0.1:8244/elsewhere/");
  await page.locator(`.city-stop[data-city="london"]`).click();
  assert.equal(await page.locator("#current-zone").textContent(), "UTC+01:00");
  assert.equal(await page.locator("#current-time").textContent(), "01:59");
  await page.evaluate(() => {
    window.testNow += 60000;
  });
  await page.waitForFunction(
    () => document.getElementById("current-zone").textContent === "UTC+00:00"
  );
  assert.equal(await page.locator("#current-time").textContent(), "01:00");
  assert.equal(await page.locator("html").getAttribute("data-city"), "london");
  assert.equal(
    await page
      .locator(".city-stop[aria-current=true]")
      .getAttribute("data-city"),
    "london"
  );
  assert.equal(
    await page.locator(".city-stop[aria-current=true] time").textContent(),
    "01:00"
  );
  assert.equal(await page.locator("#city-route button").count(), worldRoute(new Date("2026-10-25T01:00:30Z"), "london").length);
  await page.locator(`.city-stop[data-city="auckland"]`).click();
  await page.evaluate(() => {
    window.testNow += 11 * 3600000;
  });
  await page.waitForFunction(
    () => document.getElementById("current-time").textContent === "01:00"
  );
  assert.match(await page.locator("#current-date").textContent(), /26 Oct/);
  assert.equal(
    await page.locator(".city-stop[aria-current=true] time").textContent(),
    "01:00"
  );
  console.log(
    "PASS long watch: minute refresh, daylight-saving route reorder, retained city, date-line midnight"
  );
} finally {
  await browser.close();
}
