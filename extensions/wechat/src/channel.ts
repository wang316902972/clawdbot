import {
  applyAccountNameToChannelSection,
  buildChannelConfigSchema,
  DEFAULT_ACCOUNT_ID,
  formatPairingApproveHint,
  getChatChannelMeta,
  listWeChatAccountIds,
  migrateBaseNameToDefaultAccount,
  normalizeAccountId,
  normalizeWeChatTarget,
  resolveDefaultWeChatAccountId,
  resolveWeChatAccount,
  resolveWeChatGroupRequireMention,
  resolveWeChatGroupToolPolicy,
  wechatOnboardingAdapter,
  WeChatConfigSchema,
  type ChannelMessageActionAdapter,
  type ChannelPlugin,
  type ResolvedWeChatAccount,
} from "clawdbot/plugin-sdk";

import { getWeChatRuntime } from "./runtime.js";

const meta = getChatChannelMeta("wechat");

const wechatMessageActions: ChannelMessageActionAdapter = {
  listActions: (ctx) => getWeChatRuntime().channel.wechat.messageActions.listActions(ctx),
  extractToolSend: (ctx) =>
    getWeChatRuntime().channel.wechat.messageActions.extractToolSend(ctx),
  handleAction: async (ctx) =>
    await getWeChatRuntime().channel.wechat.messageActions.handleAction(ctx),
};

export const wechatPlugin: ChannelPlugin<ResolvedWeChatAccount> = {
  id: "wechat",
  meta: {
    ...meta,
    quickstartAllowFrom: true,
    forceAccountBinding: true,
    preferSessionLookupForAnnounceTarget: true,
  },
  onboarding: wechatOnboardingAdapter,
  agentTools: () => [getWeChatRuntime().channel.wechat.createLoginTool()],
  pairing: {
    idLabel: "wechatUserId",
  },
  capabilities: {
    chatTypes: ["direct", "group"],
    reactions: false,
    media: true,
  },
  reload: { configPrefixes: ["channels.wechat"] },
  configSchema: buildChannelConfigSchema(WeChatConfigSchema),
  config: {
    listAccountIds: (cfg) => listWeChatAccountIds(cfg),
    resolveAccount: (cfg, accountId) => resolveWeChatAccount({ cfg, accountId }),
    defaultAccountId: (cfg) => resolveDefaultWeChatAccountId(cfg),
    setAccountEnabled: ({ cfg, accountId, enabled }) => {
      const accountKey = accountId || DEFAULT_ACCOUNT_ID;
      const accounts = { ...cfg.channels?.wechat?.accounts };
      const existing = accounts[accountKey] ?? {};
      return {
        ...cfg,
        channels: {
          ...cfg.channels,
          wechat: {
            ...cfg.channels?.wechat,
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
      const accounts = { ...cfg.channels?.wechat?.accounts };
      delete accounts[accountKey];
      return {
        ...cfg,
        channels: {
          ...cfg.channels,
          wechat: {
            ...cfg.channels?.wechat,
            accounts: Object.keys(accounts).length ? accounts : undefined,
          },
        },
      };
    },
    isEnabled: (account) => account.enabled !== false,
    disabledReason: () => "disabled",
    isConfigured: async (account) => {
      // Check if WeChat bot is logged in
      return await getWeChatRuntime().channel.wechat.isLoggedIn(account);
    },
    unconfiguredReason: () => "not logged in",
    describeAccount: (account) => ({
      accountId: account.accountId,
      name: account.name,
      enabled: account.enabled,
      configured: Boolean(account.botName),
      linked: Boolean(account.botName),
      dmPolicy: account.dmPolicy,
      allowFrom: account.allowFrom,
    }),
    resolveAllowFrom: ({ cfg, accountId }) =>
      resolveWeChatAccount({ cfg, accountId }).allowFrom ?? [],
    formatAllowFrom: ({ allowFrom }) =>
      allowFrom
        .map((entry) => String(entry).trim())
        .filter((entry): entry is string => Boolean(entry))
        .map((entry) => (entry === "*" ? entry : normalizeWeChatTarget(entry)))
        .filter((entry): entry is string => Boolean(entry)),
  },
  security: {
    resolveDmPolicy: ({ cfg, accountId, account }) => {
      const resolvedAccountId = accountId ?? account.accountId ?? DEFAULT_ACCOUNT_ID;
      const useAccountPath = Boolean(cfg.channels?.wechat?.accounts?.[resolvedAccountId]);
      const basePath = useAccountPath
        ? `channels.wechat.accounts.${resolvedAccountId}.`
        : "channels.wechat.";
      return {
        policy: account.dmPolicy ?? "pairing",
        allowFrom: account.allowFrom ?? [],
        policyPath: `${basePath}dmPolicy`,
        allowFromPath: basePath,
        approveHint: formatPairingApproveHint("wechat"),
        normalizeEntry: (raw) => normalizeWeChatTarget(raw),
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
          `- WeChat groups: groupPolicy="open" allows any member in allowed groups to trigger (mention-gated). Set channels.wechat.groupPolicy="allowlist" + channels.wechat.groupAllowFrom to restrict senders.`,
        ];
      }
      return [
        `- WeChat groups: groupPolicy="open" with no channels.wechat.groups allowlist; any group can add + ping (mention-gated). Set channels.wechat.groupPolicy="allowlist" + channels.wechat.groupAllowFrom or configure channels.wechat.groups.`,
      ];
    },
  },
  setup: {
    resolveAccountId: ({ accountId }) => normalizeAccountId(accountId),
    applyAccountName: ({ cfg, accountId, name }) =>
      applyAccountNameToChannelSection({
        cfg,
        channelKey: "wechat",
        accountId,
        name,
        alwaysUseAccounts: true,
      }),
    applyAccountConfig: ({ cfg, accountId, input }) => {
      const namedConfig = applyAccountNameToChannelSection({
        cfg,
        channelKey: "wechat",
        accountId,
        name: input.name,
        alwaysUseAccounts: true,
      });
      const next = migrateBaseNameToDefaultAccount({
        cfg: namedConfig,
        channelKey: "wechat",
        alwaysUseAccounts: true,
      });
      const entry = {
        ...next.channels?.wechat?.accounts?.[accountId],
        ...(input.botName ? { botName: input.botName } : {}),
        ...(input.puppet ? { puppet: input.puppet } : {}),
        enabled: true,
      };
      return {
        ...next,
        channels: {
          ...next.channels,
          wechat: {
            ...next.channels?.wechat,
            accounts: {
              ...next.channels?.wechat?.accounts,
              [accountId]: entry,
            },
          },
        },
      };
    },
  },
  groups: {
    resolveRequireMention: resolveWeChatGroupRequireMention,
    resolveToolPolicy: resolveWeChatGroupToolPolicy,
  },
  messaging: {
    normalizeTarget: normalizeWeChatTarget,
    targetResolver: {
      looksLikeId: (value: string) => {
        // WeChat IDs can be wx_ alphanumeric strings or usernames
        return /^(wx_[a-zA-Z0-9]+|[a-zA-Z0-9_-]+)$/.test(value);
      },
      hint: "<wechatId>",
    },
  },
  directory: {
    self: async (account) => {
      const bot = getWeChatRuntime().channel.wechat.getBot(account);
      if (!bot) return null;
      return {
        id: bot.userId,
        name: bot.name(),
        kind: "user",
      };
    },
    listPeers: async (params) => {
      return getWeChatRuntime().channel.wechat.listContacts(params);
    },
    listGroups: async (params) => {
      return getWeChatRuntime().channel.wechat.listGroups(params);
    },
  },
  actions: wechatMessageActions,
};
