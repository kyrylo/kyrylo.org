import { sceneKind, SCENE_KINDS } from "./scene-kinds.js";

// Small, original SVG vignettes. The ink and motion belong to the artwork;
// activity labels and recorded times remain outside it in the accessible page.
const ink = "#454b43",
  paper = "#fffdf7",
  blue = "#91b6c2",
  rose = "#dca497",
  gold = "#dfbd75",
  green = "#9db9a2",
  wood = "#c9a17b";
const path = (d, fill = "none", extra = "") =>
  `<path d="${d}" fill="${fill}" ${extra}/>`;
const rect = (x, y, w, h, c = paper, r = 4, extra = "") =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${c}" ${extra}/>`;
const ellipse = (x, y, rx, ry, c, extra = "") =>
  `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}" ${extra}/>`;
const circle = (x, y, r, c = paper, extra = "") =>
  ellipse(x, y, r, r, c, extra);
const group = (content, transform = "", cls = "") =>
  `<g${transform ? ` transform="${transform}"` : ""}${
    cls ? ` class="${cls}"` : ""
  }>${content}</g>`;
const limb = (d, color, width = 10, cls = "") =>
  group(
    path(d, "none", `stroke="${ink}" stroke-width="${width + 3}"`) +
      path(d, "none", `stroke="${color}" stroke-width="${width}"`),
    "",
    cls
  );
const hash = (text) =>
  [...text].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7);
function mug(x, y, c = gold) {
  return group(
    path("M12 3h7q10 0 10 8t-17 8", paper) +
      path("M-10 0h24v21q-12 10-24 0Z", c) +
      path("M-6 4h16", "none", 'stroke="#fffdf7" stroke-width="2"'),
    `translate(${x} ${y})`
  );
}
function steam(x, y) {
  return group(
    group(
      path("M0 0q-7-9 0-18t0-17") + path("M14 2q-7-9 0-18t0-15"),
      "",
      "scene-steam"
    ),
    `translate(${x} ${y})`
  );
}
function book(x, y, open = true, c = rose) {
  return group(
    open
      ? path("M-34-9q18-7 34 1 18-8 35-1v30q-18-7-35 1-18-8-34-1Z", paper) +
          path(
            "M0-8v30 M-26 0l17 2 M-26 7l17 2 M9 2l17-2 M9 9l17-2",
            "none",
            'stroke-width="1.4"'
          )
      : rect(-28, -5, 56, 11, c, 2) +
          path(
            "M-21-1h45 M-21 3h45",
            "none",
            'stroke="#fffdf7" stroke-width="1.2"'
          ),
    `translate(${x} ${y})`
  );
}
function plant(x = 452, y = 320, size = 1) {
  const leaves =
    path(
      "M0-26Q-4-81-14-102 M-4-57q24-10 33-38 M-4-70q-26-2-34-21",
      "none",
      `stroke="${ink}"`
    ) +
    path("M-14-102q-35-13-12 17 17 16 12-17Z", green) +
    path("M29-95q-34-1-25 24 27-2 25-24Z", green) +
    path("M-38-91q-19 20 23 24-2-20-23-24Z", green) +
    path("M-4-51q18-37 30-17-4 19-30 17Z", green);
  return group(
    group(leaves, "", "scene-leaves") +
      path("M-22-30h44l-6 30h-31Z", rose) +
      ellipse(0, -29, 22, 4, "#ecc1b2") +
      path("M-13-22l3 16", "none", 'stroke="#fffdf7" stroke-width="2"'),
    `translate(${x} ${y}) scale(${size})`
  );
}
function windowArt(night, x = 374, y = 93) {
  const sky = night ? "#8798af" : "#dfebe8";
  return group(
    path("M-55 60V-18a55 55 0 0 1 110 0V60Z", paper) +
      path("M-48 53V-17a48 48 0 0 1 96 0V53Z", sky, 'stroke-width="1.2"') +
      (night
        ? path(
            "M22-30a17 17 0 1 0 16 22A17 17 0 0 1 22-30Z",
            gold,
            'stroke="none"'
          )
        : circle(25, -25, 12, gold, 'stroke="none"') +
          group(
            path(
              "M-37-16q1-10 10-6 7-15 17-1 15-2 14 9Z",
              paper,
              'stroke="none"'
            ),
            "",
            "scene-cloud"
          )) +
      path(
        "M0-66V56 M-48-5h96 M-48 25h96",
        "none",
        `stroke="${paper}" stroke-width="5"`
      ) +
      rect(-65, 59, 130, 8, wood, 3),
    `translate(${x} ${y})`
  );
}
function shelf(x = 135, y = 100, c = rose) {
  return group(
    rect(-42, 7, 84, 7, wood, 2) +
      rect(-31, -26, 11, 32, c, 1) +
      rect(-19, -33, 12, 39, gold, 1) +
      rect(-6, -21, 9, 27, blue, 1) +
      path("M8-27l12-3 8 34-12 3Z", green) +
      circle(35, -3, 10, paper) +
      path("M35-12v8l5 4", "none", 'stroke-width="1.2"'),
    `translate(${x} ${y})`
  );
}
function backdrop({ night, style = 0, outdoor = false, kind }) {
  const colors = ["#f4eee2", "#eef1e8", "#f5e9e3"];
  let b = path(
    "M92 305q-15-78 1-151 15-85 115-98 111-20 207 30 57 34 57 126v91Z",
    colors[style % 3],
    'stroke="none"'
  );
  if (outdoor) {
    b = path(
      "M73 312q-12-59 29-86 38-32 67 3 59-116 129-58 65-97 135-11 61 57 39 152Z",
      "#edf1e5",
      'stroke="none"'
    );
    b += circle(411, 86, 22, night ? "#c5cddd" : "#ead29b", 'stroke="none"');
    for (const [x, scale] of [
      [116, 0.8],
      [428, 1],
    ])
      b += group(
        path("M0 0v-115 M0-48l-21-29 M0-72l19-21") +
          path(
            "M0-132q-35-13-40 20-30 17-4 43-5 30 24 28 28 24 48-1 28 0 25-29 27-23-3-43-6-33-50-18Z",
            green
          ) +
          path(
            "M0-103v102 M0-51l-18-23 M0-73l16-17",
            "none",
            'stroke-width="1.5"'
          ),
        `translate(${x} 311) scale(${scale})`
      );
  } else
    b +=
      (kind === "wash" ? "" : windowArt(night)) +
      shelf(148, 112, [rose, blue, green][style % 3]);
  return (
    b +
    ellipse(280, 327, 202, 10, "#e9e8dd", 'stroke="none"') +
    path("M79 329q195 4 398 0", "none", 'stroke="#b7b8ab" stroke-width="1.4"')
  );
}
function head(c, age, expression = "awake", style = 0) {
  const baby = ["Under 1", "1–3"].includes(age),
    hair = age === "65+" ? "#b0b5ad" : c.hair;
  let h = path(
    "M-24-10q-2-22 22-25 25-2 29 24l1 14 7 5-8 4q-3 22-24 22-25 0-28-22Z",
    c.skin
  );
  h +=
    ellipse(-23, 0, 6, 8, c.skin) +
    path("M-25-2q5-3 5 4", "none", 'stroke-width="1.2"');
  if (baby)
    h += path(
      "M-4-34q2-15 10-11 4 5-3 9",
      "none",
      `stroke="${hair}" stroke-width="3"`
    );
  else
    h +=
      style % 2
        ? path(
            "M-24 5q-15-44 20-44 27-6 31 23-15-10-27-2-5-10-13-4l-3 23Z",
            hair
          ) +
          path(
            "M-14-28q9-11 23-6",
            "none",
            'stroke="#fffdf7" stroke-width="1.2" opacity=".35"'
          )
        : path(
            "M-24 4q-11-16-3-29 2-16 23-16 8-8 21-1 19-1 17 17-12 16-27 7-4 11-20 7l-3 16Z",
            hair
          );
  h += group(
    expression === "sleep"
      ? path("M3 0q4 4 8 0 M19 0q3 3 6 0", "none", 'stroke-width="1.8"')
      : circle(8, -1, 2, ink, 'stroke="none"') +
          circle(23, -1, 1.7, ink, 'stroke="none"'),
    "",
    expression === "sleep" ? "" : "scene-eyes"
  );
  h +=
    ellipse(13, 9, 6, 3.3, "#d99b87", 'stroke="none" opacity=".55"') +
    path("M12 17q5 4 9-1", "none", 'stroke-width="1.5"');
  if (age === "65+")
    h +=
      circle(7, -1, 7, "none", 'stroke-width="1.4"') +
      circle(24, -1, 6, "none", 'stroke-width="1.4"') +
      path("M14-2h4 M0-3l-21-2", "none", 'stroke-width="1.2"');
  return group(
    group(h, "", "scene-head"),
    `translate(0 -119) scale(${baby ? 1.08 : 1})`
  );
}
function person(
  c,
  {
    x = 218,
    y = 238,
    pose = "sit",
    age = c.age,
    scale = 1,
    flip = false,
    upperOnly = false,
  } = {}
) {
  const seated = [
    "sit",
    "work",
    "read",
    "eat",
    "game",
    "phone",
    "music",
    "fish",
    "drive",
    "cycle",
    "cradle",
  ].includes(pose);
  // Room furniture is drawn to the same anchors as the hips, feet and hands.
  let legs;
  if (pose === "cycle")
    legs =
      limb("M-8 0L18 49 36 131", c.pants, 16) +
      limb("M8 0L69 25 84 107", c.pants, 16) +
      path("M28 127h17l15 8q3 7-33 3Z", paper) +
      path("M77 103h17l15 8q3 7-33 3Z", paper);
  else if (seated)
    legs =
      limb("M-9 0Q14 8 40 8L43 72", c.pants, 16) +
      limb("M7 0Q29 0 57 3L61 67", c.pants, 16) +
      path("M35 67h17q13 2 16 12H34Z", paper) +
      path("M54 64h17q14 2 17 12H53Z", paper) +
      path("M38 78h25 M58 75h25", "none", 'stroke-width="1.2"');
  else if (["walk", "run", "dance"].includes(pose))
    legs =
      group(
        limb("M-8 0L-21 39-44 77", c.pants, 15) +
          path("M-49 72l13 6-2 11-29-5q-4-7 18-12Z", paper),
        "",
        "scene-leg-back"
      ) +
      group(
        limb("M8 0L30 40 49 73", c.pants, 15) +
          path("M43 70l14-2 16 9q5 10-23 7Z", paper),
        "",
        "scene-leg-front"
      );
  else if (pose === "floor" || pose === "yoga")
    legs = limb(
      "M-8 0q-42 13-45 31 24 15 61-2 M9 1q41 11 45 31-20 13-62-3",
      c.pants,
      15
    );
  else
    legs =
      limb("M-9 0L-12 77", c.pants, 16) +
      limb("M9 0L17 77", c.pants, 16) +
      path("M-20 73h17l2 11h-32q-3-8 11-11Z", paper) +
      path("M8 73h17l12 8q3 5-29 4Z", paper);
  if (upperOnly) legs = "";
  const shirt =
    path("M-16-90q19-9 35 1 11 31 11 78Q4 2-25-10q-1-40 9-80Z", c.shirt) +
    path("M-10-89q13 14 25 0", "none", 'stroke-width="1.5"') +
    path("M-20-17q22 7 44 1", "none", 'stroke-width="1.2" opacity=".4"');
  const neck = path("M-7-101h17v16q-8 8-17-1Z", c.skin);
  const arms = {
    work: ["M-16-73L24-27 70-24", "M19-74L44-31 87-23"],
    standwork: ["M-16-73L24-27 70-24", "M19-74L44-31 87-23"],
    cycle: ["M-16-73L24-27 70-24", "M19-74L44-31 87-23"],
    read: ["M-16-72L-22-29 13-15", "M19-73L43-30 34-15"],
    eat: ["M-16-73L-20-23 36-20", "M19-74L43-41 27-88"],
    game: ["M-16-73L-17-28 12-17", "M19-73L45-27 35-17"],
    phone: ["M-16-73L-30-27-15-8", "M19-73L42-48 31-113"],
    music: ["M-16-73L-15-24 20-26", "M19-73L56-30 72-59"],
    cook: ["M-16-73L17-33 63-46", "M19-73L49-43 70-65"],
    dishes: ["M-16-73L12-28 68-26", "M19-73L42-49 79-34"],
    water: ["M-16-73L17-33 64-31", "M19-73L49-43 82-55"],
    care: ["M-16-73L-22-27 24-19", "M19-73L47-41 23-51"],
    cradle: ["M-16-73L-22-27 24-19", "M19-73L47-41 23-51"],
    wash: ["M-16-73L-24-47 8-93", "M19-73L48-46 20-97"],
    clean: ["M-16-73L20-41 52-53", "M19-73L43-52 70-91"],
    walk: ["M-16-73L-39-32-53-11", "M19-73L42-47 57-52"],
    run: ["M-16-73L-38-37-54-53", "M19-73L41-88 59-78"],
    dance: ["M-16-73L-42-93-54-125", "M19-73L43-92 56-122"],
    yoga: ["M-16-73L-49-58-74-56", "M19-73L49-59 74-57"],
    exercise: ["M-16-73L-49-58-74-56", "M19-73L49-59 74-57"],
    fish: ["M-16-73L-20-26 14-18", "M19-73L47-35 64-56"],
    floor: ["M-16-73L-36-22-38 8", "M19-73L39-28 57-13"],
    sit: ["M-16-73L-38-32-58 5", "M19-73L38-27 30-5"],
    stand: ["M-16-73L-22-36-18-8", "M19-73L26-35 25-8"],
  }[pose] || ["M-16-73L-20-33-12-7", "M19-73L31-34 35-9"];
  const armMarkup = arms
    .map((d, i) => {
      const [sx, sy, ex, ey] = d.match(/-?\d+(?:\.\d+)?/g).map(Number);
      const sleeve = `M${sx} ${sy}L${sx + (ex - sx) * 0.34} ${
        sy + (ey - sy) * 0.34
      }`;
      return (
        limb(
          d,
          c.skin,
          10,
          ["work", "standwork", "cook", "eat", "music", "clean"].includes(
            pose
          ) && i === 1
            ? "scene-hand"
            : ""
        ) + limb(sleeve, c.shirt, 18)
      );
    })
    .join("");
  const face = head(c, age, "awake", c.variant);
  return group(
    legs + group(neck + shirt + face + armMarkup, "", "scene-breathe"),
    `translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`
  );
}
function chair(x = 187, y = 247) {
  return group(
    path(
      "M-14 2l-8 75 M43 3l12 74",
      "none",
      `stroke="${ink}" stroke-width="5"`
    ) +
      path(
        "M-14 2l-8 75 M43 3l12 74",
        "none",
        `stroke="${wood}" stroke-width="3"`
      ) +
      path("M-30-72q15-9 33-5L12 3h-34Z", green) +
      rect(-21, -5, 78, 12, wood, 5),
    `translate(${x} ${y})`
  );
}
function desk(x = 268, y = 224, w = 160) {
  return group(
    path(
      `M10 8L1 ${326 - y} M${w - 13} 8L${w - 3} ${326 - y}`,
      "none",
      `stroke="${ink}" stroke-width="7"`
    ) +
      path(
        `M10 8L1 ${326 - y} M${w - 13} 8L${w - 3} ${326 - y}`,
        "none",
        `stroke="${wood}" stroke-width="4"`
      ) +
      rect(-7, -2, w + 14, 10, wood, 4),
    `translate(${x} ${y})`
  );
}
function sofa(c) {
  return (
    path(
      "M143 315l-4 11 M379 315l5 11",
      "none",
      `stroke="${wood}" stroke-width="6"`
    ) +
    rect(133, 181, 257, 119, c.accent, 23) +
    path(
      "M258 191v57 M147 239h228",
      "none",
      'stroke-width="1.4" opacity=".45"'
    ) +
    rect(138, 249, 248, 35, paper, 10) +
    path("M260 253v28", "none", 'stroke-width="1.4"') +
    rect(119, 232, 33, 77, c.accent, 12) +
    rect(372, 232, 33, 77, c.accent, 12) +
    rect(147, 287, 230, 24, c.accent, 7) +
    path("M325 254h45v48h-45Z", gold) +
    path(
      "M327 302v7m7-7v8m7-8v7m7-7v8m7-8v7m7-7v8",
      "none",
      'stroke-width="1.2"'
    ) +
    group(rect(-21, -20, 42, 40, rose, 9), "translate(345 234) rotate(12)")
  );
}
function labelLines(x, y, w = 50) {
  return path(
    `M${x} ${y}h${w}m-${w} 7h${w * 0.7}m-${w * 0.7} 7h${w * 0.85}`,
    "none",
    'stroke-width="1.4" opacity=".55"'
  );
}
function deskScene(c, kind) {
  const child = c.child,
    scale = child ? 0.82 : 1,
    x = child ? 217 : 208,
    y = child ? 255 : 239;
  let b = chair(187, 247) + desk() + person(c, { x, y, pose: "work", scale });
  if (["work", "computer"].includes(kind))
    b +=
      path("M280 212h82l17 12H270Z", "#d7ded7") +
      path("M348 211l12-61h65l-14 61Z", ink) +
      path("M353 205l10-50h56l-12 50Z", blue, 'stroke-width="1.4"') +
      path(
        "M363 168h32 M360 180h40 M358 192h23",
        "none",
        `stroke="${paper}" stroke-width="3"`
      ) +
      path("M286 215h58 M293 219h48", "none", 'stroke-width="1.2"');
  else if (kind === "sew")
    b +=
      rect(307, 204, 89, 17, paper) +
      path("M323 206v-45q0-14 16-14h45v61h-19v-33h-29v31Z", blue) +
      circle(377, 164, 7, paper) +
      path("M333 181v29") +
      rect(292, 215, 45, 6, rose, 2);
  else {
    b += book(319, 200);
    b += path("M295 214l15-24", "none", `stroke="${gold}" stroke-width="4"`);
    if (kind === "art")
      b +=
        ellipse(393, 211, 23, 8, wood) +
        circle(384, 209, 3, rose) +
        circle(395, 211, 3, blue) +
        circle(405, 211, 3, gold);
  }
  b += (kind === "art" ? "" : mug(403, 191, c.accent)) + plant(457, 320, 0.62);
  if (kind === "school")
    b +=
      rect(108, 144, 81, 53, "#6e8c78", 3) +
      path(
        "M121 158h37 M121 170h51 M121 182h26",
        "none",
        `stroke="${paper}" stroke-width="2"`
      );
  return b;
}
function swaddledBaby(c, x = 270, y = 209) {
  return group(
    group(
      path("M-35 0q10-22 40-8 23 13 12 29-35 8-52-21Z", paper) +
        circle(18, -13, 14, c.skin) +
        path("M20-16h2 M17-8q3 3 6 0", "none", 'stroke-width="1.2"'),
      "",
      "scene-cradle"
    ),
    `translate(${x} ${y}) rotate(-12)`
  );
}
function loungeScene(c, kind) {
  let b = sofa(c) + plant(451, 320, 0.8);
  if (c.age === "Under 1" && ["family", "read"].includes(kind))
    return (
      b +
      person(c, { x: 258, y: 240, pose: "cradle", age: "35–44" }) +
      swaddledBaby(c) +
      desk(359, 298, 91) +
      (kind === "read" ? book(388, 276) : mug(416, 274))
    );
  const pose =
    { read: "read", game: "game", phone: "phone", music: "music" }[kind] ||
    "sit";
  const scale = c.child ? 0.74 : 1;
  b += person(c, { x: 211, y: c.child ? 253 : 240, pose, scale });
  const prop = group(
    kind === "read"
      ? book(23, -27)
      : kind === "game"
      ? path("M3-29h37q15 6 10 22-4 6-18-3H17Q2 1-5-8q-4-15 8-21Z", ink) +
        path(
          "M7-23v11 M2-18h10",
          "none",
          `stroke="${paper}" stroke-width="2"`
        ) +
        circle(35, -21, 2, gold) +
        circle(41, -15, 2, rose)
      : kind === "phone"
      ? rect(27, -130, 10, 26, ink, 3)
      : kind === "music"
      ? group(
          ellipse(0, 0, 21, 29, wood) +
            ellipse(0, -20, 15, 22, wood) +
            circle(0, -9, 7, ink) +
            rect(-4, -77, 8, 63, wood, 2) +
            path("M-2 18V-73 M2 18V-73", "none", 'stroke-width=".8"'),
          "translate(26 -20) rotate(49)"
        )
      : "",
    `translate(211 ${c.child ? 253 : 240}) scale(${scale})`
  );
  b += prop;
  if (kind === "family" || (kind === "read" && c.child))
    b +=
      person(
        { ...c, shirt: c.accent, variant: c.variant + 1 },
        {
          x: 316,
          y: 240,
          pose: kind === "read" ? "read" : "sit",
          age: "35–44",
          scale: 0.94,
        }
      ) + (kind === "read" ? book(337, 213) : "");
  if (["watch", "game"].includes(kind)) {
    // A small TV sits on a cabinet at the right, facing toward the sitter.
    b +=
      rect(411, 241, 67, 67, wood, 4) +
      path("M418 308v15 M469 308v15 M415 270h59") +
      rect(409, 186, 74, 49, ink, 6) +
      rect(414, 191, 64, 37, blue, 3) +
      path("M428 234l-4 7 M466 234l5 7");
    b += group(
      circle(455, 200, 5, gold, 'stroke="none"') +
        path("M415 222l15-14 15 9 14-7 19 12Z", green, 'stroke="none"'),
      "",
      "scene-tv"
    );
  } else if (kind === "listen")
    b +=
      rect(409, 275, 70, 38, wood, 6) +
      circle(429, 294, 11, ink) +
      circle(461, 292, 7, paper) +
      path("M458 275l15-23") +
      group(
        path("M431 250v-20l14-4v20") +
          ellipse(426, 251, 5, 3, ink) +
          ellipse(440, 247, 5, 3, ink),
        "",
        "scene-notes"
      );
  else b += desk(359, 298, 91) + mug(416, 274) + book(379, 294, false);
  return b;
}
function sleepingScene(c) {
  const baby = c.age === "Under 1";
  let b =
    path(
      "M139 310v16 M409 310v16",
      "none",
      `stroke="${wood}" stroke-width="7"`
    ) +
    rect(121, 227, 302, 86, wood, 10) +
    rect(125, 230, 292, 60, paper, 15) +
    rect(121, 208, 17, 100, c.accent, 7) +
    rect(407, 218, 17, 91, c.accent, 7) +
    group(rect(-31, -17, 62, 34, paper, 13), "translate(169 239) rotate(-9)");
  b += group(
    head(c, c.age, "sleep", c.variant),
    "translate(288 232) rotate(-80) scale(.82)"
  );
  b +=
    path("M209 228q97-16 195 7v65H192q-1-44 17-72Z", c.shirt) +
    path(
      "M219 232q-13 28-10 61 M235 246q17 1 22 12",
      "none",
      'stroke-width="1.5" opacity=".45"'
    );
  b += group(
    path("M208 229q98-15 195 7v7q-95-20-198-6Z", c.shirt, 'stroke="none"'),
    "",
    "scene-blanket"
  );
  if (baby) {
    b +=
      path(
        "M134 264h273 M139 264v42 M174 264v42 M209 264v42 M244 264v42 M279 264v42 M314 264v42 M349 264v42 M384 264v42",
        "none",
        `stroke="${paper}" stroke-width="6"`
      ) + path("M151 219V116q0-17 20-17h51");
    b += group(
      path("M222 99v22 M198 121h49 M198 121v23 M223 121v31 M247 121v23") +
        circle(198, 150, 7, gold) +
        circle(223, 158, 6, rose) +
        circle(247, 150, 7, blue),
      "",
      "scene-mobile"
    );
  }
  b +=
    desk(439, 270, 45) +
    path("M459 268v-37 M448 268h22") +
    path("M443 214h31l9 20h-50Z", gold);
  return b;
}
function kitchenScene(c, kind) {
  if (kind === "feed" && c.age === "Under 1") {
    return (
      path(
        "M220 239L206 326 M273 239L288 326",
        "none",
        `stroke="${wood}" stroke-width="7"`
      ) +
      rect(219, 177, 46, 61, c.accent, 9) +
      rect(218, 232, 59, 10, wood, 4) +
      person(c, { x: 242, y: 235, pose: "eat", scale: 0.58 }) +
      rect(233, 284, 57, 7, wood, 3) +
      rect(212, 227, 94, 9, paper, 5) +
      group(
        rect(-5, -15, 11, 25, paper, 3) + rect(-3, -21, 7, 8, gold, 2),
        "translate(258 184) rotate(25)"
      ) +
      plant(425, 320, 0.85)
    );
  }
  const dining = ["eat", "feed"].includes(kind);
  if (dining) {
    const scale = c.child ? 0.8 : 1;
    let b =
      chair(187, 247) +
      desk(269, 233, 155) +
      person(c, { x: 208, y: c.child ? 255 : 239, pose: "eat", scale }) +
      ellipse(325, 229, 33, 8, paper) +
      ellipse(325, 227, 25, 4, gold) +
      mug(403, 208, blue);
    b +=
      kind === "feed"
        ? group(
            rect(-5, -15, 11, 25, paper, 3) + rect(-3, -21, 7, 8, gold, 2),
            `translate(${208 + 27 * scale} ${
              (c.child ? 255 : 239) - 88 * scale
            }) rotate(25)`
          )
        : path("M235 154l7-17", "none", 'stroke-width="2"') +
          ellipse(243, 134, 3, 5, paper);
    return b + plant(454, 320, 0.65);
  }
  let b =
    person(c, { x: 214, y: 240, pose: kind === "dishes" ? "dishes" : "cook" }) +
    rect(269, 224, 172, 94, c.accent, 4) +
    rect(259, 219, 193, 11, paper, 3) +
    path(
      "M354 234v76 M277 254h68 M281 242h16 M364 242h16",
      "none",
      'stroke-width="1.5"'
    );
  if (kind === "dishes")
    b +=
      ellipse(317, 220, 36, 6, blue) +
      path("M329 213v-34q0-17 13-17t12 17") +
      path(
        "M329 195v18",
        "none",
        `stroke="${blue}" stroke-width="3" stroke-dasharray="3 5" class="scene-water"`
      ) +
      ellipse(291, 213, 17, 5, paper);
  else
    b +=
      path("M285 190h62v23q-30 17-62 0Z", rose) +
      path(
        "M277 194h8 M347 194h9 M281 190h70 M313 190L282 171",
        "none",
        'stroke-width="3"'
      ) +
      steam(311, 180) +
      ellipse(401, 213, 23, 5, wood) +
      circle(394, 209, 7, gold) +
      circle(411, 209, 7, rose);
  return b + plant(461, 320, 0.58);
}
function personalScene(c, kind) {
  if (kind === "bath" || kind === "swim") {
    let b = person(c, {
      x: 254,
      y: kind === "swim" ? 300 : 280,
      pose: "wash",
      scale: c.child ? 0.85 : 1,
      upperOnly: true,
    });
    b +=
      kind === "swim"
        ? path("M113 254q44-14 84 0t84 0 84 0 84 0v65H113Z", "#bdd5d9") +
          path(
            "M140 279q24 11 48 0m31 0q24 11 48 0m31 0q24 11 48 0m31 0q24 11 48 0",
            "none",
            'stroke="#fffdf7" stroke-width="3" class="scene-ripples"'
          )
        : path("M150 253h252l-17 58q-103 17-218 0Z", paper) +
          rect(142, 244, 268, 17, blue, 8) +
          path("M174 316l-4 10 M379 316l4 10", "none", 'stroke-width="5"') +
          circle(189, 240, 12, paper) +
          circle(212, 239, 9, paper) +
          circle(234, 242, 10, paper) +
          group(
            ellipse(340, 239, 12, 7, gold) +
              circle(349, 230, 7, gold) +
              path("M354 229l9 3-9 2Z", rose),
            "",
            "scene-duck"
          );
    return b;
  }
  return (
    person(c, { x: 236, y: 240, pose: "wash" }) +
    ellipse(337, 132, 39, 48, "#dce9e5") +
    path("M316 106q17-13 26-9", "none", 'stroke="#fffdf7" stroke-width="5"') +
    rect(286, 232, 115, 82, wood, 5) +
    path("M276 213h134q-3 28-67 27-64-1-67-27Z", paper) +
    path("M353 211v-20q0-12 12-12t12 12") +
    rect(427, 195, 30, 49, rose, 3) +
    path("M420 192h46 M433 204v32 M440 204v32", "none", 'stroke-width="1.5"')
  );
}
function choresScene(c, kind) {
  if (kind === "laundry")
    return (
      person(c, { x: 206, y: 240, pose: "standwork" }) +
      desk(258, 236, 117) +
      path("M275 229l13-18 17 6 19-7 18 19-18 3v5h-37v-6Z", rose) +
      rect(387, 215, 85, 103, paper, 7) +
      rect(395, 224, 69, 15, blue, 3) +
      circle(429, 278, 28, ink) +
      circle(429, 278, 22, "#c1d4d4") +
      group(
        path("M412 266q18-13 31 10-4 22-24 13Z", rose),
        "",
        "scene-washing"
      ) +
      circle(452, 231, 3, gold) +
      ellipse(428, 211, 38, 5, rose)
    );
  if (kind === "repair")
    return (
      person(c, { x: 211, y: 240, pose: "cook" }) +
      desk(267, 237, 164) +
      rect(298, 211, 42, 25, wood, 2) +
      group(
        path("M280 176l14 32", "none", `stroke="${wood}" stroke-width="6"`) +
          path("M271 170l16-9 8 15-16 9Z", ink),
        "",
        "scene-hammer"
      ) +
      rect(371, 211, 36, 23, blue, 3) +
      path("M380 211v-6h18v6")
    );
  return (
    person(c, { x: 244, y: 240, pose: "clean" }) +
    path("M314 148L288 299", "none", `stroke="${wood}" stroke-width="6"`) +
    path("M277 293h26l14 30h-53Z", gold) +
    path(
      "M278 302l-5 18 M287 302l-2 19 M296 302l10 18",
      "none",
      'stroke-width="1.4"'
    ) +
    path("M365 278q0-29 20-29t20 29") +
    path("M362 277h46l-5 43h-36Z", blue) +
    ellipse(385, 277, 23, 5, "#dce7e5") +
    group(
      path(
        "M333 299l3 5 5-4 M345 312l5 3 M327 318h5",
        "none",
        'stroke="#b4ac94"'
      ),
      "",
      "scene-dust"
    )
  );
}
function outdoorsScene(c, kind) {
  if (kind === "travel") {
    return (
      path(
        "M138 242l26-59q5-11 21-11h129q18 0 28 13l28 47 43 9q19 4 19 25v30H134v-40q0-10 4-14Z",
        c.accent
      ) +
      path("M181 184h54v49h-74Z", paper) +
      path("M249 184h61q10 0 18 11l21 38H249Z", "#dce9e5") +
      group(
        head(c, c.age, "awake", c.variant),
        "translate(299 283) scale(.62)"
      ) +
      path("M249 233h102 M260 254h20") +
      circle(199, 296, 27, ink) +
      circle(199, 296, 14, paper) +
      circle(366, 296, 27, ink) +
      circle(366, 296, 14, paper) +
      rect(416, 252, 14, 11, gold, 3) +
      path(
        "M98 269H78 M98 281H67",
        "none",
        'stroke="#a8b8aa" class="scene-speed"'
      )
    );
  }
  if (kind === "cycle") {
    let b =
      group(
        circle(181, 285, 43, "none", 'stroke-width="4"') +
          path(
            "M181 242v86 M138 285h86 M150 255l62 61 M150 316l62-61",
            "none",
            'stroke-width="1.2"'
          ),
        "",
        "scene-wheel-left"
      ) +
      group(
        circle(371, 285, 43, "none", 'stroke-width="4"') +
          path(
            "M371 242v86 M328 285h86 M340 255l62 61 M340 316l62-61",
            "none",
            'stroke-width="1.2"'
          ),
        "",
        "scene-wheel-right"
      );
    b +=
      path(
        "M181 285l57-89 49 89H181l124-62 66 62-38-118h-23 M225 195h38",
        "none",
        `stroke="${rose}" stroke-width="7"`
      ) +
      path(
        "M181 285l57-89 49 89H181l124-62 66 62-38-118h-23 M225 195h38",
        "none",
        `stroke="${ink}" stroke-width="1.5"`
      );
    b +=
      path(
        "M267 295l40-20 M260 297h15 M300 277h15",
        "none",
        'stroke-width="3"'
      ) +
      person(c, { x: 237, y: 186, pose: "cycle", scale: 0.83 }) +
      circle(287, 285, 8, wood);
    return b;
  }
  if (kind === "fish")
    return (
      chair(194, 247) +
      person(c, { x: 211, y: 240, pose: "fish" }) +
      path("M274 184q40-55 100-62l4 168", "none", 'stroke-width="2"') +
      ellipse(389, 315, 81, 12, "#c7dcdf", 'stroke="none"') +
      ellipse(
        378,
        310,
        29,
        5,
        "none",
        'stroke="#fffdf7" class="scene-ripples"'
      ) +
      circle(378, 306, 5, rose)
    );
  if (kind === "garden")
    return (
      person(c, { x: 224, y: 240, pose: "water" }) +
      path("M288 200h37v30h-37Z", blue) +
      path("M325 210l25-8 2 7-27 15Z", blue) +
      path("M291 200v-9q15-16 26 9") +
      path(
        "M354 214l5 19m0-16 9 17m-5-18 13 15",
        "none",
        `stroke="${blue}" stroke-dasharray="2 6" class="scene-water"`
      ) +
      plant(379, 320, 0.8) +
      plant(436, 322, 0.54)
    );
  if (kind === "yoga")
    return (
      ellipse(279, 322, 143, 9, c.accent, 'stroke="none"') +
      person(c, { x: 274, y: 281, pose: "yoga", scale: 0.95 })
    );
  if (kind === "ball")
    return (
      person(c, { x: 247, y: 240, pose: "run" }) +
      group(
        circle(376, 300, 23, rose) +
          path(
            "M354 300h44 M376 277q-14 23 0 46 M376 277q14 23 0 46",
            "none",
            'stroke-width="1.3"'
          ),
        "",
        "scene-ball"
      )
    );
  let b = person(c, {
    x: 250,
    y: 240,
    pose: kind === "exercise" ? "exercise" : kind === "run" ? "run" : "walk",
    scale: c.child ? 0.83 : 1,
  });
  if (kind === "pet")
    b +=
      path("M307 188q14 90 53 98", "none", 'stroke-width="1.5"') +
      path(
        "M345 282q16-18 45-7l15-14q21-2 22 20l-11 8-3 22h-10l-2-20h-34l-3 21h-10l-1-25-15-9",
        wood
      ) +
      path("M405 263q-16 3-6 22l9-6Z", ink) +
      circle(419, 273, 2, ink, 'stroke="none"') +
      path("M346 280q-17-3-17-18", "none", `stroke="${wood}" stroke-width="7"`);
  if (kind === "exercise")
    b += rect(171, 176, 11, 27, rose, 3) + rect(319, 175, 11, 27, rose, 3);
  return b;
}
function otherScene(c, kind) {
  if (kind === "play")
    return (
      ellipse(276, 317, 132, 15, "#e3e9db", 'stroke="none"') +
      person(c, { x: 245, y: 284, pose: "floor", scale: c.child ? 0.82 : 1 }) +
      rect(335, 288, 31, 32, blue, 3) +
      rect(365, 290, 30, 30, rose, 3) +
      rect(351, 261, 30, 28, gold, 3) +
      group(
        circle(177, 305, 21, rose) +
          path("M157 301q21-12 39 9", "none", 'stroke-width="1.4"'),
        "",
        "scene-ball"
      )
    );
  if (kind === "care" || kind === "help")
    return (
      person(c, { x: 258, y: 240, pose: "care" }) +
      swaddledBaby(c) +
      plant(438, 320, 0.82)
    );
  if (kind === "shop" || kind === "volunteer")
    return (
      person(c, { x: 214, y: 240, pose: "standwork" }) +
      path("M288 213h22l13 68h92l17-53H316", "#d9e5db") +
      path(
        "M328 238v33 M346 238v33 M364 238v33 M382 238v33 M400 238v33 M320 253h105",
        "none",
        'stroke-width="1.2"'
      ) +
      path("M324 283v14h90") +
      circle(333, 312, 10, ink) +
      circle(403, 312, 10, ink) +
      rect(337, 208, 27, 20, rose, 3) +
      path("M368 226l-4-31h26l-2 31Z", gold) +
      ellipse(397, 215, 9, 14, green)
    );
  if (kind === "dance")
    return (
      person(c, { x: 274, y: 240, pose: "dance" }) +
      rect(122, 267, 58, 53, wood, 4) +
      circle(151, 293, 16, ink) +
      group(
        path("M398 198v-29l22-5v27") +
          ellipse(391, 199, 7, 4, ink) +
          ellipse(413, 192, 7, 4, ink),
        "",
        "scene-notes"
      )
    );
  if (kind === "private")
    return (
      rect(214, 111, 125, 211, c.accent, 4) +
      rect(226, 125, 101, 187, "none", 2) +
      circle(316, 226, 4, gold) +
      path("M263 162l-15 26h44l-14-26") +
      rect(244, 185, 52, 25, paper, 3) +
      path("M259 196h22 M259 201h15", "none", 'stroke-width="1.4"') +
      plant(402, 321, 0.78)
    );
  let b =
    chair(212, 247) +
    person(c, { x: 233, y: 240, pose: kind === "faith" ? "read" : "sit" }) +
    plant(434, 320, 0.8);
  if (kind === "faith")
    b +=
      book(255, 215) +
      desk(349, 280, 68) +
      rect(376, 249, 11, 30, paper, 3) +
      group(
        path("M381 232q-11 12 0 16 9-3 0-16Z", gold, 'stroke="none"'),
        "",
        "scene-flame"
      );
  if (kind === "service" || kind === "appointment")
    b +=
      desk(310, 248, 100) +
      book(351, 239) +
      rect(354, 149, 44, 50, paper, 3) +
      path(
        "M365 174h22 M376 163v22",
        "none",
        `stroke="${rose}" stroke-width="5"`
      );
  if (kind === "unknown")
    b += group(
      circle(299, 113, 3, ink) +
        circle(312, 113, 3, ink) +
        circle(325, 113, 3, ink),
      "",
      "scene-notes"
    );
  return b;
}
export function makeIllustration({
  group: ageGroup,
  kind,
  identity = "",
  label = "",
  minute = 720,
}) {
  if (!SCENE_KINDS.includes(kind)) kind = "unknown";
  const seed = hash(identity),
    colors = [
      { shirt: "#cd8f78", accent: "#a9bdad" },
      { shirt: "#86a9b3", accent: "#d7b899" },
      { shirt: "#d2b365", accent: "#a6b8c1" },
      { shirt: "#9aaf8b", accent: "#d5aaa0" },
    ];
  const c = {
    ...colors[seed % 4],
    skin: ["#e8bd9d", "#d4a27f", "#b88666", "#ecc8aa"][seed % 4],
    hair: ["#62534a", "#4e4b42", "#8a6a50"][seed % 3],
    pants: "#6f7e7b",
    age: ageGroup.age,
    child: !!ageGroup.child,
    variant: seed % 3,
  };
  const night = minute < 360 || minute >= 1140;
  const outside =
    [
      "garden",
      "pet",
      "walk",
      "travel",
      "run",
      "cycle",
      "ball",
      "yoga",
      "swim",
      "exercise",
      "fish",
    ].includes(kind) ||
    (kind === "play" && /outside|outdoor/i.test(label));
  let content = backdrop({ night, style: seed, outdoor: outside, kind });
  if (kind === "sleep") content += sleepingScene(c);
  else if (["work", "computer", "school", "art", "sew"].includes(kind))
    content += deskScene(c, kind);
  else if (
    [
      "read",
      "watch",
      "game",
      "phone",
      "music",
      "listen",
      "family",
      "relax",
    ].includes(kind)
  )
    content += loungeScene(c, kind);
  else if (["cook", "dishes", "eat", "feed"].includes(kind))
    content += kitchenScene(c, kind);
  else if (["wash", "bath", "swim"].includes(kind))
    content += personalScene(c, kind);
  else if (["clean", "laundry", "repair"].includes(kind))
    content += choresScene(c, kind);
  else if (outside && kind !== "play") content += outdoorsScene(c, kind);
  else content += otherScene(c, kind);
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "50 5 460 355");
  svg.setAttribute("class", "scene-illustration");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", ink);
  svg.setAttribute("stroke-width", "2.2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.dataset.kind = kind;
  svg.innerHTML = content;
  return svg;
}
export function createIllustrations() {
  const slots = new Map();
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let moving = true;
  function discard(svg) {
    svg.getAnimations().forEach((animation) => animation.cancel());
    svg.remove();
  }
  function settle(el) {
    const scenes = [...el.querySelectorAll(".scene-illustration")];
    scenes.slice(0, -1).forEach(discard);
    scenes
      .at(-1)
      ?.getAnimations()
      .forEach((animation) => animation.cancel());
  }
  function syncMotion() {
    const active = moving && !document.hidden;
    document.documentElement.dataset.sceneMotion = active
      ? "running"
      : "paused";
    if (!active || reducedMotion.matches)
      for (const el of slots.keys()) settle(el);
  }
  function reveal(el, illustration) {
    // Keep the most visible drawing during rapid changes, avoiding a flash of
    // white when a very short diary activity interrupts an unfinished dissolve.
    const previous = [...el.querySelectorAll(".scene-illustration")].sort(
      (a, b) =>
        Number(getComputedStyle(b).opacity) -
        Number(getComputedStyle(a).opacity)
    );
    const outgoing = previous.shift();
    previous.forEach(discard);
    el.append(illustration);
    if (!outgoing) return;
    if (!moving || document.hidden || reducedMotion.matches) {
      discard(outgoing);
      return;
    }
    const opacity = Number(getComputedStyle(outgoing).opacity);
    outgoing.getAnimations().forEach((animation) => animation.cancel());
    const timing = { duration: 460, easing: "cubic-bezier(.22,.61,.36,1)" };
    const exit = outgoing.animate([{ opacity }, { opacity: 0 }], {
      ...timing,
      fill: "forwards",
    });
    exit.finished.then(() => discard(outgoing)).catch(() => {});
    illustration.animate(
      [
        { opacity: 0, transform: "translateY(5px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      timing
    );
  }
  document.addEventListener("visibilitychange", syncMotion);
  window.addEventListener("pageshow", syncMotion);
  reducedMotion.addEventListener("change", syncMotion);
  return {
    update(el, spec) {
      const kind = sceneKind(spec.code, spec.activity, spec.group),
        night = spec.minute < 360 || spec.minute >= 1140;
      const key = `${spec.identity}:${kind}:${spec.activity.label}:${night}`;
      if (slots.get(el) !== key) {
        reveal(
          el,
          makeIllustration({ ...spec, kind, label: spec.activity.label })
        );
        slots.set(el, key);
      }
      el.dataset.scene = kind;
      el.dataset.code = spec.code;
      el.classList.add("scene-ready");
      syncMotion();
    },
    setMotion(value) {
      moving = value;
      syncMotion();
    },
    refresh: syncMotion,
    get stats() {
      return { contexts: 0, views: slots.size, renderer: "svg" };
    },
  };
}
