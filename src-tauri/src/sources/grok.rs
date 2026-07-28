//! xAI Grok — UNOFFICIAL source.
//!
//! The Grok CLI stores an OAuth credential set at `~/.grok/auth.json`. We reuse it to ask
//! xAI for the account's rate-limit windows. The endpoint is not documented, so this is
//! labelled `Unofficial`: if the shape changes we report "source didn't answer" rather
//! than guessing a number.

use crate::model::{now_unix, ProviderSnapshot, SourceKind, UsageWindow};

const RATE_LIMIT_URL: &str = "https://api.x.ai/v1/rate-limits";

struct GrokCreds {
    access_token: String,
}

/// `~/.grok/auth.json` is keyed by issuer+account, e.g.
/// `"https://auth.x.ai::<uuid>": { "key": "...", "expires_at": "...", ... }`.
/// We take the first entry that still has a usable token.
fn read_credentials() -> Option<GrokCreds> {
    let path = dirs::home_dir()?.join(".grok/auth.json");
    let raw = std::fs::read_to_string(path).ok()?;
    let v: serde_json::Value = serde_json::from_str(&raw).ok()?;
    let obj = v.as_object()?;

    for (_account, entry) in obj {
        if let Some(token) = entry.get("key").and_then(|k| k.as_str()) {
            if !token.is_empty() {
                return Some(GrokCreds {
                    access_token: token.to_string(),
                });
            }
        }
    }
    None
}

/// Map whatever windows the response exposes. Anything we don't recognise is skipped —
/// we never coerce an unknown field into a percentage.
fn windows_from_response(v: &serde_json::Value) -> Vec<UsageWindow> {
    let mut out = Vec::new();

    let candidates: [(&str, &str); 3] = [
        ("five_hour", "5h"),
        ("seven_day", "Weekly"),
        ("monthly", "Monthly"),
    ];

    for (key, label) in candidates {
        let Some(node) = v.get(key) else { continue };
        let pct = node
            .get("used_percentage")
            .and_then(|p| p.as_f64())
            .or_else(|| {
                // Some shapes report remaining/limit instead of a percentage.
                let remaining = node.get("remaining")?.as_f64()?;
                let limit = node.get("limit")?.as_f64()?;
                if limit > 0.0 {
                    Some(((limit - remaining) / limit) * 100.0)
                } else {
                    None
                }
            });
        let Some(pct) = pct else { continue };
        out.push(UsageWindow {
            label: label.to_string(),
            used_percent: pct,
            resets_at: node.get("resets_at").and_then(|r| r.as_i64()),
        });
    }

    out
}

pub async fn snapshot() -> ProviderSnapshot {
    let Some(creds) = read_credentials() else {
        return ProviderSnapshot::unavailable(
            "grok",
            "Grok CLI not signed in on this machine (no credentials in ~/.grok/auth.json).",
        );
    };

    let client = reqwest::Client::new();
    let resp = client
        .get(RATE_LIMIT_URL)
        .bearer_auth(&creds.access_token)
        .send()
        .await;

    let resp = match resp {
        Ok(r) => r,
        Err(e) => {
            return ProviderSnapshot::unavailable("grok", format!("Could not reach xAI: {e}"));
        }
    };

    if !resp.status().is_success() {
        return ProviderSnapshot::unavailable(
            "grok",
            format!(
                "xAI rejected the stored Grok CLI credentials (HTTP {}). Re-run `grok` to sign in again.",
                resp.status().as_u16()
            ),
        );
    }

    let body: serde_json::Value = match resp.json().await {
        Ok(b) => b,
        Err(_) => {
            return ProviderSnapshot::unavailable(
                "grok",
                "xAI returned an unexpected response shape — not showing a number rather than guessing.",
            );
        }
    };

    let windows = windows_from_response(&body);
    if windows.is_empty() {
        return ProviderSnapshot::unavailable(
            "grok",
            "Signed in, but this response contained no recognisable quota window.",
        );
    }

    ProviderSnapshot::with_windows(
        "grok",
        windows,
        SourceKind::Unofficial,
        now_unix(),
        Some("Read from an undocumented xAI endpoint — may break without notice.".to_string()),
    )
}
