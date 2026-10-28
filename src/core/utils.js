/* ---- pure utility functions ----------------------------------------------- */

export function shuffle(a) {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.random() * (i + 1) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const pick = a => a[Math.random() * a.length | 0];

export const sample = (a, n) => shuffle(a).slice(0, n);

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
