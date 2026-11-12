// Small, decorative activity drawings. The adjacent text supplies the label.
const drawings = {
  moon:
    "M20.5 13.2A8.6 8.6 0 0 1 10.8 3.5 8.6 8.6 0 1 0 20.5 13.2Z M17 3v4 M15 5h4",
  briefcase: "M8 7V4h8v3 M3 7h18v13H3Z M3 12c5 3 13 3 18 0 M10 12v3h4v-3",
  book: "M12 6C9 4 6 4 3 5v15c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Z M12 6v15",
  home: "M3 11 12 3l9 8 M5 10v11h14V10 M10 21v-7h4v7",
  heart: "M12 20 3.8 12A5 5 0 0 1 12 5a5 5 0 0 1 8.2 7Z",
  car: "m4 10 2-6h12l2 6 M3 10h18v9H3Z M6 19v2 M18 19v2 M6 14h2 M16 14h2",
  meal:
    "M5 3v6 M2 3v4a3 3 0 0 0 6 0V3 M5 10v11 M17 3c-5 0-5 10 0 10V3Z M17 13v8",
  game:
    "M7 8h10c3 0 5 11 2 12-2 1-4-3-7-3s-5 4-7 3C2 19 4 8 7 8Z M7 11v5 M4.5 13.5h5 M16 12h.1 M18 15h.1",
  chat: "M20 16a9 9 0 1 0-15 2l-2 4 6-2a9 9 0 0 0 11-4Z M7 10h10 M7 14h6",
  television: "M3 7h18v13H3Z M8 3l4 4 4-4 M8 23h8",
  bottle:
    "m10 3 3-1 3 5-5 3Z M10 9l6-3 5 10c1 2-6 6-7 4L9 10Z M12 13l3-1 M14 16l3-1",
  blocks: "M3 12h9v9H3Z M12 12h9v9h-9 M8 3h9v9H8Z M6 16h3 M16 16h2 M11 7h3",
  sun:
    "M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z M12 1v3 M12 20v3 M1 12h3 M20 12h3 M4 4l2 2 M18 18l2 2 M4 20l2-2 M18 6l2-2",
  water: "M12 2C9 7 5 10 5 15a7 7 0 0 0 14 0c0-5-4-8-7-13Z M9 15a3 3 0 0 0 3 3",
  bag: "M4 8h16l1 13H3Z M8 9V6a4 4 0 0 1 8 0v3",
  pot:
    "M5 10h14v7a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4Z M2 12h3 M19 12h3 M4 7h16 M9 4h6 M9 1v1 M15 1v1",
  phone: "M5 3 2 6c1 8 8 15 16 16l3-3-5-5-3 3c-3-1-5-3-6-6l3-3Z",
  clock: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z M12 6v6l4 2",
};
const categoryDrawings = {
  sleep: "moon",
  work: "briefcase",
  care: "home",
  travel: "car",
  personal: "meal",
  leisure: "sun",
  other: "clock",
};
const specificDrawings = {
  milk: "bottle",
  eat: "meal",
  wash: "water",
  bath: "water",
  play: "blocks",
  outside: "sun",
  story: "book",
  family: "heart",
  school: "book",
  homework: "book",
  "010201": "water",
  "020201": "pot",
  "030101": "heart",
  "030203": "book",
  "070101": "bag",
  120101: "chat",
  120303: "television",
  120312: "book",
  120307: "game",
};

export function activityIcon(category, code = "") {
  let drawing = specificDrawings[code] || categoryDrawings[category] || "clock";
  if (code.startsWith("06")) drawing = "book";
  if (code.startsWith("16")) drawing = "phone";
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  for (const [key, value] of Object.entries({
    viewBox: "0 0 24 24",
    class: "activity-icon",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "1.65",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    "aria-hidden": "true",
    focusable: "false",
  }))
    icon.setAttribute(key, value);
  icon.style.setProperty("--color", `var(--${category})`);
  const path = document.createElementNS(icon.namespaceURI, "path");
  path.setAttribute("d", drawings[drawing]);
  icon.append(path);
  return icon;
}
