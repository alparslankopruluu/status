//! Adapters for providers whose local sources are not present on the development machine.
//!
//! These follow the same contract as every other source, but none of them has been
//! exercised against a live install — so when the expected credential file is missing they
//! return `Unavailable` with a plain explanation, and when it IS present they are marked
//! `Unverified` rather than presented with the same confidence as Claude's official feed.
//!
//! Deliberately absent: **Cursor**. Its usage data is only reachable through browser
//! session cookies, and reading browser cookies is out of scope (it would require Full Disk
//! Access and Keychain permissions on macOS).

use crate::model::{now_unix, ProviderSnapshot, SourceKind, UsageWindow};

/// Shared shape used by the OpenAI/Codex and Gemini credential probes.
fn credential_file_missing(provider: &str, tool: &str, path: &str) -> ProviderSnapshot {
    ProviderSnapshot::unavailable(
        provider,
        format!("{tool} is not signed in on this machine (looked for {path})."),
    )
}

fn percent_windows(v: &serde_json::Value, keys: &[(&str, &str)]) -> Vec<UsageWindow> {
    let mut out = Vec::new();
    for (key, label) in keys {
        let Some(node) = v.get(*key) else { continue };
        let Some(pct) = node.get("used_percentage").and_then(|p| p.as_f64()) else {
            continue;
        };
        out.push(UsageWindow {
            label: label.to_string(),
            used_percent: pct,
            resets_at: node.get("resets_at").and_then(|r| r.as_i64()),
        });
    }
    out
}

const UNVERIFIED_NOTE: &str =
    "This integration has not been verified against a live install yet — treat the numbers with care.";

/// OpenAI Codex. Codex CLI keeps OAuth credentials in `~/.codex/auth.json`.
pub async fn codex_snapshot() -> ProviderSnapshot {
    let Some(home) = dirs::home_dir() else {
        return ProviderSnapshot::unavailable("codex", "Could not resolve the home directory.");
    };
    let path = home.join(".codex/auth.json");
    if !path.exists() {
        return credential_file_missing("codex", "Codex CLI", "~/.codex/auth.json");
    }

    let Some(token) = std::fs::read_to_string(&path)
        .ok()
        .and_then(|raw| serde_json::from_str::<serde_json::Value>(&raw).ok())
        .and_then(|v| {
            v.get("tokens")
                .and_then(|t| t.get("access_token"))
                .or_else(|| v.get("access_token"))
                .and_then(|t| t.as_str())
                .map(str::to_string)
        })
    else {
        return ProviderSnapshot::unavailable(
            "codex",
            "Found ~/.codex/auth.json but could not read an access token from it.",
        );
    };

    let client = reqwest::Client::new();
    let resp = client
        .get("https://chatgpt.com/backend-api/codex/usage")
        .bearer_auth(&token)
        .send()
        .await;

    match resp {
        Ok(r) if r.status().is_success() => match r.json::<serde_json::Value>().await {
            Ok(body) => {
                let windows = percent_windows(
                    &body,
                    &[("five_hour", "5h"), ("seven_day", "Weekly"), ("monthly", "Monthly")],
                );
                if windows.is_empty() {
                    ProviderSnapshot::unavailable(
                        "codex",
                        "Signed in, but the response contained no recognisable quota window.",
                    )
                } else {
                    ProviderSnapshot::with_windows(
                        "codex",
                        windows,
                        SourceKind::Unverified,
                        now_unix(),
                        Some(UNVERIFIED_NOTE.to_string()),
                    )
                }
            }
            Err(_) => ProviderSnapshot::unavailable(
                "codex",
                "OpenAI returned an unexpected response shape — showing nothing rather than guessing.",
            ),
        },
        Ok(r) => ProviderSnapshot::unavailable(
            "codex",
            format!("OpenAI rejected the stored Codex credentials (HTTP {}).", r.status().as_u16()),
        ),
        Err(e) => ProviderSnapshot::unavailable("codex", format!("Could not reach OpenAI: {e}")),
    }
}

/// Gemini CLI. Note this is NOT the same as Antigravity — the Gemini CLI writes its own
/// `~/.gemini/oauth_creds.json`, while Antigravity only populates `~/.gemini/antigravity*`.
pub async fn gemini_snapshot() -> ProviderSnapshot {
    let Some(home) = dirs::home_dir() else {
        return ProviderSnapshot::unavailable("gemini", "Could not resolve the home directory.");
    };
    let path = home.join(".gemini/oauth_creds.json");
    if !path.exists() {
        return credential_file_missing("gemini", "Gemini CLI", "~/.gemini/oauth_creds.json");
    }

    ProviderSnapshot::unavailable(
        "gemini",
        "Gemini CLI credentials found, but its quota endpoint has not been verified yet — not showing an unchecked number.",
    )
}

/// GitHub Copilot. Uses the GitHub device flow (not browser cookies), so it stays in scope,
/// but nothing is stored until the user completes that flow.
pub async fn copilot_snapshot() -> ProviderSnapshot {
    ProviderSnapshot::unavailable(
        "copilot",
        "Not connected. Copilot needs a one-time GitHub device-flow sign-in, which isn't set up yet.",
    )
}

/// Antigravity IDE. CodexBar treats its local probe as experimental; we do the same and
/// only report presence, never an invented quota.
pub async fn antigravity_snapshot() -> ProviderSnapshot {
    let Some(home) = dirs::home_dir() else {
        return ProviderSnapshot::unavailable("antigravity", "Could not resolve the home directory.");
    };
    let dir = home.join(".gemini/antigravity-ide");
    if !dir.exists() {
        return ProviderSnapshot::unavailable(
            "antigravity",
            "Antigravity is not installed on this machine (~/.gemini/antigravity-ide not found).",
        );
    }

    ProviderSnapshot::unavailable(
        "antigravity",
        "Antigravity is installed, but it exposes no readable quota signal — only an experimental local probe, which we don't guess from.",
    )
}
