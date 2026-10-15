/**
 * Board-aware listing extractors (DOM in browser; HTML regex path for Node tests).
 */

import { parseListingText } from "./parse-listing-text.js";

const BODY_CLIP = 8000;

/** @typedef {'boat24' | 'yachtworld' | 'scanboat' | 'blocket' | 'dba' | 'unknown'} BoardId */

/**
 * @param {string} hostname
 * @returns {BoardId}
 */
export function detectBoard(hostname) {
  const host = String(hostname ?? "").toLowerCase();
  if (host.includes("boat24.")) return "boat24";
  if (host.includes("yachtworld.")) return "yachtworld";
  if (host.includes("scanboat.")) return "scanboat";
  if (host.includes("blocket.")) return "blocket";
  if (host.includes("dba.dk") || host.endsWith(".dba.dk")) return "dba";
  return "unknown";
}

/**
 * @param {string} text
 * @returns {string | null}
 */
function extractPriceFromText(text) {
  if (!text) return null;
  const euro = text.match(
    /(?:€|EUR|euro)\s*([\d.,\s]{3,})|([\d.,\s]{3,})\s*(?:€|EUR)\b/i,
  );
  if (euro) {
    const raw = (euro[1] || euro[2] || "").replace(/\s/g, "").trim();
    if (raw) return `€${raw}`;
  }
  const sek = text.match(/([\d\s.,]{4,})\s*(?:kr|SEK)\b/i);
  if (sek?.[1]) return `${sek[1].replace(/\s/g, " ").trim()} kr`;
  return null;
}

/**
 * @param {Document} doc
 * @param {string[]} selectors
 * @returns {string}
 */
function firstText(doc, selectors) {
  for (const sel of selectors) {
    try {
      const el = doc.querySelector(sel);
      const t = el?.textContent?.trim();
      if (t) return t.replace(/\s+/g, " ");
    } catch {
      /* ignore invalid selectors in odd docs */
    }
  }
  return "";
}

/**
 * @param {Document} doc
 * @returns {string}
 */
function ogContent(doc, prop) {
  const el =
    doc.querySelector(`meta[property="${prop}"]`) ||
    doc.querySelector(`meta[name="${prop}"]`);
  return el?.getAttribute("content")?.trim() || "";
}

/**
 * Board-specific title / price selectors (light heuristics).
 * @param {BoardId} board
 */
function boardSelectors(board) {
  switch (board) {
    case "boat24":
      return {
        title: ["h1.BoatTitle", "h1[class*='title']", "h1", ".offer-title"],
        price: [".Price", "[class*='Price']", "[data-testid='price']", ".price"],
        body: ["article", "main", "#content", ".offer-description"],
      };
    case "yachtworld":
      return {
        title: ["h1[data-testid='listing-title']", "h1.listing-title", "h1"],
        price: ["[data-testid='price']", ".price", ".payment-total"],
        body: ["[data-testid='description']", "article", "main", "#boat-description"],
      };
    case "scanboat":
      return {
        title: ["h1.boat-title", "h1", ".title"],
        price: [".price", ".boat-price", "[class*='price']"],
        body: ["article", "main", ".description", "#description"],
      };
    case "blocket":
    case "dba":
      return {
        title: ["h1", "[data-testid='ad-title']", ".subject"],
        price: ["[data-testid='price']", ".price", "[class*='Price']"],
        body: ["article", "main", "[data-testid='ad-body']", "#description"],
      };
    default:
      return {
        title: ["h1"],
        price: [".price", "[class*='price']"],
        body: ["main", "article", "body"],
      };
  }
}

/**
 * @param {Document} doc
 * @param {BoardId} board
 * @returns {{ title: string, price: string | null, year: number | null, loaM: number | null, bodyText: string, board: BoardId }}
 */
export function extractListingFromDocument(doc, board) {
  const sels = boardSelectors(board);
  let title =
    firstText(doc, sels.title) ||
    ogContent(doc, "og:title") ||
    (doc.title || "").trim();
  title = title.replace(/\s+/g, " ").trim();

  let priceText = firstText(doc, sels.price);
  let price = extractPriceFromText(priceText) || extractPriceFromText(title);

  let bodyText = firstText(doc, sels.body);
  if (!bodyText) {
    bodyText = doc.body?.innerText || doc.documentElement?.textContent || "";
  }
  bodyText = bodyText.replace(/\s+/g, " ").trim().slice(0, BODY_CLIP);

  if (!price) price = extractPriceFromText(bodyText);

  const parsed = parseListingText(`${title}\n${bodyText}`);

  return {
    title,
    price,
    year: parsed.year,
    loaM: parsed.loaM,
    bodyText,
    board,
  };
}

/**
 * @param {string} raw
 * @returns {string}
 */
export function titleFromHtml(raw) {
  const ogTitle =
    raw.match(
      /<meta[^>]+(?:property|name)=["']og:title["'][^>]+content=["']([^"']+)["']/i,
    ) ||
    raw.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:title["']/i,
    );

  let title = "";
  const h1 = raw.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1?.[1]) {
    title = h1[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
  if (!title && ogTitle?.[1]) title = ogTitle[1].trim();
  if (!title) {
    const t = raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (t?.[1]) title = t[1].replace(/\s+/g, " ").trim();
  }
  return title;
}

/**
 * @param {string} raw
 * @returns {string | null}
 */
export function priceFromHtml(raw) {
  const priceBlock =
    raw.match(
      /<(?:div|span|p)[^>]*(?:class|data-testid)=["'][^"']*price[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|span|p)>/i,
    ) ||
    raw.match(/(?:€|EUR)\s*[\d.,\s]{3,}|[\d.,\s]{3,}\s*(?:€|EUR)/i);
  if (!priceBlock) return null;
  const chunk = (priceBlock[1] || priceBlock[0] || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
  return extractPriceFromText(chunk);
}

/**
 * @param {string} raw
 * @returns {string}
 */
export function bodyFromHtml(raw) {
  const bodyMatch =
    raw.match(/<(?:main|article)[^>]*>([\s\S]*?)<\/(?:main|article)>/i) ||
    raw.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let bodyText = bodyMatch?.[1] || raw;
  return bodyText
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, BODY_CLIP);
}

/**
 * Regex / string HTML extractor for Node tests (no browser DOM).
 * @param {string} html
 * @param {BoardId} board
 * @returns {{ title: string, price: string | null, year: number | null, loaM: number | null, bodyText: string, board: BoardId }}
 */
export function extractListingFromHtml(html, board) {
  const raw = String(html ?? "");
  const title = titleFromHtml(raw);
  let price = priceFromHtml(raw);
  const bodyText = bodyFromHtml(raw);
  if (!price) price = extractPriceFromText(`${title} ${bodyText}`);
  const parsed = parseListingText(`${title}\n${bodyText}`);
  return {
    title,
    price,
    year: parsed.year,
    loaM: parsed.loaM,
    bodyText,
    board,
  };
}
