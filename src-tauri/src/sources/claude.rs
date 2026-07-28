//! Claude Code — the one OFFICIAL source we have.
//!
//! Claude Code pipes session JSON on stdin to whatever command is configured as
//! `statusLine.command` in settings.json. That payload carries `rate_limits` with the
//! real 5-hour and 7-day subscription windows. We register this binary as that command
//! (`--statusline`), capture the numbers, and store a minimal snapshot for the GUI.
//!
//! Documented constraints we surface honestly:
//!   * `rate_limits` appears only for Claude.ai Pro/Max subscribers, and only after the
//!     first API response in a session. Each window may be independently absent.
//!   * It updates only while Claude Code is running, so what we hold is always a
//!     point-in-time snapshot — never a live feed.

use crate::model::{now_unix, ProviderSnapshot, SourceKind, UsageWindow};
use serde::{Deserialize, Serialize};
use std::io::Read;
use std::path::PathBuf;

/// Only the fields we actually need are persisted. The incoming payload also contains
/// `cwd`, `session_id`, PR details and more — deliberately not stored.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct StatuslineSnapshot {
    pub captured_at: i64,
    pub model_display_name: Option<String>,
    pub context_used_percent: Option<f64>,
    pub five_hour_percent: Option<f64>,
    pub five_hour_resets_at: Option<i64>,
    pub seven_day_percent: Option<f64>,
    pub seven_day_resets_at: Option<i64>,
}

pub fn statusowl_dir() -> Option<PathBuf> {
    dirs::home_dir().map(|h| h.join(".statusowl"))
}

pub fn snapshot_path() -> Option<PathBuf> {
    statusowl_dir().map(|d| d.join("statusline.json"))
}

/// Path holding the command we displaced, so the user's own status line keeps working.
pub fn wrapped_command_path() -> Option<PathBuf> {
    statusowl_dir().map(|d| d.join("wrapped-statusline.txt"))
}

fn f64_at(v: &serde_json::Value, path: &[&str]) -> Option<f64> {
    let mut cur = v;
    for key in path {
        cur = cur.get(key)?;
    }
    cur.as_f64()
}

fn i64_at(v: &serde_json::Value, path: &[&str]) -> Option<i64> {
    let mut cur = v;
    for key in path {
        cur = cur.get(key)?;
    }
    cur.as_i64()
}

pub fn parse_payload(raw: &str) -> Option<StatuslineSnapshot> {
    let v: serde_json::Value = serde_json::from_str(raw).ok()?;
    Some(StatuslineSnapshot {
        captured_at: now_unix(),
        model_display_name: v
            .get("model")
            .and_then(|m| m.get("display_name"))
            .and_then(|d| d.as_str())
            .map(str::to_string),
        context_used_percent: f64_at(&v, &["context_window", "used_percentage"]),
        five_hour_percent: f64_at(&v, &["rate_limits", "five_hour", "used_percentage"]),
        five_hour_resets_at: i64_at(&v, &["rate_limits", "five_hour", "resets_at"]),
        seven_day_percent: f64_at(&v, &["rate_limits", "seven_day", "used_percentage"]),
        seven_day_resets_at: i64_at(&v, &["rate_limits", "seven_day", "resets_at"]),
    })
}

/// Write via temp file + rename so the GUI never reads a half-written file.
fn write_snapshot_atomically(snap: &StatuslineSnapshot) -> Option<()> {
    let dir = statusowl_dir()?;
    std::fs::create_dir_all(&dir).ok()?;
    let final_path = dir.join("statusline.json");
    let tmp_path = dir.join("statusline.json.tmp");
    let json = serde_json::to_string_pretty(snap).ok()?;
    std::fs::write(&tmp_path, json).ok()?;
    std::fs::rename(&tmp_path, &final_path).ok()?;
    Some(())
}

fn default_status_text(snap: &StatuslineSnapshot) -> String {
    let mut parts: Vec<String> = Vec::new();
    if let Some(model) = &snap.model_display_name {
        parts.push(model.clone());
    }
    if let Some(ctx) = snap.context_used_percent {
        parts.push(format!("context {:.0}%", ctx));
    }
    if let Some(p) = snap.five_hour_percent {
        parts.push(format!("5h {:.0}%", p));
    }
    if let Some(p) = snap.seven_day_percent {
        parts.push(format!("week {:.0}%", p));
    }
    parts.join(" · ")
}

/// Run the command StatusOwl displaced, feeding it the same stdin, and return its output
/// so the user's original status line is preserved rather than replaced.
fn run_wrapped_command(raw: &str) -> Option<String> {
    let cmd = std::fs::read_to_string(wrapped_command_path()?).ok()?;
    let cmd = cmd.trim();
    if cmd.is_empty() {
        return None;
    }

    use std::io::Write;
    use std::process::{Command, Stdio};

    let mut child = Command::new("sh")
        .arg("-c")
        .arg(cmd)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
        .ok()?;
    if let Some(mut stdin) = child.stdin.take() {
        let _ = stdin.write_all(raw.as_bytes());
    }
    let out = child.wait_with_output().ok()?;
    Some(String::from_utf8_lossy(&out.stdout).trim_end().to_string())
}

/// Headless entry point invoked as `status-owl --statusline`.
///
/// This runs inside the user's Claude Code session, so it must NEVER fail loudly:
/// any error path still prints something harmless and exits 0.
pub fn run_statusline_hook() {
    let mut raw = String::new();
    if std::io::stdin().read_to_string(&mut raw).is_err() {
        println!();
        return;
    }

    let parsed = parse_payload(&raw);
    if let Some(snap) = &parsed {
        // Best effort — a failed write must not disturb Claude Code.
        let _ = write_snapshot_atomically(snap);
    }

    // A wrapped command owns the visible line; otherwise print our own summary.
    if let Some(passthrough) = run_wrapped_command(&raw) {
        println!("{passthrough}");
        return;
    }

    match parsed {
        Some(snap) => println!("{}", default_status_text(&snap)),
        None => println!(),
    }
}

pub fn read_snapshot() -> Option<StatuslineSnapshot> {
    let path = snapshot_path()?;
    let raw = std::fs::read_to_string(path).ok()?;
    serde_json::from_str(&raw).ok()
}

/// Turn the stored snapshot into the shared shape. A window whose reset time has already
/// passed is dropped rather than shown: the percentage behind it is no longer true.
pub fn snapshot() -> ProviderSnapshot {
    let Some(snap) = read_snapshot() else {
        return ProviderSnapshot::unavailable(
            "claude",
            "Not connected. Use “Connect Claude Code” in Settings to start reading your real 5-hour and weekly limits.",
        );
    };

    let now = now_unix();
    let mut windows = Vec::new();
    let mut expired = false;

    let mut push = |label: &str, pct: Option<f64>, resets: Option<i64>, expired: &mut bool| {
        if let Some(p) = pct {
            if resets.map(|r| r <= now).unwrap_or(false) {
                *expired = true;
            } else {
                windows.push(UsageWindow {
                    label: label.to_string(),
                    used_percent: p,
                    resets_at: resets,
                });
            }
        }
    };

    push("5h", snap.five_hour_percent, snap.five_hour_resets_at, &mut expired);
    push("Weekly", snap.seven_day_percent, snap.seven_day_resets_at, &mut expired);

    let note = if !windows.is_empty() {
        None
    } else if expired {
        Some("Limit window has reset — waiting for Claude Code to report fresh numbers.".to_string())
    } else {
        Some(
            "Connected, but no rate limits reported yet. These appear for Claude.ai Pro/Max plans after the first response in a Claude Code session."
                .to_string(),
        )
    };

    ProviderSnapshot::with_windows(
        "claude",
        windows,
        SourceKind::Official,
        snap.captured_at,
        note,
    )
}
