import { parseFeed } from "./rss.js";
import type { FeedSource } from "./feeds.js";
import type { Article } from "./types.js";

const DEFAULT_TIMEOUT_MS = 10_000;

interface FeedResult {
  source: FeedSource;
  articles: Article[];
  error?: string;
}

async function fetchFeed(source: FeedSource, timeoutMs: number): Promise<FeedResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(source.url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "ai-news-service/1.0 (+https://github.com/) Node.js",
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    return { source, articles: parseFeed(xml, source.name) };
  } catch (err) {
    return { source, articles: [], error: err instanceof Error ? err.message : String(err) };
  } finally {
    clearTimeout(timer);
  }
}

export interface FetchAllResult {
  articles: Article[];
  errors: { source: string; error: string }[];
}

export async function fetchAllFeeds(
  feeds: FeedSource[],
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<FetchAllResult> {
  const results = await Promise.all(feeds.map((source) => fetchFeed(source, timeoutMs)));

  const articles: Article[] = [];
  const errors: { source: string; error: string }[] = [];
  for (const result of results) {
    articles.push(...result.articles);
    if (result.error) errors.push({ source: result.source.name, error: result.error });
  }
  return { articles, errors };
}
