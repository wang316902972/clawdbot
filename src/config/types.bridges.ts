/**
 * Bridge configuration types for cross-platform message forwarding
 */

export type BridgeDirection = "whatsapp-to-wechat" | "wechat-to-whatsapp" | "bidirectional";

export type BridgeMapping = {
  /** WhatsApp JID (user or group) */
  whatsapp: string;
  /** WeChat ID (wxid or group chatroom) */
  wechat: string;
  /** Message forwarding direction */
  direction: BridgeDirection;
  /** If false, this mapping is disabled (default: true) */
  enabled?: boolean;
};

export type BridgeDeduplicationConfig = {
  /** Enable message deduplication (default: false) */
  enabled?: boolean;
  /** Time window in seconds (default: 60) */
  window?: number;
};

export type BridgeScheduleConfig = {
  /** Start time in HH:MM format (24-hour) */
  start?: string;
  /** End time in HH:MM format (24-hour) */
  end?: string;
  /** Timezone (default: UTC) */
  timezone?: string;
};

export type BridgeFilterConfig = {
  /** Keyword whitelist or blacklist */
  keywords?: string[];
  /** Filter mode: "whitelist" (only forward if keyword matches) or "blacklist" (skip if keyword matches) */
  mode?: "whitelist" | "blacklist";
};

export type BridgeBatchingConfig = {
  /** Enable batch processing (default: false) */
  enabled?: boolean;
  /** Maximum messages per batch (default: 10) */
  maxBatchSize?: number;
  /** Maximum wait time in seconds (default: 5) */
  maxWaitTime?: number;
};

export type BridgeConcurrencyConfig = {
  /** Maximum concurrent forwardings (default: 5) */
  maxConcurrent?: number;
  /** Queue size (default: 100) */
  queueSize?: number;
};

export type BridgeConfig = {
  /** Enable/disable bridge (default: false) */
  enabled?: boolean;
  /** Message deduplication settings */
  deduplication?: BridgeDeduplicationConfig;
  /** Schedule restrictions */
  schedule?: BridgeScheduleConfig;
  /** Message filters */
  filters?: BridgeFilterConfig;
  /** Batching settings */
  batching?: BridgeBatchingConfig;
  /** Concurrency control */
  concurrency?: BridgeConcurrencyConfig;
  /** Bridge mappings */
  mappings?: BridgeMapping[];
};

export type BridgesConfig = {
  /** WhatsApp-WeChat bridge configuration */
  "whatsapp-wechat"?: BridgeConfig;
};
