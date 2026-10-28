import * as T from "./vendor/three.module.min.js";
import { RoundedBoxGeometry } from "./vendor/RoundedBoxGeometry.js";
import { ageScale } from "./scene-kinds.js";
const P = {
  ivory: 0xfaf5e8,
  cream: 0xe8dfcd,
  wood: 0xc59c76,
  dark: 0x34463e,
  teal: 0x70a99d,
  blue: 0x80afc7,
  peach: 0xe9a38c,
  pink: 0xe6aeb8,
  yellow: 0xe9c76d,
  green: 0x8caf82,
  white: 0xffffff,
  skin: 0xe9b591,
  hair: 0x665447,
};
const materials = new Map(),
  geometry = new Map();
function mat(color, glow = 0, opacity = 1) {
  const key = `${color}:${glow}:${opacity}`;
  if (!materials.has(key))
    materials.set(
      key,
      new T.MeshStandardMaterial({
        color,
        roughness: 0.65,
        metalness: 0.025,
        emissive: color,
        emissiveIntensity: glow,
        transparent: opacity < 1,
        opacity,
      })
    );
  return materials.get(key);
}
function geo(key, make) {
  if (!geometry.has(key)) geometry.set(key, make());
  return geometry.get(key);
}
function mesh(
  parent,
  g,
  color,
  pos = [0, 0, 0],
  scale = null,
  glow = 0,
  opacity = 1
) {
  const m = new T.Mesh(g, mat(color, glow, opacity));
  m.position.set(...pos);
  if (scale) m.scale.set(...scale);
  m.castShadow = opacity === 1;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
function box(p, w, h, d, c, x = 0, y = 0, z = 0, r = 0.045) {
  const g = geo(
    `b:${w}:${h}:${d}:${r}`,
    () => new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 3, h / 3, d / 3))
  );
  return mesh(p, g, c, [x, y, z]);
}
function ball(
  p,
  r,
  c,
  x = 0,
  y = 0,
  z = 0,
  scale = [1, 1, 1],
  glow = 0,
  opacity = 1
) {
  return mesh(
    p,
    geo("sphere", () => new T.SphereGeometry(1, 16, 12)),
    c,
    [x, y, z],
    scale.map((v) => v * r),
    glow,
    opacity
  );
}
function cyl(p, rt, rb, h, c, x = 0, y = 0, z = 0) {
  return mesh(
    p,
    geo(`c:${rt}:${rb}:${h}`, () => new T.CylinderGeometry(rt, rb, h, 24)),
    c,
    [x, y, z]
  );
}
function ring(p, r, t, c, x = 0, y = 0, z = 0) {
  return mesh(
    p,
    geo(`t:${r}:${t}`, () => new T.TorusGeometry(r, t, 8, 32)),
    c,
    [x, y, z]
  );
}
function group(p, x = 0, y = 0, z = 0) {
  const g = new T.Group();
  g.position.set(x, y, z);
  p.add(g);
  return g;
}
function rod(p, a, b, r, c) {
  const v1 = new T.Vector3(...a),
    v2 = new T.Vector3(...b),
    delta = v2.clone().sub(v1);
  const m = cyl(p, r, r, delta.length(), c);
  m.position.copy(v1.add(v2).multiplyScalar(0.5));
  m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize());
  return m;
}
function tube(p, points, r, c) {
  return mesh(
    p,
    new T.TubeGeometry(
      new T.CatmullRomCurve3(points.map((v) => new T.Vector3(...v))),
      16,
      r,
      6,
      false
    ),
    c
  );
}
function book(p, x, y, z, color = P.peach, open = false) {
  const g = group(p, x, y, z);
  box(g, 0.4, 0.065, 0.3, color);
  box(g, 0.365, 0.038, 0.277, P.ivory, 0, 0.01, 0);
  if (open) {
    box(g, 0.22, 0.017, 0.28, P.ivory, -0.105, 0.055, 0).rotation.z = -0.16;
    box(g, 0.22, 0.017, 0.28, P.ivory, 0.105, 0.055, 0).rotation.z = 0.16;
    for (let i = 0; i < 4; i++)
      box(g, 0.13, 0.003, 0.008, P.cream, -0.11, 0.074, -0.09 + i * 0.05);
  }
  return g;
}
function plant(p, x, z, size = 1) {
  const g = group(p, x, 0.04, z);
  g.scale.setScalar(size);
  cyl(g, 0.19, 0.14, 0.3, P.peach, 0, 0.15);
  cyl(g, 0.15, 0.15, 0.018, 0x675746, 0, 0.302);
  for (let i = 0; i < 5; i++) {
    const a = i * 2.399;
    rod(
      g,
      [0, 0.3, 0],
      [Math.cos(a) * 0.15, 0.68 + Math.sin(i) * 0.13, Math.sin(a) * 0.15],
      0.012,
      P.green
    );
    const l = ball(
      g,
      0.17,
      i % 2 ? 0x719873 : 0x99b982,
      Math.cos(a) * 0.2,
      0.66 + Math.sin(i) * 0.13,
      Math.sin(a) * 0.2,
      [0.55, 1.3, 0.8]
    );
    l.rotation.z = Math.cos(a) * 0.6;
  }
  return g;
}
function lamp(p, x, z) {
  const g = group(p, x, 0, z);
  cyl(g, 0.19, 0.22, 0.07, P.dark, 0, 0.05);
  rod(g, [0, 0.05, 0], [0, 1.1, 0], 0.022, P.wood);
  cyl(g, 0.15, 0.27, 0.32, P.yellow, 0, 1.2);
  ball(g, 0.075, P.ivory, 0, 1.06, 0, [1, 1, 1], 0.65);
  return g;
}
function table(
  p,
  x = 0,
  z = 0.25,
  h = 0.73,
  w = 1.3,
  d = 0.65,
  color = P.wood
) {
  const g = group(p, x, 0, z);
  box(g, w, 0.09, d, color, 0, h, 0).name = "tabletop";
  for (const dx of [-1, 1])
    for (const dz of [-1, 1])
      box(
        g,
        0.07,
        h,
        0.07,
        P.wood,
        dx * (w / 2 - 0.1),
        h / 2,
        dz * (d / 2 - 0.1)
      );
  return g;
}
function chair(p, x, z, size = 1, c = P.teal) {
  const g = group(p, x, 0, z);
  g.userData.seatHeight = 0.53;
  g.userData.seatFront = 0.25;
  g.scale.setScalar(size);
  box(g, 0.55, 0.12, 0.5, c, 0, 0.47);
  box(g, 0.55, 0.6, 0.1, c, 0, 0.74, -0.22);
  for (const a of [-1, 1])
    for (const b of [-1, 1])
      rod(
        g,
        [a * 0.21, 0.43, b * 0.18],
        [a * 0.26, 0.03, b * 0.22],
        0.035,
        P.wood
      );
  return g;
}
function cup(p, x, y, z, c = P.ivory) {
  cyl(p, 0.08, 0.065, 0.16, c, x, y, z);
  cyl(p, 0.061, 0.061, 0.006, 0x685240, x, y + 0.082, z);
  ring(p, 0.047, 0.014, c, x + 0.087, y, z).rotation.y = Math.PI / 2;
}
function rug(p, c = P.peach) {
  const m = box(p, 1.95, 0.025, 1.5, c, 0, 0.023, 0.16, 0.12);
  return m;
}
function frame(p, x, y, z, c = P.yellow) {
  box(p, 0.5, 0.4, 0.035, P.wood, x, y, z);
  box(p, 0.42, 0.32, 0.04, P.ivory, x, y, z + 0.02);
  ball(p, 0.09, c, x - 0.07, y + 0.03, z + 0.047, [1, 1, 0.1]);
  box(p, 0.22, 0.04, 0.018, P.teal, x + 0.04, y - 0.07, z + 0.044);
}
// The setting follows the activity; a stable variation makes each diary its own place.
function roomStyle(s) {
  const k = s.kind;
  if (["sleep", "care", "play"].includes(k) && s.group.child) return "nursery";
  if (k === "sleep") return s.seed % 2 ? "bedroom" : "cottage";
  if (["bath", "wash", "laundry"].includes(k)) return "tile";
  if (["cook", "dishes", "eat", "feed"].includes(k)) return "kitchen";
  if (["work", "computer"].includes(k))
    return ["loft", "studio", "library"][s.seed % 3];
  if (k === "repair") return "loft";
  if (["school", "art", "sew"].includes(k)) return "studio";
  if (["read", "music", "listen"].includes(k)) return "library";
  if (["watch", "game"].includes(k)) return s.seed % 2 ? "media" : "cottage";
  return ["cottage", "library", "bedroom"][s.seed % 3];
}
function windowBox(s, style) {
  const round = style === "nursery" || style === "cottage";
  const wide = style === "loft" || style === "media";
  const g = group(s.root, wide ? 0.32 : 0.7, 1.12, -1.25);
  g.name = `window-${round ? "round" : wide ? "panoramic" : "sash"}`;
  if (round) {
    const rim = cyl(g, 0.43, 0.43, 0.055, P.ivory);
    rim.rotation.x = Math.PI / 2;
    s.sky = cyl(g, 0.365, 0.365, 0.06, 0xb9dbe3, 0, 0, 0.014);
    s.sky.rotation.x = Math.PI / 2;
    box(g, 0.035, 0.73, 0.04, P.ivory, 0, 0, 0.062);
    box(g, 0.73, 0.035, 0.04, P.ivory, 0, 0, 0.062);
  } else {
    const width = wide ? 1.68 : 0.83;
    box(g, width + 0.13, 0.91, 0.065, wide ? P.dark : P.ivory);
    s.sky = box(g, width, 0.78, 0.07, 0xb9dbe3, 0, 0, 0.01);
    for (const x of wide ? [-0.55, 0, 0.55] : [0])
      box(g, 0.025, 0.8, 0.04, wide ? P.dark : P.ivory, x, 0, 0.07);
    box(g, width, 0.025, 0.04, wide ? P.dark : P.ivory, 0, 0, 0.07);
    box(g, width + 0.22, 0.065, 0.2, P.ivory, 0, -0.48, 0.02);
    if (["bedroom", "library"].includes(style)) {
      for (const x of [-0.51, 0.51]) {
        box(g, 0.17, 1.12, 0.13, s.colors.curtain, x, -0.01, 0.12);
        for (const d of [-0.05, 0.015, 0.07])
          rod(g, [x + d, -0.55, 0.19], [x + d, 0.53, 0.19], 0.014, P.ivory);
      }
      rod(g, [-0.65, 0.57, 0.12], [0.65, 0.57, 0.12], 0.019, P.wood);
    }
  }
  s.sun = ball(g, 0.09, P.yellow, 0.17, 0.18, 0.065, [1, 1, 0.2], 0.2);
  s.moon = ball(g, 0.085, P.ivory, -0.17, 0.18, 0.065, [1, 1, 0.2], 0.2);
  for (let i = 0; i < 3; i++)
    s.dayObjects.push(
      ball(g, 0.06, P.white, -0.21 + i * 0.065, 0.13, 0.065, [1.4, 0.6, 0.17])
    );
  if (wide) {
    // Tiny rooftops stay visible after sunset.
    for (let i = 0; i < 7; i++) {
      const h = 0.11 + ((i + s.seed) % 3) * 0.055;
      box(g, 0.17, h, 0.012, 0x91acb5, -0.69 + i * 0.22, -0.38 + h / 2, 0.054);
    }
  }
}
function bookshelf(s) {
  const p = group(s.root, -0.84, 0, -1.16);
  p.name = "bookcase";
  box(p, 0.81, 1.48, 0.1, P.wood, 0, 0.79, -0.045);
  for (const x of [-0.39, 0.39])
    box(p, 0.045, 1.48, 0.27, P.wood, x, 0.79, 0.04);
  for (let row = 0; row < 4; row++) {
    const y = 0.14 + row * 0.35;
    box(p, 0.79, 0.045, 0.3, P.wood, 0, y, 0.06);
    for (let i = 0; i < 6; i++) {
      const h = 0.19 + ((i + row + s.seed) % 3) * 0.035;
      const color = [P.teal, P.peach, P.ivory, P.blue, P.yellow][(i + row) % 5];
      box(
        p,
        0.085,
        h,
        0.16,
        color,
        -0.29 + i * 0.111,
        y + 0.023 + h / 2,
        0.09,
        0.008
      );
      box(
        p,
        0.056,
        0.015,
        0.008,
        P.ivory,
        -0.29 + i * 0.111,
        y + h - 0.025,
        0.175
      );
    }
  }
}
function landscape(s, water) {
  const p = s.root,
    k = s.kind;
  const city = k === "travel",
    zen = k === "yoga",
    shore = water || k === "fish";
  s.setting = city
    ? "city"
    : zen
    ? "terrace"
    : shore
    ? "waterside"
    : ["walk", "run", "cycle"].includes(k)
    ? "woodland"
    : "garden";
  if (city) {
    for (let i = 0; i < 4; i++) {
      const h = 0.65 + ((s.seed + i) % 3) * 0.28;
      const g = group(p, -1.18 + i * 0.77, 0, -1.05);
      box(
        g,
        0.58,
        h,
        0.35,
        [P.peach, P.blue, P.cream, P.teal][i],
        0,
        h / 2 + 0.04
      );
      box(g, 0.64, 0.06, 0.4, P.ivory, 0, h + 0.05);
      for (let y = 0.3; y < h; y += 0.25)
        for (const x of [-0.15, 0.15])
          box(g, 0.11, 0.14, 0.018, P.ivory, x, y, 0.19);
    }
    return;
  }
  if (zen || water) {
    for (let i = 0; i < 8; i++) {
      const x = -1.35 + i * 0.39;
      rod(p, [x, 0.05, -1.15], [x, zen ? 0.7 : 0.4, -1.15], 0.022, P.wood);
    }
    rod(
      p,
      [-1.4, zen ? 0.7 : 0.4, -1.15],
      [1.4, zen ? 0.7 : 0.4, -1.15],
      0.026,
      P.wood
    );
    for (let i = 0; i < 9; i++)
      box(
        p,
        3.04,
        0.008,
        0.01,
        zen ? 0xc4aa87 : P.ivory,
        0,
        0.047,
        -1.18 + i * 0.29
      );
    plant(p, -1.2, -0.9, 0.9);
    plant(p, 1.2, -0.9, 0.65);
    return;
  }
  for (let i = 0; i < (shore ? 2 : 3); i++) {
    const t = group(p, -1.1 + i * 1.04, 0, -1.04);
    rod(t, [0, 0, 0], [0, 1.12, 0], 0.046, P.wood);
    const crown = group(t, 0, 1.03, 0);
    if (s.setting === "woodland") {
      for (let n = 0; n < 3; n++)
        cyl(
          crown,
          0.015,
          0.38 - n * 0.065,
          0.47,
          [0x86a48d, 0x71967f, 0xa2b68e][i],
          0,
          n * 0.22 - 0.22
        );
    } else {
      for (const [x, y] of [
        [-0.15, -0.1],
        [0.14, -0.06],
        [0, 0.2],
      ])
        ball(
          crown,
          0.27,
          [0x9bb589, 0xb8be8c, 0xc1af8e][(i + s.seed) % 3],
          x,
          y,
          0,
          [1, 1.15, 0.85]
        );
    }
    s.animate.push(
      (time) => (crown.rotation.z = Math.sin(time * 0.55 + i) * 0.035)
    );
  }
  if (s.setting === "woodland") {
    for (let i = 0; i < 7; i++)
      ball(
        p,
        0.14,
        0xc7c4b1,
        -1.22 + i * 0.39,
        0.06,
        0.85 + 0.08 * Math.sin(i),
        [1.1, 0.12, 0.7]
      );
  } else {
    for (let i = 0; i < 8; i++) {
      const x = i < 4 ? -1.35 : 1.35,
        z = -0.65 + (i % 4) * 0.47;
      rod(p, [x, 0.04, z], [x, 0.17, z], 0.012, P.green);
      for (let n = 0; n < 5; n++)
        ball(
          p,
          0.03,
          i % 2 ? P.peach : P.ivory,
          x + 0.04 * Math.cos(n * 1.257),
          0.19 + 0.04 * Math.sin(n * 1.257),
          z,
          [1, 1, 0.4]
        );
      ball(p, 0.022, P.yellow, x, 0.19, z + 0.02);
    }
  }
}
function room(s, { outdoor = false, water = false } = {}) {
  const p = s.root,
    c = s.colors,
    style = roomStyle(s);
  s.setting = style;
  const tile = ["tile", "kitchen"].includes(style);
  const floor = outdoor
    ? water
      ? 0x82c4d4
      : s.kind === "yoga"
      ? 0xd8be9b
      : 0xb7c5a1
    : tile
    ? 0xf3ecdd
    : style === "loft"
    ? 0xcbb59e
    : 0xe9dbbd;
  box(p, 3.25, 0.18, 2.8, c.base, 0, -0.09, 0, 0.14);
  box(p, 3.12, 0.045, 2.67, floor, 0, 0.018, 0, 0.1);
  if (outdoor) {
    landscape(s, water);
    return;
  }
  const sideHeight = ["loft", "studio", "media"].includes(style) ? 0.84 : 1.62;
  box(p, 3.25, 1.74, 0.1, c.wall, 0, 0.87, -1.35);
  box(p, 0.1, sideHeight, 2.8, c.wall, -1.575, sideHeight / 2, 0);
  box(p, 3.08, 0.065, 0.08, P.ivory, 0, 0.09, -1.26);
  box(p, 0.08, 0.065, 2.59, P.ivory, -1.49, 0.09, 0);
  if (tile) {
    for (let x = 0; x < 8; x++)
      for (let z = 0; z < 7; z++) {
        box(
          p,
          0.376,
          0.008,
          0.365,
          (x + z) % 2 ? 0xe8ddce : 0xf8f2e7,
          -1.35 + x * 0.386,
          0.044,
          -1.13 + z * 0.376,
          0.012
        );
      }
    for (let y = 0; y < 4; y++)
      for (let x = 0; x < 10; x++)
        box(
          p,
          0.298,
          0.15,
          0.02,
          (x + y + s.seed) % 5 === 0 ? c.accent : P.ivory,
          -1.39 + x * 0.309,
          0.22 + y * 0.163,
          -1.285,
          0.01
        );
  } else {
    for (let i = 0; i < 9; i++)
      box(p, 0.007, 0.003, 2.6, 0xd2c2a9, -1.34 + i * 0.34, 0.044, 0);
    for (let i = 0; i < 9; i++)
      for (let z = 0; z < 3; z++)
        box(
          p,
          0.325,
          0.003,
          0.007,
          0xd2c2a9,
          -1.17 + i * 0.34,
          0.044,
          -0.9 + z * 0.87 + (i % 2) * 0.3
        );
  }
  if (style === "nursery") {
    for (let row = 0; row < 3; row++)
      for (let col = 0; col < 4; col++)
        ball(
          p,
          0.045,
          [P.peach, P.yellow, P.ivory][(row + col) % 3],
          -1.29 + col * 0.34,
          0.9 + row * 0.27,
          -1.287,
          [1, 1, 0.16]
        );
    // A soft two-tone wall and tiny bunting make a recognisable nursery.
    box(p, 3.1, 0.62, 0.022, c.accent, 0, 0.38, -1.284);
    rod(p, [-1.4, 1.62, -1.24], [-0.1, 1.45, -1.24], 0.009, P.wood);
    for (let i = 0; i < 6; i++) {
      const flag = cyl(
        p,
        0.085,
        0,
        0.13,
        [P.peach, P.yellow, P.teal][i % 3],
        -1.28 + i * 0.21,
        1.55 - i * 0.027,
        -1.23
      );
      flag.scale.z = 0.12;
    }
  } else if (style === "loft") {
    for (let row = 0; row < 8; row++)
      for (let col = 0; col < 3; col++)
        box(
          p,
          0.33,
          0.14,
          0.022,
          (row + col) % 3 ? 0xd5b8a3 : 0xe3c9b4,
          -1.38 + col * 0.35 + (row % 2) * 0.04,
          0.23 + row * 0.18,
          -1.285,
          0.014
        );
  } else if (["bedroom", "cottage", "media"].includes(style)) {
    box(p, 3.1, 0.53, 0.025, c.accent, 0, 0.35, -1.285);
    for (let i = 0; i < 15; i++)
      box(p, 0.018, 0.49, 0.026, P.ivory, -1.42 + i * 0.203, 0.35, -1.266);
    box(p, 3.12, 0.04, 0.07, P.ivory, 0, 0.63, -1.26);
    if (style !== "media") frame(p, -0.78, 1.18, -1.284, c.accent);
  }
  windowBox(s, style);
  if (style === "library") bookshelf(s);
  if (style === "studio" && s.kind !== "school") {
    box(p, 0.86, 0.7, 0.035, P.wood, -0.79, 1.23, -1.28);
    for (let i = 0; i < 3; i++) {
      const paper = box(
        p,
        0.2,
        0.27,
        0.012,
        [P.ivory, P.yellow, P.peach][i],
        -1.03 + i * 0.24,
        1.23 + (i % 2) * 0.09,
        -1.25,
        0.005
      );
      paper.rotation.z = (i - 1) * 0.12;
      ball(
        p,
        0.014,
        P.teal,
        paper.position.x,
        paper.position.y + 0.105,
        -1.235
      );
    }
  }
}
function doll(
  s,
  {
    x = 0,
    z = 0,
    mode = "stand",
    scale = 1,
    age = s.group,
    rotation = 0,
    shirt = s.colors.shirt,
  } = {}
) {
  const root = group(s.root, x, 0, z);
  root.scale.setScalar(ageScale(age) * scale);
  root.rotation.y = rotation;
  const hips = group(root, 0, 0.7, 0),
    body = group(hips, 0, 0, 0);
  box(body, 0.37, 0.43, 0.26, shirt, 0, 0.19, 0, 0.09);
  // The pelvis and legs stay on the seat while the torso leans independently.
  box(hips, 0.36, 0.13, 0.25, 0x566977, 0, -0.045, 0, 0.035);
  const neck = cyl(body, 0.065, 0.065, 0.12, s.colors.skin, 0, 0.47);
  const head = group(body, 0, 0.63, 0);
  ball(head, 0.225, s.colors.skin, 0, 0, 0, [1, 1.06, 0.96]);
  const baby = age.age === "Under 1" || age.age === "1–3";
  if (baby) head.scale.setScalar(1.18);
  const hair = age.age === "65+" ? 0xb7b7af : s.colors.hair;
  if (baby) {
    tube(
      head,
      [
        [0, 0.215, 0],
        [0.045, 0.3, 0],
        [0.08, 0.26, 0],
      ],
      0.026,
      hair
    );
  } else {
    ball(head, 0.228, hair, 0, 0.095, -0.027, [1, 0.73, 0.91]);
    for (let i = 0; i < 4; i++)
      ball(head, 0.075, hair, -0.15 + i * 0.085, 0.15, 0.117, [1, 1, 0.7]);
  }
  const eyes = [];
  for (const a of [-1, 1]) {
    eyes.push(
      ball(head, 0.024, 0x343c39, a * 0.075, 0.018, 0.204, [0.7, 1, 1])
    );
    ball(head, 0.025, 0xe5a292, a * 0.115, -0.04, 0.18, [1.3, 0.55, 0.28]);
    ball(head, 0.044, s.colors.skin, a * 0.224, -0.006, 0, [0.5, 1, 0.65]);
  }
  ball(head, 0.025, s.colors.skin, 0, -0.018, 0.224, [0.8, 0.85, 0.85]);
  tube(
    head,
    [
      [-0.033, -0.075, 0.201],
      [0, -0.086, 0.212],
      [0.032, -0.075, 0.202],
    ],
    0.008,
    0xb17867
  );
  if (age.age === "65+") {
    for (const a of [-1, 1]) {
      ring(head, 0.045, 0.008, 0x8c795d, a * 0.075, 0.02, 0.228);
    }
    rod(head, [-0.03, 0.02, 0.229], [0.03, 0.02, 0.229], 0.006, P.wood);
  }
  function limb(side, leg = false) {
    const pivot = group(
      leg ? hips : body,
      side * (leg ? 0.105 : 0.245),
      leg ? -0.08 : 0.34,
      0
    );
    const upper = leg ? 0.28 : 0.22,
      lower = leg ? 0.27 : 0.2,
      r = leg ? 0.066 : 0.052;
    const upperBone = rod(
      pivot,
      [0, 0, 0],
      [0, -upper, 0],
      r,
      leg ? 0x566977 : shirt
    );
    const thigh = leg
      ? box(pivot, 0.155, 0.32, 0.12, 0x566977, 0, -0.16, 0, 0.05)
      : null;
    if (thigh) thigh.visible = false;
    ball(pivot, r, leg ? 0x566977 : shirt);
    const elbow = group(pivot, 0, -upper, 0);
    const lowerBone = rod(
      elbow,
      [0, 0, 0],
      [0, -lower, 0],
      r * 0.83,
      leg ? 0x566977 : s.colors.skin
    );
    ball(elbow, r * 0.84, leg ? 0x566977 : s.colors.skin);
    const shoe = leg
      ? box(elbow, 0.15, 0.095, 0.24, P.ivory, 0, -lower, 0.035, 0.04)
      : null;
    if (leg) shoe.name = "seated-shoe";
    else ball(elbow, 0.064, s.colors.skin, 0, -lower, 0, [0.85, 1, 1]);
    return { pivot, elbow, upperBone, lowerBone, thigh, shoe };
  }
  const arms = [limb(-1), limb(1)],
    legs = [limb(-1, true), limb(1, true)];
  const rig = {
    root,
    hips,
    body,
    head,
    arms,
    legs,
    eyes,
    mode,
    phase: (s.seed % 91) / 13,
  };
  rig.update = (time) => {
    const t = time + rig.phase,
      sw = Math.sin(t * 3),
      idle = Math.sin(t * 1.8);
    hips.position.y = 0.7;
    body.rotation.set(0, 0, 0);
    head.rotation.set(0, 0.035 * Math.sin(t * 0.75), 0.015 * idle);
    for (const a of arms) {
      a.pivot.rotation.set(0, 0, 0);
      a.elbow.rotation.set(-0.12, 0, 0);
    }
    for (const l of legs) {
      l.pivot.rotation.set(0, 0, 0);
      l.elbow.rotation.set(0, 0, 0);
    }
    const seated = [
      "sit",
      "work",
      "read",
      "eat",
      "game",
      "phone",
      "art",
      "school",
      "watch",
      "feed",
      "music",
      "faith",
    ].includes(rig.mode);
    if (seated) {
      hips.position.y = rig.seat ? 0.64 : 0.6;
      for (const [i, l] of legs.entries()) {
        l.pivot.rotation.x = rig.seat ? -Math.PI / 2 : -1;
        l.elbow.rotation.x = rig.seat ? Math.PI / 2 : 1;
        if (rig.seat) {
          l.pivot.position.y = -0.05;
          // Children on a full-size couch dangle their feet, with a small alternating swing.
          if (rig.seat.dangling)
            l.elbow.rotation.x += 0.1 * Math.sin(t * 1.7 + i * 1.5);
          l.elbow.position.y = -0.32;
          l.thigh.visible = true;
          l.upperBone.visible = false;
          const shin = rig.seat.shin;
          l.lowerBone.scale.y = shin / 0.27;
          l.lowerBone.position.y = -shin / 2;
          l.shoe.position.y = -shin;
        }
      }
      if (rig.seat)
        body.rotation.x =
          rig.seat.style === "sofa" ? -0.1 + idle * 0.006 : 0.025;
    }
    if (["walk", "run", "shop", "travel", "clean"].includes(rig.mode)) {
      const speed = rig.mode === "run" ? 1.75 : 1;
      const gait = Math.sin(t * 4.4 * speed);
      hips.position.y = 0.7 + Math.abs(gait) * 0.034;
      legs.forEach((l, i) => {
        l.pivot.rotation.x = gait * (i ? 1 : -1) * 0.52;
        l.elbow.rotation.x = Math.max(0, -gait * (i ? 1 : -1)) * 0.7;
      });
      arms.forEach((a, i) => (a.pivot.rotation.x = gait * (i ? -1 : 1) * 0.43));
    }
    if (["work", "school", "art", "game"].includes(rig.mode)) {
      arms.forEach((a, i) => {
        a.pivot.rotation.x = -0.8 + Math.sin(t * (i ? 8 : 7)) * 0.045;
        a.elbow.rotation.x = -0.8 + Math.sin(t * 6 + i) * 0.06;
      });
      head.rotation.x = 0.12;
    }
    if (rig.mode === "read") {
      arms.forEach((a) => {
        a.pivot.rotation.x = -0.68;
        a.elbow.rotation.x = -1.1;
      });
      head.rotation.x = 0.18 + 0.04 * Math.sin(t);
    }
    if (rig.mode === "eat" || rig.mode === "feed") {
      arms[1].pivot.rotation.x = -0.65 - 0.35 * (idle * 0.5 + 0.5);
      arms[1].elbow.rotation.x = -0.6 - 0.85 * (idle * 0.5 + 0.5);
      arms[0].pivot.rotation.x = -0.6;
    }
    if (["cook", "dishes", "wash"].includes(rig.mode)) {
      arms[0].pivot.rotation.x = -0.85;
      arms[0].elbow.rotation.x = -0.6;
      arms[1].pivot.rotation.set(
        -0.9 + 0.1 * Math.sin(t * 2),
        0.18 * Math.cos(t * 2),
        0.1 * Math.sin(t * 2)
      );
      arms[1].elbow.rotation.x = -0.7;
      head.rotation.x = 0.14;
    }
    if (["care", "help"].includes(rig.mode)) {
      arms.forEach((a, i) => {
        a.pivot.rotation.set(-0.7, 0, i ? -0.25 : 0.25);
        a.elbow.rotation.x = -1.25;
      });
      body.rotation.z = 0.055 * Math.sin(t * 1.4);
      head.rotation.x = 0.16;
    }
    if (rig.mode === "play") {
      hips.position.y = 0.39;
      legs.forEach((l, i) => {
        l.pivot.rotation.set(-1.1, 0, i ? -0.45 : 0.45);
        l.elbow.rotation.x = 1.2;
      });
      arms.forEach((a, i) => {
        a.pivot.rotation.x = -0.7 + 0.23 * Math.sin(t * 2 + i);
        a.elbow.rotation.x = -0.5;
      });
      head.rotation.x = 0.17;
    }
    if (rig.mode === "exercise") {
      arms.forEach((a, i) => {
        a.pivot.rotation.z = (i ? 1 : -1) * (0.4 + 0.5 * (idle + 1));
        a.elbow.rotation.x = -0.65;
      });
      hips.position.y = 0.65 + 0.04 * idle;
    }
    if (rig.mode === "yoga") {
      arms.forEach((a, i) => (a.pivot.rotation.z = (i ? 1 : -1) * 2.1));
      legs[1].pivot.rotation.z = -0.6;
      legs[1].elbow.rotation.x = 1;
      hips.position.y = 0.69 + 0.008 * idle;
    }
    if (rig.mode === "phone") {
      arms[1].pivot.rotation.set(-0.35, 0, -0.3);
      arms[1].elbow.rotation.x = -2.3;
      head.rotation.z = -0.09;
    }
    if (rig.mode === "music") {
      arms[0].pivot.rotation.x = -0.75;
      arms[1].pivot.rotation.x = -0.6 + 0.18 * Math.sin(t * 4);
      arms[1].elbow.rotation.x = -0.8;
      body.rotation.z = 0.035 * sw;
    }
    if (rig.mode === "sleep") {
      arms.forEach((a) => (a.pivot.rotation.x = -0.2));
      eyes.forEach((e) => (e.scale.y = 0.008));
      body.scale.y = 1 + 0.014 * idle;
    } else {
      body.scale.y = 1;
      const blink = Math.sin(t * 0.8) > 0.997;
      eyes.forEach((e) => (e.scale.y = blink ? 0.003 : 0.024));
    }
    if (rig.seat && ["sit", "watch", "phone"].includes(rig.mode)) {
      // Rest wrists on the thighs instead of letting the arms hang through upholstery.
      reachHand(rig, 0, -0.16, 0.72, 0.24);
      if (rig.mode !== "phone") reachHand(rig, 1, 0.16, 0.72, 0.25);
    }
    if (
      [
        "relax",
        "wait",
        "stand",
        "faith",
        "family",
        "appointment",
        "unknown",
        "private",
      ].includes(rig.mode)
    ) {
      if (!seated) hips.position.y = 0.7 + 0.009 * idle;
      if (rig.mode === "faith") {
        arms.forEach((a, i) => {
          a.pivot.rotation.set(-0.6, 0, i ? -0.4 : 0.4);
          a.elbow.rotation.x = -1.8;
        });
      }
    }
  };
  s.people.push(rig);
  rig.update(0);
  return rig;
}
function steam(s, x, y, z) {
  for (let i = 0; i < 5; i++) {
    const puff = ball(s.root, 0.065, P.ivory, x, y, z, [1, 1, 1], 0.2, 0.45);
    puff.castShadow = false;
    puff.material = puff.material.clone();
    s.dynamicMaterials.push(puff.material);
    s.animate.push((t) => {
      const phase = (t * 0.24 + i / 5) % 1;
      puff.position.set(
        x + Math.sin(phase * 7 + i) * 0.055,
        y + phase * 0.65,
        z + Math.cos(phase * 5) * 0.03
      );
      puff.scale.setScalar(0.035 + phase * 0.075);
      puff.material.opacity = Math.max(0.03, (1 - phase) * 0.32);
    });
  }
}
// Place wrists on props instead of merely playing a generic arm pose.
function reachLimb(r, index, x, y, z, leg = false) {
  const arm = (leg ? r.legs : r.arms)[index];
  const upper = leg ? 0.28 : 0.22,
    lower = leg ? 0.27 : 0.2;
  const target = new T.Vector3(x, y - r.hips.position.y, z);
  if (!leg)
    target
      .applyQuaternion(r.body.quaternion.clone().invert())
      .divide(r.body.scale);
  const delta = target.sub(arm.pivot.position);
  const distance = Math.max(
    0.025,
    Math.min(upper + lower - 0.001, delta.length())
  );
  const direction = delta.normalize();
  const bend = new T.Vector3(0, -1, 0).addScaledVector(direction, direction.y);
  if (bend.lengthSq() < 0.001) bend.set(0, 0, -1);
  bend.normalize();
  const along =
    (upper * upper + distance * distance - lower * lower) / (2 * distance);
  const elbow = direction
    .clone()
    .multiplyScalar(along)
    .addScaledVector(
      bend,
      Math.sqrt(Math.max(0, upper * upper - along * along))
    );
  arm.pivot.quaternion.setFromUnitVectors(
    new T.Vector3(0, -1, 0),
    elbow.clone().normalize()
  );
  const forearm = direction
    .multiplyScalar(distance)
    .sub(elbow)
    .applyQuaternion(arm.pivot.quaternion.clone().invert())
    .normalize();
  arm.elbow.quaternion.setFromUnitVectors(new T.Vector3(0, -1, 0), forearm);
}
function reachHand(r, index, x, y, z) {
  reachLimb(r, index, x, y, z);
}
function reachProp(r, index, prop, x = 0, y = 0, z = 0, leg = false) {
  prop.updateWorldMatrix(true, false);
  r.root.updateWorldMatrix(true, false);
  const point = r.root.worldToLocal(prop.localToWorld(new T.Vector3(x, y, z)));
  reachLimb(r, index, point.x, point.y, point.z, leg);
}
function sitOn(r, furniture, { x = 0, z = 0, style = "chair" } = {}) {
  furniture.updateWorldMatrix(true, false);
  r.root.updateWorldMatrix(true, false);
  furniture.attach(r.root);
  r.root.rotation.set(0, 0, 0);
  const scale = r.root.scale.y;
  // Even the youngest sitter's knees clear the cushion's front edge.
  const front = furniture.userData.seatFront + 0.04 - 0.32 * scale;
  r.root.position.set(
    x,
    furniture.userData.seatHeight - 0.53 * scale,
    Math.max(z, front)
  );
  r.root.updateWorldMatrix(true, false);
  const origin = r.root.getWorldPosition(new T.Vector3());
  const floor = r.root.worldToLocal(new T.Vector3(origin.x, 0.045, origin.z)).y;
  const dangling = scale < 0.9;
  r.seat = {
    style,
    dangling,
    // Adult soles meet the floor. Shorter children keep their own leg proportions.
    shin: dangling ? 0.3 : 0.59 - floor - 0.0475,
    furniture,
  };
  return r;
}
function laptop(s, parent, x, surface, z) {
  const g = group(parent, x, surface + 0.017, z);
  g.name = "laptop";
  // Local +Z is the keyboard/user side. The user sits at -Z in a workstation.
  g.rotation.y = Math.PI;
  box(g, 0.59, 0.034, 0.4, 0x708180).name = "laptop-base";
  const lid = group(g, 0, 0.017, -0.19);
  lid.rotation.x = -0.2;
  box(lid, 0.59, 0.4, 0.027, P.dark, 0, 0.2);
  const screen = box(lid, 0.535, 0.337, 0.012, 0xb8dace, 0, 0.204, 0.02);
  screen.name = "laptop-screen";
  ball(lid, 0.009, P.dark, 0, 0.384, 0.02, [1, 1, 0.4]);
  // A real back cover reads correctly when viewed from behind the display.
  ball(lid, 0.038, 0x9db4ae, 0, 0.215, -0.019, [1, 1, 0.1]);
  box(lid, 0.535, 0.035, 0.006, 0x739c96, 0, 0.35, 0.029);
  for (let i = 0; i < 4; i++) {
    const bar = box(
      lid,
      0.15 + (i % 2) * 0.13,
      0.012,
      0.006,
      i % 2 ? P.ivory : P.teal,
      -0.085 + (i % 2) * 0.04,
      0.295 - i * 0.052,
      0.029
    );
    s.animate.push((t) => (bar.scale.x = 0.85 + 0.15 * Math.sin(t * 1.4 + i)));
  }
  const cursor = box(lid, 0.006, 0.019, 0.007, P.dark, 0.09, 0.139, 0.03);
  s.animate.push((t) => (cursor.visible = Math.sin(t * 4) > -0.3));
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 8; col++)
      box(
        g,
        0.048,
        0.008,
        0.033,
        0xc9d1c9,
        -0.207 + col * 0.059,
        0.021,
        -0.1 + row * 0.048,
        0.004
      ).name = "laptop-key";
  box(g, 0.15, 0.005, 0.016, 0xc9d1c9, 0, 0.021, 0.036, 0.003);
  box(g, 0.17, 0.003, 0.09, 0x93a5a0, 0, 0.019, 0.117, 0.013);
  for (const x of [-0.22, 0.22])
    rod(g, [x - 0.04, 0.024, -0.185], [x + 0.04, 0.024, -0.185], 0.019, P.dark);
  for (const z of [-0.09, -0.02])
    box(g, 0.005, 0.011, 0.039, P.dark, 0.297, 0, z, 0.003);
  return g;
}
function sofa(s, x, z) {
  const p = group(s.root, x, 0, z);
  p.userData.seatHeight = 0.54;
  p.userData.seatFront = 0.32;
  x = 0;
  z = 0;
  box(p, 1.65, 0.3, 0.65, s.colors.accent, x, 0.3, z);
  box(p, 1.65, 0.6, 0.17, s.colors.accent, x, 0.65, z - 0.29);
  for (const side of [-1, 1])
    box(p, 0.18, 0.46, 0.7, s.colors.accent, x + side * 0.78, 0.48, z);
  for (const side of [-1, 1]) {
    box(p, 0.65, 0.1, 0.56, P.ivory, x + side * 0.36, 0.49, z + 0.04);
    box(p, 0.68, 0.38, 0.13, s.colors.accent, side * 0.36, 0.72, -0.14, 0.07);
    // A piping seam and buttons give the upholstery some shape at close range.
    box(p, 0.6, 0.009, 0.01, P.cream, side * 0.36, 0.497, 0.321, 0.003);
    ball(p, 0.015, P.ivory, side * 0.36, 0.73, -0.07, [1, 1, 0.25]);
  }
  for (const x of [-0.65, 0.65])
    for (const z of [-0.22, 0.22])
      box(p, 0.085, 0.11, 0.085, P.wood, x, 0.095, z);
  return p;
}
function bed(s, baby = false) {
  const p = s.root,
    w = baby ? 1.6 : 2.4,
    d = baby ? 1.1 : 1.32;
  box(p, w, 0.25, d, P.wood, 0, 0.24, 0.08, 0.08);
  box(p, w - 0.12, 0.16, d - 0.12, P.ivory, 0, 0.435, 0.08, 0.1);
  box(p, 0.43, 0.13, d * 0.75, P.ivory, -w / 2 + 0.34, 0.56, 0.08, 0.08);
  for (const side of [-1, 1])
    box(p, 0.11, 0.7, d + 0.1, s.colors.accent, (side * w) / 2, 0.45, 0.08);
  if (baby) {
    for (const z of [-d / 2, d / 2]) {
      rod(p, [-w / 2, 0.96, z + 0.08], [w / 2, 0.96, z + 0.08], 0.032, P.wood);
      for (let i = 0; i < 8; i++)
        rod(
          p,
          [-w / 2 + 0.15 + i * 0.18, 0.4, z + 0.08],
          [-w / 2 + 0.15 + i * 0.18, 0.96, z + 0.08],
          0.016,
          P.ivory
        );
    }
  }
  const r = doll(s, { mode: "sleep" });
  r.root.rotation.z = Math.PI / 2;
  r.root.position.set(-w / 2 + 0.34 + 1.33 * ageScale(s.group), 0.72, 0.08);
  r.root.rotation.y = 0.05;
  const blanket = box(
    p,
    baby ? 1 : 1.55,
    0.15,
    d - 0.11,
    s.colors.shirt,
    baby ? 0.2 : 0.34,
    0.86,
    0.1,
    0.1
  );
  s.animate.push((t) => (blanket.scale.y = 1 + 0.06 * Math.sin(t * 1.7)));
  table(p, 1.12, -0.98, 0.45, 0.38, 0.4);
  const bedsideLamp = lamp(p, 1.12, -0.98);
  bedsideLamp.scale.setScalar(0.5);
  bedsideLamp.position.y = 0.495;
  if (baby) {
    rod(p, [-0.95, 0, -0.8], [-0.95, 1.9, -0.8], 0.028, P.wood);
    rod(p, [-0.95, 1.9, -0.8], [0, 1.9, -0.1], 0.025, P.wood);
    const mob = group(p, 0, 1.84, -0.1);
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      rod(
        mob,
        [0, 0, 0],
        [Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3],
        0.013,
        P.wood
      );
      rod(
        mob,
        [Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3],
        [Math.cos(a) * 0.3, -0.23, Math.sin(a) * 0.3],
        0.005,
        P.ivory
      );
      ball(
        mob,
        0.065,
        [P.yellow, P.teal, P.peach, P.blue][i],
        Math.cos(a) * 0.3,
        -0.27,
        Math.sin(a) * 0.3
      );
    }
    s.animate.push((t) => (mob.rotation.y = t * 0.25));
  }
}
function deskScene(s, kind) {
  rug(s.root, 0xd7dfe2);
  const scale = ageScale(s.group);
  const station = group(s.root, 0.05, 0, 0.05);
  station.scale.setScalar(scale);
  const computer = kind === "work" || kind === "computer";
  // A side view shows the screen and the user's profile without reversing the laptop.
  station.rotation.y = computer ? -1.25 : 0;
  const r = doll(s, { z: -0.24, mode: computer ? "work" : kind });
  station.add(r.root);
  r.root.scale.setScalar(1);
  r.root.name = "desk-user";
  sitOn(r, chair(station, 0, -0.24, 1, s.colors.accent));
  const desk = table(station, 0, 0.26, 0.75, 1.42, 0.84);
  desk.name = "desk";
  const surface = 0.795;
  if (computer) {
    laptop(s, station, 0, surface, 0.15);
    s.animate.push((t) => {
      for (let i = 0; i < 2; i++)
        reachHand(
          r,
          i,
          (i ? 1 : -1) * 0.19,
          0.838 + 0.009 * Math.sin(t * 8 + i * 2),
          0.385
        );
      r.head.rotation.x = 0.16;
    });
  } else {
    const b = book(station, 0, surface + 0.033, 0.21, s.colors.accent, true);
    const hinge = group(b, 0, 0.076, 0);
    box(hinge, 0.2, 0.006, 0.27, P.ivory, 0.1, 0, 0);
    s.animate.push(
      (t) => (hinge.rotation.z = -Math.abs(Math.sin(t * 0.6)) * 0.75)
    );
    const pencil = group(r.arms[1].elbow, 0, -0.2, 0);
    rod(pencil, [0, 0, 0], [0, -0.015, 0.14], 0.009, P.yellow);
    s.animate.push((t) => {
      reachHand(r, 0, -0.18, 0.87, 0.36);
      reachHand(r, 1, 0.12 + 0.025 * Math.sin(t * 2), 0.9, 0.39);
    });
    if (kind === "art") {
      // Paint and a brush share the same reachable tabletop as the sketchbook.
      const palette = ball(station, 0.15, P.wood, 0.47, surface + 0.02, 0.4, [
        1,
        0.08,
        0.7,
      ]);
      for (let i = 0; i < 3; i++)
        ball(
          station,
          0.025,
          [P.peach, P.teal, P.yellow][i],
          0.4 + i * 0.065,
          surface + 0.037,
          0.4,
          [1, 0.35, 1]
        );
    }
  }
  book(station, 0.48, surface + 0.033, 0.48, P.yellow).rotation.y = 0.1;
  cup(station, -0.51, surface + 0.08, 0.44, s.colors.accent);
  // Drawer, handle, modest desk clutter, and a grounded pencil pot.
  box(station, 0.42, 0.12, 0.35, s.colors.accent, 0.45, 0.64, 0.37);
  rod(station, [0.36, 0.64, 0.565], [0.54, 0.64, 0.565], 0.012, P.wood);
  plant(s.root, 1.1, -0.83, 0.8);
  lamp(s.root, -1.12, -0.55);
  if (kind === "school") {
    box(s.root, 1.3, 0.72, 0.045, 0x496958, -0.68, 1.13, -1.26);
    for (let i = 0; i < 3; i++)
      box(
        s.root,
        0.6 - i * 0.1,
        0.022,
        0.01,
        P.ivory,
        -0.78,
        1.32 - i * 0.16,
        -1.227
      );
    box(s.root, 0.36, 0.45, 0.2, P.peach, 0.74, 0.27, -0.02, 0.09);
    ring(s.root, 0.09, 0.018, P.wood, 0.74, 0.55, -0.02);
  }
}
function mediaRoom(s, kind) {
  const p = s.root;
  rug(p, 0xd8c8bb);
  const seating = sofa(s, 0.72, 0.1);
  seating.rotation.y = -Math.PI / 2;
  const r = doll(s, { x: 0.65, z: 0.1, rotation: -Math.PI / 2, mode: kind });
  r.root.name = "screen-viewer";
  sitOn(r, seating, { z: 0.12, style: "sofa" });
  const media = group(p, -1.15, 0, 0.1);
  media.rotation.y = Math.PI / 2;
  media.name = "tv-console";
  // Open shelf, side cabinets and feet all meet the floor and the TV stand.
  box(media, 1.3, 0.06, 0.46, P.wood, 0, 0.545, 0).name = "console-top";
  box(media, 1.27, 0.05, 0.43, P.wood, 0, 0.2, 0);
  for (const x of [-0.61, 0.61])
    box(media, 0.055, 0.31, 0.43, P.wood, x, 0.37, 0);
  box(media, 1.25, 0.31, 0.035, s.colors.accent, 0, 0.37, -0.2);
  for (const x of [-0.43, 0.43]) {
    box(media, 0.35, 0.28, 0.035, s.colors.accent, x, 0.365, 0.218);
    ball(media, 0.015, P.wood, x, 0.4, 0.243);
  }
  for (const x of [-0.52, 0.52])
    for (const z of [-0.15, 0.15])
      box(media, 0.065, 0.12, 0.065, P.dark, x, 0.105, z);
  box(media, 0.42, 0.095, 0.3, P.dark, 0, 0.27, 0.015);
  ball(media, 0.009, P.teal, 0.15, 0.27, 0.171, [1, 1, 0.3], 0.6);
  const tv = group(media);
  tv.name = "television";
  box(tv, 1.12, 0.68, 0.065, P.dark, 0, 1.1, 0);
  const screen = box(
    tv,
    1.035,
    0.59,
    0.01,
    kind === "game" ? 0x849eae : 0x91bed1,
    0,
    1.11,
    0.038
  );
  screen.name = "television-screen";
  screen.material = mat(kind === "game" ? 0x849eae : 0x91bed1, 0.18);
  for (const x of [-0.37, 0.37]) {
    rod(tv, [x, 0.774, 0], [x - 0.035, 0.575, 0.09], 0.015, P.dark).name =
      "tv-foot";
    rod(tv, [x, 0.774, 0], [x + 0.035, 0.575, -0.1], 0.015, P.dark).name =
      "tv-foot";
  }
  ball(tv, 0.006, P.teal, 0.43, 0.787, 0.039, [1, 1, 0.3], 0.5);
  tube(
    media,
    [
      [0.2, 0.9, -0.047],
      [0.27, 0.7, -0.09],
      [0.24, 0.56, -0.14],
    ],
    0.009,
    P.dark
  );
  if (kind === "watch") {
    box(tv, 1.025, 0.16, 0.006, P.green, 0, 0.902, 0.046);
    ball(tv, 0.065, P.yellow, 0.34, 1.3, 0.047, [1, 1, 0.06], 0.2);
    for (let i = 0; i < 3; i++) {
      const cloud = ball(tv, 0.065, P.ivory, -0.27 + i * 0.07, 1.26, 0.05, [
        1.2,
        0.5,
        0.045,
      ]);
      s.animate.push(
        (t) => (cloud.position.x = -0.27 + i * 0.07 + 0.08 * Math.sin(t * 0.35))
      );
    }
    // Small remote rests in the viewer's hand.
    const remote = group(r.arms[1].elbow, 0, -0.2, 0);
    box(remote, 0.065, 0.03, 0.17, P.dark, 0, 0, 0.035, 0.014);
    for (let i = 0; i < 3; i++)
      ball(remote, 0.008, P.ivory, 0, 0.019, -0.005 + i * 0.03);
  } else {
    for (const [x, y, w] of [
      [-0.3, 0.96, 0.3],
      [0.22, 1.1, 0.3],
      [-0.2, 1.27, 0.23],
    ])
      box(tv, w, 0.024, 0.008, P.ivory, x, y, 0.05);
    const sprite = box(
      tv,
      0.065,
      0.09,
      0.009,
      P.yellow,
      -0.3,
      1.03,
      0.052,
      0.008
    );
    s.animate.push((t) => {
      sprite.position.x = 0.3 * Math.sin(t);
      sprite.position.y = 1.11 + 0.12 * Math.abs(Math.sin(t * 2));
    });
    const controller = group(r.root, 0, 0.8, 0.34);
    controller.name = "controller";
    box(controller, 0.34, 0.075, 0.17, P.dark, 0, 0, 0, 0.045);
    for (const x of [-0.1, 0.1])
      ball(controller, 0.025, P.ivory, x, 0.044, -0.015, [1, 0.4, 1]);
    for (const x of [0.08, 0.12])
      ball(controller, 0.009, P.peach, x, 0.042, 0.041, [1, 0.4, 1]);
    s.animate.push((t) => {
      for (let i = 0; i < 2; i++)
        reachHand(
          r,
          i,
          (i ? 1 : -1) * 0.145,
          0.82 + 0.003 * Math.sin(t * 7 + i),
          0.34
        );
    });
  }
  s.animate.push((t) => {
    r.head.rotation.y = 0.015 * Math.sin(t * 0.7);
    r.head.rotation.x = 0.08;
  });
  table(p, -0.15, 0.83, 0.39, 0.65, 0.44);
  cup(p, -0.26, 0.515, 0.82, P.peach);
  book(p, 0.015, 0.468, 0.82, P.teal);
  plant(p, 1.08, -1.02, 0.8);
  lamp(p, -0.06, -1.03);
}
function kitchen(s, kind) {
  const p = s.root;
  box(p, 2.7, 0.7, 0.6, s.colors.accent, 0, 0.37, -0.85);
  box(p, 2.85, 0.07, 0.72, P.ivory, 0, 0.76, -0.85);
  for (const x of [-0.85, 0, 0.85]) {
    box(p, 0.75, 0.59, 0.03, s.colors.wall, x, 0.38, -0.535);
    rod(p, [x - 0.1, 0.57, -0.5], [x + 0.1, 0.57, -0.5], 0.017, P.wood);
  }
  const r = doll(s, {
    x: -0.25,
    z: -0.26,
    mode: kind === "dishes" ? "dishes" : "cook",
    rotation: Math.PI,
  });
  if (kind === "dishes") {
    box(p, 0.72, 0.04, 0.46, 0x8dadaa, -0.35, 0.8, -0.85);
    box(p, 0.56, 0.035, 0.32, 0xbcd9db, -0.35, 0.83, -0.85);
    tube(
      p,
      [
        [-0.36, 0.82, -1.02],
        [-0.36, 1.12, -1.02],
        [-0.36, 1.12, -0.81],
        [-0.36, 1.02, -0.81],
      ],
      0.026,
      P.wood
    );
    const flow = cyl(p, 0.013, 0.019, 0.22, 0xb4dce9, -0.36, 0.93, -0.81);
    s.animate.push((t) => (flow.scale.x = 0.7 + 0.3 * Math.sin(t * 8)));
    const dish = group(p, -0.25, 0.96, -0.63);
    ring(dish, 0.17, 0.018, P.ivory);
    cyl(dish, 0.15, 0.15, 0.015, P.ivory).rotation.x = Math.PI / 2;
    s.animate.push((t) => {
      dish.rotation.y = 0.1 * Math.sin(t * 2);
      reachProp(r, 0, dish, 0.17, 0, 0);
      reachProp(r, 1, dish, -0.13, 0.045, 0);
    });
    for (let i = 0; i < 3; i++)
      cyl(p, 0.19, 0.19, 0.025, P.ivory, 0.65, 0.81 + i * 0.03, -0.8);
  } else {
    box(p, 0.85, 0.025, 0.52, P.dark, -0.35, 0.81, -0.77);
    for (const radius of [0.17, 0.2])
      ring(p, radius, 0.012, P.peach, -0.35, 0.831, -0.71).rotation.x =
        Math.PI / 2;
    cyl(p, 0.18, 0.15, 0.2, P.peach, -0.35, 0.952, -0.71);
    cyl(p, 0.145, 0.145, 0.012, 0xe5c779, -0.35, 1.055, -0.71);
    const spoon = group(p, -0.35, 1.05, -0.71);
    rod(spoon, [0, -0.07, 0], [0.03, 0.09, 0.24], 0.014, P.wood);
    ball(spoon, 0.035, P.wood, 0, -0.065, 0, [0.7, 0.4, 1]);
    for (const x of [-0.57, -0.13])
      rod(p, [x, 0.96, -0.75], [x, 0.96, -0.66], 0.024, P.peach);
    s.animate.push((t) => {
      spoon.position.x = -0.35 + 0.035 * Math.sin(t * 2);
      spoon.position.z = -0.71 + 0.035 * Math.cos(t * 2);
      reachProp(r, 1, spoon, 0.03, 0.09, 0.24);
      reachHand(r, 0, -0.2, 0.86, 0.34);
    });
    steam(s, -0.35, 1.06, -0.71);
    box(p, 0.54, 0.025, 0.4, P.wood, 0.66, 0.81, -0.85);
    for (let i = 0; i < 3; i++)
      ball(p, 0.064, P.peach, 0.52 + i * 0.12, 0.89, -0.85);
  }
  plant(p, 1.2, 0.8, 0.68);
  rug(p, 0xe4bd9b);
  box(p, 0.6, 0.09, 0.25, P.wood, -1.1, 1.2, -1.2);
  cup(p, -1.1, 1.33, -1.2, P.yellow);
}
function dining(s, kind) {
  const p = s.root,
    scale = ageScale(s.group);
  rug(p, 0xd8e2cb);
  const setting = group(p);
  setting.scale.setScalar(scale);
  const eater = doll(s, { mode: kind === "feed" ? "feed" : "eat", z: -0.24 });
  setting.add(eater.root);
  eater.root.scale.setScalar(1);
  sitOn(eater, chair(setting, 0, -0.24, 1, s.colors.accent));
  table(setting, 0, 0.24, 0.75, 1.25, 0.8);
  cyl(setting, 0.22, 0.22, 0.025, P.ivory, 0, 0.808, 0.19);
  ring(setting, 0.192, 0.008, P.teal, 0, 0.826, 0.19).rotation.x = Math.PI / 2;
  for (let i = 0; i < 4; i++)
    ball(
      setting,
      0.043,
      i % 2 ? P.peach : P.green,
      (i - 1.5) * 0.065,
      0.85,
      0.22
    );
  cup(setting, 0.43, 0.875, 0.42, P.yellow);
  box(setting, 0.21, 0.008, 0.25, P.ivory, -0.43, 0.8, 0.3, 0.008);
  rod(setting, [-0.43, 0.817, 0.21], [-0.43, 0.817, 0.37], 0.008, P.wood);
  if (kind === "feed") {
    const bottle = group(eater.arms[1].elbow, 0, -0.2, 0.05);
    cyl(bottle, 0.055, 0.055, 0.2, P.ivory);
    cyl(bottle, 0.022, 0.04, 0.055, P.yellow, 0, 0.125);
    s.animate.push((t) => (bottle.rotation.z = 0.16 * Math.sin(t * 2)));
  } else {
    const spoon = group(eater.arms[1].elbow, 0, -0.2, 0);
    rod(spoon, [0, 0, 0], [0, -0.12, 0], 0.009, P.wood);
    ball(spoon, 0.028, P.wood, 0, -0.14, 0, [0.65, 1, 0.3]);
    s.animate.push((t) => {
      const bite = (Math.sin(t * 1.8) + 1) / 2;
      reachHand(eater, 1, 0.15, 0.87 + 0.24 * bite, 0.34 - 0.14 * bite);
      reachHand(eater, 0, -0.2, 0.84, 0.31);
    });
  }
  plant(p, 1.15, -0.95, 0.9);
  frame(p, -0.8, 0.95, -1.28, P.teal);
}
function lounge(s, kind) {
  const p = s.root;
  const storyTime = kind === "read" && s.group.child;
  const readingToChild = kind === "read" && /children/.test(s.label);
  rug(p, 0xd8c8bb);
  const seating = sofa(s, 0, -0.55);
  const mode = storyTime
    ? "sit"
    : kind === "read"
    ? "read"
    : kind === "phone"
    ? "phone"
    : kind === "music"
    ? "music"
    : kind === "game"
    ? "game"
    : kind === "watch"
    ? "watch"
    : "sit";
  const r = doll(s, {
    x: -0.35,
    z: -0.45,
    mode,
  });
  sitOn(r, seating, { x: r.root.position.x, z: 0.12, style: "sofa" });
  if (kind !== "family" && !storyTime && !readingToChild) {
    const pillow = box(
      seating,
      0.36,
      0.32,
      0.16,
      s.colors.curtain,
      0.45,
      0.71,
      0.01,
      0.08
    );
    pillow.rotation.z = -0.16;
    box(seating, 0.46, 0.025, 0.48, s.colors.curtain, 0.4, 0.555, 0.06, 0.015);
    box(seating, 0.46, 0.27, 0.025, s.colors.curtain, 0.4, 0.42, 0.315, 0.015);
    for (let i = 0; i < 7; i++)
      rod(
        seating,
        [0.2 + i * 0.065, 0.29, 0.33],
        [0.2 + i * 0.065, 0.25, 0.33],
        0.007,
        P.ivory
      );
    if (["relax", "listen", "phone"].includes(kind)) {
      s.animate.push(() => reachProp(r, 0, seating, -0.71, 0.77, 0.12));
    }
  }
  lamp(p, -1.15, -0.6);
  plant(p, 1.15, -0.95, 0.9);
  table(p, 0.15, 0.8, 0.4, 0.85, 0.5);
  cup(p, 0.35, 0.52, 0.82, P.peach);
  if (kind === "read") {
    let reader = r;
    if (storyTime || readingToChild) {
      const companion = doll(s, {
        x: 0.5,
        z: -0.45,
        age: { age: storyTime ? "25–34" : "4–7" },
        mode: storyTime ? "read" : "sit",
        shirt: P.peach,
      });
      sitOn(companion, seating, { x: 0.5, z: 0.12, style: "sofa" });
      if (storyTime) reader = companion;
    }
    const b = book(reader.root, 0, 0.81, 0.34, P.teal, true);
    b.name = "held-book";
    const hinge = group(b, 0, 0.076, 0);
    box(hinge, 0.2, 0.006, 0.27, P.ivory, 0.1, 0, 0);
    s.animate.push((t) => {
      hinge.rotation.z = -Math.abs(Math.sin(t * 0.5)) * 0.8;
      for (let i = 0; i < 2; i++)
        reachHand(reader, i, (i ? 1 : -1) * 0.19, 0.83, 0.32);
      reader.head.rotation.x = 0.27;
    });
    book(p, 0.02, 0.478, 0.83, P.peach);
  }
  if (kind === "phone") {
    box(r.arms[1].elbow, 0.09, 0.19, 0.035, P.dark, 0, -0.16, 0.04, 0.02);
  }
  if (kind === "music") {
    const guitar = group(r.root, 0, 0.79, 0.3);
    guitar.rotation.z = -0.6;
    ball(guitar, 0.22, P.wood, 0, 0, 0, [0.75, 1, 0.23]);
    ball(guitar, 0.17, P.wood, 0, 0.2, 0, [0.75, 1, 0.23]);
    box(guitar, 0.07, 0.55, 0.06, P.wood, 0, 0.49);
    ball(guitar, 0.06, P.dark, 0, 0.12, 0.052, [1, 1, 0.1]);
    for (let i = 0; i < 3; i++)
      rod(
        guitar,
        [(i - 1) * 0.012, -0.13, 0.06],
        [(i - 1) * 0.012, 0.7, 0.06],
        0.002,
        P.ivory
      );
    s.animate.push((t) => {
      guitar.rotation.z = -0.6 + 0.025 * Math.sin(t * 4);
      r.body.rotation.z = 0;
      reachHand(r, 0, -0.1, 0.88 + 0.025 * Math.sin(t * 4), 0.34);
      reachHand(r, 1, 0.25, 1.13, 0.32);
    });
  }
  if (kind === "listen") {
    table(p, -1.05, 0.1, 0.5, 0.6, 0.42);
    const radio = group(p, -1.05, 0.655, 0.1);
    radio.rotation.y = 2.05;
    box(radio, 0.45, 0.22, 0.2, P.wood);
    for (const x of [-0.13, 0.13])
      ball(radio, 0.073, P.dark, x, 0, 0.105, [1, 1, 0.1]);
    box(radio, 0.12, 0.025, 0.025, P.ivory, 0, 0.045, 0.11);
    for (let i = 0; i < 3; i++) {
      const note = group(p, -0.85 + i * 0.13, 0.95 + i * 0.13, 0.2);
      ball(note, 0.037, P.teal, 0, 0, 0, [1.2, 0.7, 0.45]);
      rod(note, [0.027, 0, 0], [0.027, 0.14, 0], 0.009, P.teal);
      s.animate.push((t) => {
        note.position.y = 0.85 + i * 0.15 + 0.1 * Math.sin(t * 1.6 + i);
        note.rotation.z = 0.1 * Math.sin(t + i);
      });
    }
    s.animate.push((t) => (r.head.rotation.z = 0.065 * Math.sin(t * 2)));
  }
  if (kind === "family") {
    const companion = doll(s, {
      x: 0.5,
      z: -0.45,
      age: { age: "25–34" },
      mode: "sit",
      rotation: -0.15,
      shirt: P.peach,
    });
    sitOn(companion, seating, { x: 0.5, z: 0.12, style: "sofa" });
    s.animate.push((t) => {
      r.head.rotation.y = 0.15 + 0.035 * Math.sin(t * 0.8);
      companion.head.rotation.y = -0.18 + 0.025 * Math.sin(t * 0.7);
    });
  }
}
function playroom(s, kind) {
  const p = s.root;
  rug(p, 0xcbdac3);
  const r = doll(s, { mode: "play", z: -0.1 });
  if (!s.group.child)
    doll(s, {
      x: 0.6,
      z: -0.1,
      age: { age: "4–7" },
      mode: "play",
      shirt: P.yellow,
    });
  const blockColors = [P.teal, P.peach, P.yellow, P.blue];
  for (let i = 0; i < 5; i++) {
    const x = 0.65 + (i % 2) * 0.23,
      y = 0.15 + Math.floor(i / 2) * 0.27,
      z = 0.35;
    const b = box(p, 0.25, 0.25, 0.25, blockColors[i % 4], x, y, z, 0.035);
    s.animate.push((t) => (b.rotation.y = 0.12 * Math.sin(t * 0.6 + i)));
  }
  const b = ball(p, 0.17, P.peach, -0.6, 0.2, 0.6);
  ring(p, 0.17, 0.012, P.ivory, -0.6, 0.2, 0.6).rotation.x = 0.7;
  s.animate.push((t) => {
    b.position.y = 0.18 + Math.abs(Math.sin(t * 2)) * 0.26;
    b.position.x = -0.65 + Math.sin(t * 0.8) * 0.1;
  });
  box(p, 0.8, 0.35, 0.5, P.wood, -0.8, 0.2, -0.92);
  for (let i = 0; i < 3; i++)
    book(p, -0.95 + i * 0.13, 0.45, -0.92, blockColors[i]).rotation.z = i * 0.1;
  if (s.group.age === "Under 1") {
    const arch = tube(
      p,
      [
        [-0.8, 0.04, 0.1],
        [-0.7, 0.9, 0.1],
        [0, 1.2, 0.1],
        [0.7, 0.9, 0.1],
        [0.8, 0.04, 0.1],
      ],
      0.035,
      P.wood
    );
    for (let i = 0; i < 3; i++) {
      const g = group(p, (i - 1) * 0.25, 1.04, 0.1);
      rod(g, [0, 0, 0], [0, -0.25, 0], 0.005, P.ivory);
      ball(g, 0.07, blockColors[i], 0, -0.29, 0);
      s.animate.push((t) => (g.rotation.z = 0.2 * Math.sin(t * 1.6 + i)));
    }
  }
}
function careScene(s, kind) {
  rug(s.root, 0xe0cfd5);
  const r = doll(s, { mode: "care", x: -0.23, z: 0.12 });
  const baby = group(r.body, 0, 0.12, 0.35);
  baby.rotation.z = 1.25;
  ball(baby, 0.2, P.ivory, 0, 0, 0, [0.7, 1.5, 0.7]);
  ball(baby, 0.12, s.colors.skin, 0, 0.28, 0);
  ball(baby, 0.016, P.dark, -0.04, 0.3, 0.1);
  ball(baby, 0.016, P.dark, 0.04, 0.3, 0.1);
  s.animate.push((t) => (baby.rotation.z = 1.25 + 0.045 * Math.sin(t * 1.4)));
  const crib = group(s.root);
  box(crib, 0.95, 0.55, 0.64, s.colors.accent, 0.83, 0.31, -0.65);
  box(crib, 0.89, 0.12, 0.6, P.ivory, 0.83, 0.62, -0.65);
  for (let i = 0; i < 5; i++)
    rod(
      crib,
      [0.43 + i * 0.19, 0.35, -0.32],
      [0.43 + i * 0.19, 0.96, -0.32],
      0.018,
      P.wood
    );
  rod(crib, [0.38, 0.96, -0.32], [1.28, 0.96, -0.32], 0.023, P.wood);
  plant(s.root, -1.15, -0.95, 0.7);
  if (kind === "help") {
    baby.visible = false;
    crib.visible = false;
    const guest = doll(s, {
      x: 0.65,
      z: 0.12,
      age: { age: /children/.test(s.label) ? "4–7" : "65+" },
      mode: "sit",
      rotation: -0.55,
      shirt: P.peach,
    });
    const seat = chair(s.root, 0.65, 0.12, 1, P.peach);
    seat.rotation.y = -0.55;
    sitOn(guest, seat);
    table(s.root, 0.15, 0.85, 0.45, 0.7, 0.45);
    cup(s.root, 0.15, 0.56, 0.85, P.teal);
  }
}
function bathroom(s, kind) {
  const p = s.root;
  rug(p, 0xbddbd7);
  for (let i = 0; i < 7; i++)
    for (let j = 0; j < 5; j++)
      box(
        p,
        0.34,
        0.005,
        0.34,
        (i + j) % 2 ? 0xf4eddf : 0xdbe6df,
        -1.05 + i * 0.35,
        0.05,
        -0.95 + j * 0.35,
        0.008
      );
  if (kind === "bath") {
    box(p, 1.8, 0.48, 1.02, P.ivory, 0, 0.3, 0.13, 0.2);
    box(p, 1.58, 0.025, 0.81, 0xb3dbe0, 0, 0.56, 0.13, 0.18);
    const r = doll(s, { mode: "play", z: -0.05 });
    r.root.position.y = 0.18;
    for (let i = 0; i < 8; i++) {
      const b = ball(
        p,
        0.05 + (i % 3) * 0.02,
        P.white,
        -0.65 + (i % 4) * 0.42,
        0.61,
        0.04 + Math.floor(i / 4) * 0.25,
        [1, 1, 1],
        0,
        0.65
      );
      s.animate.push((t) => (b.position.y = 0.61 + Math.sin(t + i) * 0.025));
    }
    const duck = group(p, 0.55, 0.66, 0.32);
    ball(duck, 0.1, P.yellow, 0, 0, 0, [1.3, 0.8, 0.8]);
    ball(duck, 0.065, P.yellow, 0.06, 0.09, 0);
    box(duck, 0.08, 0.03, 0.05, P.peach, 0.13, 0.08, 0);
    ball(duck, 0.012, P.dark, 0.095, 0.115, 0.05);
    s.animate.push((t) => {
      duck.rotation.y = 0.2 * Math.sin(t);
      duck.position.y = 0.66 + 0.014 * Math.sin(t * 1.4);
    });
  } else {
    box(p, 1, 0.68, 0.65, P.wood, -0.2, 0.37, -0.79);
    box(p, 1.08, 0.08, 0.7, P.ivory, -0.2, 0.75, -0.79);
    ball(p, 0.25, 0xc2d7d4, -0.2, 0.79, -0.76, [1, 0.12, 0.7]);
    ring(p, 0.34, 0.03, P.wood, -0.2, 1.22, -1.25);
    ball(p, 0.32, 0xc2d7d4, -0.2, 1.22, -1.245, [1, 1, 0.04]);
    doll(s, { z: -0.15, x: -0.2, mode: "wash", rotation: Math.PI });
    tube(
      p,
      [
        [-0.2, 0.8, -0.97],
        [-0.2, 1, -0.97],
        [-0.2, 1, -0.75],
      ],
      0.024,
      P.wood
    );
  }
  rod(p, [0.8, 1.05, -1.22], [1.26, 1.05, -1.22], 0.017, P.wood);
  box(p, 0.35, 0.45, 0.04, P.peach, 1.03, 0.84, -1.19);
  plant(p, 1.12, 0.78, 0.6);
}
function chores(s, kind) {
  const p = s.root;
  const r = doll(s, {
    mode: kind === "clean" ? "clean" : "stand",
    x: kind === "laundry" ? -0.6 : -0.1,
    z: -0.12,
  });
  plant(p, 1.07, -0.9, 0.8);
  rug(p, 0xd4d5ba);
  if (kind === "laundry") {
    box(p, 0.88, 0.9, 0.75, P.ivory, 0.7, 0.48, -0.72);
    ring(p, 0.26, 0.045, P.teal, 0.7, 0.44, -0.327);
    const drum = group(p, 0.7, 0.44, -0.32);
    cyl(drum, 0.215, 0.215, 0.025, 0x6f999a).rotation.x = Math.PI / 2;
    for (let i = 0; i < 3; i++)
      ball(
        drum,
        0.095,
        [P.peach, P.yellow, P.ivory][i],
        Math.cos(i * 2.1) * 0.1,
        Math.sin(i * 2.1) * 0.1,
        0.03,
        [1, 0.6, 0.25]
      );
    s.animate.push((t) => (drum.rotation.z = t * 0.8));
    box(p, 0.62, 0.18, 0.38, P.peach, 0.69, 1.03, -0.72);
    table(p, -0.6, 0.4, 0.72, 0.95, 0.58);
    const folded = box(p, 0.42, 0.055, 0.33, P.ivory, -0.6, 0.793, 0.3);
    s.animate.push((t) => {
      for (let i = 0; i < 2; i++)
        reachHand(
          r,
          i,
          (i ? 1 : -1) * (0.17 + 0.025 * Math.sin(t * 2)),
          0.83,
          0.36
        );
    });
    cyl(p, 0.33, 0.25, 0.4, P.wood, 0.78, 0.24, 0.7);
    cyl(p, 0.045, 0.045, 0.015, P.wood, 0.93, 0.82, -0.332).rotation.x =
      Math.PI / 2;
    for (let i = 0; i < 3; i++)
      ball(
        p,
        0.16,
        [P.ivory, P.blue, P.yellow][i],
        0.69 + i * 0.09,
        0.46,
        0.7,
        [1, 0.5, 1]
      );
  } else if (kind === "repair") {
    table(p, 0, 0.35, 0.72, 1.1, 0.6);
    box(p, 0.45, 0.15, 0.25, P.peach, 0.18, 0.84, 0.35);
    const hammer = group(p, 0.18, 1.165, 0.15);
    rod(hammer, [0, 0, 0], [0, -0.22, 0.2], 0.022, P.wood);
    box(hammer, 0.18, 0.06, 0.08, P.dark, 0, -0.22, 0.2);
    s.animate.push((t) => {
      hammer.position.y = 1.165 + 0.07 * (1 + Math.sin(t * 4));
      reachProp(r, 1, hammer);
      reachHand(r, 0, -0.2, 0.81, 0.31);
    });
    box(p, 0.66, 0.04, 0.25, P.wood, 0.7, 0.77, -0.9);
    for (let i = 0; i < 3; i++)
      box(p, 0.13, 0.18, 0.1, P.yellow, 0.55 + i * 0.15, 0.88, -0.9);
  } else {
    const broom = group(p, 0.12, 0.085, 0.2);
    const scale = ageScale(s.group);
    broom.scale.setScalar(scale);
    rod(broom, [0, 0, 0], [0, 1.05, -0.1], 0.025, P.wood);
    box(broom, 0.46, 0.1, 0.16, P.peach, 0, 0.02, 0);
    for (let i = 0; i < 8; i++)
      rod(
        broom,
        [-0.2 + i * 0.055, -0.01, -0.04],
        [-0.2 + i * 0.055, -0.05, 0.04],
        0.008,
        P.wood
      );
    s.animate.push((t) => {
      broom.rotation.z = 0.15 * Math.sin(t * 2);
      broom.position.x = 0.12 + 0.08 * Math.sin(t * 2);
      reachProp(r, 1, broom, 0, 0.83, -0.079);
      reachProp(r, 0, broom, 0, 0.63, -0.06);
    });
    cyl(p, 0.23, 0.18, 0.3, P.teal, 0.94, 0.19, 0.73);
    ring(p, 0.21, 0.016, P.wood, 0.94, 0.42, 0.73);
  }
}
function outdoors(s, kind) {
  const p = s.root;
  rug(p, kind === "yoga" ? P.peach : 0xd6ccb6);
  const mode =
    {
      garden: "cook",
      pet: "stand",
      walk: "walk",
      run: "run",
      cycle: "sit",
      yoga: "yoga",
      exercise: "exercise",
      ball: "exercise",
      swim: "exercise",
      volunteer: "help",
    }[kind] || "stand";
  const r = doll(s, { mode, z: 0.15, x: 0 });
  if (kind === "garden") {
    for (let i = 0; i < 3; i++) {
      box(p, 0.38, 0.2, 0.6, P.wood, 0.5 + i * 0.23, 0.14, 0.43);
      plant(p, 0.53 + i * 0.26, 0.41, 0.48);
    }
    const can = group(r.arms[1].elbow, 0, -0.2, 0.03);
    cyl(can, 0.12, 0.12, 0.2, P.teal);
    rod(can, [0.08, 0, 0], [0.27, 0.07, 0], 0.035, P.teal);
    ring(can, 0.12, 0.023, P.teal, -0.12, 0.06, 0).rotation.y = Math.PI / 2;
    const drops = Array.from({ length: 5 }, () => ball(p, 0.014, 0x89bfc9));
    s.animate.push((t) => {
      can.rotation.z = -0.3 + 0.15 * Math.sin(t * 1.5);
      can.updateWorldMatrix(true, false);
      const spout = s.root.worldToLocal(
        can.localToWorld(new T.Vector3(0.27, 0.07, 0))
      );
      for (let i = 0; i < drops.length; i++) {
        const phase = (t * 0.65 + i / drops.length) % 1;
        drops[i].position
          .copy(spout)
          .add(new T.Vector3(0.025 * phase, -0.04 - phase * 0.35, 0));
      }
    });
  }
  if (kind === "pet") {
    const dog = group(p, 0.62, 0.02, 0.55);
    ball(dog, 0.2, P.wood, 0, 0.3, 0, [1.5, 0.85, 0.7]);
    ball(dog, 0.145, P.wood, 0.24, 0.39, 0);
    ball(dog, 0.075, P.cream, 0.36, 0.35, 0, [1, 0.6, 0.8]);
    for (const x of [-0.16, 0.16])
      for (const z of [-0.09, 0.09])
        rod(dog, [x, 0.29, z], [x, 0.05, z], 0.035, P.wood);
    for (const z of [-0.1, 0.1])
      ball(dog, 0.07, 0x8d674c, 0.21, 0.46, z, [0.5, 1.6, 0.7]);
    ball(dog, 0.02, P.dark, 0.34, 0.41, 0.07);
    const tail = rod(dog, [-0.27, 0.3, 0], [-0.42, 0.5, 0], 0.035, P.wood);
    s.animate.push((t) => (tail.rotation.x = 0.4 * Math.sin(t * 7)));
    tube(
      p,
      [
        [0.245, 0.62, 0.15],
        [0.43, 0.37, 0.35],
        [0.84, 0.44, 0.6],
      ],
      0.009,
      P.cream
    );
  }
  if (kind === "cycle") {
    r.root.position.y = 0.36;
    r.root.position.z = 0.2;
    const bike = group(p, 0, 0, 0.2);
    for (const x of [-0.59, 0.59]) {
      const wheel = ring(bike, 0.32, 0.045, P.dark, x, 0.34);
      const rim = ring(bike, 0.26, 0.018, P.ivory, x, 0.34);
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        rod(
          wheel,
          [0, 0, 0],
          [Math.cos(a) * 0.29, Math.sin(a) * 0.29, 0],
          0.006,
          P.ivory
        );
      }
      s.animate.push((t) => (wheel.rotation.z = -t * 2));
    }
    for (const [a, b] of [
      [
        [0, 0.34, 0],
        [-0.59, 0.34, 0],
      ],
      [
        [-0.59, 0.34, 0],
        [-0.2, 0.76, 0],
      ],
      [
        [-0.2, 0.76, 0],
        [0.3, 0.76, 0],
      ],
      [
        [0.3, 0.76, 0],
        [0, 0.34, 0],
      ],
      [
        [0.3, 0.76, 0],
        [0.59, 0.34, 0],
      ],
    ])
      rod(bike, a, b, 0.035, P.peach);
    box(bike, 0.25, 0.05, 0.16, P.dark, -0.2, 0.83);
    rod(bike, [0.4, 0.65, 0], [0.24, 1.13, 0], 0.022, P.wood);
    rod(bike, [0.24, 1.13, -0.25], [0.24, 1.13, 0.25], 0.023, P.dark);
    r.root.rotation.y = Math.PI / 2;
    r.root.position.x = -0.2;
    ring(bike, 0.11, 0.02, P.dark, 0, 0.45, 0);
    const pedals = [-0.18, 0.18].map((z) => {
      const pedal = group(bike, 0, 0.36, z);
      box(pedal, 0.16, 0.045, 0.12, P.dark);
      return pedal;
    });
    s.animate.push((t) => {
      r.body.rotation.x = 0.25;
      for (let i = 0; i < 2; i++) {
        reachProp(r, i, bike, 0.24, 1.13, i ? -0.21 : 0.21);
        const pedal = pedals[1 - i],
          phase = t * 3 + i * Math.PI;
        pedal.position.x = 0.11 * Math.sin(phase);
        pedal.position.y = 0.45 + 0.11 * Math.cos(phase);
        reachProp(r, i, pedal, 0, 0.05, 0, true);
      }
    });
  }
  if (kind === "exercise") {
    for (const arm of r.arms) {
      const weight = group(arm.elbow, 0, -0.22, 0);
      rod(weight, [-0.15, 0, 0], [0.15, 0, 0], 0.02, P.wood);
      for (const x of [-0.15, 0.15])
        box(weight, 0.085, 0.18, 0.18, P.teal, x, 0, 0, 0.035);
    }
  }
  if (kind === "ball") {
    const b = ball(
      p,
      0.2,
      s.label.includes("soccer") ? P.ivory : P.peach,
      0.64,
      0.22,
      0.55
    );
    for (let i = 0; i < 3; i++)
      ring(b, 1, 0.045, P.cream).rotation.y = i * 1.05;
    s.animate.push(
      (t) => (b.position.y = 0.22 + Math.abs(Math.sin(t * 2.8)) * 0.5)
    );
    if (/basketball/.test(s.label)) {
      rod(p, [1.15, 0, -0.77], [1.15, 1.8, -0.77], 0.035, P.wood);
      box(p, 0.6, 0.48, 0.04, P.ivory, 1.15, 1.63, -0.73);
      const hoop = ring(p, 0.2, 0.019, P.peach, 1.15, 1.46, -0.5);
      hoop.rotation.x = Math.PI / 2;
    }
  }
  if (kind === "swim") {
    box(p, 2.9, 0.32, 2.35, P.ivory, 0, 0.2, 0.08, 0.2);
    box(p, 2.65, 0.04, 2.1, 0x91cdd6, 0, 0.39, 0.08, 0.17);
    r.root.position.y = -0.48;
    for (let i = 0; i < 4; i++) {
      const ripple = ring(p, 0.28 + i * 0.11, 0.008, P.ivory, 0, 0.421, 0.15);
      ripple.rotation.x = -Math.PI / 2;
      s.animate.push((t) =>
        ripple.scale.setScalar(0.8 + ((t * 0.14 + i * 0.23) % 1))
      );
    }
  }
  if (kind === "volunteer") {
    box(p, 0.6, 0.5, 0.5, P.wood, 0.75, 0.28, 0.5);
    box(p, 0.56, 0.02, 0.48, P.ivory, 0.75, 0.54, 0.5);
    box(p, 0.2, 0.06, 0.1, P.peach, 0.75, 0.58, 0.5);
    doll(s, { x: 0.86, z: -0.3, mode: "help", scale: 0.82, shirt: P.yellow });
  }
}
function travel(s, kind) {
  const p = s.root;
  if (kind === "shop") {
    rug(p, 0xd7c9ad);
    const r = doll(s, { mode: "shop", x: -0.4, z: 0.5, rotation: Math.PI / 2 });
    const cart = group(p, 0.45, 0, 0.5);
    box(cart, 0.6, 0.38, 0.45, P.ivory, 0, 0.57);
    for (let i = 0; i < 5; i++)
      box(cart, 0.027, 0.36, 0.5, P.wood, -0.27 + i * 0.13, 0.58);
    for (const z of [-0.17, 0.17])
      rod(cart, [-0.28, 0.73, z], [-0.48, 0.87, z], 0.02, P.wood);
    rod(cart, [-0.48, 0.87, -0.2], [-0.48, 0.87, 0.2], 0.025, P.wood);
    for (const x of [-0.21, 0.21])
      for (const z of [-0.16, 0.16])
        rod(cart, [x, 0.19, z], [x, 0.48, z], 0.017, P.wood);
    s.animate.push(() => {
      for (let i = 0; i < 2; i++)
        reachProp(r, i, cart, -0.48, 0.87, i ? -0.16 : 0.16);
    });
    for (const x of [-0.21, 0.21])
      for (const z of [-0.16, 0.16]) {
        const wheel = cyl(cart, 0.08, 0.08, 0.035, P.dark, x, 0.14, z);
        wheel.rotation.x = Math.PI / 2;
      }
    for (let i = 0; i < 4; i++)
      ball(
        cart,
        0.095,
        [P.peach, P.green, P.yellow, P.teal][i],
        -0.15 + (i % 2) * 0.23,
        0.82,
        Math.floor(i / 2) * 0.2 - 0.12
      );
    box(p, 1.7, 0.6, 0.5, P.wood, 0, 0.32, -0.9);
    for (let i = 0; i < 6; i++)
      ball(p, 0.09, i % 2 ? P.peach : P.green, -0.65 + i * 0.25, 0.72, -0.9);
    return;
  }
  box(p, 2.95, 0.03, 1.13, 0x9eafa8, 0, 0.06, 0.23);
  for (let i = 0; i < 4; i++)
    box(p, 0.28, 0.005, 0.027, P.ivory, -1.1 + i * 0.7, 0.08, 0.28);
  const car = group(p, 0, 0.02, 0.22);
  const school = s.group.child;
  box(
    car,
    school ? 1.65 : 1.5,
    0.42,
    0.79,
    school ? P.yellow : s.colors.accent,
    0,
    0.5,
    0,
    0.16
  );
  box(
    car,
    1.06,
    0.45,
    0.69,
    school ? P.yellow : s.colors.accent,
    -0.07,
    0.83,
    0,
    0.13
  );
  box(car, 0.42, 0.29, 0.715, 0xc3dee0, -0.3, 0.85, 0, 0.045);
  box(car, 0.37, 0.29, 0.715, 0xc3dee0, 0.15, 0.85, 0, 0.045);
  box(car, 0.035, 0.31, 0.73, P.ivory, -0.07, 0.85);
  for (const x of [-0.49, 0.49])
    for (const z of [-0.4, 0.4]) {
      const w = cyl(car, 0.2, 0.2, 0.11, P.dark, x, 0.255, z);
      w.rotation.x = Math.PI / 2;
      const rim = cyl(car, 0.11, 0.11, 0.118, P.ivory, x, 0.255, z);
      rim.rotation.x = Math.PI / 2;
      s.animate.push((t) => (w.rotation.y = t * 2));
    }
  for (const z of [-0.25, 0.25])
    ball(car, 0.07, P.ivory, 0.75, 0.5, z, [0.2, 1, 1], 0.25);
  const driver = doll(s, { mode: "sit", scale: 0.46, x: 0, z: 0.22 });
  driver.root.position.y = 0.37;
  driver.root.rotation.y = Math.PI / 2;
  s.animate.push((t) => {
    car.position.y = 0.02 + 0.014 * Math.sin(t * 8);
    car.position.x = Math.sin(t * 0.7) * 0.08;
    driver.root.position.x = car.position.x;
  });
  for (let i = 0; i < 3; i++) {
    const stripe = box(
      p,
      0.26,
      0.004,
      0.026,
      P.ivory,
      -1 + i * 0.8,
      0.085,
      0.77
    );
    s.animate.push(
      (t) => (stripe.position.x = ((i * 0.8 - t * 0.5 + 12) % 2.8) - 1.4)
    );
  }
}
function hobbies(s, kind) {
  const p = s.root;
  const r = doll(s, {
    mode: kind === "sew" ? "work" : kind === "fish" ? "read" : "stand",
    z: -0.25,
  });
  if (kind === "dance") {
    rug(p, P.peach);
    box(p, 0.4, 0.6, 0.35, P.wood, -1, 0.33, -0.8);
    for (const y of [0.2, 0.47])
      ball(p, 0.1, P.dark, -1, y, -0.61, [1, 1, 0.15]);
    s.animate.push((t) => {
      r.body.rotation.z = 0.14 * Math.sin(t * 3);
      r.root.position.x = 0.17 * Math.sin(t * 1.5);
      r.root.rotation.y = 0.4 * Math.sin(t * 1.5);
      r.hips.position.y = 0.68 + 0.05 * Math.abs(Math.sin(t * 3));
      r.arms.forEach((a, i) => {
        a.pivot.rotation.z = (i ? 1 : -1) * (1.1 + 0.5 * Math.sin(t * 3 + i));
        a.elbow.rotation.x = -0.4;
      });
      r.legs.forEach(
        (l, i) => (l.pivot.rotation.x = 0.35 * Math.sin(t * 3 + i * Math.PI))
      );
    });
  } else if (kind === "fish") {
    sitOn(r, chair(p, 0, -0.25, 1, P.wood));
    const pond = ball(p, 1, 0x91cdd6, 0.4, 0.07, 0.7, [1.05, 0.055, 0.62]);
    const pole = group(p, 0.1, 0.9, 0);
    rod(pole, [0, 0, 0], [0.42, 0.66, 0.7], 0.014, P.wood);
    rod(pole, [0.42, 0.66, 0.7], [0.42, -0.77, 0.7], 0.003, P.ivory);
    ball(pole, 0.04, P.peach, 0.42, -0.77, 0.7);
    for (let i = 0; i < 3; i++) {
      const ripple = ring(p, 0.15 + i * 0.1, 0.006, P.ivory, 0.52, 0.132, 0.7);
      ripple.rotation.x = -Math.PI / 2;
      s.animate.push((t) =>
        ripple.scale.setScalar(0.8 + 0.25 * Math.sin(t + i))
      );
    }
    s.animate.push((t) => {
      pole.rotation.x = 0.025 * Math.sin(t * 1.6);
      reachProp(r, 1, pole);
    });
  } else {
    const p = group(s.root, 0, 0, -0.16);
    rug(p, 0xd9d9c5);
    sitOn(r, chair(p, 0, -0.09, 1, s.colors.accent));
    table(p, 0, 0.36, 0.76, 1.3, 0.8);
    box(p, 0.52, 0.025, 0.4, P.peach, 0, 0.81, 0.42);
    box(p, 0.56, 0.06, 0.25, P.ivory, 0, 0.85, 0.27);
    box(p, 0.13, 0.42, 0.2, P.ivory, 0.22, 1.08, 0.26);
    box(p, 0.44, 0.12, 0.2, P.ivory, 0.06, 1.23, 0.26);
    const needle = rod(
      p,
      [-0.11, 1.2, 0.28],
      [-0.11, 0.84, 0.28],
      0.008,
      P.dark
    );
    cyl(p, 0.04, 0.04, 0.1, P.teal, 0.17, 1.36, 0.26);
    rod(p, [0.17, 1.29, 0.26], [0.17, 1.41, 0.26], 0.008, P.wood);
    tube(
      p,
      [
        [0.17, 1.38, 0.26],
        [-0.07, 1.31, 0.26],
        [-0.11, 1.18, 0.28],
      ],
      0.003,
      P.ivory
    );
    box(s.root, 0.14, 0.025, 0.2, P.dark, 0.105, 0.058, 0.03);
    s.animate.push((t) => {
      needle.position.y = 0.015 * Math.sin(t * 15);
      reachHand(r, 0, -0.18, 0.86, 0.34);
      reachHand(r, 1, 0.08, 0.86, 0.37);
    });
    plant(p, 1.12, -0.85, 0.8);
  }
}
function waiting(s, kind) {
  const p = s.root;
  rug(p, 0xd5ded9);
  const r = doll(s, { mode: kind === "faith" ? "faith" : "sit", z: -0.28 });
  const seat = chair(p, 0, -0.28, 1, s.colors.accent);
  sitOn(r, seat);
  plant(p, 1.13, -0.84, 0.85);
  lamp(p, -1.12, -0.72);
  table(p, 0.87, 0.36, 0.45, 0.5, 0.45);
  book(p, 0.87, 0.52, 0.36, P.peach);
  if (kind === "service") {
    const secondSeat = chair(p, 0, 0.94, ageScale(s.group), P.ivory);
    secondSeat.rotation.y = Math.PI;
    table(p, 0, 0.46, 0.74, 1.15, 0.66);
    book(p, -0.15, 0.81, 0.46, P.teal, true);
    const worker = doll(s, {
      x: 0,
      z: 0.94,
      rotation: Math.PI,
      mode: "work",
      shirt: P.ivory,
    });
    sitOn(worker, secondSeat);
  }
  if (kind === "appointment") {
    const secondSeat = chair(p, 0.68, 0.65, 0.8 * ageScale(s.group), P.ivory);
    secondSeat.rotation.y = Math.PI;
    box(p, 0.44, 0.36, 0.12, P.ivory, -0.8, 0.88, -1.24);
    box(p, 0.23, 0.06, 0.02, P.peach, -0.8, 0.88, -1.16);
    box(p, 0.06, 0.23, 0.02, P.peach, -0.8, 0.88, -1.15);
    const worker = doll(s, {
      x: 0.68,
      z: 0.65,
      rotation: Math.PI,
      mode: "work",
      scale: 0.8,
      shirt: P.ivory,
    });
    sitOn(worker, secondSeat);
  }
  if (kind === "faith") {
    for (let i = 0; i < 3; i++) {
      cyl(p, 0.05, 0.05, 0.22, P.ivory, -0.34 + i * 0.34, 0.74, 0.57);
      const flame = ball(
        p,
        0.04,
        P.yellow,
        -0.34 + i * 0.34,
        0.91,
        0.57,
        [0.7, 1.6, 0.7],
        1
      );
      s.animate.push(
        (t) => (flame.scale.y = 0.06 + 0.015 * Math.sin(t * 5 + i))
      );
    }
    table(p, 0, 0.57, 0.59, 1.25, 0.35);
  }
  if (kind === "unknown") {
    for (let i = 0; i < 3; i++) {
      const dot = ball(p, 0.055, P.wood, -0.17 + i * 0.17, 1.84, 0);
      s.animate.push(
        (t) => (dot.position.y = 1.84 + 0.04 * Math.sin(t * 2 + i))
      );
    }
  }
  if (kind === "private") {
    r.root.visible = false;
    seat.visible = false;
    s.sky.parent.visible = false;
    const door = group(p, 0.25, 0, -1.1);
    box(door, 1.02, 1.5, 0.12, P.ivory, 0, 0.79, -0.2);
    box(door, 0.81, 1.33, 0.04, s.colors.accent, 0, 0.79, -0.11);
    ball(door, 0.035, P.wood, 0.27, 0.78, -0.07);
    const sign = group(door, 0, 1.25, -0.06);
    rod(sign, [0, 0, 0], [-0.12, -0.18, 0], 0.005, P.wood);
    rod(sign, [0, 0, 0], [0.12, -0.18, 0], 0.005, P.wood);
    box(sign, 0.29, 0.13, 0.025, P.wood, 0, -0.23, 0);
    s.animate.push((t) => (sign.rotation.z = 0.09 * Math.sin(t * 1.3)));
  }
}
export function createWorld({
  group: ageGroup,
  kind,
  identity = "",
  label = "",
}) {
  const seed = [...identity].reduce(
    (v, c) => (v * 31 + c.charCodeAt(0)) >>> 0,
    7
  );
  const palettes = [
    {
      base: 0xc4d5c7,
      wall: 0xe0e9df,
      accent: 0x7da99d,
      shirt: 0xc17c60,
      curtain: 0xe9c675,
    },
    {
      base: 0xd9c6b6,
      wall: 0xefdfcc,
      accent: 0xc3967c,
      shirt: 0x6f9eae,
      curtain: 0xaac5b5,
    },
    {
      base: 0xc7d2df,
      wall: 0xe1e9ee,
      accent: 0x8daab9,
      shirt: 0xd7b05f,
      curtain: 0xdcb5ab,
    },
    {
      base: 0xd6c4ce,
      wall: 0xf0e2e4,
      accent: 0xc499ac,
      shirt: 0x86a184,
      curtain: 0xddc688,
    },
  ];
  const s = {
    scene: new T.Scene(),
    root: new T.Group(),
    group: ageGroup,
    seed,
    kind,
    label,
    animate: [],
    dynamicMaterials: [],
    people: [],
    dayObjects: [],
    colors: {
      ...palettes[seed % 4],
      skin: [0xe9bd9a, 0xc99773, 0xb18060, 0xe3b28e][seed % 4],
      hair: [0x5a463a, 0x8d6750, 0x51453b][seed % 3],
    },
  };
  s.scene.add(s.root);
  const outdoor = [
    "garden",
    "pet",
    "walk",
    "run",
    "cycle",
    "ball",
    "exercise",
    "yoga",
    "swim",
    "travel",
    "volunteer",
    "fish",
  ].includes(kind);
  room(s, {
    outdoor: outdoor || (kind === "play" && /outside|outdoor/i.test(label)),
    water: kind === "swim",
  });
  if (kind === "sleep") bed(s, ageGroup.age === "Under 1");
  else if (["work", "computer", "school", "art"].includes(kind))
    deskScene(s, kind);
  else if (["cook", "dishes"].includes(kind)) kitchen(s, kind);
  else if (["eat", "feed"].includes(kind)) dining(s, kind);
  else if (["watch", "game"].includes(kind)) mediaRoom(s, kind);
  else if (
    [
      "read",
      "watch",
      "game",
      "music",
      "listen",
      "family",
      "phone",
      "relax",
    ].includes(kind)
  )
    lounge(s, kind);
  else if (kind === "play") playroom(s, kind);
  else if (["care", "help"].includes(kind)) careScene(s, kind);
  else if (["bath", "wash"].includes(kind)) bathroom(s, kind);
  else if (["clean", "laundry", "repair"].includes(kind)) chores(s, kind);
  else if (["shop", "travel"].includes(kind)) travel(s, kind);
  else if (["dance", "fish", "sew"].includes(kind)) hobbies(s, kind);
  else if (outdoor) outdoors(s, kind);
  else waiting(s, kind);
  const ambient = new T.HemisphereLight(0xfff9ed, 0xb5b5a6, 2.4);
  s.scene.add(ambient);
  const sun = new T.DirectionalLight(0xfff0d4, 3.5);
  sun.position.set(-3, 6, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(512, 512);
  Object.assign(sun.shadow.camera, {
    left: -2.7,
    right: 2.7,
    top: 2.7,
    bottom: -2.7,
    near: 0.1,
    far: 14,
  });
  sun.shadow.bias = -0.001;
  sun.shadow.normalBias = 0.025;
  sun.shadow.radius = 3;
  s.scene.add(sun);
  s.light = sun;
  const fill = new T.DirectionalLight(0xd9e9ff, 1.1);
  fill.position.set(3, 3, -3);
  s.scene.add(fill);
  s.camera = new T.PerspectiveCamera(32, 1, 0.1, 30);
  s.camera.position.set(3.8, 3.25, 5.2);
  s.camera.lookAt(0, 0.64, 0);
  s.update = (t, minute = 720, tilt = { x: 0, y: 0 }) => {
    for (const person of s.people) person.update(t);
    for (const fn of s.animate) fn(t);
    const night = minute < 360 || minute >= 1140;
    if (s.sky) {
      s.sky.material = mat(night ? 0x596e97 : 0xb9dbe3, night ? 0.2 : 0);
      s.sun.visible = !night;
      s.moon.visible = night;
      for (const item of s.dayObjects) item.visible = !night;
    }
    s.light.intensity = night ? 2.3 : 3.5;
    s.root.rotation.y = tilt.x * 0.2;
    s.root.rotation.x = tilt.y * 0.06;
  };
  s.dispose = () => {
    sun.shadow.map?.dispose();
    for (const material of s.dynamicMaterials) material.dispose();
    s.scene.traverse((o) => {
      if (o.isMesh && ![...geometry.values()].includes(o.geometry))
        o.geometry.dispose();
    });
  };
  s.update(0);
  return s;
}
export { T };
