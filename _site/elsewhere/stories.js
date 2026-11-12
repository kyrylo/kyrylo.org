const shortLabels = {
  "010101": "Sleeping",
  "010102": "Lying awake",
  "010201": "Getting ready",
  "020101": "Cleaning",
  "020201": "Cooking",
  "020102": "Doing laundry",
  "020103": "Sewing",
  "020203": "Doing the dishes",
  "020501": "Gardening",
  "020601": "Caring for a pet",
  "020602": "Walking or playing with a pet",
  "020699": "Caring for a pet",
  120305: "Listening to the radio",
  120306: "Enjoying music",
  120307: "Playing games",
  120309: "Arts and crafts",
  130103: "Playing basketball",
  130104: "Cycling",
  130109: "Dancing",
  130112: "Fishing",
  130124: "Running",
  130132: "Enjoying water sports",
  130133: "Lifting weights",
  130136: "Doing yoga",
  "030101": "Caring for children",
  "030203": "Homeschooling",
  "050101": "Working",
  "060301": "Studying",
  "070101": "Grocery shopping",
  110101: "Eating and drinking",
  120101: "Socializing",
  120303: "Watching TV",
  120312: "Reading",
  130131: "Walking",
  180501: "Travelling for work",
  180701: "Travelling to shop",
  500101: "Unreported time",
};

export function activityLabel(collection, code) {
  if (collection.kind === "illustrative") return collection.codes[code].label;
  if (shortLabels[code]) return shortLabels[code];
  const tier = code.slice(0, 2);
  const labels = {
    "01": "Taking care of themselves",
    "02": "Looking after the home",
    "03": "Caring for someone",
    "04": "Helping someone",
    "05": "Working",
    "06": "Learning",
    "07": "Running errands",
    "08": "Getting things done",
    "09": "Getting things done",
    10: "Getting things done",
    11: "Eating and drinking",
    12: "Taking a little time out",
    13: "Enjoying some sport",
    14: "Religious activities",
    15: "Volunteering",
    16: "Talking on the phone",
    17: "Getting things done",
    18: "On the move",
    50: "Unreported time",
  };
  return (
    labels[tier] ||
    collection.codes[code].label.replace(/\bhh\b/gi, "household")
  );
}

export function nextDescription(collection, currentCode, next) {
  if (!next) return "No further change in this day";
  const wait =
    next.minutes < 60
      ? `${next.minutes} min`
      : `${Math.floor(next.minutes / 60)}h${
          next.minutes % 60 ? ` ${next.minutes % 60}m` : ""
        }`;
  const activity = collection.codes[next.code];
  if (
    collection.codes[currentCode].category === "sleep" &&
    activity.category !== "sleep"
  )
    return `Wakes up in ${wait}`;
  if (activity.category === "sleep") return `Sleeps in ${wait}`;
  const actions = {
    "050101": "Starts work",
    school: "School",
    eat: "Eats",
    110101: "Eats",
    wash: "Gets ready",
    "010201": "Gets ready",
    "020201": "Cooks",
    story: "Story time",
    play: "Playtime",
    outside: "Goes outside",
    milk: "Feeds",
    "020101": "Cleans",
    "060301": "Studies",
    "070101": "Shops for groceries",
    120101: "Socializes",
    120303: "Watches TV",
    120312: "Reads",
  };
  if (activity.category === "travel") return `Travels in ${wait}`;
  return actions[next.code]
    ? `${actions[next.code]} in ${wait}`
    : `Next: ${activityLabel(collection, next.code)} · in ${wait}`;
}

const counts = [
  "No",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
];
export function sharedMoment(snapshots) {
  if (snapshots.length < 2) return "Every day has its own rhythm.";
  const groups = new Map();
  for (const entry of snapshots) {
    const category = entry.activity.category;
    groups.set(category, (groups.get(category) || 0) + 1);
  }
  const phrases = {
    sleep: "sleeping",
    work: "working or studying",
    travel: "on the move",
    leisure: "taking a little time for themselves",
  };
  const together = [...groups]
    .filter(([key, count]) => phrases[key] && count >= 4)
    .sort((a, b) => b[1] - a[1])[0];
  if (together)
    return `${counts[together[1]]} of these ${counts[
      snapshots.length
    ].toLowerCase()} people are ${phrases[together[0]]}.`;
  const pair = snapshots
    .flatMap((a, i) => snapshots.slice(i + 1).map((b) => [a, b]))
    .find(
      ([a, b]) =>
        a.activity.category === "sleep" &&
        ["work", "travel"].includes(b.activity.category)
    );
  if (pair) {
    const subject = ({ group }) =>
      group.child
        ? {
            "Under 1": "The baby",
            "1–3": "The toddler",
            "4–7": "The young child",
            "8–14": "The older child",
          }[group.age]
        : `The person aged ${group.age}`;
    return `${subject(pair[0])} is sleeping. ${subject(pair[1])} is ${
      phrases[pair[1].activity.category]
    }.`;
  }
  const occupied = groups.size;
  return `One moment, ${counts[
    occupied
  ].toLowerCase()} different ways to spend it.`;
}
