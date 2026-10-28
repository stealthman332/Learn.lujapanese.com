/* ==========================================================================
   ZIP stream decompressor using native DecompressionStream
   ========================================================================== */

export async function unzip(buf) {
  const dv = new DataView(buf), u8 = new Uint8Array(buf);
  let eocd = -1;
  for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 70000); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error("Not a zip file.");
  const n = dv.getUint16(eocd + 10, true); let p = dv.getUint32(eocd + 16, true);
  const files = {};
  for (let k = 0; k < n; k++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true), nameLen = dv.getUint16(p + 28, true), extra = dv.getUint16(p + 30, true), cmt = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
    const name = new TextDecoder().decode(u8.subarray(p + 46, p + 46 + nameLen));
    files[name] = { method, csize, off };
    p += 46 + nameLen + extra + cmt;
  }
  const read = async name => {
    const f = files[name]; if (!f) return null;
    const lnl = dv.getUint16(f.off + 26, true), lxl = dv.getUint16(f.off + 28, true);
    const data = u8.subarray(f.off + 30 + lnl + lxl, f.off + 30 + lnl + lxl + f.csize);
    if (f.method === 0) return data;
    if (f.method !== 8) throw new Error("Unsupported zip compression.");
    if (typeof DecompressionStream === "undefined") throw new Error("This browser can't unzip files — try a current Chrome, Edge, Firefox or Safari.");
    const ds = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return new Uint8Array(await new Response(ds).arrayBuffer());
  };
  return { names: Object.keys(files), read };
}
