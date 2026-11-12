import { updateMiniature } from "./scene-api.js";
import { activityCharacter } from "./characters.js";
import { activityIcon } from "./icons.js";
import {
  DAY,
  AGE_GROUPS,
  CATEGORIES,
  formatTime,
  durationLabel,
  activityAt,
  totals,
} from "./model.js";
const $ = (id) => document.getElementById(id);
const dialog = $("diary-dialog");
const state = { detail: null };
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function diaryName(diary) {
  const names = {
    "Under 1": "A baby’s day",
    "1–3": "A toddler’s day",
    "4–7": "A young child’s day",
    "8–14": "An older child’s day",
  };
  return (
    names[diary.age] ||
    (diary.age === "unknown" ? "One person’s day" : `A day at ${diary.age}`)
  );
}
function childrenLabel(diary) {
  return diary.children === null
    ? "Household children not reported"
    : diary.children
    ? "Children under 18 in household"
    : "No children under 18 in household";
}
function openDiary(
  diary,
  opener,
  collection,
  minute,
  live = false,
  timeLabel = "At the selected time"
) {
  state.detail = { diary, collection, opener, live, timeLabel };
  renderDiary(diary, collection);
  updateDiaryTime(minute);
  dialog.showModal();
  dialog.scrollTop = 0;
}
function renderDiary(diary, collection) {
  $("diary-title").textContent = `${diaryName(diary)} · ${
    diary.day === 1 || diary.day === 7 ? "Weekend" : "Weekday"
  }`;
  $("diary-meta").textContent =
    collection.kind === "illustrative"
      ? `Age ${diary.age === "Under 1" ? "under 1" : diary.age}`
      : `Age ${diary.age === "unknown" ? "not reported" : diary.age} · ${
          diary.employment
        } · ${childrenLabel(diary)}`;
  $("diary-note").textContent =
    collection.kind !== "atus"
      ? "An example day created for Same24."
      : `Source: US American Time Use Survey, ${collection.year}.`;
  const sums = totals(diary, collection.codes);
  $("daily-totals").replaceChildren(
    ...CATEGORIES.map((category) => {
      const row = element("div", "total-row");
      row.append(
        activityIcon(category.id),
        element("span", "", category.label),
        element("strong", "", durationLabel(sums[category.id]))
      );
      return row;
    })
  );
  $("activity-list").replaceChildren(
    ...diary.activities.map(([start, duration, code]) => {
      const activity = collection.codes[code];
      const row = element("li");
      const timing = element("div");
      const startTime = start + 240;
      const endTime = startTime + duration;
      timing.append(
        element("span", "", `${formatTime(startTime)}–${formatTime(endTime)}`)
      );
      if (startTime >= DAY) timing.append(element("small", "", "Next day"));
      else if (endTime >= DAY)
        timing.append(element("small", "", "Ends next day"));
      const label = element("div", "activity-label");
      const text = element("div", "activity-text");
      text.append(
        document.createTextNode(activity.label),
        element(
          "small",
          "",
          CATEGORIES.find((c) => c.id === activity.category).label
        )
      );
      label.append(activityIcon(activity.category, code), text);
      row.append(
        timing,
        label,
        element("span", "activity-duration", durationLabel(duration))
      );
      return row;
    })
  );
}
function updateDiaryTime(minute) {
  const { diary, collection } = state.detail;
  const code = diary.activities[activityAt(diary, minute)][2];
  const group = AGE_GROUPS.find((item) => item.age === diary.age);
  const miniature = $("diary-miniature");
  if (miniature.dataset.fallbackCode !== code) {
    miniature.querySelector(".life-character")?.remove();
    miniature.prepend(
      activityCharacter(group, collection.codes[code].category, code, diary.id)
    );
    miniature.dataset.fallbackCode = code;
  }
  miniature.setAttribute(
    "aria-label",
    `Miniature of ${collection.codes[code].label}. Use left and right arrow keys to look around.`
  );
  $("scene-caption-activity").textContent = `${
    collection.codes[code].label
  } · ${formatTime(minute)}`;
  updateMiniature(miniature, {
    group,
    identity: diary.id,
    code,
    activity: collection.codes[code],
    minute,
  });
  const list = $("activity-list");
  const active = list.children[activityAt(state.detail.diary, minute)];
  const previous = list.querySelector(".is-current");
  if (previous && previous !== active) {
    previous.classList.remove("is-current");
    previous.removeAttribute("aria-current");
    previous.querySelector(".activity-time-note")?.remove();
  }
  active.classList.add("is-current");
  active.setAttribute("aria-current", "true");
  let note = active.querySelector(".activity-time-note");
  if (!note) {
    note = element("small", "activity-time-note");
    active.querySelector(".activity-text").append(note);
  }
  note.textContent = `${state.detail.timeLabel}, ${formatTime(minute)}`;
}
export function updateLiveDiary(
  diary,
  collection,
  minute,
  opener,
  isLive = true
) {
  const detail = state.detail;
  if (!dialog.open || !detail?.live || detail.opener !== opener) return;
  detail.timeLabel = isLive ? "Now" : "At this time";
  const scrollTop = dialog.scrollTop;
  if (detail.diary !== diary || detail.collection !== collection) {
    detail.diary = diary;
    detail.collection = collection;
    renderDiary(diary, collection);
  }
  updateDiaryTime(minute);
  dialog.scrollTop = scrollTop;
}
$("close-diary").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) {
    const bounds = dialog.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    )
      dialog.close();
  }
});
dialog.addEventListener("close", () => {
  state.detail?.opener.focus();
  state.detail = null;
});
export function showDiary(diary, collection, minute, opener, isLive = true) {
  openDiary(
    diary,
    opener,
    collection,
    minute,
    true,
    isLive ? "Now" : "At this time"
  );
}
