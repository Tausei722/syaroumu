import { XMLParser } from "fast-xml-parser";
import type { Article } from "./types.js";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  cdataPropName: "#text",
});

function toArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function getText(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return getText(value[0]);
  if (typeof value === "object" && "#text" in (value as Record<string, unknown>)) {
    return getText((value as Record<string, unknown>)["#text"]);
  }
  return null;
}

function extractLink(linkField: unknown): string | null {
  if (linkField == null) return null;
  if (typeof linkField === "string") return linkField.trim() || null;
  if (Array.isArray(linkField)) {
    const entries = linkField as Record<string, unknown>[];
    const alt = entries.find((l) => !l["@_rel"] || l["@_rel"] === "alternate");
    return extractLink(alt ?? entries[0]);
  }
  if (typeof linkField === "object") {
    const href = (linkField as Record<string, unknown>)["@_href"];
    if (typeof href === "string") return href.trim() || null;
    return getText(linkField);
  }
  return null;
}

function parseDate(...candidates: unknown[]): string | null {
  for (const candidate of candidates) {
    const text = getText(candidate);
    if (!text) continue;
    const parsed = new Date(text);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return null;
}

function stripHtml(text: string | null, maxLength = 200): string | null {
  if (!text) return null;
  const stripped = text.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  if (!stripped) return null;
  return stripped.length > maxLength ? `${stripped.slice(0, maxLength - 1)}…` : stripped;
}

interface RssItem {
  title?: unknown;
  link?: unknown;
  pubDate?: unknown;
  "dc:date"?: unknown;
  description?: unknown;
  "content:encoded"?: unknown;
}

interface AtomEntry {
  title?: unknown;
  link?: unknown;
  published?: unknown;
  updated?: unknown;
  summary?: unknown;
  content?: unknown;
}

export function parseFeed(xml: string, sourceName: string): Article[] {
  let doc: Record<string, any>;
  try {
    doc = parser.parse(xml);
  } catch {
    return [];
  }

  const rssItems: RssItem[] | undefined = doc?.rss?.channel?.item;
  if (rssItems) {
    return toArray(rssItems)
      .map((item) => ({
        title: getText(item.title) ?? "(無題)",
        link: extractLink(item.link) ?? "",
        source: sourceName,
        publishedAt: parseDate(item.pubDate, item["dc:date"]),
        summary: stripHtml(getText(item.description) ?? getText(item["content:encoded"])),
      }))
      .filter((a): a is Article => !!a.link);
  }

  // RSS 1.0 / RDF (used by some Japanese outlets, e.g. ZDNet Japan)
  const rdfItems: RssItem[] | undefined = doc?.["rdf:RDF"]?.item;
  if (rdfItems) {
    return toArray(rdfItems)
      .map((item) => ({
        title: getText(item.title) ?? "(無題)",
        link: getText(item.link) ?? "",
        source: sourceName,
        publishedAt: parseDate(item["dc:date"]),
        summary: stripHtml(getText(item.description)),
      }))
      .filter((a): a is Article => !!a.link);
  }

  const atomEntries: AtomEntry[] | undefined = doc?.feed?.entry;
  if (atomEntries) {
    return toArray(atomEntries)
      .map((entry) => ({
        title: getText(entry.title) ?? "(無題)",
        link: extractLink(entry.link) ?? "",
        source: sourceName,
        publishedAt: parseDate(entry.published, entry.updated),
        summary: stripHtml(getText(entry.summary) ?? getText(entry.content)),
      }))
      .filter((a): a is Article => !!a.link);
  }

  return [];
}
