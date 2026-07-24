# docs/providers-spec.md - Telemetry & Rate-Limit Tracking Specification

This document details how StatusOwl tracks usage and rate-limits across AI coding tools.

---

## 1. Claude Code (`claude`)
- **Paths Inspected**:
  - `~/.claude/`
  - `~/.claude.json`
  - `~/.claude/logs/`
- **Tracked Parameters**:
  - **5-Hour Rolling Limit**: % of tokens consumed in the current 5h window.
  - **Weekly Account Quota**: Organization tier remaining balance.
  - **Reset Countdown**: Calculated target reset timestamp (e.g. `2026-07-24T17:00:00Z`).

---

## 2. Antigravity / Gemini (`antigravity`)
- **Paths Inspected**:
  - `~/.gemini/antigravity-ide/`
  - `~/.gemini/antigravity-ide/brain/`
- **Tracked Parameters**:
  - **Daily Flash/Pro Quota**: Percentage of daily model invocations used.
  - **Token Usage**: Session token counters.
  - **Reset Window**: Midnight reset countdown timer.

---

## 3. xAI Grok (`grok`)
- **Paths Inspected**:
  - `~/.grok/`
  - xAI API usage endpoint / local header cache
- **Tracked Parameters**:
  - **5-Hour Window Usage**: Usage percentage for Grok 3 / Grok Code models.
  - **Rate Limit Reset**: Time remaining until quota replenishment.

---

## 4. OpenAI Codex (`codex`)
- **Paths Inspected**:
  - `~/.codex/`
  - `~/.config/codex/`
- **Tracked Parameters**:
  - **Tier Usage**: Rate limit requests/min and tokens/min.
  - **Monthly Credit / Quota**: Remaining balance %.

---

## Unified Data Structure

```typescript
export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'exhausted';

export interface ProviderUsage {
  id: 'claude' | 'antigravity' | 'grok' | 'codex';
  name: string;
  remainingPercent: number; // 0 to 100
  status: HealthStatus;
  resetTimerSeconds?: number; // Seconds until 5h / daily reset
  usedTokens?: number;
  maxTokens?: number;
  lastUpdated: string;
  isSimulated?: boolean;
}

export interface OverallStatus {
  healthScore: number; // 0 to 100
  mascotState: 'flying' | 'alert' | 'tired' | 'sleeping';
  providers: Record<string, ProviderUsage>;
}
```
