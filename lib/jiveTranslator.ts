// Phase 1: Multi-word phrases & idioms (parsed first to prevent
// individual word collisions from scrambling idiomatic meaning)
const JIVE_PHRASES: [string, string][] = [
  ["give me a break", "cut me some slack, Jack"],
  ["what is going on", "what's the buzz"],
  ["everything is fine", "everything is kopasetic"],
  ["what are you doing", "what's your story"],
  ["wants to know", "is itchin' to get hip to"],
  ["i understand", "i got my boots on"],
  ["do you understand", "ya dig"],
  ["don't worry", "hang loose, blood"],
  ["good night", "lay some Zs"],
  ["get out of here", "take a powder"],
  ["dressed up", "togged to the bricks"],
  ["making money", "grabbing some heavy iron"],
  ["shaking hands", "laying some skin"]
];

// Phase 2: Individual token mapping
const JIVE_WORDS: { [key: string]: string } = {
  // People & Roles
  "hello": "what's shakin'",
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

  // Actions & Verbs
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

  // Adjectives, Descriptions & Places
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

// Deterministic hash so the live-rendered output stays stable while typing
// (a Math.random() suffix would flicker on every keystroke)
function hashText(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function translateToJive(englishText: string): string {
  if (!englishText.trim()) return "";

  // Normalize input while protecting core sentence architecture
  let workingText = englishText.toLowerCase();

  // Phase 1: Translate multi-word phrases/idioms first via regex pattern matching
  for (const [englishPhrase, jivePhrase] of JIVE_PHRASES) {
    const regex = new RegExp(`\\b${englishPhrase}\\b`, "g");
    workingText = workingText.replace(regex, jivePhrase);
  }

  // Phase 2: Split into tokens (keeping whitespace and punctuation intact
  // so the sentence rebuilds in its original order and spacing)
  const words = workingText.split(/(\s+|\b)/);
  const translatedWords = words.map((token) => {
    const cleanToken = token.toLowerCase().trim();
    if (JIVE_WORDS[cleanToken]) {
      return JIVE_WORDS[cleanToken];
    }
    return token;
  });

  let result = translatedWords.join("");

  // Clean up any double spaces or broken formatting from regex splits
  result = result.replace(/[^\S\n]+/g, " ").trim();

  // Capitalize sentence start
  result = result.charAt(0).toUpperCase() + result.slice(1);

  // Phase 3: Contextual flavor suffix on longer sentences
  const seed = hashText(englishText.trim());
  if (words.length > 5 && seed % 5 > 1) {
    const flavor = JIVE_FLAVOR_SUFFIXES[seed % JIVE_FLAVOR_SUFFIXES.length];
    if (!result.endsWith("?") && !result.endsWith("!")) {
      result = result.replace(/\.$/, "") + flavor;
    }
  }

  return result;
}
