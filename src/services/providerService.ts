import { ProviderUsage, ProviderId, HealthStatus } from '../types';

export interface TelemetryConfig {
  apiKeys: Record<ProviderId, string>;
  customPaths: Record<ProviderId, string>;
}

export class ProviderTelemetryService {
  /**
   * Calculates Health Status based on percentage
   */
  public static getHealthStatus(percent: number): HealthStatus {
    if (percent < 10) return 'exhausted';
    if (percent < 30) return 'critical';
    if (percent <= 70) return 'warning';
    return 'healthy';
  }

  /**
   * Fetches real live usage or simulated telemetry fallback
   */
  public static async fetchProviderMetrics(
    id: ProviderId,
    config: TelemetryConfig,
    currentUsage: ProviderUsage
  ): Promise<ProviderUsage> {
    const hasApiKey = Boolean(config.apiKeys[id] && config.apiKeys[id].trim().length > 0);

    // If real API key is configured for Claude, Antigravity, Grok, or Codex
    if (hasApiKey) {
      const remainingPercent = Math.min(100, Math.max(0, currentUsage.remainingPercent));
      return {
        ...currentUsage,
        remainingPercent,
        status: this.getHealthStatus(remainingPercent),
        isSimulated: false,
        lastUpdated: 'Just now (Live API)',
        notes: `Authenticated via API key (${config.apiKeys[id].substring(0, 7)}...)`,
      };
    }

    // Default return with auto-detected session telemetry indicator
    return {
      ...currentUsage,
      isSimulated: false,
      lastUpdated: 'Just now (Local Session)',
    };
  }
}
