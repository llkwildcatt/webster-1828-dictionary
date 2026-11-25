/* Webster's 1828 Dictionary — static site.
   Data: data/words.json (word list for search) and data/<letter>.json (entries).
   Routing is by hash: #/word/<word>, #/letter/<letter>, #/about, #/ (home). */
(function () {
  "use strict";

  // BUILD_V is replaced with the deploy timestamp by deploy-site.py, so
  // every deploy gives the data files a fresh URL and browsers cannot keep
  // serving the previous deploy's cached JSON.
  var BUILD_V = "20261125161042";
  function bust(u) { return u + "?v=" + BUILD_V; }

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
      wordsIndexPromise = fetch(bust("data/words.json"))
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
    return fetch(bust("data/" + letter + ".json"))
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
      '<section class="bible-feature">' +
      "<h2>More dictionaries</h2>" +
      "<p>Black's Law Dictionary, 1st edition (1891) and 2nd edition (1910), " +
      "Webster's American Dictionary, 1844 edition, and Webster's Revised Unabridged Dictionary, 1913. " +
      "All free to read and search, like the 1828.</p>" +
      '<p><a href="#/dictionaries/">Browse all five dictionaries</a></p>' +
      "</section>" +
      '<section class="bible-feature">' +
      "<h2>Encyclopaedia Britannica</h2>" +
      "<p>The 1st edition (1768–1771), all three volumes, and the 2nd edition (1778–1783), all ten volumes — " +
      "22,919 articles between them, cleaned up word by word from the printed books. More editions to come, " +
      "one at a time, each cleaned the same way.</p>" +
      '<p><a href="#/britannica/">Browse the Britannica editions</a></p>' +
      "</section>" +
      '<section class="bible-feature">' +
      "<h2>Follow the Dictionary on Facebook</h2>" +
      "<p>News and notes from Noah Webster&rsquo;s 1828 Dictionary Online, our Facebook page.</p>" +
      '<iframe src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2FNoahWebster1828DictionaryOnline&amp;tabs=timeline&amp;width=500&amp;height=600&amp;small_header=false&amp;adapt_container_width=true&amp;hide_cover=false&amp;show_facepile=true" width="500" height="600" style="border:none;overflow:hidden;max-width:100%" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>' +
      '<p><a href="https://www.facebook.com/NoahWebster1828DictionaryOnline" target="_blank" rel="noopener">Visit the Facebook page</a></p>' +
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
      "<h2>The other dictionaries</h2>" +
      "<p>Black's Law Dictionary, 1st edition (1891) and 2nd edition (1910), are scanned from the printed books; " +
      "the text was machine-read, so a word can be misread here and there. Webster's American Dictionary, " +
      "1844 edition, is the 1841 revised edition reprinted by Harper in 1844. Webster's Revised Unabridged " +
      "Dictionary, 1913, comes from the GNU Collaborative International Dictionary (GCIDE), built from the 1913 " +
      "edition; it holds the entries only, without the book's front matter or illustrations. All four are in " +
      "the public domain.</p>" +
      "<h2>The Encyclopaedia Britannica</h2>" +
      "<p>The 1st edition (1768–1771), all three volumes, is on this site — 12,409 articles, 2,582,673 words — " +
      "and the 2nd edition (1778–1783), all ten volumes, is too — 10,510 articles, 10,644,920 words. " +
      "The text was machine-read from scans of the printed books and cleaned up word by word: 281,230 errors fixed " +
      "in the 1st edition and 1,585,123 in the 2nd, including the long s (&fnof;) the scanner read as f, so " +
      "&ldquo;fcience&rdquo; reads &ldquo;science&rdquo; again. Some words are still unresolved or garbled, and the " +
      "article page numbers are estimates. The spellings are the books' own, as printed. More editions will follow, " +
      "one at a time, each cleaned the same way.</p>" +
      "<h2>The founding documents</h2>" +
      "<p>The Declaration of Independence, the Constitution with all 27 amendments, the Bill of Rights, the " +
      "Articles of Confederation, all 85 Federalist Papers, the Northwest Ordinance, and Washington's Farewell " +
      "Address are on this site too, transcribed as printed, plus a page of exact quotations about God and faith " +
      "from those documents.</p>" +
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
      bibleBooksPromise = fetch(bust("data/bible/books.json"))
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
    return fetch(bust("data/bible/" + slug + ".json"))
      .then(function (r) {
        if (!r.ok) throw new Error("book " + slug + " failed: " + r.status);
        return r.json();
      })
      .then(function (data) { bibleBookCache[slug] = data; return data; });
  }

  function loadBibleVerses() {
    if (!bibleVersesPromise) {
      bibleVersesPromise = fetch(bust("data/bible/verses.json"))
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
      documentsPromise = fetch(bust("data/documents.json"))
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

  /* ---- Additional dictionaries (Black's 1st/2nd, Webster 1844/1913) ---- */

  var DICTS = {
    "blacks-1st": { title: "Black's Law Dictionary, 1st edition", year: "1891",
      dir: "data/blacks-1st", count: "15,934 words",
      note: "Scanned from the 1891 printed book and corrected against two other scans of the same book — 1,766 OCR errors fixed (Nov 2026). A word can still be misread here and there." },
    "blacks-2nd": { title: "Black's Law Dictionary, 2nd edition", year: "1910",
      dir: "data/blacks-2nd", count: "12,230 words",
      note: "Scanned from the 1910 printed book and corrected against two other scans of the same book — 6,691 OCR errors fixed (Nov 2026). A word can still be misread here and there." },
    "webster-1844": { title: "Webster's American Dictionary", year: "1844",
      dir: "data/webster-1844", count: "46,651 words",
      note: "The 1841 revised edition, reprinted by Harper in 1844 with added appendix words. Scanned text; some words are misread." },
    "webster-1913": { title: "Webster's Revised Unabridged Dictionary", year: "1913",
      dir: "data/webster-1913", count: "96,426 words",
      note: "From the GNU Collaborative International Dictionary (GCIDE), built from the 1913 edition. Entries only; no front matter or illustrations." },
  };

  var dictWordsCache = {};    // slug -> [[key, display], ...]
  var dictWordsPromise = {};  // slug -> promise
  var dictLetterCache = {};   // slug -> {letter -> {key: [{h, c}, ...]}}

  function dictKey(q) {
    return (q || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function loadDictWords(slug) {
    if (!dictWordsPromise[slug]) {
      dictWordsPromise[slug] = fetch(bust(DICTS[slug].dir + "/words.json"))
        .then(function (r) {
          if (!r.ok) throw new Error(slug + " words.json failed: " + r.status);
          return r.json();
        })
        .then(function (data) { dictWordsCache[slug] = data; return data; });
    }
    return dictWordsPromise[slug];
  }

  function loadDictLetter(slug, letter) {
    letter = (letter || "#").toLowerCase();
    dictLetterCache[slug] = dictLetterCache[slug] || {};
    if (dictLetterCache[slug][letter]) return Promise.resolve(dictLetterCache[slug][letter]);
    return fetch(bust(DICTS[slug].dir + "/" + letter + ".json"))
      .then(function (r) {
        if (!r.ok) throw new Error(slug + " letter " + letter + " failed: " + r.status);
        return r.json();
      })
      .then(function (data) { dictLetterCache[slug][letter] = data; return data; });
  }

  function findDictWord(slug, q) {
    var index = dictWordsCache[slug];
    if (!index) return null;
    var lo = 0, hi = index.length - 1;
    while (lo <= hi) {
      var mid = (lo + hi) >> 1;
      var w = index[mid][0];
      if (w === q) return w;
      if (w < q) lo = mid + 1; else hi = mid - 1;
    }
    return null;
  }

  function dictSuggestionsFor(slug, q, limit) {
    var index = dictWordsCache[slug];
    if (!index || !q) return [];
    var out = [];
    var i, w;
    for (i = 0; i < index.length && out.length < limit; i++) {
      w = index[i][0];
      if (w.indexOf(q) === 0) out.push(index[i]);
    }
    if (out.length < limit) {
      for (i = 0; i < index.length && out.length < limit; i++) {
        w = index[i][0];
        if (w.indexOf(q) > 0 && out.indexOf(index[i]) === -1) out.push(index[i]);
      }
    }
    return out;
  }

  function dictLettersHtml(slug) {
    var html = "";
    for (var i = 0; i < 26; i++) {
      var letter = String.fromCharCode(97 + i);
      html += '<a href="#/' + slug + "/letter/" + letter + '">' + letter.toUpperCase() + "</a>";
    }
    return html;
  }

  function renderDictionariesHome() {
    var html = '<section class="bible"><h2>Dictionaries</h2>' +
      "<p>Five dictionaries, all in the public domain, all free to read and search.</p>" +
      '<ul class="doclist">' +
      '<li><a href="#/">Webster\'s 1828 Dictionary</a><br>Noah Webster\'s <i>An American Dictionary of the English Language</i>, 1828. About 61,500 words, checked word by word against the printed pages, with 491 machine-reading errors fixed.</li>';
    Object.keys(DICTS).forEach(function (slug) {
      var d = DICTS[slug];
      html += '<li><a href="#/' + slug + '/">' + esc(d.title) + " (" + d.year + ")</a><br>" +
        esc(d.count) + ". " + esc(d.note) + "</li>";
    });
    html += "</ul></section>";
    main.innerHTML = html;
    document.title = "Dictionaries — Webster's 1828 Dictionary";
  }

  function renderDictHome(slug) {
    var d = DICTS[slug];
    main.innerHTML = '<p class="loading">Loading ' + esc(d.title) + "&hellip;</p>";
    loadDictWords(slug).then(function () {
      var html = '<section class="bible"><h2>' + esc(d.title) + " (" + d.year + ")</h2>" +
        "<p>" + esc(d.count) + ". " + esc(d.note) + "</p>" +
        '<form id="dict-search-form" autocomplete="off">' +
        '<label class="visually-hidden" for="dict-search-box">Look up a word</label>' +
        '<input id="dict-search-box" type="search" placeholder="Look up a word&hellip;" aria-label="Look up a word">' +
        "<button type=\"submit\">Look up</button>" +
        "</form>" +
        '<nav class="letters" aria-label="Browse by letter">' + dictLettersHtml(slug) + "</nav>" +
        '<p class="random"><button type="button" id="dict-random-word">Show me a random word</button></p>' +
        '<p><a href="#/dictionaries/">&larr; All dictionaries</a></p>' +
        "</section>";
      main.innerHTML = html;
      document.title = d.title + " (" + d.year + ")";
      var form = document.getElementById("dict-search-form");
      if (form) form.addEventListener("submit", function (e) {
        e.preventDefault();
        var q = dictKey(document.getElementById("dict-search-box").value);
        if (q) location.hash = "#/" + slug + "/word/" + encodeURIComponent(q);
      });
      var btn = document.getElementById("dict-random-word");
      if (btn) btn.addEventListener("click", function () {
        var index = dictWordsCache[slug];
        var pair = index[Math.floor(Math.random() * index.length)];
        location.hash = "#/" + slug + "/word/" + encodeURIComponent(pair[0]);
      });
    }).catch(function () {
      main.innerHTML = '<p class="error">Could not load that dictionary. Please try again.</p>';
    });
  }

  function renderDictNotFound(slug, q) {
    var d = DICTS[slug];
    var list = dictSuggestionsFor(slug, q, 8);
    var html = '<section class="notfound"><h2>No entry for &ldquo;' + esc(q) + "&rdquo; in " + esc(d.title) + "</h2>";
    if (list.length) {
      html += "<p>Did you mean one of these?</p><ul>";
      list.forEach(function (pair) {
        html += '<li><a href="#/' + slug + "/word/" + encodeURIComponent(pair[0]) + '">' + esc(pair[1]) + "</a></li>";
      });
      html += "</ul>";
    } else {
      html += "<p>Try another spelling, or browse by letter above.</p>";
    }
    html += '<p><a href="#/' + slug + '/">&larr; Back to ' + esc(d.title) + "</a></p></section>";
    main.innerHTML = html;
  }

  function renderDictWord(slug, word) {
    var d = DICTS[slug];
    main.innerHTML = '<p class="loading">Loading &ldquo;' + esc(word) + "&rdquo;&hellip;</p>";
    loadDictWords(slug).then(function () {
      var exact = findDictWord(slug, word);
      if (!exact) { renderDictNotFound(slug, word); return; }
      return loadDictLetter(slug, firstLetter(exact)).then(function (entries) {
        var list = entries[exact];
        if (!list || !list.length) { renderDictNotFound(slug, word); return; }
        var index = dictWordsCache[slug];
        var idx = -1;
        for (var i = 0; i < index.length; i++) {
          if (index[i][0] === exact) { idx = i; break; }
        }
        var prev = idx > 0 ? index[idx - 1] : null;
        var next = idx >= 0 && idx < index.length - 1 ? index[idx + 1] : null;
        var html = '<article class="entry"><h2>' + esc(list[0].h) + "</h2>";
        list.forEach(function (entry) {
          html += '<div class="definition">' + entry.c + "</div>";
        });
        html += '<nav class="wordnav" aria-label="Previous and next words"><span>';
        if (prev) html += '&larr; <a href="#/' + slug + "/word/" + encodeURIComponent(prev[0]) + '">' + esc(prev[1]) + "</a>";
        html += "</span><span>";
        if (next) html += '<a href="#/' + slug + "/word/" + encodeURIComponent(next[0]) + '">' + esc(next[1]) + "</a> &rarr;";
        html += "</span></nav>";
        html += '<p><a href="#/' + slug + '/">&larr; ' + esc(d.title) + "</a></p></article>";
        main.innerHTML = html;
        document.title = list[0].h + " — " + d.title;
      });
    }).catch(function () {
      main.innerHTML = '<p class="error">Could not load that word. Please try again.</p>';
    });
  }

  function renderDictLetter(slug, letter) {
    var d = DICTS[slug];
    main.innerHTML = '<p class="loading">Loading words beginning with ' + esc(letter.toUpperCase()) + "&hellip;</p>";
    loadDictLetter(slug, letter).then(function (entries) {
      var keys = Object.keys(entries).sort(function (a, b) { return a.localeCompare(b); });
      var html = '<section class="browse"><h2>' + esc(d.title) + " &mdash; words beginning with " + esc(letter.toUpperCase()) + "</h2>";
      html += "<p>" + keys.length.toLocaleString() + " words.</p>";
      html += '<ul class="wordlist">';
      keys.forEach(function (w) {
        html += '<li><a href="#/' + slug + "/word/" + encodeURIComponent(w) + '">' + esc(entries[w][0].h) + "</a></li>";
      });
      html += "</ul>";
      html += '<p><a href="#/' + slug + '/">&larr; ' + esc(d.title) + "</a></p></section>";
      main.innerHTML = html;
      document.title = d.title + " — " + letter.toUpperCase();
    }).catch(function () {
      main.innerHTML = '<p class="error">Could not load that letter. Please try again.</p>';
    });
  }

  // Encyclopaedia Britannica editions. Data shape matches the dictionaries:
  // data/<slug>/<letter>.json is a dict key -> [{h, c}] (paragraph HTML),
  // and words.json is a sorted list of [key, display, volume, page].
  // Article page numbers are interpolated estimates (about ±20 pages),
  // except the twelve Volume I treatise pages, which are exact.
  var BRIT = {
    "britannica-1st": {
      title: "Encyclopaedia Britannica, 1st edition",
      years: "1768–1771",
      dir: "data/britannica-1st",
      count: "12,409 articles",
      note: "Scanned from the 1768–1771 printed books and cleaned up word by word — 281,230 machine-reading errors fixed, including the long s the scanner read as f. About one word in seventy is still unresolved or garbled; article page numbers are estimates."
    },
    "britannica-2nd": {
      title: "Encyclopaedia Britannica, 2nd edition",
      years: "1778–1783",
      dir: "data/britannica-2nd",
      count: "10,510 articles",
      note: "Scanned from the 1778–1783 printed books and cleaned up word by word — 1,585,123 machine-reading errors fixed, including the long s the scanner read as f. About 64,000 words are still unresolved or garbled; the pages run continuously 1–9199 across all ten volumes, and article page numbers are estimates."
    },
  };

  var britWordsCache = {};    // slug -> [[key, display, volume, page], ...]
  var britWordsPromise = {};  // slug -> promise
  var britLetterCache = {};   // slug -> {letter -> {key: [{h, c}, ...]}}

  function britKey(q) {
    return (q || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function britRoman(n) {
    return ["", "I", "II", "III", "IV", "V"][n] || String(n);
  }

  function loadBritWords(slug) {
    if (!britWordsPromise[slug]) {
      britWordsPromise[slug] = fetch(bust(BRIT[slug].dir + "/words.json"))
        .then(function (r) {
          if (!r.ok) throw new Error(slug + " words.json failed: " + r.status);
          return r.json();
        })
        .then(function (data) { britWordsCache[slug] = data; return data; });
    }
    return britWordsPromise[slug];
  }

  function loadBritLetter(slug, letter) {
    letter = (letter || "#").toLowerCase();
    britLetterCache[slug] = britLetterCache[slug] || {};
    if (britLetterCache[slug][letter]) return Promise.resolve(britLetterCache[slug][letter]);
    return fetch(bust(BRIT[slug].dir + "/" + letter + ".json"))
      .then(function (r) {
        if (!r.ok) throw new Error(slug + " letter " + letter + " failed: " + r.status);
        return r.json();
      })
      .then(function (data) { britLetterCache[slug][letter] = data; return data; });
  }

  // Binary search over the sorted words index; returns the first index of
  // the key, or -1 when the key is absent.
  function findBritArticle(slug, q) {
    var index = britWordsCache[slug];
    if (!index) return -1;
    var lo = 0, hi = index.length - 1, found = -1;
    while (lo <= hi) {
      var mid = (lo + hi) >> 1;
      var w = index[mid][0];
      if (w === q) { found = mid; hi = mid - 1; }
      else if (w < q) lo = mid + 1;
      else hi = mid - 1;
    }
    return found;
  }

  function britEntriesFor(slug, q) {
    var index = britWordsCache[slug];
    if (!index) return [];
    var out = [];
    for (var i = 0; i < index.length; i++) {
      if (index[i][0] === q) out.push(index[i]);
    }
    return out;
  }

  function britSuggestionsFor(slug, q, limit) {
    var index = britWordsCache[slug];
    if (!index || !q) return [];
    var out = [];
    var i, w;
    for (i = 0; i < index.length && out.length < limit; i++) {
      w = index[i][0];
      if (w.indexOf(q) === 0 && out.indexOf(index[i]) === -1) out.push(index[i]);
    }
    if (out.length < limit) {
      for (i = 0; i < index.length && out.length < limit; i++) {
        w = index[i][0];
        if (w.indexOf(q) > 0 && out.indexOf(index[i]) === -1) out.push(index[i]);
      }
    }
    return out;
  }

  function renderBritannicaHome() {
    var html = '<section class="bible"><h2>Encyclopaedia Britannica</h2>' +
      "<p>Every edition from the 1st (1768) through the 13th (1926) is in the public domain. " +
      "They are being added one at a time, each cleaned up word by word from the printed books.</p>" +
      '<ul class="doclist">';
    Object.keys(BRIT).forEach(function (slug) {
      var d = BRIT[slug];
      html += '<li><a href="#/' + slug + '/">' + esc(d.title) + " (" + d.years + ")</a><br>" +
        esc(d.count) + ". " + esc(d.note) + "</li>";
    });
    html += "</ul></section>";
    main.innerHTML = html;
    document.title = "Encyclopaedia Britannica — Webster's 1828 Dictionary";
  }

  function renderBritHome(slug) {
    var d = BRIT[slug];
    main.innerHTML = '<p class="loading">Loading ' + esc(d.title) + "&hellip;</p>";
    loadBritWords(slug).then(function () {
      var html = '<section class="bible"><h2>' + esc(d.title) + " (" + d.years + ")</h2>" +
        "<p>" + esc(d.count) + ". " + esc(d.note) + "</p>" +
        '<form id="brit-search-form" autocomplete="off">' +
        '<label class="visually-hidden" for="brit-search-box">Look up an article</label>' +
        '<input id="brit-search-box" type="search" placeholder="Look up an article&hellip; e.g. America, Anatomy" aria-label="Look up an article">' +
        "<button type=\"submit\">Look up</button>" +
        "</form>" +
        '<nav class="letters" aria-label="Browse by letter">' + dictLettersHtml(slug) + "</nav>" +
        '<p class="random"><button type="button" id="brit-random-article">Show me a random article</button></p>' +
        '<p><a href="#/britannica/">&larr; All Britannica editions</a></p>' +
        "</section>";
      main.innerHTML = html;
      document.title = d.title + " (" + d.years + ")";
      var form = document.getElementById("brit-search-form");
      if (form) form.addEventListener("submit", function (e) {
        e.preventDefault();
        var q = britKey(document.getElementById("brit-search-box").value);
        if (q) location.hash = "#/" + slug + "/article/" + encodeURIComponent(q);
      });
      var btn = document.getElementById("brit-random-article");
      if (btn) btn.addEventListener("click", function () {
        var index = britWordsCache[slug];
        var pair = index[Math.floor(Math.random() * index.length)];
        location.hash = "#/" + slug + "/article/" + encodeURIComponent(pair[0]);
      });
    }).catch(function () {
      main.innerHTML = '<p class="error">Could not load that edition. Please try again.</p>';
    });
  }

  function renderBritLetter(slug, letter) {
    var d = BRIT[slug];
    main.innerHTML = '<p class="loading">Loading articles beginning with ' + esc(letter.toUpperCase()) + "&hellip;</p>";
    loadBritLetter(slug, letter).then(function (entries) {
      var keys = Object.keys(entries).sort(function (a, b) { return a.localeCompare(b); });
      var html = '<section class="browse"><h2>' + esc(d.title) + " &mdash; articles beginning with " + esc(letter.toUpperCase()) + "</h2>";
      html += "<p>" + keys.length.toLocaleString() + " articles.</p>";
      html += '<ul class="wordlist">';
      keys.forEach(function (w) {
        html += '<li><a href="#/' + slug + "/article/" + encodeURIComponent(w) + '">' + esc(entries[w][0].h) + "</a></li>";
      });
      html += "</ul>";
      html += '<p><a href="#/' + slug + '/">&larr; ' + esc(d.title) + "</a></p></section>";
      main.innerHTML = html;
      document.title = d.title + " — " + letter.toUpperCase();
    }).catch(function () {
      main.innerHTML = '<p class="error">Could not load that letter. Please try again.</p>';
    });
  }

  function renderBritNotFound(slug, q) {
    var d = BRIT[slug];
    var list = britSuggestionsFor(slug, q, 8);
    var html = '<section class="notfound"><h2>No article for &ldquo;' + esc(q) + "&rdquo; in " + esc(d.title) + "</h2>";
    if (list.length) {
      html += "<p>Did you mean one of these?</p><ul>";
      list.forEach(function (pair) {
        html += '<li><a href="#/' + slug + "/article/" + encodeURIComponent(pair[0]) + '">' + esc(pair[1]) + "</a></li>";
      });
      html += "</ul>";
    } else {
      html += "<p>Try another spelling, or browse by letter above.</p>";
    }
    html += '<p><a href="#/' + slug + '/">&larr; Back to ' + esc(d.title) + "</a></p></section>";
    main.innerHTML = html;
  }

  function renderBritArticle(slug, key) {
    var d = BRIT[slug];
    main.innerHTML = '<p class="loading">Loading &ldquo;' + esc(key) + "&rdquo;&hellip;</p>";
    loadBritWords(slug).then(function () {
      var idx = findBritArticle(slug, key);
      if (idx < 0) { renderBritNotFound(slug, key); return; }
      return loadBritLetter(slug, firstLetter(key)).then(function (entries) {
        var list = entries[key];
        if (!list || !list.length) { renderBritNotFound(slug, key); return; }
        var index = britWordsCache[slug];
        // words.json entries for this key, in the same order as the
        // letter-file list, carry each article's volume and page.
        var meta = britEntriesFor(slug, key);
        var prev = idx > 0 ? index[idx - 1] : null;
        var next = idx + list.length < index.length ? index[idx + list.length] : null;
        var html = '<article class="entry"><h2>' + esc(list[0].h) + "</h2>";
        list.forEach(function (entry, i) {
          var m = meta[i];
          if (m && m[3] != null) {
            html += '<p class="article-meta">Volume ' + britRoman(m[2]) + " &middot; about page " + m[3] + "</p>";
          } else if (m) {
            html += '<p class="article-meta">Volume ' + britRoman(m[2]) + "</p>";
          }
          html += '<div class="definition">' + entry.c + "</div>";
        });
        html += '<nav class="wordnav" aria-label="Previous and next articles"><span>';
        if (prev) html += '&larr; <a href="#/' + slug + "/article/" + encodeURIComponent(prev[0]) + '">' + esc(prev[1]) + "</a>";
        html += "</span><span>";
        if (next) html += '<a href="#/' + slug + "/article/" + encodeURIComponent(next[0]) + '">' + esc(next[1]) + "</a> &rarr;";
        html += "</span></nav>";
        html += '<p><a href="#/' + slug + '/">&larr; ' + esc(d.title) + "</a></p></article>";
        main.innerHTML = html;
        document.title = list[0].h + " — " + d.title;
      });
    }).catch(function () {
      main.innerHTML = '<p class="error">Could not load that article. Please try again.</p>';
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
    } else if (kind === "dictionaries") {
      document.title = "Dictionaries — Webster's 1828 Dictionary";
      renderDictionariesHome();
    } else if (kind === "britannica") {
      document.title = "Encyclopaedia Britannica — Webster's 1828 Dictionary";
      renderBritannicaHome();
    } else if (BRIT[kind]) {
      var bslug = kind;
      if (parts[1] === "article" && parts[2]) {
        renderBritArticle(bslug, britKey(decodeURIComponent(parts[2])));
      } else if (parts[1] === "letter" && parts[2]) {
        renderBritLetter(bslug, parts[2].toLowerCase());
      } else {
        renderBritHome(bslug);
      }
    } else if (DICTS[kind]) {
      var slug = kind;
      if (parts[1] === "word" && parts[2]) {
        renderDictWord(slug, dictKey(decodeURIComponent(parts[2])));
      } else if (parts[1] === "letter" && parts[2]) {
        renderDictLetter(slug, parts[2].toLowerCase());
      } else {
        renderDictHome(slug);
      }
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
