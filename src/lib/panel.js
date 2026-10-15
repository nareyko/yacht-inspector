/**
 * Compact fixed panel (bottom-right). Zero Tracking.
 */

import { CAPEX_NODE_LABELS_EN } from "./capex-nodes.js";

const PANEL_ID = "fairhelm-yacht-inspector-panel";
const SITE = "https://fairhelm.com";

/**
 * @param {{
 *   model: { brand_slug: string, model_slug: string, name: string } | null,
 *   unstatedIds?: string[],
 *   surveyCheckpoints?: string[],
 *   listing?: { title?: string, price?: string | null, year?: number | null, loaM?: number | null, board?: string },
 *   cardError?: string | null,
 * }} data
 * @returns {string}
 */
export function buildPanelHTML(data) {
  const model = data.model;
  const unstated = (data.unstatedIds || []).slice(0, 5);
  const checkpoints = (data.surveyCheckpoints || []).slice(0, 5);

  const modelUrl = model
    ? `${SITE}/en/yachts/models/${model.brand_slug}/${model.model_slug}/`
    : `${SITE}/en/yachts/models/`;
  const capexUrl = `${SITE}/en/yachts/tools/capex-scanner/`;
  const reviewUrl = model
    ? `${SITE}/en/yachts/services/listing-review/?brand=${encodeURIComponent(model.brand_slug)}&model=${encodeURIComponent(model.model_slug)}`
    : `${SITE}/en/yachts/services/listing-review/`;

  const unstatedLis = unstated.length
    ? unstated
        .map((id) => {
          const label = CAPEX_NODE_LABELS_EN[id] || id;
          return `<li data-node="${escapeAttr(id)}"><span class="fhyi-flag">Unstated</span> ${escapeHtml(label)}</li>`;
        })
        .join("")
    : `<li class="fhyi-muted">No age-implied Unstated flags in this ad text.</li>`;

  const checkpointLis = checkpoints.length
    ? checkpoints.map((c) => `<li>${escapeHtml(c)}</li>`).join("")
    : data.cardError
      ? `<li class="fhyi-muted">${escapeHtml(data.cardError)}</li>`
      : `<li class="fhyi-muted">Survey checkpoints unavailable.</li>`;

  const metaBits = [];
  if (data.listing?.year) metaBits.push(`Year ${data.listing.year}`);
  if (data.listing?.loaM) metaBits.push(`LOA ${data.listing.loaM} m`);
  if (data.listing?.price) metaBits.push(data.listing.price);
  const metaLine = metaBits.length
    ? `<p class="fhyi-meta">${escapeHtml(metaBits.join(" / "))}</p>`
    : "";

  const modelLine = model
    ? `<p class="fhyi-model"><strong>${escapeHtml(model.name)}</strong> <span class="fhyi-muted">(${escapeHtml(model.brand_slug)}/${escapeHtml(model.model_slug)})</span></p>`
    : `<p class="fhyi-model fhyi-muted">No catalog match</p>`;

  return `
<div class="fhyi-root" id="${PANEL_ID}" role="complementary" aria-label="FairHelm Yacht Inspector">
  <header class="fhyi-header">
    <span class="fhyi-brand">FairHelm</span>
    <span class="fhyi-product">Yacht Inspector</span>
    <button type="button" class="fhyi-close" aria-label="Close" data-fhyi-close>×</button>
  </header>
  ${modelLine}
  ${metaLine}
  <section class="fhyi-section">
    <h2>CapEx Unstated</h2>
    <ul class="fhyi-list">${unstatedLis}</ul>
  </section>
  <section class="fhyi-section">
    <h2>Survey checkpoints</h2>
    <ul class="fhyi-list">${checkpointLis}</ul>
  </section>
  <nav class="fhyi-links">
    <a href="${escapeAttr(modelUrl)}" target="_blank" rel="noopener noreferrer">Model card</a>
    <a href="${escapeAttr(capexUrl)}" target="_blank" rel="noopener noreferrer">CapEx scanner</a>
    <a href="${escapeAttr(reviewUrl)}" target="_blank" rel="noopener noreferrer">Listing review €49</a>
  </nav>
  <p class="fhyi-privacy">Zero Tracking / reads this listing only</p>
</div>`.trim();
}

/**
 * @param {ParentNode} root
 * @param {Parameters<typeof buildPanelHTML>[0]} data
 */
export function mountPanel(root, data) {
  const existing = root.querySelector?.(`#${PANEL_ID}`) || document.getElementById(PANEL_ID);
  if (existing) existing.remove();

  const wrap = document.createElement("div");
  wrap.innerHTML = buildPanelHTML(data);
  const panel = wrap.firstElementChild;
  if (!panel) return null;

  // Document node (nodeType 9) → append to body; otherwise append to the given root.
  const host = root && root.nodeType === 9 ? (root.body || document.body) : root;
  if (!host) return null;
  host.appendChild(panel);

  panel.querySelector("[data-fhyi-close]")?.addEventListener("click", () => {
    panel.remove();
  });

  return panel;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, "&#39;");
}
