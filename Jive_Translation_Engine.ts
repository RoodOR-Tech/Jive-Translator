// 1. Phased Idioms (Parsed first to prevent individual word collision)
const JIVE_PHRASES: [string, string][] = [
  ["give me a break", "cut me some slack, Jack"],
  ["what is going on", "what's the buzz"],
  ["everything is fine", "everything is kopasetic"],
  ["what are you doing", "what's your story"],
  ["i understand", "i got my boots on"],
  ["do you understand", "ya dig"],
  ["don't worry", "hang loose, blood"],
  ["good night", "lay some Zs"],
  ["get out of here", "take a powder"],
  ["dressed up", "togged to the bricks"],
  ["making money", "grabbing some heavy iron"],
  ["shaking hands", "laying some skin"]
];

// 2. Individual Token Mapping
const JIVE_WORDS: { [key: string]: string } = {
  // People & Roles
  "hello": "what's the buzz",
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
  "know": "hip to",
  "talk": "beat up the chops",
  "speak": "blow some jargon",
  "leave": "make tracks",
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
  ", straight up.",
  ", layout!"
];

export function translateToJive(englishText: string): string {
  if (!englishText.trim()) return "";

  // Normalize input while protecting core sentence architecture
  let workingText = englishText.toLowerCase();

  // Phase 1: Translate multi-word phrases/idioms first
  for (const [englishPhrase, jivePhrase] of JIVE_PHRASES) {
    const regex = new RegExp(`\\b${englishPhrase}\\b`, 'g');
    workingText = workingText.replace(regex, jivePhrase);
  }

  // Phase 2: Translate individual tokens
  let words = workingText.split(/(\s+|\b)/);
  let translatedWords = words.map((token) => {
    // Only translate if it matches a dictionary key clean
    const cleanToken = token.toLowerCase().trim();
    if (JIVE_WORDS[cleanToken]) {
      return JIVE_WORDS[cleanToken];
    }
    return token;
  });

  let result = translatedWords.join("");

  // Clean up any double spaces or broken formatting from regex splits
  result = result.replace(/\s+/g, " ").trim();

  // Capitalize sentence structures
  result = result.charAt(0).toUpperCase() + result.slice(1);

  // Phase 3: Sentence contextual dynamic flavor
  if (words.length > 5 && Math.random() > 0.4) {
    const randomFlavor = JIVE_FLAVOR_SUFFIXES[Math.floor(Math.random() * JIVE_FLAVOR_SUFFIXES.length)];
    // Ensure it doesn't duplicate a question mark horribly
    if (!result.endsWith('?') && !result.endsWith('!')) {
      result += randomFlavor;
    }
  }

  return result;
}