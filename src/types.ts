export type MascotState = 'idle' | 'flying' | 'alert' | 'tired' | 'sleeping';

export type ProviderId = 'claude' | 'grok' | 'codex' | 'gemini' | 'antigravity' | 'copilot';

/**
 * How much a number can be trusted. Mirrors the Rust `SourceKind` and is rendered as a
 * badge, so a reverse-engineered reading is never mistaken for an official one.
 */
export type SourceKind = 'official' | 'unofficial' | 'unverified' | 'unavailable';

/** One quota window (5-hour rolling, weekly, monthly credits…) exactly as the source reported it. */
export interface UsageWindow {
  label: string;
  used_percent: number;
  resets_at: number | null;
}

/** The single shape every provider adapter returns. */
export interface ProviderSnapshot {
  provider: ProviderId;
  /** Empty means "show no percentage" — never "show zero". */
  windows: UsageWindow[];
  source_kind: SourceKind;
  /** Unix seconds; lets the UI mark a reading as stale. */
  captured_at: number;
  note: string | null;
}

/** Presentation metadata that doesn't come from the provider itself. */
export interface ProviderMeta {
  id: ProviderId;
  name: string;
  subtitle: string;
}

export interface StatuslineStatus {
  installed: boolean;
  current_command: string | null;
  wrapped_command: string | null;
  proposed_command: string;
  settings_path: string;
  /** Set when a higher-precedence settings file would override our registration. */
  overridden_by: string | null;
}

export interface UserPreferences {
  refreshIntervalSeconds: number;
  soundNotifications: boolean;
  desktopNotifications: boolean;
  alwaysOnTop: boolean;
  theme: 'dark' | 'light' | 'system';
}
