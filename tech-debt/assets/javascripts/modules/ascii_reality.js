export class ASCIIReality {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext("2d");
    this.width = canvas.width;
    this.height = canvas.height;

    this.asciiArt = [
      "   ▗▖ ▗▄▖ ▗▖  ▗▖ ▗▄▖  ▗▄▄▖ ▗▄▄▖▗▄▄▖ ▗▄▄▄▖▗▄▄▖▗▄▄▄▖",
      "   ▐▌▐▌ ▐▌▐▌  ▐▌▐▌ ▐▌▐▌   ▐▌   ▐▌ ▐▌  █  ▐▌ ▐▌ █  ",
      "   ▐▌▐▛▀▜▌▐▌  ▐▌▐▛▀▜▌ ▝▀▚▖▐▌   ▐▛▀▚▖  █  ▐▛▀▘  █  ",
      "▗▄▄▞▘▐▌ ▐▌ ▝▚▞▘ ▐▌ ▐▌▗▄▄▞▘▝▚▄▄▖▐▌ ▐▌▗▄█▄▖▐▌    █  ",
    ];

    this.particles = [];
    this.matrixColumns = [];
    this.wavePoints = [];
    this.time = 0;
    this.mouseX = 0;
    this.mouseY = 0;

    this.fontSize = 16;
    this.matrixChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()";
    this.distortionCounter = 0;
    this.distortionInterval = 10;
  }

  init() {
    const cols = Math.floor(this.width / this.fontSize);
    for (let i = 0; i < cols; i++) {
      this.matrixColumns.push({
        x: i * this.fontSize,
        y: Math.random() * this.height,
        speed: Math.random() * 3 + 1,
        chars: [],
        opacity: Math.random(),
      });
    }

    for (let i = 0; i < 100; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 3 + 1,
        color: this.getRandomColor(),
        life: 1,
        decay: Math.random() * 0.02 + 0.005,
      });
    }

    for (let i = 0; i < 25; i++) {
      this.wavePoints.push({
        angle: (i / 25) * Math.PI * 2,
        radius: Math.random() * 200 + 100,
        speed: Math.random() * 0.02 + 0.01,
        color: this.getRandomColor(),
      });
    }

    this.setupEventListeners();
  }

  getRandomColor() {
    const colors = ["#00ff7f", "#ff1493", "#00bfff", "#ffd700", "#ff6347", "#9370db", "#00ffff"];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  setupEventListeners() {
    window.addEventListener("resize", () => {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      this.width = rect.width;
      this.height = rect.height;
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      this.canvas.style.width = this.width + "px";
      this.canvas.style.height = this.height + "px";
    });

    document.addEventListener("mousemove", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
    });

    document.addEventListener("click", () => {
      this.createExplosion(this.mouseX, this.mouseY);
    });
  }

  createExplosion(x, y) {
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 10 + 5;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 5 + 2,
        color: this.getRandomColor(),
        life: 1,
        decay: 0.02,
      });
    }
  }

  drawMatrix() {
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.matrixColumns.forEach((col) => {
      this.ctx.fillStyle = `rgba(0, 255, 127, ${col.opacity})`;
      this.ctx.font = `${this.fontSize}px monospace`;

      const char = this.matrixChars[Math.floor(Math.random() * this.matrixChars.length)];
      this.ctx.fillText(char, col.x, col.y);

      col.y += col.speed;
      col.opacity = Math.sin(this.time * 0.01 + col.x * 0.01) * 0.5 + 0.5;

      if (col.y > this.height) {
        col.y = -this.fontSize;
        col.speed = Math.random() * 3 + 1;
      }
    });
  }

  drawASCII() {
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const scale = 1.5;
    const zOffset = -20;

    const rotX = Math.sin(this.time * 0.001) * 0.05;
    const rotY = Math.cos(this.time * 0.0015) * 0.1;
    const rotZ = Math.sin(this.time * 0.0005) * 0.2;

    this.asciiArt.forEach((line, lineIndex) => {
      const chars = line.split("");
      chars.forEach((char, charIndex) => {
        if (char === " ") return;

        let x = (charIndex - chars.length / 2) * 8 * scale;
        let y = (lineIndex - this.asciiArt.length / 2) * 20 * scale;
        let z = Math.sin(this.time * 0.001 + charIndex * 0.1 + lineIndex * 0.1) * 10 + zOffset;

        const cosRotY = Math.cos(rotY);
        const sinRotY = Math.sin(rotY);
        const cosRotX = Math.cos(rotX);
        const sinRotX = Math.sin(rotX);

        const newX = x * cosRotY - z * sinRotY;
        const newZ = x * sinRotY + z * cosRotY;
        const newY = y * cosRotX - newZ * sinRotX;
        const finalZ = y * sinRotX + newZ * cosRotX;

        const perspective = 400 / (400 + finalZ);
        const screenX = centerX + newX * perspective;
        const screenY = centerY + newY * perspective;

        const depth = Math.min(1, Math.max(0.5, -finalZ / 50));
        const hue = (this.time * 0.5 + charIndex * 10 + lineIndex * 20) % 360;

        this.ctx.save();
        this.ctx.translate(screenX, screenY);
        this.ctx.rotate(rotZ + Math.sin(this.time * 0.01 + charIndex) * 0.1);
        this.ctx.scale(perspective, perspective);

        const fontSize = Math.max(16, 20 * perspective);
        this.ctx.font = `${fontSize}px monospace`;
        this.ctx.fillStyle = `hsla(${hue}, 100%, 70%, ${depth})`;
        this.ctx.shadowColor = this.ctx.fillStyle;
        this.ctx.shadowBlur = 5 * perspective;
        this.ctx.fillText(char, 0, 0);

        this.ctx.restore();
      });
    });
  }

  drawParticles() {
    this.particles.forEach((particle, index) => {
      if (particle.life <= 0) {
        this.particles.splice(index, 1);
        return;
      }

      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= particle.decay;

      if (particle.x < 0) particle.x = this.width;
      if (particle.x > this.width) particle.x = 0;
      if (particle.y < 0) particle.y = this.height;
      if (particle.y > this.height) particle.y = 0;

      this.ctx.save();
      this.ctx.globalAlpha = particle.life;
      this.ctx.fillStyle = particle.color;
      this.ctx.shadowColor = particle.color;
      this.ctx.shadowBlur = particle.size;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });

    if (this.particles.length < 100 && Math.random() < 0.1) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 3 + 1,
        color: this.getRandomColor(),
        life: 1,
        decay: Math.random() * 0.02 + 0.005,
      });
    }
  }

  drawWaveField() {
    this.ctx.strokeStyle = "rgba(0, 255, 255, 0.3)";
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();

    this.wavePoints.forEach((point, index) => {
      point.angle += point.speed;

      const x = this.width / 2 + Math.cos(point.angle) * point.radius * Math.sin(this.time * 0.001);
      const y = this.height / 2 + Math.sin(point.angle) * point.radius * Math.cos(this.time * 0.001);

      if (index === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }

      this.ctx.save();
      this.ctx.fillStyle = point.color;
      this.ctx.shadowColor = point.color;
      this.ctx.shadowBlur = 20;
      this.ctx.beginPath();
      this.ctx.arc(x, y, 3, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });

    this.ctx.stroke();
  }

  drawScanlines() {
    this.ctx.fillStyle = "rgba(0, 255, 0, 0.03)";
    for (let i = 0; i < this.height; i += 8) {
      this.ctx.fillRect(0, i, this.width, 2);
    }
  }

  drawDistortionEffect() {
    if (this.width <= 0 || this.height <= 0) return;

    if (this.distortionCounter % this.distortionInterval === 0) {
      try {
        const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
        const data = imageData.data;

        if (Math.random() < 0.01) {
          const startY = Math.floor(Math.random() * this.height);
          const endY = Math.min(startY + 50, this.height);
          const offset = Math.floor((Math.random() - 0.5) * 50);

          for (let y = startY; y < endY; y++) {
            for (let x = 0; x < this.width; x++) {
              const sourceX = Math.max(0, Math.min(this.width - 1, x + offset));
              const sourceIndex = (y * this.width + sourceX) * 4;
              const targetIndex = (y * this.width + x) * 4;

              if (sourceIndex < data.length && targetIndex < data.length) {
                data[targetIndex] = data[sourceIndex];
                data[targetIndex + 1] = data[sourceIndex + 1];
                data[targetIndex + 2] = data[sourceIndex + 2];
              }
            }
          }

          this.ctx.putImageData(imageData, 0, 0);
        }
      } catch (e) {
        console.warn("Canvas distortion effect skipped:", e.message);
      }
    }
    this.distortionCounter++;
  }

  animate() {
    this.time++;

    this.ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.drawMatrix();
    this.drawWaveField();
    this.drawASCII();
    this.drawParticles();
    this.drawScanlines();
    this.drawDistortionEffect();

    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}
