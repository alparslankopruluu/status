# CLAUDE.md - StatusOwl Agent Guidelines & Router

> **Role**: AI Pair-Programming Router for Claude Code & Antigravity.
> **Scope**: StatusOwl cross-platform desktop monitor.

## 🛠️ Architecture & Stack
- **Desktop Framework**: Tauri v2 (Rust backend + React frontend)
- **Frontend**: React 18+, TypeScript, Vite, Tailwind CSS, Lucide icons, Framer Motion / SVG Canvas.
- **State Management**: Zustand / React Context with local persistence (`localStorage` / Tauri store).

## 📋 Core Commands
- `npm run dev`: Start local web server.
- `npm run tauri dev`: Launch native desktop app (macOS / Windows).
- `npm run build`: Compile frontend & native bundle.

## 📁 Canonical Documentation Map
- **Product Truth & Mascot Rules**: [`PRODUCT.md`](PRODUCT.md)
- **Architecture**: [`docs/architecture.md`](docs/architecture.md)
- **Provider Specifications**: [`docs/providers-spec.md`](docs/providers-spec.md)
- **Mascot SVG Animations**: [`docs/mascot-spec.md`](docs/mascot-spec.md)

## ⚠️ Safety & Code Guidelines
1. **Low Footprint**: Keep bundle size minimal; do not introduce heavy unused dependencies.
2. **Smooth Animations**: Mascot animations must run smoothly at 60 FPS without hogging CPU.
3. **Graceful Fallbacks**: If local telemetry files (e.g. `~/.claude/`) do not exist or are unreadable, display realistic default or simulated telemetry mode without crashing.
