# PEChemistrySite 作業ルール

技術士一次試験（化学部門）解説サイト。公開URL: https://pe-chemistry.chem-fac.com

- 問題データは `data/questions.json`。年度別フォルダは2011〜2025年＋2019再試験。インポートは `_dev/import_all_years.py`（個別年度は `import_2023.py` 等）
- **CIビルドは無い**: `_dev/` は `.gitignore` 除外のため、ローカルで `_dev/build_site.py` を実行し、生成HTMLごとコミット＆pushする方式

## 問題追加の手順

1. `data/questions.json` に問題データを追加
2. `_dev/build_site.py` を実行してHTMLを再生成
3. 生成HTMLごとコミット・プッシュ

## Gotchas

- PowerShellで `_dev/build_site.py` の出力が `UnicodeEncodeError` になる場合: `$env:PYTHONIOENCODING='utf-8'; python _dev\build_site.py` で実行する
- 参考リンク切れの週次チェックは別リポ `PEChemistrySiteBuilder`（公開リポにActionsを置かない方針）
