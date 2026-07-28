import { invoke } from '@tauri-apps/api/core';
import {
  MascotState,
  ProviderId,
  ProviderMeta,
  ProviderSnapshot,
  StatuslineStatus,
  UsageWindow,
} from '../types';

/** A reading older than this is shown with an "as of" stamp instead of as current. */
export const STALE_AFTER_SECONDS = 15 * 60;

export const PROVIDERS: ProviderMeta[] = [
  { id: 'claude', name: 'Claude Code', subtitle: '5-hour & weekly subscription limits' },
  { id: 'grok', name: 'xAI Grok', subtitle: 'Grok CLI account limits' },
  { id: 'codex', name: 'OpenAI Codex', subtitle: 'Codex CLI account limits' },
  { id: 'gemini', name: 'Gemini CLI', subtitle: 'Gemini CLI account quota' },
  { id: 'antigravity', name: 'Antigravity', subtitle: 'Antigravity IDE' },
  { id: 'copilot', name: 'GitHub Copilot', subtitle: 'Copilot usage' },
];

export const SOURCE_LABELS: Record<string, string> = {
  official: 'Official',
  unofficial: 'Unofficial source',
  unverified: 'Unverified',
  unavailable: 'Not available',
};

export class ProviderService {
  /**
   * Asks Rust for a provider's real usage windows. Returns an `unavailable` snapshot
   * (never a fabricated number) if anything goes wrong, including running outside Tauri.
   */
  static async fetchSnapshot(id: ProviderId): Promise<ProviderSnapshot> {
    try {
      return await invoke<ProviderSnapshot>('fetch_provider_snapshot', { provider: id });
    } catch (e) {
      return {
        provider: id,
        windows: [],
        source_kind: 'unavailable',
        captured_at: Math.floor(Date.now() / 1000),
        note: `Could not read this provider from the desktop backend (${String(e)}).`,
      };
    }
  }

  static async fetchAll(): Promise<Record<ProviderId, ProviderSnapshot>> {
    const entries = await Promise.all(
      PROVIDERS.map(async (p) => [p.id, await this.fetchSnapshot(p.id)] as const)
    );
    return Object.fromEntries(entries) as Record<ProviderId, ProviderSnapshot>;
  }

  static async statuslineStatus(): Promise<StatuslineStatus | null> {
    try {
      return await invoke<StatuslineStatus>('statusline_status');
    } catch {
      return null;
    }
  }

  static async installStatusline(): Promise<StatuslineStatus> {
    return await invoke<StatuslineStatus>('install_statusline');
  }

  static async uninstallStatusline(): Promise<StatuslineStatus> {
    return await invoke<StatuslineStatus>('uninstall_statusline');
  }
}

export function isStale(snapshot: ProviderSnapshot, nowSeconds: number): boolean {
  return nowSeconds - snapshot.captured_at > STALE_AFTER_SECONDS;
}

/** True when this provider produced at least one real, currently-valid number. */
export function hasLiveData(snapshot: ProviderSnapshot): boolean {
  return snapshot.source_kind !== 'unavailable' && snapshot.windows.length > 0;
}

/** Seconds until a window resets, or null when the source didn't say. */
export function secondsUntilReset(window: UsageWindow, nowSeconds: number): number | null {
  if (window.resets_at === null) return null;
  return Math.max(0, window.resets_at - nowSeconds);
}

/**
 * The mascot reflects the tightest real constraint across every connected provider.
 * With no measured data at all it stays `idle` rather than implying everything is fine.
 */
export function deriveMascotState(
  snapshots: ProviderSnapshot[],
  nowSeconds: number
): { state: MascotState; worstUsedPercent: number | null } {
  const used = snapshots
    .filter((s) => hasLiveData(s) && !isStale(s, nowSeconds))
    .flatMap((s) => s.windows.map((w) => w.used_percent));

  if (used.length === 0) return { state: 'idle', worstUsedPercent: null };

  const worst = Math.max(...used);
  if (worst >= 90) return { state: 'sleeping', worstUsedPercent: worst };
  if (worst >= 70) return { state: 'tired', worstUsedPercent: worst };
  if (worst >= 30) return { state: 'alert', worstUsedPercent: worst };
  return { state: 'flying', worstUsedPercent: worst };
}
