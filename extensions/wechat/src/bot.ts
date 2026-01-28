import { Wechaty } from "wechaty";
import { PuppetMock } from "wechaty-puppet-mock";
import type { Contact, Message, Room } from "wechaty";

import type { ResolvedWeChatAccount } from "clawdbot/plugin-sdk";

export type WeChatBotManager = {
  bots: Map<string, Wechaty>;
  getBot: (account: ResolvedWeChatAccount) => Wechaty | undefined;
  startBot: (account: ResolvedWeChatAccount) => Promise<Wechaty>;
  stopBot: (account: ResolvedWeChatAccount) => Promise<void>;
  isLoggedIn: (account: ResolvedWeChatAccount) => Promise<boolean>;
};

function createBotManager(): WeChatBotManager {
  const bots = new Map<string, Wechaty>();

  return {
    bots,

    getBot(account: ResolvedWeChatAccount): Wechaty | undefined {
      const key = account.accountId || "default";
      return bots.get(key);
    },

    async startBot(account: ResolvedWeChatAccount): Promise<Wechaty> {
      const key = account.accountId || "default";

      // Check if bot already exists
      const existing = bots.get(key);
      if (existing) {
        if (existing.isLoggedIn) {
          return existing;
        }
        await existing.stop();
        bots.delete(key);
      }

      // Create new bot
      const bot = new Wechaty({
        name: `clawdbot-wechat-${key}`,
        puppet: account.puppet || "wechaty-puppet-wechat",
      });

      // Setup event handlers
      bot
        .on("scan", (qrcode: string) => {
          console.log(`WeChat QR Code: ${qrcode}`);
          // TODO: Display QR code to user
        })
        .on("login", (user: Contact) => {
          console.log(`WeChat bot logged in: ${user.name()}`);
        })
        .on("logout", () => {
          console.log("WeChat bot logged out");
        })
        .on("error", (error: Error) => {
          console.error("WeChat bot error:", error);
        })
        .on("message", async (message: Message) => {
          await handleWeChatMessage(message, account);
        });

      // Start bot
      await bot.start();
      bots.set(key, bot);

      return bot;
    },

    async stopBot(account: ResolvedWeChatAccount): Promise<void> {
      const key = account.accountId || "default";
      const bot = bots.get(key);
      if (bot) {
        await bot.stop();
        bots.delete(key);
      }
    },

    async isLoggedIn(account: ResolvedWeChatAccount): Promise<boolean> {
      const bot = this.getBot(account);
      return bot?.isLoggedIn || false;
    },
  };
}

export const wechatBotManager = createBotManager();

async function handleWeChatMessage(message: Message, account: ResolvedWeChatAccount) {
  try {
    const talker = message.talker();
    const room = message.room();
    const text = message.text();
    const type = message.type();

    // Skip self messages
    if (message.self()) {
      return;
    }

    // Get target info
    const fromId = talker.id;
    const fromName = talker.name();
    const isGroup = Boolean(room);
    const groupId = isGroup ? room!.id : undefined;
    const groupName = isGroup ? await room!.topic() : undefined;

    // Build message data
    const messageData = {
      from: {
        id: fromId,
        name: fromName,
      },
      to: {
        id: message.to()?.id,
        name: message.to()?.name(),
      },
      group: isGroup
        ? {
            id: groupId!,
            name: groupName!,
          }
        : undefined,
      text,
      type,
      timestamp: Date.now(),
      accountId: account.accountId || "default",
    };

    // Emit to Clawdbot's message handling system
    // TODO: This will be connected to the main Clawdbot runtime
    console.log("WeChat message received:", JSON.stringify(messageData, null, 2));

    // Handle media messages
    if (type === bot.Message.Type.Image) {
      const fileBox = await message.toFileBox();
      const buffer = await fileBox.toBuffer();
      console.log(`Image received: ${fileBox.name}, size: ${buffer.length}`);
    } else if (type === bot.Message.Type.Attachment) {
      const fileBox = await message.toFileBox();
      const buffer = await fileBox.toBuffer();
      console.log(`Attachment received: ${fileBox.name}, size: ${buffer.length}`);
    }
  } catch (error) {
    console.error("Error handling WeChat message:", error);
  }
}

export async function sendMessageWeChat(
  target: string,
  content: string,
  options: {
    accountId?: string;
    type?: "text" | "image" | "file";
    file?: Buffer;
    filename?: string;
  } = {},
): Promise<void> {
  // TODO: Implement message sending
  console.log(`Sending WeChat message to ${target}:`, content);
}
