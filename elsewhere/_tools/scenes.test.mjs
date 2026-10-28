import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { SCENE_KINDS, sceneKind, ageScale } from "../scene-kinds.js";
import { createWorld, T } from "../miniature-worlds.js";
import { AGE_GROUPS } from "../model.js";
const adult = JSON.parse(
  await readFile(new URL("../data/diaries.json", import.meta.url))
);
const child = JSON.parse(
  await readFile(new URL("../data/illustrative-children.json", import.meta.url))
);
test("all source codes and child activities have an available 3D scene", () => {
  const used = new Set(
    [...adult.diaries, ...child.diaries].flatMap((d) =>
      d.activities.map((a) => a[2])
    )
  );
  assert.equal(used.size, 231);
  for (const code of used) {
    const activity = adult.codes[code] || child.codes[code];
    assert.ok(SCENE_KINDS.includes(sceneKind(code, activity)), code);
  }
  for (const [code, expected] of [
    ["120305", "listen"],
    ["120306", "listen"],
    ["130109", "dance"],
    ["130112", "fish"],
    ["020103", "sew"],
    ["080201", "service"],
    ["010301", "appointment"],
    ["130129", "travel"],
    ["500106", "unknown"],
  ])
    assert.equal(sceneKind(code, adult.codes[code]), expected);
});
test("every scene constructs and animates with finite geometry at every age", () => {
  for (const kind of SCENE_KINDS)
    for (const group of AGE_GROUPS) {
      const world = createWorld({
        kind,
        group,
        identity: `qa-${group.age}-${kind}`,
        label: kind,
      });
      for (const t of [0, 0.7, 1.8, 20]) {
        world.update(t, 120, { x: 1, y: 0.2 });
        world.scene.updateMatrixWorld(true);
        world.scene.traverse((o) =>
          assert.ok(
            o.matrixWorld.elements.every(Number.isFinite),
            `${kind} ${group.age}: invalid transform`
          )
        );
      }
      assert.ok(world.people.length >= 1, `${kind} ${group.age}`);
      world.dispose();
    }
  assert.ok(ageScale({ age: "Under 1" }) < ageScale({ age: "1–3" }));
  assert.ok(ageScale({ age: "4–7" }) < ageScale({ age: "25–34" }));
});

// Regression checks for spatial relationships, independent of the default camera.
const position = (object) => object.getWorldPosition(new T.Vector3());
const front = (object) =>
  new T.Vector3(0, 0, 1).applyQuaternion(
    object.getWorldQuaternion(new T.Quaternion())
  );
const bounds = (object) => new T.Box3().setFromObject(object);
test("screens face their users, laptop rests on desk, and typing hands reach keys", () => {
  for (const age of ["15–24", "25–34", "65+"])
    for (const kind of ["work", "computer"]) {
      const w = createWorld({
        group: { age },
        kind,
        identity: "prop-regression",
      });
      for (const time of [0, 0.7, 2, 4]) {
        w.update(time, 720);
        w.scene.updateMatrixWorld(true);
        const screen = w.root.getObjectByName("laptop-screen"),
          user = w.root.getObjectByName("desk-user");
        const direction = position(w.people[0].head)
          .sub(position(screen))
          .normalize();
        assert.ok(
          front(screen).dot(direction) > 0.35,
          `${kind}: reversed screen`
        );
        const base = bounds(w.root.getObjectByName("laptop-base"));
        const top = bounds(
          w.root.getObjectByName("desk").getObjectByName("tabletop")
        );
        assert.ok(
          Math.abs(base.min.y - top.max.y) < 0.002,
          "laptop not resting on desk"
        );
        const keys = [];
        w.root.traverse((o) => {
          if (o.name === "laptop-key") keys.push(position(o));
        });
        assert.equal(keys.length, 24);
        for (const arm of w.people[0].arms) {
          const hand = arm.elbow.localToWorld(new T.Vector3(0, -0.2, 0));
          assert.ok(
            Math.min(...keys.map((k) => k.distanceTo(hand))) < 0.05,
            "typing hand misses keyboard"
          );
        }
      }
      w.dispose();
    }
});
test("TV faces the sofa and its feet sit on the cabinet", () => {
  for (const kind of ["watch", "game"]) {
    const w = createWorld({
      group: { age: "25–34" },
      kind,
      identity: "media-regression",
    });
    w.update(2, 720);
    w.scene.updateMatrixWorld(true);
    const screen = w.root.getObjectByName("television-screen"),
      viewer = w.root.getObjectByName("screen-viewer");
    const toViewer = position(viewer).sub(position(screen)).normalize();
    assert.ok(front(screen).dot(toViewer) > 0.8, "TV faces away from viewer");
    assert.ok(
      front(viewer).dot(front(screen)) < -0.98,
      "sofa faces away from TV"
    );
    const cabinet = bounds(w.root.getObjectByName("console-top"));
    let feet = 0;
    w.root.traverse((o) => {
      if (o.name !== "tv-foot") return;
      feet++;
      const foot = bounds(o);
      assert.ok(
        Math.abs(foot.min.y - cabinet.max.y) < 0.02,
        "TV foot is floating"
      );
      assert.ok(
        foot.min.x >= cabinet.min.x &&
          foot.max.x <= cabinet.max.x &&
          foot.min.z >= cabinet.min.z &&
          foot.max.z <= cabinet.max.z,
        "TV foot misses cabinet"
      );
    });
    assert.equal(feet, 4);
    w.dispose();
  }
});

test("seated hips and thighs meet cushions, knees clear the edge, and adult soles stay grounded", () => {
  for (const kind of [
    "relax",
    "read",
    "watch",
    "game",
    "work",
    "eat",
    "family",
    "wait",
    "sew",
  ])
    for (const group of AGE_GROUPS) {
      const w = createWorld({ kind, group, identity: `seating-${group.age}` });
      for (const time of [0, 1.4, 3.8]) {
        w.update(time, 720);
        w.scene.updateMatrixWorld(true);
        for (const person of w.people.filter((p) => p.seat)) {
          const furniture = person.seat.furniture;
          const surface = furniture.localToWorld(
            new T.Vector3(0, furniture.userData.seatHeight, 0)
          ).y;
          const pelvis = person.hips.localToWorld(new T.Vector3(0, -0.11, 0)).y;
          assert.ok(
            Math.abs(surface - pelvis) < 0.001,
            `${kind} ${group.age}: pelvis floating or sunk`
          );
          for (const leg of person.legs) {
            const thigh = bounds(leg.thigh);
            assert.ok(
              Math.abs(thigh.min.y - surface) < 0.002,
              `${kind} ${group.age}: thigh intersects cushion`
            );
            const knee = furniture.worldToLocal(position(leg.elbow));
            assert.ok(
              knee.z > furniture.userData.seatFront + 0.025,
              `${kind} ${group.age}: knee inside seat`
            );
            if (!person.seat.dangling)
              assert.ok(
                Math.abs(bounds(leg.shoe).min.y - 0.045) < 0.002,
                `${kind} ${group.age}: foot not on floor`
              );
          }
        }
      }
      w.dispose();
    }
});

test("room architecture varies across activities and across diaries of the same activity", () => {
  const settings = new Set();
  for (const kind of [
    "sleep",
    "work",
    "bath",
    "read",
    "watch",
    "cook",
    "walk",
    "travel",
    "yoga",
    "fish",
  ]) {
    const w = createWorld({
      kind,
      group: { age: "25–34" },
      identity: "settings",
    });
    settings.add(w.setting);
    w.dispose();
  }
  assert.ok(settings.size >= 8);
  const offices = new Set();
  for (const identity of ["a", "b", "c"]) {
    const w = createWorld({ kind: "work", group: { age: "25–34" }, identity });
    offices.add(w.setting);
    w.dispose();
  }
  assert.equal(offices.size, 3);
});
