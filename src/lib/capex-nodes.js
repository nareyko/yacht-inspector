/**
 * CapEx risk-node SSOT. Must match the frontend CapEx scanner:
 * frontend/src/lib/yachts/tools/capex-scanner-calculator.ts, with EN labels
 * in capex-scanner-content.ts. Parity test pins both IDs and labels.
 */

export const CAPEX_NODE_IDS = Object.freeze([
  "standing_rigging",
  "saildrive_diaphragm",
  "sails",
  "teak_sealing",
  "diesel",
  "batteries_electronics_safety",
]);

/** @type {Readonly<Record<string, string>>} */
export const CAPEX_NODE_LABELS_EN = Object.freeze({
  standing_rigging: "Standing rigging",
  saildrive_diaphragm: "Saildrive diaphragm",
  sails: "Sails (main + genoa)",
  teak_sealing: "Teak deck / deck hardware sealing",
  diesel: "Diesel (heat exchanger, elbow, injectors)",
  batteries_electronics_safety: "Service batteries, plotter, safety",
});
