// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};

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

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_usage_summary])
        .run(tauri::generate_context!())
        .expect("error while running StatusOwl application");
}
