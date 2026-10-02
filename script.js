/* ============================================
   Common JavaScript for PE Chemistry Exam Site
   ============================================ */

// GA4 event tracking (quiz engagement)
function trackEvent(name, params) {
  if (typeof gtag === "function") gtag("event", name, params || {});
}

// Launch setup: replace this placeholder with the book's Amazon product URL.
// Until then, show the announcement without a purchase link.
const KINDLE_BOOK = Object.freeze({
  amazonUrl: "https://www.amazon.co.jp/dp/REPLACE_WITH_ASIN",
  title: "技術士第一次試験 化学部門 専門科目 テーマ別完全攻略",
  description: "過去問560問をもとに、頻出39テーマの要点を整理した解説書です。演習問題は本書に収録せず、このサイトで解けます。"
});

function initKindlePromotion() {
  const isAvailable = /^https:\/\/www\.amazon\.co\.jp\/dp\/[A-Z0-9]{10}(?:[/?#]|$)/.test(KINDLE_BOOK.amazonUrl);

  function createLink(placement) {
    const element = document.createElement(isAvailable ? "a" : "div");
    if (isAvailable) {
      element.href = KINDLE_BOOK.amazonUrl;
      element.target = "_blank";
      element.rel = "noopener noreferrer";
      element.addEventListener("click", function () {
        trackEvent("kindle_book_click", { placement: placement });
      });
    }
    return element;
  }

  function createCard(placement, headingTag) {
    const card = createLink(placement);
    card.className = "kindle-promo";

    const format = document.createElement("span");
    format.className = "kindle-promo-format";
    format.textContent = "Kindleでテーマ別に復習";

    const heading = document.createElement(headingTag);
    heading.textContent = KINDLE_BOOK.title;

    const description = document.createElement("p");
    description.textContent = KINDLE_BOOK.description;

    const action = document.createElement("span");
    action.className = "kindle-promo-action";
    action.textContent = isAvailable ? "Amazonで本を見る ↗" : "Kindle版は発売準備中";

    card.append(format, heading, description, action);
    return card;
  }

  document.querySelectorAll("main .note-promo").forEach(function (note) {
    if (note.parentElement.classList.contains("study-promo")) return;
    const group = document.createElement("div");
    group.className = "study-promo";
    note.before(group);
    group.append(note, createCard("study", "h3"));
  });

  const home = document.querySelector("[data-kindle-promo='home']");
  if (home && !home.firstElementChild) {
    home.append(createCard("home", "h2"));
  }

  document.querySelectorAll(".footer-links").forEach(function (footer) {
    if (footer.querySelector(".kindle-footer-link")) return;
    const note = footer.querySelector("a[href='https://note.com/chem_fac/n/nbc0c6a8a3755']");
    if (!note) return;
    const link = createLink("footer");
    link.className = "kindle-footer-link";
    link.textContent = isAvailable ? "Kindle本 ↗" : "Kindle本（発売準備中）";
    note.after(link);
  });
}

// Mobile menu toggle
document.addEventListener("DOMContentLoaded", function () {
  initKindlePromotion();
  const menuBtn = document.getElementById("mobile-menu-btn");
  const nav = document.getElementById("header-nav");

  if (menuBtn && nav) {
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.setAttribute("aria-controls", nav.id || "header-nav");

    menuBtn.addEventListener("click", function () {
      const isOpen = nav.classList.toggle("open");
      menuBtn.classList.toggle("active", isOpen);
      menuBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    // Close menu when clicking a link
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
        menuBtn.classList.remove("active");
        menuBtn.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Subject filter (year page)
  const filterBtns = document.querySelectorAll(".subject-filter-btn");
  if (filterBtns.length > 0) {
    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        const subject = btn.getAttribute("data-subject");

        // Update active state
        filterBtns.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");

        // Filter cards
        const cards = document.querySelectorAll(".question-card");
        cards.forEach(function (card) {
          if (subject === "all" || card.getAttribute("data-subject") === subject) {
            card.style.display = "";
          } else {
            card.style.display = "none";
          }
        });
      });
    });
  }

  initShareButtons();
  initRandomButtons();
});


// Random question buttons (top page / year page / question page)
function initRandomButtons() {
  const buttons = document.querySelectorAll(".btn-random[data-random-target]");
  if (buttons.length === 0) return;

  const siteRoot = getSiteRootFromScript();
  let cache = null;
  let loading = null;

  function loadIndex() {
    if (cache) return Promise.resolve(cache);
    if (loading) return loading;
    loading = fetch(siteRoot + "data/random_index.json", { cache: "no-cache" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (json) { cache = json; return json; });
    return loading;
  }

  function pickAndGo() {
    return loadIndex().then(function (items) {
      if (!items || items.length === 0) return;
      // Avoid landing on the same question we're already on.
      const here = window.location.pathname.replace(/\/+$/, "");
      let pick;
      for (let attempt = 0; attempt < 10; attempt++) {
        pick = items[Math.floor(Math.random() * items.length)];
        const target = "/" + pick.year + "/" + pick.q;
        if (!here.endsWith(target)) break;
      }
      window.location.href = siteRoot + pick.year + "/" + pick.q + "/";
    }).catch(function (err) {
      console.error("Random index load failed:", err);
      alert("ランダム問題の読み込みに失敗しました。時間をおいて再度お試しください。");
    });
  }

  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      trackEvent("random_question");
      btn.disabled = true;
      pickAndGo().finally(function () { btn.disabled = false; });
    });
  });

  // Pre-warm the index after first idle
  if ("requestIdleCallback" in window) {
    requestIdleCallback(function () { loadIndex(); });
  }
}


// Choice click logic (question page)
document.addEventListener("DOMContentLoaded", function () {
  const choiceWrappers = document.querySelectorAll(".choice-wrapper");
  const answerContent = document.getElementById("answer-content");

  if (choiceWrappers.length > 0 && answerContent) {
    const allChoices = Array.from(choiceWrappers).map(w => w.querySelector(".choice-item"));

    choiceWrappers.forEach(function (wrapper) {
      const choice = wrapper.querySelector(".choice-item");
      const eliminateBtn = wrapper.querySelector(".choice-eliminate-btn");

      // Eliminate button logic
      if (eliminateBtn) {
        eliminateBtn.addEventListener("click", function (e) {
          // No need to stopPropagation if eliminate button is outside choice-item
          if (answerContent.classList.contains("visible")) return; // Cannot eliminate after answering
          wrapper.classList.toggle("eliminated");
        });
      }

      // Answer selection logic
      const clickTarget = wrapper.tagName.toLowerCase() === 'tr' ? wrapper : choice;
      
      clickTarget.addEventListener("click", function (e) {
        if (e.target.closest('.choice-eliminate-btn')) return;

        // If already answered or eliminated, do nothing
        if (answerContent.classList.contains("visible")) return;
        if (wrapper.classList.contains("eliminated")) return;

        // Mark all choices as answered
        allChoices.forEach(function (c) {
          c.classList.add("answered");
          const tr = c.closest("tr");
          if (tr) tr.classList.add("answered");
          
          if (c === choice) {
            c.classList.add("selected");
            if (tr) tr.classList.add("selected");
          }
          
          if (c.getAttribute("data-correct") === "true") {
            c.classList.add("correct");
            if (tr) tr.classList.add("correct");
          } else if (c === choice) {
            c.classList.add("incorrect-selected");
            if (tr) tr.classList.add("incorrect-selected");
          }
        });

        // Hide all eliminate buttons
        choiceWrappers.forEach(function (w) {
          w.classList.add("answered-global");
        });

        // Show answer and explanation
        answerContent.classList.add("visible");

        // GA4: 正誤つきで解答を計測（問題はページパスで識別）
        trackEvent(choice.getAttribute("data-correct") === "true" ? "answer_correct" : "answer_incorrect");
      });
    });
  }
});



// Choice-table edge fade (hint that the table scrolls sideways on narrow screens)
document.addEventListener("DOMContentLoaded", function () {
  const frames = document.querySelectorAll(".choices-abcd-table");
  if (frames.length === 0) return;

  frames.forEach(function (frame) {
    const scroller = frame.querySelector(".choice-table-scroll");
    if (!scroller) return;

    function update() {
      const maxScroll = scroller.scrollWidth - scroller.clientWidth;
      const hasOverflow = maxScroll > 1;
      const x = scroller.scrollLeft;
      frame.classList.toggle("show-right-fade", hasOverflow && x < maxScroll - 1);
      frame.classList.toggle("show-left-fade", hasOverflow && x > 1);
    }

    scroller.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    window.addEventListener("load", update);
    update();
  });
});


function initShareButtons() {
  if (document.getElementById("share-buttons")) return;

  const canonicalHref = document.querySelector('link[rel="canonical"]')?.href;
  const pageUrl = encodeURIComponent(canonicalHref || window.location.href);
  const pageTitle = encodeURIComponent(document.title);
  const assetRoot = getSiteRootFromScript();

  const shareContainer = document.createElement("div");
  shareContainer.className = "share-buttons";
  shareContainer.id = "share-buttons";

  shareContainer.innerHTML = `
    <span class="share-buttons__label">Share</span>
    <a href="https://x.com/intent/tweet?url=${pageUrl}&text=${pageTitle}&via=chem_fac"
       target="_blank" rel="noopener noreferrer"
       class="share-btn share-btn--x" data-tooltip="Xでシェア" aria-label="Xでシェア">
      <img src="${assetRoot}images/x_logo.png" alt="X">
    </a>
    <a href="https://note.com/intent/post?url=${pageUrl}"
       target="_blank" rel="noopener noreferrer"
       class="share-btn share-btn--note" data-tooltip="noteでシェア" aria-label="noteでシェア">
      <img src="${assetRoot}images/note_n.png" alt="note">
    </a>
    <a href="https://social-plugins.line.me/lineit/share?url=${pageUrl}"
       target="_blank" rel="noopener noreferrer"
       class="share-btn share-btn--line" data-tooltip="LINEでシェア" aria-label="LINEでシェア">
      <img src="${assetRoot}images/LINE_icon.png" alt="LINE">
    </a>
    <a href="https://www.facebook.com/sharer/sharer.php?u=${pageUrl}"
       target="_blank" rel="noopener noreferrer"
       class="share-btn share-btn--facebook" data-tooltip="Facebookでシェア" aria-label="Facebookでシェア">
      <img src="${assetRoot}images/Facebook_icon.png" alt="Facebook">
    </a>
  `;

  document.body.appendChild(shareContainer);

  const showAfter = 300;
  const onScroll = function () {
    shareContainer.classList.toggle("visible", window.scrollY > showAfter);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function getSiteRootFromScript() {
  const scriptTag = Array.from(document.scripts).find(function (script) {
    const src = script.getAttribute("src") || "";
    return /(^|\/)script\.js(?:[?#].*)?$/.test(src);
  });

  if (!scriptTag) return "./";

  const src = scriptTag.getAttribute("src") || "";
  return src.replace(/script\.js(?:[?#].*)?$/, "");
}
