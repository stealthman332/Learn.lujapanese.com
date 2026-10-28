/* tiny click/ding without any audio files */
import { SET } from './store.js';

export const Sfx = (() => {
  let ctx;
  const tone = (f, d, type = "sine", vol = .05) => {
    if (SET().sfx === "off") return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = f; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(vol, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + d);
      o.start(); o.stop(ctx.currentTime + d);
    } catch (e) {}
  };
  return {
    ok() { tone(880, .12); setTimeout(() => tone(1320, .14), 70); },
    no() { tone(200, .18, "triangle", .045); },
    tick() { tone(660, .05, "square", .022); }
  };
})();

export const SFX = Sfx;
