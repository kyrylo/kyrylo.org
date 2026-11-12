// Decorative, code-native illustrations; these are characters, not respondent portraits.
const ns = "http://www.w3.org/2000/svg";
export function characterPose(category, code) {
  if (category === "sleep") return "sleep";
  if (
    ["story", "school", "homework", "030203", "120312"].includes(code) ||
    code.startsWith("06")
  )
    return "read";
  if (["wash", "bath", "010201"].includes(code)) return "wash";
  if (code === "020201") return "cook";
  if (code === "030101") return "care";
  if (code === "milk") return "milk";
  if (["play", "120307"].includes(code)) return "play";
  if (code === "120303") return "watch";
  if (code === "outside") return "walk";
  return (
    {
      work: "work",
      travel: "travel",
      personal: "eat",
      care: "clean",
      leisure: "relax",
    }[category] || "stand"
  );
}

export function activityCharacter(group, category, code, identity = "") {
  const svg = document.createElementNS(ns, "svg");
  const pose = characterPose(category, code);
  for (const [key, value] of Object.entries({
    viewBox: "0 0 64 64",
    class: "life-character activity-icon",
    fill: "none",
    stroke: "#52584f",
    "stroke-width": "1.7",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    "aria-hidden": "true",
    focusable: "false",
    "data-pose": pose,
  }))
    svg.setAttribute(key, value);
  const palettes = ["#d8e6dc", "#e7dacc", "#dce3ef", "#edddd6", "#e5e4cb"];
  const hash = [...identity].reduce((n, c) => n + c.charCodeAt(0), 0);
  const shirt = palettes[hash % palettes.length];
  const skin = "#f3e8d9";
  function shape(tag, attrs) {
    const el = document.createElementNS(ns, tag);
    for (const [key, value] of Object.entries(attrs))
      el.setAttribute(key, value);
    svg.append(el);
    return el;
  }
  const path = (d, fill = "none", more = {}) =>
    shape("path", { d, fill, ...more });
  const circle = (cx, cy, r, fill = skin) =>
    shape("circle", { cx, cy, r, fill });
  const rect = (x, y, width, height, fill = "#fff", rx = 2) =>
    shape("rect", { x, y, width, height, rx, fill });
  function head(x = 25, y = 15, asleep = false) {
    const baby = group.age === "Under 1" || group.age === "1–3";
    circle(x, y, baby ? 8 : 7);
    if (baby) path(`M${x - 3} ${y - 7}q2 -5 5 -2`);
    else
      path(
        `M${x - 7} ${y - 1}q-1 -9 8 -7l5 2`,
        group.age === "65+" ? "#d6d5cf" : "#747669"
      );
    path(asleep ? `M${x + 1} ${y + 1}q2 2 4 0` : `M${x + 3} ${y}v.5`);
  }
  function torso() {
    path("M20 25q6-3 12 1l3 14H18Z", shirt);
  }
  function sitting() {
    torso();
    path("M20 41h13l-1 11h7 M23 42l-4 10h7");
  }
  path("M8 57q24 2 49 0", "none", { stroke: "#e6e8e2", "stroke-width": "2" });
  if (pose === "sleep") {
    rect(5, 32, 18, 14, "#f4f2eb", 4);
    head(17, 32, true);
    path("M26 31q22-2 27 13l2 7H10v-7h15Z", shirt);
    path("M32 34q2 7 0 14");
    path("M48 8a7 7 0 1 0 6 10 7 7 0 0 1-6-10Z", "#efe6bf", {
      stroke: "#b2a577",
    });
  } else if (pose === "milk") {
    head(23, 23);
    path("M17 34q14-8 24 9l4 10H15Z", shirt);
    path("M25 38l9-8");
    path("m35 23 6 3-6 13-6-3Z", "#fff");
    path("m36 23 2-4 3 2-1 5");
  } else {
    head();
    if (["read", "work", "eat", "play", "watch", "relax"].includes(pose))
      sitting();
    else {
      torso();
      path(
        ["walk", "travel"].includes(pose)
          ? "M24 41 17 53h-5 M30 40l8 13h7"
          : "M23 41v13h-6 M31 41v13h6"
      );
    }
    if (pose === "read") {
      path("M29 30q7-2 13 2 6-4 13-2v15q-7-2-13 2-6-4-13-2Z", "#f9f5e9");
      path("M42 32v15 M22 30l9 6 M34 35h4 M46 35h5");
    } else if (pose === "work") {
      path("M15 31v13h18 M17 44v10 M40 39v15 M56 39v15 M31 39h29");
      path("m35 25 20 0-3 12H33Z", "#e7eceb");
      path("M24 29l7 7h6");
      circle(45, 31, 1, "#bcc7bd");
    } else if (pose === "eat") {
      path("M34 38h25 M38 38v16 M55 38v16 M24 29l9 4 7-9");
      path("M41 32h13q-1 6-6 6t-7-6", "#e7ded0");
      path("M38 21h6 M41 20v4");
    } else if (pose === "cook") {
      path("M35 42h25 M39 42v12 M55 42v12 M26 29l11 5 6-5");
      path("M40 31h16v6q0 4-4 4h-8q-4 0-4-4Z", "#e8dfca");
      path("M38 31h20 M44 27h9 M44 23q-3-3 0-6 M52 23q-3-3 0-6");
    } else if (pose === "care") {
      path("M22 28q-5 11 9 13l13-6", shirt);
      circle(41, 27, 5);
      path("M36 30q-11 0-7 10 13 4 15-5Z", "#eadcca");
    } else if (pose === "clean") {
      path("M24 29l12 6 8-12 M44 16l-4 31");
      path("M35 45h11l5 10H30Z", "#e4d9bc");
      path("M37 49l-2 5 M41 49v5 M45 49l2 5");
    } else if (pose === "wash") {
      circle(49, 17, 9, "#edf2ef");
      path("M26 30l10-9 M19 28l-4-9 5-4");
      path("M33 29h13v13H33Z", "#e3e6f0");
      path("M37 31v8 M41 31v8");
    } else if (pose === "play") {
      path("M23 29l8 6 9-3 M29 42l-3 10h10");
      if (group.child) {
        rect(40, 45, 12, 11, "#e7d9c3");
        rect(48, 34, 10, 10, "#dbe5dc");
        circle(42, 38, 4, "#e8d6cf");
      } else {
        path("M33 29h12q5 9 1 10l-6-3-5 3q-5-1-2-10Z", "#e9e3d8");
        path("M35 31v4 M33 33h4 M42 32h.1 M44 34h.1");
      }
    } else if (pose === "watch") {
      rect(40, 20, 20, 18, "#dce5e2");
      path("M44 16l6 4 6-4 M46 42h9 M50 38v4 M21 30l10 4 3-5");
    } else if (["walk", "travel"].includes(pose)) {
      path("M21 28l-9 10 M31 28l9 7");
      rect(39, 35, 12, 13, "#e6d8c4");
      path("M42 35v-3h6v3");
      if (pose === "travel")
        path("M44 15h14m-4-4 4 4-4 4", "none", { stroke: "#899c91" });
      else circle(51, 13, 5, "#eee6c2");
    } else if (pose === "relax") {
      path("M18 29l-5 10h10 M31 29l11-3 3-8 M12 43h23 M13 44v10");
      path("M44 17v-4 M41 16l-2-3");
    } else {
      path("M20 28l-5 12 M31 28l9 5 M39 29v8");
    }
  }
  return svg;
}
