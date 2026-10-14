import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { CITIES } from "../cities.js";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const url = process.env.ELSEWHERE_URL || "http://127.0.0.1:8244/elsewhere/";
const output = "/tmp/elsewhere-rendering";
await mkdir(output, { recursive: true });
try {
  const clock = await browser.newPage({ timezoneId: "Asia/Tokyo" });
  const errors = [];
  clock.on("pageerror", error => errors.push(error.message));
  await clock.route("**/live-camera.js", route => route.fulfill({
    contentType: "application/javascript",
    body: "export function createLiveCamera() { return {load(){}}; }",
  }));
  await clock.clock.install({ time: new Date("2026-10-14T12:34:55Z") });
  await clock.goto(url);
  await clock.clock.pauseAt(new Date("2026-10-14T12:34:56.500Z"));
  await clock.clock.runFor(34); // Flush the frame queued by the resumed second timer.
  const angle = id => clock.locator(id).evaluate(el => Number(el.style.transform.match(/[-\d.]+/)[0]));
  const second = await angle("#second-hand");
  assert.equal(second, 56 * 6);
  await clock.clock.runFor(350);
  assert.equal(await angle("#second-hand"), second, "hands rest between mechanical ticks");
  await clock.clock.runFor(600);
  assert.equal(await angle("#second-hand"), 57 * 6);
  assert.equal(await clock.locator("#current-seconds").textContent(), ":57");
  await clock.locator(`.city-stop[data-city="london"]`).click();
  assert.equal(await clock.locator("#clock-portal").getAttribute("data-warping"), "true");
  await clock.clock.runFor(1200);
  assert.equal(await clock.locator("#clock-portal").getAttribute("data-warping"), "false");
  assert.equal(await clock.locator("#current-time").textContent(), "13:34");
  assert.ok(Math.abs((await angle("#minute-hand") % 360) - 209.8) < .2);
  await clock.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const hiddenAngle = await angle("#second-hand");
  const hiddenBackground = await clock.locator(".atmosphere-canvas").evaluate(el => el.toDataURL());
  await clock.clock.runFor(60000);
  assert.equal(await angle("#second-hand"), hiddenAngle);
  assert.equal(await clock.locator(".atmosphere-canvas").evaluate(el => el.toDataURL()), hiddenBackground);
  assert.equal(await clock.locator("#place-atmosphere").getAttribute("data-paused"), "true");
  await clock.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  assert.equal(await clock.locator("#current-time").textContent(), "13:35");
  await clock.emulateMedia({ reducedMotion: "reduce" });
  await clock.locator(`.city-stop[data-city="rio"]`).click();
  assert.equal(await clock.locator("#clock-portal").getAttribute("data-warping"), "false");
  assert.equal(await clock.locator("#place-atmosphere").evaluate(el => el.getAnimations({ subtree: true }).length), 0);
  assert.equal(await clock.locator("#place-atmosphere").getAttribute("data-pattern"), "coast");
  await clock.clock.runFor(3000);
  const stillBackground = await clock.locator(".atmosphere-canvas").evaluate(el => el.toDataURL());
  await clock.clock.runFor(10000);
  assert.equal(await clock.locator(".atmosphere-canvas").evaluate(el => el.toDataURL()), stillBackground);
  await clock.close();
  console.log("PASS clock rests between ticks, wakes for travel, recovers exact time after hiding, and respects reduced motion");

  const page = await browser.newPage({ viewport: { width: 1200, height: 920 }, timezoneId: "Asia/Tokyo" });
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(url);
  let previousFrame;
  for (const id of ["tokyo", "venice", "rio", "santa-maria", "reykjavik", "tokyo"]) {
    await page.locator(`.city-stop[data-city="${id}"]`).click();
    await page.waitForSelector("#camera-panel[data-state=playing]", { timeout: 45000 });
    const city = CITIES.find(city => city.id === id);
    const iframe = await page.locator("#camera-mount iframe").elementHandle();
    if (["venice", "rio"].includes(id)) assert.ok(await iframe.evaluate((el, previous) => el === previous, previousFrame));
    const frame = await iframe.contentFrame();
    if (city.videoId) await frame.waitForFunction(
      id => document.getElementById("movie_player")?.getVideoData().video_id === id, city.videoId
    );
    await frame.waitForFunction(() => {
      const video = document.querySelector("video");
      return video && !video.paused && video.readyState >= 2;
    });
    const before = await frame.evaluate(() => document.querySelector("video").currentTime);
    await page.waitForTimeout(1700);
    assert.ok(await frame.evaluate(() => document.querySelector("video").currentTime) > before);
    assert.equal(await page.locator("#camera-mount iframe").count(), 1);
    assert.equal(await page.locator("#camera-source").getAttribute("href"), city.source);
    await page.waitForTimeout(1800);
    await page.screenshot({ path: `${output}/${id}.png`, fullPage: true });
    previousFrame = iframe;
    console.log(`PASS ${city.name}: correct source and advancing video, one player`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: `${output}/mobile.png`, fullPage: true });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert.deepEqual(errors, []);
  console.log("PASS reused live players, both provider switches, desktop/mobile rendering, no browser errors");
} finally { await browser.close(); }
