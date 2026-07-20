(() => {
  const canvas = document.querySelector("#canvas");
  if (!canvas) return;

  const context = canvas.getContext("2d");
  const background = canvas.dataset.background || "#000000";
  const stroke = canvas.dataset.stroke || "#ffffff";
  const snapshotUrl = canvas.dataset.snapshot;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  let snapshot = null;
  let drawing = false;
  let erasing = false;
  let lastX = 0;
  let lastY = 0;

  const sizeCanvas = () => {
    canvas.width = Math.round(window.innerWidth * pixelRatio);
    canvas.height = Math.round(window.innerHeight * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  };

  const restoreWall = () => {
    context.save();
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.fillStyle = background;
    context.fillRect(0, 0, window.innerWidth, window.innerHeight);
    if (snapshot) context.drawImage(snapshot, 0, 0);
    context.restore();
    canvas.style.opacity = "1";
  };

  const loadWall = () => {
    sizeCanvas();
    if (!snapshotUrl) {
      restoreWall();
      return;
    }

    const image = new Image();
    image.addEventListener("load", () => {
      snapshot = image;
      restoreWall();
    });
    image.addEventListener("error", restoreWall);
    image.src = snapshotUrl;
  };

  const position = (event) => [event.clientX, event.clientY];

  const begin = (event) => {
    if (event.pointerType === "touch") return;
    if (event.button !== 0 && event.button !== 2) return;

    event.preventDefault();
    drawing = true;
    erasing = event.button === 2;
    [lastX, lastY] = position(event);
    canvas.setPointerCapture?.(event.pointerId);
    canvas.style.cursor = erasing
      ? `url("${canvas.dataset.eraser}") 4 4, auto`
      : `url("${canvas.dataset.pencil}") 4 4, crosshair`;
  };

  const draw = (event) => {
    if (!drawing) return;

    const [x, y] = position(event);
    context.beginPath();
    context.moveTo(lastX, lastY);
    context.lineTo(x, y);
    context.strokeStyle = erasing ? background : stroke;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = erasing ? 24 : 2;
    context.stroke();
    lastX = x;
    lastY = y;
  };

  const end = (event) => {
    if (!drawing) return;
    drawing = false;
    canvas.releasePointerCapture?.(event.pointerId);
    canvas.style.cursor = "crosshair";
  };

  canvas.addEventListener("pointerdown", begin);
  canvas.addEventListener("pointermove", draw);
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);
  canvas.addEventListener("contextmenu", (event) => event.preventDefault());
  window.addEventListener("resize", () => {
    sizeCanvas();
    restoreWall();
  });

  document.querySelector("[data-reset-canvas]")?.addEventListener("click", (event) => {
    restoreWall();
    const button = event.currentTarget;
    button.textContent = "Wall reset locally";
    window.setTimeout(() => { button.textContent = "Reset this wall"; }, 1600);
  });

  document.querySelectorAll("a[data-direction]").forEach((link) => {
    link.addEventListener("click", () => {
      document.documentElement.dataset.navDirection = link.dataset.direction;
      sessionStorage.setItem("htmlmaze-direction", link.dataset.direction);
    });
  });

  const arrivingDirection = sessionStorage.getItem("htmlmaze-direction");
  if (arrivingDirection) {
    document.documentElement.dataset.navDirection = arrivingDirection;
    sessionStorage.removeItem("htmlmaze-direction");
  }

  loadWall();
})();
