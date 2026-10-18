/* ============================================
   Common JavaScript for PE Chemistry Exam Site
   ============================================ */

// GA4 event tracking (quiz engagement)
function trackEvent(name, params) {
  if (typeof gtag === "function") gtag("event", name, params || {});
}

// Kindle book promotion. At launch, paste the Amazon associate link into amazonUrl.
// Until it is a real Amazon link, the site shows the announcement without a purchase link.
const KINDLE_BOOK = Object.freeze({
  amazonUrl: "https://link.amazon/B0bFUwmXz",
  title: "技術士第一次試験 化学部門 専門科目 テーマ別完全攻略",
  description: "16回分・560問の出題分析から選んだ頻出39テーマの要点・原理・頻出のワナを、1テーマずつ解説した参考書です。演習問題は本書に収録せず、このサイトで解けます。",
  cover: "images/book_cover.webp",
  associateNote: "Amazonのアソシエイトとして、ケムファクは適格販売により収入を得ています。",
  // Kindle Unlimited free-trial page (associate link). The book is in Kindle Unlimited while enrolled in KDP Select
  // (term to 2027-01-11). Set inKindleUnlimited to false if the enrollment ends.
  inKindleUnlimited: true,
  kuSignupUrl: "https://www.amazon.co.jp/kindle-dbs/hz/signup?tag=pechemistry-22"
});

// Exam countdown. Shown until the day before the exam, then hidden automatically.
// Update EXAM_DATE when the next exam date is officially announced.
const EXAM_DATE = "2026-11-22";
const EXAM_LABEL = "第一次試験（11月22日）";
const NOTE_SUMMARY_URL = "https://note.com/chem_fac/n/nbc0c6a8a3755";

function daysUntilExam() {
  const now = new Date();
  const jst = new Date(now.getTime() + (now.getTimezoneOffset() + 540) * 60000);
  const today = Date.UTC(jst.getFullYear(), jst.getMonth(), jst.getDate());
  const parts = EXAM_DATE.split("-").map(Number);
  return Math.round((Date.UTC(parts[0], parts[1] - 1, parts[2]) - today) / 86400000);
}

function createCountdownText(days) {
  const text = document.createElement("span");
  text.className = "exam-countdown-text";
  text.append(EXAM_LABEL + "まで あと");
  const num = document.createElement("strong");
  num.className = "num";
  num.textContent = String(days);
  text.append(num, "日");
  return text;
}

function initExamCountdownBar(days) {
  const breadcrumb = document.querySelector("main .breadcrumb");
  const hero = document.querySelector("main > .hero");
  if ((!breadcrumb && !hero) || document.querySelector(".exam-countdown-bar")) return;
  const bar = document.createElement("div");
  bar.className = "exam-countdown-bar";
  const inner = document.createElement("div");
  inner.className = "container";
  const link = document.createElement("a");
  link.href = getSiteRootFromScript() + "#exam-plan";
  link.textContent = "残りの期間の進め方 →";
  link.addEventListener("click", function () { trackEvent("exam_plan_bar"); });
  inner.append(createCountdownText(days), link);
  bar.append(inner);
  if (breadcrumb) breadcrumb.after(bar);
  else hero.before(bar);
}

// A/B test: where the book appears on question pages.
// A = book card below the answer area (visible before answering, next to the note card)
// B = theme-specific card right after the explanation (appears only after answering)
// GA4 events: kindle_ab_{a|b}_view / _answer / _click / _continue
const KINDLE_EXPERIMENT_ID = "kindle_place_v1";
let kindleExperiment = null;

function getOrAssignVariant(experimentId) {
  const isLocal = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
  const localOverride = new URLSearchParams(window.location.search).get("ab_" + experimentId);
  if (isLocal && (localOverride === "A" || localOverride === "B")) return localOverride;

  const storageKey = "ab:" + experimentId;
  try {
    const saved = window.localStorage.getItem(storageKey);
    if (saved === "A" || saved === "B") return saved;
    const assigned = Math.random() < 0.5 ? "A" : "B";
    window.localStorage.setItem(storageKey, assigned);
    return assigned;
  } catch (e) {
    // localStorage may be unavailable in private/restricted browser modes.
    return Math.random() < 0.5 ? "A" : "B";
  }
}

function trackKindleExperiment(step) {
  if (!kindleExperiment || kindleExperiment.sent[step]) return;
  if (step === "continue" && !kindleExperiment.sent.answer) return;
  kindleExperiment.sent[step] = true;
  trackEvent("kindle_ab_" + kindleExperiment.variant.toLowerCase() + "_" + step);
}

function isKindleBookAvailable() {
  return /^https:\/\/(?:www\.amazon\.co\.jp\/(?:[^\/?#]+\/)?(?:dp|gp\/product)\/[A-Z0-9]{10}|link\.amazon\/[A-Za-z0-9]+|amzn\.to\/[A-Za-z0-9]+|amzn\.asia\/d\/[A-Za-z0-9]+)(?:[\/?#]|$)/.test(KINDLE_BOOK.amazonUrl);
}

function initKindlePromotion() {
  const isAvailable = isKindleBookAvailable();
  const siteRoot = getSiteRootFromScript();
  const answerContent = document.getElementById("answer-content");
  const explanation = answerContent ? answerContent.querySelector(".explanation-section") : null;

  if (explanation && isAvailable) {
    kindleExperiment = { variant: getOrAssignVariant(KINDLE_EXPERIMENT_ID), sent: {} };
    document.documentElement.setAttribute("data-kindle-variant", kindleExperiment.variant);
    trackKindleExperiment("view");
  }

  function createLink(placement, tagName) {
    const element = document.createElement(isAvailable ? "a" : (tagName || "div"));
    if (isAvailable) {
      element.href = KINDLE_BOOK.amazonUrl;
      element.target = "_blank";
      element.rel = "noopener noreferrer sponsored";
      element.addEventListener("click", function () {
        trackEvent("kindle_book_click", { placement: placement });
        if (placement === "question_card" || placement === "question_context") {
          trackKindleExperiment("click");
        }
      });
    }
    return element;
  }

  // Small text link to the Kindle Unlimited free trial, placed next to a book card (never inside it).
  function createKuLink(onQuestion) {
    if (!isAvailable || !KINDLE_BOOK.inKindleUnlimited) return null;
    const link = document.createElement("a");
    link.className = "kindle-ku-link";
    link.href = KINDLE_BOOK.kuSignupUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer sponsored";
    link.textContent = "初めての方はKindle Unlimitedの無料体験でも読めます ↗";
    link.addEventListener("click", function () {
      trackEvent("ku_trial_click");
      if (onQuestion) trackKindleExperiment("click");
    });
    return link;
  }

  function createCover(width) {
    const img = document.createElement("img");
    img.className = "kindle-cover";
    img.src = siteRoot + KINDLE_BOOK.cover;
    img.alt = "";
    img.width = width;
    img.height = Math.round(width * 1.6);
    img.loading = "lazy";
    img.decoding = "async";
    return img;
  }

  function createCard(placement, headingTag, options) {
    const opts = options || {};
    const card = createLink(placement);
    card.className = "kindle-promo";

    const body = document.createElement("div");
    body.className = "kindle-promo-body";

    const format = document.createElement("span");
    format.className = "kindle-promo-format";
    format.textContent = opts.label || "運営者の著書";

    const heading = document.createElement(headingTag);
    heading.textContent = KINDLE_BOOK.title;

    const description = document.createElement("p");
    description.textContent = opts.description || KINDLE_BOOK.description;

    const action = document.createElement("span");
    action.className = "kindle-promo-action";
    action.textContent = isAvailable ? "Amazonで無料サンプルを読む ↗" : "Kindle版は発売準備中";

    body.append(format, heading, description, action);
    if (isAvailable) {
      const sub = document.createElement("span");
      sub.className = "kindle-promo-sub";
      sub.textContent = "Kindle Unlimited会員は追加料金なしで読めます・紙の本もあります";
      body.append(sub);
    }
    card.append(createCover(64), body);
    return card;
  }

  // Home page before the exam: countdown and the order of study, with the book card as step 1.
  function createExamPlan(days, card) {
    const plan = document.createElement("section");
    plan.className = "exam-plan";
    plan.id = "exam-plan";
    plan.setAttribute("aria-label", "試験までの進め方");

    const head = document.createElement("p");
    head.className = "exam-plan-countdown";
    head.append(createCountdownText(days));

    const title = document.createElement("h2");
    title.className = "exam-plan-title";
    title.textContent = "残りの期間の進め方";

    const list = document.createElement("ol");
    list.className = "exam-plan-steps";

    function step(heading, text, extra) {
      const item = document.createElement("li");
      const h = document.createElement("h3");
      h.textContent = heading;
      const p = document.createElement("p");
      p.textContent = text;
      item.append(h, p);
      if (extra) item.append(extra);
      list.append(item);
    }

    function stepLink(href, label, stepName, external) {
      const a = document.createElement("a");
      a.className = "exam-plan-link";
      a.href = href;
      a.textContent = label;
      if (external) { a.target = "_blank"; a.rel = "noopener"; }
      a.addEventListener("click", function () { trackEvent("exam_plan_" + stepName); });
      return a;
    }

    const bookBlock = document.createDocumentFragment();
    bookBlock.append(card);
    const kuHome = createKuLink(false);
    if (kuHome) bookBlock.append(kuHome);
    step("頻出テーマの要点を押さえる",
      "16回分・560問の出題分析で選んだ頻出39テーマを、1テーマずつ確認します。", bookBlock);
    step("同じテーマの過去問をまとめて解く",
      "テーマ別インデックスで、論点ごとに過去問を続けて解けます。",
      stepLink(siteRoot + "themes/", "テーマ別インデックスへ →", "themes", false));
    step("直前に要点を見直す",
      "試験直前の総復習用に、忘れやすい要点をメモ形式でまとめたnoteの有料記事があります。",
      stepLink(NOTE_SUMMARY_URL, "noteの「要点まとめ」を見る ↗", "note", true));

    plan.append(head, title, list);
    return plan;
  }

  function createContextCard() {
    const themeLink = document.querySelector(".related-study a[href*='/themes/#s']");
    const theme = themeLink ? themeLink.textContent.replace(/の問題一覧$/, "").trim() : "";

    const card = createLink("question_context");
    card.className = "kindle-context";

    const body = document.createElement("div");
    body.className = "kindle-context-body";

    const label = document.createElement("span");
    label.className = "kindle-context-label";
    label.textContent = "このテーマを本で復習（運営者の著書）";

    const text = document.createElement("p");
    text.textContent = (theme ? "「" + theme + "」" : "このテーマ") +
      "の要点・原理・頻出のワナを、『" + KINDLE_BOOK.title + "』で1テーマずつ解説しています。";

    const action = document.createElement("span");
    action.className = "kindle-context-action";
    action.textContent = "Amazonで無料サンプルを読む ↗（Kindle Unlimited対象）";

    body.append(label, text, action);
    card.append(createCover(48), body);
    return card;
  }

  if (kindleExperiment && kindleExperiment.variant === "B") {
    // Shown inside the answer area, so it appears only after the reader has answered.
    const contextCard = createContextCard();
    explanation.after(contextCard);
    const kuContext = createKuLink(true);
    if (kuContext) contextCard.after(kuContext);
  } else {
    document.querySelectorAll("main .note-promo").forEach(function (note) {
      if (note.parentElement.classList.contains("study-promo")) return;
      const group = document.createElement("div");
      group.className = "study-promo";
      note.before(group);
      group.append(note, createCard(kindleExperiment ? "question_card" : "study", "h3"));
      const kuStudy = createKuLink(!!kindleExperiment);
      if (kuStudy) group.append(kuStudy);
    });
  }

  if (kindleExperiment) {
    const nextControl = Array.from(document.querySelectorAll(".question-nav-btn")).find(function (link) {
      const label = link.querySelector(".question-nav-label");
      return label && label.textContent.trim() === "次の問題";
    });
    const randomControl = document.querySelector('.random-nav .btn-random[data-random-target="question"]');
    [nextControl, randomControl].filter(Boolean).forEach(function (control) {
      control.addEventListener("click", function () { trackKindleExperiment("continue"); });
    });
  }

  const examDays = daysUntilExam();
  const home = document.querySelector("[data-kindle-promo='home']");
  if (home && !home.firstElementChild) {
    if (examDays > 0 && isAvailable) {
      home.append(createExamPlan(examDays, createCard("home", "h4", {
        description: "要点・原理・出題パターン・頻出のワナをテーマごとにまとめた参考書です。演習問題は本書に収録せず、このサイトで解けます。"
      })));
    } else {
      home.append(createCard("home", "h2"));
    }
  }
  if (examDays > 0) {
    initExamCountdownBar(examDays);
  }

  const themeToc = document.querySelector("main .theme-toc");
  if (themeToc && isAvailable && !document.querySelector(".kindle-themes")) {
    const wrap = document.createElement("aside");
    wrap.className = "kindle-themes";
    wrap.setAttribute("aria-label", "書籍のご案内");
    wrap.append(createCard("themes", "h2", {
      description: "この一覧と同じ39テーマについて、要点・原理・出題パターン・頻出のワナを1冊にまとめた参考書です。"
    }));
    const kuThemes = createKuLink(false);
    if (kuThemes) wrap.append(kuThemes);
    themeToc.before(wrap);
  }

  document.querySelectorAll(".footer-links").forEach(function (footer) {
    if (footer.querySelector(".kindle-footer-link")) return;
    const note = footer.querySelector("a[href='https://note.com/chem_fac/n/nbc0c6a8a3755']");
    if (!note) return;
    const link = createLink("footer", "span");
    link.className = "kindle-footer-link";
    link.textContent = isAvailable ? "Kindle本 ↗" : "Kindle本（発売準備中）";
    note.after(link);
  });

  if (isAvailable) {
    document.querySelectorAll(".footer .footer-notice").forEach(function (notice) {
      if (notice.nextElementSibling && notice.nextElementSibling.classList.contains("footer-associate")) return;
      const associate = document.createElement("p");
      associate.className = "footer-notice footer-associate";
      associate.textContent = KINDLE_BOOK.associateNote;
      notice.after(associate);
    });
  }
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
        filterBtns.forEach(function (b) {
          b.classList.remove("active");
          b.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("active");
        btn.setAttribute("aria-pressed", "true");

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

        // 支援技術向け：回答済みの選択肢を無効化し、選んだものを押下状態にする
        allChoices.forEach(function (c) {
          const b = c.matches("button") ? c : c.querySelector(".choice-pick");
          if (!b) return;
          b.setAttribute("aria-disabled", "true");
          b.setAttribute("aria-pressed", c === choice ? "true" : "false");
        });

        // Show answer and explanation
        answerContent.classList.add("visible");

        // GA4: 正誤つきで解答を計測（問題はページパスで識別）
        trackEvent(choice.getAttribute("data-correct") === "true" ? "answer_correct" : "answer_incorrect");
        trackKindleExperiment("answer");
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
