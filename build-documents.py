#!/usr/bin/env python3
"""Build the founding-documents pages for the public site.

Reads the plain-text documents under ~/workspace/reference/founding-documents/
and writes, under ~/workspace/webster-1828-site/:
  docs/<slug>.html        - one readable page per document
  docs/christian-nation.html - the references page: exact quotes about God
                               and faith from the founding documents
  data/documents.json     - [{title, slug, year, description, source}] for the app

Every quote on the references page is checked against its source file
(whitespace-normalized) before the page is written. If a quote is not
found word for word, the script stops with an error.
"""
import html
import json
import os
import re

DOCS_DIR = os.path.expanduser("~/workspace/reference/founding-documents")
SITE_DIR = os.path.expanduser("~/workspace/webster-1828-site")
OUT_DOCS = os.path.join(SITE_DIR, "docs")
os.makedirs(OUT_DOCS, exist_ok=True)

DOCUMENTS = [
    {"file": "declaration-of-independence.txt",
     "slug": "declaration-of-independence",
     "title": "Declaration of Independence", "year": "1776",
     "description": "The colonies declare themselves free and independent states."},
    {"file": "constitution.txt",
     "slug": "constitution",
     "title": "Constitution of the United States", "year": "1787",
     "description": "The supreme law of the land, with all 27 amendments."},
    {"file": "bill-of-rights.txt",
     "slug": "bill-of-rights",
     "title": "Bill of Rights", "year": "1791",
     "description": "The first ten amendments to the Constitution."},
    {"file": "articles-of-confederation.txt",
     "slug": "articles-of-confederation",
     "title": "Articles of Confederation", "year": "1781",
     "description": "The first constitution of the United States."},
    {"file": "federalist-papers.txt",
     "slug": "federalist-papers",
     "title": "The Federalist Papers", "year": "1787–1788",
     "description": "All 85 papers in defense of the Constitution."},
    {"file": "northwest-ordinance.txt",
     "slug": "northwest-ordinance",
     "title": "Northwest Ordinance", "year": "1787",
     "description": "The law for governing the Northwest Territory."},
    {"file": "washington-farewell-address.txt",
     "slug": "washington-farewell-address",
     "title": "Washington's Farewell Address", "year": "1796",
     "description": "George Washington's farewell to the nation."},
]

# Each quote was verified word for word against its source file.
REFERENCES = [
    {"quote": "When in the Course of human events, it becomes necessary for one people to dissolve the political bands which have connected them with another, and to assume among the powers of the earth, the separate and equal station to which the Laws of Nature and of Nature's God entitle them, a decent respect to the opinions of mankind requires that they should declare the causes which impel them to the separation.",
     "source_file": "declaration-of-independence.txt",
     "source": "Declaration of Independence, first paragraph"},
    {"quote": "We hold these truths to be self-evident, that all men are created equal, that they are endowed by their Creator with certain unalienable Rights, that among these are Life, Liberty and the pursuit of Happiness.",
     "source_file": "declaration-of-independence.txt",
     "source": "Declaration of Independence"},
    {"quote": "appealing to the Supreme Judge of the world for the rectitude of our intentions, do, in the Name, and by Authority of the good People of these Colonies, solemnly publish and declare, That these United Colonies are, and of Right ought to be Free and Independent States",
     "source_file": "declaration-of-independence.txt",
     "source": "Declaration of Independence"},
    {"quote": "And for the support of this Declaration, with a firm reliance on the protection of divine Providence, we mutually pledge to each other our Lives, our Fortunes and our sacred Honor.",
     "source_file": "declaration-of-independence.txt",
     "source": "Declaration of Independence, closing"},
    {"quote": "no religious Test shall ever be required as a Qualification to any Office or public Trust under the United States.",
     "source_file": "constitution.txt",
     "source": "Constitution, Article VI"},
    {"quote": "Congress shall make no law respecting an establishment of religion, or prohibiting the free exercise thereof; or abridging the freedom of speech, or of the press; or the right of the people peaceably to assemble, and to petition the Government for a redress of grievances.",
     "source_file": "constitution.txt",
     "source": "Constitution, First Amendment (Bill of Rights)"},
    {"quote": "done in Convention by the Unanimous Consent of the States present the Seventeenth Day of September in the Year of our Lord one thousand seven hundred and Eighty seven and of the Independance of the United States of America the Twelfth",
     "source_file": "constitution.txt",
     "source": "Constitution, closing"},
    {"quote": "And Whereas it hath pleased the Great Governor of the World to incline the hearts of the legislatures we respectively represent in congress, to approve of, and to authorize us to ratify the said articles of confederation and perpetual union",
     "source_file": "articles-of-confederation.txt",
     "source": "Articles of Confederation, closing"},
    {"quote": "Done at Philadelphia, in the State of Pennsylvania, the ninth Day of July, in the Year of our Lord one Thousand seven Hundred and Seventy eight, and in the third year of the Independence of America.",
     "source_file": "articles-of-confederation.txt",
     "source": "Articles of Confederation, closing"},
    {"quote": "Religion, morality, and knowledge, being necessary to good government and the happiness of mankind, schools and the means of education shall forever be encouraged.",
     "source_file": "northwest-ordinance.txt",
     "source": "Northwest Ordinance, Article 3"},
    {"quote": "Of all the dispositions and habits which lead to political prosperity, religion and morality are indispensable supports.",
     "source_file": "washington-farewell-address.txt",
     "source": "Washington's Farewell Address"},
    {"quote": "And let us with caution indulge the supposition that morality can be maintained without religion.",
     "source_file": "washington-farewell-address.txt",
     "source": "Washington's Farewell Address"},
    {"quote": "Providence has been pleased to give this one connected country to one united people -- a people descended from the same ancestors, speaking the same language, professing the same religion, attached to the same principles of government, very similar in their manners and customs, and who, by their joint counsels, arms, and efforts, fighting side by side throughout a long and bloody war, have nobly established general liberty and independence.",
     "source_file": "federalist-papers.txt",
     "source": "The Federalist No. 2 (John Jay)"},
    {"quote": "This country and this people seem to have been made for each other, and it appears as if it was the design of Providence, that an inheritance so proper and convenient for a band of brethren, united to each other by the strongest ties, should never be split into a number of unsocial, jealous, and alien sovereignties.",
     "source_file": "federalist-papers.txt",
     "source": "The Federalist No. 2 (John Jay)"},
    {"quote": "When the Almighty himself condescends to address mankind in their own language, his meaning, luminous as it must be, is rendered dim and doubtful by the cloudy medium through which it is communicated.",
     "source_file": "federalist-papers.txt",
     "source": "The Federalist No. 37 (James Madison)"},
    {"quote": "It is impossible for the man of pious reflection not to perceive in it a finger of that Almighty hand which has been so frequently and signally extended to our relief in the critical stages of the revolution.",
     "source_file": "federalist-papers.txt",
     "source": "The Federalist No. 37 (James Madison)"},
]


def norm(text):
    return re.sub(r"\s+", " ", text).strip()


def read_document(doc):
    with open(os.path.join(DOCS_DIR, doc["file"]), encoding="utf-8") as f:
        text = f.read()
    # Strip the header block (title, source, fetched date, note) up to the
    # first blank line.
    parts = text.split("\n\n", 1)
    body = parts[1] if len(parts) == 2 else text
    return body


def blocks_to_html(body, slug):
    """Convert blank-line-separated text blocks to HTML paragraphs/headings."""
    out = []
    toc = []
    for block in body.split("\n\n"):
        block = norm(block)
        if not block:
            continue
        if slug == "federalist-papers":
            m = re.match(r"^The Federalist No\. (\d+)\s*$", block)
            if m:
                num = m.group(1)
                toc.append((num, block))
                out.append(f'<h3 id="no-{num}">{html.escape(block)}</h3>')
                continue
            m = re.match(r"^The Federalist No\. (\d+)\s+(.+)$", block)
            if m:
                num = m.group(1)
                toc.append((num, block))
                out.append(f'<h3 id="no-{num}">{html.escape(block)}</h3>')
                continue
        if (len(block) < 100 and
                (block.isupper() or
                 re.match(r"^(Article|Section|Amendment|Preamble|Chapter)\b", block))):
            out.append(f"<h3>{html.escape(block)}</h3>")
        else:
            out.append(f"<p>{html.escape(block)}</p>")
    return "\n".join(out), toc


PAGE_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} — Founding Documents</title>
<meta name="description" content="{title} ({year}), free to read.">
<link rel="stylesheet" href="../styles.css">
</head>
<body>
<header class="masthead">
  <div class="masthead-inner">
    <h1><a href="../#/">Webster's 1828 Dictionary</a></h1>
    <p class="subtitle">Noah Webster's <i>An American Dictionary of the English Language</i>, 1828</p>
    <nav class="sitenav" aria-label="Sections">
      <a href="../#/">Dictionary</a>
      <a href="../#/bible/">Holy Bible</a>
      <a href="../#/documents/">Founding Documents</a>
      <a href="../#/about">About</a>
    </nav>
  </div>
</header>
<main>
<section class="doc">
<h2>{title} ({year})</h2>
<p class="doc-source">Source: <a href="{source_url}">{source_url}</a> &middot; Transcribed as printed; original spellings kept.</p>
{toc}
{body}
<p><a href="../#/documents/">&larr; All founding documents</a></p>
</section>
</main>
<footer>
  <p>The text of America's founding documents is in the public domain. This site is free for everyone.</p>
  <p><a href="../#/about">About this site</a> &middot; <a href="https://1828.mshaffer.com" rel="noopener">1828.mshaffer.com</a></p>
</footer>
</body>
</html>
"""


def main():
    sources = {}
    with open(os.path.join(DOCS_DIR, "SOURCES.md"), encoding="utf-8") as f:
        sources_text = f.read()
    # Pull the source URL per file out of SOURCES.md when it names one.
    source_urls = {}
    for doc in DOCUMENTS:
        m = re.search(re.escape(doc["file"]) + r"[^\n]*?(https?://\S+)", sources_text)
        source_urls[doc["slug"]] = m.group(1) if m else "https://www.archives.gov/founding-docs"

    index = []
    for doc in DOCUMENTS:
        body = read_document(doc)
        html_body, toc = blocks_to_html(body, doc["slug"])
        toc_html = ""
        if toc:
            toc_html = '<nav class="doctoc"><h3>Contents</h3><ul>'
            for num, heading in toc:
                toc_html += (f'<li><a href="#no-{num}">{html.escape(heading)}</a></li>')
            toc_html += "</ul></nav>"
        page = PAGE_TEMPLATE.format(
            title=html.escape(doc["title"]), year=doc["year"],
            source_url=source_urls[doc["slug"]],
            toc=toc_html, body=html_body)
        path = os.path.join(OUT_DOCS, f"{doc['slug']}.html")
        with open(path, "w", encoding="utf-8") as f:
            f.write(page)
        print(f"  {doc['slug']}.html: {os.path.getsize(path)} bytes")
        index.append({"title": doc["title"], "slug": doc["slug"],
                      "year": doc["year"], "description": doc["description"],
                      "source": source_urls[doc["slug"]]})

    with open(os.path.join(SITE_DIR, "data", "documents.json"), "w",
              encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, separators=(",", ":"))
    print(f"documents.json: {len(index)} documents")

    # Verify every reference quote against its source file, then build the page.
    texts = {}
    for doc in DOCUMENTS:
        with open(os.path.join(DOCS_DIR, doc["file"]), encoding="utf-8") as f:
            texts[doc["file"]] = norm(f.read())
    for ref in REFERENCES:
        hay = texts[ref["source_file"]]
        if norm(ref["quote"]) not in hay:
            raise SystemExit(f"QUOTE NOT FOUND in {ref['source_file']}: "
                             f"{ref['quote'][:80]!r}")
    print(f"All {len(REFERENCES)} reference quotes verified word for word.")

    items = ""
    for ref in REFERENCES:
        items += ('<blockquote><p>' + html.escape(ref["quote"]) + "</p>" +
                  "<footer>&mdash; " + html.escape(ref["source"]) + "</footer></blockquote>\n")
    page = PAGE_TEMPLATE.format(
        title="God and Faith in the Founding Documents",
        year="",
        source_url="https://www.archives.gov/founding-docs",
        toc="",
        body=(
            "<p>These passages are quoted word for word from America's founding "
            "documents. Each one names the document and the place in it where the "
            "words appear. Spelling is as the documents print it.</p>\n" + items))
    # Fix the title line for this page (no year in parentheses).
    page = page.replace("<h2>God and Faith in the Founding Documents ()</h2>",
                        "<h2>God and Faith in the Founding Documents</h2>")
    path = os.path.join(OUT_DOCS, "christian-nation.html")
    with open(path, "w", encoding="utf-8") as f:
        f.write(page)
    print(f"christian-nation.html: {os.path.getsize(path)} bytes")
    print("DONE")


if __name__ == "__main__":
    main()
