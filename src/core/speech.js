/* ---- speech -------------------------------------------------------------- */
import { SET } from './store.js';
import { plain, readingOf } from './furigana.js';

export const Speech = {
  voices: [], ready: false,
  init() {
    if (!("speechSynthesis" in window)) return;
    const load = () => {
      this.voices = speechSynthesis.getVoices().filter(v => /ja|JP/i.test(v.lang));
      this.ready = true;
    };
    load(); speechSynthesis.onvoiceschanged = load;
  },
  say(text, { rate, force } = {}) {
    if (!("speechSynthesis" in window)) return false;
    if (SET().speech === "off" && !force) return false;
    const t = readingOf(plain(String(text))).replace(/[（(][^）)]*[）)]/g, "");
    if (!t.trim()) return false;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = "ja-JP"; u.rate = rate ?? (Number(SET().rate) || 0.85);
    const want = SET().voice, v = this.voices.find(v => v.name === want) || this.voices[0];
    if (v) u.voice = v;
    speechSynthesis.speak(u);
    return true;
  },
  stop() { try { speechSynthesis.cancel(); } catch (e) {} }
};
