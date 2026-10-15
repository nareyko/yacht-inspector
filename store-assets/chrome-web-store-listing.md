# Chrome Web Store listing: FairHelm Yacht Inspector

## Short description (max 132 characters)

```
Open a yacht ad, see which CapEx items it leaves unstated and what a surveyor checks on that model. Zero Tracking.
```

## Detailed description

A yacht ad tells you the year, the price and the engine hours. It rarely tells you when the standing rigging was last changed, whether the saildrive diaphragm is due, or what the sails will cost you in two seasons.

FairHelm Yacht Inspector reads the ad you already have open on Boat24, YachtWorld, Scanboat, Blocket or DBA. It matches the boat against the FairHelm catalog of 93 models and adds a small panel at the bottom right of the page.

The panel shows:

- **Unstated CapEx items.** CapEx nodes the ad text says nothing about, given the boat's age: standing rigging, saildrive diaphragm, sails, teak and deck sealing, diesel, service batteries and electronics.
- **Survey checkpoints.** The points a surveyor should check on this model, loaded from the FairHelm model card.
- **Three links.** The full model card, the CapEx scanner, and the FairHelm listing review.

If the ad does not match a catalog model, the panel stays out of the way.

Matching and CapEx flags run in your browser. The listing text does not go to a server.

## Privacy summary

Zero Tracking. The extension has no analytics, no telemetry and no advertising identifiers. It reads the current listing only on the five supported boards, and it does that inside the page. After a local catalog match it makes one request to api.fairhelm.com for the matched model's card summary. That request carries the brand and model slug and nothing else. Browsing history and unrelated page content are never uploaded. Contact: https://fairhelm.com

## Permission justifications

**activeTab.** Lets the extension act on the listing tab you are viewing. It is used for that tab only and gives no access to other tabs.

**storage.** Reserved for small on-device UI preferences. Nothing stored under this permission leaves the device.

**host_permissions.**

- `*://*.boat24.com/*`, `*://*.yachtworld.com/*`, `*://*.scanboat.com/*`, `*://*.blocket.se/*`, `*://*.dba.dk/*`: needed to run the content script that reads the listing and shows the panel on these five boards. No other sites are touched.
- `https://api.fairhelm.com/*`: needed for the single GET request that returns the survey checkpoints for a matched model.
