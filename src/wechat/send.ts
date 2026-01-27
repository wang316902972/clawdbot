import type { FileBox } from "wechaty";
import { loadConfig } from "../config/config.js";
import { logVerbose } from "../globals.js";
import { recordChannelActivity } from "../infra/channel-activity.js";
import { formatErrorMessage } from "../infra/errors.js";
import { redactSensitiveText } from "../logging/redact.js";
import { createSubsystemLogger } from "../logging/subsystem.js";
import { detectMime, extensionForMime } from "../media/mime.js";
import type { ResolvedWeChatAccount, resolveWeChatAccount } from "./accounts.js";
import { wechatBotManager } from "../extensions/wechat/src/bot.js";

const logger = createSubsystemLogger("wechat");

type WeChatSendOpts = {
  accountId?: string;
  verbose?: boolean;
  mediaUrl?: string;
  mediaBuffer?: Buffer;
  mediaFilename?: string;
  maxBytes?: number;
  plainText?: string;
};

type WeChatSendResult = {
  messageId: string;
  target: string;
};

/**
 * Send a message to WeChat
 */
export async function sendMessageWeChat(
  target: string,
  textOrFile: string | FileBox,
  options: WeChatSendOpts = {},
): Promise<WeChatSendResult> {
  const cfg = loadConfig();
  const account = resolveWeChatAccount({
    cfg,
    accountId: options.accountId,
  });

  if (!account.enabled) {
    throw new Error(`WeChat account ${account.accountId} is not enabled`);
  }

  const bot = wechatBotManager.getBot(account);
  if (!bot) {
    throw new Error(`WeChat bot for account ${account.accountId} is not started`);
  }

  if (!bot.isLoggedIn) {
    throw new Error(`WeChat bot for account ${account.accountId} is not logged in`);
  }

  const verbose = options.verbose ?? false;
  if (verbose) logVerbose(`[wechat] Sending to ${target}`);

  try {
    let result: WeChatSendResult;

    // Check if target is a group or user
    const isGroup = target.includes("@chatroom");
    const contact = isGroup
      ? await bot.Room.find({ id: target })
      : await bot.Contact.find({ id: target });

    if (!contact) {
      throw new Error(
        `WeChat ${isGroup ? "room" : "contact"} not found: ${target}`,
      );
    }

    if (typeof textOrFile === "string") {
      // Text message
      if (verbose) logVerbose(`[wechat] Text message: ${textOrFile.slice(0, 50)}...`);

      const msg = await contact.say(textOrFile);
      result = {
        messageId: msg.id,
        target,
      };

      if (verbose) logVerbose(`[wechat] Sent message ${msg.id}`);
    } else {
      // File message (FileBox)
      if (verbose)
        logVerbose(`[wechat] File message: ${textOrFile.name}`);

      const msg = await contact.say(textOrFile);
      result = {
        messageId: msg.id,
        target,
      };

      if (verbose) logVerbose(`[wechat] Sent file ${msg.id}`);
    }

    // Record activity
    await recordChannelActivity({
      channel: "wechat",
      accountId: account.accountId,
      activity: {
        timestamp: Date.now(),
        kind: "outbound",
        direction: "out",
        count: 1,
      },
    });

    return result;
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error(
      `Failed to send WeChat message to ${redactSensitiveText(target)}: ${error.message}`,
    );
    throw error;
  }
}

/**
 * Send a text message to WeChat
 */
export async function sendTextWeChat(
  target: string,
  text: string,
  options?: WeChatSendOpts,
): Promise<WeChatSendResult> {
  return sendMessageWeChat(target, text, options);
}

/**
 * Send a media file to WeChat
 */
export async function sendMediaWeChat(
  target: string,
  mediaUrl: string,
  options?: WeChatSendOpts,
): Promise<WeChatSendResult> {
  const cfg = loadConfig();
  const account = resolveWeChatAccount({
    cfg,
    accountId: options?.accountId,
  });

  // Load media from URL
  const { loadWebMedia } = await import("../web/media.js");
  const { mediaBuffer, mediaName, mime } = await loadWebMedia(mediaUrl, {
    maxBytes: options?.maxBytes ?? account.mediaMaxMb
      ? account.mediaMaxMb * 1024 * 1024
      : undefined,
  });

  // Convert to FileBox
  const { FileBox } = await import("wechaty");
  const fileBox = FileBox.fromBuffer(mediaBuffer, mediaName);

  return sendMessageWeChat(target, fileBox, {
    ...options,
    mediaBuffer,
    mediaFilename: mediaName,
  });
}

/**
 * Create a WeChat login tool for agents
 */
export async function createWeChatLoginTool(
  accountId: string,
): Promise<{ name: string; description: string; input_schema: any }> {
  return {
    name: "wechat_login",
    description: "Login to WeChat (QR code scan required)",
    input_schema: {
      type: "object",
      properties: {
        confirm: {
          type: "boolean",
          description: "Confirm to start WeChat login",
        },
      },
      required: ["confirm"],
    },
  };
}
