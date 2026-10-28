import { recapFacts } from "./narrative.js";
import { activityIcon } from "./icons.js";
const $ = (id) => document.getElementById(id);
export function showRecap(entries) {
  $(
    "recap-note"
  ).textContent = `${entries.length} lives. A few things you might have missed.`;
  $("recap-stories").replaceChildren(
    ...recapFacts(entries).map((fact) => {
      const article = document.createElement("article");
      article.className = "recap-story";
      const copy = document.createElement("div"),
        h = document.createElement("h3"),
        p = document.createElement("p");
      h.textContent = fact.title;
      p.textContent = fact.text;
      copy.append(h, p);
      article.append(activityIcon(fact.icon), copy);
      return article;
    })
  );
  $("recap-dialog").showModal();
  $("recap-dialog").scrollTop = 0;
}
export function closeRecap() {
  if ($("recap-dialog").open) $("recap-dialog").close();
}
export function initializeRecap({ replay, now }) {
  $("close-recap").addEventListener("click", closeRecap);
  $("recap-dialog").addEventListener("close", () => $("watch-day").focus());
  $("recap-replay").addEventListener("click", () => {
    closeRecap();
    replay();
  });
  $("recap-now").addEventListener("click", () => {
    closeRecap();
    now();
  });
}
