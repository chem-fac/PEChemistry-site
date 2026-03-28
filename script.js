/* ============================================
   Common JavaScript for PE Chemistry Exam Site
   ============================================ */

// Mobile menu toggle
document.addEventListener("DOMContentLoaded", function () {
  const menuBtn = document.getElementById("mobile-menu-btn");
  const nav = document.getElementById("header-nav");

  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      nav.classList.toggle("open");
    });

    // Close menu when clicking a link
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
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
});


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
      choice.addEventListener("click", function () {
        // If already answered or eliminated, do nothing
        if (answerContent.classList.contains("visible")) return;
        if (wrapper.classList.contains("eliminated")) return;

        // Mark all choices as answered
        allChoices.forEach(function (c) {
          c.classList.add("answered");
          
          if (c === choice) {
            c.classList.add("selected");
          }
          
          if (c.getAttribute("data-correct") === "true") {
            c.classList.add("correct");
          } else if (c === choice) {
            c.classList.add("incorrect-selected");
          }
        });

        // Hide all eliminate buttons
        choiceWrappers.forEach(function (w) {
          w.classList.add("answered-global");
        });

        // Show answer and explanation
        answerContent.classList.add("visible");

        // Scroll gracefully to the answer section
        setTimeout(function() {
          answerContent.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 50);
      });
    });
  }
});
