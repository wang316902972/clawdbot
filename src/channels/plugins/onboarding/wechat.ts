import type { ClawdbotConfig } from "../../../config/config.js";
import type { DmPolicy } from "../../../config/types.js";
import { DEFAULT_ACCOUNT_ID, normalizeAccountId } from "../../../routing/session-key.js";
import { formatDocsLink } from "../../../terminal/links.js";
import {
  listWeChatAccountIds,
  resolveDefaultWeChatAccountId,
} from "../../../wechat/accounts.js";
import type { WizardPrompter } from "../../../wizard/prompts.js";
import type { ChannelOnboardingAdapter } from "../onboarding-types.js";
import { promptAccountId } from "./helpers.js";

const channel = "wechat" as const;

function setWeChatDmPolicy(cfg: ClawdbotConfig, dmPolicy: DmPolicy): ClawdbotConfig {
  return {
    ...cfg,
    channels: {
      ...cfg.channels,
      wechat: {
        ...cfg.channels?.wechat,
        dmPolicy,
      },
    },
  };
}

function setWeChatAllowFrom(cfg: ClawdbotConfig, allowFrom?: string[]): ClawdbotConfig {
  return {
    ...cfg,
    channels: {
      ...cfg.channels,
      wechat: {
        ...cfg.channels?.wechat,
        allowFrom,
      },
    },
  };
}

async function promptWeChatAllowFrom(
  cfg: ClawdbotConfig,
  _runtime: unknown,
  prompter: WizardPrompter,
): Promise<ClawdbotConfig> {
  const existingPolicy = cfg.channels?.wechat?.dmPolicy ?? "pairing";
  const existingAllowFrom = cfg.channels?.wechat?.allowFrom ?? [];
  const existingLabel = existingAllowFrom.length > 0 ? existingAllowFrom.join(", ") : "unset";

  await prompter.note(
    [
      "WeChat direct chats are gated by `channels.wechat.dmPolicy` + `channels.wechat.allowFrom`.",
      "- pairing (default): unknown senders get a pairing code; owner approves",
      "- allowlist: unknown senders are blocked",
      '- open: public inbound DMs (requires allowFrom to include "*")',
      "- disabled: ignore WeChat DMs",
      "",
      `Current: dmPolicy=${existingPolicy}, allowFrom=${existingLabel}`,
      `Docs: ${formatDocsLink("/wechat", "wechat")}`,
    ].join("\n"),
    "WeChat DM access",
  );

  const policy = (await prompter.select({
    message: "WeChat DM policy",
    options: [
      { value: "pairing", label: "Pairing (recommended)" },
      { value: "allowlist", label: "Allowlist only (block unknown senders)" },
      { value: "open", label: "Open (public inbound DMs)" },
      { value: "disabled", label: "Disabled (ignore WeChat DMs)" },
    ],
  })) as DmPolicy;

  let next = setWeChatDmPolicy(cfg, policy);
  if (policy === "open") {
    next = setWeChatAllowFrom(next, ["*"]);
  }
  if (policy === "disabled") return next;

  const allowOptions =
    existingAllowFrom.length > 0
      ? ([
          { value: "keep", label: "Keep current allowFrom" },
          {
            value: "unset",
            label: "Unset allowFrom (use pairing approvals only)",
          },
          { value: "list", label: "Set allowFrom to specific WeChat IDs" },
        ] as const)
      : ([
          { value: "unset", label: "Unset allowFrom (default)" },
          { value: "list", label: "Set allowFrom to specific WeChat IDs" },
        ] as const);

  const mode = (await prompter.select({
    message: "WeChat allowFrom (optional pre-allowlist)",
    options: allowOptions.map((opt) => ({
      value: opt.value,
      label: opt.label,
    })),
  })) as (typeof allowOptions)[number]["value"];

  if (mode === "keep") {
    // Keep allowFrom as-is.
  } else if (mode === "unset") {
    next = setWeChatAllowFrom(next, undefined);
  } else {
    const allowRaw = await prompter.text({
      message: "Allowed sender WeChat IDs (comma-separated)",
      placeholder: "wxid_abc123def456, username_ghi789",
      validate: (value) => {
        const raw = String(value ?? "").trim();
        if (!raw) return "Required";
        const parts = raw
          .split(/[\n,;]+/g)
          .map((p) => p.trim())
          .filter(Boolean);
        if (parts.length === 0) return "Required";
        for (const part of parts) {
          if (part === "*") continue;
          if (!part) return `Invalid WeChat ID: ${part}`;
        }
        return undefined;
      },
    });

    const parts = String(allowRaw)
      .split(/[\n,;]+/g)
      .map((p) => p.trim())
      .filter(Boolean);
    const unique = [...new Set(parts)];
    next = setWeChatAllowFrom(next, unique);
  }

  return next;
}

export const wechatOnboardingAdapter: ChannelOnboardingAdapter = {
  channel,
  getStatus: async ({ cfg, accountOverrides }) => {
    const overrideId = accountOverrides.wechat?.trim();
    const defaultAccountId = resolveDefaultWeChatAccountId(cfg);
    const accountId = overrideId ? normalizeAccountId(overrideId) : defaultAccountId;
    // TODO: Detect if WeChat bot is logged in via runtime check
    const linked = false; // Will be detected via plugin runtime
    const accountLabel = accountId === DEFAULT_ACCOUNT_ID ? "default" : accountId;
    return {
      channel,
      configured: linked,
      statusLines: [`WeChat (${accountLabel}): ${linked ? "linked" : "not linked"}`],
      selectionHint: linked ? "linked" : "not linked",
      quickstartScore: linked ? 5 : 4,
    };
  },
  configure: async ({
    cfg,
    prompter,
    accountOverrides,
    shouldPromptAccountIds,
  }) => {
    const overrideId = accountOverrides.wechat?.trim();
    let accountId = overrideId
      ? normalizeAccountId(overrideId)
      : resolveDefaultWeChatAccountId(cfg);
    if (shouldPromptAccountIds) {
      if (!overrideId) {
        accountId = await promptAccountId({
          cfg,
          prompter,
          label: "WeChat",
          currentId: accountId,
          listAccountIds: listWeChatAccountIds,
          defaultAccountId: resolveDefaultWeChatAccountId(cfg),
        });
      }
    }

    let next = cfg;
    if (accountId !== DEFAULT_ACCOUNT_ID) {
      next = {
        ...next,
        channels: {
          ...next.channels,
          wechat: {
            ...next.channels?.wechat,
            accounts: {
              ...next.channels?.wechat?.accounts,
              [accountId]: {
                ...next.channels?.wechat?.accounts?.[accountId],
                enabled: next.channels?.wechat?.accounts?.[accountId]?.enabled ?? true,
              },
            },
          },
        },
      };
    }

    next = await promptWeChatAllowFrom(next, null, prompter);

    return { cfg: next, accountId };
  },
  onAccountRecorded: (_accountId, _options) => {
    // WeChat-specific account recording hooks
  },
};
