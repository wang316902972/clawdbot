import { z } from "zod";

import {
  BlockStreamingChunkSchema,
  BlockStreamingCoalesceSchema,
  DmConfigSchema,
  DmPolicySchema,
  GroupPolicySchema,
  MarkdownConfigSchema,
  ProviderCommandsSchema,
  RetryConfigSchema,
} from "./zod-schema.core.js";
import { ToolPolicySchema } from "./zod-schema.agent-runtime.js";
import { ChannelHeartbeatVisibilitySchema } from "./zod-schema.channels.js";

export const WeChatActionSchema = z
  .object({
    sendMessage: z.boolean().optional(),
    deleteMessage: z.boolean().optional(),
  })
  .strict();

export const WeChatGroupSchema = z
  .object({
    requireMention: z.boolean().optional(),
    tools: ToolPolicySchema.optional(),
    skills: z.array(z.string()).optional(),
    enabled: z.boolean().optional(),
    allowFrom: z.array(z.string()).optional(),
    systemPrompt: z.string().optional(),
  })
  .strict();

export const WeChatAccountSchema = z
  .object({
    name: z.string().optional(),
    markdown: MarkdownConfigSchema.optional(),
    commands: ProviderCommandsSchema.optional(),
    configWrites: z.boolean().optional(),
    dmPolicy: DmPolicySchema.optional().default("pairing"),
    enabled: z.boolean().optional(),
    botName: z.string().optional(),
    puppet: z.string().optional(),
    groups: z.record(z.string(), WeChatGroupSchema.optional()).optional(),
    allowFrom: z.array(z.string()).optional(),
    groupAllowFrom: z.array(z.string()).optional(),
    groupPolicy: GroupPolicySchema.optional().default("allowlist"),
    historyLimit: z.number().int().nonnegative().optional(),
    dmHistoryLimit: z.number().int().nonnegative().optional(),
    dms: z.record(z.string(), DmConfigSchema.optional()).optional(),
    textChunkLimit: z.number().int().positive().optional(),
    chunkMode: z.enum(["length", "newline"]).optional(),
    blockStreaming: z.boolean().optional(),
    draftChunk: BlockStreamingChunkSchema.optional(),
    blockStreamingCoalesce: BlockStreamingCoalesceSchema.optional(),
    streamMode: z.enum(["off", "partial", "block"]).optional(),
    mediaMaxMb: z.number().int().positive().optional(),
    retry: RetryConfigSchema.optional(),
    actions: WeChatActionSchema.optional(),
    heartbeat: ChannelHeartbeatVisibilitySchema.optional(),
  })
  .strict();

export const WeChatConfigSchema = WeChatAccountSchema
  .extend({
    accounts: z.record(z.string(), WeChatAccountSchema.optional()).optional(),
  })
  .strict();
