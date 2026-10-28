/* ==========================================================================
   SQLite3 binary B-tree parser in pure JS
   ========================================================================== */

/* a tiny read-only SQLite reader: walks table b-trees, decodes records */
export function sqliteTables(bytes) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (new TextDecoder().decode(bytes.subarray(0, 15)) !== "SQLite format 3") throw new Error("Not an SQLite database.");
  let pageSize = dv.getUint16(16); if (pageSize === 1) pageSize = 65536;
  const reserved = bytes[20], U = pageSize - reserved;
  const td = new TextDecoder("utf-8");
  const varint = pos => { let v = 0; for (let i = 0; i < 9; i++) { const b = bytes[pos + i]; if (i === 8) { v = v * 256 + b; return [v, pos + 9]; } v = v * 128 + (b & 0x7f); if (!(b & 0x80)) return [v, pos + i + 1]; } return [v, pos + 9]; };
  const pageOff = n => (n - 1) * pageSize;
  function payload(cellPos, P) {
    const X = U - 35;
    if (P <= X) return bytes.subarray(cellPos, cellPos + P);
    const M = Math.floor((U - 12) * 32 / 255) - 23;
    let K = M + ((P - M) % (U - 4)); if (K > X) K = M;
    const out = new Uint8Array(P); out.set(bytes.subarray(cellPos, cellPos + K), 0);
    let got = K, ov = dv.getUint32(cellPos + K);
    while (got < P && ov) { const o = pageOff(ov); const take = Math.min(U - 4, P - got); out.set(bytes.subarray(o + 4, o + 4 + take), got); got += take; ov = dv.getUint32(o); }
    return out;
  }
  function record(buf) {
    const bv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    let [hs, p] = (() => { let v = 0, i = 0; for (; i < 9; i++) { const b = buf[i]; v = v * 128 + (b & 0x7f); if (!(b & 0x80)) break; } return [v, i + 1]; })();
    const types = []; let q = p;
    while (q < hs) { let v = 0, i = 0; for (; i < 9; i++) { const b = buf[q + i]; v = v * 128 + (b & 0x7f); if (!(b & 0x80)) break; } types.push(v); q += i + 1; }
    const vals = []; let d = hs;
    for (const t of types) {
      if (t === 0 || t === 8 || t === 9) { vals.push(t === 8 ? 0 : t === 9 ? 1 : null); continue; }
      if (t >= 1 && t <= 6) { const len = [0, 1, 2, 3, 4, 6, 8][t]; let v = 0; for (let i = 0; i < len; i++) v = v * 256 + buf[d + i]; if (buf[d] & 0x80) v -= Math.pow(2, 8 * len); vals.push(v); d += len; continue; }
      if (t === 7) { vals.push(bv.getFloat64(d)); d += 8; continue; }
      if (t >= 12) { const len = t % 2 === 0 ? (t - 12) / 2 : (t - 13) / 2; const s = buf.subarray(d, d + len); vals.push(t % 2 ? td.decode(s) : s); d += len; }
    }
    return vals;
  }
  function walk(root, cb) {
    const stack = [root], seen = new Set();
    while (stack.length) {
      const pg = stack.pop(); if (seen.has(pg)) continue; seen.add(pg);
      const base = pageOff(pg), h = pg === 1 ? base + 100 : base;
      const type = bytes[h], ncell = dv.getUint16(h + 3);
      const hdr = type === 0x05 || type === 0x02 ? 12 : 8;
      if (type === 0x05) { stack.push(dv.getUint32(h + 8)); for (let i = 0; i < ncell; i++) stack.push(dv.getUint32(base + dv.getUint16(h + hdr + i * 2))); continue; }
      if (type !== 0x0d) continue;
      for (let i = 0; i < ncell; i++) {
        let c = base + dv.getUint16(h + hdr + i * 2);
        const [P, c1] = varint(c); const [rowid, c2] = varint(c1);
        cb(rowid, record(payload(c2, P)));
      }
    }
  }
  const tables = {};
  walk(1, (rowid, r) => { if (r[0] === "table") tables[r[1]] = { root: r[3], sql: r[4] }; });
  const cols = sql => { const m = /\(([\s\S]*)\)/.exec(sql || ""); return m ? m[1].split(",").map(s => s.trim().split(/\s+/)[0].replace(/["`\[\]]/g, "")).filter(x => x && !/^(primary|unique|foreign|constraint|check)$/i.test(x)) : []; };
  return {
    has: t => !!tables[t],
    rows(t) {
      const T = tables[t]; if (!T) return [];
      const names = cols(T.sql); const out = [];
      walk(T.root, (rowid, vals) => { const o = { rowid }; names.forEach((n, i) => o[n] = vals[i] ?? (n === "id" ? rowid : null)); if (o.id == null) o.id = rowid; out.push(o); });
      return out;
    }
  };
}
