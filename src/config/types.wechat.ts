import type {
  BlockStreamingChunkConfig,
  BlockStreamingCoalesceConfig,
  DmPolicy,
  GroupPolicy,
  MarkdownConfig,
  OutboundRetryConfig,
} from "./types.base.js";
import type { ChannelHeartbeatVisibilityConfig } from "./types.channels.js";
import type { DmConfig, ProviderCommandsConfig } from "./types.messages.js";
import type { GroupToolPolicyConfig } from "./types.tools.js";

export type WeChatActionConfig = {
  sendMessage?: boolean;
  deleteMessage?: boolean;
};

export type WeChatAccountConfig = {
  /** Optional display name for this account (used in CLI/UI lists). */
  name?: string;
  /** Markdown formatting overrides. */
  markdown?: MarkdownConfig;
  /** Override native command registration for WeChat (bool or "auto"). */
  commands?: ProviderCommandsConfig;
  /** Allow channel-initiated config writes (default: true). */
  configWrites?: boolean;
  /**
   * Controls how WeChat direct chats (DMs) are handled:
   * - "pairing" (default): unknown senders get a pairing code; owner must approve
   * - "allowlist": only allow senders in allowFrom (or paired allow store)
   * - "open": allow all inbound DMs (requires allowFrom to include "*")
   * - "disabled": ignore all inbound DMs
   */
  dmPolicy?: DmPolicy;
  /** If false, do not start this WeChat account. Default: true. */
  enabled?: boolean;
  /** Bot name (displayed in WeChat). */
  botName?: string;
  /** WeChat puppet type (e.g., "wechaty-puppet-wechat", "wechaty-puppet-mock"). */
  puppet?: string;
  groups?: Record<string, WeChatGroupConfig>;
  allowFrom?: Array<string>;
  /** Optional allowlist for WeChat group senders (wxid or usernames). */
  groupAllowFrom?: Array<string>;
  /**
   * Controls how group messages are handled:
   * - "open": groups bypass allowFrom, only mention-gating applies
   * - "disabled": block all group messages entirely
   * - "allowlist": only allow group messages from senders in groupAllowFrom/allowFrom
   */
  groupPolicy?: GroupPolicy;
  /** Max group messages to keep as history context (0 disables). */
  historyLimit?: number;
  /** Max DM turns to keep as history context. */
  dmHistoryLimit?: number;
  /** Per-DM config overrides keyed by user ID. */
  dms?: Record<string, DmConfig>;
  /** Outbound text chunk size (chars). Default: 2000. */
  textChunkLimit?: number;
  /** Chunking mode: "length" (default) splits by size; "newline" splits on every newline. */
  chunkMode?: "length" | "newline";
  /** Disable block streaming for this account. */
  blockStreaming?: boolean;
  /** Chunking config for draft streaming in `streamMode: "block"`. */
  draftChunk?: BlockStreamingChunkConfig;
  /** Merge streamed block replies before sending. */
  blockStreamingCoalesce?: BlockStreamingCoalesceConfig;
  /** Draft streaming mode for WeChat (off|partial|block). Default: partial. */
  streamMode?: "off" | "partial" | "block";
  mediaMaxMb?: number;
  /** Retry policy for outbound WeChat API calls. */
  retry?: OutboundRetryConfig;
  /** Per-action tool gating (default: true for all). */
  actions?: WeChatActionConfig;
  /** Heartbeat visibility settings for this channel. */
  heartbeat?: ChannelHeartbeatVisibilityConfig;
};

export type WeChatGroupConfig = {
  requireMention?: boolean;
  /** Optional tool policy overrides for this group. */
  tools?: GroupToolPolicyConfig;
  /** If specified, only load these skills for this group. Omit = all skills; empty = no skills. */
  skills?: string[];
  /** If false, disable the bot for this group. */
  enabled?: boolean;
  /** Optional allowlist for group senders (wxid or usernames). */
  allowFrom?: Array<string>;
  /** Optional system prompt snippet for this group. */
  systemPrompt?: string;
};

export type WeChatConfig = {
  /** Optional per-account WeChat configuration (multi-account). */
  accounts?: Record<string, WeChatAccountConfig>;
} & WeChatAccountConfig;
