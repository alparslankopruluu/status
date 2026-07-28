export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'exhausted';

/** `idle` = no real quota data available; the mascot must make no health claim at all. */
export type MascotState = 'idle' | 'flying' | 'alert' | 'tired' | 'sleeping';

export type ProviderId = 'claude' | 'antigravity' | 'grok' | 'codex';

export interface ProviderUsage {
  id: ProviderId;
  name: string;
  subtitle: string;
  iconName: string;
  /** Only ever set from a real rate-limit header. `undefined` means "we genuinely don't know". */
  remainingPercent?: number; // 0 - 100
  status?: HealthStatus;
  /** Only ever set from a real rate-limit reset header. */
  resetTimerSeconds?: number;
  usedTokens?: number;
  maxTokens?: number;
  requestsLimit?: string;
  lastUpdated: string;
  /** True once a real API key has been verified live with the provider, or a local CLI session folder was found. */
  isAuthenticated?: boolean;
  /** How isAuthenticated was established. */
  authMethod?: 'api-key' | 'local-session' | 'none';
  /** True only when remainingPercent came from a real rate-limit header in the provider's response. */
  hasQuotaData?: boolean;
  /** True when remainingPercent is a placeholder/estimate rather than a verified live number. */
  isSimulated?: boolean;
  notes?: string;
}

export interface OverallSystemStatus {
  /** `null` when no provider reported a real quota number. */
  overallHealthScore: number | null;
  mascotState: MascotState;
  activeProvidersCount: number;
  exhaustedProvidersCount: number;
  nextResetSeconds: number | null;
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
