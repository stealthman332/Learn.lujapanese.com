/* ---- DOM helpers --------------------------------------------------------- */
import { clamp } from './utils.js';
import { furi } from './furigana.js';
import { Speech } from './speech.js';

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") n.className = v;
    else if (k === "html") n.innerHTML = v;
    else if (k === "text") n.textContent = v;
    else if (k === "style" && typeof v === "object") Object.assign(n.style, v);
    else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat(4)) {
    if (kid == null || kid === false) continue;
    n.append(kid.nodeType ? kid : document.createTextNode(kid));
  }
  return n;
}

export const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export function toast(msg, ms = 2400) {
  const host = $("#toasthost"); if (!host) return;
  host.innerHTML = "";
  const t = el("div", { class: "toast", role: "status", text: msg });
  host.append(t);
  setTimeout(() => { t.style.opacity = "0"; t.style.transition = "opacity .3s"; setTimeout(() => t.remove(), 320); }, ms);
}

export function modal(title, bodyNode, opts = {}) {
  const host = $("#modalhost");
  const close = () => { host.innerHTML = ""; document.removeEventListener("keydown", onKey); };
  const onKey = e => { if (e.key === "Escape") close(); };
  const sheet = el("div", { class: "sheet", role: "dialog", "aria-modal": "true", "aria-label": title },
    el("header", {},
      el("div", {}, el("h3", { style: { fontSize: "17px" }, text: title }),
        opts.sub && el("div", { class: "small muted", text: opts.sub })),
      el("button", { class: "x", "aria-label": "Close", onclick: close, html: "&times;" })),
    el("div", { class: "body" }, bodyNode));
  const veil = el("div", { class: "veil", onclick: e => { if (e.target === veil) close(); } }, sheet);
  host.innerHTML = ""; host.append(veil);
  document.addEventListener("keydown", onKey);
  sheet.querySelector("button,a,input,[tabindex]")?.focus();
  return close;
}

export function bar(v, cls = "") {
  return el("div", { class: "bar " + cls }, el("i", { style: { width: clamp(v, 0, 100) + "%" } }));
}

export function stat(n, label) {
  return el("div", { class: "stat" }, el("b", { text: String(n) }), el("span", { text: label }));
}

export function jp(text, cls = "") {
  return el("span", { class: cls, html: furi(text) });
}

export function speakBtn(text, label = "Listen") {
  return el("button", { class: "btn ghost sm", title: label, onclick: e => { e.stopPropagation(); Speech.say(text, { force: true }); } }, "🔊");
}
