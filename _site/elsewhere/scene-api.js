let engine,
  pending,
  moving = true;
const slots = new Map();
export function updateMiniature(element, spec) {
  slots.set(element, spec);
  if (engine) {
    engine.update(element, spec);
    return;
  }
  if (!pending)
    pending = import("./illustrated-scenes.js")
      .then(({ createIllustrations }) => {
        engine = createIllustrations();
        engine.setMotion(moving);
        for (const [el, value] of slots)
          if (el.isConnected) engine.update(el, value);
        document.documentElement.dataset.miniatures = "illustrated";
      })
      .catch((error) => {
        document.documentElement.dataset.miniatures = "fallback";
        console.warn(
          "Same24 illustrations are unavailable on this device.",
          error
        );
      });
}
export function setMiniatureMotion(value) {
  moving = value;
  engine?.setMotion(value);
}
export function refreshMiniatures() {
  engine?.refresh();
}
export function miniatureStats() {
  return engine?.stats || null;
}
