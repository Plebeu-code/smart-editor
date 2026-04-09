# Contributing to SmartEditor

Thanks for your interest! This project is an experimental SaaS built for learning and exploration. Contributions that improve the codebase, fix bugs, or add useful features are welcome.

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- API keys for [OpenAI](https://platform.openai.com/api-keys) and [Anthropic](https://console.anthropic.com/settings/keys)

### Setup

```bash
git clone https://github.com/Plebeu-code/smart-editor.git
cd smart-editor

npm install
cp .env.example .env.local
# Fill in your API keys in .env.local

npm run dev   # starts at http://localhost:3333
```

---

## Project Structure

```
src/app/api/        → Next.js API routes (upload, transcribe, analyze, render, dubbing)
src/components/     → UI components
src/lib/            → Core logic (ffmpeg, whisper, claude, tts, audio-mix)
src/remotion/       → Remotion compositions and scenes
src/types/          → TypeScript types
```

---

## Development Notes

A few things worth knowing before touching specific areas:

| Area | Notes |
|------|-------|
| `src/lib/ffmpeg.ts` | Never `import ffmpeg-static` — webpack bundles the wrong path. Always resolve via `process.cwd()` |
| `src/lib/whisper.ts` | Uses native Node.js `https` (not OpenAI SDK) to avoid ECONNRESET on Windows |
| Any file using ffmpeg | Must call `initFfmpeg()` locally — module caching between Next.js routes is not reliable |
| Remotion scenes | Use `getRemotionEnvironment().isRendering` to switch between `<Video>` (browser) and `<OffthreadVideo>` (render) |

---

## Workflow

1. Fork the repo and create a branch: `git checkout -b feat/your-feature`
2. Make your changes
3. Run type check: `npx tsc --noEmit`
4. Commit with a clear message: `feat: add X` / `fix: Y` / `refactor: Z`
5. Open a Pull Request against `master`

---

## What to work on

Check the [Issues](https://github.com/Plebeu-code/smart-editor/issues) tab for open bugs and feature requests.
Areas that would benefit most from contributions:

- **Tests** — the project has no test suite yet
- **Error handling** — more graceful failures in the dubbing pipeline
- **Progress reporting** — better granularity in render/transcription progress
- **Mobile UI** — the editor is desktop-only currently

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
