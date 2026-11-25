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
      '<section class="bible-feature">' +
      "<h2>The Holy Bible</h2>" +
      "<p>King James Version &mdash; the whole Bible, free to read and search. 66 books, 1,189 chapters, 31,102 verses.</p>" +
      '<form id="bible-ref-form" autocomplete="off">' +
      '<label class="visually-hidden" for="bible-ref-box">Look up a Bible passage</label>' +
      '<input id="bible-ref-box" type="text" placeholder="Look up a passage&hellip; e.g. John 3:16" aria-label="Look up a Bible passage">' +
      "<button type=\"submit\">Read</button>" +
      "</form>" +
      '<form id="bible-word-form" autocomplete="off">' +
      '<label class="visually-hidden" for="bible-word-box">Search the Bible for a word</label>' +
      '<input id="bible-word-box" type="search" placeholder="Search the Bible for a word&hellip; e.g. faith" aria-label="Search the Bible for a word">' +
      "<button type=\"submit\">Search</button>" +
      "</form>" +
      '<p><a href="#/bible/">Browse all 66 books</a></p>' +
      "</section>" +
      '<section class="home">' +
      "<h2>Look up a word as Webster defined it in 1828</h2>" +
      "<p>Noah Webster's <i>An American Dictionary of the English Language</i> was the first American dictionary. " +
      "It holds about 61,500 words, spelled and defined the way Americans used them nearly two hundred years ago.</p>" +
      "<p>Type a word in the box above, or browse by letter. Tap a word to see its full 1828 definition.</p>" +
      '<p class="random"><button type="button" id="random-word">Show me a random word</button></p>' +
      "</section>";
    var btn = document.getElementById("random-word");
    if (btn) btn.addEventListener("click", goRandomWord);
    var refForm = document.getElementById("bible-ref-form");
    if (refForm) refForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var q = document.getElementById("bible-ref-box").value;
      goBibleReference(q);
    });
    var wordForm = document.getElementById("bible-word-form");
    if (wordForm) wordForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var q = document.getElementById("bible-word-box").value.trim();
      if (q) location.hash = "#/bible/search/" + encodeURIComponent(q);
    });
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
      "<h2>The Holy Bible</h2>" +
      "<p>This site also carries the whole King James Version of the Bible &mdash; 66 books, 1,189 chapters, " +
      "31,102 verses &mdash; free to read and search. The King James Version is in the public domain. " +
      "Look up a passage like John 3:16, or search the whole Bible for a word.</p>" +
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

  /* ---- Holy Bible (King James Version) ---- */

  var bibleBooks = null, bibleBooksPromise = null;
  var bibleBookCache = {};
  var bibleVerses = null, bibleVersesPromise = null;

  function loadBibleBooks() {
    if (!bibleBooksPromise) {
      bibleBooksPromise = fetch("data/bible/books.json")
        .then(function (r) {
          if (!r.ok) throw new Error("books.json failed: " + r.status);
          return r.json();
        })
        .then(function (data) { bibleBooks = data; return data; });
    }
    return bibleBooksPromise;
  }

  function loadBibleBook(slug) {
    if (bibleBookCache[slug]) return Promise.resolve(bibleBookCache[slug]);
    return fetch("data/bible/" + slug + ".json")
      .then(function (r) {
        if (!r.ok) throw new Error("book " + slug + " failed: " + r.status);
        return r.json();
      })
      .then(function (data) { bibleBookCache[slug] = data; return data; });
  }

  function loadBibleVerses() {
    if (!bibleVersesPromise) {
      bibleVersesPromise = fetch("data/bible/verses.json")
        .then(function (r) {
          if (!r.ok) throw new Error("verses.json failed: " + r.status);
          return r.json();
        })
        .then(function (data) { bibleVerses = data; return data; });
    }
    return bibleVersesPromise;
  }

  function bibleBookBySlug(slug) {
    if (!bibleBooks) return null;
    for (var i = 0; i < bibleBooks.length; i++) {
      if (bibleBooks[i].slug === slug) return bibleBooks[i];
    }
    return null;
  }

  function bibleBookByName(name) {
    if (!bibleBooks) return null;
    var n = name.trim().toLowerCase();
    if (n === "psalm") n = "psalms";
    for (var i = 0; i < bibleBooks.length; i++) {
      if (bibleBooks[i].name.toLowerCase() === n) return bibleBooks[i];
    }
    return null;
  }

  function parseReference(q) {
    // Accepts "John 3:16", "1 John 3:16", "Psalms 23", "Genesis 1:1".
    if (!bibleBooks || !q) return null;
    var text = q.trim();
    var best = null, bestLen = 0;
    for (var i = 0; i < bibleBooks.length; i++) {
      var name = bibleBooks[i].name;
      if (text.toLowerCase().indexOf(name.toLowerCase()) === 0 && name.length > bestLen) {
        best = bibleBooks[i]; bestLen = name.length;
      }
    }
    if (!best && text.toLowerCase().indexOf("psalm") === 0) {
      best = bibleBookByName("Psalms"); bestLen = 5;
    }
    if (!best) return null;
    var rest = text.slice(bestLen).trim();
    var m = rest.match(/^(\d+)\s*:\s*(\d+)$/) || rest.match(/^(\d+)$/);
    if (!m) return null;
    var chapter = parseInt(m[1], 10);
    var verse = m[2] ? parseInt(m[2], 10) : null;
    if (chapter < 1 || chapter > best.chapters) return null;
    return { book: best, chapter: chapter, verse: verse };
  }

  function goBibleReference(q) {
    loadBibleBooks().then(function () {
      var ref = parseReference(q);
      if (!ref) {
        location.hash = "#/bible/search/" + encodeURIComponent(q.trim());
        return;
      }
      var hash = "#/bible/" + ref.book.slug + "/" + ref.chapter;
      if (ref.verse) hash += "/" + ref.verse;
      location.hash = hash;
    });
  }

  function refFromId(id) {
    var bookIdx = Math.floor(id / 1000000);
    var chapter = Math.floor((id % 1000000) / 1000);
    var verse = id % 1000;
    var book = bibleBooks ? bibleBooks[bookIdx] : null;
    return { book: book, chapter: chapter, verse: verse };
  }

  function renderBibleHome() {
    main.innerHTML = '<p class="loading">Loading the Bible&hellip;</p>';
    loadBibleBooks().then(function () {
      var ot = bibleBooks.filter(function (b) { return b.testament === "OT"; });
      var nt = bibleBooks.filter(function (b) { return b.testament === "NT"; });
      function list(books) {
        var html = '<ul class="booklist">';
        books.forEach(function (b) {
          html += '<li><a href="#/bible/' + b.slug + '/">' + esc(b.name) +
            " (" + b.chapters + ")</a></li>";
        });
        return html + "</ul>";
      }
      var html = '<section class="bible"><h2>The Holy Bible &mdash; King James Version</h2>' +
        "<p>The whole Bible, free to read and search. 66 books, 1,189 chapters, 31,102 verses. " +
        "The King James Version is in the public domain.</p>" +
        '<form id="bible-word-form2" autocomplete="off">' +
        '<label class="visually-hidden" for="bible-word-box2">Search the Bible for a word</label>' +
        '<input id="bible-word-box2" type="search" placeholder="Search the Bible for a word or phrase&hellip;" aria-label="Search the Bible for a word or phrase">' +
        "<button type=\"submit\">Search</button>" +
        "</form>" +
        "<h3>Old Testament</h3>" + list(ot) +
        "<h3>New Testament</h3>" + list(nt) +
        "</section>";
      main.innerHTML = html;
      var form = document.getElementById("bible-word-form2");
      if (form) form.addEventListener("submit", function (e) {
        e.preventDefault();
        var q = document.getElementById("bible-word-box2").value.trim();
        if (q) location.hash = "#/bible/search/" + encodeURIComponent(q);
      });
    }).catch(function () {
      main.innerHTML = '<p class="error">Could not load the Bible books. Please try again.</p>';
    });
  }

  function renderBibleBook(slug) {
    main.innerHTML = '<p class="loading">Loading&hellip;</p>';
    loadBibleBooks().then(function () {
      var book = bibleBookBySlug(slug);
      if (!book) {
        main.innerHTML = '<p class="error">No such book of the Bible. <a href="#/bible/">See all 66 books</a>.</p>';
        return;
      }
      var html = '<section class="bible"><h2>' + esc(book.name) + "</h2>" +
        "<p>" + (book.testament === "OT" ? "Old Testament" : "New Testament") +
        " &middot; " + book.chapters + (book.chapters === 1 ? " chapter" : " chapters") +
        " &middot; " + book.verses.toLocaleString() + " verses</p>" +
        '<ul class="chapterlist">';
      for (var c = 1; c <= book.chapters; c++) {
        html += '<li><a href="#/bible/' + book.slug + "/" + c + '">' + c + "</a></li>";
      }
      html += '</ul><p><a href="#/bible/">&larr; All books</a></p></section>';
      main.innerHTML = html;
      document.title = book.name + " — Holy Bible (KJV)";
    }).catch(function () {
      main.innerHTML = '<p class="error">Could not load that book. Please try again.</p>';
    });
  }

  function renderBibleChapter(slug, chapter, highlightVerse) {
    main.innerHTML = '<p class="loading">Loading&hellip;</p>';
    loadBibleBooks().then(function () {
      var book = bibleBookBySlug(slug);
      if (!book || chapter < 1 || chapter > book.chapters) {
        main.innerHTML = '<p class="error">No such chapter. <a href="#/bible/">See all 66 books</a>.</p>';
        return;
      }
      return loadBibleBook(slug).then(function (data) {
        var verses = data.chapters[chapter - 1];
        var html = '<section class="bible"><h2>' + esc(book.name) + " " + chapter + "</h2>";
        html += '<div class="chapter">';
        verses.forEach(function (text, i) {
          var v = i + 1;
          var cls = (highlightVerse === v) ? ' class="verse highlight"' : ' class="verse"';
          html += '<p' + cls + ' id="v' + v + '"><span class="vnum">' + v + "</span>" +
            esc(text) + "</p>";
        });
        html += "</div>";
        html += '<nav class="wordnav" aria-label="Previous and next chapters"><span>';
        if (chapter > 1) html += '&larr; <a href="#/bible/' + slug + "/" + (chapter - 1) + '">Chapter ' + (chapter - 1) + "</a>";
        html += '</span><span><a href="#/bible/' + slug + '/">' + esc(book.name) + "</a> &middot; ";
        if (chapter < book.chapters) html += '<a href="#/bible/' + slug + "/" + (chapter + 1) + '">Chapter ' + (chapter + 1) + "</a> &rarr;";
        html += "</span></nav></section>";
        main.innerHTML = html;
        document.title = book.name + " " + chapter + " — Holy Bible (KJV)";
        if (highlightVerse) {
          var el = document.getElementById("v" + highlightVerse);
          if (el) el.scrollIntoView();
        }
      });
    }).catch(function () {
      main.innerHTML = '<p class="error">Could not load that chapter. Please try again.</p>';
    });
  }

  function highlightMatch(text, query) {
    var safe = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    try {
      return esc(text).replace(new RegExp("(" + safe + ")", "ig"), "<mark>$1</mark>");
    } catch (e) {
      return esc(text);
    }
  }

  function renderBibleSearch(query) {
    main.innerHTML = '<p class="loading">Searching the Bible for &ldquo;' + esc(query) + "&rdquo;&hellip;</p>";
    loadBibleBooks().then(function () {
      return loadBibleVerses().then(function () {
        var q = query.toLowerCase();
        var matches = [];
        var total = 0;
        for (var i = 0; i < bibleVerses.length; i++) {
          if (bibleVerses[i][1].toLowerCase().indexOf(q) !== -1) {
            total++;
            if (matches.length < 100) matches.push(bibleVerses[i]);
          }
        }
        var html = '<section class="bible"><h2>&ldquo;' + esc(query) + "&rdquo; in the Bible</h2>";
        if (!total) {
          html += "<p>No verses contain those words. Try another word or spelling.</p>";
        } else {
          html += "<p>" + total.toLocaleString() + (total === 1 ? " verse" : " verses") +
            " found" + (total > 100 ? ", showing the first 100" : "") + ".</p>";
          html += '<ul class="search-results">';
          matches.forEach(function (row) {
            var ref = refFromId(row[0]);
            if (!ref.book) return;
            html += '<li><a href="#/bible/' + ref.book.slug + "/" + ref.chapter + "/" + ref.verse + '">' +
              esc(ref.book.name) + " " + ref.chapter + ":" + ref.verse + "</a> &mdash; " +
              highlightMatch(row[1], query) + "</li>";
          });
          html += "</ul>";
        }
        html += '<p><a href="#/bible/">&larr; Back to the Bible</a></p></section>';
        main.innerHTML = html;
        document.title = "“" + query + "” — Holy Bible (KJV)";
      });
    }).catch(function () {
      main.innerHTML = '<p class="error">Could not search the Bible. Please try again.</p>';
    });
  }

  /* ---- Founding Documents ---- */

  var documentsIndex = null, documentsPromise = null;

  function loadDocuments() {
    if (!documentsPromise) {
      documentsPromise = fetch("data/documents.json")
        .then(function (r) {
          if (!r.ok) throw new Error("documents.json failed: " + r.status);
          return r.json();
        })
        .then(function (data) { documentsIndex = data; return data; });
    }
    return documentsPromise;
  }

  function renderDocumentsHome() {
    main.innerHTML = '<p class="loading">Loading the founding documents&hellip;</p>';
    loadDocuments().then(function () {
      var html = '<section class="bible"><h2>Founding Documents</h2>' +
        "<p>America's founding documents, free to read. The texts are in the public domain, " +
        "transcribed as printed, with original spellings kept.</p>" +
        '<p><a href="docs/christian-nation.html"><strong>God and Faith in the Founding Documents</strong></a> &mdash; ' +
        "every reference to God and faith in these documents, quoted word for word.</p>" +
        '<ul class="doclist">';
      documentsIndex.forEach(function (d) {
        html += '<li><a href="docs/' + d.slug + '.html">' + esc(d.title) + " (" + esc(d.year) + ")</a><br>" +
          esc(d.description) + "</li>";
      });
      html += "</ul></section>";
      main.innerHTML = html;
      document.title = "Founding Documents — Webster's 1828 Dictionary";
    }).catch(function () {
      main.innerHTML = '<p class="error">Could not load the founding documents. Please try again.</p>';
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
    } else if (kind === "bible") {
      document.title = "Holy Bible (KJV) — Webster's 1828 Dictionary";
      if (parts[1] === "search" && parts[2]) {
        renderBibleSearch(decodeURIComponent(parts[2]));
      } else if (parts[1] && parts[2] && parts[3]) {
        renderBibleChapter(parts[1], parseInt(parts[2], 10), parseInt(parts[3], 10));
      } else if (parts[1] && parts[2]) {
        renderBibleChapter(parts[1], parseInt(parts[2], 10), null);
      } else if (parts[1]) {
        renderBibleBook(parts[1]);
      } else {
        renderBibleHome();
      }
    } else if (kind === "documents") {
      document.title = "Founding Documents — Webster's 1828 Dictionary";
      renderDocumentsHome();
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
