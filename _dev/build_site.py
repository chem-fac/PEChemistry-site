#!/usr/bin/env python3
"""
Build script for PE Chemistry Exam Site.
Reads data/questions.json and generates HTML pages for each year and question.
Uses relative paths for all assets so the site works both locally and on GitHub Pages.
"""

import json
import os
import html as html_module

SITE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(SITE_DIR, "data")
SITE_URL = "https://pe-chemistry.chem-fac.com"
NOTE_URL = "https://note.com/chem_fac/n/nbc0c6a8a3755"
SITE_TITLE = "技術士（化学部門）一次試験 過去問解説"

CIRCLE_NUMS = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"]


def load_json(filename):
    path = os.path.join(DATA_DIR, filename)
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def esc(text):
    """HTML-escape text."""
    return html_module.escape(str(text))


def header_html(title_text, root_rel=""):
    """Generate header HTML. root_rel is relative path to site root, e.g. '' for root, '../' for year pages."""
    return f"""<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{esc(title_text)} | {esc(SITE_TITLE)}</title>
  <meta name="description" content="技術士一次試験（化学部門）の専門科目 過去問を1問ずつ解説。正答・解説は隠した状態で学習できます。">
  <meta property="og:title" content="{esc(title_text)}">
  <meta property="og:description" content="技術士一次試験（化学部門）の過去問を1問ずつ解説">
  <meta property="og:url" content="{SITE_URL}/">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="ja_JP">
  <link rel="canonical" href="{SITE_URL}/">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{root_rel}styles.css">
</head>
<body>
  <header class="header">
    <div class="header-inner">
      <a href="{root_rel}" class="header-logo">
        <span>{esc(SITE_TITLE)}</span>
      </a>
      <nav class="header-nav" id="header-nav">
        <a href="{root_rel}">年度一覧</a>
        <a href="{root_rel}#search">検索</a>
        <a href="https://chem-fac.com/" target="_blank" rel="noopener">ケムファク</a>
        <a href="https://chem-fac.com/contact-form/" target="_blank" rel="noopener">お問い合わせ</a>
      </nav>
      <button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="メニュー">
        <span></span><span></span><span></span>
      </button>
    </div>
  </header>
  <main>
"""


def footer_html(root_rel=""):
    return f"""  </main>
  <footer class="footer">
    <div class="container">
      <div class="footer-inner">
        <div class="footer-left">&copy; 2026 {esc(SITE_TITLE)}</div>
        <div class="footer-links">
          <a href="https://chem-fac.com/" target="_blank" rel="noopener">ケムファク</a>
          <a href="{NOTE_URL}" target="_blank" rel="noopener">note</a>
          <a href="https://chem-fac.com/contact-form/" target="_blank" rel="noopener">お問い合わせ</a>
        </div>
      </div>
    </div>
  </footer>
  <script src="{root_rel}script.js"></script>
</body>
</html>
"""


def note_promo_html(small=False):
    cls = "note-promo note-promo-sm" if small else "note-promo"
    return f"""
    <a href="{NOTE_URL}" target="_blank" rel="noopener" class="{cls}">
      <div class="note-promo-content">
        <h3>技術士（化学部門）一次試験の要点まとめ</h3>
        <p>試験直前に役立つ要点をまとめました。効率的な学習にご活用ください。</p>
      </div>
      <div class="note-promo-arrow">→</div>
    </a>
"""


def breadcrumb_html(items):
    """items: list of (label, url) tuples. Last item has no url."""
    parts = []
    for i, (label, url) in enumerate(items):
        if url:
            parts.append(f'<a href="{url}">{esc(label)}</a>')
        else:
            parts.append(f'<span>{esc(label)}</span>')
        if i < len(items) - 1:
            parts.append('<span class="breadcrumb-sep">/</span>')
    return f'<div class="breadcrumb"><div class="container">{"".join(parts)}</div></div>'


def build_top_page(data, changelog):
    """Build index.html — the top page."""
    years = data["years"]
    root_rel = "./"

    year_cards = ""
    for y in years:
        qcount = len(y["questions"])
        year_cards += f"""
          <a href="{y['slug']}/" class="year-card">
            <div>
              <div class="year-card-year">{y['year']}</div>
              <div class="year-card-label">{esc(y['label'])}</div>
              <div class="year-card-count">全{qcount}問</div>
            </div>
          </a>
"""

    changelog_items = ""
    for entry in changelog[:5]:
        changelog_items += f"""
          <li class="changelog-item">
            <span class="changelog-date">{esc(entry['date'])}</span>
            <span class="changelog-text">{esc(entry['text'])}</span>
          </li>
"""

    content = header_html(SITE_TITLE, root_rel)
    content += f"""
    <!-- Hero -->
    <section class="hero">
      <div class="container">
        <h1>{esc(SITE_TITLE)}</h1>
        <p class="hero-description">
          技術士一次試験の専門科目（化学部門）を1問ずつ解説しています。<br>
          選択肢を押すことで正答と解説が表示されます。
        </p>
      </div>
    </section>

    <!-- Year List -->
    <section class="section">
      <div class="container">
        <div class="section-label">EXAM YEARS</div>
        <h2 class="section-heading">年度別一覧</h2>
        <div class="year-grid">
{year_cards}
        </div>
      </div>
    </section>

    <!-- Search -->
    <section class="search-section" id="search">
      <div class="container">
        <div class="section-label">SEARCH</div>
        <h2 class="section-heading">問題を検索</h2>
        <div class="search-box">
          <input type="text" id="search-input" class="search-input" placeholder="キーワードで検索（例：アルドール、高分子、蒸留）">
        </div>
        <div class="search-results" id="search-results"></div>
      </div>
    </section>

    <!-- Note promo -->
    <section class="section">
      <div class="container">
{note_promo_html()}
        <div class="article-links" style="margin-top: var(--space-lg);">
          <a href="https://chem-fac.com/pe-chem-benefits/" target="_blank" rel="noopener" class="article-link-card">
            <div class="article-link-card-text">
              <h4>技術士(化学部門)が得られる特典を調べてみた</h4>
              <p>技術士資格のメリットについて</p>
            </div>
          </a>
          <a href="https://chem-fac.com/pe-exam-data/" target="_blank" rel="noopener" class="article-link-card">
            <div class="article-link-card-text">
              <h4>技術士（化学部門）の受験者数や合格者数データ</h4>
              <p>過去の試験データまとめ</p>
            </div>
          </a>
        </div>
      </div>
    </section>

    <!-- Changelog -->
    <section class="section" style="padding-top: 0;">
      <div class="container">
        <div class="section-label">UPDATES</div>
        <h2 class="section-heading">更新履歴</h2>
        <ul class="changelog-list">
{changelog_items}
        </ul>
      </div>
    </section>
"""
    content += footer_html(root_rel)

    # Add search.js
    content = content.replace(
        f'<script src="{root_rel}script.js"></script>',
        f'<script src="{root_rel}script.js"></script>\n  <script src="{root_rel}search.js"></script>'
    )

    out_path = os.path.join(SITE_DIR, "index.html")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  ✓ index.html")


def build_year_page(year_data, all_years):
    """Build {year}/index.html."""
    y = year_data
    slug = y["slug"]
    root_rel = "../"

    # Find prev/next year
    year_idx = next(i for i, yy in enumerate(all_years) if yy["slug"] == slug)
    prev_year = all_years[year_idx + 1] if year_idx + 1 < len(all_years) else None
    next_year = all_years[year_idx - 1] if year_idx - 1 >= 0 else None

    # Collect unique subjects
    subjects = sorted(set(q["subject"] for q in y["questions"]))

    subject_btns = '<button class="subject-filter-btn active" data-subject="all">すべて</button>\n'
    for s in subjects:
        subject_btns += f'          <button class="subject-filter-btn" data-subject="{esc(s)}">{esc(s)}</button>\n'

    question_cards = ""
    for q in y["questions"]:
        excerpt = q["question_text"][:60].replace("\n", " ") + "..."
        question_cards += f"""
          <a href="{q['slug']}/" class="question-card" data-subject="{esc(q['subject'])}">
            <span class="question-card-num">問{q['number']}</span>
            <span class="subject-tag" data-subject="{esc(q['subject'])}">{esc(q['subject'])}</span>
            <span class="question-card-text">{esc(excerpt)}</span>
            <span class="question-card-arrow">→</span>
          </a>
"""

    # Year nav
    if prev_year:
        prev_html = f'<a href="../{prev_year["slug"]}/" class="question-nav-btn">← {esc(prev_year["label"])}</a>'
    else:
        prev_html = '<span></span>'
    if next_year:
        next_html = f'<a href="../{next_year["slug"]}/" class="question-nav-btn">{esc(next_year["label"])} →</a>'
    else:
        next_html = '<span></span>'

    content = header_html(f"{y['label']}（{y['year']}年）過去問一覧", root_rel)
    content += breadcrumb_html([("トップ", f"{root_rel}"), (y["label"], None)])
    content += f"""
    <section class="year-hero">
      <div class="container">
        <h1>{esc(y['label'])}（{y['year']}年）過去問一覧</h1>
        <p class="year-hero-sub">全{len(y['questions'])}問</p>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="subject-filter">
          {subject_btns}
        </div>
        <div class="question-list" id="question-list">
{question_cards}
        </div>

        <div style="margin-top: var(--space-xl);">
{note_promo_html(small=True)}
        </div>

        <div class="year-nav">
          {prev_html}
          {next_html}
        </div>
      </div>
    </section>
"""
    content += footer_html(root_rel)

    out_dir = os.path.join(SITE_DIR, slug)
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "index.html")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  ✓ {slug}/index.html")


def build_question_page(q, year_data, all_years):
    """Build {year}/{q_slug}/index.html."""
    y = year_data
    slug = y["slug"]
    root_rel = "../../"
    questions = y["questions"]
    q_idx = next(i for i, qq in enumerate(questions) if qq["slug"] == q["slug"])

    prev_q = questions[q_idx - 1] if q_idx > 0 else None
    next_q = questions[q_idx + 1] if q_idx + 1 < len(questions) else None

    # Answer
    answer_num = q["answer"]
    ans_text = q["choices"][answer_num - 1] if answer_num <= len(q["choices"]) else ""
    if ans_text.startswith("[IMAGE]"):
        ans_text = "（構造画像）"
    answer_display = f"{CIRCLE_NUMS[answer_num - 1]} {esc(ans_text)}" if answer_num <= len(q["choices"]) else f"{answer_num}番"

    # Choices HTML
    choices_html = ""
    has_images = any(c.startswith("[IMAGE]") for c in q["choices"])
    choices_class = "choices choices-grid" if has_images else "choices"
    for i, choice in enumerate(q["choices"]):
        is_correct = "true" if (i + 1) == answer_num else "false"
        if choice.startswith("[IMAGE]"):
            img_path = choice.replace("[IMAGE] ", "").strip()
            img_src = f"{root_rel}{img_path}"
            choices_html += f"""
          <div class="choice-wrapper image-choice-wrapper">
            <span class="image-choice-num">{CIRCLE_NUMS[i]}</span>
            <button class="choice-eliminate-btn eliminate-top-right" aria-label="選択肢を除外" title="選択肢を除外">×</button>
            <div class="choice-item choice-is-image" data-correct="{is_correct}">
              <img src="{img_src}" alt="選択肢{i+1}" class="choice-image">
            </div>
          </div>
"""
        else:
            choices_html += f"""
          <div class="choice-wrapper">
            <button class="choice-eliminate-btn" aria-label="選択肢を除外" title="選択肢を除外">×</button>
            <div class="choice-item" data-correct="{is_correct}">
              <span class="choice-num">{CIRCLE_NUMS[i]}</span>
              <span class="choice-text">{esc(choice)}</span>
            </div>
          </div>
"""

    # Explanation
    explanation_lines = q.get("explanation", "").split("\n")
    if explanation_lines and "正答は" in explanation_lines[0]:
        explanation_lines = explanation_lines[1:]
    explanation_text = esc("\n".join(explanation_lines).strip())

    # References
    refs_html = ""
    if q.get("references"):
        ref_items = ""
        for ref in q["references"]:
            domain = ref["url"].split("/")[2] if "/" in ref["url"] else ref["url"]
            ref_items += f"""
            <a href="{esc(ref['url'])}" target="_blank" rel="noopener" class="reference-link">
              <span class="reference-link-title">{esc(ref['title'])}</span>
              <span class="reference-link-domain">{esc(domain)}</span>
            </a>
"""
        refs_html = f"""
        <div class="references-section">
          <details class="reference-details">
            <summary class="reference-summary">参考資料はコチラ！</summary>
            <div class="reference-list">
{ref_items}
            </div>
          </details>
        </div>
"""

    # Navigation
    if prev_q:
        prev_html = f"""
        <a href="../{prev_q['slug']}/" class="question-nav-btn">
          <span>←</span>
          <div>
            <div class="question-nav-label">前の問題</div>
            <div>問{prev_q['number']}</div>
          </div>
        </a>"""
    else:
        prev_html = f"""
        <a href="../" class="question-nav-btn">
          <span>←</span>
          <div>
            <div class="question-nav-label">年度一覧</div>
            <div>{esc(y['label'])}</div>
          </div>
        </a>"""

    if next_q:
        next_html = f"""
        <a href="../{next_q['slug']}/" class="question-nav-btn">
          <div style="text-align:right;">
            <div class="question-nav-label">次の問題</div>
            <div>問{next_q['number']}</div>
          </div>
          <span>→</span>
        </a>"""
    else:
        next_html = f"""
        <a href="../" class="question-nav-btn">
          <div style="text-align:right;">
            <div class="question-nav-label">年度一覧</div>
            <div>{esc(y['label'])}</div>
          </div>
          <span>→</span>
        </a>"""

    content = header_html(q["title"], root_rel)
    content += breadcrumb_html([
        ("トップ", f"{root_rel}"),
        (y["label"], f"../"),
        (f"問{q['number']}", None)
    ])
    content += f"""
    <section class="question-hero">
      <div class="container">
        <h1>
          {esc(q['title'])}
          <span class="subject-tag" data-subject="{esc(q['subject'])}">{esc(q['subject'])}</span>
        </h1>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <!-- Question text -->
        <div class="question-body">
          <div class="question-text-card">{esc(q['question_text'])}</div>
        </div>

        <!-- Choices -->
        <div class="{choices_class}">
{choices_html}
        </div>

        <!-- Answer reveal -->
        <div class="answer-section">
          <div class="answer-content" id="answer-content">
            <div class="answer-box">
              <div class="answer-label">正答</div>
              <div class="answer-value">{answer_display}</div>
            </div>

            <!-- Explanation display -->
            <div class="explanation-section">
              <div class="explanation-content" id="explanation-content">
{explanation_text}
              </div>
            </div>
          </div>
        </div>

        <!-- Note promo (subtle) -->
        <div style="margin-top: var(--space-lg);">
{note_promo_html(small=True)}
        </div>

        <!-- References -->
{refs_html}

        <!-- Question navigation -->
        <div class="question-nav" style="margin-top: var(--space-xl);">
          {prev_html}
          {next_html}
        </div>
      </div>
    </section>
"""
    content += footer_html(root_rel)

    out_dir = os.path.join(SITE_DIR, slug, q["slug"])
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "index.html")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  ✓ {slug}/{q['slug']}/index.html")


def main():
    print("Building PE Chemistry Exam Site...")
    data = load_json("questions.json")
    changelog = load_json("changelog.json")

    all_years = data["years"]

    # Build top page
    build_top_page(data, changelog)

    # Build year and question pages
    for year_data in all_years:
        build_year_page(year_data, all_years)
        for q in year_data["questions"]:
            build_question_page(q, year_data, all_years)

    total_questions = sum(len(y["questions"]) for y in all_years)
    print(f"\nDone! Generated pages for {len(all_years)} years, {total_questions} questions.")


if __name__ == "__main__":
    main()
