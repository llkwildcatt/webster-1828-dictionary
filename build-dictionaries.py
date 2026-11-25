#!/usr/bin/env python3
"""Parse Black's 1st/2nd, Webster 1844 and Webster 1913 into site data.

Reads the plain-text dictionaries under ~/workspace/reference/ and writes,
under ~/workspace/webster-1828-site/data/<slug>/:
  <letter>.json  - {normalized_key: [{h: display headword, c: entry html}, ...]}
  words.json    - [[key, display], ...] sorted, one row per distinct word

Entry detection is line-based for the scanned books (Black's, 1844): a new
entry starts at a line whose headword is in capitals, followed by "." or ","
and at least 10 characters of definition. Wrapped lines are joined, and a
hyphen at a line end is rejoined ("relin- quish" -> "relinquish").
Webster 1913 is block-based (one entry per blank-line-separated block).

A build report is printed: entry counts, per-letter counts, spot checks for
ABANDON / LAW / CONSTITUTION / COOL, and suspicious entries.
"""
import html
import json
import os
import re

REF_DIR = os.path.expanduser("~/workspace/reference")
SITE_DIR = os.path.expanduser("~/workspace/webster-1828-site")

# Matches a line that starts a dictionary entry: a capitalised headword
# (letters, apostrophes, hyphens, spaces), then "." or ",", then definition.
ENTRY_START = re.compile(r"^([A-Z][A-Z'’\- ]{1,40}?)[.,]\s+(.{10,})")


def clean_line(line):
    """Strip leading OCR junk from a line before entry detection."""
    line = line.lstrip(" \t\"'([{")
    # A stray lowercase letter glued to a capital headword ("tA-BAN'DON").
    if len(line) >= 2 and line[0].islower() and line[1].isupper():
        line = line[1:]
    return line


def norm_key(headword):
    """Lookup key: lowercase, no punctuation or spaces."""
    return re.sub(r"[^a-z0-9]", "", headword.lower())


def join_lines(lines):
    """Join wrapped OCR lines into one paragraph, rejoining hyphenation."""
    out = ""
    for line in lines:
        line = line.strip()
        if not line:
            continue
        if out.endswith("-") and line and line[0].islower():
            out = out[:-1] + line
        elif out:
            out += " " + line
        else:
            out = line
    return out


def entry_html(headword, text):
    return ("<div><p><b>" + html.escape(headword) + "</b> " +
            html.escape(text) + "</p></div>")


def parse_scanned(path, start_marker, end_marker):
    """Line-based parse for Black's and Webster 1844."""
    text = open(path, encoding="utf-8", errors="replace").read()
    start = text.find(start_marker)
    if start < 0:
        raise SystemExit(f"start marker not found in {path}: {start_marker!r}")
    end = text.find(end_marker, start)
    if end < 0:
        end = len(text)
    body = text[start:end]
    entries = []  # (headword, text)
    current = None
    for raw in body.split("\n"):
        line = clean_line(raw)
        m = ENTRY_START.match(line)
        if m:
            if current is not None:
                entries.append(current)
            headword = m.group(1).strip()
            current = (headword, [m.group(2)])
        elif current is not None:
            current[1].append(line)
    if current is not None:
        entries.append(current)
    return [(hw, join_lines(lines)) for hw, lines in entries]


def parse_1913(path, start_marker):
    """Block-based parse for the GCIDE-derived 1913 text."""
    text = open(path, encoding="utf-8", errors="replace").read()
    start = text.find(start_marker)
    if start < 0:
        raise SystemExit(f"start marker not found in {path}: {start_marker!r}")
    body = text[start:]
    entries = []
    for block in body.split("\n\n"):
        block = block.strip()
        if not block:
            continue
        first_line = block.split("\n")[0].strip()
        first_token = first_line.split(" ")[0]
        # Headword is the part before any ‖ variant marker.
        headword = first_token.split("‖")[0].strip(".,;\"'")
        if not headword or not any(c.isalpha() for c in headword):
            continue
        rest = join_lines(block.split("\n"))
        # Drop the leading headword token from the text (it is bolded).
        if rest.startswith(first_token):
            rest = rest[len(first_token):].lstrip()
        entries.append((headword, rest))
    return entries


DICTS = [
    # Black's texts are the CORRECTED copies (OCR errors fixed 2026-11-25:
    # 1,766 in the 1st edition, 6,691 in the 2nd). Originals kept untouched
    # in the same folder; corrections lists at blacks-law-1st-corrections.md
    # and blacks-law-2nd-corrections.md.
    {"slug": "blacks-1st", "title": "Black's Law Dictionary, 1st edition (1891)",
     "path": os.path.join(REF_DIR, "blacks-law-1st-edition-1891-corrected.txt"),
     "parse": lambda p: parse_scanned(p, "ABANDON", "ZYTHUM")},
    {"slug": "blacks-2nd", "title": "Black's Law Dictionary, 2nd edition (1910)",
     "path": os.path.join(REF_DIR, "blacks-law-2nd-edition-1910-corrected.txt"),
     "parse": lambda p: parse_scanned(p, "ABANDON", "ZYTHUM")},
    {"slug": "webster-1844", "title": "Webster's American Dictionary, 1844 edition",
     "path": os.path.join(REF_DIR, "webster-1844-dictionary.txt"),
     "parse": lambda p: parse_scanned(p, "A-BAN'DON", "ZYG-O-MAT'IC")},
    {"slug": "webster-1913", "title": "Webster's Revised Unabridged Dictionary, 1913",
     "path": os.path.join(REF_DIR, "webster-1913-dictionary.txt"),
     "parse": lambda p: parse_1913(p, "A A (named")},
]

SPOT = ["abandon", "law", "constitution", "cool"]


def main():
    for d in DICTS:
        entries = d["parse"](d["path"])
        # Group by letter of the normalized key.
        by_letter = {}
        index = {}
        for hw, text in entries:
            key = norm_key(hw)
            if not key:
                continue
            letter = key[0]
            if not letter.isalpha():
                continue
            by_letter.setdefault(letter, {}).setdefault(key, []).append(
                {"h": hw, "c": entry_html(hw, text)})
            index.setdefault(key, hw)
        out_dir = os.path.join(SITE_DIR, "data", d["slug"])
        os.makedirs(out_dir, exist_ok=True)
        total = 0
        for letter, mapping in sorted(by_letter.items()):
            path = os.path.join(out_dir, f"{letter}.json")
            with open(path, "w", encoding="utf-8") as f:
                json.dump(mapping, f, ensure_ascii=False, separators=(",", ":"))
            total += sum(len(v) for v in mapping.values())
        words = sorted([[k, v] for k, v in index.items()])
        with open(os.path.join(out_dir, "words.json"), "w",
                  encoding="utf-8") as f:
            json.dump(words, f, ensure_ascii=False, separators=(",", ":"))
        print(f"== {d['slug']}: {total} entries, {len(index)} distinct words, "
              f"{len(by_letter)} letters ==")
        print(f"   per-letter: " +
              ", ".join(f"{l}:{sum(len(v) for v in m.values())}"
                        for l, m in sorted(by_letter.items())))
        for w in SPOT:
            hits = by_letter.get(w[0], {}).get(w, [])
            print(f"   {w}: {len(hits)} entries; " +
                  (f"first: {hits[0]['c'][:110]}" if hits else "NOT FOUND"))
        # Suspicious: entries whose text is very short (likely fragments).
        short = [(k, v[0]['h']) for m in by_letter.values()
                 for k, v in m.items()
                 if len(v[0]['c']) < 60]
        print(f"   very short entries (<60 chars html): {len(short)}; "
              f"sample: {short[:5]}")


if __name__ == "__main__":
    main()
