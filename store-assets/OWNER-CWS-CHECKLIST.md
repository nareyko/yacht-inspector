# Owner checklist - Chrome Web Store upload (MGP-W2-04)

**Status 2026-10-15: DEFERRED.** Zip, listing copy, and GitHub Release `v1.0.0` are ready. Chrome Web Store submit is postponed - do it later when the owner chooses. Agents: remind in MGP HANDOFF; do not block `Next`.

1. Open [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) (one-time $5 developer fee if not paid).
2. **New item** → upload `fairhelm-yacht-inspector-1.0.0.zip` from [GitHub Release v1.0.0](https://github.com/nareyko/yacht-inspector/releases/tag/v1.0.0) or `packages/yacht-inspector/dist/` in the monorepo.
3. Copy texts from [chrome-web-store-listing.md](./chrome-web-store-listing.md) (short ≤132, detailed, privacy, permission justifications).
4. Upload graphics: `promo-440x280.png`, `screenshot-1280x800.png`, icons from `../icons/`.
5. Single purpose / privacy practices: Zero Tracking; contact https://fairhelm.com
6. Visibility: Public → **Submit for review**.
7. After approval: paste Store URL into FairHelm `for-ai` / `llms.txt` (follow-up commit) and mark tracker `W2-04` `prod_verified`.
