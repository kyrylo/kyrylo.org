// Every source activity is represented by a related miniature, never by an invented diary entry.
export const SCENE_KINDS = [
  "sleep",
  "feed",
  "eat",
  "wash",
  "bath",
  "play",
  "family",
  "school",
  "read",
  "work",
  "computer",
  "cook",
  "dishes",
  "clean",
  "laundry",
  "garden",
  "pet",
  "walk",
  "travel",
  "shop",
  "watch",
  "game",
  "music",
  "listen",
  "dance",
  "fish",
  "sew",
  "service",
  "art",
  "care",
  "help",
  "phone",
  "repair",
  "exercise",
  "run",
  "cycle",
  "ball",
  "yoga",
  "swim",
  "faith",
  "volunteer",
  "appointment",
  "wait",
  "private",
  "unknown",
  "relax",
];
export function sceneKind(code, activity, group = {}) {
  const child = {
    sleep: "sleep",
    milk: "feed",
    eat: "eat",
    wash: "wash",
    bath: "bath",
    play: "play",
    outside: "play",
    story: "read",
    family: "family",
    school: "school",
    homework: "school",
    travel: "travel",
    home: "travel",
    help: "clean",
  };
  if (child[code]) return child[code];
  const label = activity.label.toLowerCase();
  if (code.startsWith("50")) return "unknown";
  if (/waiting|security procedures/.test(label)) return "wait";
  if (code.startsWith("18")) return "travel";
  if (code === "010101" || code === "010199") return "sleep";
  if (code === "010102") return "relax";
  if (code === "010401" || /tobacco|drug use/.test(label)) return "private";
  if (/telephone|talking with|listening to.*children/.test(label))
    return code.startsWith("16") ? "phone" : "family";
  if (/dancing/.test(label)) return "dance";
  if (/fishing/.test(label)) return "fish";
  if (/vehicle touring/.test(label)) return "travel";
  if (/listening to|attending performing/.test(label)) return "listen";
  if (/sewing/.test(label)) return "sew";
  if (/picking up|dropping off/.test(label)) return "travel";
  if (
    /walking.*animals|care for animals|pet.*care|animal.*care|animals/.test(
      label
    )
  )
    return "pet";
  if (
    /medical care|health-related|health and care|medical services|veterinary|personal care services/.test(
      label
    )
  )
    return "appointment";
  if (/reading to|reading for/.test(label)) return "read";
  if (/homework|home schooling|class|teaching|education/.test(label))
    return "school";
  if (/arts and crafts|writing for/.test(label)) return "art";
  if (/playing with.*children/.test(label)) return "play";
  if (/sports with.*children/.test(label)) return "ball";
  if (/physical care.*children|looking after.*children/.test(label))
    return "care";
  if (/laundry|textiles/.test(label)) return "laundry";
  if (/food.*prep|food presentation/.test(label)) return "cook";
  if (/kitchen.*clean/.test(label)) return "dishes";
  if (/lawn|garden|houseplant/.test(label)) return "garden";
  if (/repair|maintenance|heating|cooling|set-up/.test(label)) return "repair";
  if (/cleaning|housework|storing/.test(label)) return "clean";
  if (
    /e-mail|mail|messages|financial management|organization|organizing|paperwork|planning|computer use|job search/.test(
      label
    )
  )
    return "computer";
  if (code.startsWith("05")) return "work";
  if (code.startsWith("06")) return "school";
  if (code.startsWith("07")) return "shop";
  if (code.startsWith("08") || code.startsWith("09") || code.startsWith("10"))
    return "service";
  if (code.startsWith("11")) return "eat";
  if (/television|movies|watching|attending.*sport/.test(label)) return "watch";
  if (/playing games|gambling|billiards/.test(label)) return "game";
  if (/music|radio|performing|performance|dancing/.test(label)) return "music";
  if (
    /socializing|parties|meetings|events|ceremonies|communicating/.test(label)
  )
    return "family";
  if (/biking/.test(label)) return "cycle";
  if (/running/.test(label)) return "run";
  if (/walking/.test(label)) return "walk";
  if (/yoga/.test(label)) return "yoga";
  if (/water sports/.test(label)) return "swim";
  if (/basketball|football|soccer|racquet|golf|bowling/.test(label))
    return "ball";
  if (code.startsWith("13")) return "exercise";
  if (code.startsWith("14")) return "faith";
  if (code.startsWith("15")) return "volunteer";
  if (code.startsWith("03") || code.startsWith("04")) return "help";
  if (code.startsWith("01")) return "wash";
  if (code.startsWith("02")) return "clean";
  if (code.startsWith("12")) return "relax";
  if (code.startsWith("16")) return "phone";
  return activity.category === "other" ? "unknown" : "relax";
}
export function ageScale(group) {
  return (
    {
      "Under 1": 0.48,
      "1–3": 0.58,
      "4–7": 0.72,
      "8–14": 0.86,
      "15–24": 0.98,
      "65+": 0.96,
    }[group.age] || 1
  );
}
