import { HEPCAT_PHRASES, HEPCAT_WORDS } from "./jiveDictionary";

// Curated idioms — these take priority over the generated Hepcat dictionary
// so the core demo sentences always translate the same way.
const CURATED_PHRASES: [string, string][] = [
  ["give me a break", "cut me some slack, Jack"],
  ["what is going on", "what's the buzz"],
  ["everything is fine", "everything is kopasetic"],
  ["what are you doing", "what's your story"],
  ["what are you up to", "what's your story, morning glory"],
  ["wants to know", "is itchin' to get hip to"],
  ["i understand", "i got my boots on"],
  ["do you understand", "ya dig"],
  ["don't worry", "hang loose, blood"],
  ["good night", "lay some Zs"],
  ["get out of here", "take a powder"],
  ["dressed up", "togged to the bricks"],
  ["going to work", "off to the gig"],
  ["in a hurry", "with the gas on"],
  ["making money", "grabbing some heavy iron"],
  ["shaking hands", "laying some skin"]
];

// Curated single tokens — also take priority over the Hepcat dictionary.
const CURATED_WORDS: Record<string, string> = {
  "hello": "what's shakin'",
  "hi": "hey daddy-o",
  "friend": "gate",
  "friends": "gates",
  "man": "cat",
  "men": "cats",
  "woman": "canary",
  "women": "canaries",
  "guy": "chump",
  "dude": "blood",
  "sir": "pops",
  "boss": "main man",
  "stewardess": "flight canary",
  "musician": "alligator",
  "people": "folks",
  "understand": "dig",
  "know": "get hip to",
  "talk": "beat up the chops",
  "speak": "blow some jargon",
  "leave": "make tracks",
  "left": "made tracks from",
  "go": "cruise",
  "hurry": "step on the gas",
  "work": "gig",
  "working": "gigging",
  "sleep": "cop a nod",
  "die": "kick the bucket",
  "help": "cut some slack",
  "look": "gander",
  "see": "spy",
  "eat": "peck",
  "dance": "hop",
  "good": "kopasetic",
  "great": "the tops",
  "cool": "righteous",
  "excellent": "solid",
  "bad": "a drag",
  "crazy": "wigged out",
  "tired": "beat to the socks",
  "drunk": "well-pulled",
  "hungry": "ready for the mess hall",
  "home": "crib",
  "house": "pad",
  "club": "frolic pad",
  "money": "jack",
  "car": "ride"
};

const JIVE_FLAVOR_SUFFIXES = [
  ", ya dig?",
  ", solid!",
  "... slide me some skin!",
  ", straight up."
];

// Deterministic hash keeps every choice stable while the user types —
// a Math.random() pick would reshuffle the output on each keystroke.
function hashText(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchCase(source: string, translation: string): string {
  if (source.length > 1 && source === source.toUpperCase()) {
    return translation.toUpperCase();
  }
  if (source.charAt(0) === source.charAt(0).toUpperCase()) {
    return translation.charAt(0).toUpperCase() + translation.slice(1);
  }
  return translation;
}

// Phase 1 table: curated idioms first (they win on key collisions), then
// every multi-word English phrase inverted from the Hepcat dictionary.
// Longest phrases match first so "beautiful girl" beats "girl".
const PHRASE_TABLE: { regex: RegExp; options: string[] }[] = (() => {
  const merged = new Map<string, string[]>();
  for (const [english, jive] of CURATED_PHRASES) {
    merged.set(english, [jive]);
  }
  for (const [english, options] of Object.entries(HEPCAT_PHRASES)) {
    if (!merged.has(english)) merged.set(english, options);
  }
  return Array.from(merged.entries())
    .sort((a, b) => b[0].length - a[0].length)
    .map(([english, options]) => ({
      regex: new RegExp(`\\b${escapeRegex(english)}\\b`, "gi"),
      options
    }));
})();

function lookupWord(word: string): string | undefined {
  if (CURATED_WORDS[word]) return CURATED_WORDS[word];
  const options = HEPCAT_WORDS[word];
  if (options) return options[hashText(word) % options.length];
  // plural fallback: "trumpets" -> translate "trumpet", re-pluralize
  if (word.endsWith("s")) {
    const singular = word.slice(0, -1);
    const base =
      CURATED_WORDS[singular] ??
      HEPCAT_WORDS[singular]?.[hashText(singular) % HEPCAT_WORDS[singular].length];
    if (base) {
      if (base.includes(" ")) return base;
      return /[^aeiou]y$/.test(base) ? base.slice(0, -1) + "ies" : base + "s";
    }
  }
  return undefined;
}

function capitalizeSentences(text: string): string {
  return text.replace(
    /(^|[.!?]\s+|\n\s*)([a-z])/g,
    (_, boundary: string, letter: string) => boundary + letter.toUpperCase()
  );
}

export function translateToJive(englishText: string): string {
  if (!englishText.trim()) return "";

  // Phase 1: multi-word phrases/idioms via regex pattern matching.
  // Matches are parked behind placeholders so phase 2 can't re-translate
  // words inside an already-translated phrase.
  const parked: string[] = [];
  let workingText = englishText;
  for (const { regex, options } of PHRASE_TABLE) {
    workingText = workingText.replace(regex, (match) => {
      const jive = options[hashText(match.toLowerCase()) % options.length];
      parked.push(matchCase(match, jive));
      return `\x00${parked.length - 1}\x00`;
    });
  }

  // Phase 2: individual tokens, keeping whitespace and punctuation intact
  // so the sentence rebuilds in its original order and spacing.
  const translated = workingText
    .split(/(\s+)/)
    .map((token) => {
      if (/^\s*$/.test(token) || token.includes("\x00")) return token;
      const core = token.match(/[a-zA-Z][a-zA-Z'-]*/)?.[0];
      if (!core) return token;
      const jive = lookupWord(core.toLowerCase());
      if (!jive) return token;
      return token.replace(core, matchCase(core, jive));
    })
    .join("");

  // Restore parked phrase translations
  let result = translated.replace(/\x00(\d+)\x00/g, (_, i) => parked[+i]);

  // Tidy spacing without collapsing line breaks
  result = result
    .split("\n")
    .map((line) => line.replace(/[^\S\n]+/g, " ").trim())
    .join("\n");

  // Phase 3: deterministic flavor suffix on longer lines
  result = result
    .split("\n")
    .map((line) => {
      const wordCount = line.split(/\s+/).filter(Boolean).length;
      const seed = hashText(line);
      if (wordCount > 5 && seed % 5 > 1 && !/[?!]$/.test(line)) {
        return line.replace(/\.$/, "") + JIVE_FLAVOR_SUFFIXES[seed % JIVE_FLAVOR_SUFFIXES.length];
      }
      return line;
    })
    .join("\n");

  return capitalizeSentences(result);
}
