# ai-news-service

無料のRSS/Atomフィードから最新のAIニュースを取得し、JSONファイルに出力する独立したスクリプトです。
本リポジトリの社労士業務管理アプリ（Expo/React Native）とは切り離されており、依存関係も別管理です。

## セットアップ

```bash
cd ai-news-service
npm install
```

## 使い方

```bash
npm run fetch
```

`output/ai-news.json` に、取得日時・記事一覧（タイトル・リンク・出典・公開日時・要約）が書き出されます。

### オプション

```bash
npm run fetch -- --limit=50 --out=output/latest.json --lang=ja
```

- `--limit`: 出力する記事数の上限（デフォルト30）
- `--out`: 出力先ファイルパス（デフォルト `output/ai-news.json`）
- `--lang`: `ja` または `en` を指定すると、その言語のフィードのみ取得

## 取得元フィードの追加・変更

`src/feeds.ts` の `FEEDS` 配列に `{ name, url, lang }` を追加するだけで取得対象を増減できます。
RSS 2.0 / RSS 1.0(RDF) / Atom のいずれの形式にも対応しています。

## 定期実行

このスクリプト自体はワンショット実行のCLIです。定期的に最新ニュースを取得したい場合は、
OS標準のスケジューラやCIから `npm run fetch` を呼び出してください。

- cron の例（毎時0分に実行）:
  ```
  0 * * * * cd /path/to/syaroumu/ai-news-service && npm run fetch >> fetch.log 2>&1
  ```
- GitHub Actions の `schedule` トリガーでも同様に実行できます。

## ビルド（任意）

本番運用でTypeScriptのトランスパイルを事前に済ませたい場合:

```bash
npm run build
npm start
```

## 出力形式

```json
{
  "fetchedAt": "2026-08-30T12:00:00.000Z",
  "sourceCount": 8,
  "articleCount": 30,
  "errors": [{ "source": "TechCrunch (AI)", "error": "HTTP 403" }],
  "articles": [
    {
      "title": "...",
      "link": "https://...",
      "source": "ITmedia AI+",
      "publishedAt": "2026-08-30T09:00:00.000Z",
      "summary": "..."
    }
  ]
}
```

一部のフィードは取得に失敗することがあります（サーバー側のブロックやURL変更など）。
その場合も `errors` に記録した上で、取得できたフィードの記事のみで処理を継続します。
