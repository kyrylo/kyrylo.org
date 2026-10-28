import {
  AGE_GROUPS,
  activityAt,
  diaryDayForDate,
  durationLabel,
  examplesForAge,
  formatTime,
} from "./model.js";
import { activityLabel } from "./stories.js";

export function diaryDate(date) {
  const day = new Date(date);
  if (day.getHours() < 4) day.setDate(day.getDate() - 1);
  return day;
}
export function dayKey(date) {
  const day = diaryDate(date);
  return `${day.getFullYear()}-${day.getMonth() + 1}-${day.getDate()}`;
}
function ordinal(date) {
  const day = diaryDate(date);
  return Math.floor(
    Date.UTC(day.getFullYear(), day.getMonth(), day.getDate()) / 86400000
  );
}
function seed(text) {
  return [...text].reduce(
    (sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0,
    7
  );
}
export function dailyExample(collection, age, date, variation = 0) {
  const pool = examplesForAge(collection, age, diaryDayForDate(date));
  return pool[(ordinal(date) + seed(age) + variation) % pool.length] || null;
}
export function entryFor(diary, collection) {
  return {
    diary,
    collection,
    group: AGE_GROUPS.find((group) => group.age === diary.age),
  };
}
export function personName(entry) {
  return entry.group.child
    ? {
        "Under 1": "The baby",
        "1–3": "The toddler",
        "4–7": "The young child",
        "8–14": "The older child",
      }[entry.group.age]
    : `The person aged ${entry.diary.age}`;
}
export function reportedAge(diary) {
  if (diary.ageValue === 80) return "80–84";
  if (diary.ageValue === 85) return "85+";
  return String(diary.ageValue ?? diary.age);
}
export function pairPerson(entry, entries) {
  const age = reportedAge(entry.diary);
  if (entries.every((item) => reportedAge(item.diary) === age))
    return entries.indexOf(entry) === 0
      ? "The person on the left"
      : "The person on the right";
  return /^\d+$/.test(age) ? `The ${age}-year-old` : `The person aged ${age}`;
}
export function dayDetail(entry) {
  const minutes = (matches) =>
    entry.diary.activities.reduce(
      (sum, [, duration, code]) => sum + (matches(code) ? duration : 0),
      0
    );
  const facts = [
    [
      minutes((code) => code.startsWith("0501")),
      (value) => `Worked for ${value} that day.`,
    ],
    [
      minutes((code) => code.startsWith("03") || code.startsWith("04")),
      (value) => `Spent ${value} caring for or helping others.`,
    ],
    [
      minutes((code) => code.startsWith("06")),
      (value) => `Spent ${value} on education.`,
    ],
    [
      minutes((code) => code.startsWith("18")),
      (value) => `Spent ${value} on the move.`,
    ],
    [
      minutes((code) => code === "120312"),
      (value) => `Read for ${value} that day.`,
    ],
    [
      minutes((code) => code === "120303"),
      (value) => `Watched TV for ${value} that day.`,
    ],
  ].sort((a, b) => b[0] - a[0]);
  return facts[0][0]
    ? facts[0][1](durationLabel(facts[0][0]))
    : "A whole day, in their own rhythm.";
}
export function sameMinutes(a, b, codes) {
  let i = 0,
    j = 0,
    same = 0;
  while (i < a.activities.length && j < b.activities.length) {
    const [s1, d1, c1] = a.activities[i],
      [s2, d2, c2] = b.activities[j];
    const end = Math.min(s1 + d1, s2 + d2);
    if (codes[c1].category === codes[c2].category)
      same += Math.max(0, end - Math.max(s1, s2));
    if (s1 + d1 === end) i++;
    if (s2 + d2 === end) j++;
  }
  return same;
}
export const MATCH_CHOICES = [
  { id: "sleep", label: "Sleeping", icon: "sleep" },
  { id: "work", label: "Working", icon: "work" },
  { id: "eat", label: "Eating", icon: "personal" },
  { id: "care", label: "Caring", icon: "care" },
  { id: "relax", label: "Relaxing", icon: "leisure" },
  { id: "travel", label: "On the move", icon: "travel" },
];
export function matchesMoment(diary, collection, minute, choice) {
  const code = diary.activities[activityAt(diary, minute)][2];
  const category = collection.codes[code].category;
  return (
    {
      sleep: category === "sleep",
      work: code.startsWith("05"),
      eat: code.startsWith("11"),
      care: code.startsWith("03") || code.startsWith("04"),
      relax: category === "leisure",
      travel: category === "travel",
    }[choice] || false
  );
}
export function contrastPair(
  collection,
  age,
  date,
  variation = 0,
  first = null,
  choice = null
) {
  if (!collection) return [];
  const a = first || dailyExample(collection, age, date, variation);
  if (!a) return [];
  const minute = date.getHours() * 60 + date.getMinutes();
  let pool = examplesForAge(collection, a.age, a.day).filter(
    (d) => d.id !== a.id
  );
  if (choice) {
    const matching = pool.filter((d) =>
      matchesMoment(d, collection, minute, choice)
    );
    if (matching.length) pool = matching;
  }
  const sameDay = pool.filter((d) => d.day === a.day);
  if (sameDay.length) pool = sameDay;
  const b = pool.sort(
    (x, y) =>
      sameMinutes(a, x, collection.codes) -
        sameMinutes(a, y, collection.codes) || x.id.localeCompare(y.id)
  )[0];
  return b ? [entryFor(a, collection), entryFor(b, collection)] : [];
}
export function matchingPair(collection, date, choice, variation = 0) {
  if (!collection) return [];
  const minute = date.getHours() * 60 + date.getMinutes();
  const pool = collection.diaries.filter(
    (d) =>
      d.age !== "unknown" &&
      [1, 7].includes(d.day) === [1, 7].includes(diaryDayForDate(date)) &&
      matchesMoment(d, collection, minute, choice)
  );
  const first = pool[(ordinal(date) + seed(choice) + variation) % pool.length];
  return first
    ? contrastPair(collection, first.age, date, variation, first, choice)
    : [];
}
function runs(entry, category) {
  const result = [];
  for (const [start, duration, code] of entry.diary.activities) {
    if (entry.collection.codes[code].category !== category) continue;
    const previous = result.at(-1);
    if (previous && previous.start + previous.duration === start)
      previous.duration += duration;
    else result.push({ start, duration });
  }
  return result;
}
export function recapFacts(entries) {
  if (!entries.length) return [];
  const name = (entry) =>
    entries.length === 2 ? pairPerson(entry, entries) : personName(entry);
  const leisure = entries
    .flatMap((entry) =>
      runs(entry, "leisure").map((run) => ({ entry, ...run }))
    )
    .sort((a, b) => b.duration - a.duration)[0];
  const sleep = entries
    .map((entry) => ({ entry, count: runs(entry, "sleep").length }))
    .sort((a, b) => b.count - a.count)[0];
  const overlaps = entries
    .flatMap((a, i) =>
      entries.slice(i + 1).map((b) => ({
        a,
        b,
        minutes: sameMinutes(a.diary, b.diary, {
          ...a.collection.codes,
          ...b.collection.codes,
        }),
      }))
    )
    .sort((a, b) => b.minutes - a.minutes);
  const facts = [];
  if (leisure)
    facts.push({
      icon: "leisure",
      title: "Room to unwind",
      text: `${name(leisure.entry)} had ${durationLabel(
        leisure.duration
      )} of leisure in one uninterrupted stretch, starting at ${formatTime(
        leisure.start + 240
      )}.`,
    });
  if (sleep?.count)
    facts.push({
      icon: "sleep",
      title: "Where sleep fitted in",
      text: `${name(sleep.entry)} recorded ${
        sleep.count === 1 ? "one stretch" : `${sleep.count} separate stretches`
      } of sleep within this day.`,
    });
  const overlap = overlaps[0];
  if (overlap)
    facts.push({
      icon: "personal",
      title: "More in common than it seemed",
      text: `${name(overlap.a)} and ${name(overlap.b).replace(
        /^The /,
        "the "
      )} spent ${durationLabel(
        overlap.minutes
      )} doing the same kinds of activities at the same time.`,
    });
  return facts;
}
export function storyBeats(entries, startMinute) {
  const candidates = [];
  for (const entry of entries) {
    entry.diary.activities.forEach(([start, , code], index) => {
      if (index === 0) return;
      const minute = (start + 240) % 1440;
      const offset = (minute - startMinute + 1440) % 1440;
      if (offset < 120 || offset > 1320) return;
      const previous =
        entry.collection.codes[entry.diary.activities[index - 1][2]].category;
      const category = entry.collection.codes[code].category;
      const waking = previous === "sleep" && category !== "sleep";
      const startingWork = previous !== "work" && category === "work";
      if (!waking && !startingWork) return;
      const other = entries.find(
        (other) =>
          other !== entry &&
          other.collection.codes[
            other.diary.activities[activityAt(other.diary, minute)][2]
          ].category === "sleep"
      );
      if (!other) return;
      const name = (item) =>
        entries.length === 2 ? pairPerson(item, entries) : personName(item);
      const event = waking
        ? "wakes up"
        : code.startsWith("05")
        ? "starts work"
        : "starts learning";
      const context =
        !entry.group.child && entry.diary.children === true
          ? "This person's household includes children under 18."
          : !entry.group.child && entry.diary.children === false
          ? "This person's household has no children under 18."
          : "Two very different rhythms, sharing a clock.";
      candidates.push({
        offset,
        minute,
        title: `${name(entry)} ${event}. ${name(other)} is still asleep.`,
        text: `${formatTime(minute)} · ${activityLabel(
          entry.collection,
          code
        )}. ${context}`,
      });
    });
  }
  const sorted = candidates.sort((a, b) => a.offset - b.offset);
  const chosen = [];
  for (const target of [420, 1000]) {
    const closest = sorted
      .filter((item) =>
        chosen.every(
          (previous) => Math.abs(previous.offset - item.offset) >= 300
        )
      )
      .sort(
        (a, b) => Math.abs(a.offset - target) - Math.abs(b.offset - target)
      )[0];
    if (closest) chosen.push(closest);
  }
  return chosen.sort((a, b) => a.offset - b.offset);
}
// Story stops are included in the minute, rather than extending playback.
export function playbackFrame(elapsed, beats) {
  const hold = 3000,
    moving = 60000 - beats.length * hold;
  let passed = 0;
  for (const beat of beats) {
    const start = (moving * beat.offset) / 1440 + passed;
    if (elapsed < start) break;
    if (elapsed < start + hold) return { minutes: beat.offset, beat };
    passed += hold;
  }
  return {
    minutes: Math.min(1440, Math.max(0, ((elapsed - passed) / moving) * 1440)),
    beat: null,
  };
}
export function encodePair(entries, minute) {
  return btoa(
    JSON.stringify({
      v: 1,
      ids: entries.map((entry) => entry.diary.id),
      m: Math.floor(minute),
    })
  )
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}
export function decodePair(token, collection) {
  try {
    if (!token || token.length > 400 || !/^[\w-]+$/.test(token)) return null;
    const value = JSON.parse(
      atob(token.replaceAll("-", "+").replaceAll("_", "/"))
    );
    if (
      value.v !== 1 ||
      !Array.isArray(value.ids) ||
      value.ids.length !== 2 ||
      value.ids[0] === value.ids[1] ||
      !Number.isInteger(value.m) ||
      value.m < 0 ||
      value.m >= 1440
    )
      return null;
    const diaries = value.ids.map((id) =>
      collection.diaries.find((d) => d.id === id)
    );
    if (diaries.some((d) => !d) || diaries[0].age !== diaries[1].age)
      return null;
    return {
      entries: diaries.map((d) => entryFor(d, collection)),
      minute: value.m,
    };
  } catch {
    return null;
  }
}
