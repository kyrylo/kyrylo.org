import { CITIES } from "./cities.js?v=2";
import { zonedTime } from "./warp-clock.js";

// One verified live view per available UTC offset, ordered west to east.
// Locations without a supported camera are deliberately absent from the route.
export function worldRoute(date, preferredId) {
  const offsets = new Map();
  for (const city of CITIES) {
    if (!city.videoId && !city.cameraAlias) continue;
    const offset = zonedTime(date, city.zone).offset;
    const previous = offsets.get(offset);
    if (
      !previous ||
      city.id === preferredId
    )
      offsets.set(offset, city);
  }
  return [...offsets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, city]) => city);
}

export function nearestStop(route, date, zone) {
  const exact = route.findIndex((city) => city.zone === zone);
  if (exact >= 0) return exact;
  const offset = zonedTime(date, zone).offset;
  const same = route.findIndex(
    (city) => zonedTime(date, city.zone).offset === offset
  );
  if (same >= 0) return same;
  return route.reduce((nearest, city, index) =>
    Math.abs(zonedTime(date, city.zone).offset - offset) <
    Math.abs(zonedTime(date, route[nearest].zone).offset - offset)
      ? index : nearest, 0);
}
