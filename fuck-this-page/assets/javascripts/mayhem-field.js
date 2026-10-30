const SPRITE_TILE_SIZE = 96;
const SPRITE_COLUMNS = 4;
const DPR_CAP = 2;
const MOBILE_PARTICLES = 50;
const DESKTOP_PARTICLES = 150;
const PARTICLE_STRIDE = 5;

const DEFAULT_SPRITES = [
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
  "💦",
  "💥",
  "💣",
];

const VERTEX_SHADER = `
  attribute vec2 a_position;
  attribute float a_size;
  attribute float a_sprite;
  attribute float a_alpha;

  uniform vec2 u_resolution;

  varying float v_sprite;
  varying float v_alpha;

  void main() {
    vec2 clip = (a_position / u_resolution) * 2.0 - 1.0;
    gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
    gl_PointSize = a_size;
    v_sprite = a_sprite;
    v_alpha = a_alpha;
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;

  uniform sampler2D u_atlas;
  uniform float u_columns;

  varying float v_sprite;
  varying float v_alpha;

  void main() {
    float column = mod(v_sprite, u_columns);
    float row = floor(v_sprite / u_columns);
    vec2 tile = vec2(column, row);
    vec2 uv = (tile + gl_PointCoord) / u_columns;
    vec4 color = texture2D(u_atlas, uv);

    if (color.a < 0.04) {
      discard;
    }

    gl_FragColor = vec4(color.rgb * v_alpha * 0.9, color.a * v_alpha);
  }
`;

export function createMayhemField(canvas, options = {}) {
  const gl =
    canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      powerPreference: "high-performance",
    }) || canvas.getContext("experimental-webgl", { alpha: true });

  if (!gl) {
    return null;
  }

  try {
    return new MayhemField(canvas, gl, options);
  } catch (error) {
    console.warn("WebGL mayhem unavailable:", error);
    return null;
  }
}

class MayhemField {
  constructor(canvas, gl, options) {
    this.canvas = canvas;
    this.gl = gl;
    this.sprites = options.sprites || DEFAULT_SPRITES;
    this.onImpact = options.onImpact || (() => {});
    this.onDetonate = options.onDetonate || (() => {});
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.ratio = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    this.pointerX = -1000;
    this.pointerY = -1000;
    this.pointerActive = false;
    this.targetX = this.width / 2;
    this.targetY = this.height / 2;
    this.buttonX = this.width / 2;
    this.buttonY = this.height * 0.66;
    this.running = false;
    this.frame = 0;
    this.mode = "quiet";
    this.fieldActive = false;
    this.hasDetonated = false;
    this.sequenceStart = 0;
    this.pendingAttract = false;
    this.detonationFired = false;
    this.fadeStartedAt = 0;
    this.fadeDuration = 0;
    this.energy = 0;
    this.lastImpactAt = 0;

    this.program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
    this.locations = {
      position: gl.getAttribLocation(this.program, "a_position"),
      size: gl.getAttribLocation(this.program, "a_size"),
      sprite: gl.getAttribLocation(this.program, "a_sprite"),
      alpha: gl.getAttribLocation(this.program, "a_alpha"),
      resolution: gl.getUniformLocation(this.program, "u_resolution"),
      atlas: gl.getUniformLocation(this.program, "u_atlas"),
      columns: gl.getUniformLocation(this.program, "u_columns"),
    };

    this.vertexBuffer = gl.createBuffer();
    this.vertexStride = PARTICLE_STRIDE * Float32Array.BYTES_PER_ELEMENT;
    this.texture = createEmojiTexture(gl, this.sprites);

    const isMobile =
      /Mobi|Android/i.test(navigator.userAgent) || window.innerWidth <= 600;
    this.baseCount = isMobile ? MOBILE_PARTICLES : DESKTOP_PARTICLES;
    this.particles = Array.from({ length: this.baseCount }, () =>
      this.createParticle(true)
    );
    this.particleData = new Float32Array(this.baseCount * PARTICLE_STRIDE);

    this.resize(this.width, this.height);
    this.configureGl();
    this.prepareStaticBuffers();
  }

  configureGl() {
    const { gl } = this;
    gl.useProgram(this.program);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(1, 1, 1, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(this.locations.atlas, 0);
    gl.uniform1f(this.locations.columns, SPRITE_COLUMNS);
  }

  prepareStaticBuffers() {
    const { gl } = this;
    const floatSize = Float32Array.BYTES_PER_ELEMENT;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.particleData.byteLength, gl.DYNAMIC_DRAW);

    gl.enableVertexAttribArray(this.locations.position);
    gl.vertexAttribPointer(
      this.locations.position,
      2,
      gl.FLOAT,
      false,
      this.vertexStride,
      0
    );

    gl.enableVertexAttribArray(this.locations.size);
    gl.vertexAttribPointer(
      this.locations.size,
      1,
      gl.FLOAT,
      false,
      this.vertexStride,
      2 * floatSize
    );

    gl.enableVertexAttribArray(this.locations.sprite);
    gl.vertexAttribPointer(
      this.locations.sprite,
      1,
      gl.FLOAT,
      false,
      this.vertexStride,
      3 * floatSize
    );

    gl.enableVertexAttribArray(this.locations.alpha);
    gl.vertexAttribPointer(
      this.locations.alpha,
      1,
      gl.FLOAT,
      false,
      this.vertexStride,
      4 * floatSize
    );
  }

  resize(width = window.innerWidth, height = window.innerHeight) {
    const nextWidth = Math.max(1, width);
    const nextHeight = Math.max(1, height);
    const nextRatio = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    const nextCanvasWidth = Math.floor(nextWidth * nextRatio);
    const nextCanvasHeight = Math.floor(nextHeight * nextRatio);

    if (
      this.width === nextWidth &&
      this.height === nextHeight &&
      this.ratio === nextRatio &&
      this.canvas.width === nextCanvasWidth &&
      this.canvas.height === nextCanvasHeight
    ) {
      return;
    }

    this.width = nextWidth;
    this.height = nextHeight;
    this.ratio = nextRatio;
    this.canvas.width = nextCanvasWidth;
    this.canvas.height = nextCanvasHeight;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.useProgram(this.program);
    this.gl.uniform2f(this.locations.resolution, this.width, this.height);
  }

  setTarget(x, y) {
    if (Number.isFinite(x) && Number.isFinite(y) && x > 0 && y > 0) {
      this.targetX = x;
      this.targetY = y;
    } else {
      this.targetX = this.width / 2;
      this.targetY = this.height / 2;
    }
  }

  setButton(x, y) {
    if (Number.isFinite(x) && Number.isFinite(y) && x > 0 && y > 0) {
      this.buttonX = x;
      this.buttonY = y;
    }
  }

  setPointer(x, y) {
    if (Number.isFinite(x) && Number.isFinite(y)) {
      this.pointerX = x;
      this.pointerY = y;
      this.pointerActive = true;
    }
  }

  arm() {
    this.beginField();
  }

  quiet() {
    this.stop();
    this.mode = "quiet";
    this.fieldActive = false;
    this.hasDetonated = false;
    this.pendingAttract = false;
    this.detonationFired = false;
    this.fadeStartedAt = 0;
    this.fadeDuration = 0;
    this.energy = 0;
    this.particles.forEach((particle) => {
      particle.alpha = 0;
      particle.role = "hidden";
    });
    this.clear();
  }

  windDown(duration = 3600) {
    this.mode = "winddown";
    this.fieldActive = false;
    this.pendingAttract = false;
    this.detonationFired = false;
    this.fadeStartedAt = performance.now();
    this.fadeDuration = duration;

    this.particles.forEach((particle, index) => {
      if (particle.alpha <= 0 || particle.role === "hidden") {
        particle.alpha = 0;
        particle.role = "hidden";
        return;
      }

      particle.role = "winddown";
      particle.startAlpha = Math.min(1, Math.max(0, particle.alpha));
      particle.fadeDelay = (index % 9) * 36 + Math.random() * 160;
      particle.vx = particle.vx * 0.42 + (Math.random() - 0.5) * 1.4;
      particle.vy = particle.vy * 0.42 - 0.35 - Math.random() * 1.15;
      particle.tempAttractTimer = 0;
    });

    this.start();
  }

  clear() {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  stop() {
    if (this.frame) {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
    }
    this.running = false;
  }

  start() {
    if (this.running) {
      return;
    }

    this.running = true;
    this.lastTime = performance.now();
    this.frame = requestAnimationFrame((time) => this.tick(time));
  }

  isPointerInteractive() {
    return this.running && this.fieldActive && this.mode === "field";
  }

  attract() {
    if (!this.fieldActive) {
      this.pendingAttract = true;
      return;
    }

    this.start();
    this.energy = Math.min(1.25, this.energy + 0.35);
    const chosen = Math.floor(this.particles.length * 0.1);
    for (let i = 0; i < chosen; i++) {
      const index = Math.floor(Math.random() * this.particles.length);
      const particle = this.particles[index];
      if (particle.role === "field") {
        particle.tempAttractTimer = 60;
      }
    }
  }

  burst(x = this.buttonX, y = this.buttonY) {
    if (this.mode === "drop") {
      this.pendingAttract = true;
      return;
    }

    if (!this.hasDetonated) {
      this.startDetonation();
      return;
    }

    this.beginField();
    this.energy = Math.min(1.35, this.energy + 0.45);

    for (let i = 0; i < 8; i++) {
      const particle = this.particles[i % this.particles.length];
      const angle = Math.random() * Math.PI * 2;
      const speed = 8 + Math.random() * 10;
      particle.x = x;
      particle.y = y;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      particle.size = 16 + Math.random() * 18;
      particle.sprite = 13;
      particle.alpha = 0.92;
      particle.life = 28 + Math.random() * 20;
      particle.role = "burst";
    }
  }

  startDetonation() {
    this.hasDetonated = true;
    this.fieldActive = false;
    this.mode = "drop";
    this.energy = 0;
    this.sequenceStart = performance.now();
    this.pendingAttract = true;
    this.particles.forEach((particle) => {
      particle.alpha = 0;
      particle.role = "hidden";
    });

    const bomb = this.particles[0];
    bomb.role = "bomb";
    bomb.sprite = 15;
    bomb.alpha = 0.95;
    bomb.size = Math.min(86, Math.max(58, this.width * 0.065));
    bomb.x = this.targetX;
    bomb.y = -bomb.size;
    bomb.vx = 0;
    bomb.vy = 0;
    this.start();
  }

  beginField(fromDetonation = false) {
    if (this.fieldActive) {
      this.start();
      return;
    }

    this.mode = "field";
    this.fieldActive = true;
    this.energy = Math.max(this.energy, 0.12);
    this.particles.forEach((particle, index) => {
      const enterFromOutside = !fromDetonation || index % 3 !== 0;
      Object.assign(particle, this.createParticle(enterFromOutside));
    });
    this.start();

    if (this.pendingAttract) {
      this.pendingAttract = false;
      this.attract();
    }
  }

  tick(time) {
    if (!this.running) {
      return;
    }

    const dt = Math.min(2, (time - this.lastTime) / 16.67 || 1);
    this.lastTime = time;
    this.energy *= Math.pow(0.986, dt);

    if (this.mode === "drop") {
      this.updateDetonation(time);
    } else if (this.mode === "winddown") {
      this.updateWindDown(time, dt);
    } else {
      this.updateParticles(dt);
    }
    this.draw();

    if (this.running) {
      this.frame = requestAnimationFrame((nextTime) => this.tick(nextTime));
    }
  }

  updateDetonation(time) {
    const elapsed = time - this.sequenceStart;
    const dropDuration = 760;
    const blastDuration = 620;
    const bomb = this.particles[0];
    const progress = Math.min(1, elapsed / dropDuration);
    const eased = progress * progress * (3 - 2 * progress);

    bomb.role = "bomb";
    bomb.sprite = progress < 1 ? 15 : 14;
    bomb.x = this.targetX + Math.sin(progress * Math.PI * 5) * 8 * (1 - progress);
    bomb.y = -bomb.size + (this.targetY + bomb.size * 0.25) * eased;
    bomb.size =
      progress < 1
        ? Math.min(92, Math.max(60, this.width * 0.07))
        : 92 + Math.sin(elapsed * 0.025) * 10;
    bomb.alpha = 0.95;

    if (progress < 1) {
      return;
    }

    if (!this.detonationFired) {
      this.detonationFired = true;
      this.onDetonate();
      this.onImpact();
      this.spawnBlast();
    }

    const blastProgress = Math.min(1, (elapsed - dropDuration) / blastDuration);
    const blastEase = 1 - Math.pow(1 - blastProgress, 3);
    const blastMargin = 8;
    const blastX = Math.min(
      this.width - blastMargin,
      Math.max(blastMargin, this.targetX)
    );
    const blastY = Math.min(
      this.height - blastMargin,
      Math.max(blastMargin, Math.min(this.height * 0.58, this.targetY + 112))
    );
    const edgeLimitedBlastSize = Math.max(
      96,
      Math.min(
        blastX - blastMargin,
        this.width - blastX - blastMargin,
        blastY - blastMargin,
        this.height - blastY - blastMargin
      ) * 2
    );
    const desiredBlastSize = Math.min(Math.min(this.width, this.height) * 0.68, 440);
    const finalBlastSize = Math.max(
      96,
      Math.min(desiredBlastSize, edgeLimitedBlastSize)
    );
    bomb.alpha = 0.95 - blastProgress * 0.95;
    bomb.x = this.targetX + (blastX - this.targetX) * blastEase;
    bomb.y = this.targetY + (blastY - this.targetY) * blastEase;
    bomb.size = 92 + (finalBlastSize - 92) * blastEase;

    for (let i = 1; i < this.particles.length; i++) {
      const particle = this.particles[i];
      if (particle.role !== "blast") {
        continue;
      }
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= 0.945;
      particle.vy *= 0.945;
      particle.life -= 1;
      particle.alpha = Math.max(0, Math.min(1, particle.life / 44));
      particle.size += 0.22;
    }

    if (blastProgress >= 1) {
      this.detonationFired = false;
      this.beginField(true);
    }
  }

  spawnBlast() {
    for (let i = 1; i < this.particles.length; i++) {
      const particle = this.particles[i];
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 16;
      particle.role = "blast";
      particle.x = this.targetX;
      particle.y = this.targetY;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      particle.sprite = Math.random() < 0.55 ? 14 : randomFieldSprite();
      particle.size = 22 + Math.random() * 44;
      particle.life = 20 + Math.random() * 38;
      particle.alpha = 0.9;
    }
  }

  updateWindDown(time, dt) {
    const elapsed = time - this.fadeStartedAt;
    const duration = Math.max(1, this.fadeDuration);
    let hasVisibleParticles = false;

    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];

      if (particle.role !== "winddown") {
        continue;
      }

      const localElapsed = Math.max(0, elapsed - particle.fadeDelay);
      const progress = Math.min(1, localElapsed / duration);
      const fade = Math.pow(1 - progress, 1.15);

      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= Math.pow(0.972, dt);
      particle.vy = particle.vy * Math.pow(0.982, dt) + 0.018 * dt;
      particle.size *= Math.pow(0.998, dt);
      particle.alpha = particle.startAlpha * fade;

      if (particle.alpha > 0.015) {
        hasVisibleParticles = true;
      } else {
        particle.alpha = 0;
        particle.role = "hidden";
      }

    }

    if (elapsed > duration + 520 || !hasVisibleParticles) {
      this.quiet();
    }
  }

  updateParticles(dt) {
    if (!this.fieldActive) {
      return;
    }

    const pointerRadius = Math.min(this.width, this.height) * 0.22;
    const pointerRadiusSq = pointerRadius * pointerRadius;
    const attractionRadius = Math.min(this.width, this.height) * 0.4;
    const attractionRadiusSq = attractionRadius * attractionRadius;
    const impactRadius = 30;
    const maxSpeed = 8;

    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];

      if (particle.role === "burst") {
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vx *= Math.pow(0.95, dt);
        particle.vy *= Math.pow(0.95, dt);
        particle.life -= dt;
        particle.alpha = Math.max(0, particle.life / 40);
        if (particle.life <= 0) {
          Object.assign(particle, this.createParticle(true));
        }
        continue;
      }

      if (this.pointerActive) {
        const pointerDx = particle.x - this.pointerX;
        const pointerDy = particle.y - this.pointerY;
        const pointerDistSq = pointerDx * pointerDx + pointerDy * pointerDy;
        if (pointerDistSq < pointerRadiusSq && pointerDistSq > 0.001) {
          const pointerDist = Math.sqrt(pointerDistSq);
          const force = (1 - pointerDist / pointerRadius) * 3.8;
          particle.vx += (pointerDx / pointerDist) * force * dt;
          particle.vy += (pointerDy / pointerDist) * force * dt;
        }
      }

      const dx = this.targetX - particle.x;
      const dy = this.targetY - particle.y;
      const distSq = dx * dx + dy * dy;

      if (distSq < attractionRadiusSq && distSq > 0.001) {
        const dist = Math.sqrt(distSq);
        particle.vx += (dx / dist) * 2 * dt;
        particle.vy += (dy / dist) * 2 * dt;
      }

      if (particle.tempAttractTimer > 0 && distSq > 0.001) {
        particle.tempAttractTimer -= dt;
        const dist = Math.sqrt(distSq);
        particle.vx += (dx / dist) * 5 * dt;
        particle.vy += (dy / dist) * 5 * dt;
      }

      const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
      if (speed > maxSpeed) {
        particle.vx = (particle.vx / speed) * maxSpeed;
        particle.vy = (particle.vy / speed) * maxSpeed;
      }

      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;

      if (particle.x < 0 || particle.x > this.width) {
        particle.vx *= -1;
      }
      if (particle.y < 0 || particle.y > this.height) {
        particle.vy *= -1;
      }

      this.keepParticleInPlay(particle);
      this.handleImpact(particle, impactRadius);
    }
  }

  handleImpact(particle, impactRadius) {
    const dx = this.targetX - particle.x;
    const dy = this.targetY - particle.y;
    const distSq = dx * dx + dy * dy;

    if (distSq > impactRadius * impactRadius || particle.role !== "field") {
      return;
    }

    const now = performance.now();
    if (now - this.lastImpactAt > 220) {
      this.lastImpactAt = now;
      this.onImpact();
    }

    particle.role = "burst";
    particle.sprite = Math.random() < 0.5 ? 13 : 14;
    particle.life = 24 + Math.random() * 18;
    particle.size = Math.max(14, particle.size * 0.65);
    particle.vx = (Math.random() - 0.5) * 9;
    particle.vy = (Math.random() - 0.5) * 9;
  }

  keepParticleInPlay(particle) {
    const margin = 140;

    if (
      particle.x < -margin ||
      particle.x > this.width + margin ||
      particle.y < -margin ||
      particle.y > this.height + margin
    ) {
      this.recycleParticle(particle);
    }
  }

  recycleParticle(particle) {
    const fresh = this.createParticle(true);
    Object.assign(particle, fresh);
  }

  writeParticle(index, particle) {
    const offset = index * PARTICLE_STRIDE;
    this.particleData[offset] = particle.x;
    this.particleData[offset + 1] = particle.y;
    this.particleData[offset + 2] = particle.size * this.ratio;
    this.particleData[offset + 3] = particle.sprite;
    this.particleData[offset + 4] = particle.alpha;
  }

  syncParticles() {
    for (let i = 0; i < this.particles.length; i++) {
      this.writeParticle(i, this.particles[i]);
    }
  }

  createParticle(outside = false) {
    const edge = randomInt(4);
    let x = Math.random() * this.width;
    let y = Math.random() * this.height;
    let vx = (Math.random() - 0.5) * 1.2;
    let vy = (Math.random() - 0.5) * 1.2;

    if (outside) {
      if (edge === 0) {
        x = -40;
        vx = 1 + Math.random() * 2.4;
      } else if (edge === 1) {
        x = this.width + 40;
        vx = -1 - Math.random() * 2.4;
      } else if (edge === 2) {
        y = -40;
        vy = 1 + Math.random() * 2.4;
      } else {
        y = this.height + 40;
        vy = -1 - Math.random() * 2.4;
      }
    }

    return {
      role: "field",
      x,
      y,
      vx,
      vy,
      size: 20 + Math.random() * 38,
      sprite: randomFieldSprite(),
      alpha: 0.9,
      life: 0,
      tempAttractTimer: 0,
    };
  }

  draw() {
    const { gl } = this;
    this.syncParticles();
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.program);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.particleData);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.drawArrays(gl.POINTS, 0, this.particles.length);
  }
}

function createEmojiTexture(gl, sprites) {
  const canvas = document.createElement("canvas");
  canvas.width = SPRITE_TILE_SIZE * SPRITE_COLUMNS;
  canvas.height = SPRITE_TILE_SIZE * SPRITE_COLUMNS;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = '58px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
  ctx.shadowColor = "rgba(0, 0, 0, 0.36)";
  ctx.shadowBlur = 5;
  ctx.shadowOffsetY = 2;

  sprites.forEach((sprite, index) => {
    const column = index % SPRITE_COLUMNS;
    const row = Math.floor(index / SPRITE_COLUMNS);
    const x = column * SPRITE_TILE_SIZE + SPRITE_TILE_SIZE / 2;
    const y = row * SPRITE_TILE_SIZE + SPRITE_TILE_SIZE / 2 + 3;
    ctx.fillText(sprite, x, y);
    ctx.shadowColor = "rgba(0, 0, 0, 0)";
    ctx.fillText(sprite, x, y);
    ctx.shadowColor = "rgba(0, 0, 0, 0.36)";
  });

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  return texture;
}

function createProgram(gl, vertexSource, fragmentSource) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(message);
  }

  return program;
}

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(message);
  }

  return shader;
}

function randomInt(max) {
  return Math.floor(Math.random() * max);
}

function randomFieldSprite() {
  const weightedSprites = [0, 1, 2, 2, 2, 3, 4, 6, 8, 10, 11, 12];
  return weightedSprites[randomInt(weightedSprites.length)];
}
