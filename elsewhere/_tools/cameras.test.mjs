import { CITIES } from "../cities.js";
import { mkdir, writeFile } from "node:fs/promises";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const url = process.env.ELSEWHERE_URL || "http://127.0.0.1:8244/elsewhere/";
const output = "/tmp/elsewhere-global-qa";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const subset = process.env.ELSEWHERE_CAMERA_IDS?.split(",");
const candidates = process.env.ELSEWHERE_BACKUPS_ONLY
  ? CITIES.flatMap(city => (city.alternates || []).map((source, index) =>
      ({ ...city, ...source, auditId: `${city.id}-backup-${index + 1}` })))
  : CITIES;
const pending = candidates.filter(
    (city) => (city.videoId || city.cameraAlias) && (!subset || subset.includes(city.id))
  ),
  results = [];
if (!pending.length)
  throw new Error("No cameras matched the requested verification subset");
try {
  await Promise.all(
    Array.from({ length: 3 }, async () => {
      const context = await browser.newContext({
        viewport: { width: Number(process.env.ELSEWHERE_VIEWPORT_WIDTH || 1200), height: 900 },
      });
      const page = await context.newPage();
      page.setDefaultTimeout(15000);
      let current;
      // Make each seasonal companion selectable, regardless of today's DST grouping.
      await page.route("**/cities.js*", (route) =>
        route.fulfill({
          contentType: "application/javascript",
          body: `export const CITIES = ${JSON.stringify([
            current,
            ...CITIES.filter((c) => c.id !== current.id),
          ])};`,
        })
      );
      while (pending.length) {
        current = pending.shift();
        const result = {
          city: current.name,
          id: current.auditId || current.id,
          videoId: current.videoId,
          cameraAlias: current.cameraAlias,
        };
        try {
          // Production embeds can keep the load event pending; verify playback
          // below instead of waiting for every third-party resource to finish.
          await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
          await page.locator(`.city-stop[data-city="${current.id}"]`).click();
          await page.waitForSelector("#camera-panel[data-state=playing]", {
            timeout: 35000,
          });
          const frame = page
            .frames()
            .find((f) => current.cameraAlias ? f.url().includes("camera-frame.html") : f.url().includes("youtube.com/embed/"));
          if (current.videoId) await frame.waitForFunction(
            id => document.getElementById("movie_player")?.getVideoData().video_id === id,
            current.videoId
          );
          await frame.waitForFunction(
            () => {
              const video = document.querySelector("video");
              return video && !video.paused && video.readyState >= 2;
            },
            null,
            { timeout: 12000 }
          );
          const firstTime = await frame.evaluate(() => document.querySelector("video").currentTime);
          await page.waitForTimeout(2500);
          const lastTime = await frame.evaluate(() => document.querySelector("video").currentTime);
          if (lastTime <= firstTime) throw new Error("Video did not advance");
          result.playback = true;
          result.clock = await page.locator("#current-time").textContent();
          await page.waitForTimeout(2500);
          await page
            .locator(".camera-section")
            .screenshot({ path: `${output}/${current.auditId || current.id}.png` });
          console.log(`PASS ${current.name}: live embed playing`);
        } catch (error) {
          result.playback = false;
          result.state = await page
            .locator("#camera-panel")
            .getAttribute("data-state")
            .catch(() => "missing");
          result.error = error.message.split("\n")[0];
          console.log(
            `FAIL ${current.name}: ${result.state} — ${result.error}`
          );
        }
        results.push(result);
      }
      await context.close();
    })
  );
} finally {
  await writeFile(
    `${output}/${process.env.ELSEWHERE_BACKUPS_ONLY ? "backup-results" : subset ? "subset-results" : "results"}.json`,
    JSON.stringify(results, null, 2)
  );
  await browser.close();
}
if (results.some((r) => !r.playback)) process.exitCode = 1;
