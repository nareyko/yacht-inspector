# FairHelm Yacht Inspector

Chrome Manifest V3 extension for Boat24, YachtWorld, Scanboat, Blocket and DBA listing pages. It matches the ad against the FairHelm catalog (93 models), flags CapEx items the ad leaves **unstated**, and loads survey checkpoints for the matched model from the public card-summary API.

## Install

| Channel | Link |
|---------|------|
| Sideload ZIP | https://fairhelm.com/downloads/fairhelm-yacht-inspector.zip |
| GitHub Release | https://github.com/nareyko/yacht-inspector/releases/tag/v1.0.0 |
| Chrome Web Store | *owner submit* - see `store-assets/OWNER-CWS-CHECKLIST.md` |

### Load unpacked in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this folder: `packages/yacht-inspector` (or the unzipped release).

There is no build step. The code is plain ESM JavaScript, and the content script loads its libraries through `chrome.runtime.getURL`.

## Privacy: Zero Tracking

- No analytics SDK, no telemetry, no advertising IDs.
- The listing is read inside the page and stays there.
- The only call to `api.fairhelm.com` is the `card-summary` request for a matched model.
- Browsing history and unrelated page content are never uploaded.

Full text: [PRIVACY.md](./PRIVACY.md).

## Host permissions

| Host | Purpose |
|------|---------|
| `*.boat24.com` | Listing content script |
| `*.yachtworld.com` | Listing content script |
| `*.scanboat.com` | Listing content script |
| `*.blocket.se` | Listing content script |
| `*.dba.dk` | Listing content script |
| `https://api.fairhelm.com/*` | Card summary for the matched model |

## API

```
GET https://api.fairhelm.com/api/public/v1/models/{brand}/{model}/card-summary
```

The background service worker sends this request after a local catalog match. Unstated CapEx flags are computed locally from the listing text. The only data in the request is the brand and model path.

## Scripts

```bash
cd packages/yacht-inspector
npm test          # node --test
npm run smoke     # parity + DOM fixture tests
```

## Package layout

- `manifest.json`: MV3 manifest
- `data/catalog-index.json`: 93-model index
- `src/background.js`: `FETCH_CARD_SUMMARY` handler
- `src/content/listing.js` and `panel.css`: panel injection
- `src/lib/*`: CapEx nodes, parsers, matcher, panel HTML
- `fixtures/`: static HTML for tests
- `test/`: `node:test` suites
