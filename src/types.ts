export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'exhausted';

export type MascotState = 'flying' | 'alert' | 'tired' | 'sleeping';

export type ProviderId = 'claude' | 'antigravity' | 'grok' | 'codex';

export interface ProviderUsage {
  id: ProviderId;
  name: string;
  subtitle: string;
  iconName: string;
  remainingPercent: number; // 0 - 100
  status: HealthStatus;
  resetTimerSeconds: number; // Countdown to 5h / daily reset
  usedTokens?: number;
  maxTokens?: number;
  requestsLimit?: string;
  lastUpdated: string;
  isSimulated?: boolean;
  notes?: string;
}

export interface OverallSystemStatus {
  overallHealthScore: number;
  mascotState: MascotState;
  activeProvidersCount: number;
  exhaustedProvidersCount: number;
  nextResetSeconds: number;
  providers: Record<ProviderId, ProviderUsage>;
}

export interface UserPreferences {
  refreshIntervalSeconds: number;
  soundNotifications: boolean;
  desktopNotifications: boolean;
  alwaysOnTop: boolean;
  theme: 'dark' | 'light' | 'system';
  customPaths: Record<ProviderId, string>;
}
