export const BUG_TYPES = {
  Error: { label: "error", exception: "error", hits: 1, speed: 1, type: "Error" },
  ToughError: { label: "{error}", exception: "error", hits: 2, speed: 1, type: "ToughError" },
  FastError: { label: "err≈", exception: "err≈", hits: 1, speed: 2, type: "FastError" },
  Heisenbug: { label: "Heisenbug", exception: "Heis3nbug", hits: 3, speed: 1, type: "Heisenbug" },
  BlinkBug: { label: "null", exception: "null", hits: 1, speed: 1.5, type: "BlinkBug" },
  ILOVEYOU: { label: "ILOVEYOU", exception: "ILOVEYOU", hits: 3, speed: 0.8, type: "ILOVEYOU" },
  OffByOneUp: { label: "i++", exception: "i++", hits: 1, speed: 1, type: "OffByOneUp", direction: "up" },
  OffByOneDown: { label: "i--", exception: "i--", hits: 1, speed: 1, type: "OffByOneDown", direction: "down" },
  Forkbomb: { label: "fork()", exception: "fork", hits: 2, speed: 0.1, type: "Forkbomb" },
};

export function createBug(exception, row, hitsRemaining = 1, speed = 1, type = "Error", effectiveSpawnTime = null) {
  const spawnTime = Date.now();
  const effectiveTime = effectiveSpawnTime !== null ? effectiveSpawnTime : spawnTime;
  let fullText;
  if (type === "Forkbomb") {
    fullText = `fork(${hitsRemaining})`;
  } else if (type === "ToughError" && hitsRemaining === 2) {
    fullText = `{${exception}}`;
  } else {
    fullText = exception;
  }
  const bug = {
    exception,
    row,
    position: 38,
    visibleChars: 1,
    targeted: false,
    fixing: false,
    fixStartTime: 0,
    removeTime: null,
    spawnTime: spawnTime,
    effectiveSpawnTime: effectiveTime,
    lastBlinkPosition: null,
    hitsRemaining,
    fullText,
    isBlinking: false,
    blinkEndTime: 0,
    targetingCount: 0,
    speed: speed,
    type: type,
    label: BUG_TYPES[type].label,
  };
  if (type.startsWith("OffByOne")) {
    bug.direction = type === "OffByOneUp" ? "up" : "down";
    bug.lastLaneSwitchTime = spawnTime;
    bug.laneSwitchInterval = 2000; // 2 seconds
  }
  if (type === "ILOVEYOU") {
    bug.lastSpawnTime = spawnTime;
    bug.spawnInterval = 5000; // Spawn FastError every 5 seconds
  }
  return bug;
}

export function isLaneOccupied(lane, now, activeBugs) {
  const bugsInLane = activeBugs.filter((b) => b.row === lane && !b.fixing);
  for (let bug of bugsInLane) {
    const delta = (now - bug.effectiveSpawnTime) * bug.speed;
    const moves = Math.floor(delta / 500);
    const position = 38 - moves;
    if (position > 38 - bug.fullText.length) {
      return true;
    }
  }
  return false;
}
