# Same24

A small clock doodle at `/same24/`: one live clock and one animated life at a
time. The photographic clock body has precise SVG hands. The room follows an
ordinary day at the current local time, with a short activity label and countdown.
“Another life” visits a different age and day. “Watch a day” plays that one diary
in 60 seconds, then returns to now. Pause/resume and an immediate return remain
available during playback.

The page has no age gallery, comparison section, explorer, diary popup, story
stops, or recap. The illustrations depict imagined settings and characters,
not respondents' actual appearances or homes.

Built in the site's standalone HTML/CSS/JavaScript style. Jekyll copies the
public assets without a frontend build. No CDN, remote fonts, API calls,
accounts, storage, or submissions are required at runtime.

## Illustrated scenes

`scene-kinds.js` maps the included adult and child activity codes onto 46
related scene families. Source labels remain in the diary; related activities
share artwork rather than implying detail the survey did not collect. Unknown
activities show a thoughtful character, and private activities use a closed door.

`illustrated-scenes.js` draws original SVG vignettes with ink outlines, warm
colors, simple rooms, and expressive characters. Stable diary identities choose
the character and room palette. Babies have a high chair, crib mobile, and
caregiver scenes; older adults have gray hair and glasses. Windows follow the
displayed day/night time. Furniture and props use the same coordinates as the
characters, including chair seats, table tops, hands, and bicycle pedals.

CSS supplies small local movements: blinking, breathing, typing, steam, laundry,
plants, and water. Activity changes crossfade over 460 milliseconds, with a
matching transition for the caption. Rapid changes retain the most visible
outgoing illustration and never stack more than two scenes. Paused playback, hidden tabs, and reduced-motion preferences
keep illustrations still. `scene-api.js` loads the art independently of the clock;
if the module fails, a simple activity icon appears while the diary stays usable.
Icons stay hidden during normal loading. No WebGL or Three.js is loaded. The
previous 3D modules and vendored library remain as unused source material.

The compact page places the clock beside the scene on desktop. Phones use a
small clock/time row above the scene. The footer supplies a short explanation
and data credit.

## Data sources

**Ages 15+: 480 real, anonymous diaries from the 2025 American Time Use Survey.**
The full source collection contains 6,146 respondents, 114,151 activity records,
and 15,052 roster records. All source diaries validate to exactly 1,440 minutes;
no diaries were dropped or time intervals invented. The static selection keeps
80 diaries per adult age band, spread across weekday/weekend and household
children strata. These are individual recorded days, not population estimates.

The official BLS server returned HTTP 403 here. We recovered the exact 2025
Activity, Respondent, Roster, and coding lexicon files from Internet Archive
snapshots of their official BLS download URLs. ZIP integrity checks pass, all
three tables have identical respondent identifier sets, and the 465 activity
labels were extracted from the original 2025 PDF. Every source URL, archive
capture, and SHA-256 checksum is recorded in the output JSON and the development
manifest `_tools/atus2025-sources.json`. The archive captures date from August
and September 2026; the observations are from 2025.

[ATUS covers ages 15+](https://www.bls.gov/respondents/tus/). The four younger
age bands use eight explicitly illustrative days, stored separately in
`data/illustrative-children.json`. They are not survey observations. The adult
importer never rewrites this collection. The page credits the US ATUS source
and explains the view in a short footer, with children’s days described as
made-up examples. One animated scene accompanies the current activity. Raw case IDs and activity
codes remain in the data, not the UI.

The live clock uses the viewer's local time. Each adult age band selects a
recorded day deterministically from the local diary date and weekday/weekend
type. The cast stays stable through midnight and changes at 04:00. Missing data
is shown as unavailable, with no synthetic fallback. “Another life” cycles the
age groups and chooses another diary of the same weekday/weekend type. There
are no population estimates or comparisons in the page.

## Run locally

From the repository root, using Python 3:

```sh
python3 same24/_tools/preview.py
```

Open <http://127.0.0.1:8244/same24/>. This serves only an isolated copy of allowlisted
public assets and the existing site wordmark, not the repository. Restart after edits. Use `--port 8245` if the
default port is occupied. Stop with Ctrl-C.

The usual Jekyll build also works:

```sh
bundle install
bundle exec jekyll build --destination /tmp/same24-site
```

No deployment was performed. The existing nginx configuration serves the tracked
`_site/` directory, so generated public files are also included in `_site/same24/`.
Other built pages and deployment settings are unchanged. After editing Same24,
build and copy the generated subdirectory into `_site/same24/` before shipping.
The development helpers in `_tools/` are excluded by Jekyll's underscore-directory
convention. Browser modules use `.js` for the existing nginx MIME settings.

## Reproduce the real-data asset

Sources:

- [2025 ATUS microdata and download links](https://www.bls.gov/tus/data/datafiles-2025.htm)
- [2025 Interview Data Dictionary](https://www.bls.gov/tus/dictionaries/atusintcodebk25.pdf), especially file linking, activity durations, and variable definitions.
- [2025 coding lexicon](https://www.bls.gov/tus/lexicons/lexiconnoex2025.pdf)
- [ATUS User's Guide](https://www.bls.gov/tus/atususersguide.pdf)

The importer uses Python's standard library. PDF label extraction additionally
uses Poppler's `pdftotext` command; it is not a visitor or Jekyll dependency.
Keep raw downloads outside the repository:

```sh
python3 same24/_tools/prepare.py \
  --download-archive --source-dir /tmp/same24-atus-2025
```

`--download-archive` retrieves the pinned Internet Archive captures, checks their
SHA-256 hashes against `_tools/atus2025-sources.json`, extracts the original
lexicon, validates the complete collection, and atomically replaces
`data/diaries.json`. Repeat without the download flag to use saved source files.
Archive metadata is attached to the output only when input hashes match.

To try current official downloads instead, use `--download`. This discovers the
Activity, Respondent, and Roster ZIP URLs from the BLS 2025 index. Failed
downloads or validation leave the current site asset untouched.

If direct downloads are blocked, manually save the official files into that
directory and run without `--download`. It accepts `atusact-2025.zip`,
`atusresp-2025.zip`, and `atusrost-2025.zip` (underscores also accepted), or one
CSV-formatted `.dat`/`.csv` per type, plus `lexiconnoex2025.pdf`. Do not keep both
an archive and its extracted data file in the input directory. If PDF layout
extraction fails, `--labels /path/to/labels.json` accepts an object mapping six-digit
codes to **original 2025 BLS lexicon descriptions**. Missing descriptions fail
validation; the importer never guesses them. Wrapped PDF labels are preserved.

By default, up to 480 examples are included. Selection uses a stable SHA-256
ordering and round-robin age/weekday-or-weekend/household-children groups. This is
an editorial, unweighted collection, not a representative population sample.
`--limit 0` includes every validated diary. The output stores source file SHA-256
hashes, selection rules, counts, and validation results. Card IDs for real data
are the anonymous public `TUCASEID` values, not invented identities.

The complete import has been run against all three verified 2025 archives and
the original PDF lexicon. It validates all 6,146 diaries, including 5,353 final
activities truncated by the published 04:00 endpoint rule. Unexpected source
conventions cause a failure rather than a silent repair.

## Joins and time normalization

- Activities join respondents on the string identifier `TUCASEID`. Their order
  comes from `TUACTIVITY_N`, which must be unique and contiguous for each diary.
- Respondent age comes from the Roster record matching both `TUCASEID` and
  `TULINENO`, checked against `TERRP` self codes 18/19. Age is grouped into 15–24,
  25–34, 35–44, 45–54, 55–64, and 65+. The source `TEAGE` value is retained in
  `ageValue` for diary facts. Values 80 and 85 are shown as 80–84 and
  85+, following the published topcoding rules; they remain in the 65+ band.
  Missing ages are null. Age-based names distinguish people in story stops and
  recaps; equal ages use positional references, without invented identities.
- Employment comes from `TELFS`: 1/2 employed, 3/4 unemployed, 5 not in the labor
  force. Missing data is not interpreted as unemployment or retirement.
- Children uses `TRCHILDNUM`, the number of household members under 18, with a
  consistency check against known roster ages. Nonhousehold children (`TERRP=40`)
  are excluded. This does not imply parenthood. Missing values remain unknown.
- `TUDIARYDAY` 1/7 means Sunday/Saturday; 2–6 means Monday–Friday. There is no
  holiday adjustment. It describes the start date of the 04:00-to-04:00 diary,
  including the following morning's activities.
- `TUACTDUR24` is the published primary-activity duration with the final activity
  truncated at 04:00. Never sum secondary childcare/eldercare or Who-file rows.
- Activities are stored as `[startOffset, duration, code]`, where `startOffset`
  counts minutes since 04:00. Check start times, untruncated `TUACTDUR` against
  stop times, `TUCUMDUR24` against cumulative normalized durations, and final
  truncation against the 1,440-minute endpoint. Treat `24:00:00` as `00:00:00`.
- Intervals are half-open: `[start, end)`. The activity beginning at a boundary
  wins. Every minute must belong to exactly one interval; no gap filling,
  scaling, interpolation, overlap removal, or unexplained rounding is allowed.
- The detail list places `(startOffset + 240) mod 1440` at the corresponding
  clock time, retains chronological 04:00-to-04:00 order, and marks the next
  day. The 04:00 seam is between the last and first observations, not a claim
  about what happened on an additional day. Shared clock time is respondent-local
  time, not a common time zone or actual shared date.

## Category mapping

These are explicit presentation groups, not the BLS published statistical groups.
All six-digit codes must appear in the supplied coding lexicon; unknown tiers
and missing labels fail validation. Original detailed descriptions remain in
the data dictionary.

| Same24 label             | ATUS codes                                                          |
| ------------------------ | ------------------------------------------------------------------- |
| Sleep                    | `010101`, `010199`; excludes sleeplessness `010102`                 |
| Work and study           | Tier 1 `05`, `06`, including work-related activity and job search   |
| Housework and caregiving | Tier 1 `02`, `03`, `04`                                             |
| Travel                   | Tier 1 `18`, regardless of travel purpose                           |
| Eating and personal care | Remaining tier 1 `01`, plus `11`                                    |
| Leisure and socializing  | Tier 1 `12`, `13`, `16` (all telephone calls)                       |
| Other                    | Tier 1 `07`–`10`, `14`, `15`, `17`, `50`, including unreported time |

## Interaction and accessibility

The clock reads the device's current local `Date`, including seconds and
fractional hand angles. Updates align to system seconds. Activity labels,
countdowns, and scenes update on minute boundaries. The diary changes at 04:00,
matching the survey convention; before then, weekday/weekend selection refers
to the preceding date. Returning to a hidden tab catches up to current time.

Playback keeps the chosen diary fixed for a full 24-hour loop in 60 seconds.
Completion automatically restores live time. Pause/resume preserves the displayed
time; “Back to now” restores live time immediately. Choosing another life also
returns to now. Hiding the tab pauses accelerated playback.

Countdowns skip adjacent repetitions of the same activity code. Live countdowns
can continue into the next diary at 04:00. These describe recorded or example
days, rather than predictions about respondents.

All controls are native keyboard-accessible buttons. The clock has an accessible
time label, decorative visuals are hidden from assistive technology, and ordinary
time changes do not trigger repeated announcements. “Another life” announces the
new age and activity. Reduced-motion preferences stop scene animation and hide
the second hand; explicit day playback is still available. SVG characters appear
only when the illustration module fails, without flashing during normal loading. The clock continues
when either or both diary collections fail to load.

`same24.js` owns the single scene, clock, and playback. `narrative.js` supplies
stable daily selection and reported age formatting. `base.css` supplies shared
styles and `same24.css` styles this doodle. The earlier diary and recap modules
are retained as source material but are not imported by the page.

## Clock image

`assets/clock-body.png` is an AI-generated transparent photographic-style asset,
created with the **built-in image generation tool**, copied into the project.
The final image is 1254 × 1254 pixels. The browser overlays exact tick marks,
numerals, and dynamic hands at the photographed spindle; no time is baked in.
The generation prompt is saved in [`_tools/clock-image-prompt.txt`](_tools/clock-image-prompt.txt).
This development prompt file is excluded from the published site.

## Verification

The model tests use Node 22.7 or newer for ES module syntax detection.

```sh
python3 -m unittest discover -s same24/_tools -p 'test_*.py' -v
node --test same24/_tools/model.test.mjs same24/_tools/narrative.test.mjs same24/_tools/scenes.test.mjs
```

Tests cover all seven groups, unknown codes, joins, duplicate keys, household
membership, wrapped lexicon labels, end truncation, midnight, 24:00, all-day
activities, gaps, overlaps, wrong totals, all included interval boundaries, and
every minute of every included diary, live hand positions, the local 04:00
weekday seam, all age groups, and isolation of child provenance. Narrative
checks cover stable daily selections, genuine activity matches, contrasting
pairs, independently calculated recap fixtures, real story boundaries, the
60-second playback budget, and malformed share tokens. Data validation runs
before activity examples render; the live clock is independent of it.

Optional browser checks require an installed Playwright and Google Chrome (no
browser dependencies are added to this site). Start the preview server, then:

```sh
node same24/_tools/browser.test.mjs
node same24/_tools/scene-atlas.mjs
```

Set `PLAYWRIGHT_MODULE` to an absolute Playwright module path if it is not on
Node's module search path. `SAME24_URL` overrides the preview URL;
`SAME24_SCREENSHOTS` overrides `/tmp/same24-qa`. Both model and browser checks
run against the included real collection; the independently stored children
remain illustrative.

Browser coverage checks the single animated scene, all ten reachable age groups,
source activity bindings, live transitions, fixed playback diaries, pause/resume,
automatic return to now, midnight and 04:00 rollover, the loading fallback, data
failures, and layouts from 320 to 1100 pixels. It also checks for external runtime
requests and uncaught errors. This replaces the earlier gallery/popup browser
checks. The legacy scene tests cover the retained 3D source. The SVG atlas
renders 56 scene and age combinations for visual inspection, checks animation
availability and valid geometry, and reports browser errors. Browser tests also
check reduced motion, pause, and the absence of 3D library requests.
Safari/Firefox and a full screen-reader audit have not been performed.

To regenerate development fixtures separately from the real site collection:

```sh
python3 same24/_tools/make_demo.py --output /tmp/same24-synthetic-test.json
python3 same24/_tools/make_child_examples.py --output same24/data/illustrative-children.json
```
