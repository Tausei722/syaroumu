export interface Article {
  title: string;
  link: string;
  source: string;
  publishedAt: string | null; // ISO 8601, null if the feed didn't provide a parsable date
  summary: string | null;
}
