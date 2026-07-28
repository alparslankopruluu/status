//! Registering StatusOwl as Claude Code's `statusLine.command`.
//!
//! This edits the user's own Claude Code configuration, so it is deliberately careful:
//!   * a backup is taken before the first write,
//!   * every other key in settings.json is preserved (field-level merge, never a rewrite),
//!   * an existing statusLine is wrapped rather than destroyed,
//!   * project-level settings that would override ours are detected and reported, because
//!     the docs' precedence is managed > CLI > .claude/settings.local.json >
//!     .claude/settings.json > ~/.claude/settings.json.

use crate::sources::claude::{statusowl_dir, wrapped_command_path};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
pub struct StatuslineStatus {
    pub installed: bool,
    /// The command currently registered, whether ours or someone else's.
    pub current_command: Option<String>,
    /// The command we displaced and now call through to.
    pub wrapped_command: Option<String>,
    /// Exact command we would write — shown in the confirmation dialog before any write.
    pub proposed_command: String,
    pub settings_path: String,
    /// Set when a higher-precedence settings file would override our registration.
    pub overridden_by: Option<String>,
}

fn settings_path() -> Option<PathBuf> {
    dirs::home_dir().map(|h| h.join(".claude/settings.json"))
}

fn read_settings() -> serde_json::Value {
    settings_path()
        .and_then(|p| std::fs::read_to_string(p).ok())
        .and_then(|raw| serde_json::from_str(&raw).ok())
        .unwrap_or_else(|| serde_json::json!({}))
}

/// Quoted so the app still works from a path containing spaces.
pub fn proposed_command() -> String {
    let exe = std::env::current_exe()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_else(|_| "status-owl".to_string());
    format!("\"{exe}\" --statusline")
}

fn is_ours(cmd: &str) -> bool {
    cmd.contains("--statusline") && (cmd.contains("StatusOwl") || cmd.contains("status-owl"))
}

/// A project-scoped settings file in the current working directory beats the user-level one.
fn detect_override() -> Option<String> {
    let cwd = std::env::current_dir().ok()?;
    for rel in [".claude/settings.local.json", ".claude/settings.json"] {
        let candidate = cwd.join(rel);
        if let Ok(raw) = std::fs::read_to_string(&candidate) {
            if let Ok(v) = serde_json::from_str::<serde_json::Value>(&raw) {
                if v.get("statusLine").is_some() {
                    return Some(candidate.to_string_lossy().to_string());
                }
            }
        }
    }
    None
}

fn read_wrapped() -> Option<String> {
    let raw = std::fs::read_to_string(wrapped_command_path()?).ok()?;
    let trimmed = raw.trim().to_string();
    (!trimmed.is_empty()).then_some(trimmed)
}

pub fn status() -> StatuslineStatus {
    let settings = read_settings();
    let current = settings
        .get("statusLine")
        .and_then(|s| s.get("command"))
        .and_then(|c| c.as_str())
        .map(str::to_string);

    StatuslineStatus {
        installed: current.as_deref().map(is_ours).unwrap_or(false),
        current_command: current,
        wrapped_command: read_wrapped(),
        proposed_command: proposed_command(),
        settings_path: settings_path()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default(),
        overridden_by: detect_override(),
    }
}

pub fn install() -> Result<StatuslineStatus, String> {
    let path = settings_path().ok_or("Could not resolve ~/.claude/settings.json")?;
    let parent = path.parent().ok_or("Invalid settings path")?;
    std::fs::create_dir_all(parent).map_err(|e| format!("Could not create {parent:?}: {e}"))?;

    let mut settings = read_settings();

    // Back up once, before the first modification, so uninstall can always restore.
    if path.exists() {
        let backup = path.with_extension("json.statusowl-backup");
        if !backup.exists() {
            std::fs::copy(&path, &backup)
                .map_err(|e| format!("Could not write backup {backup:?}: {e}"))?;
        }
    }

    // Preserve a pre-existing status line by calling through to it.
    if let Some(existing) = settings
        .get("statusLine")
        .and_then(|s| s.get("command"))
        .and_then(|c| c.as_str())
    {
        if !is_ours(existing) {
            let dir = statusowl_dir().ok_or("Could not resolve ~/.statusowl")?;
            std::fs::create_dir_all(&dir).map_err(|e| format!("Could not create {dir:?}: {e}"))?;
            let wrapped = wrapped_command_path().ok_or("Could not resolve wrapped command path")?;
            std::fs::write(&wrapped, existing)
                .map_err(|e| format!("Could not record the existing status line: {e}"))?;
        }
    }

    // Field-level merge: only statusLine is touched, every other key is left alone.
    let obj = settings
        .as_object_mut()
        .ok_or("settings.json is not a JSON object")?;
    obj.insert(
        "statusLine".to_string(),
        serde_json::json!({ "type": "command", "command": proposed_command() }),
    );

    let rendered = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Could not serialize settings: {e}"))?;
    std::fs::write(&path, rendered).map_err(|e| format!("Could not write {path:?}: {e}"))?;

    Ok(status())
}

pub fn uninstall() -> Result<StatuslineStatus, String> {
    let path = settings_path().ok_or("Could not resolve ~/.claude/settings.json")?;
    let mut settings = read_settings();
    let obj = settings
        .as_object_mut()
        .ok_or("settings.json is not a JSON object")?;

    // Restore whatever we displaced; otherwise remove the key entirely.
    match read_wrapped() {
        Some(prev) => {
            obj.insert(
                "statusLine".to_string(),
                serde_json::json!({ "type": "command", "command": prev }),
            );
        }
        None => {
            obj.remove("statusLine");
        }
    }

    let rendered = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Could not serialize settings: {e}"))?;
    std::fs::write(&path, rendered).map_err(|e| format!("Could not write {path:?}: {e}"))?;

    if let Some(p) = wrapped_command_path() {
        let _ = std::fs::remove_file(p);
    }

    Ok(status())
}

#[cfg(test)]
mod tests {
    use super::*;

    /// One test drives the whole sequence: these functions read $HOME, and Rust runs tests
    /// in parallel threads inside a single process, so splitting them would race.
    #[test]
    fn install_preserves_other_keys_wraps_existing_and_restores_on_uninstall() {
        let tmp = std::env::temp_dir().join(format!("statusowl-test-{}", std::process::id()));
        let claude_dir = tmp.join(".claude");
        std::fs::create_dir_all(&claude_dir).unwrap();
        std::env::set_var("HOME", &tmp);

        // A realistic pre-existing config: unrelated keys plus the user's own status line.
        let settings = claude_dir.join("settings.json");
        std::fs::write(
            &settings,
            r#"{"enableWorkflows":true,"agentPushNotifEnabled":true,
                "statusLine":{"type":"command","command":"echo mine"}}"#,
        )
        .unwrap();

        install().unwrap();

        let after: serde_json::Value =
            serde_json::from_str(&std::fs::read_to_string(&settings).unwrap()).unwrap();

        // Unrelated keys must survive the merge.
        assert_eq!(after["enableWorkflows"], serde_json::json!(true));
        assert_eq!(after["agentPushNotifEnabled"], serde_json::json!(true));

        // Our command is registered, and the executable path is quoted.
        let cmd = after["statusLine"]["command"].as_str().unwrap();
        assert!(cmd.contains("--statusline"), "got {cmd}");
        assert!(cmd.starts_with('"'), "executable path must be quoted: {cmd}");

        // The displaced command is remembered so it can keep rendering.
        assert_eq!(read_wrapped().as_deref(), Some("echo mine"));

        // A backup exists for recovery.
        assert!(settings.with_extension("json.statusowl-backup").exists());

        uninstall().unwrap();

        let restored: serde_json::Value =
            serde_json::from_str(&std::fs::read_to_string(&settings).unwrap()).unwrap();
        assert_eq!(restored["statusLine"]["command"], serde_json::json!("echo mine"));
        assert_eq!(restored["enableWorkflows"], serde_json::json!(true));

        let _ = std::fs::remove_dir_all(&tmp);
    }
}
