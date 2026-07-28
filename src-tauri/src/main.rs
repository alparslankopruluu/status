// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, Runtime,
};

#[derive(Debug, Serialize, Deserialize)]
pub struct LocalSessionInfo {
    pub exists: bool,
    pub path: String,
    pub entries: usize,
}

/// Checks whether a given AI provider's local CLI/IDE session directory actually
/// exists and is non-empty. This is honest presence detection only — these tools
/// don't expose a documented on-disk format for exact quota numbers, so we never
/// fabricate a percentage from what we find here.
#[tauri::command]
fn detect_local_session(provider: String) -> LocalSessionInfo {
    let relative_path = match provider.as_str() {
        "claude" => Some(".claude"),
        "antigravity" => Some(".gemini/antigravity-ide"),
        "grok" => Some(".grok"),
        "codex" => Some(".codex"),
        _ => None,
    };

    let full_path = match (dirs::home_dir(), relative_path) {
        (Some(home), Some(rel)) => Some(home.join(rel)),
        _ => None,
    };

    match full_path {
        Some(path) => {
            let path_str = path.to_string_lossy().to_string();
            match std::fs::read_dir(&path) {
                Ok(read_dir) => LocalSessionInfo {
                    exists: true,
                    path: path_str,
                    entries: read_dir.count(),
                },
                Err(_) => LocalSessionInfo {
                    exists: false,
                    path: path_str,
                    entries: 0,
                },
            }
        }
        None => LocalSessionInfo {
            exists: false,
            path: String::new(),
            entries: 0,
        },
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiKeyCheckResult {
    pub valid: bool,
    pub status_code: u16,
    /// Only set when the provider's response actually included a rate-limit header —
    /// never a guess or placeholder.
    pub rate_limit_remaining: Option<i64>,
    pub rate_limit_limit: Option<i64>,
    pub rate_limit_reset_seconds: Option<i64>,
    pub detail: String,
}

/// Scans a response's headers for any of the rate-limit header conventions used by
/// Anthropic / OpenAI-style APIs. Returns None for a field if the provider's response
/// simply doesn't include it — callers must not invent a number in that case.
fn parse_rate_limit_headers(headers: &reqwest::header::HeaderMap) -> (Option<i64>, Option<i64>, Option<i64>) {
    let get_i64 = |names: &[&str]| -> Option<i64> {
        for name in names {
            if let Some(v) = headers.get(*name) {
                if let Ok(s) = v.to_str() {
                    if let Ok(n) = s.parse::<i64>() {
                        return Some(n);
                    }
                }
            }
        }
        None
    };
    let remaining = get_i64(&[
        "anthropic-ratelimit-requests-remaining",
        "x-ratelimit-remaining-requests",
    ]);
    let limit = get_i64(&[
        "anthropic-ratelimit-requests-limit",
        "x-ratelimit-limit-requests",
    ]);
    let reset = get_i64(&[
        "anthropic-ratelimit-requests-reset",
        "x-ratelimit-reset-requests",
    ]);
    (remaining, limit, reset)
}

/// Makes one real, lightweight (free/near-free "list models") request to the
/// provider using the user's key, to confirm it's actually valid — and opportunistically
/// reads real rate-limit headers if the provider's response happens to include them.
/// Never fabricates a percentage: if no header is present, the Option fields stay None.
#[tauri::command]
async fn verify_api_key(provider: String, api_key: String) -> ApiKeyCheckResult {
    let client = reqwest::Client::new();
    let key = api_key.trim().to_string();

    let request = match provider.as_str() {
        "claude" => client
            .get("https://api.anthropic.com/v1/models")
            .header("x-api-key", &key)
            .header("anthropic-version", "2023-06-01"),
        "codex" => client.get("https://api.openai.com/v1/models").bearer_auth(&key),
        "grok" => client.get("https://api.x.ai/v1/models").bearer_auth(&key),
        "antigravity" => client.get(format!(
            "https://generativelanguage.googleapis.com/v1beta/models?key={}",
            key
        )),
        other => {
            return ApiKeyCheckResult {
                valid: false,
                status_code: 0,
                rate_limit_remaining: None,
                rate_limit_limit: None,
                rate_limit_reset_seconds: None,
                detail: format!("Unknown provider: {other}"),
            };
        }
    };

    match request.send().await {
        Ok(resp) => {
            let status = resp.status();
            let (remaining, limit, reset) = parse_rate_limit_headers(resp.headers());
            ApiKeyCheckResult {
                valid: status.is_success(),
                status_code: status.as_u16(),
                rate_limit_remaining: remaining,
                rate_limit_limit: limit,
                rate_limit_reset_seconds: reset,
                detail: if status.is_success() {
                    "Key verified".into()
                } else {
                    format!("Provider rejected this key (HTTP {})", status.as_u16())
                },
            }
        }
        Err(e) => ApiKeyCheckResult {
            valid: false,
            status_code: 0,
            rate_limit_remaining: None,
            rate_limit_limit: None,
            rate_limit_reset_seconds: None,
            detail: format!("Network error while contacting provider: {e}"),
        },
    }
}

#[tauri::command]
fn hide_window<R: Runtime>(window: tauri::Window<R>) {
    let _ = window.hide();
}

#[tauri::command]
fn toggle_always_on_top<R: Runtime>(window: tauri::Window<R>, always_on_top: bool) {
    let _ = window.set_always_on_top(always_on_top);
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let quit_item = MenuItem::with_id(app, "quit", "Quit StatusOwl", true, None::<&str>)?;
            let hide_item =
                MenuItem::with_id(app, "toggle", "Show/Hide StatusOwl", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&hide_item, &quit_item])?;

            // The window is skipTaskbar + undecorated, so this tray item is the ONLY way
            // back once it's hidden. Without an explicit icon it renders blank in the
            // macOS menu bar, which made a hidden window unrecoverable.
            //
            // This is a dedicated *template* image (transparent background, solid owl
            // silhouette). The app icon can't be reused here: macOS template rendering
            // only reads the alpha channel, and the app icon's opaque rounded-rect
            // background would collapse into a featureless white square.
            let tray_icon = tauri::image::Image::from_bytes(include_bytes!(
                "../icons/tray-icon.png"
            ))?;

            let _tray = TrayIconBuilder::new()
                .icon(tray_icon)
                // Renders as a monochrome template image so it adapts to light/dark menu bars.
                .icon_as_template(true)
                .menu(&menu)
                // Left click must toggle the window; without this the attached menu
                // swallows left clicks and the handler below never fires.
                .show_menu_on_left_click(false)
                .tooltip("StatusOwl - AI Quota Monitor")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "toggle" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let is_visible = window.is_visible().unwrap_or(false);
                            if is_visible {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let is_visible = window.is_visible().unwrap_or(false);
                            if is_visible {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            detect_local_session,
            verify_api_key,
            hide_window,
            toggle_always_on_top
        ])
        .run(tauri::generate_context!())
        .expect("error while running StatusOwl application");
}
