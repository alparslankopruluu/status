pub mod claude;
pub mod grok;
pub mod others;

use crate::model::ProviderSnapshot;

/// Providers StatusOwl knows how to look for. Cursor is intentionally absent: its usage is
/// only reachable via browser session cookies, which is out of scope.
pub const KNOWN_PROVIDERS: [&str; 6] =
    ["claude", "grok", "codex", "gemini", "antigravity", "copilot"];

pub async fn fetch(provider: &str) -> ProviderSnapshot {
    match provider {
        "claude" => claude::snapshot(),
        "grok" => grok::snapshot().await,
        "codex" => others::codex_snapshot().await,
        "gemini" => others::gemini_snapshot().await,
        "antigravity" => others::antigravity_snapshot().await,
        "copilot" => others::copilot_snapshot().await,
        other => ProviderSnapshot::unavailable(other, format!("Unknown provider: {other}")),
    }
}
