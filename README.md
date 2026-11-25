# Webster's 1828 Dictionary

A free public website for Noah Webster's *An American Dictionary of the English Language* (1828) — the first American dictionary, with about 61,500 words.

Live site: https://llkwildcatt.github.io/webster-1828-dictionary/

## What is here

- `index.html`, `styles.css`, `app.js` — the site. Type a word to look it up, browse by letter, or jump to a random word.
- `data/words.json` — the word list used for search and suggestions.
- `data/<letter>.json` — the dictionary entries, one file per letter, built from the corrected database.

## The text

The dictionary text is in the public domain. The data comes from Monte Shaffer's open project [DataWar/1828-dictionary](https://github.com/DataWar/1828-dictionary), which keeps Webster's 1828 text in a public database. Our thanks to Monte for keeping his site [1828.mshaffer.com](https://1828.mshaffer.com) online free for everyone.

The text here was checked word by word against the scanned 1828 printed pages and the live site. 491 small machine-reading errors were found and fixed — for example, COOL used to read "ice wools water" and now reads "ice cools water" as Webster printed it. The corrections were sent to Monte and offered as [pull request #1](https://github.com/DataWar/1828-dictionary/pull/1). The checking was done by Larry Kendrick and Harlan Stephen Kendrick.

## Running it locally

Any static file server works. For example, from this folder:

```text
python3 -m http.server
```

Then open http://localhost:8000/ in a browser.

## License

The dictionary text is public domain. The site code is free to use and share.
