import { invoke } from '@tauri-apps/api/core';
import { ProviderUsage, ProviderId, HealthStatus } from '../types';

export interface TelemetryConfig {
  apiKeys: Record<ProviderId, string>;
  customPaths: Record<ProviderId, string>;
}

interface LocalSessionInfo {
  exists: boolean;
  path: string;
  entries: number;
}

/** Real key-format prefixes published by each provider — used to validate, never to call out. */
const API_KEY_PATTERNS: Record<ProviderId, RegExp> = {
  claude: /^sk-ant-/,
  antigravity: /^AIzaSy/,
  grok: /^xai-/,
  codex: /^sk-proj-/,
};

export class ProviderTelemetryService {
  public static getHealthStatus(percent: number): HealthStatus {
    if (percent < 10) return 'exhausted';
    if (percent < 30) return 'critical';
    if (percent <= 70) return 'warning';
    return 'healthy';
  }

  public static isValidApiKeyFormat(id: ProviderId, key: string): boolean {
    const pattern = API_KEY_PATTERNS[id];
    return Boolean(pattern && pattern.test(key.trim()));
  }

  /**
   * Asks the Rust side whether this provider's local CLI/IDE session folder actually
   * exists on disk. Returns "not detected" (never throws) when running outside the
   * Tauri shell, e.g. `npm run dev` in a plain browser tab.
   */
  private static async detectLocalSession(id: ProviderId): Promise<LocalSessionInfo> {
    try {
      return await invoke<LocalSessionInfo>('detect_local_session', { provider: id });
    } catch {
      return { exists: false, path: '', entries: 0 };
    }
  }

  /**
   * Determines real auth status for a provider and returns updated telemetry.
   * Nothing here is randomly generated: a provider is only ever marked authenticated
   * when a correctly-formatted API key was entered or a non-empty local session
   * folder was found. Since none of these tools expose a public quota-remaining API,
   * the percentage shown is always labeled as an estimate (isSimulated: true) rather
   * than presented as a verified live number.
   */
  public static async fetchProviderMetrics(
    id: ProviderId,
    config: TelemetryConfig,
    currentUsage: ProviderUsage
  ): Promise<ProviderUsage> {
    const rawKey = (config.apiKeys[id] || '').trim();
    const hasValidKey = rawKey.length > 0 && this.isValidApiKeyFormat(id, rawKey);

    if (hasValidKey) {
      const remainingPercent = Math.min(100, Math.max(0, currentUsage.remainingPercent));
      return {
        ...currentUsage,
        remainingPercent,
        status: this.getHealthStatus(remainingPercent),
        isAuthenticated: true,
        isSimulated: true,
        lastUpdated: 'Just now (estimated)',
        notes: `API key format verified (${rawKey.substring(0, 7)}...). No public quota API exists for this provider, so usage is an estimate.`,
      };
    }

    const session = await this.detectLocalSession(id);
    if (session.exists && session.entries > 0) {
      const remainingPercent = Math.min(100, Math.max(0, currentUsage.remainingPercent));
      return {
        ...currentUsage,
        remainingPercent,
        status: this.getHealthStatus(remainingPercent),
        isAuthenticated: true,
        isSimulated: true,
        lastUpdated: 'Just now (estimated)',
        notes: `Local session folder detected at ${session.path}. No public quota API exists for this provider, so usage is an estimate.`,
      };
    }

    return {
      ...currentUsage,
      isAuthenticated: false,
      isSimulated: true,
      lastUpdated: 'Not connected',
      notes: 'No local session folder found and no API key configured.',
    };
  }
}
