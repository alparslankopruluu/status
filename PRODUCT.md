# PRODUCT.md - StatusOwl Product Truth & Vision

## 🎯 Product Mission
Developers constantly switch between multiple AI coding tools—**Claude Code**, **Antigravity (Gemini)**, **Grok**, and **Codex**—in terminal CLI sessions and IDE applications. Running out of usage mid-coding session without warning causes context switching and loss of momentum.

**StatusOwl** solves this by providing a unified, ambient, zero-friction status monitor in the macOS menu bar and Windows system tray, anchored by an expressive **Owl Mascot** that instantly communicates AI quota health.

---

## 🦉 Mascot Concept: Hooty the Status Owl

The Owl is wise, watchful, and expressive. It reflects the developer's aggregate AI quota status across all tools.

### 4 Visual & Animated States
1. **HIGH / HEALTHY (>70% Quota Remaining)**
   - **Visual**: Energetic, soaring/flapping owl, bright emerald green / cyan aura, cheerful eyes with sparkles.
   - **Animation**: Floating vertical sine-wave bobbing + gentle wing flaps.
   - **Message**: "All systems operational! Fly high!"

2. **NORMAL / ATTENTIVE (30% - 70% Quota Remaining)**
   - **Visual**: Perched on a branch, holding a coffee mug, warm amber/yellow glow, blinking eyes.
   - **Animation**: Slow breathing cycle + occasional eye blink & coffee sip.
   - **Message**: "Cruising smoothly. Plenty of juice left."

3. **LOW / TIRED (10% - 30% Quota Remaining)**
   - **Visual**: Drooping wings, sweat drop on forehead, frowning mouth, orange warning glow.
   - **Animation**: Micro-shivering + panting, heavy eyelids.
   - **Message**: "Running low! Pace your requests or switch providers."

4. **EXHAUSTED / RATE LIMITED (<10% or 5h Limit Hit)**
   - **Visual**: Slumped down / sleeping owl, snoring `zZz` bubbles, bandaged head or pillow, crimson red glow. Overlaid with an active countdown badge (e.g. `5h Reset in 01h 42m`).
   - **Animation**: Rising `zZz` bubbles + slow snoring rise and fall.
   - **Message**: "Limit reached! Resting up until reset."

---

## 🔌 Provider Integration Strategy

| Provider | Data Source | Metric Tracked |
| :--- | :--- | :--- |
| **Claude Code** | `~/.claude/` session state, CLI history logs, Anthropic OAuth/token rate-limit headers | 5h window token limit %, weekly organization quota |
| **Antigravity** | `~/.gemini/antigravity-ide/` telemetry logs, session tokens | Daily request quota %, Gemini 3.6 Flash/Pro limit |
| **Grok** | xAI API rate-limit headers / session store | 5h rolling window usage % |
| **OpenAI Codex** | `~/.codex/` config, OpenAI usage API / headers | Token quota %, rate limit tier |

---

## 🏆 Key Success Criteria
1. **RAM Footprint**: < 20MB idle RAM usage on macOS & Windows.
2. **Instant Glanceability**: User can tell quota health in 0.5s without opening a browser dashboard.
3. **Cross-Platform Parity**: macOS status bar item & Windows tray icon look and behave identically with system native dark/light modes.
