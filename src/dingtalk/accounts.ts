import type { ClawdbotConfig } from "../config/config.js";
import type { DmPolicy, GroupPolicy } from "../config/types.js";
import { DEFAULT_ACCOUNT_ID, normalizeAccountId } from "../routing/session-key.js";

export type DingTalkAccountConfig = {
  name?: string;
  enabled?: boolean;
  appKey?: string;
  appSecret?: string;
  agentId?: string;
  dmPolicy?: DmPolicy;
  allowFrom?: string[];
  groupAllowFrom?: string[];
  groupPolicy?: GroupPolicy;
  groups?: Record<
    string,
    {
      requireMention?: boolean;
      tools?: any;
      skills?: string[];
      enabled?: boolean;
      allowFrom?: string[];
      systemPrompt?: string;
    }
  >;
  messagePrefix?: string;
  historyLimit?: number;
  dmHistoryLimit?: number;
  textChunkLimit?: number;
  chunkMode?: "length" | "newline";
  blockStreaming?: boolean;
  streamMode?: "off" | "partial" | "block";
  mediaMaxMb?: number;
  markdown?: any;
  commands?: any;
  configWrites?: boolean;
  actions?: any;
  heartbeat?: any;
  retry?: any;
  dms?: Record<string, any>;
  draftChunk?: any;
  blockStreamingCoalesce?: any;
};

export type ResolvedDingTalkAccount = {
  accountId: string;
  name?: string;
  enabled: boolean;
  appKey?: string;
  appSecret?: string;
  agentId?: string;
  dmPolicy?: DmPolicy;
  allowFrom?: string[];
  groupAllowFrom?: string[];
  groupPolicy?: GroupPolicy;
  groups?: DingTalkAccountConfig["groups"];
  messagePrefix?: string;
  historyLimit?: number;
  dmHistoryLimit?: number;
  textChunkLimit?: number;
  chunkMode?: "length" | "newline";
  blockStreaming?: boolean;
  streamMode?: "off" | "partial" | "block";
  mediaMaxMb?: number;
  markdown?: DingTalkAccountConfig["markdown"];
  commands?: DingTalkAccountConfig["commands"];
  configWrites?: boolean;
  actions?: DingTalkAccountConfig["actions"];
  heartbeat?: DingTalkAccountConfig["heartbeat"];
  retry?: DingTalkAccountConfig["retry"];
  dms?: DingTalkAccountConfig["dms"];
  draftChunk?: DingTalkAccountConfig["draftChunk"];
  blockStreamingCoalesce?: DingTalkAccountConfig["blockStreamingCoalesce"];
};

function listConfiguredAccountIds(cfg: ClawdbotConfig): string[] {
  const dingtalkConfig = cfg.channels?.dingtalk;
  if (!dingtalkConfig || typeof dingtalkConfig !== "object") return [];
  const accounts = (dingtalkConfig as any).accounts;
  if (!accounts || typeof accounts !== "object") return [];
  if (Object.keys(dingtalkConfig).filter((k) => k !== "accounts").length > 0 && !accounts)
    return [DEFAULT_ACCOUNT_ID];
  const ids = new Set<string>();
  for (const key of Object.keys(accounts)) {
    if (!key) continue;
    ids.add(normalizeAccountId(key));
  }
  return [...ids];
}

export function listDingTalkAccountIds(cfg: ClawdbotConfig): string[] {
  const ids = listConfiguredAccountIds(cfg);
  if (ids.length === 0) return [DEFAULT_ACCOUNT_ID];
  return ids.sort((a, b) => a.localeCompare(b));
}

export function resolveDefaultDingTalkAccountId(cfg: ClawdbotConfig): string {
  const ids = listDingTalkAccountIds(cfg);
  if (ids.includes(DEFAULT_ACCOUNT_ID)) return DEFAULT_ACCOUNT_ID;
  return ids[0] ?? DEFAULT_ACCOUNT_ID;
}

function resolveAccountConfig(
  cfg: ClawdbotConfig,
  accountId: string,
): DingTalkAccountConfig | undefined {
  const dingtalkConfig = cfg.channels?.dingtalk;
  const accounts = (dingtalkConfig as any)?.accounts;
  if (!accounts || typeof accounts !== "object") return undefined;
  const direct = accounts[accountId] as DingTalkAccountConfig | undefined;
  if (direct) return direct;
  const normalized = normalizeAccountId(accountId);
  const matchKey = Object.keys(accounts).find((key) => normalizeAccountId(key) === normalized);
  return matchKey ? (accounts[matchKey] as DingTalkAccountConfig | undefined) : undefined;
}

function mergeDingTalkAccountConfig(cfg: ClawdbotConfig, accountId: string): DingTalkAccountConfig {
  const dingtalkConfig = cfg.channels?.dingtalk ?? {};
  const { accounts: _ignored, ...base } = dingtalkConfig as any;
  const account = resolveAccountConfig(cfg, accountId) ?? {};
  return { ...base, ...account };
}

export function resolveDingTalkAccount(params: {
  cfg: ClawdbotConfig;
  accountId?: string | null;
}): ResolvedDingTalkAccount {
  const hasExplicitAccountId = Boolean(params.accountId?.trim());
  const baseEnabled = (params.cfg.channels?.dingtalk as any)?.enabled !== false;

  const resolve = (accountId: string) => {
    const merged = mergeDingTalkAccountConfig(params.cfg, accountId);
    const accountEnabled = merged.enabled !== false;
    const effectiveEnabled = hasExplicitAccountId ? accountEnabled : baseEnabled && accountEnabled;

    return {
      accountId,
      name: merged.name?.trim() || undefined,
      enabled: effectiveEnabled,
      appKey: merged.appKey?.trim() || undefined,
      appSecret: merged.appSecret?.trim() || undefined,
      agentId: merged.agentId?.trim() || undefined,
      dmPolicy: merged.dmPolicy,
      allowFrom: merged.allowFrom,
      groupAllowFrom: merged.groupAllowFrom,
      groupPolicy: merged.groupPolicy,
      groups: merged.groups,
      messagePrefix: merged.messagePrefix ?? params.cfg.messages?.messagePrefix,
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

  const accountId = params.accountId?.trim() || resolveDefaultDingTalkAccountId(params.cfg);
  return resolve(accountId);
}
