import type { Article } from "./types.js";

function normalizeLink(link: string): string {
  try {
    const url = new URL(link);
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return link.toLowerCase();
  }
}

export function dedupeArticles(articles: Article[]): Article[] {
  const seen = new Set<string>();
  const result: Article[] = [];
  for (const article of articles) {
    const key = article.link ? normalizeLink(article.link) : article.title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(article);
  }
  return result;
}
