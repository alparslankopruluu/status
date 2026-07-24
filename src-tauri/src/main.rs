// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, Runtime,
};

#[derive(Debug, Serialize, Deserialize)]
pub struct ProviderStatus {
    pub id: String,
    pub name: String,
    pub remaining_percent: u32,
    pub status: String,
    pub reset_timer_seconds: u32,
}

#[tauri::command]
fn get_usage_summary() -> Vec<ProviderStatus> {
    vec![
        ProviderStatus {
            id: "claude".into(),
            name: "Claude Code".into(),
            remaining_percent: 85,
            status: "healthy".into(),
            reset_timer_seconds: 12400,
        },
        ProviderStatus {
            id: "antigravity".into(),
            name: "Antigravity (Gemini)".into(),
            remaining_percent: 92,
            status: "healthy".into(),
            reset_timer_seconds: 28800,
        },
        ProviderStatus {
            id: "grok".into(),
            name: "xAI Grok".into(),
            remaining_percent: 78,
            status: "healthy".into(),
            reset_timer_seconds: 7200,
        },
        ProviderStatus {
            id: "codex".into(),
            name: "OpenAI Codex".into(),
            remaining_percent: 64,
            status: "healthy".into(),
            reset_timer_seconds: 15600,
        },
    ]
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
            get_usage_summary,
            hide_window,
            toggle_always_on_top
        ])
        .run(tauri::generate_context!())
        .expect("error while running StatusOwl application");
}
