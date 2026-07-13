/**
 * Clamp n to the inclusive range [lo, hi].
 */
export const clamp = (n, lo, hi) => Math.min(Math.max(n, lo), hi);
