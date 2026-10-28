/* ==========================================================================
   RUNTIME COMPATIBILITY & DEVICE SETUP
   Loaded before everything else.
   Fixes iOS Safari 100vh viewport bug and unlocks AudioContext/SpeechSynthesis
   on the first user touch event.
   ========================================================================== */

export function ymd(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}
if (typeof window !== "undefined") {
  window.__ymd = ymd;
}

export function initCompat() {
  /* Array.prototype.at — Safari 15.4+, Chrome 92+. */
  if (!Array.prototype.at) {
    Object.defineProperty(Array.prototype, "at", {
      value: function (n) {
        n = Math.trunc(n) || 0;
        if (n < 0) n += this.length;
        return n < 0 || n >= this.length ? undefined : this[n];
      },
      writable: true,
      configurable: true
    });
  }
  if (!String.prototype.at) {
    Object.defineProperty(String.prototype, "at", {
      value: function (n) {
        n = Math.trunc(n) || 0;
        if (n < 0) n += this.length;
        return n < 0 || n >= this.length ? undefined : this[n];
      },
      writable: true,
      configurable: true
    });
  }
  if (!Object.fromEntries) {
    Object.fromEntries = function (its) {
      const o = {};
      for (const [k, v] of its) o[k] = v;
      return o;
    };
  }

  /* iOS and Chrome start AudioContext suspended and block speech synthesis
     until user gesture. Prime both on first touch or keydown. */
  let unlocked = false;
  function unlock() {
    if (unlocked) return;
    unlocked = true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        const c = new AC();
        if (c.state === "suspended") c.resume();
        window.__masuAudioCtx = c;
      }
    } catch (e) {}
    try {
      if (window.speechSynthesis) {
        const u = new SpeechSynthesisUtterance("");
        u.volume = 0;
        u.lang = "ja-JP";
        window.speechSynthesis.speak(u);
      }
    } catch (e) {}
    for (const ev of ["pointerdown", "touchstart", "keydown"]) {
      document.removeEventListener(ev, unlock, true);
    }
  }
  for (const ev of ["pointerdown", "touchstart", "keydown"]) {
    document.addEventListener(ev, unlock, true);
  }

  /* Fix 100vh on mobile Safari (sets --vh property) */
  function setVh() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  }
  setVh();
  window.addEventListener("resize", setVh, { passive: true });
}
