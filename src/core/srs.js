/* ---- SRS: SM-2, trimmed for a self-study app ---------------------------- */
import { Store } from './store.js';
import { shuffle } from './utils.js';

export const SRS = {
  card(id) {
    return Store.d.srs[id] || (Store.d.srs[id] = {
      ef: 2.5, iv: 0, rep: 0, due: 0, lapses: 0, seen: 0, right: 0, wrong: 0
    });
  },
  peek(id) { return Store.d.srs[id]; },
  /* q: 0 again · 1 hard · 2 good · 3 easy */
  grade(id, q) {
    const c = this.card(id), now = Date.now();
    c.seen++;
    if (q === 0) {
      c.wrong++; c.lapses++; c.rep = 0; c.iv = 0;
      c.ef = Math.max(1.3, c.ef - 0.22);
      c.due = now + 6e4 * 4;               /* back in ~4 min */
    } else {
      c.right++;
      const qq = [0, 3, 4, 5][q];
      c.ef = Math.max(1.3, c.ef + (0.1 - (5 - qq) * (0.08 + (5 - qq) * 0.02)));
      c.rep++;
      if (c.rep === 1) c.iv = q === 1 ? 1 : q === 3 ? 3 : 1;
      else if (c.rep === 2) c.iv = q === 1 ? 3 : q === 3 ? 8 : 6;
      else c.iv = Math.round(c.iv * c.ef * (q === 1 ? 0.6 : q === 3 ? 1.35 : 1));
      c.iv = Math.min(c.iv, 365);
      c.due = now + c.iv * 864e5;
    }
    Store.save();
    return c;
  },
  /* 0..1 how inked this square is */
  strength(id) {
    const c = Store.d.srs[id]; if (!c || !c.rep) return 0;
    return Math.min(1, 0.18 + Math.log2(1 + c.iv) / 7.2);
  },
  due(id) { const c = Store.d.srs[id]; return !c || c.due <= Date.now(); },
  isNew(id) { return !Store.d.srs[id]; },
  queue(ids, { cap = 40, newCap = 12 } = {}) {
    const now = Date.now(), rev = [], fresh = [];
    for (const id of ids) {
      const c = Store.d.srs[id];
      if (!c) fresh.push(id);
      else if (c.due <= now) rev.push(id);
    }
    rev.sort((a, b) => Store.d.srs[a].due - Store.d.srs[b].due);
    return rev.slice(0, cap).concat(shuffle(fresh).slice(0, newCap));
  },
  counts(ids) {
    const now = Date.now(); let n = 0, d = 0, k = 0;
    for (const id of ids) {
      const c = Store.d.srs[id];
      if (!c) n++; else if (c.due <= now) d++; else if (c.iv >= 21) k++;
    }
    return { fresh: n, due: d, known: k, total: ids.length };
  }
};
