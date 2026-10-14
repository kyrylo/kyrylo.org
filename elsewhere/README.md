# Elsewhere — a little time warp

A live clock and a window into another place. The current location is printed
on the clock face and changes as you travel. Scroll or pinch the photographic
clock to travel east or west. The +/− buttons, arrow keys, Home/End and city strip provide the same navigation. Hands warp to the
selected place’s current time; the second hand overshoots and settles with a
small mechanical rebound.

The background combines dim location colors with slowly drifting gradient fields
and curved ribbons. Travel morphs their colors over 2.8 seconds and composition
over 3.4 seconds: coastal arcs, city lights, alpine aurora, or warm dunes, with
variation for every location. A dark center preserves foreground contrast.
Local time gently adjusts intensity; this is art direction, not a weather or
sunrise simulation. Reduced motion freezes drift and switches themes immediately.
Hidden tabs pause ambient animation.

The gradients and ribbon masks are baked into small, cached 384px textures.
A single canvas, capped at 960px on its longest side, composites their color
blends and transforms at 30fps. This avoids large translucent GPU surfaces on
Retina screens while preserving the slow, soft movement. Interrupted transitions
blend from the currently visible colors; the cache stays bounded to six palettes.
Grain is a reusable 96px raster tile. Reduced motion draws only on changes;
hidden tabs stop the renderer entirely.
Clock hands rotate in separate composited layers, and the clock scheduler rests
between mechanical ticks. It wakes immediately for navigation and visibility
changes, always sampling wall-clock time rather than accumulating elapsed ticks.

## Live-camera route

Every visible stop has a supported live camera. On 14 October 2026 the route
has **23 stops**, drawn from **25 camera locations** plus two backup feeds.
There is one stop per available UTC offset. Offsets without a verified,
embeddable live source are omitted: this is not exhaustive coverage of every
time zone. No recordings or cameras in a different time zone fill the gaps.

The route refreshes each minute, preserves the selected place, and reorders
when daylight saving changes. Cape Town and Nuuk provide seasonal alternatives.
The initial view matches the visitor’s IANA zone or the closest available UTC
offset. Browser `Intl` supplies local times, dates, and daylight-saving rules.

`_tools/camera-sources.json` records the original operators, source links,
broadcast start times where available, and playback verification. Sources were
checked on **2026-10-14** using public metadata and real, advancing video in
Chrome. Kathmandu was removed because its current embeddable feed restarts
with new IDs twice daily; the original channel disables embedding.

## Players and recovery

YouTube uses its supported iframe API with controls, fullscreen and annotations
disabled. IPCamLive uses its supported public JavaScript player in a local
wrapper for Santa Maria and Malolo Lailai. The SDK handles stream discovery and
access; no extracted, expiring HLS URLs or owner credentials are used.

Only one player is mounted, muted, with the operator credited and linked below.
YouTube cameras reuse that player through `loadVideoById`. The clock and theme
respond immediately; camera loads wait for a 400ms pause in navigation so rapid
travel doesn't bootstrap a stream for every passing city. Provider changes and
failed-player recovery still create a fresh player.
The video is a passive window so hover and touch do not summon controls or
pause it. Provider branding and brief startup overlays remain intact. Video is
played directly from its provider, never downloaded or rehosted.

A real playing event enables the Live label. Buffering, blocked autoplay, and
failure have separate states. Ended broadcasts are rejected. Playback stalls
trigger one automatic reconnection; New York and Tokyo also have verified
backup views, with attribution updated when switching. Retries are bounded.
Manual retry and the next place remain available if recovery fails. Returning
online retries the camera. A failed player never stops the clock or navigation.

The IPCamLive wrapper forwards native video events to the parent. The parent
checks the message origin, source window and generation to reject stale or
unrelated events. Reused YouTube callbacks must match the requested video ID;
events from retired players and pending navigation are ignored.
Hidden tabs pause video and stop clock animation; returning reconnects at the
live edge. Reduced motion removes zoom, hand warps and decorative transitions.

External operators can stop broadcasts or change embedding permissions. The
verification script and browser audit make replacements easy to check. The
site needs internet, but no backend, account, API key or storage. Zoom changes
location, not the date of the footage; normal streaming latency means cameras
trail the clocks slightly.

Player documentation:
[YouTube](https://developers.google.com/youtube/player_parameters),
[IPCamLive](https://www.ipcamlive.com/examples/embed-js2.html).

## Files and preview

- `cities.js`: verified camera locations, attribution and backup views.
- `world-route.js`: camera-only UTC-offset route and seasonal selection.
- `warp-clock.js`: local time conversion, mechanical tick and directional warp.
- `elsewhere.js`: clock rendering, gestures, navigation and live updates.
- `atmosphere.js`: location palettes and gentle local-time lighting.
- `live-camera.js`: player lifecycle, playback status and bounded recovery.
- `camera-frame.html`, `camera-frame.js`: official IPCamLive player wrapper.
- `index.html`, `base.css`, `elsewhere.css`: standalone responsive page.

The photographic body is `assets/clock-body.png`; precise SVG markings and
hands sit over its spindle. No displayed time is baked into the image.
`assets/og.jpg` is the 1200×630 social share image, generated with the built-in
imagegen tool; its prompt is saved in `_tools/og-image-prompt.txt`.
The earlier lives, activity diaries and illustrations are absent from the page
and runtime; their unused sources and notes are retained.

```sh
python3 elsewhere/_tools/preview.py
```

Open <http://127.0.0.1:8244/elsewhere/>. The former `/same24/` URL redirects here. The server serves an isolated allowlisted
copy of public assets and the wordmark. Update its staging copy after edits.
Public files are also mirrored in `_site/elsewhere/`. The preview is kept online.

Production lives at <https://kyrylo.org/elsewhere/>. This standalone page needs no
Jekyll rendering: its public files are copied unchanged into `_site/elsewhere/`.
Commit both the source and its public mirror, along with `_site/same24/index.html`
when changing the redirect. The existing Skiff server publishes commits pushed
to `master` automatically. Keep development tools and the retired diary/scene
files out of the public mirror.
The server redirects `/elsewhere` to `/elsewhere/`. Page assets also use rooted
URLs, and the camera wrapper resolves from its module URL, so slashless links
remain functional even before a redirect is applied. The author's original SVG
wordmark is embedded directly to avoid a separate image request.

## Verification

```sh
node --test elsewhere/_tools/warp-clock.test.mjs
node elsewhere/_tools/entrypoints.test.mjs
node elsewhere/_tools/browser.test.mjs
node elsewhere/_tools/long-watch.test.mjs
node elsewhere/_tools/recovery.test.mjs
node elsewhere/_tools/rendering.test.mjs
node elsewhere/_tools/cameras.test.mjs
ELSEWHERE_BACKUPS_ONLY=1 node elsewhere/_tools/cameras.test.mjs
python3 elsewhere/_tools/verify-cameras.py
```

Browser checks require Playwright and Google Chrome. Set `PLAYWRIGHT_MODULE`
to its absolute module path if needed. `ELSEWHERE_URL` overrides the preview URL.
`ELSEWHERE_SKIP_STREAMS=1` skips duplicate stream checks in the general UI test;
`ELSEWHERE_CAMERA_IDS` limits the camera audit to selected comma-separated IDs.

Checks cover source playback and advancing frames, automatic failover and
correct credits, bounded stall recovery, fractional offsets, DST, midnight,
route selection retention, tick physics, gestures, keyboard navigation,
external failure, reduced motion, and 320–1200px layouts.

`_tools/performance.mjs` measures idle viewing and eight quick city changes at
1600×1000 @2x. It saves Chrome traces, frame timing and main-thread metrics under
`/tmp/elsewhere-performance`. By default it isolates page rendering with a camera
stub; use `PERF_LIVE=1` for live video. `PERF_WIDTH`, `PERF_HEIGHT` and `PERF_CPU`
allow smaller viewports and CPU throttling. Run comparisons serially, with no
other browser tests running, and use `PERF_LABEL` to distinguish the results.

Measured on 14 October 2026 (`_tools/performance-results.json`): travel p95 frame
interval improved from 33.3ms to 16.8ms with live video at desktop Retina size.
At 390×844 @2x with 4× CPU throttling and an isolated camera, p95 improved from
50ms to 16.8ms, and main-thread work fell from 5.87s to 2.55s per 6.5s travel
sample. These are local Chrome measurements, not a guarantee for every device
or an improvement claim for third-party camera/network startup latency.
