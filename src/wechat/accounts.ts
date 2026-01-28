import type { ClawdbotConfig } from "../config/config.js";
import type { DmPolicy, GroupPolicy, WeChatAccountConfig } from "../config/types.js";
import { DEFAULT_ACCOUNT_ID, normalizeAccountId } from "../routing/session-key.js";

export type ResolvedWeChatAccount = {
  accountId: string;
  name?: string;
  enabled: boolean;
  botName?: string;
  puppet?: string;
  dmPolicy?: DmPolicy;
  allowFrom?: string[];
  groupAllowFrom?: string[];
  groupPolicy?: GroupPolicy;
  groups?: WeChatAccountConfig["groups"];
  messagePrefix?: string;
  historyLimit?: number;
  dmHistoryLimit?: number;
  textChunkLimit?: number;
  chunkMode?: "length" | "newline";
  blockStreaming?: boolean;
  streamMode?: "off" | "partial" | "block";
  mediaMaxMb?: number;
  markdown?: WeChatAccountConfig["markdown"];
  commands?: WeChatAccountConfig["commands"];
  configWrites?: boolean;
  actions?: WeChatAccountConfig["actions"];
  heartbeat?: WeChatAccountConfig["heartbeat"];
  retry?: WeChatAccountConfig["retry"];
  dms?: WeChatAccountConfig["dms"];
  draftChunk?: WeChatAccountConfig["draftChunk"];
  blockStreamingCoalesce?: WeChatAccountConfig["blockStreamingCoalesce"];
};

function listConfiguredAccountIds(cfg: ClawdbotConfig): string[] {
  const accounts = cfg.channels?.wechat?.accounts;
  if (!accounts || typeof accounts !== "object") return [];
  const ids = new Set<string>();
  for (const key of Object.keys(accounts)) {
    if (!key) continue;
    ids.add(normalizeAccountId(key));
  }
  return [...ids];
}

export function listWeChatAccountIds(cfg: ClawdbotConfig): string[] {
  const ids = listConfiguredAccountIds(cfg);
  if (ids.length === 0) return [DEFAULT_ACCOUNT_ID];
  return ids.sort((a, b) => a.localeCompare(b));
}

export function resolveDefaultWeChatAccountId(cfg: ClawdbotConfig): string {
  const ids = listWeChatAccountIds(cfg);
  if (ids.includes(DEFAULT_ACCOUNT_ID)) return DEFAULT_ACCOUNT_ID;
  return ids[0] ?? DEFAULT_ACCOUNT_ID;
}

function resolveAccountConfig(
  cfg: ClawdbotConfig,
  accountId: string,
): WeChatAccountConfig | undefined {
  const accounts = cfg.channels?.wechat?.accounts;
  if (!accounts || typeof accounts !== "object") return undefined;
  const direct = accounts[accountId] as WeChatAccountConfig | undefined;
  if (direct) return direct;
  const normalized = normalizeAccountId(accountId);
  const matchKey = Object.keys(accounts).find((key) => normalizeAccountId(key) === normalized);
  return matchKey ? (accounts[matchKey] as WeChatAccountConfig | undefined) : undefined;
}

function mergeWeChatAccountConfig(cfg: ClawdbotConfig, accountId: string): WeChatAccountConfig {
  const { accounts: _ignored, ...base } = (cfg.channels?.wechat ??
    {}) as WeChatAccountConfig & { accounts?: unknown };
  const account = resolveAccountConfig(cfg, accountId) ?? {};
  return { ...base, ...account };
}

export function resolveWeChatAccount(params: {
  cfg: ClawdbotConfig;
  accountId?: string | null;
}): ResolvedWeChatAccount {
  const hasExplicitAccountId = Boolean(params.accountId?.trim());
  const baseEnabled = params.cfg.channels?.wechat?.enabled !== false;

  const resolve = (accountId: string) => {
    const merged = mergeWeChatAccountConfig(params.cfg, accountId);
    const accountEnabled = merged.enabled !== false;
    const effectiveEnabled = hasExplicitAccountId ? accountEnabled : baseEnabled && accountEnabled;

    return {
      accountId,
      name: merged.name?.trim() || undefined,
      enabled: effectiveEnabled,
      botName: merged.botName?.trim() || undefined,
      puppet: merged.puppet?.trim() || undefined,
      dmPolicy: merged.dmPolicy,
      allowFrom: merged.allowFrom,
      groupAllowFrom: merged.groupAllowFrom,
      groupPolicy: merged.groupPolicy,
      groups: merged.groups,
      messagePrefix:
        merged.messagePrefix ?? params.cfg.messages?.messagePrefix,
      historyLimit: merged.historyLimit,
      dmHistoryLimit: merged.dmHistoryLimit,
      textChunkLimit: merged.textChunkLimit,
      chunkMode: merged.chunkMode,
      blockStreaming: merged.blockStreaming,
      streamMode: merged.streamMode,
      mediaMaxMb: merged.mediaMaxMb,
      markdown: merged.markdown,
      commands: merged.commands,
      configWrites: merged.configWrites,
      actions: merged.actions,
      heartbeat: merged.heartbeat,
      retry: merged.retry,
      dms: merged.dms,
      draftChunk: merged.draftChunk,
      blockStreamingCoalesce: merged.blockStreamingCoalesce,
    };
  };

  const accountId = params.accountId?.trim() || resolveDefaultWeChatAccountId(params.cfg);
  return resolve(accountId);
}
