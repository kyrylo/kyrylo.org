import test from "node:test";
import assert from "node:assert/strict";
import { CITIES } from "../cities.js";
import { worldRoute, nearestStop } from "../world-route.js";
import {
  zonedTime,
  secondAngle,
  warpDestination,
  easeWarp,
} from "../warp-clock.js";
test("five city clocks describe the same instant", () => {
  const now = new Date("2026-10-14T12:00:00Z");
  assert.deepEqual(
    CITIES.slice(0, 5).map((c) => zonedTime(now, c.zone).time),
    ["08:00", "13:00", "14:00", "21:00", "23:00"]
  );
  assert.deepEqual(
    CITIES.slice(0, 5).map((c) => zonedTime(now, c.zone).offset),
    [-240, 60, 120, 540, 660]
  );
});
test("every route stop has a supported live camera, with one stop per available offset", () => {
  for (const month of [1, 3, 4, 7, 10, 11, 12]) {
    const date = new Date(Date.UTC(2026, month - 1, 14, 12));
    const route = worldRoute(date);
    assert.ok(route.every((city) => city.videoId || city.cameraAlias));
    const offsets = route.map((city) => zonedTime(date, city.zone).offset);
    const expected = new Set(CITIES.map((city) => zonedTime(date, city.zone).offset));
    assert.deepEqual(offsets, [...expected].sort((a, b) => a - b));
    assert.equal(new Set(offsets).size, route.length);
    assert.equal(route[0].id, "honolulu");
  }
});
test("fractional offsets and the date line remain exact", () => {
  const now = new Date("2026-10-14T12:00Z");
  assert.equal(zonedTime(now, "Asia/Kathmandu").time, "17:45");
  assert.equal(zonedTime(now, "Australia/Eucla").time, "20:45");
  assert.equal(zonedTime(now, "Pacific/Marquesas").time, "02:30");
  assert.equal(zonedTime(now, "Pacific/Chatham").time, "01:45");
  assert.equal(zonedTime(now, "Pacific/Kiritimati").day, 15);
  assert.equal(zonedTime(now, "Etc/GMT+12").day, 14);
});
test("seasonal route changes preserve the selected city and start near the visitor", () => {
  const before = new Date("2026-10-25T00:59:59Z"),
    after = new Date("2026-10-25T01:00:00Z");
  assert.equal(zonedTime(before, "Europe/London").offset, 60);
  assert.equal(zonedTime(after, "Europe/London").offset, 0);
  assert.ok(worldRoute(after, "reykjavik").some((c) => c.id === "reykjavik"));
  assert.ok(worldRoute(after, "london").some((c) => c.id === "london"));
  const route = worldRoute(before);
  assert.equal(route[nearestStop(route, before, "Asia/Manila")].id, "taipei");
  assert.equal(
    route[nearestStop(route, before, "Asia/Kathmandu")].id,
    "mount-abu"
  );
});
test("seasonal offsets and daylight-saving discontinuities are local to each city", () => {
  assert.equal(
    zonedTime(new Date("2026-01-14T12:00Z"), "Europe/London").offset,
    0
  );
  assert.equal(
    zonedTime(new Date("2026-07-14T12:00Z"), "Australia/Sydney").offset,
    600
  );
  assert.equal(
    zonedTime(new Date("2026-03-29T00:59:59Z"), "Europe/London").time,
    "00:59"
  );
  assert.equal(
    zonedTime(new Date("2026-03-29T01:00:00Z"), "Europe/London").time,
    "02:00"
  );
  assert.equal(
    zonedTime(new Date("2026-03-08T06:59:59Z"), "America/New_York").time,
    "01:59"
  );
  assert.equal(
    zonedTime(new Date("2026-03-08T07:00:00Z"), "America/New_York").time,
    "03:00"
  );
  assert.equal(
    zonedTime(new Date("2026-04-04T15:59:59Z"), "Australia/Sydney").time,
    "02:59"
  );
  assert.equal(
    zonedTime(new Date("2026-04-04T16:00:00Z"), "Australia/Sydney").time,
    "02:00"
  );
});
test("midnight and the date line never produce 24:00 or the wrong date", () => {
  const tokyo = zonedTime(new Date("2026-10-14T15:00:00Z"), "Asia/Tokyo");
  assert.equal(tokyo.time, "00:00");
  assert.equal(tokyo.day, 15);
  const ny = zonedTime(new Date("2026-10-14T01:00:00Z"), "America/New_York");
  assert.equal(ny.time, "21:00");
  assert.equal(ny.day, 13);
});
test("second hand overshoots, rebounds and settles to the correct tick", () => {
  assert.equal(secondAngle(10000), 54);
  assert.equal(secondAngle(10045), 61.25);
  assert.equal(secondAngle(10120), 59.45);
  assert.equal(secondAngle(10215), 60.2);
  assert.equal(secondAngle(10340), 60);
  assert.equal(secondAngle(10999), 60);
  assert.equal(secondAngle(60000), -6); // equivalent to 354 degrees at rollover
  assert.equal(secondAngle(60340), 0);
  assert.equal(secondAngle(10045, true), 60);
});
test("warp direction remains correct across midnight and interrupted rotations", () => {
  assert.equal(warpDestination(1380, 480, 1), 1920);
  assert.equal(warpDestination(480, 1380, -1), -60);
  assert.equal(warpDestination(3000, 540, 1), 3420);
  assert.equal(easeWarp(0), 0);
  assert.equal(easeWarp(0.5), 0.5);
  assert.equal(easeWarp(1), 1);
});
