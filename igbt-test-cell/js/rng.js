/* rng.js: noise hook n(x, σ) (03 §6, 02 §10).
   P0 build: σ = 0, so n(x) = x and the PRNG is never consulted.
   Seeded noise (σ > 0, mulberry32 + FNV-1a) is P1 and not built. */
window.IGBT = window.IGBT || {};
window.IGBT.rng = (function () {
  var prngCalls = 0;   // stays 0 while σ = 0 (checked by selfcheck)

  // n(x, sigma, seed, quantityId): multiplicative noise; σ = 0 returns x unchanged
  function n(x, sigma, seed, quantityId) {
    if (!(sigma > 0)) return x;
    throw new Error("Noise σ > 0 is P1 and not built in this version (quantity " + quantityId + ")");
  }

  return { n: n, prngCalls: function () { return prngCalls; } };
})();
