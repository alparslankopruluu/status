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
            let hide_item = MenuItem::with_id(app, "toggle", "Toggle Window", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&hide_item, &quit_item])?;

            let _tray = TrayIconBuilder::new()
                .menu(&menu)
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
            hide_window,
            toggle_always_on_top
        ])
        .run(tauri::generate_context!())
        .expect("error while running StatusOwl application");
}
