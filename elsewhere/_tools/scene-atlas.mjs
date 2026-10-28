// Visual audit: every illustration family, plus baby/child/older-adult variants.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const url = process.env.SAME24_URL || "http://127.0.0.1:8244/same24/";
const output = process.env.SAME24_SCREENSHOTS || "/tmp/same24-qa";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 1100 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.route("**/__scene-audit__", (r) =>
    r.fulfill({
      contentType: "text/html",
      body:
        '<!doctype html><link rel="stylesheet" href="./same24.css"><style>body{margin:0;background:white;font:13px system-ui}figure{margin:0;width:300px;height:275px;text-align:center}.scene-illustration{height:250px;width:300px}#audit{display:grid;grid-template-columns:repeat(4,300px)}</style><div id="audit"></div>',
    })
  );
  await page.goto(new URL("__scene-audit__", url).href);
  const report = await page.evaluate(async () => {
    const { makeIllustration } = await import("./illustrated-scenes.js");
    const { SCENE_KINDS } = await import("./scene-kinds.js");
    const cases = SCENE_KINDS.map((kind) => ({
      kind,
      age:
        kind === "feed"
          ? "Under 1"
          : ["play", "bath"].includes(kind)
          ? "1–3"
          : kind === "school"
          ? "4–7"
          : "25–34",
    }));
    for (const age of ["Under 1", "1–3", "4–7", "8–14", "65+"])
      cases.push({ kind: "sleep", age });
    for (const age of ["Under 1", "1–3", "4–7"])
      cases.push({ kind: "family", age });
    cases.push(
      { kind: "play", age: "4–7", label: "Playing outside" },
      { kind: "read", age: "Under 1", label: "Story time" }
    );
    const records = [];
    window.atlas = [];
    document.documentElement.dataset.sceneMotion = "paused";
    for (const [i, { kind, age, label }] of cases.entries()) {
      const illustration = makeIllustration({
        group: { age, child: ["Under 1", "1–3", "4–7", "8–14"].includes(age) },
        kind,
        identity: "scene" + i,
        label: label || kind,
        minute: kind === "sleep" ? 60 : 780,
      });
      const figure = document.createElement("figure");
      const caption = document.createElement("figcaption");
      caption.textContent = kind + " · " + age;
      figure.append(illustration, caption);
      document.getElementById("audit").append(figure);
      const bounds = illustration.getBBox();
      records.push({
        kind,
        age,
        animated: illustration.getAnimations({ subtree: true }).length > 0,
        bounds: {
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
        },
      });
      window.atlas.push(figure);
      figure.remove();
    }
    return records;
  });
  await writeFile(
    `${output}/scene-audit.json`,
    JSON.stringify(report, null, 2)
  );
  for (let i = 0; i < Math.ceil(report.length / 16); i++) {
    await page.evaluate(
      (i) =>
        document
          .getElementById("audit")
          .replaceChildren(...window.atlas.slice(i * 16, i * 16 + 16)),
      i
    );
    await page.screenshot({ path: `${output}/scene-atlas-${i}.png` });
  }
  assert.deepEqual(errors, []);
  assert.ok(
    report.every((r) => r.animated),
    JSON.stringify(report.filter((r) => !r.animated))
  );
  assert.ok(
    report.every(
      (r) =>
        Object.values(r.bounds).every(Number.isFinite) &&
        r.bounds.width > 300 &&
        r.bounds.height > 200
    )
  );
  console.log(
    `PASS ${report.length} SVG scenes rendered, animated, and free of invalid paths; contact sheets saved to ${output}`
  );
} finally {
  await browser.close();
}
