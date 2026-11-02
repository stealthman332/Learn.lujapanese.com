# MASU · JLC Edition

> **Japanese from zero to fluent — an offline-first, client-side Japanese learning laboratory and curriculum hub.**
>
> 🌐 **Live Website (GitHub Pages):** [https://stealthman332.github.io/Learn.lujapanese.com/#/](https://stealthman332.github.io/Learn.lujapanese.com/#/)  
> 📌 *Note: The custom domain `learn.lujapanese.com` is planned for future rollout; the site is currently hosted live on GitHub Pages.*  
> 🏛️ **Organization:** Liberty Japanese Language Club ([lujapanese.com](https://lujapanese.com/))  
> 📦 **Hosting:** GitHub Pages via automated GitHub Actions CI/CD

---

## 📖 Table of Contents
1. [About the Project](#-about-the-project)
2. [Feature Tour](#-feature-tour)
3. [Architecture & Design Philosophy](#-architecture--design-philosophy)
4. [Deployment & Hosting Guide](#-deployment--hosting-guide)
   - [Current Deployment on GitHub Pages](#current-deployment-on-github-pages)
   - [Mapping a Custom Domain in the Future](#mapping-a-custom-domain-in-the-future)
   - [Alternative Self-Hosting (Local, Nginx, Docker)](#alternative-self-hosting)
   - [Firebase Setup (Optional Cloud Sync)](#firebase-setup-optional-cloud-sync)
5. [Developer Guide](#-developer-guide)
   - [Prerequisites](#prerequisites)
   - [Getting Started](#getting-started)
   - [Source Code Map](#source-code-map)
   - [Data Pipelines & Curriculum Formats](#data-pipelines--curriculum-formats)
   - [State Management & IndexedDB](#state-management--indexeddb)
   - [Binary In-Browser Anki & SQLite Engine](#binary-in-browser-anki--sqlite-engine)
   - [Contributing & Commit Conventions](#contributing--commit-conventions)
6. [Credits & Licenses](#-credits--licenses)

---

## 🌸 About the Project

**MASU · JLC Edition** is a full-spectrum Japanese study platform tailored for both independent self-learners and students studying with the **Liberty Japanese Language Club (JLC)**.

Japanese study tools are often fragmented: you need one app for kana, another for kanji stroke order, a third for flashcards, a paid subscription for graded readers, and a desktop program for Anki decks. **MASU unifies the entire learning journey into a single, cohesive, distraction-free environment:**

- **Zero forced accounts or paywalls:** Every feature runs locally in your browser.
- **Client-side performance:** Sub-millisecond navigation powered by a lightweight hash router and an in-memory virtual DOM builder.
- **Offline-capable PWA:** Fully installable on iOS, Android, macOS, and Windows with complete Service Worker caching.
- **Privacy by default:** Review progress, quiz scores, handwritten strokes, and imported decks remain private on your device, with optional Google OAuth sync when you want cross-device mobility.

---

## 🎯 Feature Tour

| Module | Route | Highlights |
| :--- | :--- | :--- |
| **Club Portal** | `#/club` | Next meeting times, room location, semester events calendar, study guides, and projector presentation mode. |
| **Chapters** | `#/chapters` | Complete structured syllabus from Chapter 0 (start at zero) through advanced club lessons. |
| **Kana Master** | `#/kanamaster` | Interactive Hiragana & Katakana syllabus, Dakuten/Yoon, visual mnemonics, and a confusing look-alike trainer. |
| **Kanji Lab** | `#/kanji` | All 2,136 Jōyō Kanji with animated vector stroke orders (KanjiVG paths), Onyomi/Kunyomi readings, radical breakdowns, and stroke-by-stroke canvas tracing. |
| **Handwriting** | `#/write` | Freehand and guided stroke-order canvas with instant accuracy feedback. |
| **Cards & SRS** | `#/review` | SM-2 spaced repetition scheduler with custom deck creation and an in-browser Anki `.apkg` importer. |
| **Reading Room** | `#/read` | 80+ graded stories (Level 0 through N1) + unabridged classics (Akutagawa, Sōseki, Miyazawa) with interactive furigana and text-to-speech audio. |
| **Grammar Guide** | `#/grammar` | Comprehensive reference spanning N5 to N1 plus classical Japanese grammar (`なり`, `けり`, `べし`). |
| **Dictionary** | `#/dict` | 23,000+ entry JMdict database coupled with a morphological deinflection engine that strips conjugations automatically. |
| **Situations & Phrases** | `#/phrases` | 16 everyday scenarios written side-by-side in three politeness registers: **Casual**, **Polite (です/ます)**, and **Keigo (敬語)**. |
| **Mini-Games** | `#/games` | 16 drills including Kana Rain, Speed Reading, Sentence Builder, Particle Gauntlet, Conjugation Gym, and Shiritori. |
| **Faith & Mission** | `#/faith` | Specialized Christian vocabulary, scripture memory cards, bilingual prayers, and a personal testimony builder. |
| **Culture Notes** | `#/culture` | Essential etiquette guides on bowing, shoes, gift-giving, trains, and reading between the lines (*kūki o yomu*). |
| **Quick Reference** | `#/reference` | Fast cheat sheets for Japanese counters, colours, numbers, time, and calendar expressions. |
| **Practice Sheets** | `#/print` | Generates printable *genkō-yōshi* (原稿用紙) stroke-order worksheets formatted for standard paper printing. |

---

## 🏛️ Architecture & Design Philosophy

MASU is architected around the **JAMstack / static-edge philosophy**:
```
┌────────────────────────────────────────────────────────┐
│                   Browser Client                       │
├─────────────────────┬──────────────────┬───────────────┤
│  App Shell & Logic  │  Storage Layer   │ Audio & Media │
│  • src/app.js       │  • IndexedDB     │ • Web Speech  │
│  • src/css/*.css    │  • localStorage  │ • Web Audio   │
│  • Virtual DOM (el) │  • Firebase Auth │   Oscillator  │
│  • Hash Router      │  • Cloud Sync    │   Synthesizer │
└──────────▲──────────┴────────▲─────────┴───────▲───────┘
           │                   │                 │
           └───────────────────┼─────────────────┘
                               │
                 ┌─────────────┴─────────────┐
                 │  Static Hosting (dist/)   │
                 │  • GitHub Pages / Nginx   │
                 │  • 11 Lazy-loaded JSONs   │
                 │  • Zero runtime server    │
                 └───────────────────────────┘
```

1. **Lightweight Virtual DOM:** Instead of bulky external frameworks, UI views are constructed using a tiny, memory-efficient DOM builder (`el()`, `$()`, `$$()`).
2. **Lazy Data Pipeline:** Large static datasets (the 23,000-word dictionary, full kanji stroke paths, classical stories) are split into individual `.json` and `.tsv` files under `dist/data/`. They are requested asynchronously on-demand and cached in memory.
3. **Pure JS Binary SQLite & ZIP Engine:** Users can drag-and-drop their personal Anki collections (`.apkg`) directly into the browser. MASU unpacks the zip stream and decodes the internal SQLite 3 B-tree table structures entirely in client-side JavaScript.
4. **Resilient Persistence:** Study records are saved in IndexedDB (`masu-jlc` database) with debounced writes. If private browsing restricts IndexedDB, it gracefully falls back to session memory.

---

## 🚀 Deployment & Hosting Guide

Because MASU compiles to **100% static HTML, CSS, JavaScript, and JSON files**, it can run on any static web host or server without databases or runtime processes.

### Current Deployment on GitHub Pages

The live project is hosted on GitHub Pages at:  
👉 **[https://stealthman332.github.io/Learn.lujapanese.com/#/](https://stealthman332.github.io/Learn.lujapanese.com/#/)**

Automated continuous deployment is handled by `.github/workflows/deploy.yml`. On every push to the `main` branch, GitHub Actions:
1. Checks out the repository.
2. Installs dependencies using `npm ci`.
3. Runs `npm run build` to compile the app into `./dist`.
4. Publishes `./dist` directly to GitHub Pages.

### Mapping a Custom Domain in the Future

When you are ready to point a custom domain (e.g. `learn.lujapanese.com`):
1. Create a `public/CNAME` file containing your domain:
   ```text
   learn.lujapanese.com
   ```
2. In your DNS provider (e.g. Cloudflare, Namecheap), add a CNAME record:
   - **Type:** `CNAME`
   - **Name:** `learn`
   - **Target:** `stealthman332.github.io`
3. In your Firebase Console, add the custom domain under **Authentication > Settings > Authorized Domains**.
4. Push the changes to `main`. GitHub Actions will automatically bundle and deploy with the custom domain.

### Alternative Self-Hosting

If you prefer to host MASU on your own server or infrastructure:

#### Option A: Ad-Hoc Static Server
```bash
git clone https://github.com/stealthman332/Learn.lujapanese.com.git
cd Learn.lujapanese.com
npm install && npm run build

# Serve dist/ with any static file server:
npx serve dist -l 8080
# Or: python3 -m http.server 8080 --directory dist
# Or: caddy file-server --root dist --listen :8080
```

#### Option B: Nginx Production Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/masu-jlc/dist;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/manifest+json;

    # Service Worker & Web Manifest: always revalidate
    location ~* (sw\.js|manifest\.webmanifest)$ {
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Static assets: cache aggressively
    location ~* \.(json|tsv|woff2|png|svg|ico)$ {
        expires 7d;
        add_header Cache-Control "public, no-transform";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### Option C: Docker Container
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```
```bash
docker build -t masu-jlc .
docker run -d -p 8080:80 --name masu masu-jlc
```

### Firebase Setup (Optional Cloud Sync)

MASU includes optional cross-device synchronization powered by Firebase Google Authentication and Cloud Firestore:
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com/).
2. Enable **Authentication** with the **Google Sign-In** provider.
3. In **Firestore Database**, create a database and configure your Security Rules:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```
4. Add your hosting domain (e.g., `localhost`, `stealthman332.github.io`, or `learn.lujapanese.com`) under **Authentication > Settings > Authorized Domains**.
5. Update `src/core/auth.js` with your Firebase web configuration keys.

---

## 🛠️ Developer Guide

### Prerequisites
- **Node.js:** v18.0.0 or higher (v20+ recommended).
- **npm:** v9.0.0 or higher.
- **Modern Browser:** Chrome, Edge, Safari, or Firefox with ES2022 support.

### Getting Started

```bash
# 1. Clone the project
git clone https://github.com/stealthman332/Learn.lujapanese.com.git
cd Learn.lujapanese.com

# 2. Install dev dependencies (esbuild)
npm install

# 3. Start the dev server
npm run dev
```

The live development server will run at:  
👉 `http://localhost:8080` *(Note: use plain http://)*

When running `npm run dev`, `esbuild` watches JavaScript and CSS files, compiling changes instantaneously.

### Source Code Map

```
Learn.lujapanese.com/
├── package.json              # Build scripts and dependencies
├── build.mjs                 # esbuild bundler and asset pipeline
├── public/                   # Static root copied directly into dist/
│   ├── index.html            # Minimal HTML shell (viewport, fonts, mount points)
│   ├── manifest.webmanifest  # PWA progressive web app configuration
│   ├── sw.js                 # Service worker for offline caching
│   └── icons/                # High-res PWA application icons
├── src/
│   ├── app.js                # App entrypoint, hash routing, page controllers & views
│   ├── core/
│   │   ├── auth.js           # Firebase Google OAuth & Firestore cloud sync controller
│   │   ├── store.js          # IndexedDB persistence layer with fallback and sync hooks
│   │   ├── dom.js            # Virtual DOM builder: el(), $(), $$(), toast(), modal()
│   │   ├── srs.js            # SM-2 Spaced Repetition interval calculation algorithm
│   │   ├── speech.js         # Web Speech API wrapper with auto voice detection
│   │   ├── audio.js          # Web Audio API procedural sound synthesizer (Sfx)
│   │   ├── kana-convert.js   # Romaji ↔ Kana conversion tables and IME simulator
│   │   ├── furigana.js       # Ruby tag generator and furigana toggling logic
│   │   └── utils.js          # Utility math, array shuffling, and formatting helpers
│   ├── engine/
│   │   ├── sqlite.js         # Pure-JS binary SQLite 3 B-tree parser
│   │   ├── unzip.js          # Streaming ZIP archive decompressor
│   │   ├── anki.js           # Anki (.apkg) package importer and card field parser
│   │   ├── conjugation.js    # Verb and adjective inflection rules engine
│   │   ├── deinflect.js      # Morphological dictionary deinflector
│   │   └── lexicon.js        # Tokenizer and sentence segmentation
│   ├── data/
│   │   ├── loader.js         # Lazy dataset fetcher with in-memory caching
│   │   ├── kana.js           # Kana syllabaries and mnemonics
│   │   ├── kanji-index.js    # Kanji metadata and index tables
│   │   ├── vocab.js          # Topic decks and core vocabulary
│   │   ├── chapters.js       # Curriculum chapter definitions
│   │   ├── situations.js     # Three-register conversational phrase data
│   │   ├── grammar.js        # Grammar patterns and explanations
│   │   └── reference.js      # Counters, colours, and numbers reference data
│   └── css/
│       ├── tokens.css        # Colour palette (Washi, Sumi, Ai, Shu) and fonts
│       ├── layout.css        # Desktop rail, mobile topbar & bottom tabbar, responsive grid
│       ├── components.css    # Cards, buttons, inputs, pills, modal overlays
│       ├── themes.css        # 5 Themes: Paper, Night, Sakura, Regal, Hacker
│       ├── cards.css         # 3D interactive flashcard flipping and review controls
│       └── index.css         # Master CSS bundle entry point
└── data/                     # Decoupled static datasets (copied to dist/data/)
    ├── classics.json         # Unabridged Japanese literature
    ├── club.json             # JLC meeting schedules, room numbers, and events
    ├── culture.json          # Cultural etiquette guides
    ├── dict.json             # JMdict definitions
    ├── dict.tsv              # Compact fast dictionary file
    ├── faith.json            # Christian terminology, scripture, and prayers
    ├── grammar-ext.json      # Extended grammar reference entries
    ├── jlc-anki.json         # JLC club Anki flashcard sets
    ├── jlc.json              # Chapter syllabus content
    ├── kanji.json            # 2,136 Jōyō kanji data entries
    ├── stories.json          # Graded reader stories
    └── strokes.json          # KanjiVG vector stroke order path definitions
```

### Data Pipelines & Curriculum Formats

To modify or expand curriculum content:

- **Club info & upcoming events:** Edit `data/club.json`. Update `meeting.day`, `meeting.time`, `meeting.place`, and add entries to the `events` array.
- **Curated Reading Material:** Add new graded readers to `data/stories.json` or unabridged literature to `data/classics.json`. Each entry includes furigana ruby tags in the format `｜漢字{かんじ}`.
- **Conversational Phrases:** Edit `src/data/situations.js`. Every situation provides an array of sentences with `casual`, `polite`, and `keigo` variants.

### State Management & IndexedDB

State is centralized in `Store.d` (`src/core/store.js`):
- `Store.d.settings`: User preferences (theme, font size, sound effects, level).
- `Store.d.srs`: Dictionary of card IDs with their SM-2 interval, ease factor, and next review timestamp.
- `Store.d.stats`: Review counts, writing practice count, reading history, and streak counter.
- `Store.d.decks`: User-created and imported Anki decks.

Writes are debounced and persisted to IndexedDB:
```javascript
Store.save(); // Debounced automatically; queues a write to the 'masu-jlc' IndexedDB database
```

### Binary In-Browser Anki & SQLite Engine

When a user imports an `.apkg` file:
1. `src/engine/unzip.js` decodes the compressed archive using the native browser `DecompressionStream`.
2. `src/engine/sqlite.js` scans the header of the extracted `collection.anki2` / `collection.anki21` database, reads the SQLite B-tree leaf pages, and extracts card fields without any WebAssembly or external dependencies.
3. Card models and templates are sanitized in `src/engine/anki.js` and stored directly into IndexedDB.

### Contributing & Commit Conventions

When contributing features or fixes, please adhere to conventional commit prefixes:
- `Feat: <description>` — For new features or enhancements.
- `Fix: <description>` — For bug fixes.
- `Refactor: <description>` — For code cleanup with no behavior changes.
- `Docs: <description>` — For documentation updates.

Before submitting changes, test locally:
```bash
npm run build
```
Verify that `dist/app.js` and `dist/app.css` bundle cleanly with no syntax errors.

---

## 📜 Credits & Licenses

- **License:** MIT License.
- **Kanji Stroke Orders:** Courtesy of the **[KanjiVG](https://kanjivg.tagaini.net/)** project by Ulrich Apel, licensed under Creative Commons Attribution-Share Alike 3.0.
- **Dictionary Data:** Derived from the **[EDRDG / JMdict](http://www.edrdg.org/)** project by Jim Breen and the Electronic Dictionary Research and Development Group.
- **Liberty Japanese Language Club:** Content, syllabus, and faith-based resources curated by JLC officers and members.
