# docs/providers-spec.md — Telemetry & Authentication Specification

How StatusOwl decides what it is allowed to show. The governing rule:

> **Never display a number StatusOwl did not actually measure.** If a value isn't
> present in a real provider response, nothing is rendered in its place — no
> estimate, no placeholder, no seeded default.

---

## ⚠️ API quota is not subscription quota

This is the single most important thing to understand about this app.

An **API key** (`sk-ant-…`, `AIzaSy…`, `xai-…`, `sk-proj-…`) measures your usage of the
provider's **developer API**, billed per token. Your **Claude Code / Antigravity
subscription** (Pro, Max, etc.) — including Claude Code's 5-hour rolling limit — is a
**completely separate system**, and providers do not expose that subscription usage
through any public API.

Consequence: **a perfectly valid Anthropic API key cannot show your Claude Code
subscription limit.** StatusOwl says so explicitly in the Settings and Onboarding
screens rather than quietly showing an unrelated number.

---

## Authentication paths

### 1. Verified API key (the only path that puts a tool in the monitored list)

`verify_api_key` (Rust, `src-tauri/src/main.rs`) makes one real, lightweight
`GET /models`-style request with the user's key:

| Provider | Endpoint | Auth |
|---|---|---|
| `claude` | `https://api.anthropic.com/v1/models` | `x-api-key` + `anthropic-version` |
| `codex` | `https://api.openai.com/v1/models` | Bearer |
| `grok` | `https://api.x.ai/v1/models` | Bearer |
| `antigravity` | `https://generativelanguage.googleapis.com/v1beta/models` | `?key=` |

The call runs in Rust so it isn't blocked by browser CORS. A key counts as
authenticated **only** when this request actually succeeds — a matching key *format*
is never sufficient on its own.

### 2. Local session folder (informational only — NOT listed)

`detect_local_session` checks whether `~/.claude/`, `~/.gemini/antigravity-ide/`,
`~/.grok/` or `~/.codex/` exists and is non-empty. This proves only that the tool is
**installed**; none of these expose readable quota data on disk. Such providers are
therefore reported as *not* authenticated and are **kept out of the monitored list**,
surfaced only as a one-line "detected but exposing no readable quota" note in the
empty state.

---

## Quota numbers

A percentage is rendered **only** when the provider's response carried real
rate-limit headers, parsed by `parse_rate_limit_headers`:

- `anthropic-ratelimit-requests-remaining` / `-limit` / `-reset`
- `x-ratelimit-remaining-requests` / `x-ratelimit-limit-requests` / `x-ratelimit-reset-requests`

If a header is absent the corresponding field stays `undefined` — it is never backfilled
from a previous value or a seed constant. In that case the card shows an explanatory
sentence instead of a number, and a verified-but-quota-less provider is still listed
(the key genuinely works) with no percentage.

## Aggregate health & mascot

`overallHealthScore` averages **only** providers that returned a real percentage. With
none, it is `null`:

- Header pill renders `—` in neutral grey, not a number.
- Mascot enters the `idle` state: the calm perched silhouette, desaturated, no glow, no
  pulsing "live" dot, badge reads **"No Quota Data"**.
- The reset countdown renders only when a real reset header was returned.

No health claim (`Healthy Quota (>70%)` and friends) is ever shown without a measured
number behind it.
