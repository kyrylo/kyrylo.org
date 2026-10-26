# Illustration checks

Run the dependency-free geometry checks:

```sh
node --test a-little-life/_tests/geometry.test.cjs
```

With `@napi-rs/canvas` available in Node's module path, run:

```sh
node a-little-life/_tests/player.cjs
node a-little-life/_tests/render.cjs /tmp/little-life-review
```

The render check writes construction sheets, enlarged grips, prop details, and timeline contact sheets at four sizes. It checks connected figure/pair silhouettes, transparent canvas edges, deterministic seeking, bounded artwork caches, and identical frames after cache invalidation. These checks supplement visual review: connected pixels alone do not establish good anatomy or perspective.

Follow the family blocking through the whole story: Dad stays beside Mum and briefly rests a hand on her back at 3 and 16 s; you release Mum's hand to follow the friend; the parents make room before the partner arrives at 28 s. At 39 s you hold your own child's hand. The child ventures ahead after 49 s, slows to return beside you by 65 s, and continues forward with the next little one after your farewell, leaving your star unobscured. Inspect the partner's arrival at 29.5 s and all three grips on narrow screens. Names crossfade between childhood and adult positions without passing across faces. Geometry checks cover clear body spacing, continuous movement, palm/back contact, and the repeated opening/ending arrangement, as well as joint construction.

For the quiet scene stories, inspect the cottage at 4 s, the returning bird at 37 and 74 s, and the matching paper planes at 11 and 43 s. Follow the lower meadow at 15, 39, 51, 56, and 75 s: the flower becomes a seed head, seeds settle, and new flowers grow from their landing points. Scrubbing directly between those times must reproduce the same state; these details intentionally use story time rather than accumulated particles.

Follow a near foreground clump through 0–6 s at enlarged scale. Its stems should flex independently above steady bases, with connected contours across the cached strips. Near clumps pass faster than the small meadow plants and wrap outside the faded canvas edges. Character labels remain above the foliage. The same time-based breeze drives trees, fronds, and the small flower story, including after seeking or replay.

`geometry.js` has no canvas/DOM dependencies. `drawing.js` keeps its browser API unchanged and exposes inspection helpers only through its Node export. Diagnostic images and reports belong in the output directory, not in the site.
