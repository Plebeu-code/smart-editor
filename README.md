<div align="center">

# 🎬 SmartEditor

### AI-powered video editor SaaS

**Upload raw footage → get a production-ready vertical video in under 2 minutes.**

Auto-transcription · AI scene generation · Animated subtitles · Multilingual dubbing · One-click export

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Remotion](https://img.shields.io/badge/Remotion-4.0-blueviolet)](https://remotion.dev)
[![OpenAI](https://img.shields.io/badge/OpenAI-Whisper%20%2B%20TTS-412991?logo=openai)](https://openai.com)
[![Anthropic](https://img.shields.io/badge/Anthropic-Claude-orange)](https://anthropic.com)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?logo=tailwind-css)](https://tailwindcss.com)

![SmartEditor Editor View](https://raw.githubusercontent.com/Plebeu-Code/smart-editor/main/docs/se-editor.png)

</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎙️ **Auto-transcription** | Whisper AI transcribes audio with word-level timing |
| 🧠 **AI Scene Generation** | Claude analyzes content and creates a structured scene narrative |
| 🎬 **Professional Rendering** | Remotion renders 1080×1920 vertical video at 30fps |
| 📝 **Animated Subtitles** | Word-by-word subtitles with sentiment-aware color highlighting |
| 🌐 **AI Dubbing** | Speaker diarization → translation → OpenAI TTS voice generation → audio mix |
| 🎨 **Scene Editor** | Visual editor with mini phone preview, navigation, character counts |
| ⏱️ **Timeline** | Color-coded scene timeline with frame-accurate scrubbing |
| 🌍 **i18n** | Full PT/EN interface with flag switcher |
| 📤 **Export** | Background render with progress polling + download |

---

## 🖼️ Screenshots

<div align="center">

| Landing Page | Full Editor |
|:---:|:---:|
| ![Home](https://raw.githubusercontent.com/Plebeu-Code/smart-editor/main/docs/se-home.png) | ![Editor](https://raw.githubusercontent.com/Plebeu-Code/smart-editor/main/docs/se-editor.png) |

| Scene List | Scene Editor Panel |
|:---:|:---:|
| ![Scenes](https://raw.githubusercontent.com/Plebeu-Code/smart-editor/main/docs/se-scene-list.png) | ![Panel](https://raw.githubusercontent.com/Plebeu-Code/smart-editor/main/docs/se-scene-editor.png) |

</div>

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript 5 |
| **Transcription** | OpenAI Whisper via native Node.js `https` |
| **AI Analysis** | Anthropic Claude (scene structure + dubbing translation) |
| **Video Rendering** | Remotion 4 (`@remotion/renderer` + `@remotion/bundler`) |
| **Video Processing** | FFmpeg via `fluent-ffmpeg` + `ffmpeg-static` |
| **TTS Voices** | OpenAI TTS (alloy, echo, fable, onyx, nova, shimmer) |
| **Styling** | TailwindCSS 3.4 + CSS custom properties |
| **State** | File-based project store (JSON) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- An **OpenAI** account with billing enabled ([platform.openai.com](https://platform.openai.com))
- An **Anthropic** account with credits ([console.anthropic.com](https://console.anthropic.com))

### Installation

```bash
# Clone the repository
git clone https://github.com/Plebeu-Code/smart-editor.git
cd smart-editor

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
```

### Environment Variables

Edit `.env.local` with your API keys:

```env
# OpenAI — Whisper transcription + TTS voice generation
OPENAI_API_KEY=sk-...

# Anthropic — Claude scene analysis + dubbing translation
ANTHROPIC_API_KEY=sk-ant-...
```

### Running

```bash
# Development
npm run dev        # starts at http://localhost:3333

# Production
npm run build
npm run start
```

Open [http://localhost:3333](http://localhost:3333) in your browser.

---

## 🏗️ Architecture

```
src/
├── app/
│   ├── page.tsx                    # Landing page — upload + processing
│   ├── editor/[id]/page.tsx        # Editor page
│   └── api/
│       ├── upload/                 # Receives video, normalizes with FFmpeg
│       ├── transcribe/[id]/        # Whisper transcription → SRT with word timing
│       ├── analyze/[id]/           # Claude scene analysis
│       ├── render/[id]/            # Remotion background render
│       ├── video/[...filename]/    # Serve normalized / dubbed / rendered video
│       ├── project/[id]/           # Project CRUD
│       └── dubbing/[id]/
│           ├── diarize/            # Speaker detection via Claude
│           ├── translate/          # Script translation via Claude
│           ├── tts/                # OpenAI TTS voice generation
│           └── mix/                # FFmpeg audio mix → dubbed.mp4
│
├── components/
│   ├── UploadZone.tsx              # Drag & drop upload
│   ├── ProcessingStatus.tsx        # Pipeline progress indicator
│   └── editor/
│       ├── EditorLayout.tsx        # Main editor shell
│       ├── VideoPreview.tsx        # Native video player + overlays + dubbed toggle
│       ├── SceneList.tsx           # Scene navigation list
│       ├── SceneEditor.tsx         # Scene editing panel with mini preview
│       ├── Timeline.tsx            # Frame-accurate timeline
│       ├── DubbingPanel.tsx        # Dubbing workflow UI
│       └── ExportModal.tsx         # Quality selector + render progress
│
├── lib/
│   ├── ffmpeg.ts                   # FFmpeg path resolution (bypasses webpack)
│   ├── whisper.ts                  # Whisper via native Node.js https
│   ├── claude.ts                   # Claude scene analysis
│   ├── audio-mix.ts                # FFmpeg audio mixing for dubbing
│   ├── tts.ts                      # OpenAI TTS + duration estimation
│   ├── diarize.ts                  # Speaker diarization
│   ├── translate.ts                # Script translation
│   ├── store.ts                    # File-based project store
│   ├── timing.ts                   # SRT → frame conversion
│   └── srt-parser.ts               # SRT file parser
│
└── remotion/
    ├── compositions/MainVideo.tsx  # Root Remotion composition
    └── scenes/
        ├── TitleScene.tsx
        ├── ContentScene.tsx
        ├── HighlightScene.tsx
        ├── OutroScene.tsx
        └── SubtitleLayer.tsx       # Animated word-level subtitles
```

---

## ⚙️ How It Works

```
Upload video
    │
    ▼
FFmpeg normalize → H.264 MP4 @ 30fps 1080×1920
    │
    ▼
OpenAI Whisper → SRT with word-level timestamps + sentiment
    │
    ▼
Anthropic Claude → Scene structure (type, title, body, sentiment, startLeg)
    │
    ▼
Editor (Next.js) ←→ Native video player + Remotion overlays
    │
    ├── Scene Editor: mini preview · navigation · timing · delete
    ├── Timeline: color-coded segments · frame scrubbing
    └── Dubbing pipeline (optional):
            │
            ├── Claude diarize → speaker segments
            ├── Claude translate → target language script
            ├── OpenAI TTS → MP3 clips per segment
            └── FFmpeg amix → dubbed.mp4
    │
    ▼
Remotion render (background) → final MP4 download
```

---

## 🔧 Engineering Notes

A few non-obvious things worth documenting:

### `ffmpeg-static` + webpack
`ffmpeg-static` exports a path string, but webpack bundles it and resolves to `.next/server/vendor-chunks/ffmpeg.exe` — which doesn't exist. The fix: **never import `ffmpeg-static`**. Resolve the binary path manually:

```ts
const bin = path.resolve(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');
ffmpeg.setFfmpegPath(bin);
```

### Whisper + ECONNRESET on Windows
The OpenAI SDK uses a webpack-bundled version of `node-fetch` that fails with TLS/socket errors when uploading large multipart files on Windows. Fix: rewrite the Whisper upload using native Node.js `https`:

```ts
const req = https.request({ hostname: 'api.openai.com', path: '/v1/audio/transcriptions', method: 'POST', ... });
```

### `ffprobe` not bundled in `ffmpeg-static`
`ffmpeg-static` bundles only `ffmpeg.exe`, not `ffprobe.exe`. Any call to `getVideoDuration()` throws, causing `durationSeconds = 0` for all TTS clips — which silently drops them from the audio mix. Fix: estimate duration from MP3 file size:

```ts
const stat = fs.statSync(clipPath);
durationSeconds = stat.size / (192000 / 8); // 192kbps estimate
```

### Remotion Player vs. native `<video>`
`OffthreadVideo` (used during rendering) is canvas-based and doesn't display in the browser. `Video` works in the browser but the Remotion Player container would collapse to `0px` width due to CSS conflicts. Fix: replace Remotion Player entirely with a native `<video>` element + React overlays.

### Next.js API route caching
Each API route runs in its own module context in Next.js. A side-effect `ffmpeg.setFfmpegPath()` in one module is **not guaranteed** to run before another module's ffmpeg calls. Fix: add an `initFfmpeg()` IIFE at the top of every file that uses ffmpeg.

---

## 📄 License

[MIT](LICENSE) — built as a personal experiment. Feel free to fork, learn from, and extend.

---

<div align="center">
Built with ☕ and too many hours debugging Windows binary paths.
</div>
