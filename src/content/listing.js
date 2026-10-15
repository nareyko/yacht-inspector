/**
 * Content script: extract listing, match catalog, flag unstated CapEx, mount panel.
 * Loads ESM libs via chrome.runtime.getURL (MV3, no bundler).
 * Fails soft when no model matches. Zero Tracking.
 */

(async function fairhelmYachtInspector() {
  if (window.__fairhelmYachtInspectorRan) return;
  window.__fairhelmYachtInspectorRan = true;

  try {
    const url = (path) => chrome.runtime.getURL(path);
    const [
      { detectBoard, extractListingFromDocument },
      { matchModel, loadCatalogIndex },
      { topUnstatedNodes },
      { mountPanel },
    ] = await Promise.all([
      import(url("src/lib/parse-listing-dom.js")),
      import(url("src/lib/match-model.js")),
      import(url("src/lib/parse-listing-text.js")),
      import(url("src/lib/panel.js")),
    ]);

    const board = detectBoard(location.hostname);
    if (board === "unknown") return;

    const listing = extractListingFromDocument(document, board);
    if (!listing.title && !listing.bodyText) return;

    let catalog;
    try {
      catalog = await loadCatalogIndex();
    } catch {
      return;
    }

    const model = matchModel(listing.title || listing.bodyText.slice(0, 200), catalog);
    if (!model) return;

    const unstatedIds = topUnstatedNodes(
      `${listing.title}\n${listing.bodyText}`,
      5,
    );

    /** @type {string[]} */
    let surveyCheckpoints = [];
    /** @type {string | null} */
    let cardError = null;

    try {
      const response = await chrome.runtime.sendMessage({
        type: "FETCH_CARD_SUMMARY",
        brand: model.brand_slug,
        model: model.model_slug,
      });
      if (response?.ok && response.data) {
        surveyCheckpoints = pickCheckpoints(response.data);
      } else {
        cardError = response?.error
          ? `Survey checkpoints: ${response.error}`
          : "Survey checkpoints unavailable right now";
      }
    } catch {
      cardError = "Survey checkpoints request failed";
    }

    mountPanel(document, {
      model,
      unstatedIds,
      surveyCheckpoints,
      listing,
      cardError,
    });
  } catch {
    // Fail soft: never break the host page
  }

  /**
   * @param {Record<string, unknown>} data
   * @returns {string[]}
   */
  function pickCheckpoints(data) {
    const candidates = [
      data.survey_checkpoints,
      data.surveyCheckpoints,
      data.checkpoints,
      data.top_survey_checkpoints,
    ];
    for (const c of candidates) {
      if (Array.isArray(c) && c.length) {
        return c.map((x) => String(x)).filter(Boolean).slice(0, 5);
      }
    }
    if (Array.isArray(data.survey_flags)) {
      return data.survey_flags.map((x) => String(x)).filter(Boolean).slice(0, 5);
    }
    return [];
  }
})();
