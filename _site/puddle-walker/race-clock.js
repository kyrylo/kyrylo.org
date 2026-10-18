// Use elapsed real time, not capped physics frames: a slow frame must not improve a race.
export function createRaceClock(now = () => performance.now()) {
  let banked = 0, started = null, splits = [];
  const elapsed = () => banked + (started === null ? 0 : Math.max(0, now() - started));
  return {
    elapsed,
    reset() { banked = 0; started = null; splits = []; },
    start() { banked = 0; started = now(); splits = []; },
    split(index) {
      if (!Number.isInteger(index) || index < 0 || index > splits.length) return null;
      if (splits[index]) return {...splits[index]};
      const total = elapsed(), previous = splits.at(-1)?.elapsed || 0;
      const split = {elapsed:total, duration:Math.max(0,total-previous)};
      splits.push(split); return {...split};
    },
    splits: () => splits.map(split => ({...split})),
    finish() { banked = elapsed(); started = null; return banked; },
  };
}
export function formatRaceTime(milliseconds) {
  const hundredths = Math.floor(Math.max(0, Number.isFinite(milliseconds) ? milliseconds : 0) / 10);
  return `${Math.floor(hundredths / 6000)}:${String(Math.floor(hundredths / 100) % 60).padStart(2,'0')}.${String(hundredths % 100).padStart(2,'0')}`;
}
export function readRaceBests(value) {
  try {
    const parsed = JSON.parse(value), result = {};
    for (const shoe of ['leather','canvas','knit']) {
      if (Number.isFinite(parsed?.[shoe]) && parsed[shoe] > 0) result[shoe] = parsed[shoe];
    }
    return result;
  } catch { return {}; }
}
