let apiPromise;
function youtubeAPI() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const timer = setTimeout(() => fail(), 15000);
    function fail() {
      clearTimeout(timer);
      script.remove();
      apiPromise = null;
      reject(new Error("Camera player unavailable"));
    }
    window.onYouTubeIframeAPIReady = () => {
      clearTimeout(timer);
      resolve(window.YT);
    };
    script.onerror = fail;
    script.src = "https://www.youtube.com/iframe_api";
    document.head.append(script);
  });
  return apiPromise;
}
export function createLiveCamera({
  mount, panel, status, message, overlay, play, retry, next, onSource = () => {},
}) {
  let player, frame, city, source, generation = 0, timer, watchdog, travelTimer,
    ready = false, autoPaused = false, attempt = 0, sourceIndex = 0;

  function state(value, text, detail = "") {
    panel.dataset.state = value;
    status.textContent = text;
    message.textContent = detail;
    overlay.hidden = !["connecting", "unavailable", "blocked"].includes(value);
    play.hidden = value !== "blocked";
    retry.hidden = value !== "unavailable";
    next.hidden = value !== "unavailable";
  }
  function clearPlayer() {
    clearTimeout(timer);
    clearInterval(watchdog);
    player?.destroy();
    player = frame = null;
    ready = false;
    mount.replaceChildren();
  }
  function unavailable(detail) {
    clearTimeout(timer);
    clearInterval(watchdog);
    state("unavailable", "Not connected", detail);
  }
  function recover(token) {
    if (token !== generation) return;
    if (document.hidden) { autoPaused = true; return; }
    if (!navigator.onLine) {
      unavailable("Waiting for your connection. The clock is still running.");
    } else if (sourceIndex < (city.alternates?.length || 0)) {
      sourceIndex++;
      attempt = 0;
      connect();
    } else if (attempt < 1) {
      attempt++;
      connect(true);
    } else {
      unavailable("This camera is taking a break. Try again or visit the next place.");
    }
  }
  function armTimeout(token) {
    clearTimeout(timer);
    timer = setTimeout(() => recover(token), 25000);
  }
  function playing() {
    clearTimeout(timer);
    state("playing", "Live");
  }
  function blocked() {
    clearTimeout(timer);
    state("blocked", "Ready to play", "A little window into somewhere else.");
  }
  function currentVideo(target) {
    return target === player && !travelTimer &&
      target.getVideoData().video_id === source?.videoId;
  }
  function startYouTube(target, reload) {
    const token = generation;
    const iframe = target.getIframe();
    iframe.title = `${source.place}, ${city.name} — live camera by ${source.provider}`;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.tabIndex = -1;
    target.mute();
    if (document.hidden) { target.pauseVideo(); autoPaused = true; return; }
    if (reload) target.loadVideoById({ videoId: source.videoId });
    else target.playVideo();
    clearInterval(watchdog);
    let lastTime = -1, stalledSince = performance.now();
    watchdog = setInterval(() => {
      if (token !== generation || document.hidden || !currentVideo(target)) return;
      const time = target.getCurrentTime();
      if (time !== lastTime || panel.dataset.state !== "playing") {
        lastTime = time; stalledSince = performance.now();
      } else if (performance.now() - stalledSince > 30000) recover(token);
    }, 5000);
  }
  async function connect(fresh = false) {
    clearTimeout(travelTimer); travelTimer = null;
    const token = ++generation;
    clearTimeout(timer);
    clearInterval(watchdog);
    autoPaused = false;
    source = sourceIndex ? { ...city, ...city.alternates[sourceIndex - 1] } : city;
    onSource(source);
    state("connecting", attempt || sourceIndex ? "Reconnecting" : "Connecting",
      `Opening a window to ${city.name}…`);
    // Reuse the iframe when changing YouTube cameras. Only failed players and
    // provider changes need a new document, API bootstrap and decoding setup.
    if (fresh || source.cameraAlias || frame) clearPlayer();
    if (document.hidden) { autoPaused = true; return; }
    armTimeout(token);
    if (source.cameraAlias) {
      frame = document.createElement("iframe");
      frame.src = `./camera-frame.html?city=${encodeURIComponent(city.id)}&generation=${token}`;
      frame.title = `${source.place}, ${city.name} — live camera by ${source.provider}`;
      frame.allow = "autoplay; fullscreen";
      frame.tabIndex = -1;
      frame.referrerPolicy = "strict-origin-when-cross-origin";
      mount.append(frame);
      return;
    }
    if (player) {
      if (ready) startYouTube(player, true);
      return; // An in-flight player's ready event starts the latest city.
    }
    try {
      const YT = await youtubeAPI();
      if (token !== generation) return;
      const slot = document.createElement("div");
      mount.append(slot);
      player = new YT.Player(slot, {
        host: "https://www.youtube.com", videoId: source.videoId,
        width: "100%", height: "100%",
        playerVars: {
          autoplay: 1, mute: 1, controls: 0, disablekb: 1, fs: 0,
          iv_load_policy: 3, playsinline: 1, rel: 0, origin: location.origin,
        },
        events: {
          onReady: ({ target }) => {
            if (target !== player) return;
            ready = true;
            if (travelTimer) return;
            startYouTube(target, target.getVideoData().video_id !== source.videoId);
          },
          onStateChange: ({ data, target }) => {
            if (!currentVideo(target)) return;
            if (data === 1) {
              if (document.hidden) { target.pauseVideo(); autoPaused = true; return; }
              if (target.getVideoData().isLive === false) recover(generation);
              else playing();
            } else if (data === 2 && panel.dataset.state === "playing") {
              state("paused", "Paused");
              if (!document.hidden) armTimeout(generation);
            } else if (data === 3) {
              if (panel.dataset.state === "playing") state("buffering", "Buffering");
              armTimeout(generation);
            } else if (data === 0) recover(generation);
          },
          onError: ({ data, target }) => {
            if (target !== player || travelTimer) return;
            const id = target.getVideoData().video_id;
            if (id && id !== source.videoId) return;
            // Configuration/network failures affect every YouTube source; don't cycle.
            if (data === 153 || data === 5)
              unavailable("The camera player couldn’t connect. Try again or open the source.");
            else recover(generation);
          },
          onAutoplayBlocked: ({ target }) => { if (target === player && !travelTimer) blocked(); },
        },
      });
    } catch {
      if (token === generation)
        unavailable("The camera player couldn’t connect. The clock is still running.");
    }
  }
  // Only our current same-origin wrapper may report native video playback.
  window.addEventListener("message", (event) => {
    if (!frame || event.origin !== location.origin || event.source !== frame.contentWindow ||
        event.data?.type !== "elsewhere-camera" || event.data.generation !== generation) return;
    const value = event.data.state;
    if (value === "playing") { ready = true; playing(); }
    else if (value === "blocked") { ready = true; blocked(); }
    else if (value === "waiting") {
      if (panel.dataset.state === "playing") state("buffering", "Buffering");
      armTimeout(generation);
    } else if (value === "error") recover(generation);
  });
  function load(nextCity) {
    const initial = !city;
    city = nextCity; attempt = sourceIndex = 0;
    source = city;
    ++generation;
    clearTimeout(travelTimer);
    clearTimeout(timer);
    clearInterval(watchdog);
    onSource(source);
    state("connecting", "Connecting", `Opening a window to ${city.name}…`);
    if (frame) clearPlayer();
    if (initial) return connect();
    // The clock and theme react immediately; passing cities need no video load.
    travelTimer = setTimeout(connect, 400);
  }
  play.addEventListener("click", () => {
    if (frame) frame.contentWindow.postMessage({ type: "elsewhere-play" }, location.origin);
    else if (ready) { player.mute(); player.playVideo(); }
    armTimeout(generation);
  });
  retry.addEventListener("click", () => { attempt = sourceIndex = 0; connect(true); });
  window.addEventListener("online", () => {
    if (city && panel.dataset.state === "unavailable") load(city);
  });
  document.addEventListener("visibilitychange", () => {
    if (!city) return;
    if (document.hidden) {
      clearTimeout(travelTimer); travelTimer = null;
      clearTimeout(timer);
      autoPaused = true;
      if (frame) frame.contentWindow.postMessage({ type: "elsewhere-pause" }, location.origin);
      else if (ready) player.pauseVideo();
    } else if (autoPaused) {
      autoPaused = false;
      connect();
    }
  });
  return { load };
}
