import { createShareUrl, readShareState } from "./share-url.js";
import { createMayhemField } from "./mayhem-field.js?v=c5feeed7";

document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const canvas = document.getElementById("canvas");
  const root = document.documentElement;
  const mayhemField = createMayhemField(canvas, {
    onImpact: () => triggerTargetImpact(),
    onDetonate: () => triggerDetonation(),
  });
  const ctx = mayhemField ? null : canvas.getContext("2d");
  const ratio = window.devicePixelRatio || 1;
  let logicalWidth = window.innerWidth;
  let logicalHeight = window.innerHeight;

  if (mayhemField) {
    root.classList.add("has-gpu-mayhem");
  } else if (ctx) {
    root.classList.add("has-canvas-mayhem");
    canvas.width = logicalWidth * ratio;
    canvas.height = logicalHeight * ratio;
    ctx.scale(ratio, ratio);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
  }
  const target = document.getElementById("target");
  const reasonDisplay = document.getElementById("reason-display");
  const fuckButton = document.getElementById("fuck-button");
  const formSection = document.getElementById("form-section");
  const urlInput = document.getElementById("url-input");
  const becauseInput = document.getElementById("because-input");
  const goButton = document.getElementById("go-button");
  const copyButton = document.getElementById("copy-button");
  const generatedUrl = document.getElementById("generated-url");
  const header = document.getElementById("header");
  const headerTitle = header.querySelector("h1");
  const reasonSection = document.getElementById("reason-section");
  const buttonSection = document.getElementById("button-section");
  const anotherSiteSection = document.getElementById("another-site-section");
  const anotherSiteButton = document.getElementById("another-site-button");
  const categorySelect = document.getElementById("category-select");
  const damageMeter = document.getElementById("damage-meter");
  const damageStatus = document.getElementById("damage-status");
  const damageFill = document.getElementById("damage-fill");
  const deathSign = document.getElementById("death-sign");
  const deathSignName = deathSign?.querySelector(".death-sign-name");
  const siteLink = document.getElementById("site-link");
  const siteImage = siteLink?.querySelector("img");
  const siteNameText = siteLink?.querySelector("span");

  let isAnimating = false;
  let enableTrail = false;
  let mouseX = -1000;
  let mouseY = -1000;
  let lastTrailX = -1000;
  let lastTrailY = -1000;
  const trailMinDist = 30;
  const trail = [];
  const trailLength = 15;
  const trailEmoji = "💨";
  let attractionRadius = Math.min(logicalWidth, logicalHeight) * 0.4;
  let repulsionRadius = Math.min(logicalWidth, logicalHeight) * 0.2;
  const particles = [];
  const explosionParticles = [];

  let isMobile =
    /Mobi|Android/i.test(navigator.userAgent) || window.innerWidth <= 600;
  const numParticles = isMobile ? 50 : 150;

  const maxSpeed = 8;
  const emojis = [
    "💩",
    "🖕",
    "🤬",
    "🔥",
    "🍆",
    "🖕🏻",
    "🖕🏼",
    "🖕🏽",
    "🖕🏾",
    "🖕🏿",
    "🤡",
    "🤮",
    "🍅",
  ];
  const attractionMultiplier = 2.0;
  const tempAttractionDuration = 60;
  const tempAttractionStrength = 5.0;
  const attractionPercentage = 0.1;
  let hasBeenFucked = false;
  let damageClicks = 0;
  let isTargetDead = false;
  let targetCenterX = 0;
  let targetCenterY = 0;
  let buttonCenterX = 0;
  let buttonCenterY = 0;
  let mouseOverTarget = false;
  let animationId;
  let resizeFrame = 0;
  let entryAnimationFrame = 0;
  let damagePopAnimation = null;
  let targetImpactAnimation = null;
  let detonationFlip = false;
  let lastVh = "";

  // Performance optimizations
  let lastClickTime = 0;
  const clickThrottle = 150;
  let shuffledIndices = [];
  let shuffleIndex = 0;
  const emojiImageCache = new Map();
  const maxDamage = 100;


  function debounce(func, delay) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // Pre-shuffle indices for better performance
  function createShuffledIndices() {
    shuffledIndices = Array.from({ length: particles.length }, (_, i) => i);
    for (let i = shuffledIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledIndices[i], shuffledIndices[j]] = [
        shuffledIndices[j],
        shuffledIndices[i],
      ];
    }
    shuffleIndex = 0;
  }

  // Create emoji images in advance
  function preCreateEmojiImages() {
    emojis.forEach((emoji) => {
      [20, 30, 40, 50].forEach((size) => {
        const key = `${emoji}_${size}`;
        if (!emojiImageCache.has(key)) {
          emojiImageCache.set(key, createEmojiImage(emoji, size));
        }
      });
    });
  }

  function createEmojiImage(emoji, size) {
    const padding = 8;
    const cs = size + padding * 2;
    const image = document.createElement("canvas");
    image.width = cs * ratio;
    image.height = cs * ratio;
    const tctx = image.getContext("2d");
    tctx.scale(ratio, ratio);
    tctx.textAlign = "center";
    tctx.textBaseline = "middle";
    tctx.font = `${size}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
    tctx.fillText(emoji, cs / 2, cs / 2);
    return { canvas: image, size: cs };
  }

  function resetDamageGame() {
    damageClicks = 0;
    isTargetDead = false;
    hasBeenFucked = false;
    headerTitle.classList.remove("glow");
    root.classList.remove(
      "mayhem-burning",
      "site-killed",
      "mayhem-detonation-a",
      "mayhem-detonation-b"
    );
    target.classList.remove("target-dead");
    target.removeAttribute("aria-disabled");
    if (deathSign) {
      deathSign.setAttribute("aria-hidden", "true");
    }
    if (deathSignName) {
      deathSignName.textContent = "";
    }
    fuckButton.disabled = false;
    fuckButton.textContent = "Yeah, Fuck It";
    if (mayhemField) {
      mayhemField.quiet();
    }
    if (damageMeter) {
      damageMeter.style.display = "none";
    }
    updateDamageMeter();
  }

  function updateDamageMeter() {
    if (!damageStatus || !damageFill) {
      return;
    }

    const percent = Math.min(100, (damageClicks / maxDamage) * 100);
    damageStatus.textContent = isTargetDead
      ? `Damage: ${maxDamage}/${maxDamage} · killed`
      : `Damage: ${damageClicks}/${maxDamage}`;
    damageFill.style.transform = `scaleX(${percent / 100})`;
  }

  function popDamageMeter() {
    if (!damageMeter || typeof damageMeter.animate !== "function") {
      return;
    }

    if (damagePopAnimation) {
      damagePopAnimation.cancel();
    }

    damagePopAnimation = damageMeter.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.06) rotate(-0.5deg)", offset: 0.35 },
        { transform: "scale(1)" },
      ],
      { duration: 220, easing: "ease-out" }
    );
  }

  function recordDamageClick() {
    if (isTargetDead) {
      return false;
    }

    damageClicks = Math.min(maxDamage, damageClicks + 1);

    if (damageMeter) {
      damageMeter.style.display = "block";
    }

    popDamageMeter();

    if (damageClicks >= maxDamage) {
      killTarget();
    }

    updateDamageMeter();
    return !isTargetDead;
  }

  function killTarget() {
    if (isTargetDead) {
      return;
    }

    isTargetDead = true;
    root.classList.add("site-killed", "mayhem-burning");
    if (mayhemField) {
      mayhemField.windDown();
    } else if (ctx) {
      isAnimating = false;
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      setTimeout(() => {
        particles.length = 0;
        explosionParticles.length = 0;
        trail.length = 0;
        ctx.clearRect(0, 0, logicalWidth, logicalHeight);
      }, 3600);
    }
    if (targetImpactAnimation) {
      targetImpactAnimation.cancel();
      targetImpactAnimation = null;
    }
    target.classList.remove("wobble");
    const siteName = siteNameText?.textContent.trim();
    if (deathSignName) {
      deathSignName.textContent = siteName ? `RIP ${siteName}` : "RIP this page";
    }
    if (deathSign) {
      deathSign.setAttribute("aria-hidden", "false");
    }
    target.classList.add("target-dead");
    target.setAttribute("aria-disabled", "true");
    fuckButton.disabled = true;
    fuckButton.textContent = "Killed";
    if (siteLink) {
      siteLink.removeAttribute("href");
      siteLink.setAttribute("aria-disabled", "true");
      siteLink.setAttribute("tabindex", "-1");
    }
  }

  const updateCenters = () => {
    const targetRect = target.getBoundingClientRect();
    const visibleTarget = targetRect.width > 0 && targetRect.height > 0;
    targetCenterX = visibleTarget
      ? targetRect.left + targetRect.width / 2
      : logicalWidth / 2;
    targetCenterY = visibleTarget
      ? targetRect.top + targetRect.height / 2
      : logicalHeight / 2;

    const buttonRect = fuckButton.getBoundingClientRect();
    const visibleButton = buttonRect.width > 0 && buttonRect.height > 0;
    buttonCenterX = visibleButton
      ? buttonRect.left + buttonRect.width / 2
      : logicalWidth / 2;
    buttonCenterY = visibleButton
      ? buttonRect.top + buttonRect.height / 2
      : logicalHeight * 0.66;

    if (mayhemField) {
      mayhemField.setTarget(targetCenterX, targetCenterY);
      mayhemField.setButton(buttonCenterX, buttonCenterY);
    }
  };

  function restartEntryAnimations() {
    const entryAnimations = [
      [header, "animate-header"],
      [target, "animate-target"],
      [reasonSection, "animate-reason"],
      [buttonSection, "animate-button"],
      [anotherSiteSection, "animate-another"],
    ];

    if (entryAnimationFrame) {
      cancelAnimationFrame(entryAnimationFrame);
    }

    entryAnimations.forEach(([element, className]) => {
      element.classList.remove(className);
    });

    entryAnimationFrame = requestAnimationFrame(() => {
      entryAnimations.forEach(([element, className]) => {
        element.classList.add(className);
      });
      entryAnimationFrame = 0;
    });
  }

  const loadContent = () => {
    const state = readShareState(location.search);
    root.classList.toggle("is-index", !state);
    root.classList.toggle("is-non-index", Boolean(state));
    resetDamageGame();

    if (!state) {
      headerTitle.textContent = "Fuck This Page";
      document.title = "Fuck This Page: Because... reasons";
      isAnimating = false;
      if (animationId) cancelAnimationFrame(animationId);
      if (ctx) ctx.clearRect(0, 0, logicalWidth, logicalHeight);
      formSection.style.display = "block";
      formSection.classList.add("animate-form"); // Trigger form animation
      header.style.display = "block";
      header.classList.add("animate-header"); // Ensure header animation
      [target, reasonSection, buttonSection, anotherSiteSection].forEach(
        (el) => (el.style.display = "none")
      );

      if (mayhemField) {
        mayhemField.quiet();
      }
    } else {
      formSection.style.display = "none"; // Hide form when URL has parameters
      anotherSiteSection.style.display = "block";
      [header, target, reasonSection, buttonSection].forEach(
        (el) => (el.style.display = "block")
      );

      restartEntryAnimations();

      const { site, because, category, url } = state;
      headerTitle.textContent = `Fuck This ${category}`;
      document.title = `Fuck This ${category}: ${site}`;

      const fullUrl = url.href;
      url.searchParams.set("ref", "kyrylo.org");
      siteLink.href = url.href;
      siteLink.removeAttribute("aria-disabled");
      siteLink.removeAttribute("tabindex");

      siteImage.style.visibility = "hidden";
      siteImage.src = `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(
        fullUrl
      )}`;
      siteImage.onload = () => {
        siteImage.style.visibility = "visible";
      };
      siteImage.onerror = () => {
        siteImage.onerror = null;
        siteImage.src = "/fuck-this-page/assets/images/favicons/favicon.svg";
        siteImage.style.visibility = "visible";
      };

      siteNameText.textContent = site;

      reasonDisplay.textContent = `Because ${because}`;
      anotherSiteButton.textContent = `Try another ${category}`;

      setTimeout(updateCenters, 0);
    }
    updateCenters();
  };

  loadContent();

  window.addEventListener("popstate", loadContent);

  const currentShareUrl = () => createShareUrl(
    urlInput.value, becauseInput.value, categorySelect.value, location.origin
  );

  const updateGeneratedUrl = () => {
    generatedUrl.textContent = currentShareUrl() || "";
  };

  urlInput.addEventListener("input", updateGeneratedUrl);
  becauseInput.addEventListener("input", updateGeneratedUrl);
  categorySelect.addEventListener("change", updateGeneratedUrl);

  const handleFormAction = (action) => {
    const shareUrl = currentShareUrl();
    if (!shareUrl) {
      urlInput.setCustomValidity("Enter a website URL, such as example.com.");
      urlInput.reportValidity();
      return;
    }
    if (action === "go") {
      history.pushState({}, "", shareUrl);
      loadContent();
      window.scrollTo(0, 0);
      setTimeout(updateCenters, 0);
    } else if (action === "copy") {
      navigator.clipboard.writeText(shareUrl).then(() => {
        copyButton.textContent = "Copied!";
        setTimeout(() => {
          copyButton.textContent = "Copy URL";
        }, 2000);
      }).catch(() => {
        copyButton.textContent = "Select the URL above to copy";
      });
    }
  };

  urlInput.addEventListener("input", () => urlInput.setCustomValidity(""));
  document.getElementById("submission-form").addEventListener("submit", (event) => {
    event.preventDefault();
    handleFormAction("go");
  });
  goButton.addEventListener("click", () => handleFormAction("go"));
  copyButton.addEventListener("click", () => handleFormAction("copy"));

  const updateRadii = () => {
    attractionRadius = Math.min(logicalWidth, logicalHeight) * 0.4;
    repulsionRadius = Math.min(logicalWidth, logicalHeight) * 0.2;
  };

  const updateVh = () => {
    const vh = `${window.innerHeight * 0.01}px`;
    if (vh !== lastVh) {
      lastVh = vh;
      root.style.setProperty("--vh", vh);
    }
  };

  const handleResize = () => {
    logicalWidth = window.innerWidth;
    logicalHeight = window.innerHeight;
    if (mayhemField) {
      mayhemField.resize(logicalWidth, logicalHeight);
    } else if (ctx) {
      canvas.width = logicalWidth * ratio;
      canvas.height = logicalHeight * ratio;
      ctx.scale(ratio, ratio);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
    }
    updateRadii();
    updateCenters();
    updateVh();
    resizeFrame = 0;
  };

  window.addEventListener("resize", () => {
    if (resizeFrame) {
      return;
    }
    resizeFrame = requestAnimationFrame(handleResize);
  });

  updateVh();

  const updateMousePos = (e) => {
    const wantsPointer =
      enableTrail || (mayhemField && mayhemField.isPointerInteractive());
    if (!wantsPointer) {
      return;
    }

    let newX, newY;
    if (e.touches) {
      if (e.touches.length > 0) {
        newX = e.touches[0].clientX;
        newY = e.touches[0].clientY;
      }
    } else {
      newX = e.clientX;
      newY = e.clientY;
    }

    if (!Number.isFinite(newX) || !Number.isFinite(newY)) {
      return;
    }
    const dist = Math.hypot(newX - lastTrailX, newY - lastTrailY);
    if (enableTrail && dist > trailMinDist) {
      mouseX = newX;
      mouseY = newY;
      trail.push({ x: mouseX, y: mouseY, life: trailLength });
      lastTrailX = mouseX;
      lastTrailY = newY;
    } else {
      mouseX = newX;
      mouseY = newY;
    }

    if (mayhemField && mayhemField.isPointerInteractive()) {
      mayhemField.setPointer(mouseX, mouseY);
    }
  };

  document.addEventListener("mousemove", updateMousePos, { passive: true });
  document.addEventListener("touchmove", updateMousePos, { passive: true });

  // Optimized particle attraction with throttling
  const attractParticles = () => {
    if (isTargetDead) {
      return;
    }

    const now = Date.now();
    if (now - lastClickTime < clickThrottle) return;
    lastClickTime = now;

    if (mayhemField) {
      mayhemField.attract();
      if (!hasBeenFucked) {
        target.style.transform = "scale(1.2)";
        setTimeout(() => {
          target.style.transform = "scale(1)";
        }, 300);
      }
      return;
    }

    // Use pre-shuffled indices instead of sorting
    if (
      shuffleIndex >=
      shuffledIndices.length -
        Math.floor(particles.length * attractionPercentage)
    ) {
      createShuffledIndices();
    }

    const numToSelect = Math.floor(particles.length * attractionPercentage);
    for (let i = 0; i < numToSelect; i++) {
      const particleIndex = shuffledIndices[shuffleIndex + i];
      if (particles[particleIndex]) {
        particles[particleIndex].tempAttractTimer = tempAttractionDuration;
      }
    }
    shuffleIndex += numToSelect;

    if (!hasBeenFucked) {
      target.style.transform = "scale(1.2)";
      setTimeout(() => {
        target.style.transform = "scale(1)";
      }, 300);
    }
  };

  target.addEventListener("click", (e) => {
    attractParticles();
  });

  target.addEventListener(
    "touchstart",
    (e) => {
      attractParticles();
    },
    { passive: false }
  );

  function isMouseOverTarget() {
    const targetRect = target.getBoundingClientRect();
    return (
      mouseX >= targetRect.left &&
      mouseX <= targetRect.right &&
      mouseY >= targetRect.top &&
      mouseY <= targetRect.bottom
    );
  }

  function triggerTargetImpact() {
    hasBeenFucked = true;
    if (typeof target.animate === "function") {
      if (targetImpactAnimation) {
        targetImpactAnimation.cancel();
      }
      targetImpactAnimation = target.animate(
        [
          { transform: "translate(0, 0) rotate(0)" },
          { transform: "translate(-2px, -20px) rotate(-2deg)", offset: 0.1 },
          { transform: "translate(2px, 0) rotate(2deg)", offset: 0.2 },
          { transform: "translate(-1px, -15px) rotate(-1deg)", offset: 0.3 },
          { transform: "translate(1px, 0) rotate(1deg)", offset: 0.4 },
          { transform: "translate(0, -10px) rotate(0)", offset: 0.5 },
          { transform: "translate(0, 0) rotate(0)", offset: 0.6 },
          { transform: "translate(0, -5px) rotate(0)", offset: 0.7 },
          { transform: "translate(0, 0) rotate(0)", offset: 0.8 },
          { transform: "translate(0, -2px) rotate(0)", offset: 0.9 },
          { transform: "translate(0, 0) rotate(0)" },
        ],
        { duration: 1000, easing: "ease-in-out" }
      );
      targetImpactAnimation.onfinish = () => {
        targetImpactAnimation = null;
      };
    } else {
      target.classList.add("wobble");
      setTimeout(() => {
        target.classList.remove("wobble");
      }, 1000);
    }
    root.classList.remove("mayhem-impact");
    root.classList.add("mayhem-impact");
    setTimeout(() => {
      root.classList.remove("mayhem-impact");
    }, 220);
  }

  function triggerDetonation() {
    const blastY = Math.min(logicalHeight * 0.58, targetCenterY + 96);
    const blastMargin = 12;
    const desiredBlastRadius = Math.min(
      Math.min(logicalWidth, logicalHeight) * 0.42,
      360
    );
    const edgeLimitedBlastRadius = Math.max(
      24,
      Math.min(
        targetCenterX - blastMargin,
        logicalWidth - targetCenterX - blastMargin,
        blastY - blastMargin,
        logicalHeight - blastY - blastMargin
      )
    );
    const blastRadius = Math.min(desiredBlastRadius, edgeLimitedBlastRadius);
    root.style.setProperty("--blast-x", `${targetCenterX}px`);
    root.style.setProperty("--blast-y", `${blastY}px`);
    root.style.setProperty("--blast-radius", `${blastRadius}px`);
    const previousClass = detonationFlip
      ? "mayhem-detonation-a"
      : "mayhem-detonation-b";
    const nextClass = detonationFlip
      ? "mayhem-detonation-b"
      : "mayhem-detonation-a";
    detonationFlip = !detonationFlip;
    root.classList.remove(previousClass);
    root.classList.add(nextClass);
    setTimeout(() => {
      root.classList.remove(nextClass);
    }, 1300);
    setTimeout(() => {
      root.classList.add("mayhem-burning");
    }, 900);
  }

  class Particle {
    constructor(isExplosion = false, parent = null, outside = false) {
      if (isExplosion) {
        this.x = parent.x;
        this.y = parent.y;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.size = parent.size / 2;
        this.emoji = parent.emoji;
        this.life = Math.random() * 20 + 20;
        this.rotation = Math.random() * Math.PI * 2;
        this.spin = (Math.random() - 0.5) * 0.1;
      } else {
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.emoji = emojis[Math.floor(Math.random() * emojis.length)];

        let isMobile =
          /Mobi|Android/i.test(navigator.userAgent) || window.innerWidth <= 600;
        this.size = isMobile
          ? Math.random() * 20 + 15
          : Math.random() * 40 + 20;

        this.rotation = Math.random() * Math.PI * 2;
        this.spin = (Math.random() - 0.5) * 0.1;
        this.tempAttractTimer = 0;

        if (outside) {
          const edge = Math.floor(Math.random() * 4);
          switch (edge) {
            case 0:
              this.x = -this.size;
              this.y = Math.random() * logicalHeight;
              this.vx = Math.abs(this.vx) + 1;
              break;
            case 1:
              this.x = logicalWidth + this.size;
              this.y = Math.random() * logicalHeight;
              this.vx = -Math.abs(this.vx) - 1;
              break;
            case 2:
              this.x = Math.random() * logicalWidth;
              this.y = -this.size;
              this.vy = Math.abs(this.vy) + 1;
              break;
            case 3:
              this.x = Math.random() * logicalWidth;
              this.y = logicalHeight + this.size;
              this.vy = -Math.abs(this.vy) - 1;
              break;
          }
        } else {
          this.x = Math.random() * logicalWidth;
          this.y = Math.random() * logicalHeight;
        }
      }
      this.setImageFromCache();
    }

    setImageFromCache() {
      const roundedSize = Math.round(this.size / 10) * 10;
      const key = `${this.emoji}_${roundedSize}`;
      const cached = emojiImageCache.get(key);
      if (cached) {
        this.image = cached.canvas;
        this.canvasSize = cached.size;
      } else {
        this.createImage();
      }
    }

    createImage() {
      const s = this.size;
      const padding = 8;
      const cs = s + padding * 2;
      const image = document.createElement("canvas");
      image.width = cs * ratio;
      image.height = cs * ratio;
      const tctx = image.getContext("2d");
      tctx.scale(ratio, ratio);
      tctx.textAlign = "center";
      tctx.textBaseline = "middle";
      tctx.font = `${s}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
      tctx.fillText(this.emoji, cs / 2, cs / 2);
      this.image = image;
      this.canvasSize = cs;
    }

    update() {
      if (this.life !== undefined) {
        if (this.emoji === "💦") {
          this.vx += 0.1;
          this.vy += 0.2;
        }
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.95;
        this.vy *= 0.95;
        this.rotation += this.spin;
        this.life--;
        return;
      }

      if (!mouseOverTarget) {
        const dxMouse = this.x - mouseX;
        const dyMouse = this.y - mouseY;
        const distMouseSq = dxMouse * dxMouse + dyMouse * dyMouse;
        const repulsionRadiusSq = repulsionRadius * repulsionRadius;
        if (distMouseSq < repulsionRadiusSq) {
          const distMouse = Math.sqrt(distMouseSq);
          const force = (1 - distMouse / repulsionRadius) * 5;
          this.vx += (dxMouse / distMouse) * force;
          this.vy += (dyMouse / distMouse) * force;
        }
      }

      this.x += this.vx;
      this.y += this.vy;
      this.rotation += this.spin;

      if (this.x < 0 || this.x > logicalWidth) this.vx *= -1;
      if (this.y < 0 || this.y > logicalHeight) this.vy *= -1;

      const dx = targetCenterX - this.x;
      const dy = targetCenterY - this.y;
      const distSq = dx * dx + dy * dy;

      const attractionRadiusSq = attractionRadius * attractionRadius;
      if (distSq < attractionRadiusSq) {
        const dist = Math.sqrt(distSq);
        if (dist > 0.001) {
          this.vx += (dx / dist) * attractionMultiplier;
          this.vy += (dy / dist) * attractionMultiplier;
        }
      }

      if (this.tempAttractTimer > 0) {
        this.tempAttractTimer--;
        const dist = Math.sqrt(distSq);
        if (dist > 0.001) {
          this.vx += (dx / dist) * tempAttractionStrength;
          this.vy += (dy / dist) * tempAttractionStrength;
        }
      }

      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (speed > maxSpeed) {
        this.vx = (this.vx / speed) * maxSpeed;
        this.vy = (this.vy / speed) * maxSpeed;
      }

      const halfSizeSq = (this.size / 2) * (this.size / 2);
      if (distSq < halfSizeSq) {
        this.explode();
        this.triggerShake();
        this.reset();
      }
    }

    triggerShake() {
      triggerTargetImpact();
    }

    draw() {
      ctx.save();
      ctx.translate(Math.round(this.x), Math.round(this.y));
      ctx.rotate(this.rotation);
      if (this.life !== undefined) {
        ctx.globalAlpha = this.life / 40;
      }
      ctx.drawImage(
        this.image,
        -this.canvasSize / 2,
        -this.canvasSize / 2,
        this.canvasSize,
        this.canvasSize
      );
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    explode() {
      for (let i = 0; i < 2; i++) {
        explosionParticles.push(new Particle(true, this));
      }
    }

    reset() {
      this.x = Math.random() * logicalWidth;
      this.y = Math.random() * logicalHeight;
      this.vx = (Math.random() - 0.5) * 2;
      this.vy = (Math.random() - 0.5) * 2;
      this.emoji = emojis[Math.floor(Math.random() * emojis.length)];

      let isMobile =
        /Mobi|Android/i.test(navigator.userAgent) || window.innerWidth <= 600;
      this.size = isMobile ? Math.random() * 20 + 15 : Math.random() * 40 + 20;

      this.rotation = Math.random() * Math.PI * 2;
      this.spin = (Math.random() - 0.5) * 0.1;
      this.tempAttractTimer = 0;
      this.setImageFromCache();
    }
  }

  // Throttled splash burst to prevent overload
  function createSplashBurst(num) {
    if (explosionParticles.length > 200) return;

    // Batch create particles to reduce per-frame overhead
    const particlesToCreate = Math.min(num, 5); // Limit burst size
    for (let i = 0; i < particlesToCreate; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const speed = Math.random() * 15 + 10;
      const p = new Particle(true, {
        x: buttonCenterX,
        y: buttonCenterY,
        emoji: "💦",
        size: 30,
      });
      p.emoji = "💦";
      p.size = Math.random() * 20 + 10;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.life = Math.random() * 30 + 30;
      p.spin = (Math.random() - 0.5) * 0.05;
      p.setImageFromCache();
      explosionParticles.push(p);
    }
  }

  function triggerThrustExplosion() {
    if (isTargetDead) {
      return;
    }

    if (mayhemField) {
      mayhemField.burst(buttonCenterX, buttonCenterY);
      return;
    }

    const now = Date.now();
    if (now - lastClickTime < clickThrottle) return;
    createSplashBurst(5); // Reduced from 10
  }

  function animate() {
    if (!isAnimating || !ctx) return;

    try {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, logicalWidth, logicalHeight);

      mouseOverTarget = isMouseOverTarget();

      if (enableTrail) {
        ctx.font = '12px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
        for (let i = trail.length - 1; i >= 0; i--) {
          const point = trail[i];
          ctx.fillStyle = `rgba(139, 69, 19, ${point.life / trailLength})`;
          ctx.fillText(trailEmoji, Math.round(point.x), Math.round(point.y));

          point.life--;
          if (point.life <= 0) {
            trail.splice(i, 1);
          }
        }
      }

      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      // More aggressive explosion particle cleanup
      if (explosionParticles.length > 150) {
        explosionParticles.splice(0, explosionParticles.length - 150);
      }
      for (let i = explosionParticles.length - 1; i >= 0; i--) {
        const p = explosionParticles[i];
        p.update();
        if (p.life > 0) {
          p.draw();
        } else {
          explosionParticles.splice(i, 1);
        }
      }

      animationId = requestAnimationFrame(animate);
    } catch (error) {
      console.error("Animation error:", error);
      isAnimating = false;
    }
  }

  function startAnimation() {
    if (mayhemField) {
      mayhemField.start();
      return;
    }

    if (!isAnimating) {
      isAnimating = true;
      enableTrail = true;
      trail.length = 0;
      animate();
    }
  }

  function initAnimations() {
    if (mayhemField) {
      mayhemField.resize(logicalWidth, logicalHeight);
      updateCenters();
      return;
    }

    if (!ctx) {
      return;
    }

    // Pre-create emoji images for better performance
    preCreateEmojiImages();

    for (let i = 0; i < numParticles; i++) {
      particles.push(new Particle(false, null, true));
    }
    createShuffledIndices();
  }

  const debouncedHeavyStuff = debounce(() => {
    startAnimation();
    attractParticles();
    headerTitle.classList.add("glow");
  }, 100); // Reduced debounce time

  fuckButton.addEventListener("click", () => {
    if (damageClicks === 0) {
      updateCenters();
    }
    if (!recordDamageClick()) {
      return;
    }
    triggerThrustExplosion();
    debouncedHeavyStuff();
  });

  fuckButton.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      if (damageClicks === 0) {
        updateCenters();
      }
      if (!recordDamageClick()) {
        return;
      }
      triggerThrustExplosion();
      debouncedHeavyStuff();
    },
    { passive: false }
  );

  updateCenters();
  setTimeout(updateCenters, 2000);

  initAnimations();
});
