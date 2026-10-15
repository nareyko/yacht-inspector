# Privacy Policy: FairHelm Yacht Inspector

**Zero Tracking.**

## What the extension does not do

- It has no analytics SDK (no Google Analytics, Segment, Mixpanel, Plausible or similar).
- It sets no advertising identifiers and does no fingerprinting.
- It does not upload browsing history.
- It runs no remote code and injects no scripts from the network.
- It does not sell or share personal data with ad networks.

## What the extension reads

On supported listing hosts only (`boat24.com`, `yachtworld.com`, `scanboat.com`, `blocket.se`, `dba.dk`), a content script reads the current page's listing DOM: title, price hints and description text. It does this in the page to:

1. Match a FairHelm catalog model locally.
2. Derive unstated CapEx flags from the listing text locally.

Listing text is never sent to FairHelm servers for CapEx parsing.

## Network requests

The only FairHelm API call is:

```
GET https://api.fairhelm.com/api/public/v1/models/{brand}/{model}/card-summary
```

It runs after a successful local catalog match and carries only that brand and model path. The optional `storage` permission can keep interface preferences in the browser. It is never used to sync history off the device.

## Contact

FairHelm, https://fairhelm.com
