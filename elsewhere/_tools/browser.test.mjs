import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { CITIES } from "../cities.js";
import { worldRoute } from "../world-route.js";
const route = worldRoute(new Date());
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const url = process.env.ELSEWHERE_URL || "http://127.0.0.1:8244/elsewhere/";
const output = process.env.ELSEWHERE_SCREENSHOTS || "/tmp/elsewhere-warp-qa";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const context = await browser.newContext({
    viewport: { width: 1200, height: 900 },
    timezoneId: "Asia/Manila",
    hasTouch: true,
  });
  const page = await context.newPage(),
    errors = [],
    legacy = [];
  page.setDefaultTimeout(15000);
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (
      /diaries\.json|illustrative-children|illustrated-scenes|miniatures|three\.module/.test(
        r.url()
      )
    )
      legacy.push(r.url());
  });
  await page.goto(url);
  await page.waitForSelector("#city-route button");
  assert.equal(await page.locator("#city-route button").count(), route.length);
  assert.equal(
    await page.locator("#life-scene,#watch-day,#another-life").count(),
    0
  );
  for (const city of process.env.ELSEWHERE_SKIP_STREAMS
    ? []
    : route.filter((city) => city.videoId)) {
    await page.locator(`.city-stop[data-city="${city.id}"]`).click();
    await page.waitForSelector(`#camera-panel[data-state="playing"]`, {
      timeout: 35000,
    });
    assert.equal(await page.locator("html").getAttribute("data-city"), city.id);
    assert.equal(await page.locator("#camera-city").textContent(), city.name);
    assert.equal(await page.locator("#camera-mount iframe").count(), 1);
    const expected = await page.evaluate(
      (zone) =>
        new Intl.DateTimeFormat("en-GB", {
          timeZone: zone,
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
        }).format(new Date()),
      city.zone
    );
    assert.equal(await page.locator("#current-time").textContent(), expected);
    const liveFrame = page
      .frames()
      .find((f) => f.url().includes("youtube.com/embed/"));
    await liveFrame.waitForFunction(
      id => document.getElementById("movie_player")?.getVideoData().video_id === id,
      city.videoId
    );
    await liveFrame.waitForFunction(
      () => {
        const v = document.querySelector("video");
        return v && !v.paused && v.readyState >= 2;
      },
      null,
      { timeout: 15000 }
    );
    console.log(
      `PASS ${city.name}: live embedded video, city attribution, ${expected} local clock`
    );
  }
  // Gestures change cities once per wheel gesture, with a continuous zoom and hand warp.
  await page.locator(`.city-stop[data-city="${route.at(-1).id}"]`).click();
  await page.locator("#zoom-in").click();
  assert.equal(
    await page.locator("html").getAttribute("data-city"),
    route[0].id
  );
  assert.equal(
    await page.locator("#clock-portal").getAttribute("data-warping"),
    "true"
  );
  await page.locator("#zoom-out").click();
  assert.equal(
    await page.locator("html").getAttribute("data-city"),
    route.at(-1).id
  );
  await page.locator("#clock-portal").focus();
  await page.keyboard.press("Home");
  assert.equal(
    await page.locator("html").getAttribute("data-city"),
    route[0].id
  );
  await page.keyboard.press("End");
  assert.equal(
    await page.locator("html").getAttribute("data-city"),
    route.at(-1).id
  );
  await page.locator("#clock-portal").hover();
  await page.mouse.wheel(0, -100);
  await page.waitForTimeout(60);
  await page.mouse.wheel(0, -100);
  await page.waitForTimeout(50);
  assert.equal(
    await page.locator("html").getAttribute("data-city"),
    route[0].id
  );
  await page.waitForTimeout(250);
  await page.mouse.wheel(0, 100);
  await page.waitForTimeout(70);
  assert.equal(
    await page.locator("html").getAttribute("data-city"),
    route.at(-1).id
  );
  // Real two-finger input, not a synthetic click or a mocked event handler.
  const box = await page.locator("#clock-portal").boundingBox();
  const cdp = await context.newCDPSession(page),
    y = box.y + box.height / 2,
    x = box.x + box.width / 2;
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x: x - 40, y, id: 1 },
      { x: x + 40, y, id: 2 },
    ],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [
      { x: x - 65, y, id: 1 },
      { x: x + 65, y, id: 2 },
    ],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await page.waitForTimeout(100);
  assert.equal(
    await page.locator("html").getAttribute("data-city"),
    route[0].id
  );
  assert.equal(await page.locator(".city-stop").count(), route.length);
  assert.ok(!(await page.locator("#city-route").textContent()).includes("no camera"));
  // Fractional offsets remain reachable from the city strip.
  await page.locator(`.city-stop[data-city="mount-abu"]`).click();
  assert.equal(await page.locator("#current-zone").textContent(), "UTC+05:30");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator(`.city-stop[data-city="tokyo"]`).click();
  assert.equal(
    await page.locator("#clock-portal").getAttribute("data-warping"),
    "false"
  );
  assert.equal(
    await page
      .locator("#clock-visual")
      .evaluate((el) => el.getAnimations().length),
    0
  );
  await page.waitForSelector("#camera-panel[data-state=playing]", {
    timeout: 35000,
  });
  const frame = page.locator("#camera-mount iframe");
  const params = new URL(await frame.getAttribute("src")).searchParams;
  assert.equal(params.get("controls"), "0");
  assert.equal(params.get("fs"), "0");
  assert.equal(params.get("disablekb"), "1");
  assert.equal(await frame.getAttribute("tabindex"), "-1");
  assert.equal(
    await frame.evaluate((el) => getComputedStyle(el).pointerEvents),
    "none"
  );
  await page.mouse.move(0, 0);
  await page.waitForTimeout(5500);
  for (const width of [1200, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      ),
      `horizontal overflow at ${width}`
    );
    await page.screenshot({
      path: `${output}/warp-${width}.png`,
      fullPage: true,
    });
  }
  console.log(
    "PASS zoom buttons, keyboard, wheel, pinch, wraparound, reduced motion, and 320–1200px layouts"
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(legacy, []);
  // A blocked third-party player must not break the clock or trap navigation.
  const offline = await context.newPage();
  await offline.route("https://www.youtube.com/**", (route) => route.abort());
  await offline.goto(url);
  await offline.waitForSelector("#camera-panel[data-state=unavailable]", {
    timeout: 18000,
  });
  assert.notEqual(
    await offline.locator("#current-time").textContent(),
    "--:--"
  );
  const seconds = await offline.locator("#current-seconds").textContent();
  await offline.waitForTimeout(1100);
  assert.notEqual(
    await offline.locator("#current-seconds").textContent(),
    seconds
  );
  await offline.locator(`.city-stop[data-city="sydney"]`).click();
  assert.equal(await offline.locator("#clock-city").textContent(), "Sydney");
  assert.equal(
    await offline.locator("#camera-source").getAttribute("href"),
    CITIES.find((city) => city.id === "sydney").source
  );
  console.log(
    "PASS camera failure fallback, clock independence, and removal of all diary/scene runtime dependencies"
  );
} finally {
  await browser.close();
}
