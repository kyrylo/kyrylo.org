import { CITIES } from "./cities.js";
const params = new URLSearchParams(location.search);
const city = CITIES.find((candidate) => candidate.id === params.get("city"));
const generation = Number(params.get("generation"));
let lastTime = -1, stalledSince = performance.now(), started = false;
function report(state) {
  parent.postMessage({ type: "elsewhere-camera", generation, state }, location.origin);
}
function script(url) {
  return new Promise((resolve, reject) => {
    const element = document.createElement("script");
    element.src = url;
    element.onload = resolve;
    element.onerror = reject;
    document.head.append(element);
  });
}
async function play() {
  const video = document.querySelector("video");
  if (!video) return;
  video.muted = true;
  video.playsInline = true;
  try { await video.play(); }
  catch (error) { if (error.name === "NotAllowedError") report("blocked"); }
}
document.addEventListener("playing", (event) => {
  if (event.target.tagName !== "VIDEO") return;
  started = true;
  stalledSince = performance.now();
  report("playing");
}, true);
for (const name of ["waiting", "stalled"]) {
  document.addEventListener(name, (event) => {
    if (event.target.tagName === "VIDEO") report("waiting");
  }, true);
}
for (const name of ["error", "ended"]) {
  document.addEventListener(name, (event) => {
    if (event.target.tagName === "VIDEO") report("error");
  }, true);
}
// Let the SDK finish its own startup before handling browser autoplay policy.
document.addEventListener("canplay", (event) => {
  if (event.target.tagName !== "VIDEO") return;
  setTimeout(() => {
    if (!started && !document.hidden) play();
  }, 500);
}, true);
window.addEventListener("message", (event) => {
  if (event.source !== parent || event.origin !== location.origin) return;
  if (event.data?.type === "elsewhere-play") play();
  if (event.data?.type === "elsewhere-pause") document.querySelector("video")?.pause();
});
try {
  if (!city?.cameraAlias) throw new Error("Unknown camera");
  await script("https://player.ipcamlive.com/player/jquery-3.min.js");
  await script("https://player.ipcamlive.com/player/ipcamliveplayer.min.js");
  // Official public embed SDK owns stream discovery, access and playback.
  window.ipcamliveplayer.embed("camera", city.cameraAlias, { autoplay: 1, mute: 1 });
  window.addEventListener("resize", () => window.ipcamliveplayer.resize());
  setInterval(() => {
    const video = document.querySelector("video");
    if (!started || !video || document.hidden) return;
    if (video.currentTime !== lastTime) {
      lastTime = video.currentTime; stalledSince = performance.now();
    } else if (performance.now() - stalledSince > 30000) report("error");
  }, 5000);
} catch { report("error"); }
