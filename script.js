/* ============================================
   Common JavaScript for PE Chemistry Exam Site
   ============================================ */

// Mobile menu toggle
document.addEventListener("DOMContentLoaded", function () {
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
      });
    });
  }
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
