# docs/architecture.md - System Architecture

## Overview
StatusOwl is designed as a lightweight, cross-platform system tray & menu bar status badge widget. It operates on both macOS and Windows.

```
┌─────────────────────────────────────────────────────────────┐
│                    macOS Menu Bar / Windows Tray           │
│                      (Dynamic Hooty Icon & %)               │
└──────────────────────────────┬──────────────────────────────┘
                               │ Click / Hover
┌──────────────────────────────▼──────────────────────────────┐
│                  Floating Popover UI (React)                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │   Animated Owl Mascot (Canvas/SVG: Flying, Sleeping)  │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │   Provider Status Cards (Grok, Antigravity, Claude)   │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │ IPC / State Updates
┌──────────────────────────────▼──────────────────────────────┐
│                    Rust / Node Engine                        │
│  - ~/.claude/ Log & Token Reader                            │
│  - ~/.gemini/ Antigravity Telemetry Reader                  │
│  - Grok API / Local Rate Limit Monitor                      │
│  - Codex Config & Usage Scraper                             │
└─────────────────────────────────────────────────────────────┘
```

## Technical Stack
- **Native Shell**: Tauri 2.0 (Rust) + System Tray / Menu Bar Integration
- **Frontend App**: React 18, TypeScript, Vite
- **Styling & Icons**: Tailwind CSS, Lucide React
- **Animations**: SVG Keyframes, CSS Framer Motion, HTML5 Canvas

## Data Flow
1. **Background Polling**: Every 30 seconds (configurable), the provider engine checks local usage files and rate-limit headers.
2. **State Aggregation**: Calculates per-provider health % and overall weighted system health.
3. **Mascot State Machine**: Triggers appropriate Owl animation (Flying / Alert / Tired / Sleeping) based on the overall status.
4. **Tray Icon Update**: Updates system tray icon tooltip and badge text.
