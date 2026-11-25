/* Webster's 1828 Dictionary — static site.
   Data: data/words.json (word list for search) and data/<letter>.json (entries).
   Routing is by hash: #/word/<word>, #/letter/<letter>, #/about, #/ (home). */
(function () {
  "use strict";

  var main = document.getElementById("main");
  var searchBox = document.getElementById("search-box");
  var searchForm = document.getElementById("search-form");
  var suggestionsBox = document.getElementById("suggestions");
  var lettersNav = document.getElementById("letters");

  var wordsIndex = null;      // [[word, heading], ...] sorted by word
  var wordsIndexPromise = null;
  var letterCache = {};       // letter -> {word: {h, c}}

  function esc(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normalize(q) {
    return q.trim().toLowerCase().replace(/['\u2019]/g, "'");
  }

  function loadWordsIndex() {
    if (!wordsIndexPromise) {
      wordsIndexPromise = fetch("data/words.json")
        .then(function (r) {
          if (!r.ok) throw new Error("words.json failed: " + r.status);
          return r.json();
        })
        .then(function (data) { wordsIndex = data; return data; });
    }
    return wordsIndexPromise;
  }

  function loadLetter(letter) {
    letter = (letter || "#").toLowerCase();
    if (letterCache[letter]) return Promise.resolve(letterCache[letter]);
    return fetch("data/" + letter + ".json")
      .then(function (r) {
        if (!r.ok) throw new Error("letter " + letter + " failed: " + r.status);
        return r.json();
      })
      .then(function (data) { letterCache[letter] = data; return data; });
  }

  function firstLetter(word) {
    var c = (word || "#").charAt(0).toLowerCase();
    return (c >= "a" && c <= "z") ? c : "#";
  }

  function findWord(q) {
    // Exact match on the word key; returns the entry's word or null.
    if (!wordsIndex) return null;
    var lo = 0, hi = wordsIndex.length - 1;
    while (lo <= hi) {
      var mid = (lo + hi) >> 1;
      var w = wordsIndex[mid][0];
      if (w === q) return w;
      if (w < q) lo = mid + 1; else hi = mid - 1;
    }
    return null;
  }

  function suggestionsFor(q, limit) {
    if (!wordsIndex || !q) return [];
    var out = [];
    var i, w;
    for (i = 0; i < wordsIndex.length && out.length < limit; i++) {
      w = wordsIndex[i][0];
      if (w.indexOf(q) === 0) out.push(wordsIndex[i]);
    }
    if (out.length < limit) {
      for (i = 0; i < wordsIndex.length && out.length < limit; i++) {
        w = wordsIndex[i][0];
        if (w.indexOf(q) > 0 && out.indexOf(wordsIndex[i]) === -1) out.push(wordsIndex[i]);
      }
    }
    return out;
  }

  function hideSuggestions() {
    suggestionsBox.hidden = true;
    suggestionsBox.innerHTML = "";
  }

  function showSuggestions(q) {
    var list = suggestionsFor(normalize(q), 8);
    if (!list.length) { hideSuggestions(); return; }
    suggestionsBox.innerHTML = list.map(function (pair) {
      return '<a href="#/word/' + encodeURIComponent(pair[0]) + '">' + esc(pair[1]) + "</a>";
    }).join("");
    suggestionsBox.hidden = false;
  }

  function renderHome() {
    main.innerHTML =
      '<section class="home">' +
      "<h2>Look up a word as Webster defined it in 1828</h2>" +
      "<p>Noah Webster's <i>An American Dictionary of the English Language</i> was the first American dictionary. " +
      "It holds about 61,500 words, spelled and defined the way Americans used them nearly two hundred years ago.</p>" +
      "<p>Type a word in the box above, or browse by letter. Tap a word to see its full 1828 definition.</p>" +
      '<p class="random"><button type="button" id="random-word">Show me a random word</button></p>' +
      "</section>";
    var btn = document.getElementById("random-word");
    if (btn) btn.addEventListener("click", goRandomWord);
  }

  function goRandomWord() {
    loadWordsIndex().then(function () {
      var pair = wordsIndex[Math.floor(Math.random() * wordsIndex.length)];
      location.hash = "#/word/" + encodeURIComponent(pair[0]);
    });
  }

  function renderAbout() {
    main.innerHTML =
      '<section class="about">' +
      "<h2>About this site</h2>" +
      "<p>This is Noah Webster's <i>An American Dictionary of the English Language</i>, published in 1828. " +
      "The book is in the public domain, so anyone may read it, share it, and build on it. This site is free for everyone.</p>" +
      "<h2>The corrections</h2>" +
      "<p>The dictionary text here was checked word by word against the scanned 1828 printed pages and against " +
      "the live dictionary site at <a href=\"https://1828.mshaffer.com\">1828.mshaffer.com</a>. " +
      "491 small machine-reading errors were found and fixed in this text &mdash; for example, COOL used to read " +
      "&ldquo;ice wools water&rdquo; and now reads &ldquo;ice cools water&rdquo; as Webster printed it.</p>" +
      "<p>The checking was done by Larry Kendrick and Harlan Stephen Kendrick, and the corrections were sent to " +
      "Monte Shaffer, who keeps <a href=\"https://1828.mshaffer.com\">1828.mshaffer.com</a> online free for everyone, " +
      "and offered to him as a <a href=\"https://github.com/DataWar/1828-dictionary/pull/1\">pull request on GitHub</a>.</p>" +
      "<h2>Credit</h2>" +
      "<p>The dictionary data on this site comes from Monte Shaffer's open project " +
      "<a href=\"https://github.com/DataWar/1828-dictionary\">DataWar/1828-dictionary</a>, " +
      "which keeps Webster's 1828 text in a public database. Our thanks to Monte for keeping it free.</p>" +
      "<p>Webster's spellings are his own &mdash; <i>crystalized</i>, <i>alledged</i>, <i>traffick</i> and the like " +
      "are printed as they were in 1828, not as errors.</p>" +
      "</section>";
  }

  function renderLetter(letter) {
    main.innerHTML = '<p class="loading">Loading words beginning with ' + esc(letter.toUpperCase()) + "&hellip;</p>";
    loadLetter(letter).then(function (entries) {
      var words = Object.keys(entries).sort(function (a, b) {
        return a.localeCompare(b);
      });
      var html = '<section class="browse"><h2>Words beginning with ' + esc(letter.toUpperCase()) + "</h2>";
      html += "<p>" + words.length.toLocaleString() + " words.</p>";
      html += '<ul class="wordlist">';
      words.forEach(function (w) {
        html += '<li><a href="#/word/' + encodeURIComponent(w) + '">' + esc(entries[w].h) + "</a></li>";
      });
      html += "</ul></section>";
      main.innerHTML = html;
    }).catch(function () {
      main.innerHTML = '<p class="error">Could not load that letter. Please try again.</p>';
    });
  }

  function renderNotFound(q) {
    var list = suggestionsFor(q, 8);
    var html = '<section class="notfound"><h2>No entry for &ldquo;' + esc(q) + "&rdquo;</h2>";
    if (list.length) {
      html += "<p>Did you mean one of these?</p><ul>";
      list.forEach(function (pair) {
        html += '<li><a href="#/word/' + encodeURIComponent(pair[0]) + '">' + esc(pair[1]) + "</a></li>";
      });
      html += "</ul>";
    } else {
      html += "<p>Try another spelling, or browse by letter above.</p>";
    }
    html += "</section>";
    main.innerHTML = html;
  }

  function renderWord(word) {
    main.innerHTML = '<p class="loading">Loading &ldquo;' + esc(word) + "&rdquo;&hellip;</p>";
    loadWordsIndex().then(function () {
      var exact = findWord(word);
      if (!exact) { renderNotFound(word); return; }
      return loadLetter(firstLetter(exact)).then(function (entries) {
        var entry = entries[exact];
        if (!entry) { renderNotFound(word); return; }
        var idx = -1;
        for (var i = 0; i < wordsIndex.length; i++) {
          if (wordsIndex[i][0] === exact) { idx = i; break; }
        }
        var prev = idx > 0 ? wordsIndex[idx - 1] : null;
        var next = idx >= 0 && idx < wordsIndex.length - 1 ? wordsIndex[idx + 1] : null;
        var html = '<article class="entry"><h2>' + esc(entry.h) + "</h2>";
        html += '<div class="definition">' + entry.c + "</div>";
        html += '<nav class="wordnav" aria-label="Previous and next words"><span>';
        if (prev) html += '&larr; <a href="#/word/' + encodeURIComponent(prev[0]) + '">' + esc(prev[1]) + "</a>";
        html += "</span><span>";
        if (next) html += '<a href="#/word/' + encodeURIComponent(next[0]) + '">' + esc(next[1]) + "</a> &rarr;";
        html += "</span></nav></article>";
        main.innerHTML = html;
        document.title = entry.h + " — Webster's 1828 Dictionary";
      });
    }).catch(function () {
      main.innerHTML = '<p class="error">Could not load that word. Please try again.</p>';
    });
  }

  function route() {
    var hash = location.hash || "#/";
    var parts = hash.replace(/^#\/?/, "").split("/");
    var kind = parts[0] || "";
    if (kind === "word" && parts[1]) {
      renderWord(normalize(decodeURIComponent(parts[1])));
    } else if (kind === "letter" && parts[1]) {
      renderLetter(parts[1].toLowerCase());
    } else if (kind === "about") {
      document.title = "About — Webster's 1828 Dictionary";
      renderAbout();
    } else {
      document.title = "Webster's 1828 Dictionary";
      renderHome();
    }
    window.scrollTo(0, 0);
  }

  // Letter navigation.
  (function buildLetters() {
    var html = "";
    for (var i = 0; i < 26; i++) {
      var letter = String.fromCharCode(97 + i);
      html += '<a href="#/letter/' + letter + '">' + letter.toUpperCase() + "</a>";
    }
    lettersNav.innerHTML = html;
  })();

  searchForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var q = normalize(searchBox.value);
    if (!q) return;
    hideSuggestions();
    location.hash = "#/word/" + encodeURIComponent(q);
  });

  searchBox.addEventListener("input", function () {
    var q = searchBox.value;
    if (q.trim().length < 2) { hideSuggestions(); return; }
    loadWordsIndex().then(function () { showSuggestions(q); }).catch(function () {});
  });

  searchBox.addEventListener("blur", function () {
    setTimeout(hideSuggestions, 200);
  });

  searchBox.addEventListener("focus", function () {
    if (searchBox.value.trim().length >= 2) showSuggestions(searchBox.value);
  });

  window.addEventListener("hashchange", function () {
    hideSuggestions();
    route();
  });

  loadWordsIndex().catch(function () {
    main.innerHTML = '<p class="error">The dictionary data could not be loaded. Please check your connection and try again.</p>';
  });
  route();
})();
