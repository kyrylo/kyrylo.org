import { worldRoute, nearestStop } from "./world-route.js?v=2";
import {
  zonedTime,
  secondAngle,
  warpDestination,
  easeWarp,
} from "./warp-clock.js";
import { createLiveCamera } from "./live-camera.js?v=4";
import { updateAtmosphere } from "./atmosphere.js";
const $ = (id) => document.getElementById(id);
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const portal = $("clock-portal"),
  visual = $("clock-visual");
const camera = createLiveCamera({
  mount: $("camera-mount"),
  panel: $("camera-panel"),
  status: $("camera-status"),
  message: $("camera-message"),
  overlay: $("camera-overlay"),
  play: $("camera-play"),
  retry: $("camera-retry"),
  next: $("camera-next"),
  onSource: showCameraSource,
});
const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
let cities = worldRoute(new Date());
let selected = nearestStop(cities, new Date(), localZone);
let frame,
  wakeTimer,
  localMinutes = 0,
  warp,
  displayedMinutes,
  lastSecond = -1,
  lastMinute = -1,
  zoomAnimation;
const ringAnimations = [];
const routeButtons = [];
const ns = "http://www.w3.org/2000/svg";
function svgNode(tag, attrs, text) {
  const node = document.createElementNS(ns, tag);
  for (const [key, value] of Object.entries(attrs))
    node.setAttribute(key, value);
  if (text !== undefined) node.textContent = text;
  return node;
}
function drawDial() {
  const point = (angle, radius) => [
    626 + Math.sin(angle) * radius,
    608 - Math.cos(angle) * radius,
  ];
  for (let tick = 0; tick < 60; tick++) {
    const angle = (tick / 60) * Math.PI * 2;
    const [x1, y1] = point(angle, tick % 5 === 0 ? 404 : 425),
      [x2, y2] = point(angle, 440);
    $("live-markings").append(
      svgNode("line", {
        x1,
        y1,
        x2,
        y2,
        class: tick % 5 === 0 ? "major-mark" : "minor-mark",
      })
    );
  }
  for (let hour = 1; hour <= 12; hour++) {
    const [x, y] = point((hour / 12) * Math.PI * 2, 354);
    $("live-markings").append(
      svgNode(
        "text",
        {
          x,
          y,
          class: "hour-number",
          "dominant-baseline": "central",
          "text-anchor": "middle",
        },
        hour
      )
    );
  }
}
function updateLabels(date, time = zonedTime(date, cities[selected].zone)) {
  const city = cities[selected];
  updateAtmosphere(city.id, time);
  if ($("current-time").textContent !== time.time) $("current-time").textContent = time.time;
  $("current-time").dateTime = `${String(time.hour).padStart(2, "0")}:${String(
    time.minute
  ).padStart(2, "0")}:${time.seconds}`;
  $("current-seconds").textContent = `:${time.seconds}`;
  if ($("current-date").textContent !== time.date) $("current-date").textContent = time.date;
  if ($("current-zone").textContent !== time.offsetLabel) $("current-zone").textContent = time.offsetLabel;
  portal.setAttribute(
    "aria-valuetext",
    `${city.name}, ${time.time}, ${time.offsetLabel}`
  );
  visual.setAttribute("aria-label", `${time.time} in ${city.name}`);
}
function centerStop(instant = false) {
  const button = routeButtons[selected];
  const route = $("city-route");
  if (!button) return;
  route.scrollTo({
    left:
      button.offsetLeft -
      route.offsetLeft -
      (route.clientWidth - button.offsetWidth) / 2,
    behavior: instant || reducedMotion.matches ? "instant" : "smooth",
  });
}
function refreshRoute(date, initial = false) {
  const currentId = cities[selected].id;
  const next = worldRoute(date, currentId);
  const changed =
    next.map((city) => city.id).join() !== cities.map((city) => city.id).join();
  if (initial || changed) {
    cities = next;
    selected = cities.findIndex((city) => city.id === currentId);
    $("city-route").replaceChildren();
    routeButtons.length = 0;
    cities.forEach((city, i) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "city-stop";
      button.dataset.city = city.id;
      button.setAttribute("aria-label", `Travel to ${city.name}`);
      button.setAttribute("aria-current", String(i === selected));
      const name = document.createElement("span");
      name.textContent = city.name;
      const time = document.createElement("time");
      time.setAttribute("aria-hidden", "true");
      button.append(name, time);
      button.addEventListener("click", () => choose(i));
      $("city-route").append(button);
      routeButtons.push(button);
    });
    portal.setAttribute("aria-valuemax", String(cities.length));
    portal.setAttribute("aria-valuenow", String(selected + 1));
    centerStop(true);
  }
  cities.forEach((city, i) => {
    const time = zonedTime(date, city.zone);
    routeButtons[i].querySelector("time").textContent = time.time;
    routeButtons[i].title = `${city.name} · ${time.offsetLabel}`;
  });
}
const hands = [$("hour-hand"), $("minute-hand"), $("second-hand")];
const handAngles = [];
function rotateHand(index, angle) {
  if (handAngles[index] === angle) return;
  handAngles[index] = angle;
  hands[index].style.transform = `rotate(${angle}deg)`;
}
function paint() {
  const now = Date.now(), date = new Date(now), second = Math.floor(now / 1000);
  const newSecond = second !== lastSecond;
  if (Math.floor(now / 60000) !== lastMinute) {
    refreshRoute(date);
    lastMinute = Math.floor(now / 60000);
  }
  if (newSecond) {
    const time = zonedTime(date, cities[selected].zone);
    localMinutes = time.hour * 60 + time.minute + time.second / 60;
    updateLabels(date, time);
    lastSecond = second;
  }
  let minutes = localMinutes + (now % 1000) / 60000;
  const wasWarping = Boolean(warp);
  if (warp) {
    const t = Math.min(1, (performance.now() - warp.started) / 1100);
    if (t === 1 || reducedMotion.matches) {
      warp = null;
      portal.dataset.warping = "false";
    } else minutes = warp.from + (warp.to - warp.from) * easeWarp(t);
  }
  displayedMinutes = minutes;
  if (newSecond || wasWarping) {
    rotateHand(0, minutes / 2);
    rotateHand(1, minutes * 6);
  }
  rotateHand(2, secondAngle(now, reducedMotion.matches));
  // The mechanical rebound needs frames for 340ms. Between ticks, nothing
  // changes visually: sleep until the next second instead of repainting.
  const phase = now % 1000;
  if (warp || (!reducedMotion.matches && phase < 340)) {
    frame = requestAnimationFrame(paint);
  } else {
    wakeTimer = setTimeout(() => { frame = requestAnimationFrame(paint); }, 1000 - phase);
  }
}
function zoom(direction) {
  zoomAnimation?.cancel();
  for (const animation of ringAnimations.splice(0)) animation.cancel();
  if (reducedMotion.matches) return;
  zoomAnimation = visual.animate(
    [
      { transform: "scale(1)" },
      { transform: `scale(${direction > 0 ? 1.19 : 0.82})`, offset: 0.43 },
      { transform: `scale(${direction > 0 ? 0.97 : 1.03})`, offset: 0.8 },
      { transform: "scale(1)" },
    ],
    { duration: 1100, easing: "cubic-bezier(.22,.61,.36,1)" }
  );
  portal.querySelectorAll(".warp-rings i").forEach((ring, i) =>
    ringAnimations.push(
      ring.animate(
        [
          { transform: `scale(${direction > 0 ? 0.92 : 1.3})`, opacity: 0 },
          { opacity: 0.35, offset: 0.3 },
          { transform: `scale(${direction > 0 ? 1.35 : 0.85})`, opacity: 0 },
        ],
        { duration: 1000, delay: i * 130, easing: "ease-out" }
      )
    )
  );
}
function showCameraSource(source) {
  $("camera-place").textContent = source.place;
  $("camera-source").textContent = `${source.provider} ↗`;
  $("camera-source").href = source.source;
}
function choose(
  index,
  direction = Math.sign(index - selected) || 1,
  initial = false
) {
  index = (index + cities.length) % cities.length;
  if (!initial && index === selected) return;
  const next = cities[index],
    date = new Date();
  if (!initial) zoom(direction);
  if (!initial && !reducedMotion.matches) {
    const from =
      displayedMinutes ?? zonedTime(date, cities[selected].zone).minutes;
    warp = {
      from,
      to: warpDestination(from, zonedTime(date, next.zone).minutes, direction),
      started: performance.now(),
    };
    portal.dataset.warping = "true";
  } else {
    warp = null;
    portal.dataset.warping = "false";
  }
  selected = index;
  document.documentElement.dataset.city = next.id;
  $("clock-city").textContent = next.name;
  $("camera-city").textContent = next.name;
  $("camera-country").textContent = next.country;
  $("camera-flag").textContent = String.fromCodePoint(
    ...[...(next.countryCode || "")].map(letter => 0x1f1e6 + letter.charCodeAt(0) - 65)
  );
  showCameraSource(next);
  portal.setAttribute("aria-valuenow", String(index + 1));
  routeButtons.forEach((button, i) =>
    button.setAttribute("aria-current", String(i === index))
  );
  updateLabels(date);
  centerStop(initial);
  if (!initial)
    $("travel-status").textContent = `${next.name}. ${
      zonedTime(date, next.zone).time
    } local time.`;
  camera.load(next);
  if (!initial) restart();
}
function travel(direction) {
  choose(selected + direction, direction);
}
$("camera-next").addEventListener("click", () => travel(1));
window.addEventListener("resize", () => centerStop(true));
$("zoom-out").addEventListener("click", () => travel(-1));
$("zoom-in").addEventListener("click", () => travel(1));
portal.addEventListener("keydown", (event) => {
  const direction = {
    ArrowRight: 1,
    ArrowUp: 1,
    "+": 1,
    "=": 1,
    ArrowLeft: -1,
    ArrowDown: -1,
    "-": -1,
  }[event.key];
  if (direction) {
    event.preventDefault();
    travel(direction);
  } else if (event.key === "Home" || event.key === "End") {
    event.preventDefault();
    choose(event.key === "Home" ? 0 : cities.length - 1);
  }
});
let wheelDistance = 0,
  wheelUsed = false,
  wheelTimer;
portal.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => {
      wheelDistance = 0;
      wheelUsed = false;
    }, 200);
    if (wheelUsed) return;
    wheelDistance -=
      event.deltaY *
      (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 200 : 1) *
      (event.ctrlKey ? 3 : 1);
    if (Math.abs(wheelDistance) >= 45) {
      wheelUsed = true;
      travel(Math.sign(wheelDistance));
    }
  },
  { passive: false }
);
const pointers = new Map();
let pinchDistance = 0,
  pinchUsed = false;
function distance() {
  const [a, b] = [...pointers.values()];
  return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
}
portal.addEventListener("pointerdown", (event) => {
  if (event.pointerType !== "touch") return;
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  portal.setPointerCapture(event.pointerId);
  if (pointers.size === 2) {
    pinchDistance = distance();
    pinchUsed = false;
  }
});
portal.addEventListener("pointermove", (event) => {
  if (!pointers.has(event.pointerId)) return;
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (pointers.size === 2 && !pinchUsed && pinchDistance > 0) {
    const ratio = distance() / pinchDistance;
    if (ratio > 1.15 || ratio < 0.85) {
      pinchUsed = true;
      travel(ratio > 1 ? 1 : -1);
    }
  }
});
for (const eventName of ["pointerup", "pointercancel", "lostpointercapture"])
  portal.addEventListener(eventName, (event) => {
    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinchDistance = 0;
  });
function restart() {
  cancelAnimationFrame(frame);
  clearTimeout(wakeTimer);
  lastSecond = -1;
  if (!document.hidden) paint();
}
document.addEventListener("visibilitychange", restart);
window.addEventListener("pageshow", restart);
reducedMotion.addEventListener("change", () => {
  warp = null;
  portal.dataset.warping = "false";
  zoomAnimation?.cancel();
  for (const a of ringAnimations.splice(0)) a.cancel();
  restart();
});
visual
  .querySelector("img")
  .addEventListener("error", () => visual.classList.add("image-unavailable"));
if (
  visual.querySelector("img").complete &&
  !visual.querySelector("img").naturalWidth
)
  visual.classList.add("image-unavailable");
drawDial();
refreshRoute(new Date(), true);
choose(selected, 1, true);
restart();
