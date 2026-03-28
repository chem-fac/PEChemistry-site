/* ============================================
   Search functionality for PE Chemistry Exam Site
   Loads questions.json and performs full-text search
   ============================================ */

(function () {
  let questionsData = null;
  let searchIndex = [];
  const DATA_URL = "data/questions.json";

  // Subject colors for tags
  const SUBJECT_COLORS = {
    "無機化学及びセラミックス": { bg: "var(--color-inorganic-bg)", color: "var(--color-inorganic)" },
    "有機化学及び燃料": { bg: "var(--color-organic-bg)", color: "var(--color-organic)" },
    "高分子化学": { bg: "var(--color-polymer-bg)", color: "var(--color-polymer)" },
    "化学プロセス": { bg: "var(--color-process-bg)", color: "var(--color-process)" }
  };

  async function loadData() {
    if (questionsData) return;
    try {
      const res = await fetch(DATA_URL);
      questionsData = await res.json();
      buildIndex();
      
      // Re-trigger search to handle any input typed while loading
      const input = document.getElementById("search-input");
      if (input && input.value) {
        const query = input.value;
        renderResults(search(query), query);
      }
    } catch (e) {
      console.error("Failed to load questions data:", e);
    }
  }

  function buildIndex() {
    searchIndex = [];
    for (const year of questionsData.years) {
      for (const q of year.questions) {
        searchIndex.push({
          title: q.title,
          subject: q.subject,
          text: q.question_text + " " + (q.explanation || "") + " " + q.choices.join(" "),
          url: "/" + year.slug + "/" + q.slug + "/",
          year: year.label,
          number: q.number
        });
      }
    }
  }

  function search(query) {
    if (!query || query.trim().length < 2) return [];
    
    // Normalize query (e.g. handle full/half width variations)
    let normalizedQuery = query;
    try { normalizedQuery = query.normalize("NFKC"); } catch(e) {}
    
    const terms = normalizedQuery.toLowerCase().trim().split(/\s+/);
    
    return searchIndex.filter(function (item) {
      let haystack = (item.title + " " + item.text + " " + item.subject + " " + item.year).toLowerCase();
      try { haystack = haystack.normalize("NFKC"); } catch(e) {}
      
      return terms.every(function (term) {
        return haystack.indexOf(term) !== -1;
      });
    }).slice(0, 20);
  }

  function renderResults(results, query) {
    const container = document.getElementById("search-results");
    if (!container) return;

    if (!query || query.trim().length < 2) {
      container.innerHTML = "";
      return;
    }

    if (results.length === 0) {
      container.innerHTML = '<div class="search-no-results">該当する問題が見つかりません</div>';
      return;
    }

    let html = "";
    for (const r of results) {
      const subjectStyle = SUBJECT_COLORS[r.subject] || { bg: "#f1f5f9", color: "#64748b" };
      // Get excerpt from text
      const lowerText = r.text.toLowerCase();
      const lowerQuery = query.toLowerCase().trim().split(/\s+/)[0];
      let excerptStart = lowerText.indexOf(lowerQuery);
      let excerpt = "";
      if (excerptStart >= 0) {
        const start = Math.max(0, excerptStart - 20);
        const end = Math.min(r.text.length, excerptStart + 60);
        excerpt = (start > 0 ? "..." : "") + r.text.substring(start, end).replace(/\n/g, " ") + (end < r.text.length ? "..." : "");
      } else {
        excerpt = r.text.substring(0, 80).replace(/\n/g, " ") + "...";
      }

      html += '<a href="' + r.url + '" class="search-result-item">';
      html += '<span class="search-result-tag" style="background:' + subjectStyle.bg + ';color:' + subjectStyle.color + '">' + escapeHtml(r.subject) + '</span>';
      html += '<span class="search-result-title">' + escapeHtml(r.title) + '</span>';
      html += '<div class="search-result-excerpt">' + escapeHtml(excerpt) + '</div>';
      html += '</a>';
    }
    container.innerHTML = html;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // Debounce helper
  function debounce(fn, delay) {
    let timer;
    return function () {
      clearTimeout(timer);
      const args = arguments;
      const context = this;
      timer = setTimeout(function () { fn.apply(context, args); }, delay);
    };
  }

  document.addEventListener("DOMContentLoaded", function () {
    const input = document.getElementById("search-input");
    if (!input) return;

    // Load data on focus
    input.addEventListener("focus", function () {
      loadData();
    });

    // Search on input
    input.addEventListener("input", debounce(function () {
      const query = input.value;
      const results = search(query);
      renderResults(results, query);
    }, 200));
  });
})();
