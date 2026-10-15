/**
 * Slim multi-lang port of frontend CapEx BoatAdDecoder parseListingText + deriveNodeStatuses.
 * Sufficient for year / loa / engineHours + unstated node detection.
 */

import { CAPEX_NODE_IDS } from "./capex-nodes.js";

export const RIGGING_AGE_YEARS = 10;
export const SAILDRIVE_AGE_YEARS = 7;
export const SAILS_AGE_YEARS = 10;
export const TEAK_AGE_YEARS = 12;
export const DIESEL_HOURS_THRESHOLD = 2000;
export const ELECTRONICS_AGE_YEARS = 12;

function normalizeListingText(text) {
  return String(text ?? "")
    .normalize("NFKC")
    .toLowerCase();
}

function matchAny(haystack, patterns) {
  return patterns.some((re) => re.test(haystack));
}

const LOA_PATTERNS = [
  /(?:loa|l\.?\s*o\.?\s*a\.?|länge|lange|längd|langd|eslora|longueur|lengte|długość|dlugosc|длина)[^\d]{0,20}(\d{1,2}(?:[.,]\d{1,2})?)\s*(?:m|м|meter|metres?|meters?)?\b/i,
  /\b(\d{1,2}(?:[.,]\d{1,2})?)\s*(?:m|м)\b(?!\s*(?:ft|feet))/i,
  /\b(\d{2}(?:[.,]\d{1,2})?)\s*(?:ft|feet|')\b/i,
];

const YEAR_PATTERNS = [
  /(?:built|baujahr|byggår|byggar|año|annee|année|bouwjaar|rok\s*(?:budowy|produkcji)|год(?:\s*постройки)?|year)[^\d]{0,12}(19\d{2}|20[0-2]\d)\b/i,
  /\b(19\d{2}|20[0-2]\d)\s*(?:built|baujahr|byggår)\b/i,
  /\b(?:bj|by)[.\s:-]*?(19\d{2}|20[0-2]\d)\b/i,
];

const HOURS_PATTERNS = [
  /(?:engine\s*hours?|motorstunden|betriebsstunden|gångtimmar|gangtimmar|horas\s*(?:de\s*)?motor|heures\s*(?:moteur)?|draaiuren|motogodziny|моточас(?:ов|а)?|моточасов)[^\d]{0,16}(\d{2,5})\b/i,
  /\b(\d{2,5})\s*(?:h|hrs?|stunden|timmar|horas|heures|uren|godz)\b(?:[^\n]{0,40}(?:engine|motor|diesel|volvo|yanmar))?/i,
];

const RIGGING_ANY = [
  /standing\s*rigging/,
  /\brigging\b/,
  /\bwanten\b/,
  /\bstagen\b/,
  /\bvant(?:en)?\b/,
  /\bhaubans?\b/,
  /\bwanty\b/,
  /стояч(?:ий|его)\s*такелаж/,
  /вант[ыае]?/,
];

const RIGGING_RECENT = [
  /(?:new|neu|ny|nuevo|neuf|nieuw|nowy|новый|замен)\w*.{0,40}(?:standing\s*rigging|wanten|vant|haubans|wanty|такелаж|вант)/,
  /(?:standing\s*rigging|wanten|vant(?:en)?|haubans|wanty|такелаж).{0,40}(?:replaced|erneuert|utbytt|bytta|bytt|cambiad|changé|vervangen|wymien|замен)/,
  /(?:vant|wanten|rigging).{0,20}(?:bytta|bytt|utbytt|erneuert|replaced).{0,12}(20\d{2}|19\d{2})/,
  /rigging\s*(?:replaced|new)\s*(?:in\s*)?(20\d{2}|19\d{2})/,
];

const SAILDRIVE_ANY = [
  /saildrive/,
  /segelantrieb/,
  /manschette/,
  /\bbälg\b/,
  /\bbalg\b/,
  /joint\s*de\s*saildrive/,
  /мембран[аы]\s*сейлдрайв/,
  /сейлдрайв/,
];

const SAILDRIVE_RECENT = [
  /(?:saildrive|manschette|bälg|balg|мембран).{0,40}(?:new|neu|ny|replaced|erneuert|utbytt|замен)/,
  /(?:new|neu|ny|nuevo|замен)\w*.{0,40}(?:saildrive|manschette|diaphragm|мембран)/,
];

const SAILS_ANY = [
  /\bsails?\b/,
  /\bsegel(?:n)?\b/,
  /\bvelas?\b/,
  /\bvoiles?\b/,
  /\bzeilen\b/,
  /\bżagl/,
  /\bпарус/,
  /\bmain\s*(?:sail)?\b/,
  /\bgenoa\b/,
  /\bgroßsegel\b/,
  /\bgrosssegel\b/,
];

const SAILS_RECENT = [
  /(?:new|neu|ny|nuevo|neuf|nieuw|nowy|новые?)\s+(?:sails?|segel|velas?|voiles?|zeilen|żagl|парус)/,
  /(?:sails?|segel|velas?|voiles?).{0,30}(?:new|neu|replaced|erneuert|202[0-9])/,
];

const TEAK_ANY = [
  /teak\s*deck/,
  /\bteakdeck\b/,
  /\bteakdäck\b/,
  /\bteakdaeck\b/,
  /\bteakhimmel\b/,
  /cubierta\s*de\s*teca/,
  /pont\s*en\s*teck/,
  /тиков(?:ая|ой)\s*палуб/,
  /\bteak\b/,
];

const TEAK_RECENT = [
  /teak.{0,40}(?:new|neu|ny|renov|refurbished|erneuert|omfog|замен|перебрал)/,
  /(?:new|neu|ny|nuevo|замен)\w*.{0,30}teak/,
];

const ELECTRONICS_ANY = [
  /autopilot/,
  /chartplotter/,
  /plotter/,
  /raymarine/,
  /garmin/,
  /b\s*&\s*g/,
  /ais\b/,
  /liferaft/,
  /rettungsinsel/,
  /livflotte/,
  /электроник/,
  /автопилот/,
  /картплоттер/,
];

const ELECTRONICS_RECENT = [
  /(?:new|neu|ny|nuevo|neuf|новый)\s+(?:autopilot|chartplotter|plotter|electronics|ais|автопилот|плот)/,
  /(?:autopilot|chartplotter|plotter|electronics).{0,30}(?:new|neu|replaced|202[0-9])/,
];

const VAT_PAID = [
  /(?:eu\s*)?vat\s*paid/,
  /mwst\.?\s*bezahlt/,
  /umsatzsteuer\s*bezahlt/,
  /moms\s*betald/,
  /iva\s*pagad/,
  /tva\s*payé/,
  /btw\s*betaald/,
  /vat\s*opłacon/,
  /ндс\s*уплачен/,
  /ндс\s*оплачен/,
];

const VAT_NOT_PAID = [
  /vat\s*(?:not\s*paid|unpaid|exempt)/,
  /mwst\.?\s*nicht\s*bezahlt/,
  /moms\s*ej\s*betald/,
  /iva\s*no\s*pagad/,
  /ндс\s*не\s*(?:уплачен|оплачен)/,
];

function extractLoaM(text) {
  for (const re of LOA_PATTERNS) {
    const m = text.match(re);
    if (!m?.[1]) continue;
    const raw = Number(m[1].replace(",", "."));
    if (!Number.isFinite(raw) || raw <= 0) continue;
    const matched = m[0].toLowerCase();
    if (/\b(?:ft|feet|')\b/.test(matched) || (raw > 20 && raw < 55 && !/\bm\b|м/.test(matched))) {
      const metres = raw * 0.3048;
      if (metres >= 6 && metres <= 30) return Math.round(metres * 10) / 10;
      continue;
    }
    if (raw >= 6 && raw <= 30) return Math.round(raw * 10) / 10;
  }
  return null;
}

function extractYear(text) {
  for (const re of YEAR_PATTERNS) {
    const m = text.match(re);
    if (!m?.[1]) continue;
    const year = Number(m[1]);
    if (year >= 1960 && year <= 2030) return year;
  }
  return null;
}

function extractHours(text) {
  for (const re of HOURS_PATTERNS) {
    const m = text.match(re);
    if (!m?.[1]) continue;
    const hours = Number(m[1]);
    if (hours >= 10 && hours <= 20000) return hours;
  }
  return null;
}

/**
 * @param {string} raw
 * @returns {{
 *   loaM: number | null,
 *   year: number | null,
 *   engineHours: number | null,
 *   standingRiggingMentioned: boolean,
 *   standingRiggingRecent: boolean,
 *   saildriveMentioned: boolean,
 *   saildriveRecent: boolean,
 *   sailsMentioned: boolean,
 *   sailsRecent: boolean,
 *   teakMentioned: boolean,
 *   teakRecent: boolean,
 *   electronicsMentioned: boolean,
 *   electronicsRecent: boolean,
 *   vatPaidMentioned: boolean,
 *   vatPaid: boolean | null,
 * }}
 */
export function parseListingText(raw) {
  const text = normalizeListingText(raw);
  const vatPaidMentioned = matchAny(text, VAT_PAID) || matchAny(text, VAT_NOT_PAID);
  let vatPaid = null;
  if (matchAny(text, VAT_PAID)) vatPaid = true;
  else if (matchAny(text, VAT_NOT_PAID)) vatPaid = false;

  return {
    loaM: extractLoaM(text),
    year: extractYear(text),
    engineHours: extractHours(text),
    standingRiggingMentioned: matchAny(text, RIGGING_ANY),
    standingRiggingRecent: matchAny(text, RIGGING_RECENT),
    saildriveMentioned: matchAny(text, SAILDRIVE_ANY),
    saildriveRecent: matchAny(text, SAILDRIVE_RECENT),
    sailsMentioned: matchAny(text, SAILS_ANY),
    sailsRecent: matchAny(text, SAILS_RECENT),
    teakMentioned: matchAny(text, TEAK_ANY),
    teakRecent: matchAny(text, TEAK_RECENT),
    electronicsMentioned: matchAny(text, ELECTRONICS_ANY),
    electronicsRecent: matchAny(text, ELECTRONICS_RECENT),
    vatPaidMentioned,
    vatPaid,
  };
}

export function hullAgeYears(year, asOfYear = 2026) {
  if (year == null || !Number.isFinite(year)) return null;
  return Math.max(0, asOfYear - year);
}

/**
 * @param {number | null} age
 * @param {ReturnType<typeof parseListingText> | null | undefined} p
 * @returns {'ok' | 'due' | 'unstated' | 'na'}
 */
export function statusStandingRigging(age, p) {
  if (p?.standingRiggingRecent) return "ok";
  if (p?.standingRiggingMentioned) return "due";
  if (age != null && age >= RIGGING_AGE_YEARS) return "unstated";
  return age != null && age >= 8 ? "unstated" : "ok";
}

/**
 * @param {number | null} age
 * @param {ReturnType<typeof parseListingText> | null | undefined} p
 */
export function statusSaildrive(age, p) {
  if (p?.saildriveRecent) return "ok";
  if (p?.saildriveMentioned) return "due";
  if (age != null && age >= SAILDRIVE_AGE_YEARS) return "unstated";
  return "ok";
}

/**
 * @param {number | null} age
 * @param {ReturnType<typeof parseListingText> | null | undefined} p
 */
export function statusSails(age, p) {
  if (p?.sailsRecent) return "ok";
  if (p?.sailsMentioned) return "due";
  if (age != null && age >= SAILS_AGE_YEARS) return "unstated";
  return age != null && age >= 8 ? "unstated" : "ok";
}

/**
 * @param {number | null} age
 * @param {ReturnType<typeof parseListingText> | null | undefined} p
 */
export function statusTeak(age, p) {
  if (p?.teakRecent) return "ok";
  if (p?.teakMentioned) return "due";
  if (age != null && age >= TEAK_AGE_YEARS) return "unstated";
  return "na";
}

/**
 * @param {number | null} age
 * @param {number | null} hours
 * @param {ReturnType<typeof parseListingText> | null | undefined} p
 */
export function statusDiesel(age, hours, p) {
  const h = hours ?? p?.engineHours ?? null;
  if (h != null && h > DIESEL_HOURS_THRESHOLD) return "due";
  if (h == null && age != null && age >= 12) return "unstated";
  if (h == null && age != null && age >= 8) return "unstated";
  return "ok";
}

/**
 * @param {number | null} age
 * @param {ReturnType<typeof parseListingText> | null | undefined} p
 */
export function statusElectronics(age, p) {
  if (p?.electronicsRecent) return "ok";
  if (p?.electronicsMentioned) return "due";
  if (age != null && age >= ELECTRONICS_AGE_YEARS) return "unstated";
  return age != null && age >= 10 ? "unstated" : "ok";
}

/**
 * @param {{
 *   year: number | null,
 *   engineHours: number | null,
 *   parsed?: ReturnType<typeof parseListingText> | null,
 *   asOfYear?: number,
 * }} input
 * @returns {Record<string, 'ok' | 'due' | 'unstated' | 'na'>}
 */
export function deriveNodeStatuses(input) {
  const asOfYear = input.asOfYear ?? 2026;
  const age = hullAgeYears(input.year, asOfYear);
  const p = input.parsed;
  return {
    standing_rigging: statusStandingRigging(age, p),
    saildrive_diaphragm: statusSaildrive(age, p),
    sails: statusSails(age, p),
    teak_sealing: statusTeak(age, p),
    diesel: statusDiesel(age, input.engineHours, p),
    batteries_electronics_safety: statusElectronics(age, p),
  };
}

/**
 * Parse listing text and return top CapEx node ids with status "unstated".
 * @param {string} text
 * @param {number} [limit=5]
 * @returns {string[]}
 */
export function topUnstatedNodes(text, limit = 5) {
  const parsed = parseListingText(text);
  const statuses = deriveNodeStatuses({
    year: parsed.year,
    engineHours: parsed.engineHours,
    parsed,
  });
  const unstated = CAPEX_NODE_IDS.filter((id) => statuses[id] === "unstated");
  return unstated.slice(0, Math.max(0, limit));
}
