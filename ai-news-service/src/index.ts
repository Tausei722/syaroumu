import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { FEEDS } from "./feeds.js";
import { fetchAllFeeds } from "./fetchNews.js";
import { dedupeArticles } from "./dedupe.js";
import type { Article } from "./types.js";

interface CliArgs {
  limit: number;
  out: string;
  lang: "ja" | "en" | null;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { limit: 30, out: "output/ai-news.json", lang: null };
  for (const raw of argv) {
    const match = raw.match(/^--([^=]+)=(.*)$/);
    if (!match) continue;
    const [, key, value] = match;
    if (key === "limit") args.limit = Math.max(1, Number(value) || args.limit);
    if (key === "out") args.out = value;
    if (key === "lang" && (value === "ja" || value === "en")) args.lang = value;
  }
  return args;
}

function sortByDateDesc(articles: Article[]): Article[] {
  return [...articles].sort((a, b) => {
    if (!a.publishedAt && !b.publishedAt) return 0;
    if (!a.publishedAt) return 1;
    if (!b.publishedAt) return -1;
    return b.publishedAt.localeCompare(a.publishedAt);
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const feeds = args.lang ? FEEDS.filter((f) => f.lang === args.lang) : FEEDS;

  console.log(`[ai-news-service] ${feeds.length}件のRSSフィードを取得中...`);
  const { articles, errors } = await fetchAllFeeds(feeds);

  const deduped = dedupeArticles(articles);
  const sorted = sortByDateDesc(deduped);
  const limited = sorted.slice(0, args.limit);

  const payload = {
    fetchedAt: new Date().toISOString(),
    sourceCount: feeds.length,
    articleCount: limited.length,
    errors,
    articles: limited,
  };

  await mkdir(dirname(args.out), { recursive: true });
  await writeFile(args.out, JSON.stringify(payload, null, 2), "utf-8");

  console.log(`[ai-news-service] ${limited.length}件の記事を取得しました (重複除去前: ${articles.length}件)`);
  if (errors.length > 0) {
    console.warn(`[ai-news-service] ${errors.length}件のフィード取得に失敗しました:`);
    for (const e of errors) console.warn(`  - ${e.source}: ${e.error}`);
  }
  console.log(`[ai-news-service] 出力先: ${args.out}`);

  for (const article of limited.slice(0, 10)) {
    const date = article.publishedAt ? article.publishedAt.slice(0, 10) : "日付不明";
    console.log(`  [${date}] (${article.source}) ${article.title}`);
  }
}

main().catch((err) => {
  console.error("[ai-news-service] 致命的なエラーが発生しました:", err);
  process.exitCode = 1;
});
