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

interface ApiKeyCheckResult {
  valid: boolean;
  statusCode: number;
  rateLimitRemaining: number | null;
  rateLimitLimit: number | null;
  rateLimitResetSeconds: number | null;
  detail: string;
}

const PROVIDER_LABEL: Record<ProviderId, string> = {
  claude: 'Anthropic',
  antigravity: 'Google Gemini',
  grok: 'xAI',
  codex: 'OpenAI',
};

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
   * Makes one real, lightweight request to the provider with the given key (Rust side,
   * so it isn't blocked by browser CORS) and reports whether the key actually works —
   * plus any real rate-limit numbers the provider's response happens to include.
   */
  private static async verifyApiKey(id: ProviderId, key: string): Promise<ApiKeyCheckResult> {
    try {
      const result = await invoke<{
        valid: boolean;
        status_code: number;
        rate_limit_remaining: number | null;
        rate_limit_limit: number | null;
        rate_limit_reset_seconds: number | null;
        detail: string;
      }>('verify_api_key', { provider: id, apiKey: key });
      return {
        valid: result.valid,
        statusCode: result.status_code,
        rateLimitRemaining: result.rate_limit_remaining,
        rateLimitLimit: result.rate_limit_limit,
        rateLimitResetSeconds: result.rate_limit_reset_seconds,
        detail: result.detail,
      };
    } catch (e) {
      return {
        valid: false,
        statusCode: 0,
        rateLimitRemaining: null,
        rateLimitLimit: null,
        rateLimitResetSeconds: null,
        detail: `Could not reach ${PROVIDER_LABEL[id]} from this build (${String(e)}).`,
      };
    }
  }

  /**
   * Determines real auth status for a provider and returns updated telemetry.
   * A key is only ever marked authenticated after a live network call to the provider
   * actually succeeds. A percentage is only ever shown when the provider's response
   * included a real rate-limit header — otherwise no quota number is displayed at all.
   */
  public static async fetchProviderMetrics(
    id: ProviderId,
    config: TelemetryConfig,
    currentUsage: ProviderUsage
  ): Promise<ProviderUsage> {
    const rawKey = (config.apiKeys[id] || '').trim();
    const hasKeyFormat = rawKey.length > 0 && this.isValidApiKeyFormat(id, rawKey);

    if (hasKeyFormat) {
      const check = await this.verifyApiKey(id, rawKey);

      if (!check.valid) {
        return {
          ...currentUsage,
          remainingPercent: undefined,
          status: undefined,
          resetTimerSeconds: undefined,
          isAuthenticated: false,
          authMethod: 'none',
          hasQuotaData: false,
          isSimulated: false,
          lastUpdated: 'Key rejected',
          notes: check.detail,
        };
      }

      const hasQuota = check.rateLimitRemaining !== null && check.rateLimitLimit !== null && check.rateLimitLimit > 0;
      // No fallback to any previous/seed value: if the provider didn't return a real
      // rate-limit header, these stay undefined and the UI shows no number at all.
      const remainingPercent = hasQuota
        ? Math.round((check.rateLimitRemaining! / check.rateLimitLimit!) * 100)
        : undefined;

      return {
        ...currentUsage,
        remainingPercent,
        status: hasQuota ? this.getHealthStatus(remainingPercent!) : undefined,
        resetTimerSeconds: check.rateLimitResetSeconds ?? undefined,
        isAuthenticated: true,
        authMethod: 'api-key',
        hasQuotaData: hasQuota,
        isSimulated: false,
        lastUpdated: 'Just now (live)',
        notes: hasQuota
          ? `Live rate limit from ${PROVIDER_LABEL[id]}: ${check.rateLimitRemaining}/${check.rateLimitLimit} requests remaining.`
          : `API key verified live with ${PROVIDER_LABEL[id]} — this provider's API does not expose a quota-remaining header, so no percentage is shown.`,
      };
    }

    // Finding a config folder only proves the tool is installed — it carries no readable
    // quota. Such providers are reported as NOT authenticated so they stay out of the
    // monitored list entirely; the flag is kept purely so the UI can say "installed".
    const session = await this.detectLocalSession(id);
    if (session.exists && session.entries > 0) {
      return {
        ...currentUsage,
        remainingPercent: undefined,
        status: undefined,
        resetTimerSeconds: undefined,
        isAuthenticated: false,
        authMethod: 'local-session',
        hasQuotaData: false,
        isSimulated: false,
        lastUpdated: 'Installed, no quota data',
        notes: `Installed on this machine (${session.path}), but it exposes no readable quota. Add an API key to monitor it.`,
      };
    }

    return {
      ...currentUsage,
      remainingPercent: undefined,
      status: undefined,
      resetTimerSeconds: undefined,
      isAuthenticated: false,
      authMethod: 'none',
      hasQuotaData: false,
      isSimulated: false,
      lastUpdated: 'Not connected',
      notes: 'No local session folder found and no API key configured.',
    };
  }
}
