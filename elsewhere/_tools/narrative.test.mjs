import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { AGE_GROUPS, activityAt } from "../model.js";
import {
  dayKey,
  dailyExample,
  entryFor,
  matchingPair,
  matchesMoment,
  contrastPair,
  sameMinutes,
  recapFacts,
  storyBeats,
  playbackFrame,
  encodePair,
  decodePair,
  reportedAge,
  pairPerson,
  dayDetail,
} from "../narrative.js";
const data = JSON.parse(
  readFileSync(new URL("../data/diaries.json", import.meta.url))
);
const date = new Date(2026, 9, 14, 10, 10);

test("profiles preserve reported ages, topcoded ranges, and distinct references", () => {
  assert.equal(reportedAge({ ageValue: 28, age: "25–34" }), "28");
  assert.equal(reportedAge({ ageValue: 80, age: "65+" }), "80–84");
  assert.equal(reportedAge({ ageValue: 85, age: "65+" }), "85+");
  assert.equal(reportedAge({ age: "25–34" }), "25–34");
  const entries = [28, 34].map((ageValue) =>
    entryFor({ ageValue, age: "25–34" }, data)
  );
  assert.equal(pairPerson(entries[0], entries), "The 28-year-old");
  entries[1].diary.ageValue = 28;
  assert.equal(pairPerson(entries[0], entries), "The person on the left");
  assert.equal(pairPerson(entries[1], entries), "The person on the right");
});

test("day facts sum only the recorded activities they describe", () => {
  const entry = entryFor(
    {
      age: "25–34",
      activities: [
        [0, 30, "050101"],
        [30, 90, "050101"],
        [120, 45, "180501"],
        [165, 30, "030101"],
      ],
    },
    data
  );
  assert.equal(dayDetail(entry), "Worked for 2h that day.");
  entry.diary.activities = [
    [0, 60, "030101"],
    [60, 90, "040101"],
    [150, 200, "020201"],
  ];
  assert.equal(dayDetail(entry), "Spent 2h 30m caring for or helping others.");
});

test("daily cast is stable through a survey day and changes the following morning", () => {
  for (const group of AGE_GROUPS.filter((group) => !group.child)) {
    const today = dailyExample(data, group.age, date);
    assert.equal(
      today,
      dailyExample(data, group.age, new Date(2026, 9, 14, 23, 59))
    );
    assert.equal(
      today,
      dailyExample(data, group.age, new Date(2026, 9, 15, 3, 59))
    );
    assert.notEqual(
      today.id,
      dailyExample(data, group.age, new Date(2026, 9, 15, 4)).id
    );
    assert.equal(dayKey(new Date(2026, 10, 1, 2)), "2026-10-31");
  }
  assert.equal(dailyExample(null, "25–34", date), null);
});

test("activity matching returns a real matching diary and a distinct person in the same age band", () => {
  for (const choice of ["sleep", "work", "eat", "care", "relax", "travel"]) {
    const pair = matchingPair(data, date, choice);
    assert.equal(pair.length, 2, choice);
    assert.ok(matchesMoment(pair[0].diary, data, 610, choice));
    assert.equal(pair[0].diary.age, pair[1].diary.age);
    assert.notEqual(pair[0].diary.id, pair[1].diary.id);
  }
  assert.deepEqual(matchingPair(data, date, "made-up-activity"), []);
});

test("comparison chooses a contrasting day with the same recorded weekday when available", () => {
  for (const group of AGE_GROUPS.filter((group) => !group.child)) {
    const [a, b] = contrastPair(data, group.age, date);
    assert.equal(a.diary.day, b.diary.day);
    const pool = data.diaries.filter(
      (d) => d.age === group.age && d.day === a.diary.day && d.id !== a.diary.id
    );
    assert.equal(
      sameMinutes(a.diary, b.diary, data.codes),
      Math.min(...pool.map((d) => sameMinutes(a.diary, d, data.codes)))
    );
    let counted = 0;
    for (let minute = 0; minute < 1440; minute++) {
      const ca = a.diary.activities[activityAt(a.diary, minute)][2];
      const cb = b.diary.activities[activityAt(b.diary, minute)][2];
      counted += Number(data.codes[ca].category === data.codes[cb].category);
    }
    assert.equal(sameMinutes(a.diary, b.diary, data.codes), counted);
  }
});

test("recap uses contiguous leisure, distinct sleep stretches, and exact overlapping time", () => {
  const collection = {
    codes: {
      s: { category: "sleep" },
      w: { category: "work" },
      l: { category: "leisure" },
      x: { category: "leisure" },
    },
  };
  const a = {
    id: "a",
    age: "25–34",
    activities: [
      [0, 120, "s"],
      [120, 60, "l"],
      [180, 60, "x"],
      [240, 600, "w"],
      [840, 60, "s"],
      [900, 540, "w"],
    ],
  };
  const b = {
    id: "b",
    age: "25–34",
    activities: [
      [0, 240, "w"],
      [240, 600, "s"],
      [840, 600, "w"],
    ],
  };
  const facts = recapFacts([entryFor(a, collection), entryFor(b, collection)]);
  assert.match(
    facts[0].text,
    /The person on the left had 2h of leisure.*06:00/
  );
  assert.match(
    facts[1].text,
    /The person on the left recorded 2 separate stretches/
  );
  assert.match(facts[2].text, /9h doing the same kinds/);
});

test("story stops describe actual transitions and fit inside a 60-second day", () => {
  const entries = AGE_GROUPS.filter((g) => !g.child).map((g) =>
    entryFor(dailyExample(data, g.age, date), data)
  );
  const beats = storyBeats(entries, 610);
  assert.ok(beats.length > 0 && beats.length <= 2);
  for (const beat of beats) {
    assert.ok(beat.offset >= 120 && beat.offset <= 1320);
    assert.ok(
      entries.some((e) =>
        e.diary.activities.some(
          ([start]) => (start + 240) % 1440 === beat.minute
        )
      )
    );
    const index = beats.indexOf(beat);
    const holdStart =
      ((60000 - beats.length * 3000) * beat.offset) / 1440 + index * 3000;
    assert.equal(playbackFrame(holdStart + 50, beats).minutes, beat.offset);
    assert.equal(playbackFrame(holdStart + 2900, beats).beat, beat);
  }
  assert.equal(playbackFrame(0, beats).minutes, 0);
  assert.equal(playbackFrame(60000, beats).minutes, 1440);
  assert.equal(playbackFrame(60000, beats).beat, null);
  assert.equal(playbackFrame(30000, []).minutes, 720);
});

test("shared pairs round-trip exact IDs and time; malformed and unknown links fail closed", () => {
  const pair = contrastPair(data, "25–34", date);
  const decoded = decodePair(encodePair(pair, 610), data);
  assert.deepEqual(
    decoded.entries.map((e) => e.diary.id),
    pair.map((e) => e.diary.id)
  );
  assert.equal(decoded.minute, 610);
  for (const token of [
    null,
    "not-json",
    "!",
    "x".repeat(401),
    btoa(JSON.stringify({ v: 1, ids: ["missing", "missing"], m: 610 })),
    encodePair(pair, 1440),
    encodePair([pair[0], pair[0]], 610),
  ])
    assert.equal(decodePair(token, data), null);
});
