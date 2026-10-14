const formats = new Map();
const pad = (value) => String(value).padStart(2, "0");
export function zonedTime(date, zone) {
  if (!formats.has(zone))
    formats.set(zone, {
      parts: new Intl.DateTimeFormat("en-GB", {
        timeZone: zone,
        hourCycle: "h23",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      date: new Intl.DateTimeFormat("en-GB", {
        timeZone: zone,
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
    });
  const f = formats.get(zone);
  const p = Object.fromEntries(
    f.parts
      .formatToParts(date)
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, Number(p.value)])
  );
  const offset = Math.round(
    (Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) -
      Math.floor(date.getTime() / 1000) * 1000) /
      60000
  );
  return {
    ...p,
    offset,
    minutes:
      p.hour * 60 + p.minute + p.second / 60 + date.getMilliseconds() / 60000,
    time: `${pad(p.hour)}:${pad(p.minute)}`,
    seconds: pad(p.second),
    date: f.date.format(date),
    offsetLabel: `UTC${offset < 0 ? "−" : "+"}${pad(
      Math.floor(Math.abs(offset) / 60)
    )}:${pad(Math.abs(offset) % 60)}`,
  };
}
// A quick six-degree step, then a small, damped mechanical rebound.
// Sampling wall-clock phase prevents drift, even after the tab has been hidden.
export function secondAngle(epoch, reducedMotion = false) {
  const second = Math.floor(epoch / 1000) % 60;
  const phase = ((epoch % 1000) + 1000) % 1000;
  if (reducedMotion || phase >= 340) return second * 6;
  const frames = [
    [0, -6],
    [45, 1.25],
    [120, -0.55],
    [215, 0.2],
    [340, 0],
  ];
  for (let i = 1; i < frames.length; i++) {
    if (phase <= frames[i][0]) {
      const [t0, a0] = frames[i - 1],
        [t1, a1] = frames[i];
      const t = (phase - t0) / (t1 - t0);
      return second * 6 + a0 + (a1 - a0) * (1 - (1 - t) ** 2);
    }
  }
  return second * 6;
}
export function warpDestination(from, target, direction) {
  const current = ((from % 1440) + 1440) % 1440;
  let delta = target - current;
  if (direction > 0 && delta <= 0) delta += 1440;
  if (direction < 0 && delta >= 0) delta -= 1440;
  return from + delta;
}
export function easeWarp(t) {
  return t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
}
