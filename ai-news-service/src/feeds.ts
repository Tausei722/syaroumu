export interface FeedSource {
  name: string;
  url: string;
  lang: "ja" | "en";
}

// 無料で公開されているAI関連RSSフィード一覧。
// 追加・削除するだけで取得対象を調整できる。
export const FEEDS: FeedSource[] = [
  { name: "ITmedia AI+", url: "https://aiplus.itmedia.co.jp/rss/2.0/aiplus.xml", lang: "ja" },
  { name: "ZDNET Japan AI", url: "https://japan.zdnet.com/rss/ai/index.rdf", lang: "ja" },
  { name: "TechCrunch (AI)", url: "https://techcrunch.com/category/artificial-intelligence/feed/", lang: "en" },
  { name: "VentureBeat AI", url: "https://venturebeat.com/category/ai/feed/", lang: "en" },
  { name: "MIT Technology Review AI", url: "https://www.technologyreview.com/topic/artificial-intelligence/feed", lang: "en" },
  { name: "The Verge AI", url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml", lang: "en" },
  { name: "OpenAI News", url: "https://openai.com/news/rss.xml", lang: "en" },
  { name: "Hugging Face Blog", url: "https://huggingface.co/blog/feed.xml", lang: "en" },
];
