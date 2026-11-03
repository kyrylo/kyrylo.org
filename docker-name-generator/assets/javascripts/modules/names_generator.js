import { track } from "./telesink.js?v=28bb21a";

const MAX_NAME_COUNT = 10;
const DEFAULT_NAME_COUNT = 1;

const left = [
  "admiring",
  "adoring",
  "affectionate",
  "agitated",
  "amazing",
  "angry",
  "awesome",
  "beautiful",
  "blissful",
  "bold",
  "boring",
  "brave",
  "busy",
  "charming",
  "clever",
  "compassionate",
  "competent",
  "condescending",
  "confident",
  "cool",
  "cranky",
  "crazy",
  "dazzling",
  "determined",
  "distracted",
  "dreamy",
  "eager",
  "ecstatic",
  "elastic",
  "elated",
  "elegant",
  "eloquent",
  "epic",
  "exciting",
  "fervent",
  "festive",
  "flamboyant",
  "focused",
  "friendly",
  "frosty",
  "funny",
  "gallant",
  "gifted",
  "goofy",
  "gracious",
  "great",
  "happy",
  "hardcore",
  "heuristic",
  "hopeful",
  "hungry",
  "infallible",
  "inspiring",
  "intelligent",
  "interesting",
  "jolly",
  "jovial",
  "keen",
  "kind",
  "laughing",
  "loving",
  "lucid",
  "magical",
  "modest",
  "musing",
  "mystifying",
  "naughty",
  "nervous",
  "nice",
  "nifty",
  "nostalgic",
  "objective",
  "optimistic",
  "peaceful",
  "pedantic",
  "pensive",
  "practical",
  "priceless",
  "quirky",
  "quizzical",
  "recursing",
  "relaxed",
  "reverent",
  "romantic",
  "sad",
  "serene",
  "sharp",
  "silly",
  "sleepy",
  "stoic",
  "strange",
  "stupefied",
  "suspicious",
  "sweet",
  "tender",
  "thirsty",
  "trusting",
  "unruffled",
  "upbeat",
  "vibrant",
  "vigilant",
  "vigorous",
  "wizardly",
  "wonderful",
  "xenodochial",
  "youthful",
  "zealous",
  "zen",
];
const right = [
  "agnesi",
  "albattani",
  "allen",
  "almeida",
  "antonelli",
  "archimedes",
  "ardinghelli",
  "aryabhata",
  "austin",
  "babbage",
  "banach",
  "banzai",
  "bardeen",
  "bartik",
  "bassi",
  "beaver",
  "bell",
  "benz",
  "bhabha",
  "bhaskara",
  "black",
  "blackburn",
  "blackwell",
  "bohr",
  "booth",
  "borg",
  "bose",
  "bouman",
  "boyd",
  "brahmagupta",
  "brattain",
  "brown",
  "buck",
  "burnell",
  "cannon",
  "carson",
  "cartwright",
  "carver",
  "cerf",
  "chandrasekhar",
  "chaplygin",
  "chatelet",
  "chatterjee",
  "chaum",
  "chebyshev",
  "clarke",
  "cohen",
  "colden",
  "cori",
  "cray",
  "curie",
  "curran",
  "darwin",
  "davinci",
  "dewdney",
  "dhawan",
  "diffie",
  "dijkstra",
  "dirac",
  "driscoll",
  "dubinsky",
  "easley",
  "edison",
  "einstein",
  "elbakyan",
  "elgamal",
  "elion",
  "ellis",
  "engelbart",
  "euclid",
  "euler",
  "faraday",
  "feistel",
  "fermat",
  "fermi",
  "feynman",
  "franklin",
  "gagarin",
  "galileo",
  "galois",
  "ganguly",
  "gates",
  "gauss",
  "germain",
  "goldberg",
  "goldstine",
  "goldwasser",
  "golick",
  "goodall",
  "gould",
  "greider",
  "grothendieck",
  "haibt",
  "hamilton",
  "haslett",
  "hawking",
  "heisenberg",
  "hellman",
  "hermann",
  "herschel",
  "hertz",
  "heyrovsky",
  "hodgkin",
  "hofstadter",
  "hoover",
  "hopper",
  "hugle",
  "hypatia",
  "ishizaka",
  "jackson",
  "jang",
  "jemison",
  "jennings",
  "jepsen",
  "johnson",
  "joliot",
  "jones",
  "kalam",
  "kapitsa",
  "kare",
  "keldysh",
  "keller",
  "kepler",
  "khayyam",
  "khorana",
  "kilby",
  "kirch",
  "knuth",
  "kowalevski",
  "lalande",
  "lamarr",
  "lamport",
  "leakey",
  "leavitt",
  "lederberg",
  "lehmann",
  "lewin",
  "lichterman",
  "liskov",
  "lovelace",
  "lumiere",
  "mahavira",
  "margulis",
  "matsumoto",
  "maxwell",
  "mayer",
  "mccarthy",
  "mcclintock",
  "mclaren",
  "mclean",
  "mcnulty",
  "meitner",
  "mendel",
  "mendeleev",
  "meninsky",
  "merkle",
  "mestorf",
  "mirzakhani",
  "montalcini",
  "moore",
  "morse",
  "moser",
  "murdock",
  "napier",
  "nash",
  "neumann",
  "newton",
  "nightingale",
  "nobel",
  "noether",
  "northcutt",
  "noyce",
  "panini",
  "pare",
  "pascal",
  "pasteur",
  "payne",
  "perlman",
  "pike",
  "poincare",
  "poitras",
  "proskuriakova",
  "ptolemy",
  "raman",
  "ramanujan",
  "rhodes",
  "ride",
  "ritchie",
  "robinson",
  "roentgen",
  "rosalind",
  "rubin",
  "saha",
  "sammet",
  "sanderson",
  "satoshi",
  "shamir",
  "shannon",
  "shaw",
  "shirley",
  "shockley",
  "shtern",
  "sinoussi",
  "snyder",
  "solomon",
  "spence",
  "stonebraker",
  "sutherland",
  "swanson",
  "swartz",
  "swirles",
  "taussig",
  "tesla",
  "tharp",
  "thompson",
  "torvalds",
  "tu",
  "turing",
  "varahamihira",
  "vaughan",
  "villani",
  "visvesvaraya",
  "volhard",
  "wescoff",
  "wilbur",
  "wiles",
  "williams",
  "williamson",
  "wilson",
  "wing",
  "wozniak",
  "wright",
  "wu",
  "yalow",
  "yonath",
  "zhukovsky",
];

const randomId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
      });

const pageLoadId = randomId();
const feedbackTimeouts = new WeakMap();
let currentBatch = null;

function selectedCount() {
  const requested = parseInt(count.value, 10);
  const safeRequested = Number.isFinite(requested) ? requested : DEFAULT_NAME_COUNT;
  const value = Math.min(Math.max(safeRequested, DEFAULT_NAME_COUNT), MAX_NAME_COUNT);

  return {
    requested: safeRequested,
    value,
    wasClamped: value !== safeRequested,
  };
}

function separatorLabel(value) {
  return value === "_" ? "underscore" : "dash";
}

function separatorPlural(value) {
  return value === "_" ? "underscores" : "dashes";
}

function nameFormat(value) {
  return value === "_" ? "adjective_surname" : "adjective-surname";
}

function vocabularyProperties(separatorValue) {
  return {
    adjective_count: left.length,
    surname_count: right.length,
    total_combinations: left.length * right.length,
    usable_combinations: left.length * right.length - 1,
    excluded_name: `boring${separatorValue}wozniak`,
  };
}

function splitName(name, separatorValue) {
  const separatorIndex = name.indexOf(separatorValue);

  return {
    adjective: name.slice(0, separatorIndex),
    surname: name.slice(separatorIndex + separatorValue.length),
  };
}

function pluralize(count, singular, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}

function batchProperties(batch) {
  return {
    page_load_id: pageLoadId,
    batch_id: batch.id,
    batch_generated_at: batch.generated_at,
    count_requested: batch.count_requested,
    count_generated: batch.count_generated,
    count_was_clamped: batch.count_was_clamped,
    names: batch.names,
    separator: batch.separator,
    separator_label: batch.separator_label,
    name_format: batch.name_format,
    is_dns_friendly: batch.separator === "-",
    ...vocabularyProperties(batch.separator),
  };
}

function dockerCommands(names) {
  return names.map((name) => `docker run --name ${name} nginx`);
}

function showCopiedState(button, afterReset) {
  if (feedbackTimeouts.has(button)) {
    clearTimeout(feedbackTimeouts.get(button));
  }

  const copyIcon = button.querySelector(".copy-icon");
  const tickIcon = button.querySelector(".tick-icon");
  if (!copyIcon || !tickIcon) return;

  copyIcon.style.display = "none";
  tickIcon.style.display = "inline";

  const timeoutId = setTimeout(() => {
    copyIcon.style.display = "inline";
    tickIcon.style.display = "none";
    feedbackTimeouts.delete(button);
    if (afterReset) afterReset();
  }, 1000);

  feedbackTimeouts.set(button, timeoutId);
}

function generateNames() {
  const countInfo = selectedCount();
  const separatorValue = separator.value;
  nameTableBody.innerHTML = "";

  const generated = [];
  const generatedSet = new Set();

  while (generated.length < countInfo.value) {
    let name;
    do {
      const adjective = left[Math.floor(Math.random() * left.length)];
      const surname = right[Math.floor(Math.random() * right.length)];
      name = `${adjective}${separatorValue}${surname}`;
    } while (
      name === `boring${separatorValue}wozniak` ||
      generatedSet.has(name)
    );

    generatedSet.add(name);
    generated.push(name);
  }

  currentBatch = {
    id: randomId(),
    generated_at: new Date().toISOString(),
    names: generated,
    count_requested: countInfo.requested,
    count_generated: generated.length,
    count_was_clamped: countInfo.wasClamped,
    separator: separatorValue,
    separator_label: separatorLabel(separatorValue),
    name_format: nameFormat(separatorValue),
  };

  generated.forEach((name, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="index">${index + 1}.</td>
      <td class="name">${name}</td>
      <td class="action table-cell--text-right">
        <button class="copy-button" aria-label="Copy ${name}" title="Copy to clipboard">
          <svg class="copy-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="24" height="24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
          </svg>
          <svg class="tick-icon" style="display: none;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="24" height="24">
            <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </button>
      </td>
    `;
    nameTableBody.appendChild(row);
  });

  document.querySelectorAll(".copy-button").forEach((button) => {
    let isProcessing = false;

    button.addEventListener("click", async () => {
      if (isProcessing) return;

      isProcessing = true;
      const row = button.closest("tr");
      const name = row.querySelector(".name").textContent;
      const rowIndex = Array.from(row.parentNode.children).indexOf(row) + 1;
      const nameParts = splitName(name, currentBatch.separator);
      await navigator.clipboard.writeText(name);

      track({
        event: "Name copied",
        text: name,
        emoji: "📎",
        properties: {
          action: "copy",
          ...batchProperties(currentBatch),
          row_index: rowIndex,
          name,
          name_length: name.length,
          adjective: nameParts.adjective,
          surname: nameParts.surname,
        },
      });


      showCopiedState(button, () => {
        isProcessing = false;
      });
    });
  });

  return currentBatch;
}

function ready() {
  submitButton.addEventListener("click", (e) => {
    e.preventDefault();

    const batch = generateNames();
    const nameLabel = pluralize(batch.count_generated, "name");

    track({
      event: "Names generated",
      text: `Generated ${batch.count_generated} Docker ${nameLabel} with ${separatorPlural(batch.separator)}`,
      emoji: "🔄",
      properties: {
        action: "generate",
        ...batchProperties(batch),
      },
    });

  });

  copyAllButton.addEventListener("click", async (e) => {
    e.preventDefault();
    if (!currentBatch) return;

    const namesText = currentBatch.names.join("\n");
    const nameLabel = pluralize(currentBatch.count_generated, "name");
    await navigator.clipboard.writeText(namesText);

    track({
      event: "Names copied",
      text: `Copied ${currentBatch.count_generated} Docker ${nameLabel}`,
      emoji: "📋",
      properties: {
        action: "copy_all",
        copied_text_length: namesText.length,
        ...batchProperties(currentBatch),
      },
    });


    showCopiedState(copyAllButton);
  });

  copyDockerCommandButton.addEventListener("click", async (e) => {
    e.preventDefault();
    if (!currentBatch) return;

    const commands = dockerCommands(currentBatch.names);
    const commandsText = commands.join("\n");
    const commandLabel = pluralize(commands.length, "command");
    await navigator.clipboard.writeText(commandsText);

    track({
      event: "Docker commands copied",
      text: `Copied ${commands.length} docker run ${commandLabel}`,
      emoji: "🐳",
      properties: {
        action: "copy_docker_commands",
        docker_image: "nginx",
        command_count: commands.length,
        commands,
        copied_text_length: commandsText.length,
        ...batchProperties(currentBatch),
      },
    });


    showCopiedState(copyDockerCommandButton);
  });

  generateNames();
}

export { ready };
