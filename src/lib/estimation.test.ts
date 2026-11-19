import { test } from "node:test";
import assert from "node:assert/strict";
import { estimate, PICKUP_DEFAULTS } from "./estimation";

test("apport : pas de frais, coefficient qualité appliqué", () => {
  const r = estimate({
    mode: "APPORT",
    lines: [
      { materialCode: "PET", pricePerKg: 500, kg: 10, quality: "TRIE_PROPRE" },
      { materialCode: "CARTON", pricePerKg: 200, kg: 10, quality: "MELANGE" },
    ],
  });
  assert.equal(r.gross, 5000 + 800);
  assert.equal(r.pickupFee, 0);
  assert.equal(r.net, 5800);
});

test("enlèvement : forfait + distance déduits", () => {
  const r = estimate({
    mode: "ENLEVEMENT",
    distanceKm: 4,
    lines: [{ materialCode: "ALU", pricePerKg: 3000, kg: 5, quality: "TRIE_PROPRE" }],
  });
  assert.equal(r.pickupFee, PICKUP_DEFAULTS.baseFee + 4 * PICKUP_DEFAULTS.perKm);
  assert.equal(r.net, 15000 - 4000);
});

test("enlèvement offert au-delà du seuil", () => {
  const r = estimate({
    mode: "ENLEVEMENT",
    distanceKm: 10,
    lines: [{ materialCode: "CUIVRE", pricePerKg: 20000, kg: 5, quality: "TRIE_PROPRE" }],
  });
  assert.equal(r.pickupFee, 0);
});

test("le net n'est jamais négatif", () => {
  const r = estimate({
    mode: "ENLEVEMENT",
    distanceKm: 20,
    lines: [{ materialCode: "PET", pricePerKg: 500, kg: 1, quality: "MELANGE" }],
  });
  assert.equal(r.net, 0);
});
