import os

def update_build_site():
    path = "c:/filebox/07_プログラム/PEChemistrySite/_dev/build_site.py"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. header_html replaces
    content = content.replace('href="{root_rel}index.html" class="header-logo"', 'href="{root_rel}" class="header-logo"')
    content = content.replace('href="{root_rel}index.html">年度一覧', 'href="{root_rel}">年度一覧')
    content = content.replace('href="{root_rel}index.html#search">検索', 'href="{root_rel}#search">検索')

    # 2. build_top_page
    content = content.replace('root_rel = ""', 'root_rel = "./"')
    content = content.replace('href="{y[\'slug\']}/index.html" class="year-card"', 'href="{y[\'slug\']}/" class="year-card"')
    
    # 3. build_year_page
    content = content.replace('href="{q[\'slug\']}/index.html" class="question-card"', 'href="{q[\'slug\']}/" class="question-card"')
    content = content.replace('<a href="../{prev_year["slug"]}/index.html" class="question-nav-btn">', '<a href="../{prev_year["slug"]}/" class="question-nav-btn">')
    content = content.replace('<a href="../{next_year["slug"]}/index.html" class="question-nav-btn">', '<a href="../{next_year["slug"]}/" class="question-nav-btn">')
    content = content.replace('("トップ", f"{root_rel}index.html")', '("トップ", f"{root_rel}")')

    # 4. build_question_page nav links
    content = content.replace('href="../{prev_q[\'slug\']}/index.html" class="question-nav-btn"', 'href="../{prev_q[\'slug\']}/" class="question-nav-btn"')
    content = content.replace('href="../index.html" class="question-nav-btn"', 'href="../" class="question-nav-btn"')
    content = content.replace('href="../{next_q[\'slug\']}/index.html" class="question-nav-btn"', 'href="../{next_q[\'slug\']}/" class="question-nav-btn"')
    content = content.replace('(y["label"], f"../index.html")', '(y["label"], f"../")')

    # 5. build_question_page references detail accordion
    old_refs = '''        refs_html = f"""
        <div class="references-section">
          <div class="references-heading">参考資料</div>
          <div class="reference-list">
{ref_items}
          </div>
        </div>
"""'''
    new_refs = '''        refs_html = f"""
        <div class="references-section">
          <details class="reference-details">
            <summary class="reference-summary">参考資料はコチラ！</summary>
            <div class="reference-list">
{ref_items}
            </div>
          </details>
        </div>
"""'''
    content = content.replace(old_refs, new_refs)

    # 6. Reorder build_question_page DOM
    old_layout = '''        <!-- Question navigation -->
        <div class="question-nav" style="margin-top: var(--space-xl);">
          {prev_html}
          {next_html}
        </div>

        <!-- Note promo (subtle) -->
        <div style="margin-top: var(--space-lg);">
{note_promo_html(small=True)}
        </div>

        <!-- References -->
{refs_html}'''

    new_layout = '''        <!-- Note promo (subtle) -->
        <div style="margin-top: var(--space-lg);">
{note_promo_html(small=True)}
        </div>

        <!-- References -->
{refs_html}

        <!-- Question navigation -->
        <div class="question-nav" style="margin-top: var(--space-xl);">
          {prev_html}
          {next_html}
        </div>'''
    content = content.replace(old_layout, new_layout)

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("build_site.py updated successfully.")

if __name__ == "__main__":
    update_build_site()
