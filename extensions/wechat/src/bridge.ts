import type { ResolvedWeChatAccount, ResolvedWhatsAppAccount } from "clawdbot/plugin-sdk";

export type BridgeMapping = {
  whatsapp: string; // WhatsApp JID
  wechat: string; // WeChat user/group ID
  direction: "whatsapp-to-wechat" | "wechat-to-whatsapp" | "bidirectional";
  enabled?: boolean;
};

export type BridgeConfig = {
  enabled: boolean;
  mappings: BridgeMapping[];
};

/**
 * Find WeChat target for a WhatsApp message
 */
export function findWeChatTarget(
  whatsappJid: string,
  bridgeConfig: BridgeConfig,
): string | undefined {
  if (!bridgeConfig.enabled) {
    return undefined;
  }

  const mapping = bridgeConfig.mappings.find(
    (m) =>
      m.enabled !== false &&
      m.whatsapp === whatsappJid &&
      (m.direction === "whatsapp-to-wechat" || m.direction === "bidirectional"),
  );

  return mapping?.wechat;
}

/**
 * Find WhatsApp target for a WeChat message
 */
export function findWhatsAppTarget(
  wechatId: string,
  bridgeConfig: BridgeConfig,
): string | undefined {
  if (!bridgeConfig.enabled) {
    return undefined;
  }

  const mapping = bridgeConfig.mappings.find(
    (m) =>
      m.enabled !== false &&
      m.wechat === wechatId &&
      (m.direction === "wechat-to-whatsapp" || m.direction === "bidirectional"),
  );

  return mapping?.whatsapp;
}

/**
 * Format message for cross-platform delivery
 */
export function formatCrossPlatformMessage(
  originalMessage: {
    text: string;
    senderName?: string;
    senderId?: string;
    timestamp?: number;
  },
  sourcePlatform: "whatsapp" | "wechat",
): string {
  const prefix = `[来自 ${sourcePlatform === "whatsapp" ? "WhatsApp" : "WeChat"}]`;

  let formatted = prefix;

  if (originalMessage.senderName) {
    formatted += ` ${originalMessage.senderName}:`;
  }

  formatted += `\n${originalMessage.text}`;

  return formatted;
}

/**
 * Validate if a message can be bridged
 */
export function canBridgeMessage(message: {
  text?: string;
  media?: Buffer;
  type?: string;
}): boolean {
  // Allow text messages
  if (message.text && message.text.trim().length > 0) {
    return true;
  }

  // Allow media messages (with size limits)
  if (message.media) {
    const maxSize = 100 * 1024 * 1024; // 100MB
    return message.media.length <= maxSize;
  }

  return false;
}

/**
 * Convert message type from one platform to another
 */
export function convertMessageType(
  originalType: string,
  sourcePlatform: "whatsapp" | "wechat",
): "text" | "image" | "file" | "unsupported" {
  // Map WhatsApp types
  if (sourcePlatform === "whatsapp") {
    if (originalType.includes("image") || originalType.includes("Image")) {
      return "image";
    }
    if (originalType.includes("document") || originalType.includes("Document")) {
      return "file";
    }
    if (originalType.includes("text") || originalType.includes("Text")) {
      return "text";
    }
  }

  // Map WeChat types
  if (sourcePlatform === "wechat") {
    if (originalType === "Image" || originalType === "image") {
      return "image";
    }
    if (originalType === "Attachment" || originalType === "attachment") {
      return "file";
    }
    if (originalType === "Text" || originalType === "text") {
      return "text";
    }
  }

  return "unsupported";
}

/**
 * Extract bridge configuration from Clawdbot config
 */
export function extractBridgeConfig(cfg: any): BridgeConfig {
  const bridges = cfg.bridges?.["whatsapp-wechat"];

  if (!bridges) {
    return {
      enabled: false,
      mappings: [],
    };
  }

  return {
    enabled: bridges.enabled === true,
    mappings: Array.isArray(bridges.mappings) ? bridges.mappings : [],
  };
}

/**
 * Validate bridge mapping
 */
export function validateBridgeMapping(mapping: BridgeMapping): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!mapping.whatsapp || !mapping.whatsapp.trim()) {
    errors.push("WhatsApp JID is required");
  }

  if (!mapping.wechat || !mapping.wechat.trim()) {
    errors.push("WeChat ID is required");
  }

  if (
    !["whatsapp-to-wechat", "wechat-to-whatsapp", "bidirectional"].includes(
      mapping.direction,
    )
  ) {
    errors.push(
      `Invalid direction: ${mapping.direction}. Must be one of: whatsapp-to-wechat, wechat-to-whatsapp, bidirectional`,
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
