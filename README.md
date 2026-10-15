# FairHelm Yacht Inspector

Chrome Manifest V3 extension for Boat24, YachtWorld, Scanboat, Blocket and DBA.

Open a yacht listing → match against the FairHelm catalog (93 models) → see **unstated CapEx** items and survey checkpoints. **Zero Tracking.**

## Install

| Channel | Link |
|---------|------|
| **Sideload ZIP** | [fairhelm.com/downloads/fairhelm-yacht-inspector.zip](https://fairhelm.com/downloads/fairhelm-yacht-inspector.zip) |
| **GitHub Release** | [Releases](https://github.com/nareyko/yacht-inspector/releases) |
| **Chrome Web Store** | *pending review* (listing pack in `store-assets/`) |

### Load unpacked

1. Download and unzip the release asset (or clone this repo).
2. `chrome://extensions` → Developer mode → **Load unpacked** → select this folder.

## Privacy

No analytics, no telemetry, no ads. Listing text stays in the page. One GET to `api.fairhelm.com` for the matched model card summary only. See [PRIVACY.md](./PRIVACY.md).

## Links

- CapEx scanner: https://fairhelm.com/en/yachts/tools/capex-scanner/
- Listing review (€49): https://fairhelm.com/en/yachts/services/listing-review/
- Formulas: https://fairhelm.com/en/yachts/formulas/
- Telegram bot: [@FairHelmYachtBot](https://t.me/FairHelmYachtBot)

## License

MIT © FairHelm ([fairhelm.com](https://fairhelm.com))
