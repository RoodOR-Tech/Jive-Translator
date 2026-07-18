#!/usr/bin/env python3
"""Generate lib/jiveDictionary.ts from the 1945 Hepcats Jive Talk Dictionary.

The source ("Full text of _Hepcats Jive Talk Dictionary_.html") is an OCR'd
archive.org page whose entries map JIVE -> ENGLISH. The translator needs the
inverse, so this script parses the Jive Words / Jive Phrases / G.I. Jive
sections, cleans up OCR noise, inverts each definition into English lookup
keys, and emits a TypeScript module with english -> [jive options] maps.

Run manually after updating the source file:
    python3 scripts/extract_dictionary.py
"""
import html
import json
import re
from collections import OrderedDict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "Full text of _Hepcats Jive Talk Dictionary_.html"
OUTPUT = ROOT / "lib" / "jiveDictionary.ts"

# Targeted fixes for OCR misreads that would otherwise poison good entries.
OCR_FIXES = {
    "biu": "bill",
    "proeeed": "proceed",
    "immey": "money",
    "your lace": "your face",
    "profuse teats": "profuse tears",
    "sugmfc": "sugar",
    "heavy co ao": "heavy load",
    "lone me five": "loan me five",
}

# The 1945 source includes era-typical entries built on race/ethnicity.
# Any entry whose term or definition touches these is dropped entirely so
# the translator can never produce them.
BLOCKLIST = {
    "negro", "negroes", "mulatto", "colored", "cracker", "ofay", "ofays",
    "jew", "jewish", "jap", "japs", "chinaman", "chinese", "harlem",
    "darky", "darkies", "kike", "wop", "spade",
}

STOPWORD_KEYS = {
    "the", "a", "an", "and", "or", "of", "to", "in", "on", "is", "are",
    "was", "it", "its", "you", "your", "yours", "one", "ones", "who",
    "that", "this", "with", "for", "very", "any", "all", "not", "who's",
    "man's", "one's", "something", "anything", "someone", "anyone",
}

LEAD_INS = [
    "a pair of", "pair of", "a kind of", "kind of", "a type of",
    "one's", "your", "the", "any", "an", "a", "to",
]


def load_text() -> str:
    raw = SOURCE.read_text(encoding="utf-8", errors="replace")
    txt = html.unescape(re.search(r"<pre[^>]*>(.*?)</pre>", raw, re.S).group(1))
    txt = txt.replace("’", "'").replace("‘", "'")
    txt = re.sub(r"¬\s*", "", txt)      # soft hyphen: embel¬ lished
    txt = re.sub(r"-\s*\n\s*", "-", txt)     # hard hyphen at line break
    return txt


def strip_junk(section: str) -> str:
    return re.sub(
        r"^\s*(JIVE WORDS|JIVE PHRASES|G\.? ?!?\.? ?I?\.? ?JIVE|SECTION \S+|\d{1,3})\s*$",
        "",
        section,
        flags=re.M,
    )


def sections(txt: str):
    w0 = txt.index("JIVE WORDS", 1800)
    p0 = re.search(r"SECTION\s+\S+\s+JIVE PHRASES", txt).start()
    g0 = re.search(r"SECTION\s+\S+\s+JEOGRAPHICAL", txt).start()
    gi0 = re.search(r"SECTION\s+\S+\s+G. ?!?\.? ?JIVE", txt).start()
    return strip_junk(txt[w0:p0]), strip_junk(txt[p0:g0]), strip_junk(txt[gi0:])


def parse_words(section: str):
    """Entries look like:  TERM (n) Definition."""
    pos_re = re.compile(r"\(([A-Za-z .!,\']{1,12})\)")
    term_tail = re.compile(r"([A-Z][A-Za-z'&.\- ]{1,30})\s*$")
    parts = pos_re.split(section)
    entries = []
    carry = parts[0]
    for i in range(1, len(parts) - 1, 2):
        seg = parts[i + 1]
        m = term_tail.search(carry)
        nxt = term_tail.search(seg)
        definition = seg[: nxt.start()] if nxt else seg
        if m:
            entries.append((m.group(1), definition))
        carry = seg
    return entries


def parse_phrases(section: str):
    """Entries look like:  PHRASE, Definition.  (or PHRASE. Definition.)"""
    entry_re = re.compile(
        r"^([A-Z][A-Z0-9'&.!\- ]{2,40}?)[,.]\s+(.+?)"
        r"(?=^\s*[A-Z][A-Z0-9'&.!\- ]{2,40}?[,.]\s|\Z)",
        re.M | re.S,
    )
    return [(m.group(1), m.group(2)) for m in entry_re.finditer(section)]


def clean_term(term: str) -> str | None:
    term = " ".join(term.split()).strip(" .,&-")
    # Drop-cap artifacts: "A bercrombie" -> "Abercrombie", "U NCLE" -> "UNCLE"
    term = re.sub(r"^([A-Z])\s+(?=[A-Za-z])", r"\1", term)
    term = term.lower().strip("'. ")
    if not re.fullmatch(r"[a-z][a-z' .!-]{1,34}", term):
        return None
    # every word must look like a real word (OCR junk like "lj" has no vowel)
    if any(not re.search(r"[aeiouy]", w) for w in term.replace("-", " ").split()):
        return None
    return term


def apply_ocr_fixes(text: str) -> str:
    for bad, good in OCR_FIXES.items():
        text = re.sub(re.escape(bad), good, text, flags=re.I)
    return text


def definition_keys(definition: str):
    """Invert one prose definition into zero or more English lookup keys."""
    d = " ".join(definition.split()).strip(" .,;:!*'•")
    d = apply_ocr_fixes(d).lower()
    keys = []
    for alt in re.split(r"\s+or\s+|;", d):
        alt = alt.strip(" .,'-")
        changed = True
        while changed:
            changed = False
            for lead in LEAD_INS:
                if alt.startswith(lead + " "):
                    alt = alt[len(lead) + 1 :]
                    changed = True
        words = alt.split()
        if not 1 <= len(words) <= 3:
            continue
        if any(not re.fullmatch(r"[a-z][a-z'-]*", w) for w in words):
            continue
        if len(words) == 1 and (len(words[0]) < 3 or words[0] in STOPWORD_KEYS):
            continue
        if any(w in STOPWORD_KEYS for w in words) and len(words) == 1:
            continue
        keys.append(" ".join(words))
    return keys


def is_blocked(*texts: str) -> bool:
    joined = " ".join(texts).lower()
    return any(re.search(r"\b" + re.escape(b) + r"\b", joined) for b in BLOCKLIST)


def build():
    txt = load_text()
    words_sec, phrases_sec, gi_sec = sections(txt)
    raw_entries = parse_words(words_sec) + parse_phrases(phrases_sec) + parse_phrases(gi_sec)

    inverted: "OrderedDict[str, list[str]]" = OrderedDict()
    kept = 0
    for term, definition in raw_entries:
        if is_blocked(term, definition):
            continue
        jive = clean_term(term)
        if not jive:
            continue
        jive = apply_ocr_fixes(jive)
        for key in definition_keys(definition):
            if key == jive or is_blocked(key):
                continue
            options = inverted.setdefault(key, [])
            if jive not in options and len(options) < 6:
                options.append(jive)
                kept += 1

    word_map = {k: v for k, v in inverted.items() if " " not in k}
    phrase_map = {k: v for k, v in inverted.items() if " " in k}

    def ts_object(d):
        lines = [f"  {json.dumps(k)}: {json.dumps(d[k])}," for k in sorted(d)]
        return "{\n" + "\n".join(lines) + "\n}"

    OUTPUT.write_text(
        "// AUTO-GENERATED by scripts/extract_dictionary.py from the 1945\n"
        "// Hepcats Jive Talk Dictionary (Lou Shelly, ed.). Do not edit by hand;\n"
        "// re-run the script after changing the source or extraction rules.\n\n"
        "// English word -> jive alternatives\n"
        f"export const HEPCAT_WORDS: Record<string, string[]> = {ts_object(word_map)};\n\n"
        "// English multi-word phrase -> jive alternatives\n"
        f"export const HEPCAT_PHRASES: Record<string, string[]> = {ts_object(phrase_map)};\n",
        encoding="utf-8",
    )
    print(f"entries parsed: {len(raw_entries)}")
    print(f"english keys:   {len(word_map)} words, {len(phrase_map)} phrases ({kept} mappings)")


if __name__ == "__main__":
    build()
