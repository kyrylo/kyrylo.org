import { createWorld, T } from "./miniature-worlds.js";
import { sceneKind } from "./scene-kinds.js";
// One WebGL context, shared by all miniatures, including the enlarged diary view.
// The visible canvases receive the rendered frames; no canvas/context per 3D scene.
export function createMiniatures() {
  const renderer = new T.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
    preserveDrawingBuffer: true,
  });
  renderer.setClearColor(0xffffff, 0);
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  const views = new Map(),
    reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let raf = 0,
    last = 0,
    elapsed = 0,
    enabled = true,
    dirty = true,
    frame = 0,
    lost = false;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const v = views.get(e.target);
        if (v) {
          v.visible = e.isIntersecting;
          dirty = true;
        }
      }
      wake();
    },
    { rootMargin: "60px" }
  );
  const ro = new ResizeObserver(() => {
    dirty = true;
    wake();
  });
  renderer.domElement.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    lost = true;
    document.documentElement.dataset.miniatures = "fallback";
    cancelAnimationFrame(raf);
    raf = 0;
    for (const v of views.values()) v.el.classList.remove("scene-ready");
  });
  renderer.domElement.addEventListener("webglcontextrestored", () => {
    lost = false;
    document.documentElement.dataset.miniatures = "webgl";
    for (const v of views.values()) {
      v.world?.dispose();
      v.world = null;
    }
    dirty = true;
    wake();
  });
  function wake() {
    if (!raf && !document.hidden && !lost) raf = requestAnimationFrame(tick);
  }
  function update(el, spec) {
    let v = views.get(el);
    if (!v) {
      const canvas = document.createElement("canvas");
      canvas.className = "miniature-canvas";
      canvas.setAttribute("aria-hidden", "true");
      el.append(canvas);
      v = {
        el,
        canvas,
        ctx: canvas.getContext("2d"),
        world: null,
        visible: false,
        tilt: { x: 0, y: 0 },
        target: { x: 0, y: 0 },
        birth: elapsed,
      };
      views.set(el, v);
      io.observe(el);
      ro.observe(el);
      let dragging = false,
        startX = 0,
        startTilt = 0;
      el.addEventListener("pointermove", (e) => {
        if (reduced.matches) return;
        const b = el.getBoundingClientRect();
        if (el.classList.contains("miniature-large")) {
          if (dragging)
            v.target.x = Math.max(
              -3.5,
              Math.min(3.5, startTilt + (e.clientX - startX) / 90)
            );
        } else {
          v.target.x = ((e.clientX - b.left) / b.width - 0.5) * 1.7;
          v.target.y = ((e.clientY - b.top) / b.height - 0.5) * 1.2;
        }
        dirty = true;
        wake();
      });
      el.addEventListener("pointerleave", () => {
        if (!el.classList.contains("miniature-large"))
          v.target = { x: 0, y: 0 };
      });
      el.addEventListener("pointerdown", (e) => {
        if (!el.classList.contains("miniature-large")) return;
        dragging = true;
        startX = e.clientX;
        startTilt = v.target.x;
        el.setPointerCapture(e.pointerId);
      });
      el.addEventListener("pointerup", () => (dragging = false));
      el.addEventListener("pointercancel", () => (dragging = false));
      el.addEventListener("keydown", (e) => {
        if (!["ArrowLeft", "ArrowRight", "Home"].includes(e.key)) return;
        e.preventDefault();
        v.target.x =
          e.key === "Home"
            ? 0
            : Math.max(
                -3.5,
                Math.min(
                  3.5,
                  v.target.x + (e.key === "ArrowRight" ? 0.5 : -0.5)
                )
              );
        dirty = true;
        wake();
      });
    }
    const kind = sceneKind(spec.code, spec.activity, spec.group),
      key = `${spec.identity}:${kind}:${spec.activity.label}`;
    if (v.key !== key) {
      v.world?.dispose();
      v.world = null;
      v.key = key;
      v.birth = elapsed;
      v.el.classList.remove("scene-ready");
    }
    v.spec = { ...spec, kind };
    el.dataset.scene = kind;
    el.dataset.age = spec.group.age;
    el.dataset.code = spec.code;
    dirty = true;
    wake();
  }
  function tick(now) {
    raf = 0;
    if (document.hidden || lost) return;
    if (now - last < 1000 / 30) {
      wake();
      return;
    }
    const delta = Math.min((now - last) / 1000, 0.1);
    last = now;
    if (enabled && !reduced.matches) elapsed += delta;
    const active = !reduced.matches && enabled;
    if (!dirty && !active) return;
    dirty = false;
    frame++;
    for (const [el, v] of views) {
      if (!el.isConnected) {
        v.world?.dispose();
        io.unobserve(el);
        ro.unobserve(el);
        views.delete(el);
        continue;
      }
      if (!v.visible || !el.getClientRects().length) continue;
      if (document.querySelector("dialog[open]") && !el.closest("dialog[open]"))
        continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) continue;
      if (!v.world) {
        v.world = createWorld({
          group: v.spec.group,
          kind: v.spec.kind,
          identity: v.spec.identity,
          label: v.spec.activity.label,
        });
        v.birth = elapsed;
      }
      const dpr = Math.min(devicePixelRatio || 1, 1.6),
        w = Math.round(rect.width * dpr),
        h = Math.round(rect.height * dpr);
      if (v.canvas.width !== w || v.canvas.height !== h) {
        v.canvas.width = w;
        v.canvas.height = h;
      }
      renderer.setSize(w, h, false);
      v.world.camera.aspect = w / h;
      v.world.camera.updateProjectionMatrix();
      const ease = reduced.matches ? 1 : 0.12;
      v.tilt.x += (v.target.x - v.tilt.x) * ease;
      v.tilt.y += (v.target.y - v.tilt.y) * ease;
      if (
        Math.abs(v.tilt.x - v.target.x) > 0.001 ||
        Math.abs(v.tilt.y - v.target.y) > 0.001
      )
        dirty = true;
      v.world.update(reduced.matches ? 1.4 : elapsed, v.spec.minute, v.tilt);
      const entrance =
        reduced.matches || !enabled
          ? 1
          : Math.min(1, (elapsed - v.birth) / 0.65);
      const smooth = 1 - Math.pow(1 - entrance, 3);
      v.world.root.scale.setScalar(0.9 + 0.1 * smooth);
      v.world.root.position.y = -0.12 * (1 - smooth);
      renderer.shadowMap.autoUpdate =
        frame % 3 === 0 || entrance < 1 || !active;
      renderer.render(v.world.scene, v.world.camera);
      v.ctx.clearRect(0, 0, w, h);
      v.ctx.drawImage(renderer.domElement, 0, 0, w, h);
      el.classList.add("scene-ready");
      el.dataset.rendered = "true";
      el.dataset.frame = String(frame);
    }
    if (active || dirty) wake();
  }
  function visibility() {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else {
      last = performance.now();
      dirty = true;
      wake();
    }
  }
  document.addEventListener("visibilitychange", visibility);
  window.addEventListener("pageshow", visibility);
  reduced.addEventListener("change", () => {
    dirty = true;
    wake();
  });
  // Opening/closing a native dialog changes what is visible without scrolling.
  new MutationObserver(() => {
    dirty = true;
    wake();
  }).observe(document.body, {
    subtree: true,
    attributes: true,
    attributeFilter: ["open"],
  });
  return {
    update,
    setMotion(value) {
      enabled = value;
      dirty = true;
      wake();
    },
    refresh() {
      dirty = true;
      wake();
    },
    get stats() {
      return {
        contexts: 1,
        views: views.size,
        frames: frame,
        geometries: renderer.info.memory.geometries,
        textures: renderer.info.memory.textures,
        programs: renderer.info.programs.length,
      };
    },
  };
}
