# 🦉 StatusOwl - AI Assistant Usage & Rate Limit Monitor

> **Cross-Platform macOS Menu Bar & Windows System Tray Monitor for AI Coding Assistants**
> Track remaining quota, rate limits (5h rolling & weekly reset timers), and telemetry for **Claude Code**, **Antigravity**, **Grok**, and **Codex** with an expressive animated **Owl Mascot**.

![StatusOwl Mascot Banner](docs/assets/banner.png)

---

## ✨ Features

- 🦉 **Expressive Animated Mascot (Hooty)**:
  - 🟢 **Flying / Soaring Owl**: Healthy quota (>70%), cheerful animations, green/cyan glow.
  - 🟡 **Perched & Alert Owl**: Medium usage (30-70%), coffee mug, warm amber glow.
  - 🟠 **Tired & Drooping Owl**: Low quota (10-30%), sweating, frowning posture.
  - 🔴 **Sleeping & Grounded Owl**: Exhausted / 5h rate limit hit (<10%), snoring zZz animation with active countdown reset badge.
- ⚡ **Multi-Provider Support**:
  - **Claude Code**: Monitors `~/.claude/` session state, token metrics, and rate limit resets.
  - **Antigravity (Gemini)**: Reads `~/.gemini/antigravity-ide/` runtime telemetry and quota data.
  - **OpenAI Codex**: Scrapes local token usage and rate limits.
  - **xAI Grok**: Tracks 5-hour rolling limits and tier usage.
- 🖥️ **Cross-Platform Design**: Runs in macOS menu bar (top right) and Windows system tray with a floating widget option.
- 🎯 **Spec-Driven Architecture**: Managed memory bank (`PRODUCT.md`, `AGENTS.md`, `CLAUDE.md`, `docs/`).

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.x
- Rust toolchain (for Tauri v2 native desktop builds)

### Installation & Run

```bash
# Clone the repository
git clone https://github.com/alparslankopruluu/status.git
cd status

# Install frontend dependencies
npm install

# Run in Development Mode
npm run dev

# Run desktop app with Tauri (macOS & Windows)
npm run tauri dev
```

---

## 🛠️ Spec-Driven Development

This repository follows **Spec-Driven Development** (inspired by `app-factory`):

| File | Purpose |
| :--- | :--- |
| [`PRODUCT.md`](PRODUCT.md) | Single source of truth for product vision, user value, and mascot guidelines |
| [`CLAUDE.md`](CLAUDE.md) | Router for Claude Code agent workflows & safety rules |
| [`AGENTS.md`](AGENTS.md) | Universal router for Codex, Grok, and other AI agents |
| [`docs/architecture.md`](docs/architecture.md) | System architecture (Tauri v2 + Rust + React + Vite) |
| [`docs/providers-spec.md`](docs/providers-spec.md) | Telemetry scraping & API rate-limit specification per tool |
| [`docs/mascot-spec.md`](docs/mascot-spec.md) | Owl mascot state machine & SVG animation rules |

---

## 📄 License

MIT License © 2026 Alparslan Köprülü
