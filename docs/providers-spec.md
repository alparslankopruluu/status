# docs/providers-spec.md — Where every number comes from

The governing rule:

> **Never display a number StatusOwl did not actually measure.** If a value isn't present
> in a real source response, nothing is rendered in its place — no estimate, no placeholder,
> no seeded default.

---

## Source × trust matrix

| Provider | Source | Trust label | Verified |
|---|---|---|---|
| **Claude Code** | Claude Code statusline hook | `Official` | ✅ end-to-end |
| **xAI Grok** | `~/.grok/auth.json` OAuth → xAI rate-limit endpoint | `Unofficial` | ✅ credentials confirmed present |
| **OpenAI Codex** | `~/.codex/auth.json` OAuth → ChatGPT backend | `Unverified` | ❌ Codex CLI not installed |
| **Gemini CLI** | `~/.gemini/oauth_creds.json` | `Unverified` | ❌ Gemini CLI not installed |
| **Antigravity** | `~/.gemini/antigravity-ide` presence only | `Unavailable` | ⚠️ installed, but exposes no readable quota |
| **GitHub Copilot** | GitHub device flow | `Unverified` | ❌ not signed in |
| **Cursor** | — | **out of scope** | — |

**Cursor is deliberately unsupported.** Its usage is only reachable through browser session
cookies, and reading browser cookies is out of scope — it would require Full Disk Access and
Keychain permissions on macOS. Copilot stays in scope because it uses the GitHub *device
flow*, not cookies.

The `Unverified` adapters are written but have never run against a live install. They return
an explanation rather than a number when their credential file is absent, and are badged so
their output is never mistaken for the official feed.

---

## Claude Code — the official path

Claude Code pipes session JSON on stdin to whatever is configured as `statusLine.command`.
That payload carries the real subscription windows:

```json
"rate_limits": {
  "five_hour": { "used_percentage": 23.5, "resets_at": 1738425600 },
  "seven_day": { "used_percentage": 41.2, "resets_at": 1738857600 }
}
```

StatusOwl registers **its own binary** as that command (`status-owl --statusline`), captures
the numbers, and writes a minimal snapshot to `~/.statusowl/statusline.json`.

**Documented constraints, surfaced honestly in the UI:**
- `rate_limits` appears only for Claude.ai **Pro/Max** subscribers, and only **after the first
  API response** in a session. Each window may be independently absent.
- It updates only while Claude Code is running — what StatusOwl holds is always a
  point-in-time snapshot, never a live feed. Readings older than 15 minutes are dimmed and
  stamped "as of HH:MM".
- A window whose `resets_at` has passed is **dropped**, not shown: the percentage behind it is
  no longer true.

### Installation safety

Registering the hook edits the user's own Claude Code config, so `install_statusline`:
- takes a backup (`settings.json.statusowl-backup`) before the first write,
- performs a **field-level merge** — only `statusLine` is touched, every other key survives,
- **wraps** any pre-existing status line instead of destroying it: the old command is stored
  in `~/.statusowl/wrapped-statusline.txt`, invoked with the same stdin, and its output is what
  the terminal shows,
- quotes the executable path, so an app in a directory with spaces still works,
- detects a **higher-precedence** settings file and warns. Precedence is
  `managed > CLI > .claude/settings.local.json > .claude/settings.json > ~/.claude/settings.json`,
  so a project-level file silently wins over our user-level registration.

The hook runs inside the user's Claude Code session and therefore **never fails loudly**:
malformed JSON, empty stdin, or an unwritable snapshot all still print a harmless line and
exit `0`.

---

## Why there is no estimation layer

Claude-Code-Usage-Monitor pairs official `rate_limits` with a **P90 estimate** derived from
past usage when the official data is missing, labelling it `local_estimate`. CodexBar takes a
similar provenance-labelled approach.

StatusOwl implements **only the measured layer**. An estimated percentage is exactly the kind
of fabricated number this project removed, and re-adding it — even labelled — would undo that.
When there is no measurement, the UI says so.

---

## Data model

Every adapter returns one shape, so adding a provider needs no UI change:

```rust
struct UsageWindow  { label: String, used_percent: f64, resets_at: Option<i64> }
struct ProviderSnapshot {
    provider: String,
    windows: Vec<UsageWindow>,   // empty ⇒ render no percentage (NOT zero)
    source_kind: SourceKind,     // Official | Unofficial | Unverified | Unavailable
    captured_at: i64,
    note: Option<String>,        // shown to the user when there are no windows
}
```

A provider may report any number of windows (5-hour, weekly, monthly credits…) and the card
renders each with its own live countdown.

---

## Privacy

- The statusline payload also contains `cwd`, `session_id`, PR details and more. **Only** the
  model name, context percentage, and the two rate-limit windows are persisted.
- Browser cookies are never read, on any platform.
- All credentials are reused in place from the provider's own CLI config; StatusOwl stores no
  passwords and creates no new sign-ins.
