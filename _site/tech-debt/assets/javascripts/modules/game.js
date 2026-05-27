import {
  BRIEFINGS,
  PLAYER_THOUGHTS,
  TRIUMPH_MESSAGE,
  NOT_A_TOTAL_DISASTER_MESSAGE,
  WEBFEST_FLOP_MESSAGE,
  WEBFEST_YOURE_DONE_MESSAGE,
} from "./briefings.js";
import { LEVEL_CONFIGS } from "./level_configs.js";
import {
  MOTD,
  TELEBUGS_ASCII,
  TELEBUGS_TEXT_ASCII,
  PROUDLY_ASCII,
  PRESENTS_ASCII,
  A_GAME_ASCII,
  FROM_ASCII,
  KYRYLO_SILIN_ASCII,
} from "./motd.js";
import { IGNORE_KEYS } from "./ignore_keys.js";
import { BUG_TYPES, createBug, isLaneOccupied } from "./bug_utils.js";
import { ASCIIReality } from "./ascii_reality.js";

class Game {
  constructor() {
    this.scoreLine = document.getElementById("score-line");
    this.grid = document.getElementById("grid");
    this.logArea = document.getElementById("log-area");
    this.briefing = document.getElementById("briefing");
    this.terminal = document.querySelector(".terminal");
    this.scanline = document.querySelector(".scanline");
    this.noiseOverlay = document.getElementById("noise-overlay");
    this.muteCheckbox = document.getElementById("mute-checkbox");

    this.isTyping = false;
    this.typeTimeout = null;
    this.gridSpans = [];
    this.currentLevel = 1;
    this.gameState = "motd";
    this.levelStats = [];
    this.briefingPhase = 0;
    this.motdPhase = 0;
    this.bossTextFinished = false;
    this.replyTextFinished = false;
    this.logMessages = [];
    this.LOG_ROWS = 7;
    this.gameOverPhase = 0;
    this.currentTitle = "";
    this.currentDatetime = "";
    this.wavesState = [];
    this.activeBugs = [];
    this.activeProjectiles = [];
    this.lastMoveTime = 0;
    this.startTime = 0;
    this.levelConfig = null;
    this.levelTotalTime = 0;
    this.hugeWavePositions = new Set();
    this.dirtyVisualRows = new Set();
    this.pauseStartTime = 0;
    this.scoreLineCache = null;
    this.lastScoreStats = { fixed: 0, slipped: 0, introduced: 0, filled: -1 };
    this.laneQueues = Array(26)
      .fill()
      .map(() => []);

    this.isEasterEggActive = false;
    this.lastKeys = [];
    this.easterEggCanvas = null;
    this.asciiReality = null;

    this.spawnDelay = 3000;
    this.maxForkbombSpawns = 4096;
    this.forkbombSpawnsLeft = this.maxForkbombSpawns;

    this.synth = null;
    this.sfxSynth = null;
    this.isAudioContextStarted = false;
    this.mainThemeMidi = null;
    this.gameplayMidi = null;
    this.mainThemeDuration = 0;
    this.gameplayDuration = 0;
    this.isTabVisible = true;
    this.isMuted = false;

    this.canProceed = false;
    this.canProceedGameOver = false;

    this.nextSoundTime = 0;

    this.typingState = {
      text: "",
      index: 0,
      targetElement: null,
      speed: 30,
      onComplete: null,
    };

    this.shootSynth = new Tone.Synth({
      oscillator: { type: "square" },
      envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
    }).toDestination();
    this.shootSynth.volume.value = -10;

    this.deathSynth = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.3 },
    }).toDestination();
    this.deathSynth.volume.value = -15;

    this.armorBreakSynth = new Tone.MetalSynth({
      frequency: 200,
      envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.2 },
      harmonicity: 5,
      modulationIndex: 10,
      resonance: 2000,
      octaves: 1.5,
    }).toDestination();
    this.armorBreakSynth.volume.value = -12;

    this.specialMessageSynth = new Tone.MetalSynth({
      frequency: 400,
      envelope: { attack: 0.001, decay: 0.05, sustain: 0.2, release: 0.1 },
      harmonicity: 3,
      modulationIndex: 20,
      resonance: 3000,
      octaves: 2,
    }).toDestination();
    this.specialMessageSynth.volume.value = -15;

    this.fastErrorSpawnSynth = new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
    }).toDestination();
    this.fastErrorSpawnSynth.volume.value = -12;

    this.slippingSynth = new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
    }).toDestination();
    this.slippingSynth.volume.value = -5;

    this.slipSynth = new Tone.Synth({
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.3 },
    }).toDestination();
    this.slipSynth.volume.value = -5;

    this.teleportSynth = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
    }).toDestination();
    this.teleportSynth.volume.value = 0;

    this.onKeydown = this.onKeydown.bind(this);
    this.init();
  }

  getNextSoundTime() {
    const now = Tone.now();
    const minInterval = 0.01;
    if (this.nextSoundTime < now) {
      this.nextSoundTime = now;
    }
    this.nextSoundTime += minInterval;
    return this.nextSoundTime;
  }

  playTeleportSound() {
    if (this.isAudioContextStarted && this.isTabVisible && this.teleportSynth) {
      const startTime = this.getNextSoundTime();
      this.teleportSynth.triggerAttack("C4", startTime);
      this.teleportSynth.frequency.exponentialRampToValueAtTime("C5", startTime + 0.1);
      this.teleportSynth.triggerRelease(startTime + 0.1);
    }
  }

  init() {
    this.setupNoiseOverlay();
    this.setupAnimations();
    document.addEventListener("keydown", this.onKeydown);
    document.addEventListener("visibilitychange", this.handleVisibilityChange.bind(this));
    this.muteCheckbox.textContent = "[ ] Mute";
    this.muteCheckbox.addEventListener("click", () => {
      this.isMuted = !this.isMuted;
      this.muteCheckbox.textContent = this.isMuted ? "[x] Mute" : "[ ] Mute";
      Tone.Destination.mute = this.isMuted;
    });
    this.typeText(MOTD, 10, this.scoreLine, () => {
      this.motdPhase = 1;
    });

    window.addEventListener("beforeunload", (event) => {
      if (this.gameState !== "motd" && this.gameState !== "finalStats") {
        event.preventDefault();

        this.previousVolume = Tone.Destination.volume.value;
        Tone.Destination.volume.value = -Infinity;
        Tone.Transport.pause();
        setTimeout(() => {
          if (document.visibilityState === "visible") {
            Tone.Destination.volume.value = this.previousVolume || 0;
            Tone.Transport.start();
          }
        }, 100);
      }
    });
  }

  setupNoiseOverlay() {
    if (this.noiseOverlay) {
      const dataURL = this.generateNoiseDataURL(32);
      this.noiseOverlay.style.backgroundImage = `url(${dataURL})`;
      this.noiseOverlay.style.animation = `noise-move 0.5s linear infinite`;
      if (this.currentLevel >= 4) {
        this.noiseOverlay.classList.add("low-noise");
      } else {
        this.noiseOverlay.classList.remove("low-noise");
      }
    }
  }

  handleVisibilityChange() {
    if (document.hidden) {
      this.isTabVisible = false;
      this.pauseStartTime = Date.now();
      if (this.isAudioContextStarted) {
        Tone.Transport.pause();
      }
      if (this.isTyping) {
        clearTimeout(this.typeTimeout);
        this.typeTimeout = null;
      }
    } else {
      this.isTabVisible = true;
      if (this.pauseStartTime) {
        const pausedDuration = Date.now() - this.pauseStartTime;
        this.adjustTimes(pausedDuration);
        if (this.isAudioContextStarted) {
          Tone.Transport.start();
        }
      }
      if (this.isTyping && !this.typeTimeout) {
        this.resumeTyping();
      }
    }
  }

  async startAudioContext() {
    if (!this.isAudioContextStarted) {
      try {
        await Tone.start();
        this.isAudioContextStarted = true;

        this.synth = new Tone.PolySynth(Tone.Synth, {
          envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.3 },
        }).toDestination();

        this.sfxSynth = new Tone.NoiseSynth({
          noise: { type: "white" },
          envelope: { attack: 0.001, decay: 0.02, sustain: 0, release: 0.02 },
        }).toDestination();
        this.sfxSynth.volume.value = -25;

        this.mainThemeMidi = await Midi.fromUrl("assets/sounds/main-theme.mid");
        this.gameplayMidi = await Midi.fromUrl("assets/sounds/gameplay.mid");
        this.levelStatsMidi = await Midi.fromUrl("assets/sounds/level-stats.mid");
        this.briefingMidi = await Midi.fromUrl("assets/sounds/briefing.mid");
        this.winMidi = await Midi.fromUrl("assets/sounds/win.mid");
        this.loseMidi = await Midi.fromUrl("assets/sounds/lose.mid");

        this.briefingDuration = this.briefingMidi.duration;
        this.mainThemeDuration = this.mainThemeMidi.duration;
        this.gameplayDuration = this.gameplayMidi.duration;

        Tone.Destination.mute = this.isMuted;
      } catch (error) {
        console.error("Failed to initialize audio or load MIDI files:", error);
        return;
      }
    }

    if (this.mainThemeMidi) {
      try {
        Tone.Transport.stop();
        Tone.Transport.cancel(0);
        if (this.mainThemeMidi.header.tempos.length > 0) {
          Tone.Transport.bpm.value = this.mainThemeMidi.header.tempos[0].bpm || 120;
        }
        Tone.Transport.loop = true;
        this.scheduleMidi(this.mainThemeMidi);
        Tone.Transport.start();
      } catch (error) {
        console.error("Failed to schedule main theme:", error);
      }
    }
  }

  scheduleMidi(midiTrack) {
    Tone.Transport.cancel(0);
    const allNotes = [];
    midiTrack.tracks.forEach((track) => {
      track.notes.forEach((note) => {
        allNotes.push(note);
      });
    });
    allNotes.sort((a, b) => a.time - b.time);
    allNotes.forEach((note) => {
      Tone.Transport.schedule((time) => {
        this.synth.triggerAttackRelease(note.name, note.duration, time, note.velocity);
      }, note.time);
    });
    Tone.Transport.loopEnd = midiTrack.duration;
  }

  adjustTimes(pausedDuration) {
    if (this.gameState === "playing") {
      this.startTime += pausedDuration;
      this.lastMoveTime += pausedDuration;
      for (let wave of this.wavesState) {
        wave.nextSpawnTime += pausedDuration;
      }
      for (let bug of this.activeBugs) {
        bug.spawnTime += pausedDuration;
        bug.effectiveSpawnTime += pausedDuration;
        if (bug.removeTime) bug.removeTime += pausedDuration;
        if (bug.blinkEndTime) bug.blinkEndTime += pausedDuration;
        if (bug.lastLaneSwitchTime) bug.lastLaneSwitchTime += pausedDuration;
      }
      for (let proj of this.activeProjectiles) {
        proj.startTime += pausedDuration;
      }
      for (let msg of this.logMessages) {
        msg.timestamp += pausedDuration;
      }
    }
  }

  setupAnimations() {
    if (this.terminal) {
      this.terminal.style.animationDuration = `${(Math.random() * 3 + 4).toFixed(2)}s`;
    }
    if (this.scanline) {
      this.scanline.style.animation = `scan-moving 6s linear infinite, scan-flicker ${(Math.random() * 1.5 + 1).toFixed(
        2
      )}s infinite alternate`;
    }
  }

  generateLogBorder() {
    const title = "Logs";
    const totalWidth = 81;
    const insideWidth = totalWidth - 2;
    const dashes = insideWidth - title.length - 2;
    return `┌──${title}${"─".repeat(dashes)}┐`;
  }

  logMessage(message) {
    const timestamp = Date.now();
    const lines = Array.isArray(message) ? message : [message.substring(0, 79)];
    this.logMessages.push({ lines, timestamp, isInitial: Array.isArray(message) });
    this.updateLogArea();
  }

  displayIntroAnimation() {
    this.briefing.style.display = "block";
    setTimeout(() => {
      this.briefing.textContent = KYRYLO_SILIN_ASCII;
    }, 1000);
    setTimeout(() => {
      this.briefing.textContent = PROUDLY_ASCII;
    }, 2500);
    setTimeout(() => {
      this.briefing.textContent = PRESENTS_ASCII;
    }, 3000);
    setTimeout(() => {
      this.briefing.textContent = A_GAME_ASCII;
    }, 3500);
    setTimeout(() => {
      this.briefing.textContent = FROM_ASCII;
    }, 4000);
    setTimeout(() => {
      this.briefing.textContent = TELEBUGS_TEXT_ASCII;
    }, 5000);
    setTimeout(() => {
      this.briefing.textContent = TELEBUGS_ASCII;
    }, 6800);
    setTimeout(() => {
      this.briefing.textContent = "";
      this.gameState = "briefing";
      this.currentLevel = 1;
      this.scoreLine.textContent = "";
      this.logArea.textContent = "";
      this.displayBriefing();
    }, 11300);
  }

  displaySpecialMessage(message) {
    const specialMessageElem = document.getElementById("special-message");
    if (!specialMessageElem) return;
    const insideWidth = 79;
    const leftPadding = Math.floor((insideWidth - message.length) / 2);
    const rightPadding = insideWidth - message.length - leftPadding;
    const centered = " ".repeat(Math.max(0, leftPadding)) + message + " ".repeat(Math.max(0, rightPadding));
    specialMessageElem.textContent = centered;
    specialMessageElem.style.display = "block";
    specialMessageElem.classList.add("blink");
    this.playSpecialMessageSound();
    setTimeout(() => {
      specialMessageElem.style.display = "none";
      specialMessageElem.classList.remove("blink");
    }, 2000);
    this.logMessages = [];
    this.updateLogArea();
  }

  playSpecialMessageSound() {
    if (this.isAudioContextStarted && this.isTabVisible && this.specialMessageSynth) {
      const baseTime = this.getNextSoundTime();
      for (let i = 0; i < 4; i++) {
        const startTime = baseTime + i * 0.5;
        this.specialMessageSynth.triggerAttackRelease("G4", "16n", startTime);
      }
    }
  }

  updateLogArea() {
    if (this.gameState !== "playing") {
      this.logArea.textContent = "";
      this.logArea.style.display = "none";
      return;
    }
    this.logArea.style.display = "block";
    const now = Date.now();
    const allLines = [];
    this.logMessages.forEach((msg) => {
      const lines = Array.isArray(msg.lines) ? msg.lines : [msg.lines || ""];
      lines.forEach((line, index) => {
        allLines.push({
          line,
          timestamp: msg.timestamp,
          isInitial: msg.isInitial,
          isFirstLine: index === 0,
        });
      });
    });
    const recentLines = allLines
      .filter((msg) => {
        const threshold = msg.isInitial ? 10000 : 5000;
        return now - msg.timestamp < threshold;
      })
      .slice(-this.LOG_ROWS);
    const insideWidth = 79;
    const topBorder = this.generateLogBorder();
    const bottomBorder = `└${"─".repeat(insideWidth)}┘`;
    const lines = [];
    for (let i = 0; i < this.LOG_ROWS; i++) {
      if (i < this.LOG_ROWS - recentLines.length) {
        lines.push(`│${" ".repeat(insideWidth)}│`);
      } else {
        const msg = recentLines[i - (this.LOG_ROWS - recentLines.length)];
        const text = (msg.line || "").padEnd(insideWidth, " ");
        lines.push(`│${text}│`);
      }
    }
    this.logArea.textContent = `${topBorder}\n${lines.join("\n")}\n${bottomBorder}`;
  }

  getRegisterName(index) {
    return String.fromCharCode(65 + index);
  }

  typeText(str, speed = 30, targetElement, onComplete = null, resumeIndex = 0) {
    if (this.typeTimeout) clearTimeout(this.typeTimeout);
    this.isTyping = true;
    this.typingState = { text: str, index: resumeIndex, targetElement, speed, onComplete };
    const oldCursor = targetElement.querySelector(".cursor");
    if (oldCursor) oldCursor.remove();
    if (resumeIndex === 0) {
      targetElement.textContent = "";
    }
    const cursor = document.createElement("span");
    cursor.className = "cursor typing";
    cursor.textContent = "_";
    const type = () => {
      if (!this.isTyping || !this.isTabVisible) return;
      cursor.remove();
      if (this.typingState.index < str.length) {
        const c = str.charAt(this.typingState.index);
        if (c === "\n") {
          targetElement.appendChild(document.createElement("br"));
        } else {
          const span = document.createElement("span");
          span.className = "char";
          span.textContent = c;
          span.addEventListener(
            "animationend",
            () => {
              span.classList.remove("char");
              span.style.color = "";
            },
            { once: true }
          );
          targetElement.appendChild(span);
          if (this.isAudioContextStarted && this.isTabVisible) {
            this.playTypingSound();
          }
        }
        this.typingState.index++;
        targetElement.appendChild(cursor);
        this.typeTimeout = setTimeout(type, speed);
      } else {
        cursor.className = "cursor";
        targetElement.appendChild(cursor);
        this.isTyping = false;
        this.typeTimeout = null;
        this.typingState.index = 0;
        if (onComplete) onComplete();
      }
    };
    targetElement.appendChild(cursor);
    if (this.typingState.index < str.length) {
      type();
    } else {
      cursor.className = "cursor";
      targetElement.appendChild(cursor);
      this.isTyping = false;
      this.typeTimeout = null;
      this.typingState.index = 0;
      if (onComplete) onComplete();
    }
  }

  resumeTyping() {
    if (this.isTyping && this.isTabVisible && this.typingState.targetElement) {
      const { text, index, targetElement, speed, onComplete } = this.typingState;
      if (index < text.length) {
        this.typeText(text, speed, targetElement, onComplete, index);
      } else {
        this.isTyping = false;
        this.typeTimeout = null;
        this.typingState.index = 0;
        if (onComplete) onComplete();
      }
    }
  }

  playTypingSound() {
    if (this.isAudioContextStarted && this.isTabVisible && this.sfxSynth) {
      const startTime = this.getNextSoundTime();
      this.sfxSynth.triggerAttackRelease("0.1", startTime);
    }
  }

  playArmorBreakSound() {
    if (this.isAudioContextStarted && this.isTabVisible && this.armorBreakSynth) {
      const startTime = this.getNextSoundTime();
      this.armorBreakSynth.triggerAttackRelease("C3", "8n", startTime);
    }
  }

  extractTitle(bossText) {
    if (!bossText) return "Untitled Level";
    const lines = bossText.split("\n");
    const subject = lines.find((l) => l.startsWith("Subject: "));
    return subject ? subject.substring(9).trim() : "Untitled Level";
  }

  displayBriefing() {
    if (this.typeTimeout) clearTimeout(this.typeTimeout);
    this.scoreLine.textContent = "";
    this.grid.textContent = "";
    this.logArea.textContent = "";
    this.logArea.style.display = "none";
    this.briefing.textContent = "";
    this.briefingPhase = 0;
    this.bossTextFinished = false;
    this.replyTextFinished = false;
    this.briefing.style.display = "block";
    if (this.currentLevel >= 4) {
      this.noiseOverlay.classList.add("low-noise");
    } else {
      this.noiseOverlay.classList.remove("low-noise");
    }
    if (this.isAudioContextStarted && this.currentLevel > 1) {
      Tone.Transport.stop();
      this.scheduleMidi(this.briefingMidi);
      Tone.Transport.position = 0;
      Tone.Transport.start();
    }
    const obj = BRIEFINGS[this.currentLevel - 1];
    if (obj) {
      this.typeText(obj.bossText, 30, this.briefing, () => {
        this.briefingPhase = 1;
        this.bossTextFinished = true;
      });
    }
  }

  getBugRenderState(bug, now) {
    if (bug.type === "BlinkBug") {
      const elapsed = now - bug.spawnTime;
      const cycle = 3000;
      const phase = elapsed % cycle;
      if (phase < 1000 || phase >= 2500) {
        const blink = (phase >= 500 && phase < 1000) || phase >= 2500;
        return { render: true, blink: blink };
      } else {
        return { render: false, blink: false };
      }
    }
    return { render: true, blink: false };
  }

  updateBugs(now) {
    const bugsToRemove = [];
    for (let bug of this.activeBugs) {
      if (!bug.fixing) {
        const delta = (now - bug.effectiveSpawnTime) * bug.speed;
        const moves = Math.floor(delta / 500);
        bug.position = 38 - moves;
        bug.visibleChars = Math.min(bug.fullText.length, Math.floor(delta / 500) + 1);
        const prevPosition = bug.prevPosition;
        bug.prevPosition = bug.position;
        if (prevPosition >= 0 && bug.position < 0) {
          if (this.isAudioContextStarted && this.isTabVisible) {
            const startTime = this.getNextSoundTime();
            this.slippingSynth.triggerAttackRelease("A5", "16n", startTime);
          }
        }
        if (bug.type.startsWith("OffByOne") && !bug.targeted) {
          const timeSinceLastSwitch = now - bug.lastLaneSwitchTime;
          if (timeSinceLastSwitch >= bug.laneSwitchInterval) {
            const numSwitches = Math.floor(timeSinceLastSwitch / bug.laneSwitchInterval);
            const numActiveRows = 2 * this.currentLevel;
            let newRow = bug.row;
            for (let i = 0; i < numSwitches; i++) {
              if (bug.direction === "up") {
                newRow = (newRow - 1 + numActiveRows) % numActiveRows;
              } else if (bug.direction === "down") {
                newRow = (newRow + 1) % numActiveRows;
              }
            }
            if (newRow !== bug.row) {
              const oldRow = bug.row;
              bug.row = newRow;
              bug.lastLaneSwitchTime += numSwitches * bug.laneSwitchInterval;
              const oldVisRow = oldRow < 13 ? oldRow : oldRow - 13;
              const newVisRow = newRow < 13 ? newRow : newRow - 13;
              this.dirtyVisualRows.add(oldVisRow);
              this.dirtyVisualRows.add(newVisRow);
              bug.isBlinking = true;
              bug.blinkEndTime = now + 300;
              this.playTeleportSound();
            }
          }
        }
        if (bug.position <= -bug.fullText.length) {
          bugsToRemove.push(bug);
        }
      }
    }
    for (let bug of bugsToRemove) {
      const reg = this.getRegisterName(bug.row);
      this.logMessage(`FAULT: [${reg}] OVERFLOW`);
      this.levelStats[this.currentLevel - 1].slipped++;
      const visRow = bug.row < 13 ? bug.row : bug.row - 13;
      this.activeBugs.splice(this.activeBugs.indexOf(bug), 1);
      this.dirtyVisualRows.add(visRow);
      if (this.isAudioContextStarted && this.isTabVisible) {
        const startTime = this.getNextSoundTime();
        this.slipSynth.triggerAttackRelease("C3", "8n", startTime);
      }
    }
  }

  generateExplosion(exceptionLength) {
    const K = Math.max(1, exceptionLength - 6);
    return `˗ˏˋ${"*".repeat(K)}ˎˊ˗`;
  }

  getExplosionRange(bug) {
    const N = bug.exception.length;
    const K = Math.max(1, N - 6);
    const explosionLength = 3 + K + 3;
    const actualVisible = bug.position < 0 ? Math.max(0, bug.fullText.length + bug.position) : explosionLength;
    const start = bug.position >= 0 ? bug.position : 0;
    const end = Math.min(37, bug.position >= 0 ? bug.position + explosionLength - 1 : actualVisible - 1);
    return { start, end };
  }

  mergeOverlappingRanges(ranges) {
    if (!ranges.length) return [];
    const sorted = ranges.slice().sort((a, b) => a.start - b.start);
    const merged = [sorted[0]];
    for (let i = 1; i < sorted.length; i++) {
      const cur = sorted[i];
      const last = merged[merged.length - 1];
      if (cur.start <= last.end + 1) {
        last.end = Math.max(last.end, cur.end);
      } else {
        merged.push(cur);
      }
    }
    return merged;
  }

  renderRowContent(rowIndex, now) {
    const rowBugs = this.activeBugs.filter((b) => b.row === rowIndex);
    const normal = rowBugs.filter((b) => !b.fixing && now >= b.spawnTime && this.getBugRenderState(b, now).render);
    const fixing = rowBugs.filter((b) => b.fixing && now < b.removeTime);
    const rowContentArr = Array(38).fill(" ");
    const explosionCols = new Array(38).fill(false);
    const blinkingCols = new Array(38).fill(false);
    const overlapCols = new Array(38).fill(false);

    const ranges = fixing.map((bug) => ({ ...this.getExplosionRange(bug), bug }));
    const mergedRanges = this.mergeOverlappingRanges(ranges.map((r) => ({ start: r.start, end: r.end })));
    for (const { start, end } of mergedRanges) {
      const width = end - start + 1;
      const isSlipping = start === 0 && ranges.some((r) => r.bug.position < 0);
      const bugsInRange = ranges.filter((r) => r.start <= end && r.end >= start).map((r) => r.bug);
      const maxExceptionLength = Math.max(...bugsInRange.map((b) => b.exception.length), 5);
      const fullExplosion = this.generateExplosion(maxExceptionLength);
      let explosion = isSlipping ? fullExplosion.slice(-width) : fullExplosion.slice(0, width);
      if (!isSlipping && width >= 6) {
        explosion = `˗ˏˋ${"*".repeat(width - 6)}ˎˊ˗`;
      }
      for (let i = start; i <= end && i - start < explosion.length; i++) {
        if (i >= 0 && i < 38) {
          rowContentArr[i] = explosion[i - start];
          explosionCols[i] = true;
        }
      }
    }

    const posChars = Array.from({ length: 38 }, () => []);
    for (let bug of normal) {
      const renderState = this.getBugRenderState(bug, now);
      const renderStart = Math.max(0, bug.position);
      const renderEnd = Math.min(37, bug.position + bug.visibleChars - 1);
      for (let pos = renderStart; pos <= renderEnd; pos++) {
        const charIndex = pos - bug.position;
        posChars[pos].push(bug.fullText[charIndex]);
        if (renderState.blink || (bug.isBlinking && now < bug.blinkEndTime)) {
          blinkingCols[pos] = true;
        }
      }
    }

    for (let pos = 0; pos < 38; pos++) {
      if (posChars[pos].length > 1) {
        rowContentArr[pos] = "¤";
        overlapCols[pos] = true;
      } else if (posChars[pos].length === 1) {
        rowContentArr[pos] = posChars[pos][0];
      }
    }

    return { content: rowContentArr.join(""), explosionCols, blinkingCols, overlapCols };
  }

  render(now) {
    if (!this.dirtyVisualRows.size) return;
    const content = Array(26).fill(null);
    const explosionMap = Array(26).fill(null);
    const blinkingMap = Array(26).fill(null);
    const overlapMap = Array(26).fill(null);
    const bugsByRow = {};
    for (let bug of this.activeBugs) {
      if (!bugsByRow[bug.row]) bugsByRow[bug.row] = [];
      bugsByRow[bug.row].push(bug);
    }
    const numActive = 2 * this.currentLevel;
    for (let visualRow of this.dirtyVisualRows) {
      const leftLogical = visualRow;
      const rightLogical = visualRow + 13;
      if (leftLogical < numActive) {
        const { content: rowStr, explosionCols, blinkingCols, overlapCols } = this.renderRowContent(leftLogical, now);
        content[leftLogical] = rowStr;
        explosionMap[leftLogical] = explosionCols;
        blinkingMap[leftLogical] = blinkingCols;
        overlapMap[leftLogical] = overlapCols;
      } else {
        content[leftLogical] = " ".repeat(38);
        explosionMap[leftLogical] = new Array(38).fill(false);
        blinkingMap[leftLogical] = new Array(38).fill(false);
        overlapMap[leftLogical] = new Array(38).fill(false);
      }
      if (rightLogical < numActive) {
        const { content: rowStr, explosionCols, blinkingCols, overlapCols } = this.renderRowContent(rightLogical, now);
        content[rightLogical] = rowStr;
        explosionMap[rightLogical] = explosionCols;
        blinkingMap[rightLogical] = blinkingCols;
        overlapMap[rightLogical] = overlapCols;
      } else {
        content[rightLogical] = " ".repeat(38);
        explosionMap[rightLogical] = new Array(38).fill(false);
        blinkingMap[rightLogical] = new Array(38).fill(false);
        overlapMap[rightLogical] = new Array(38).fill(false);
      }
      const leftActive = leftLogical < numActive;
      const rightActive = rightLogical < numActive;
      const leftContent = content[leftLogical] || " ".repeat(38);
      const rightContent = content[rightLogical] || " ".repeat(38);
      const leftLabel = leftActive ? this.getRegisterName(leftLogical) + ":" : "  ";
      const rightLabel = rightActive ? this.getRegisterName(rightLogical) + ":" : leftActive ? "| " : "  ";
      let rowStr = leftLabel + leftContent + " " + rightLabel + rightContent;
      for (let proj of this.activeProjectiles) {
        if (proj.visualRow === visualRow && proj.lastCol !== null) {
          rowStr = rowStr.substring(0, proj.lastCol) + "ƒ" + rowStr.substring(proj.lastCol + 1);
        }
      }
      const spansRow = this.gridSpans[visualRow];
      const leftExpl = explosionMap[leftLogical] || new Array(38).fill(false);
      const rightExpl = explosionMap[rightLogical] || new Array(38).fill(false);
      const leftBlinking = blinkingMap[leftLogical] || new Array(38).fill(false);
      const rightBlinking = blinkingMap[rightLogical] || new Array(38).fill(false);
      const leftOverlap = overlapMap[leftLogical] || new Array(38).fill(false);
      const rightOverlap = overlapMap[rightLogical] || new Array(38).fill(false);
      for (let col = 0; col < 81; col++) {
        const ch = rowStr[col] || " ";
        const span = spansRow[col];
        if (span.textContent !== ch) span.textContent = ch;
        span.classList.remove("explosion-char", "blink-crt-red", "blinking", "overlap");
        if (col >= 2 && col < 2 + 38) {
          const gridCol = col - 2;
          if (leftExpl[gridCol]) {
            span.classList.add("explosion-char");
          } else if (leftBlinking[gridCol]) {
            span.classList.add("blinking");
          } else if (leftOverlap[gridCol]) {
            span.classList.add("overlap");
          }
        } else if (col >= 43 && col < 43 + 38 && rightLogical < 26) {
          const gridCol = col - 43;
          if (rightExpl[gridCol]) {
            span.classList.add("explosion-char");
          } else if (rightBlinking[gridCol]) {
            span.classList.add("blinking");
          } else if (rightOverlap[gridCol]) {
            span.classList.add("overlap");
          }
        }
      }
      this.handleBlinkEdge(bugsByRow[leftLogical], spansRow, 0);
      this.handleBlinkEdge(bugsByRow[rightLogical], spansRow, 41);
    }
    this.updateScoreLine(now);
    this.dirtyVisualRows.clear();
  }

  handleBlinkEdge(bugsInRow = [], spansRow, colStart) {
    if (!bugsInRow) return;
    const hasSlippingBug = bugsInRow.some(
      (b) => b.position < 0 && b.position >= -b.fullText.length && !b.fixing && !b.targeted
    );
    if (hasSlippingBug) {
      spansRow[colStart].classList.add("blink-crt-red");
      spansRow[colStart + 1].classList.add("blink-crt-red");
    } else {
      spansRow[colStart].classList.remove("blink-crt-red");
      spansRow[colStart + 1].classList.remove("blink-crt-red");
    }
  }

  updateScoreLine(now) {
    const stats = this.levelStats[this.currentLevel - 1];
    const elapsed = now - this.startTime;
    const progress = this.levelTotalTime > 0 ? Math.min(elapsed / this.levelTotalTime, 1) : 1;
    const filled = Math.floor(progress * 25);
    const needsUpdate =
      stats.fixed !== this.lastScoreStats.fixed ||
      stats.slipped !== this.lastScoreStats.slipped ||
      stats.introduced !== this.lastScoreStats.introduced ||
      filled !== this.lastScoreStats.filled;
    if (!needsUpdate && this.scoreLineCache) return;
    const leftPart1 = `Level ${this.currentLevel}: ${this.currentTitle}`;
    const rightPart1 = this.currentDatetime;
    const spaces1 = 81 - leftPart1.length - rightPart1.length;
    const firstLine = leftPart1 + " ".repeat(Math.max(0, spaces1)) + rightPart1;
    const leftPart2 = `Bugs ƒixed: ${stats.fixed.toString().padStart(3)} | Slipped: ${stats.slipped
      .toString()
      .padStart(3)} | Introduced: ${stats.introduced.toString().padStart(3)}`;
    const W = 25;
    const barArr = Array(W).fill(" ");
    for (let i = W - filled; i < W; i++) barArr[i] = "-";
    for (let pos of this.hugeWavePositions) {
      if (pos >= W - filled && pos < W) barArr[pos] = "×";
      else if (pos < W - filled) barArr[pos] = "¤";
    }
    if (filled > 0) {
      const tip = W - filled;
      if (!["×", "¤"].includes(barArr[tip])) barArr[tip] = "<";
    }
    const barString = "[" + barArr.join("") + "]";
    const spaces2 = 81 - leftPart2.length - barString.length;
    const secondLine = leftPart2 + " ".repeat(Math.max(0, spaces2)) + barString;
    this.scoreLineCache = firstLine + "\n" + secondLine + "\n\n";
    this.scoreLine.textContent = this.scoreLineCache;
    this.lastScoreStats = { fixed: stats.fixed, slipped: stats.slipped, introduced: stats.introduced, filled };
  }

  gameLoop() {
    if (document.hidden || this.gameState !== "playing" || this.isEasterEggActive) {
      requestAnimationFrame(() => this.gameLoop());
      return;
    }
    const now = Date.now();
    for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
      const proj = this.activeProjectiles[i];
      const elapsed = now - proj.startTime;
      const progress = Math.min(elapsed / proj.duration, 1);
      const colIdx = Math.floor(proj.startCol + progress * (proj.endCol - proj.startCol));
      if (proj.lastCol !== null && proj.lastCol >= proj.startCol && proj.lastCol <= proj.endCol) {
        const span = this.gridSpans[proj.visualRow][proj.lastCol];
        span.textContent = proj.originalContent[proj.lastCol] || " ";
        this.dirtyVisualRows.add(proj.visualRow);
      }
      if (colIdx <= proj.endCol && colIdx >= proj.startCol) {
        const span = this.gridSpans[proj.visualRow][colIdx];
        proj.originalContent[colIdx] = span.textContent;
        span.textContent = "ƒ";
        proj.lastCol = colIdx;
        this.dirtyVisualRows.add(proj.visualRow);
      }
      if (progress >= 1) {
        this.activeProjectiles.splice(i, 1);
        this.dirtyVisualRows.add(proj.visualRow);
      }
    }
    for (let wave of this.wavesState) {
      if (!wave.announced && now >= wave.nextSpawnTime) {
        if (wave.hugeWave) this.displaySpecialMessage("/!\\ TESTING PHASE APPROACHING /!\\");
        if (wave.finalWave) this.displaySpecialMessage("FINAL SPRINT");
        wave.announced = true;
      }
      if (wave.bugsLeft > 0 && now >= wave.nextSpawnTime) {
        let lane;
        if (wave.lanes.length > 0) {
          lane = wave.lanes[Math.floor(Math.random() * wave.lanes.length)];
        } else {
          lane = wave.laneAssignments[wave.bugs - wave.bugsLeft];
        }
        const bugType = wave.bugType || "Error";
        this.laneQueues[lane].push({ type: BUG_TYPES[bugType] });
        wave.bugsLeft--;
        if (wave.bugsLeft > 0) wave.nextSpawnTime += wave.interval;
      }
    }
    for (let lane = 0; lane < 26; lane++) {
      if (this.laneQueues[lane].length > 0 && !isLaneOccupied(lane, now, this.activeBugs)) {
        const bugInfo = this.laneQueues[lane].shift();
        const bug = createBug(bugInfo.type.exception, lane, bugInfo.type.hits, bugInfo.type.speed, bugInfo.type.type);
        bug.prevPosition = 38;
        this.activeBugs.push(bug);
        const visRow = lane < 13 ? lane : lane - 13;
        this.dirtyVisualRows.add(visRow);
        if (bug.type === "FastError" && this.isAudioContextStarted && this.isTabVisible) {
          const baseTime = this.getNextSoundTime();
          this.fastErrorSpawnSynth.triggerAttackRelease("E5", "32n", baseTime);
          this.fastErrorSpawnSynth.triggerAttackRelease("G5", "32n", baseTime + Tone.Time("32n").toSeconds());
        }
      }
    }
    this.updateBugs(now);
    for (let bug of this.activeBugs) {
      if (bug.type === "ILOVEYOU" && !bug.fixing) {
        if (now - bug.lastSpawnTime >= bug.spawnInterval) {
          const adjacentLanes = [];
          if (bug.row > 0) adjacentLanes.push(bug.row - 1);
          if (bug.row < 2 * this.currentLevel - 1) adjacentLanes.push(bug.row + 1);
          if (adjacentLanes.length > 0) {
            const targetLane = adjacentLanes[Math.floor(Math.random() * adjacentLanes.length)];
            const targetPosition = bug.position;
            const movesSpawned = 38 - targetPosition;
            const speedSpawned = BUG_TYPES.FastError.speed;
            const effectiveSpawnTime = now - (movesSpawned * 500) / speedSpawned;
            const newBug = createBug(
              BUG_TYPES.FastError.exception,
              targetLane,
              BUG_TYPES.FastError.hits,
              speedSpawned,
              "FastError",
              effectiveSpawnTime
            );
            newBug.prevPosition = 38;
            this.activeBugs.push(newBug);
            const visRow = targetLane < 13 ? targetLane : targetLane - 13;
            this.dirtyVisualRows.add(visRow);
            if (this.isAudioContextStarted && this.isTabVisible) {
              const baseTime = this.getNextSoundTime();
              this.fastErrorSpawnSynth.triggerAttackRelease("E5", "32n", baseTime);
              this.fastErrorSpawnSynth.triggerAttackRelease("G5", "32n", baseTime + Tone.Time("32n").toSeconds());
            }
            const registerR = this.getRegisterName(bug.row);
            const registerS = this.getRegisterName(targetLane);
            this.logMessage(`VIRUS_INFECT [${registerR}], [${registerS}] ; ILOVEYOU spreads`);
            bug.isBlinking = true;
            bug.blinkEndTime = now + 300;
            bug.lastSpawnTime = now;
          }
        }
      }
    }
    for (let bug of this.activeBugs) {
      const visRow = bug.row < 13 ? bug.row : bug.row - 13;
      this.dirtyVisualRows.add(visRow);
    }
    for (let i = this.activeBugs.length - 1; i >= 0; i--) {
      const bug = this.activeBugs[i];
      if (bug.fixing && now >= bug.removeTime) {
        this.levelStats[this.currentLevel - 1].fixed++;
        const label = bug.label;
        if (!this.levelStats[this.currentLevel - 1].fixedByLabel[label]) {
          this.levelStats[this.currentLevel - 1].fixedByLabel[label] = 0;
        }
        this.levelStats[this.currentLevel - 1].fixedByLabel[label]++;
        const visRow = bug.row < 13 ? bug.row : bug.row - 13;
        this.activeBugs.splice(i, 1);
        this.dirtyVisualRows.add(visRow);
      }
    }
    this.render(now);
    this.updateLogArea();
    const allWavesComplete = this.wavesState.every((w) => w.bugsLeft === 0);
    const allBugsCleared = this.activeBugs.length === 0;
    const allQueuesEmpty = this.laneQueues.every((q) => q.length === 0);
    if (allWavesComplete && allBugsCleared && allQueuesEmpty) {
      this.displayLevelComplete();
    } else {
      requestAnimationFrame(() => this.gameLoop());
    }
  }

  displayLevelComplete() {
    if (this.typeTimeout) clearTimeout(this.typeTimeout);
    this.gameState = "levelComplete";
    this.canProceed = false;
    this.grid.style.display = "none";
    this.logArea.style.display = "none";
    this.briefing.style.display = "none";
    const stats = this.levelStats[this.currentLevel - 1];
    const text = `Level ${this.currentLevel} completed!\n\nBugs ƒixed: ${stats.fixed}\nBugs slipped: ${stats.slipped}\nBugs introduced: ${stats.introduced}\n\nPress any key to continue...\n`;
    this.typeText(text, 30, this.scoreLine, () => {
      this.canProceed = true;
      if (this.isAudioContextStarted && this.levelStatsMidi) {
        Tone.Transport.stop();
        Tone.Transport.loop = true;
        this.scheduleMidi(this.levelStatsMidi);
        Tone.Transport.start();
      }
    });
  }

  startLevel() {
    if (this.typeTimeout) clearTimeout(this.typeTimeout);
    this.briefing.textContent = "";
    this.briefing.style.display = "none";
    this.scoreLine.innerHTML = "";
    this.grid.innerHTML = "";
    this.grid.style.display = "block";
    this.logArea.style.display = "block";
    if (this.isAudioContextStarted) {
      Tone.Transport.stop();
      this.scheduleMidi(this.gameplayMidi);
      Tone.Transport.position = 0;
      Tone.Transport.start();
    }
    this.gridSpans = [];
    for (let v = 0; v < 13; v++) {
      const rowDiv = document.createElement("div");
      rowDiv.className = "row";
      const rowSpans = [];
      for (let i = 0; i < 81; i++) {
        const span = document.createElement("span");
        span.className = "grid-char";
        span.textContent = " ";
        rowSpans.push(span);
        rowDiv.appendChild(span);
      }
      this.grid.appendChild(rowDiv);
      this.gridSpans.push(rowSpans);
    }
    const numActive = 2 * this.currentLevel;
    this.activeBugs = [];
    this.activeProjectiles = [];
    this.laneQueues = Array(26)
      .fill()
      .map(() => []);
    this.dirtyVisualRows.clear();
    for (let v = 0; v < 13; v++) {
      if (v < numActive || v + 13 < numActive) this.dirtyVisualRows.add(v);
    }
    this.startTime = Date.now();
    this.lastMoveTime = this.startTime;
    this.logMessages = [];
    this.levelConfig = LEVEL_CONFIGS[this.currentLevel];
    this.levelStats[this.currentLevel - 1] = { fixed: 0, slipped: 0, introduced: 0, fixedByLabel: {} };
    const waves = this.levelConfig.waves;
    this.wavesState = waves.map((wave) => ({
      bugs: wave.bugs,
      nextSpawnTime: this.startTime + wave.delay,
      bugsLeft: wave.bugs,
      interval: wave.interval,
      lanes: wave.lanes,
      hugeWave: wave.hugeWave || false,
      finalWave: wave.finalWave || false,
      announced: false,
      bugType: wave.bugType,
      laneAssignments: [],
    }));
    const availableLanes = Array.from({ length: numActive }, (_, i) => i);
    this.wavesState.forEach((wave) => {
      if (wave.lanes.length === 0 && wave.bugs > 0) {
        const shuffled = [...availableLanes].sort(() => Math.random() - 0.5);
        for (let i = 0; i < wave.bugs; i++) {
          wave.laneAssignments.push(shuffled[i % shuffled.length]);
        }
      }
    });
    this.levelTotalTime = Math.max(...waves.map((w) => w.delay + (w.bugs - 1) * w.interval));
    const W = 25;
    this.hugeWavePositions = new Set();
    waves.forEach((wave) => {
      if (wave.hugeWave) {
        const pos = W - 1 - Math.floor((wave.delay / this.levelTotalTime) * W);
        if (pos >= 0 && pos < W) this.hugeWavePositions.add(pos);
      }
    });
    // Log the initial message from PLAYER_THOUGHTS
    const initialMessage = PLAYER_THOUGHTS[this.currentLevel - 1] || ["Starting level..."];
    this.logMessage(initialMessage);
    const obj = BRIEFINGS[this.currentLevel - 1] || {};
    this.currentTitle = this.extractTitle(obj.bossText);
    const replyLines = (obj.replyText || "").split("\n");
    const dateLine = replyLines.find((l) => l.startsWith("Date: "));
    this.currentDatetime = dateLine ? dateLine.substring(6).trim() : "Unknown date and time";
    this.forkbombSpawnsLeft = this.maxForkbombSpawns;
    if (this.currentLevel >= 10) {
      this.terminal.classList.add("level-10");
      this.muteCheckbox.classList.add("level-10");
    } else {
      this.terminal.classList.remove("level-10");
      this.muteCheckbox.classList.remove("level-10");
    }
    this.setupNoiseOverlay();
    requestAnimationFrame(() => this.gameLoop());
  }

  playShootSound() {
    if (this.isAudioContextStarted && this.isTabVisible && this.shootSynth) {
      const startTime = this.getNextSoundTime();
      this.shootSynth.triggerAttack("C5", startTime);
      this.shootSynth.frequency.exponentialRampToValueAtTime("C4", startTime + 0.1);
      this.shootSynth.triggerRelease(startTime + 0.1);
    }
  }

  playDeathSound() {
    if (this.isAudioContextStarted && this.isTabVisible && this.deathSynth) {
      const startTime = this.getNextSoundTime();
      this.deathSynth.triggerAttackRelease("0.3", startTime);
    }
  }

  shootF(rowIndex, targetBug = null) {
    this.playShootSound();
    const visualRow = rowIndex < 13 ? rowIndex : rowIndex - 13;
    const isLeftSide = rowIndex < 13;
    const startCol = isLeftSide ? 2 : 43;
    let endCol;
    if (targetBug) {
      if (targetBug.row === rowIndex) {
        const bugPosition = Math.floor(targetBug.position);
        endCol = startCol + Math.max(0, bugPosition);
      } else {
        endCol = isLeftSide ? 39 : 80;
      }
    } else {
      endCol = isLeftSide ? 39 : 80;
    }
    endCol = Math.min(endCol, isLeftSide ? 39 : 80);
    const speed = 50;
    const distance = endCol - startCol;
    const duration = Math.max(100, (distance / speed) * 1000);
    const spansRow = this.gridSpans[visualRow];
    const originalContent = {};
    for (let col = startCol; col <= endCol; col++) {
      originalContent[col] = spansRow[col].textContent;
    }
    this.activeProjectiles.push({
      row: rowIndex,
      visualRow,
      startCol,
      endCol,
      startTime: Date.now(),
      duration,
      lastCol: null,
      originalContent,
      targetBug,
      originalRow: targetBug ? targetBug.row : rowIndex,
    });
    this.dirtyVisualRows.add(visualRow);
  }

  updateBugLabel(bug) {
    if (bug.type === "Forkbomb") {
      bug.fullText = `fork(${bug.hitsRemaining})`;
    } else if (bug.type === "Heisenbug") {
      if (bug.hitsRemaining === 3) {
        bug.exception = "Heis3nbug";
      } else if (bug.hitsRemaining === 2) {
        bug.exception = "Hei2enbug";
      } else if (bug.hitsRemaining === 1) {
        bug.exception = "He1senbug";
      }
      bug.fullText = bug.exception;
    } else if (bug.type === "ILOVEYOU") {
      if (bug.hitsRemaining === 3) {
        bug.exception = "ILOVEYOU";
      } else if (bug.hitsRemaining === 2) {
        bug.exception = "LOVEYOU";
      } else if (bug.hitsRemaining === 1) {
        bug.exception = "YOU";
      }
      bug.fullText = bug.exception;
    } else if (bug.type === "ToughError") {
      if (bug.hitsRemaining === 2) {
        bug.fullText = `{${bug.exception}}`;
      } else if (bug.hitsRemaining === 1) {
        bug.fullText = bug.exception;
      }
    } else {
      bug.fullText = bug.exception;
    }
  }

  isValidKey(event) {
    if (IGNORE_KEYS.has(event.key)) return false;
    return true;
  }

  teleportHeisenbug(targetBug, now) {
    const currentRow = targetBug.row;
    const activeLanes = Array.from({ length: 2 * this.currentLevel }, (_, i) => i);
    const availableLanes = activeLanes.filter((l) => l !== currentRow);
    if (availableLanes.length > 0) {
      const newRow = availableLanes[Math.floor(Math.random() * availableLanes.length)];
      const oldVisRow = currentRow < 13 ? currentRow : currentRow - 13;
      const newVisRow = newRow < 13 ? newRow : newRow - 13;
      targetBug.row = newRow;
      targetBug.isBlinking = true;
      targetBug.blinkEndTime = now + 300;
      this.logMessage(
        `MOV [${this.getRegisterName(newRow)}], [${this.getRegisterName(currentRow)}] ; Heisenbug relocated`
      );
      this.dirtyVisualRows.add(oldVisRow);
      this.dirtyVisualRows.add(newVisRow);
    }
  }

  async onKeydown(event) {
    if (this.isEasterEggActive || event.repeat || !this.isValidKey(event)) return;

    switch (this.gameState) {
      case "motd":
        await this.handleMOTDPhase(event);
        break;
      case "briefing":
        await this.handleBriefingPhase(event);
        break;
      case "playing":
        await this.handlePlayingKey(event);
        break;
      case "levelComplete":
        if (this.canProceed) {
          this.handleLevelComplete();
        }
        break;
      case "gameOver":
        await this.handleGameOverPhase(event);
        break;
      case "finalBriefing":
        if (this.canProceed) {
          this.gameState = "finalStats";
          this.briefing.style.display = "none";
          this.scoreLine.textContent = "";
          this.canProceed = false;
          this.typeText(this.totalStatsText, 30, this.scoreLine, () => {
            this.canProceed = true;
          });
        }
        break;
      case "finalStats":
        if (this.canProceed) {
          this.gameState = "motd";
          this.motdPhase = 0;
          this.scoreLine.textContent = "";
          this.typeText(MOTD, 30, this.scoreLine, () => {
            this.motdPhase = 1;
            document.querySelectorAll("h1, footer").forEach((el) => {
              el.classList.remove("fade-out");
              el.classList.add("fade-in");
              el.style.visibility = "visible";
              setTimeout(() => el.classList.remove("fade-in"), 500);
            });
          });
        }
        break;
      default:
        console.warn("Unhandled gameState:", this.gameState);
    }
  }

  async handleMOTDPhase(event) {
    if (this.motdPhase === 0) {
      this.isTyping = false;
      clearTimeout(this.typeTimeout);
      this.scoreLine.innerHTML = MOTD.replace(/\n/g, "<br>");
      const cursor = document.createElement("span");
      cursor.className = "cursor";
      cursor.textContent = "_";
      this.scoreLine.appendChild(cursor);
      this.motdPhase = 1;
    } else if (this.motdPhase === 1) {
      await this.startAudioContext();
      document.querySelectorAll("h1, footer").forEach((el) => el.classList.add("fade-out"));
      setTimeout(() => {
        document.querySelectorAll("h1, footer").forEach((el) => (el.style.visibility = "hidden"));
      }, 500);
      this.levelStats = [];
      this.currentLevel = 1;
      this.scoreLine.textContent = "";
      this.logArea.textContent = "";
      this.gameState = "intro";
      this.displayIntroAnimation();
    }
  }

  async handleBriefingPhase(event) {
    const obj = BRIEFINGS[this.currentLevel - 1];
    if (!obj) return;
    if (this.isTyping) {
      clearTimeout(this.typeTimeout);
      const fullText = this.briefingPhase < 2 ? obj.bossText : obj.replyText;
      this.briefing.innerHTML = fullText.replace(/\n/g, "<br>");
      const cursor = document.createElement("span");
      cursor.className = "cursor";
      cursor.textContent = "_";
      this.briefing.appendChild(cursor);
      if (this.briefingPhase === 0) {
        this.briefingPhase = 1;
        this.bossTextFinished = true;
      } else if (this.briefingPhase === 1) {
        this.briefingPhase = 2;
        this.replyTextFinished = false;
      } else if (this.briefingPhase === 2) {
        this.briefingPhase = 3;
        this.replyTextFinished = true;
      }
      this.isTyping = false;
      return;
    }
    switch (this.briefingPhase) {
      case 0:
        this.prepareBriefing(obj.bossText);
        this.briefingPhase = 1;
        this.bossTextFinished = true;
        break;
      case 1:
        this.briefing.textContent = "";
        this.briefingPhase = 2;
        this.isTyping = true;
        this.typeText(obj.replyText, 30, this.briefing, () => {
          this.briefingPhase = 3;
          this.replyTextFinished = true;
          this.isTyping = false;
        });
        break;
      case 2:
        this.prepareBriefing(obj.replyText);
        this.briefingPhase = 3;
        this.replyTextFinished = true;
        break;
      case 3:
        this.gameState = "playing";
        this.briefing.style.display = "none";
        this.briefingPhase = 0;
        this.bossTextFinished = false;
        this.replyTextFinished = false;
        this.startLevel();
        break;
    }
  }

  prepareBriefing(text) {
    this.briefing.innerHTML = text.replace(/\n/g, "<br>");
    const cursor = document.createElement("span");
    cursor.className = "cursor";
    cursor.textContent = "_";
    this.briefing.appendChild(cursor);
  }

  async handlePlayingKey(event) {
    const key = event.key.toUpperCase();
    if (key >= "A" && key <= "Z") {
      this.processLetterKey(key);
    }
  }

  processLetterKey(key) {
    this.lastKeys.push(key);
    if (this.lastKeys.length > 10) {
      this.lastKeys.shift();
    }
    if (this.lastKeys.join("") === "JAVASCRIPT") {
      this.triggerEasterEgg();
      this.lastKeys = [];
    }
    const rowIndex = key.charCodeAt(0) - 65;
    if (rowIndex < 2 * this.currentLevel) {
      const bugsInRow = this.activeBugs.filter((b) => b.row === rowIndex);
      const now = Date.now();
      const availableBugs = bugsInRow.filter((b) => !b.fixing && b.targetingCount < b.hitsRemaining);
      const targetBug = availableBugs.length > 0 ? availableBugs.sort((a, b) => a.position - b.position)[0] : null;
      const registerName = this.getRegisterName(rowIndex);
      const visualRow = rowIndex < 13 ? rowIndex : rowIndex - 13;
      if (targetBug) {
        targetBug.targetingCount += 1;
        targetBug.targeted = true;
        this.updateBugLabel(targetBug);
        if (targetBug.type === "Heisenbug" && targetBug.hitsRemaining > 1) {
          this.teleportHeisenbug(targetBug, now);
          this.playTeleportSound();
        }
        this.shootF(rowIndex, targetBug);
        const distance = Math.max(0, Math.floor(targetBug.position));
        const duration = Math.max(100, (distance / 50) * 1000);
        setTimeout(() => {
          if (targetBug.fixing) {
            targetBug.targetingCount -= 1;
            targetBug.targeted = false;
            this.levelStats[this.currentLevel - 1].introduced++;
            return;
          }
          const proj = this.activeProjectiles.find((p) => p.targetBug === targetBug && p.duration === duration);
          if (proj && targetBug.row !== proj.originalRow) {
            this.logMessage(`BUG_JMP [${this.getRegisterName(proj.originalRow)}] ; It evaded fix`);
            targetBug.targetingCount -= 1;
            targetBug.targeted = false;
            return;
          }
          const shouldPlayArmorBreak =
            (targetBug.type === "ToughError" && targetBug.hitsRemaining === 2) ||
            ((targetBug.type === "ILOVEYOU" || targetBug.type === "Forkbomb") &&
              (targetBug.hitsRemaining === 3 || targetBug.hitsRemaining === 2));
          targetBug.hitsRemaining -= 1;
          this.updateBugLabel(targetBug);
          if (shouldPlayArmorBreak) {
            this.playArmorBreakSound();
          }
          if (targetBug.type === "Forkbomb" && targetBug.hitsRemaining === 1 && targetBug.forkbombSpawnsLeft > 0) {
            this.spawnForkbombBugs(targetBug);
          }
          if (targetBug.hitsRemaining <= 0) {
            targetBug.fixing = true;
            this.playDeathSound();
          }
          if (targetBug.hitsRemaining <= 0) {
            targetBug.fixing = true;
            this.playDeathSound();
            const nowF = Date.now();
            targetBug.fixStartTime = nowF;
            const currentRegisterName = this.getRegisterName(targetBug.row);
            this.logMessage(`FIX [${currentRegisterName}] ; Bug squashed`);
            const rowFixingBugs = this.activeBugs.filter((b) => b.row === targetBug.row && b.fixing && b !== targetBug);
            const targetRange = this.getExplosionRange(targetBug);
            const otherRanges = rowFixingBugs.map((b) => this.getExplosionRange(b));
            const merged = this.mergeOverlappingRanges(otherRanges);
            const overlap = merged.find((r) => targetRange.start <= r.end + 1 && targetRange.end >= r.start - 1);
            if (overlap) {
              const bugsInRange = rowFixingBugs.filter((b) => {
                const br = this.getExplosionRange(b);
                return br.start <= overlap.end + 1 && br.end >= overlap.start - 1;
              });
              const maxTime = Math.max(...bugsInRange.map((b) => b.removeTime || 0), nowF + 500);
              targetBug.removeTime = maxTime;
              bugsInRange.forEach((b) => {
                b.removeTime = maxTime;
              });
            } else {
              targetBug.removeTime = nowF + 500;
            }
            const visRow = targetBug.row < 13 ? targetBug.row : targetBug.row - 13;
            this.dirtyVisualRows.add(visRow);
          } else {
            targetBug.isBlinking = true;
            targetBug.blinkEndTime = Date.now() + 300;
            if (targetBug.type === "ILOVEYOU") {
              const adjacentLanes = [];
              if (targetBug.row > 0) adjacentLanes.push(targetBug.row - 1);
              if (targetBug.row < 2 * this.currentLevel - 1) adjacentLanes.push(targetBug.row + 1);
              if (adjacentLanes.length > 0) {
                const targetLane = adjacentLanes[Math.floor(Math.random() * adjacentLanes.length)];
                const hitTime = Date.now();
                const targetPosition = targetBug.position;
                const movesSpawned = 38 - targetPosition;
                const speedSpawned = BUG_TYPES.FastError.speed;
                const effectiveSpawnTime = hitTime - (movesSpawned * 500) / speedSpawned;
                const newBug = createBug(
                  BUG_TYPES.FastError.exception,
                  targetLane,
                  BUG_TYPES.FastError.hits,
                  speedSpawned,
                  "FastError",
                  effectiveSpawnTime
                );
                newBug.prevPosition = 38;
                this.activeBugs.push(newBug);
                const visRow = targetLane < 13 ? targetLane : targetLane - 13;
                this.dirtyVisualRows.add(visRow);
                if (this.isAudioContextStarted && this.isTabVisible) {
                  const baseTime = this.getNextSoundTime();
                  this.fastErrorSpawnSynth.triggerAttackRelease("E5", "32n", baseTime);
                  this.fastErrorSpawnSynth.triggerAttackRelease("G5", "32n", baseTime + Tone.Time("32n").toSeconds());
                }
                const registerR = this.getRegisterName(targetBug.row);
                const registerS = this.getRegisterName(targetLane);
                this.logMessage(`ILOVEYOU [${registerR}] INFECTS [${registerS}]`);
                newBug.isBlinking = true;
                newBug.blinkEndTime = hitTime + 300;
              }
            } else if (targetBug.type === "Forkbomb" && targetBug.hitsRemaining === 1) {
              if (this.forkbombSpawnsLeft >= 2) {
                const adjacentLanes = [];
                if (targetBug.row > 0) adjacentLanes.push(targetBug.row - 1);
                if (targetBug.row < 2 * this.currentLevel - 1) adjacentLanes.push(targetBug.row + 1);
                const hitTime = Date.now();
                const effectiveSpawnTimeNew = hitTime + this.spawnDelay;
                for (let lane of adjacentLanes) {
                  const newBug = createBug(
                    BUG_TYPES.Forkbomb.exception,
                    lane,
                    BUG_TYPES.Forkbomb.hits,
                    BUG_TYPES.Forkbomb.speed,
                    "Forkbomb",
                    effectiveSpawnTimeNew
                  );
                  newBug.prevPosition = 38;
                  newBug.isBlinking = true;
                  newBug.blinkEndTime = hitTime + 300;
                  this.activeBugs.push(newBug);
                  const visRow = lane < 13 ? lane : lane - 13;
                  this.dirtyVisualRows.add(visRow);
                  this.logMessage(
                    `FORKBOMB_SPAWN [${this.getRegisterName(targetBug.row)}], [${this.getRegisterName(lane)}]`
                  );
                }
                this.forkbombSpawnsLeft -= 2;
              }
            }
            this.logMessage(`DEC BUG_HP[${registerName}] ; Remaining HP: ${targetBug.hitsRemaining}`);
            this.dirtyVisualRows.add(visualRow);
          }
          targetBug.targetingCount -= 1;
          targetBug.targeted = false;
          const now = Date.now();
          const moves = 38 - targetBug.position;
          const timeForMoves = (moves * 500) / targetBug.speed;
          targetBug.effectiveSpawnTime = now - timeForMoves;
        }, duration);
      } else {
        this.levelStats[this.currentLevel - 1].introduced++;
        this.shootF(rowIndex);
      }
    }
  }

  handleLevelComplete() {
    clearTimeout(this.typeTimeout);
    if (this.isAudioContextStarted) {
      Tone.Transport.stop();
    }
    if (this.currentLevel < 13) {
      this.currentLevel++;
      this.gameState = "briefing";
      this.displayBriefing();
    } else {
      this.gameState = "gameOver";
      this.gameOverPhase = 0;

      let totalFixed = 0,
        totalSlipped = 0,
        totalIntroduced = 0;
      for (const s of this.levelStats) {
        totalFixed += s.fixed;
        totalSlipped += s.slipped;
        totalIntroduced += s.introduced;
      }
      const totalBugs = totalFixed + totalSlipped + totalIntroduced;
      const qualityPerc = totalBugs > 0 ? (totalFixed / totalBugs) * 100 : 100;
      const category =
        qualityPerc >= 90 ? "Excellent" : qualityPerc >= 70 ? "Good" : qualityPerc >= 50 ? "Fair" : "Poor";
      this.totalStats = {
        fixed: totalFixed,
        slipped: totalSlipped,
        introduced: totalIntroduced,
        qualityPerc: qualityPerc.toFixed(2),
        category,
      };

      if (qualityPerc >= 90) {
        this.bossMessage = TRIUMPH_MESSAGE;
      } else if (qualityPerc >= 70) {
        this.bossMessage = NOT_A_TOTAL_DISASTER_MESSAGE;
      } else if (qualityPerc >= 50) {
        this.bossMessage = WEBFEST_FLOP_MESSAGE;
      } else {
        this.bossMessage = WEBFEST_YOURE_DONE_MESSAGE;
      }

      const isWin = qualityPerc >= 90;
      this.bossMidi = isWin ? this.winMidi : this.loseMidi;

      if (this.isAudioContextStarted) {
        Tone.Transport.stop();
        Tone.Transport.cancel(0);
        this.scheduleMidi(this.bossMidi);
        Tone.Transport.start();
      }

      this.typeText(this.bossMessage + "\n\nPress any key to continue...\n", 30, this.scoreLine, () => {
        this.gameOverPhase = 1;
        this.canProceedGameOver = true;
      });
    }
  }

  async handleGameOverPhase(event) {
    if (!this.canProceedGameOver) return;
    this.canProceedGameOver = false;

    if (this.gameOverPhase === 1) {
      clearTimeout(this.typeTimeout);
      const totalFixedByLabel = {};
      for (const levelStat of this.levelStats) {
        for (const [label, count] of Object.entries(levelStat.fixedByLabel)) {
          totalFixedByLabel[label] = (totalFixedByLabel[label] || 0) + count;
        }
      }
      const totalFixedByLabelText = Object.entries(totalFixedByLabel)
        .map(([label, count]) => `  - ${label}: ${count}`)
        .join("\n");

      const isWin = this.totalStats.qualityPerc >= 90;
      const heading = isWin ? "Congratulations!" : "Game over!";

      const text = `${heading}\n\nTotal bugs fixed: ${this.totalStats.fixed}${
        totalFixedByLabelText ? "\n" + totalFixedByLabelText : ""
      }\nTotal bugs slipped: ${this.totalStats.slipped}\nTotal bugs introduced: ${
        this.totalStats.introduced
      }\nSoftware quality: ${this.totalStats.category} (${
        this.totalStats.qualityPerc
      }%)\n\nPress any key to continue...\n`;

      this.totalStatsText = text;
      this.typeText(text, 30, this.scoreLine, () => {
        this.gameOverPhase = 2;
        this.canProceedGameOver = true;
      });
    } else if (this.gameOverPhase === 2) {
      this.gameState = "motd";
      this.motdPhase = 0;
      this.briefing.style.display = "none";
      this.terminal.classList.remove("level-10");
      this.muteCheckbox.classList.remove("level-10");
      this.noiseOverlay.classList.remove("low-noise");
      if (this.isAudioContextStarted) {
        Tone.Transport.stop();
        Tone.Transport.cancel(0);
      }
      this.typeText(MOTD, 30, this.scoreLine, () => {
        this.motdPhase = 1;
        document.querySelectorAll("h1, footer").forEach((el) => {
          el.classList.remove("fade-out");
          el.classList.add("fade-in");
          el.style.visibility = "visible";
          setTimeout(() => el.classList.remove("fade-in"), 500);
        });
      });
    }
  }

  triggerEasterEgg() {
    this.isEasterEggActive = true;
    const terminal = this.terminal;
    const rect = terminal.getBoundingClientRect();
    this.easterEggCanvas = document.createElement("canvas");
    this.easterEggCanvas.id = "easterEggCanvas";
    this.easterEggCanvas.style.position = "absolute";
    this.easterEggCanvas.style.top = "0";
    this.easterEggCanvas.style.left = "0";
    this.easterEggCanvas.style.zIndex = "1000";
    this.easterEggCanvas.width = rect.width;
    this.easterEggCanvas.height = rect.height;
    this.easterEggCanvas.style.width = rect.width + "px";
    this.easterEggCanvas.style.height = rect.height + "px";
    terminal.appendChild(this.easterEggCanvas);
    const overlay = document.createElement("div");
    overlay.className = "easter-egg-overlay";
    terminal.appendChild(overlay);
    this.asciiReality = new ASCIIReality(this.easterEggCanvas);
    this.asciiReality.init();
    this.asciiReality.animate();
    setTimeout(() => {
      this.asciiReality.stop();
      terminal.removeChild(this.easterEggCanvas);
      terminal.removeChild(overlay);
      this.isEasterEggActive = false;
      this.easterEggCanvas = null;
      this.asciiReality = null;
    }, 10000);
  }

  generateNoiseDataURL(size = 32) {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d");
    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const v = Math.random() < 0.5 ? 0 : 255;
      data[i] = data[i + 1] = data[i + 2] = v;
      data[i + 3] = this.currentLevel >= 4 ? 100 : 150;
    }
    ctx.putImageData(imgData, 0, 0);
    return c.toDataURL();
  }
}

function ready() {
  window.game = new Game();
}

export { ready };
