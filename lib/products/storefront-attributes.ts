import { normalizeStorefrontCopy } from "./storefront-copy";

const LABELS: Record<string, string> = {
  "machine learning conceptual": "noțiuni despre învățarea automată",
  "pattern recognition": "recunoașterea tiparelor",
  robotics: "Robotică",
  coding: "Programare",
  "logic-game": "Joc de logică",
  "puzzle-iq": "Puzzle de logică",
  construction: "Construcții",
  "renewable-energy": "Energie regenerabilă",
  magnetic: "Magnetism",
  "marble-run": "Traseu cu bile",
  optics: "Optică",
  microscopy: "Microscopie",
  "chain-reaction": "Reacție în lanț",
  "science-experiment": "Experiment științific",
  astronomy: "Astronomie",
  mathematics: "Matematică",
  "coding and robotics": "Programare și robotică",
  "early engineering": "Primele construcții",
  electronics: "Electronică",
  "magnetic construction": "Construcții magnetice",
  "math and logic": "Matematică și logică",
  "mechanics and energy": "Mecanică și energie",
  "science and nature": "Știință și natură",
  "add-on": "Accesoriu pentru set",
  expansion: "Extensie pentru set",
};

/** Feed values may be enum keys or free text; never print translation keys. */
export function storefrontAttributeLabel(value: string): string {
  return LABELS[value.toLowerCase()] ?? normalizeStorefrontCopy(value);
}
