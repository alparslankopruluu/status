# docs/providers-spec.md - Telemetry & Authentication Specifications

This document details how StatusOwl detects local sessions and verifies API keys for each AI provider.

---

## Provider Authentication & Telemetry Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    StatusOwl Telemetry Engine              │
└──────────────────────────────┬──────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               │                               │
    ┌──────────▼──────────┐         ┌──────────▼──────────┐
    │  Local CLI Session  │         │   Custom API Keys   │
    │  ~/.claude/         │         │   sk-ant-...        │
    │  ~/.gemini/         │         │   AIzaSy...         │
    │  ~/.codex/          │         │   xai-...           │
    └──────────┬──────────┘         └──────────┬──────────┘
               │                               │
               └───────────────┬───────────────┘
                               │
                🟢 Live Authenticated Session
```

---

## Provider Breakdown & Auth Redirect URLs

### 1. Claude Code (`claude`)
- **Local CLI Config Path**: `~/.claude/`
- **Direct Auth / Key Generation URL**: [`https://console.anthropic.com/settings/keys`](https://console.anthropic.com/settings/keys)
- **Live Detection**: If `~/.claude/` contains valid session tokens, StatusOwl marks Claude Code as `🟢 Live Authenticated Session`.

### 2. Antigravity / Gemini (`antigravity`)
- **Local IDE Telemetry Path**: `~/.gemini/antigravity-ide/`
- **Direct Auth / Key Generation URL**: [`https://aistudio.google.com/app/apikey`](https://aistudio.google.com/app/apikey)
- **Live Detection**: StatusOwl auto-detects `~/.gemini/antigravity-ide/` session files or user-provided Google Gemini key (`AIzaSy...`).

### 3. xAI Grok (`grok`)
- **Local Config Path**: `~/.grok/`
- **Direct Auth / Key Generation URL**: [`https://console.x.ai`](https://console.x.ai)
- **Live Detection**: Verified via local Grok CLI configuration or custom xAI API key (`xai-...`).

### 4. OpenAI Codex (`codex`)
- **Local Config Path**: `~/.codex/`
- **Direct Auth / Key Generation URL**: [`https://platform.openai.com/api-keys`](https://platform.openai.com/api-keys)
- **Live Detection**: Verified via `~/.codex/` or custom OpenAI API key (`sk-proj-...`).

---

## Authentication Status Badges

Every provider card in StatusOwl displays an explicit connection badge:

1. 🟢 **`Live Authenticated Session`**: Active local session or valid API Key verified. Real quota tracking active.
2. 🟡 **`Mock Data Mode`**: Fallback mode when neither local session nor API key is configured. Provides a quick "Get API Key" button to authenticate.
