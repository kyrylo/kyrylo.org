// Location palettes and slowly morphing compositions: sky, landscape, reflected light.
// These are art direction, not a weather or sunrise forecast.
const palettes = {
  "new-york": [215, 205, 42],
  london: [218, 145, 38],
  venice: [183, 158, 35],
  tokyo: [232, 218, 320],
  sydney: [205, 173, 40],
  honolulu: [185, 152, 38],
  anchorage: [210, 164, 235],
  "los-angeles": [208, 32, 18],
  denver: [214, 150, 32],
  chicago: [212, 199, 38],
  rio: [176, 138, 28],
  "st-johns": [202, 173, 22],
  reykjavik: [225, 183, 268],
  "cape-town": [200, 157, 35],
  jerusalem: [203, 42, 26],
  bishkek: [210, 148, 40],
  bangkok: [198, 142, 32],
  taipei: [216, 157, 38],
  adelaide: [207, 38, 25],
  brisbane: [192, 149, 42],
  auckland: [209, 158, 34],
  "mount-abu": [215, 35, 24],
  "santa-maria": [188, 42, 30],
  "malolo-lailai": [182, 150, 35],
  nuuk: [218, 184, 252],
};
// Each family has a different flow: city lights, coastal arcs, aurora, warm dunes.
const coast = new Set(["venice", "sydney", "honolulu", "los-angeles", "rio", "st-johns", "cape-town", "brisbane", "auckland", "santa-maria", "malolo-lailai"]);
const alpine = new Set(["anchorage", "denver", "reykjavik", "bishkek", "nuuk"]);
const warm = new Set(["jerusalem", "adelaide", "mount-abu"]);
const forms = {
  city: [[-30,-24,-25,.8,1.7], [22,35,20,1.5,.65], [38,-18,-30,.8,1.4], [-36,0,-38,1.2,1.7], [36,18,-38,.8,1.3]],
  coast: [[-28,-27,0,1.5,.8], [-5,46,-8,1.9,.65], [40,-17,12,1,.7], [3,37,-12,1.8,.7], [-12,55,-15,2,.85]],
  alpine: [[-30,0,-35,.7,1.5], [22,-24,-40,.8,1.8], [36,32,-32,1,.7], [-22,-10,-40,1.3,.8], [24,6,-35,1.6,.7]],
  warm: [[-35,-25,20,1.2,1], [18,35,25,1.6,.8], [38,-15,35,1,.9], [24,28,27,1.7,.75], [-20,42,30,1.5,.8]],
};
const atmosphere = document.getElementById("place-atmosphere");
const motion = matchMedia("(prefers-reduced-motion: reduce)");
const surface = document.createElement("canvas");
surface.className = "atmosphere-canvas";
atmosphere.replaceChildren(surface);
const context = surface.getContext("2d", { alpha: false });
const SIZE = 384;
const textureCache = new Map();
const started = performance.now();
let width, height, scale, job, lastFrame = -Infinity;
let lastMoment, lastCity, fromImages, toImages, baseFrom, baseTo;
let colorStarted = 0, shapeStarted = 0, shapeFrom, shapeTo;
const mixedImages = Array.from({ length: 4 }, canvas);
function canvas() {
  const result = document.createElement("canvas");
  result.width = result.height = SIZE;
  return result;
}
function ease(t) { return 1 - (1 - Math.min(1, Math.max(0, t))) ** 3; }
function mix(a, b, t) { return a + (b - a) * t; }
function colorProgress(now) { return motion.matches ? 1 : ease((now - colorStarted) / 2800); }
function shapeAt(now) {
  const t = motion.matches ? 1 : ease((now - shapeStarted) / 3400);
  return shapeTo.map((shape, index) => shape.map((value, coordinate) => mix(shapeFrom[index][coordinate], value, t)));
}
function blendedImages(t) {
  if (t === 1 || fromImages === toImages) return toImages;
  mixedImages.forEach((image, index) => {
    const ctx = image.getContext("2d");
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1 - t;
    ctx.drawImage(fromImages[index], 0, 0);
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = t;
    ctx.drawImage(toImages[index], 0, 0);
  });
  return mixedImages;
}
function snapshot(images) {
  return images.map(image => {
    const copy = canvas(); copy.getContext("2d").drawImage(image, 0, 0); return copy;
  });
}
function rgb(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  return [0, 8, 4].map(n => {
    const k = (n + h / 30) % 12;
    return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)));
  });
}
function paint(now) {
  job = null;
  if (document.hidden || !toImages) return;
  // A single capped-resolution surface avoids enormous translucent GPU layers
  // on Retina displays. Slow ambient movement only needs 30 frames per second.
  if (motion.matches || now - lastFrame >= 1000 / 30 - 1) {
    lastFrame = now;
    const t = colorProgress(now), images = blendedImages(t), shapes = shapeAt(now);
    const base = baseTo.map((value, index) => Math.round(mix(baseFrom[index], value, t)));
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.globalAlpha = 1;
    context.fillStyle = `rgb(${base.join(" ")})`;
    context.fillRect(0, 0, surface.width, surface.height);
    const size = .8 * Math.max(width, height);
    shapes.forEach(([x, y, rotation, sx, sy], index) => {
      const duration = index < 3 ? 32000 : 43000;
      const delay = [0, 13000, 23000, 0, 18000][index];
      const phase = ((now - started + delay) / duration) % 2;
      let drift = motion.matches ? 0 : (1 - Math.cos(phase * Math.PI)) / 2;
      if (index === 4 && !motion.matches) drift = 1 - drift;
      context.setTransform(scale, 0, 0, scale, 0, 0);
      context.translate(width * (.5 + x / 100), height * (.5 + y / 100));
      context.rotate(rotation * Math.PI / 180);
      context.scale(sx, sy);
      context.translate(size * mix(-.02, .03, drift), size * mix(-.02, .03, drift));
      context.rotate(mix(-4, 5, drift) * Math.PI / 180);
      const growth = mix(1, 1.08, drift);
      context.scale(growth, growth);
      context.globalAlpha = index < 3 ? .7 : .65;
      context.drawImage(images[Math.min(index, 3)], -size / 2, -size / 2, size, size);
    });
  }
  if (!motion.matches) job = requestAnimationFrame(paint);
}
function wake() {
  if (document.hidden) return;
  lastFrame = -Infinity;
  if (job == null) job = requestAnimationFrame(paint);
}
function resize() {
  width = innerWidth; height = innerHeight;
  scale = Math.min(1, 960 / Math.max(width, height));
  surface.width = Math.round(width * scale);
  surface.height = Math.round(height * scale);
  wake();
}
window.addEventListener("resize", resize);
resize();
atmosphere.dataset.paused = String(document.hidden);
document.addEventListener("visibilitychange", () => {
  atmosphere.dataset.paused = String(document.hidden);
  if (document.hidden) { cancelAnimationFrame(job); job = null; }
  else wake();
});
motion.addEventListener("change", () => {
  cancelAnimationFrame(job); job = null; wake();
});
// Fine grain remains a static, tiny tile over the smooth color surface.
const grain = document.createElement("canvas");
grain.width = grain.height = 96;
const grainContext = grain.getContext("2d"), pixels = grainContext.createImageData(96, 96);
let seed = 17;
for (let i = 0; i < pixels.data.length; i += 4) {
  seed = (seed * 16807) % 2147483647;
  pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = seed % 256;
  pixels.data[i + 3] = 255;
}
grainContext.putImageData(pixels, 0, 0);
atmosphere.style.setProperty("--atmosphere-grain", `url("${grain.toDataURL()}")`);
export function updateAtmosphere(city, localTime) {
  const moment = `${city}:${localTime.hour}:${localTime.minute}`;
  if (moment === lastMoment) return;
  lastMoment = moment;
  const now = performance.now();
  const [sky, land, glow] = palettes[city] || [210, 160, 40];
  const daylight = (1 + Math.cos((localTime.hour + localTime.minute / 60 - 13) * Math.PI / 12)) / 2;
  const colors = [
    `hsl(${sky} 63% ${(35 + 8 * daylight).toFixed(2)}%)`,
    `hsl(${land} 55% ${(31 + 8 * daylight).toFixed(2)}%)`,
    `hsl(${glow} 68% ${(39 + 8 * daylight).toFixed(2)}%)`,
  ];
  const progress = colorProgress(now);
  fromImages = toImages ? snapshot(blendedImages(progress)) : textures(colors);
  baseFrom = baseTo ? baseTo.map((value, index) => mix(baseFrom[index], value, progress)) : rgb(sky, 28, 9 + 3 * daylight);
  toImages = textures(colors);
  baseTo = rgb(sky, 28, 9 + 3 * daylight);
  colorStarted = now;
  if (lastCity !== city) {
    lastCity = city;
    const form = coast.has(city) ? "coast" : alpine.has(city) ? "alpine" : warm.has(city) ? "warm" : "city";
    atmosphere.dataset.pattern = form;
    const seed = [...city].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const variation = (seed % 19) - 9;
    const next = forms[form].map(([x, y, angle, sx, sy]) => [x + variation * .7, y + variation * .4, angle + variation, sx, sy]);
    shapeFrom = shapeTo ? shapeAt(now) : next;
    shapeTo = next;
    shapeStarted = now;
  }
  wake();
}

function textures(colors) {
  const blur = Math.max(3, Math.min(12, 18 * SIZE / (Math.max(innerWidth, innerHeight) * .8)));
  const key = colors.join() + Math.round(blur);
  if (textureCache.has(key)) {
    const cached = textureCache.get(key);
    textureCache.delete(key); textureCache.set(key, cached);
    return cached;
  }
  const radius = SIZE / Math.SQRT2;
  const result = [0, 1, 2, 3].map(index => {
    const image = canvas(), context = image.getContext("2d");
    if (index < 3) {
      const gradient = context.createRadialGradient(SIZE/2, SIZE/2, 0, SIZE/2, SIZE/2, radius * [.67,.65,.63][index]);
      gradient.addColorStop(0, colors[index]); gradient.addColorStop(1, "transparent");
      context.fillStyle = gradient; context.fillRect(0, 0, SIZE, SIZE);
      return image;
    }
    const gradient = context.createConicGradient(-65 * Math.PI / 180, SIZE/2, SIZE/2);
    for (const [at, color] of [[0,"transparent"],[.12,"transparent"],[.3,colors[0]],[.48,colors[2]],[.64,colors[1]],[.85,"transparent"],[1,"transparent"]]) gradient.addColorStop(at, color);
    context.fillStyle = gradient; context.fillRect(0, 0, SIZE, SIZE);
    const mask = context.createRadialGradient(SIZE/2, SIZE/2, 0, SIZE/2, SIZE/2, radius);
    for (const [at, color] of [[0,"transparent"],[.43,"transparent"],[.47,"black"],[.5,"black"],[.55,"transparent"],[1,"transparent"]]) mask.addColorStop(at, color);
    context.globalCompositeOperation = "destination-in";
    context.fillStyle = mask; context.fillRect(0, 0, SIZE, SIZE);
    const softened = canvas(), soft = softened.getContext("2d");
    soft.filter = `blur(${blur}px)`;
    soft.drawImage(image, 0, 0);
    return softened;
  });
  // Both ribbons share one texture. Keep memory bounded when browsing all cities.
  textureCache.set(key, result);
  if (textureCache.size > 6) textureCache.delete(textureCache.keys().next().value);
  return result;
}
