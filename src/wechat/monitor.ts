import type { Wechaty } from "wechaty";
import { loadConfig } from "../config/config.js";
import { logVerbose } from "../globals.js";
import { recordChannelActivity } from "../infra/channel-activity.js";
import { redactSensitiveText } from "../logging/redact.js";
import { createSubsystemLogger } from "../logging/subsystem.js";
import type { ResolvedWeChatAccount, resolveWeChatAccount } from "./accounts.js";
import { wechatBotManager } from "../extensions/wechat/src/bot.js";

const logger = createSubsystemLogger("wechat/monitor");

type WeChatMonitorCallbacks = {
  onMessage?: (message: any, account: ResolvedWeChatAccount) => Promise<void>;
  onError?: (error: Error, account: ResolvedWeChatAccount) => void;
  onLogin?: (user: any, account: ResolvedWeChatAccount) => void;
  onLogout?: (account: ResolvedWeChatAccount) => void;
};

/**
 * Start monitoring WeChat for a specific account
 */
export async function startWeChatMonitor(
  account: ResolvedWeChatAccount,
  callbacks: WeChatMonitorCallbacks = {},
): Promise<Wechaty> {
  logVerbose(`[wechat] Starting monitor for account ${account.accountId}`);

  try {
    // Start bot
    const bot = await wechatBotManager.startBot(account);

    // Setup event handlers
    bot.on("scan", (qrcode: string, status: number) => {
      logger.info(
        `[${account.accountId}] QR Code scan status: ${status} - ${qrcode.slice(0, 20)}...`,
      );
      // TODO: Display QR code to user via CLI
    });

    bot.on("login", async (user: any) => {
      logger.info(
        `[${account.accountId}] Logged in as ${user.name()} (${user.id})`,
      );

      if (callbacks.onLogin) {
        callbacks.onLogin(user, account);
      }

      // Record activity
      await recordChannelActivity({
        channel: "wechat",
        accountId: account.accountId,
        activity: {
          timestamp: Date.now(),
          kind: "login",
          direction: "in",
          count: 1,
        },
      });
    });

    bot.on("logout", async () => {
      logger.warn(`[${account.accountId}] Logged out`);

      if (callbacks.onLogout) {
        callbacks.onLogout(account);
      }

      // Record activity
      await recordChannelActivity({
        channel: "wechat",
        accountId: account.accountId,
        activity: {
          timestamp: Date.now(),
          kind: "logout",
          direction: "in",
          count: 1,
        },
      });
    });

    bot.on("error", (error: Error) => {
      logger.error(
        `[${account.accountId}] Bot error: ${error.message}`,
      );

      if (callbacks.onError) {
        callbacks.onError(error, account);
      }
    });

    bot.on("message", async (message: any) => {
      try {
        if (callbacks.onMessage) {
          await callbacks.onMessage(message, account);
        }

        // Record activity
        await recordChannelActivity({
          channel: "wechat",
          accountId: account.accountId,
          activity: {
            timestamp: Date.now(),
            kind: "inbound",
            direction: "in",
            count: 1,
          },
        });
      } catch (error) {
        logger.error(
          `[${account.accountId}] Error in message handler: ${error}`,
        );
      }
    });

    bot.on("room-join", async (room: any, inviteeList: any[], inviter: any) => {
      logger.info(
        `[${account.accountId}] Room join: ${room.id}, inviteeList: ${inviteeList.length}, inviter: ${inviter.name()}`,
      );
    });

    bot.on("room-leave", async (room: any, leaverList: any[]) => {
      logger.info(
        `[${account.accountId}] Room leave: ${room.id}, leavers: ${leaverList.length}`,
      );
    });

    bot.on("room-topic", async (room: any, topic: string, oldTopic: string, changer: any) => {
      logger.info(
        `[${account.accountId}] Room topic changed: ${room.id}, "${oldTopic}" -> "${topic}"`,
      );
    });

    logVerbose(`[wechat] Monitor started for account ${account.accountId}`);
    return bot;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error(
      `[${account.accountId}] Failed to start monitor: ${err.message}`,
    );
    throw err;
  }
}

/**
 * Stop monitoring WeChat for a specific account
 */
export async function stopWeChatMonitor(
  account: ResolvedWeChatAccount,
): Promise<void> {
  logVerbose(`[wechat] Stopping monitor for account ${account.accountId}`);

  try {
    await wechatBotManager.stopBot(account);
    logVerbose(`[wechat] Monitor stopped for account ${account.accountId}`);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error(
      `[${account.accountId}] Failed to stop monitor: ${err.message}`,
    );
    throw err;
  }
}

/**
 * Monitor all enabled WeChat accounts
 */
export async function monitorWeChatProvider(
  callbacks: WeChatMonitorCallbacks = {},
): Promise<void> {
  const cfg = loadConfig();
  const { listWeChatAccountIds, resolveWeChatAccount } = await import("./accounts.js");

  const accountIds = listWeChatAccountIds(cfg);
  const enabledAccounts = accountIds
    .map((id) => resolveWeChatAccount({ cfg, accountId: id }))
    .filter((account) => account.enabled);

  if (enabledAccounts.length === 0) {
    logger.warn("No enabled WeChat accounts to monitor");
    return;
  }

  logger.info(`Starting WeChat monitor for ${enabledAccounts.length} account(s)`);

  // Start monitoring each account
  for (const account of enabledAccounts) {
    try {
      await startWeChatMonitor(account, callbacks);
    } catch (error) {
      logger.error(
        `Failed to start monitor for account ${account.accountId}: ${error}`,
      );
    }
  }
}
