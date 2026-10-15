/**
 * Service worker: fetches the public card-summary and serves the catalog URL.
 * No analytics. No remote code execution.
 */

const API_BASE = "https://api.fairhelm.com/api/public/v1";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message !== "object") return false;

  if (message.type === "GET_CATALOG_URL") {
    sendResponse({ ok: true, url: chrome.runtime.getURL("data/catalog-index.json") });
    return false;
  }

  if (message.type === "FETCH_CARD_SUMMARY") {
    const brand = String(message.brand || "").trim();
    const model = String(message.model || "").trim();
    if (!brand || !model) {
      sendResponse({ ok: false, error: "Brand or model is missing" });
      return false;
    }

    const url = `${API_BASE}/models/${encodeURIComponent(brand)}/${encodeURIComponent(model)}/card-summary`;
    fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          sendResponse({
            ok: false,
            error: `HTTP ${res.status}`,
            status: res.status,
            body: text.slice(0, 200),
          });
          return;
        }
        const data = await res.json();
        sendResponse({ ok: true, data });
      })
      .catch((err) => {
        sendResponse({
          ok: false,
          error: err?.message || "Network request failed",
        });
      });

    return true; // async sendResponse
  }

  return false;
});
