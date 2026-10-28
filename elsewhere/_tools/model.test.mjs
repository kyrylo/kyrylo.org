import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  activityAt,
  formatTime,
  clockPoint,
  arcPath,
  validateCollection,
  totals,
  matchesFilters,
  selectDiaries,
  AGE_GROUPS,
  handAngles,
  diaryDayForDate,
  exampleForAge,
  examplesForAge,
  nextActivity,
} from "../model.js";
import { sharedMoment, nextDescription } from "../stories.js";
const data = JSON.parse(
  readFileSync(new URL("../data/diaries.json", import.meta.url))
);
const children = JSON.parse(
  readFileSync(new URL("../data/illustrative-children.json", import.meta.url))
);

test("reported ages agree with the bands and preserve source topcodes", () => {
  assert.equal(validateCollection(data), data);
  for (const ageValue of [14, 81, 84, 86, 28.5, "28", 64]) {
    const altered = structuredClone(data);
    altered.diaries[0].ageValue = ageValue;
    assert.throws(() => validateCollection(altered), /Invalid reported age/);
  }
});

test("physical hand positions include lower time units and wrap at noon", () => {
  assert.deepEqual(handAngles(new Date(2026, 9, 14, 10, 10, 30)), {
    hour: 305.25,
    minute: 63,
    second: 180,
  });
  assert.deepEqual(handAngles(new Date(2026, 9, 14, 12, 0, 0)), {
    hour: 0,
    minute: 0,
    second: 0,
  });
  assert.equal(handAngles(new Date(2026, 9, 14, 0, 0, 0, 500)).second, 3);
});

test("weekday selection uses the local 04:00 diary seam across month boundaries", () => {
  assert.equal(diaryDayForDate(new Date(2026, 10, 1, 3, 59)), 7);
  assert.equal(diaryDayForDate(new Date(2026, 10, 1, 4, 0)), 1);
  assert.equal(diaryDayForDate(new Date(2026, 9, 19, 3, 59)), 1);
  assert.equal(diaryDayForDate(new Date(2026, 9, 19, 4, 0)), 2);
});

test("age examples cover babies through older adults, preserve provenance, and never substitute missing data", () => {
  validateCollection(children);
  for (const group of AGE_GROUPS) {
    const collection = group.child ? children : data;
    for (const day of [1, 2, 6, 7]) {
      const diary = exampleForAge(collection, group.age, day);
      assert.equal(diary.age, group.age);
      assert.equal([1, 7].includes(diary.day), [1, 7].includes(day));
      assert.equal(exampleForAge(collection, group.age, day), diary);
    }
  }
  assert.equal(exampleForAge(null, "1–3", 2), null);
  assert.equal(exampleForAge(data, "1–3", 2), null);
  assert.equal(exampleForAge(children, "65+", 2), null);
  const invalid = structuredClone(children);
  invalid.kind = "synthetic";
  assert.throws(() => validateCollection(invalid));
  invalid.kind = "atus";
  assert.throws(() => validateCollection(invalid));
});

test("every minute of each illustrative child day belongs to exactly one activity", () => {
  for (const diary of children.diaries) {
    assert.equal(
      Object.values(totals(diary, children.codes)).reduce((a, b) => a + b),
      1440
    );
    for (let minute = 0; minute < 1440; minute++) {
      const offset = (minute - 240 + 1440) % 1440;
      const matches = diary.activities.filter(
        ([start, duration]) => offset >= start && offset < start + duration
      );
      assert.equal(matches.length, 1);
      assert.deepEqual(diary.activities[activityAt(diary, minute)], matches[0]);
    }
  }
});

test("every included diary has exactly 1440 minutes with no gaps or overlaps", () => {
  validateCollection(data);
  for (const diary of data.diaries) {
    assert.equal(
      Object.values(totals(diary, data.codes)).reduce((a, b) => a + b),
      1440
    );
    for (let time = 0; time < 1440; time++) {
      const offset = (time - 240 + 1440) % 1440;
      const matching = diary.activities.filter(
        ([start, duration]) => offset >= start && offset < start + duration
      );
      assert.equal(matching.length, 1);
      assert.deepEqual(diary.activities[activityAt(diary, time)], matching[0]);
    }
  }
});
test("every actual interval boundary selects the next activity, not the previous one", () => {
  for (const diary of data.diaries) {
    diary.activities.forEach(([start], index) => {
      const minute = (start + 240) % 1440;
      assert.equal(activityAt(diary, minute), index);
      assert.equal(
        activityAt(diary, (minute + 1439) % 1440),
        (index - 1 + diary.activities.length) % diary.activities.length
      );
    });
  }
});
test("midnight, 04:00 seam, 24:00 and full-circle arc", () => {
  const diary = {
    activities: [
      [0, 1200, "x"],
      [1200, 240, "y"],
    ],
  };
  assert.equal(activityAt(diary, 0), 1);
  assert.equal(activityAt(diary, 239), 1);
  assert.equal(activityAt(diary, 240), 0);
  assert.equal(activityAt(diary, 1440), 1);
  assert.equal(formatTime(1440), "00:00");
  assert.equal(formatTime(1439), "23:59");
  assert.equal(arcPath(240, 1440).split(" A").length, 3);
  for (const [minute, expected] of [
    [0, [90, 25]],
    [360, [155, 90]],
    [720, [90, 155]],
    [1080, [25, 90]],
  ]) {
    clockPoint(minute).forEach((point, axis) =>
      assert.ok(Math.abs(point - expected[axis]) < 1e-8)
    );
  }
});
test("filters combine, weekends are Sunday/Saturday, unknown is not no", () => {
  const diary = { age: "25–34", day: 1, children: null };
  assert.equal(
    matchesFilters(diary, {
      age: "25–34",
      day: "weekend",
      children: "unknown",
    }),
    true
  );
  assert.equal(
    matchesFilters(diary, {
      age: "25–34",
      day: "weekday",
      children: "unknown",
    }),
    false
  );
  assert.equal(
    matchesFilters(diary, { age: "all", day: "all", children: "no" }),
    false
  );
});
test("selection has no duplicates, prefers other lives, and handles small/empty pools", () => {
  const initial = selectDiaries(data.diaries);
  assert.equal(initial.length, 24);
  assert.equal(new Set(initial.map((d) => d.id)).size, 24);
  const next = selectDiaries(data.diaries, initial);
  assert.ok(next.every((d) => !initial.includes(d)));
  assert.equal(selectDiaries(data.diaries.slice(0, 3), initial).length, 3);
  assert.deepEqual(selectDiaries([]), []);
});
test("corrupt data fails closed", () => {
  const bad = structuredClone(data);
  bad.diaries[0].activities[0][1] += 1;
  assert.throws(() => validateCollection(bad));
  const duplicate = structuredClone(data);
  duplicate.diaries.push(duplicate.diaries[0]);
  assert.throws(() => validateCollection(duplicate));
});

test("next activity counts down through midnight and joins the next selected day at 04:00", () => {
  const friday = {
    activities: [
      [0, 1200, "awake"],
      [1200, 240, "sleep"],
    ],
  };
  const saturday = {
    activities: [
      [0, 180, "sleep"],
      [180, 1260, "awake"],
    ],
  };
  assert.deepEqual(nextActivity(friday, 1439, saturday), {
    code: "sleep",
    minutes: 1,
  });
  assert.deepEqual(nextActivity(friday, 0, saturday), {
    code: "awake",
    minutes: 420,
  });
  assert.deepEqual(nextActivity(friday, 239, saturday), {
    code: "awake",
    minutes: 181,
  });
  assert.deepEqual(nextActivity(saturday, 419, saturday), {
    code: "awake",
    minutes: 1,
  });
  const repeated = {
    activities: [
      [0, 10, "a"],
      [10, 20, "a"],
      [30, 1410, "b"],
    ],
  };
  assert.deepEqual(nextActivity(repeated, 240), { code: "b", minutes: 30 });
  assert.equal(nextActivity({ activities: [[0, 1440, "sleep"]] }, 600), null);
});

test("alternate lives remain within the selected age and diary day type", () => {
  for (const group of AGE_GROUPS.filter((group) => !group.child)) {
    for (const day of [2, 7]) {
      const choices = examplesForAge(data, group.age, day);
      assert.ok(choices.length > 1);
      assert.equal(choices[0], exampleForAge(data, group.age, day));
      assert.ok(
        choices.every(
          (d) => d.age === group.age && [1, 7].includes(d.day) === (day === 7)
        )
      );
      assert.equal(new Set(choices.map((d) => d.id)).size, choices.length);
    }
  }
});

test("captions describe only displayed days, and next descriptions use the actual upcoming activity", () => {
  const sleeping = { group: AGE_GROUPS[0], activity: { category: "sleep" } };
  const working = { group: AGE_GROUPS[5], activity: { category: "work" } };
  assert.equal(
    sharedMoment([sleeping, sleeping, sleeping, sleeping, working]),
    "Four of these five people are sleeping."
  );
  assert.equal(
    sharedMoment([sleeping, working]),
    "The baby is sleeping. The person aged 25–34 is working or studying."
  );
  assert.equal(sharedMoment([]), "Every day has its own rhythm.");
  assert.equal(
    nextDescription(children, "sleep", { code: "milk", minutes: 12 }),
    "Wakes up in 12 min"
  );
  assert.equal(
    nextDescription(children, "play", { code: "sleep", minutes: 65 }),
    "Sleeps in 1h 5m"
  );
  assert.equal(
    nextDescription(children, "play", null),
    "No further change in this day"
  );
});
