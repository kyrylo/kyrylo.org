// Use .js for the existing nginx JavaScript MIME configuration.
export const DAY = 1440;
export const CATEGORIES = [
  { id: "sleep", label: "Sleep" },
  { id: "work", label: "Work and study" },
  { id: "care", label: "Housework and caregiving" },
  { id: "travel", label: "Travel" },
  { id: "personal", label: "Eating and personal care" },
  { id: "leisure", label: "Leisure and socializing" },
  { id: "other", label: "Other" },
];
export const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
export function formatTime(minute) {
  const time = ((Math.floor(minute) % DAY) + DAY) % DAY;
  return `${String(Math.floor(time / 60)).padStart(2, "0")}:${String(
    time % 60
  ).padStart(2, "0")}`;
}
export function durationLabel(minutes) {
  return (
    [
      minutes >= 60 ? `${Math.floor(minutes / 60)}h` : "",
      minutes % 60 ? `${minutes % 60}m` : "",
    ]
      .filter(Boolean)
      .join(" ") || "0m"
  );
}
// Intervals stay in survey order: elapsed minutes since 04:00, [start, end).
export function activityAt(diary, clockMinute) {
  const offset = (((Math.floor(clockMinute) - 240) % DAY) + DAY) % DAY;
  return diary.activities.findIndex(
    ([start, duration]) => offset >= start && offset < start + duration
  );
}
export function matchesFilters(diary, filters) {
  const weekend = diary.day === 1 || diary.day === 7;
  return (
    (filters.day === "all" ||
      filters.day === (weekend ? "weekend" : "weekday")) &&
    (filters.age === "all" || filters.age === diary.age) &&
    (filters.children === "all" ||
      filters.children ===
        (diary.children === null ? "unknown" : diary.children ? "yes" : "no"))
  );
}
export function selectDiaries(
  pool,
  previous = [],
  limit = 24,
  random = Math.random
) {
  const previousIds = new Set(previous.map((d) => d.id));
  const shuffle = (items) => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };
  // Prefer unseen diaries, then fill from the last wall for small pools.
  return [
    ...shuffle(pool.filter((d) => !previousIds.has(d.id))),
    ...shuffle(pool.filter((d) => previousIds.has(d.id))),
  ].slice(0, limit);
}
export function clockPoint(minute, radius = 65) {
  const angle = (minute / DAY) * 2 * Math.PI - Math.PI / 2;
  return [90 + Math.cos(angle) * radius, 90 + Math.sin(angle) * radius];
}
export function arcPath(start, duration) {
  // Two arcs are needed for a complete circle; this also handles midnight.
  const [x1, y1] = clockPoint(start);
  const [xm, ym] = clockPoint(start + duration / 2);
  const [x2, y2] = clockPoint(start + duration);
  return `M${x1},${y1} A65,65 0 0 1 ${xm},${ym} A65,65 0 0 1 ${x2},${y2}`;
}
export function totals(diary, codes) {
  const result = Object.fromEntries(CATEGORIES.map((c) => [c.id, 0]));
  for (const [, duration, code] of diary.activities)
    result[codes[code].category] += duration;
  return result;
}
export function validateCollection(data) {
  if (
    data.schema !== 1 ||
    !["synthetic", "atus", "illustrative"].includes(data.kind) ||
    !Array.isArray(data.diaries) ||
    !data.codes
  )
    throw new Error("Unrecognized diary collection.");
  if (
    data.kind === "atus" &&
    (data.year !== 2025 || !data.provenance?.files?.length)
  )
    throw new Error("Survey provenance is missing.");
  const ids = new Set();
  const ages = new Set([
    "15–24",
    "25–34",
    "35–44",
    "45–54",
    "55–64",
    "65+",
    "unknown",
  ]);
  if (data.kind === "illustrative") {
    for (const age of ["Under 1", "1–3", "4–7", "8–14"]) ages.add(age);
  }
  for (const diary of data.diaries) {
    if (
      typeof diary.id !== "string" ||
      ids.has(diary.id) ||
      !ages.has(diary.age) ||
      !Number.isInteger(diary.day) ||
      diary.day < 1 ||
      diary.day > 7 ||
      ![true, false, null].includes(diary.children) ||
      typeof diary.employment !== "string"
    )
      throw new Error("Invalid diary metadata.");
    if (diary.ageValue != null) {
      const age = diary.ageValue;
      const expected =
        age >= 65
          ? "65+"
          : AGE_GROUPS.find(
              (group) =>
                !group.child &&
                age >= Number(group.age.split("–")[0]) &&
                age <= Number(group.age.split("–")[1])
            )?.age;
      if (
        !Number.isInteger(age) ||
        age < 15 ||
        age > 85 ||
        (age > 80 && age < 85) ||
        expected !== diary.age
      )
        throw new Error("Invalid reported age.");
    }
    ids.add(diary.id);
    let end = 0;
    for (const [start, duration, code] of diary.activities) {
      if (
        !Number.isInteger(start) ||
        !Number.isInteger(duration) ||
        duration <= 0 ||
        start !== end ||
        !data.codes[code]?.label ||
        !CATEGORIES.some((c) => c.id === data.codes[code].category)
      )
        throw new Error(`Invalid activity in ${diary.id}.`);
      end += duration;
    }
    if (end !== DAY)
      throw new Error(`Diary ${diary.id} does not cover 24 hours.`);
  }
  return data;
}

export const AGE_GROUPS = [
  { age: "Under 1", title: "Babies", range: "Under 1 year", child: true },
  { age: "1–3", title: "Toddlers", range: "1–3 years", child: true },
  { age: "4–7", title: "Young children", range: "4–7 years", child: true },
  { age: "8–14", title: "Older children", range: "8–14 years", child: true },
  { age: "15–24", title: "15–24", range: "years old" },
  { age: "25–34", title: "25–34", range: "years old" },
  { age: "35–44", title: "35–44", range: "years old" },
  { age: "45–54", title: "45–54", range: "years old" },
  { age: "55–64", title: "55–64", range: "years old" },
  { age: "65+", title: "65+", range: "years old" },
];

// Include the lower units in each hand's angle, as a physical clock does.
export function handAngles(date) {
  const seconds = date.getSeconds() + date.getMilliseconds() / 1000;
  const minutes = date.getMinutes() + seconds / 60;
  const hours = (date.getHours() % 12) + minutes / 60;
  return { hour: hours * 30, minute: minutes * 6, second: seconds * 6 };
}

export function diaryDayForDate(date) {
  const day = new Date(date);
  if (day.getHours() < 4) day.setDate(day.getDate() - 1);
  return day.getDay() + 1;
}

export function examplesForAge(collection, age, diaryDay) {
  if (!collection) return [];
  const weekend = diaryDay === 1 || diaryDay === 7;
  const options = collection.diaries.filter(
    (diary) =>
      diary.age === age && (diary.day === 1 || diary.day === 7) === weekend
  );
  // One stable example per age and day type. No group aggregation or estimates.
  return options.sort((a, b) => a.id.localeCompare(b.id));
}

export function exampleForAge(collection, age, diaryDay) {
  return examplesForAge(collection, age, diaryDay)[0] || null;
}

// Continue into the next displayed diary at 04:00, skipping repeated codes.
export function nextActivity(diary, minute, nextDiary = diary) {
  const index = activityAt(diary, minute);
  const offset = (((Math.floor(minute) - 240) % DAY) + DAY) % DAY;
  const [start, duration, code] = diary.activities[index];
  let remaining = start + duration - offset;
  const future = [
    ...diary.activities.slice(index + 1),
    ...(nextDiary?.activities || []),
  ];
  for (const [, length, nextCode] of future) {
    if (nextCode !== code) return { code: nextCode, minutes: remaining };
    remaining += length;
  }
  return null;
}
