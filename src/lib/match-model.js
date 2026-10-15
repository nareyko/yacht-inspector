/**
 * Fuzzy match listing title against FairHelm catalog-index.json models.
 */

/**
 * @typedef {{ brand_slug: string, model_slug: string, name: string }} CatalogModel
 * @typedef {{ schema_version?: number, model_count?: number, models: CatalogModel[] }} CatalogIndex
 */

const BRAND_ALIASES = {
  "hallberg-rassy": ["hallberg-rassy", "hallberg rassy", "hallbergrassy", "hr"],
  bavaria: ["bavaria", "bavaria yachtbau"],
  beneteau: ["beneteau", "bénéteau", "oceanis"],
  "x-yachts": ["x-yachts", "x yachts", "xyachts"],
  "sweden-yachts": ["sweden-yachts", "sweden yachts", "sweden"],
  najad: ["najad"],
  arcona: ["arcona", "arcana"],
  comfortina: ["comfortina"],
  maxi: ["maxi"],
  albin: ["albin"],
  linjett: ["linjett"],
  finngulf: ["finngulf"],
  omega: ["omega"],
  wasa: ["wasa"],
  contest: ["contest"],
  allures: ["allures"],
  nauticat: ["nauticat"],
  allegro: ["allegro"],
};

/**
 * @param {string} s
 * @returns {string}
 */
export function normalizeMatchText(s) {
  return String(s ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9äöüßåæø.+]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Score how well title matches a catalog model (higher is better).
 * Requires brand signal + model number/name signal when possible.
 * @param {string} titleNorm
 * @param {CatalogModel} model
 * @returns {number}
 */
function scoreModel(titleNorm, model) {
  const brandAliases = BRAND_ALIASES[model.brand_slug] || [model.brand_slug.replace(/-/g, " ")];
  const brandHit = brandAliases.some((a) => {
    const n = normalizeMatchText(a);
    return n.length >= 2 && titleNorm.includes(n);
  });
  // HR short form: "hallberg-rassy 36" or "hr 36" or "hr36"
  const isHr = model.brand_slug === "hallberg-rassy";
  const hrShort =
    isHr &&
    (/\bhr\b/.test(titleNorm) ||
      titleNorm.includes("hallberg") ||
      titleNorm.includes("hallberg rassy"));

  if (!brandHit && !hrShort) return 0;

  const nameNorm = normalizeMatchText(model.name);
  if (nameNorm && titleNorm.includes(nameNorm)) return 100 + nameNorm.length;

  const modelSlugNorm = normalizeMatchText(model.model_slug.replace(/-/g, " "));
  if (modelSlugNorm && titleNorm.includes(modelSlugNorm)) return 90 + modelSlugNorm.length;

  // Compact: "hr36" inside title or title has "36" with HR brand
  const compact = model.model_slug.replace(/-/g, "").toLowerCase();
  if (compact.length >= 3 && titleNorm.replace(/\s/g, "").includes(compact)) {
    return 85 + compact.length;
  }

  const num = model.model_slug.match(/(\d{2,3}[a-z]*)/i)?.[1]?.toLowerCase();
  if (num && (titleNorm.includes(` ${num} `) || titleNorm.endsWith(` ${num}`) || titleNorm.includes(num))) {
    // Prefer longer / more specific numbers (372 > 37)
    return 70 + num.length * 2 + (brandHit || hrShort ? 10 : 0);
  }

  // Brand-only match is too weak to return
  return 0;
}

/**
 * @param {string} title
 * @param {CatalogIndex | CatalogModel[]} catalog
 * @returns {CatalogModel | null}
 */
export function matchModel(title, catalog) {
  const models = Array.isArray(catalog) ? catalog : catalog?.models;
  if (!models?.length || !title) return null;

  const titleNorm = normalizeMatchText(title);
  if (!titleNorm) return null;

  let best = null;
  let bestScore = 0;

  for (const model of models) {
    const score = scoreModel(titleNorm, model);
    if (score > bestScore) {
      bestScore = score;
      best = model;
    }
  }

  // Require a real model signal (not brand-only zero)
  if (!best || bestScore < 70) return null;

  return {
    brand_slug: best.brand_slug,
    model_slug: best.model_slug,
    name: best.name,
  };
}

/**
 * Load catalog via chrome.runtime.getURL (content script / extension context).
 * In Node tests, reads the packaged JSON from disk (fetch(file:) is unsupported).
 * @returns {Promise<CatalogIndex>}
 */
export async function loadCatalogIndex() {
  if (typeof chrome !== "undefined" && chrome.runtime?.getURL) {
    const url = chrome.runtime.getURL("data/catalog-index.json");
    const res = await fetch(url);
    if (!res.ok) throw new Error(`catalog-index fetch failed: ${res.status}`);
    return res.json();
  }

  const { readFileSync } = await import("node:fs");
  const { dirname, join } = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const file = join(dirname(fileURLToPath(import.meta.url)), "../../data/catalog-index.json");
  return JSON.parse(readFileSync(file, "utf8"));
}
