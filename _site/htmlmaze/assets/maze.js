(() => {
  const canvas = document.querySelector("#canvas");

  if (canvas) {
    const context = canvas.getContext("2d");
    const background = canvas.dataset.background || "#000000";
    const snapshotUrl = canvas.dataset.snapshot;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    let snapshot = null;

    const sizeCanvas = () => {
      canvas.width = Math.round(window.innerWidth * pixelRatio);
      canvas.height = Math.round(window.innerHeight * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const restoreWall = () => {
      context.fillStyle = background;
      context.fillRect(0, 0, window.innerWidth, window.innerHeight);
      if (snapshot) context.drawImage(snapshot, 0, 0);
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

    window.addEventListener("resize", loadWall);
    loadWall();
  }

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
})();
