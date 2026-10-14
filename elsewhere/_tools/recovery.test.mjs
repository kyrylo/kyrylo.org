import assert from "node:assert/strict";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const url = process.env.ELSEWHERE_URL || "http://127.0.0.1:8244/elsewhere/";
async function mockPlayer(page, failPrimary = false) {
  await page.addInitScript(({ failPrimary }) => {
    window.createdPlayers = [];
    window.loadedVideos = [];
    window.testPlayers = [];
    window.YT = { Player: class {
      constructor(slot, options) {
        this.options = options;
        this.videoId = options.videoId;
        this.frame = document.createElement("iframe");
        slot.replaceWith(this.frame);
        window.createdPlayers.push(options.videoId);
        window.loadedVideos.push(options.videoId);
        window.testPlayers.push(this);
        setTimeout(() => {
          if (this.destroyed) return;
          options.events.onReady({ target: this });
          if (failPrimary && options.videoId === "JQ_jwk_7OVE")
            options.events.onError({ data: 100, target: this });
          else options.events.onStateChange({ data: 1, target: this });
        }, 0);
      }
      getIframe() { return this.frame; }
      getVideoData() { return { isLive: true, video_id: this.videoId }; }
      loadVideoById({ videoId }) {
        this.videoId = videoId;
        window.loadedVideos.push(videoId);
        setTimeout(() => this.options.events.onStateChange({ data: 1, target: this }), 0);
      }
      getCurrentTime() { return 10; } // A decoded but stalled stream.
      getPlayerState() { return 1; }
      mute() {}
      playVideo() {}
      pauseVideo() {}
      destroy() { this.destroyed = true; this.frame.remove(); }
    }};
  }, { failPrimary });
}
try {
  const backup = await browser.newPage({ timezoneId: "America/New_York" });
  await mockPlayer(backup, true);
  await backup.goto(url);
  await backup.waitForFunction(() => document.getElementById("camera-place").textContent === "Skyline from Lincoln Harbor");
  assert.equal(await backup.locator("#camera-city").textContent(), "New York");
  assert.match(await backup.locator("#camera-source").getAttribute("href"), /sixP_dAJ8D4/);
  assert.equal(await backup.locator("#camera-panel").getAttribute("data-state"), "playing");
  assert.deepEqual(await backup.evaluate(() => window.createdPlayers), ["JQ_jwk_7OVE"]);
  assert.deepEqual(await backup.evaluate(() => window.loadedVideos), ["JQ_jwk_7OVE", "sixP_dAJ8D4"]);
  await backup.locator(`.city-stop[data-city="london"]`).click();
  await backup.waitForSelector("#camera-panel[data-state=playing]");
  assert.equal(await backup.locator("#camera-place").textContent(), "Abbey Road");
  assert.equal(await backup.evaluate(() => window.createdPlayers.length), 1);
  console.log("PASS failed broadcast switches to verified backup with correct attribution; navigation resets source");
  // A fast gesture opens only its final destination and keeps the player warm.
  const loads = await backup.evaluate(() => window.loadedVideos.length);
  await backup.evaluate(() => {
    for (const city of ["rio", "venice", "tokyo"]) {
      document.querySelector(`.city-stop[data-city="${city}"]`).click();
    }
    const previous = window.testPlayers[0];
    previous.options.events.onStateChange({ data: 1, target: previous });
    previous.options.events.onError({ data: 100, target: previous });
  });
  assert.equal(await backup.locator("#camera-panel").getAttribute("data-state"), "connecting");
  await backup.waitForSelector("#camera-panel[data-state=playing]");
  assert.equal(await backup.locator("#camera-city").textContent(), "Tokyo");
  assert.equal(await backup.evaluate(() => window.createdPlayers.length), 1);
  assert.equal(await backup.evaluate(() => window.loadedVideos.length), loads + 1);
  assert.equal(await backup.locator("#camera-mount iframe").count(), 1);
  console.log("PASS rapid travel coalesces video loads, reuses one iframe and rejects stale playback/errors");
  await backup.close();

  const stalled = await browser.newPage({ timezoneId: "Asia/Manila" });
  await stalled.clock.install();
  await mockPlayer(stalled);
  await stalled.goto(url);
  await stalled.waitForSelector("#camera-panel[data-state=playing]");
  await stalled.clock.runFor(41000);
  assert.equal(await stalled.evaluate(() => window.createdPlayers.length), 2);
  await stalled.clock.runFor(41000);
  assert.equal(await stalled.locator("#camera-panel").getAttribute("data-state"), "unavailable");
  assert.equal(await stalled.evaluate(() => window.createdPlayers.length), 2);
  await stalled.locator("#camera-retry").click();
  await stalled.waitForSelector("#camera-panel[data-state=playing]");
  assert.equal(await stalled.evaluate(() => window.createdPlayers.length), 3);
  console.log("PASS stalled video reconnects once, stops retrying, and supports manual recovery");
} finally { await browser.close(); }
