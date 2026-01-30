import {
  applyAccountNameToChannelSection,
  buildChannelConfigSchema,
  emptyPluginConfigSchema,
  DEFAULT_ACCOUNT_ID,
  formatPairingApproveHint,
  getChatChannelMeta,
  migrateBaseNameToDefaultAccount,
  normalizeAccountId,
  resolveDingTalkGroupRequireMention,
  resolveDingTalkGroupToolPolicy,
  type ChannelMessageActionAdapter,
  type ChannelOutboundAdapter,
  type ChannelPlugin,
  type ResolvedDingTalkAccount,
  listDingTalkAccountIds,
  resolveDingTalkAccount,
  resolveDefaultDingTalkAccountId,
  normalizeDingTalkMessagingTarget,
  looksLikeDingTalkTargetId,
} from "clawdbot/plugin-sdk";

import { getDingTalkRuntime } from "./runtime.js";

const meta = getChatChannelMeta("dingtalk");

const dingtalkOutbound: ChannelOutboundAdapter = {
  deliveryMode: "gateway",
  chunker: (text, limit) => {
    if (!text) return [];
    if (limit <= 0 || text.length <= limit) return [text];
    const chunks: string[] = [];
    let remaining = text;
    while (remaining.length > limit) {
      const window = remaining.slice(0, limit);
      const lastNewline = window.lastIndexOf("\n");
      const lastSpace = window.lastIndexOf(" ");
      let breakIdx = lastNewline > 0 ? lastNewline : lastSpace;
      if (breakIdx <= 0) breakIdx = limit;
      const rawChunk = remaining.slice(0, breakIdx);
      const chunk = rawChunk.trimEnd();
      if (chunk.length > 0) chunks.push(chunk);
      const brokeOnSeparator = breakIdx < remaining.length && /\s/.test(remaining[breakIdx]);
      const nextStart = Math.min(remaining.length, breakIdx + (brokeOnSeparator ? 1 : 0));
      remaining = remaining.slice(nextStart).trimStart();
    }
    if (remaining.length) chunks.push(remaining);
    return chunks;
  },
  chunkerMode: "text",
  textChunkLimit: 2000,
  sendText: async ({ to, text, accountId }) => {
    const result = await getDingTalkRuntime().channel.dingtalk.sendMessageDingTalk(
      to,
      text,
      {
        verbose: true,
        accountId: accountId ?? undefined,
      }
    );
    return {
      channel: "dingtalk",
      ok: result.ok,
      messageId: result.messageId ?? "",
      error: result.error ? new Error(result.error) : undefined,
    };
  },
  sendMedia: async ({ to, text, mediaUrl, accountId }) => {
    const result = await getDingTalkRuntime().channel.dingtalk.sendMediaDingTalk(
      to,
      mediaUrl ?? "",
      {
        verbose: true,
        accountId: accountId ?? undefined,
        plainText: text,
      }
    );
    return {
      channel: "dingtalk",
      ok: result.ok,
      messageId: result.messageId ?? "",
      error: result.error ? new Error(result.error) : undefined,
    };
  },
};

const dingtalkMessageActions: ChannelMessageActionAdapter = {
  listActions: () => [],
  extractToolSend: () => null,
  handleAction: async () => ({ success: true }),
};

export const dingtalkPlugin: ChannelPlugin<ResolvedDingTalkAccount> = {
  id: "dingtalk",
  meta: {
    ...meta,
    quickstartAllowFrom: true,
    forceAccountBinding: true,
    preferSessionLookupForAnnounceTarget: true,
  },
  capabilities: {
    chatTypes: ["direct", "group"],
    reactions: false,
    media: true,
  },
  outbound: dingtalkOutbound,
  reload: { configPrefixes: ["channels.dingtalk"] },
  configSchema: buildChannelConfigSchema(DingTalkConfigSchema),
  config: {
    listAccountIds: listDingTalkAccountIds,
    resolveAccount: (cfg, accountId) => resolveDingTalkAccount({ cfg, accountId }),
    defaultAccountId: resolveDefaultDingTalkAccountId,
    setAccountEnabled: ({ cfg, accountId, enabled }) => {
      const accountKey = accountId || DEFAULT_ACCOUNT_ID;
      const accounts = { ...cfg.channels?.dingtalk?.accounts };
      const existing = accounts[accountKey] ?? {};
      return {
        ...cfg,
        channels: {
          ...cfg.channels,
          dingtalk: {
            ...cfg.channels?.dingtalk,
            accounts: {
              ...accounts,
              [accountKey]: {
                ...existing,
                enabled,
              },
            },
          },
        },
      };
    },
    deleteAccount: ({ cfg, accountId }) => {
      const accountKey = accountId || DEFAULT_ACCOUNT_ID;
      const accounts = { ...cfg.channels?.dingtalk?.accounts };
      delete accounts[accountKey];
      return {
        ...cfg,
        channels: {
          ...cfg.channels,
          dingtalk: {
            ...cfg.channels?.dingtalk,
            accounts: Object.keys(accounts).length ? accounts : undefined,
          },
        },
      };
    },
    isEnabled: (account) => account.enabled !== false,
    disabledReason: () => "disabled",
    isConfigured: async (account) => {
      return Boolean(account.appKey && account.appSecret);
    },
    unconfiguredReason: () => "not configured",
    describeAccount: (account) => ({
      accountId: account.accountId,
      name: account.name,
      enabled: account.enabled,
      configured: Boolean(account.appKey && account.appSecret),
      linked: Boolean(account.appKey && account.appSecret),
      dmPolicy: account.dmPolicy,
      allowFrom: account.allowFrom,
    }),
    resolveAllowFrom: ({ cfg, accountId }) => {
      const resolved = resolveDingTalkAccount({ cfg, accountId });
      return resolved.allowFrom ?? [];
    },
    formatAllowFrom: ({ allowFrom }) =>
      allowFrom
        .map((entry) => String(entry).trim())
        .filter((entry): entry is string => Boolean(entry))
        .map((entry) => (entry === "*" ? entry : entry.trim()))
        .filter((entry): entry is string => Boolean(entry)),
  },
  security: {
    resolveDmPolicy: ({ cfg, accountId, account }) => {
      const resolvedAccountId = accountId ?? account.accountId ?? DEFAULT_ACCOUNT_ID;
      const useAccountPath = Boolean(cfg.channels?.dingtalk?.accounts?.[resolvedAccountId]);
      const basePath = useAccountPath
        ? `channels.dingtalk.accounts.${resolvedAccountId}.`
        : "channels.dingtalk.";
      return {
        policy: account.dmPolicy ?? "pairing",
        allowFrom: account.allowFrom ?? [],
        policyPath: `${basePath}dmPolicy`,
        allowFromPath: basePath,
        approveHint: formatPairingApproveHint("dingtalk"),
        normalizeEntry: (raw) => String(raw).trim(),
      };
    },
    collectWarnings: ({ account, cfg }) => {
      const defaultGroupPolicy = cfg.channels?.defaults?.groupPolicy;
      const groupPolicy = account.groupPolicy ?? defaultGroupPolicy ?? "allowlist";
      if (groupPolicy !== "open") return [];
      const groupAllowlistConfigured =
        Boolean(account.groups) && Object.keys(account.groups ?? {}).length > 0;
      if (groupAllowlistConfigured) {
        return [
          `- DingTalk groups: groupPolicy="open" allows any member in allowed groups to trigger (mention-gated). Set channels.dingtalk.groupPolicy="allowlist" + channels.dingtalk.groupAllowFrom to restrict senders.`,
        ];
      }
      return [
        `- DingTalk groups: groupPolicy="open" with no channels.dingtalk.groups allowlist; any group can add + ping (mention-gated). Set channels.dingtalk.groupPolicy="allowlist" + channels.dingtalk.groupAllowFrom or configure channels.dingtalk.groups.`,
      ];
    },
  },
  setup: {
    resolveAccountId: ({ accountId }) => normalizeAccountId(accountId),
    applyAccountName: ({ cfg, accountId, name }) =>
      applyAccountNameToChannelSection({
        cfg,
        channelKey: "dingtalk",
        accountId,
        name,
        alwaysUseAccounts: true,
      }),
    applyAccountConfig: ({ cfg, accountId, input }) => {
      const namedConfig = applyAccountNameToChannelSection({
        cfg,
        channelKey: "dingtalk",
        accountId,
        name: input.name,
        alwaysUseAccounts: true,
      });
      const next = migrateBaseNameToDefaultAccount({
        cfg: namedConfig,
        channelKey: "dingtalk",
        alwaysUseAccounts: true,
      });
      const entry = {
        ...next.channels?.dingtalk?.accounts?.[accountId],
        ...(input.appKey ? { appKey: input.appKey } : {}),
        ...(input.appSecret ? { appSecret: input.appSecret } : {}),
        ...(input.agentId ? { agentId: input.agentId } : {}),
        enabled: true,
      };
      return {
        ...next,
        channels: {
          ...next.channels,
          dingtalk: {
            ...next.channels?.dingtalk,
            accounts: {
              ...next.channels?.dingtalk?.accounts,
              [accountId]: entry,
            },
          },
        },
      };
    },
  },
  groups: {
    resolveRequireMention: resolveDingTalkGroupRequireMention,
    resolveToolPolicy: resolveDingTalkGroupToolPolicy,
  },
  messaging: {
    normalizeTarget: (raw) => normalizeDingTalkMessagingTarget(raw) ?? String(raw).trim(),
    targetResolver: {
      looksLikeId: looksLikeDingTalkTargetId,
      hint: "<conversationId>",
    },
  },
  directory: {
    self: async ({ cfg, accountId }) => {
      const account = resolveDingTalkAccount({ cfg, accountId });
      if (!account?.agentId) return null;
      return {
        id: account.agentId,
        name: account.name ?? "DingTalk Bot",
        kind: "user",
      };
    },
    listPeers: async () => [],
    listGroups: async () => [],
  },
  actions: dingtalkMessageActions,
  agentTools: async () => {
    return [
      await getDingTalkRuntime().channel.dingtalk.createLoginTool(),
      await getDingTalkRuntime().channel.dingtalk.createConfigureTool(),
    ];
  },
};
