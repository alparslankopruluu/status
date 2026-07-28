use serde::{Deserialize, Serialize};

/// How much a number can be trusted. Rendered as a badge next to every provider
/// so a reverse-engineered reading is never mistaken for an official one.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum SourceKind {
    /// Documented, supported source (currently only Claude Code's statusline hook).
    Official,
    /// Real measured data, but from an undocumented endpoint that can break without notice.
    Unofficial,
    /// Adapter exists but has never been exercised against a live install.
    Unverified,
    /// Nothing readable on this machine. Carries a `note` explaining why — never a number.
    Unavailable,
}

/// One quota window (a 5-hour rolling limit, a weekly limit, a monthly credit pool…).
/// A provider reports as many as it actually exposes; we never invent one.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsageWindow {
    /// Short human label, e.g. "5h" / "Weekly" / "Monthly credits".
    pub label: String,
    /// 0–100, as reported by the source.
    pub used_percent: f64,
    /// Unix seconds when this window resets, when the source provides it.
    pub resets_at: Option<i64>,
}

/// The single shape every provider adapter returns. Adding a provider means adding
/// one file that produces this — no UI changes required.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderSnapshot {
    pub provider: String,
    /// May be empty: a provider can be connected yet expose no quota numbers.
    /// An empty list means "show no percentage", not "show zero".
    pub windows: Vec<UsageWindow>,
    pub source_kind: SourceKind,
    /// Unix seconds when this reading was taken, so the UI can mark it stale.
    pub captured_at: i64,
    /// Plain-language explanation shown to the user, especially when there are no windows.
    pub note: Option<String>,
}

impl ProviderSnapshot {
    pub fn unavailable(provider: &str, note: impl Into<String>) -> Self {
        Self {
            provider: provider.to_string(),
            windows: Vec::new(),
            source_kind: SourceKind::Unavailable,
            captured_at: now_unix(),
            note: Some(note.into()),
        }
    }

    pub fn with_windows(
        provider: &str,
        windows: Vec<UsageWindow>,
        source_kind: SourceKind,
        captured_at: i64,
        note: Option<String>,
    ) -> Self {
        Self {
            provider: provider.to_string(),
            windows,
            source_kind,
            captured_at,
            note,
        }
    }
}

pub fn now_unix() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}
