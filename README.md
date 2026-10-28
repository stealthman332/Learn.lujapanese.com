# MASU · JLC Edition (ます)

> **Japanese from zero to fluent — in an installable, offline-first, modular Progressive Web App.**

---

## 🌟 Overview

**MASU · JLC Edition** is a modern, full-spectrum Japanese study laboratory designed for self-learners and classroom study. It covers the language from kana to JLPT N1:

- **Complete Kana System:** Hiragana, Katakana, Dakuten, Yoon, mnemonics, and look-alike trainer.
- **All 2,136 Jōyō Kanji:** Animated stroke orders (KanjiVG SVG paths), onyomi, kunyomi, radicals, and vocabulary.
- **Spaced Repetition (SRS):** SM-2 algorithm tracking review intervals, streaks, and mastery.
- **Anki Deck Importer:** Reads `.apkg` packages directly in-browser using a bespoke binary SQLite 3 B-tree parser and ZIP stream decompressor.
- **80+ Graded Readers & Classical Literature:** Tadoku-style readers (Level 0 through N1) plus unabridged classics (like Akutagawa Ryūnosuke’s *The Spider's Thread*) with bilingual translations and synchronized audio.
- **23,000-Word Dictionary:** JMdict-derived lexicon with an integrated morphological deinflection engine (strips passive, causative, polite, and past verb/adjective endings).
- **16 Interactive Mini-Games:** Kana Rain, Speed Reading, Sentence Builder, Particle Gauntlet, Conjugation Gym, Shiritori (しりとり), Memory (神経衰弱), and more.
- **Printable Genkō-yōshi (原稿用紙):** Dynamic tracing practice worksheets with stroke orders and print stylesheets.
- **Faith & Mission:** Specialized prayers, scripture memory, church vocabulary, and testimony builder.

---

## 🏗️ Architecture & Enhancements

Migrated from the legacy 35,000-line monolithic HTML file into a modern, decoupled architecture:

| Component | Legacy Monolith | New Modular MASU JLC |
| :--- | :--- | :--- |
| **Initial Download** | 5.5 MB single HTML file | **2.7 KB HTML shell** + 34 KB CSS + 644 KB JS (~90% payload cut) |
| **Data Delivery** | 5.7 MB JSON hardcoded in `<script>` tags | **11 Lazy JSON/TSV files** loaded on-demand via `src/data/loader.js` |
| **Persistence** | `localStorage` (crashes at ~5 MB quota on Anki imports) | **`IndexedDB`** (`masu-jlc` database) with unlimited quota and debounced writes |
| **Offline Support** | Tab must stay open | **Service Worker (`sw.js`)** with Cache-First & Stale-While-Revalidate strategies |
| **PWA Installable** | None | **`manifest.webmanifest`** with adaptive home screen icons |
| **Bundler** | None | **`esbuild`** with zero runtime overhead and sub-100ms builds |

---

## 📂 Project Structure

```
masu-jlc/
├── package.json
├── build.mjs                 # esbuild build and dev server script
├── public/
│   ├── index.html            # Minimal semantic HTML shell (2.7 KB)
│   ├── manifest.webmanifest  # PWA manifest
│   ├── sw.js                 # Service worker with offline caching
│   └── icons/                # PWA icons (192x192, 512x512)
├── src/
│   ├── app.js                # Application controller and view routing
│   ├── css/
│   │   ├── tokens.css        # Design tokens (--paper, --sumi, --ai, --shu)
│   │   ├── themes.css        # 5 Themes: Washi (墨), Night (月), Sakura (桜), Regal (錦), Hacker (端)
│   │   ├── cards.css         # 3D Flip cards and review sessions
│   │   ├── compatibility.css # Cross-browser fixes (iOS Safari 100vh, touch)
│   │   ├── screens.css       # Screen-specific layouts and components
│   │   └── index.css         # Master CSS bundle entry point
│   ├── core/
│   │   ├── store.js          # IndexedDB persistence layer with memory fallback
│   │   ├── dom.js            # Virtual DOM-lite element builder (el, $, $$, toast, modal)
│   │   ├── srs.js            # SM-2 spaced repetition scheduler
│   │   ├── speech.js         # Web Speech API wrapper with auto-voice selection
│   │   ├── audio.js          # Web Audio API oscillator synthesizer (zero audio assets)
│   │   ├── kana-convert.js   # Romaji ↔ Kana conversion tables and helpers
│   │   ├── furigana.js       # Ruby annotation parser and smart furigana hider
│   │   ├── compat.js         # AudioContext & Speech unlock on first touch
│   │   └── utils.js          # Math and array utilities (shuffle, clamp, pct)
│   ├── engine/
│   │   ├── sqlite.js         # Binary SQLite 3 B-tree reader in pure JavaScript
│   │   ├── unzip.js          # Streaming ZIP decompressor using DecompressionStream
│   │   ├── anki.js           # .apkg collection importer and field sanitizer
│   │   ├── conjugation.js    # Verb and adjective conjugation engine
│   │   ├── deinflect.js      # Morphological deinflector for dictionary lookups
│   │   └── lexicon.js        # Longest-match tokenizer and sentence chunker
│   └── data/
│       ├── loader.js         # Lazy dataset fetcher with in-memory caching
│       ├── kana.js           # Inline kana syllabary with mnemonics
│       ├── kanji-index.js    # Kanji metadata and index tables
│       ├── vocab.js          # Vocabulary sets and deck mappings
│       ├── chapters.js       # Curriculum chapter definitions
│       ├── situations.js     # 3-register conversational phrases
│       ├── grammar.js        # Core grammar points
│       ├── reference.js      # Counters, colours, and numbers
│       └── readers.js        # Graded reader books (Parts A & B)
└── data/                     # Decoupled static datasets
    ├── classics.json         # Unabridged literature (Akutagawa, etc.)
    ├── club.json             # JLC meeting info and events
    ├── culture.json          # Cultural notes and etiquette guides
    ├── faith.json            # Church Japanese, prayers, and scripture
    ├── grammar-ext.json      # 200+ extended JLPT grammar guides
    ├── jlc.json              # Club syllabus
    ├── jlc-anki.json         # Built-in club Anki flashcards
    ├── kanji.json            # All 2,136 Jōyō kanji data
    ├── stories.json          # 47 graded readers
    ├── strokes.json          # 2,314 KanjiVG vector stroke order paths
    ├── dict.json             # Structured JMdict dictionary
    └── dict.tsv              # Compact 23,741-word dictionary (1.6 MB)
```

---

## 🚀 Getting Started

### Development Mode
```bash
npm install
npm run dev
# Starts esbuild live server at http://localhost:8080
```

### Production Build
```bash
npm run build
# Compiles into dist/ ready for deployment (GitHub Pages, Vercel, Netlify)
```

---

## 📜 License
MIT License. Kanji stroke vector data courtesy of KanjiVG (Ulrich Apel, CC BY-SA 3.0). Dictionary data derived from JMdict / EDRDG.
