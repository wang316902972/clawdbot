import { loadConfig } from "../config/config.js";
import { createSubsystemLogger } from "../logging/subsystem.js";
import type { ResolvedWeChatAccount, resolveWeChatAccount } from "./accounts.js";
import { wechatBotManager } from "../extensions/wechat/src/bot.js";

const logger = createSubsystemLogger("wechat/probe");

export type WeChatProbeResult = {
  accountId: string;
  status: "ok" | "error" | "not_configured" | "not_logged_in";
  botName?: string;
  botId?: string;
  error?: string;
};

/**
 * Probe WeChat connection status for an account
 */
export async function probeWeChat(
  accountId?: string,
): Promise<WeChatProbeResult> {
  const cfg = loadConfig();
  const account = resolveWeChatAccount({
    cfg,
    accountId,
  });

  if (!account.enabled) {
    return {
      accountId: account.accountId,
      status: "not_configured",
      error: "Account not enabled",
    };
  }

  try {
    const bot = wechatBotManager.getBot(account);

    if (!bot) {
      return {
        accountId: account.accountId,
        status: "not_logged_in",
        error: "Bot not started",
      };
    }

    if (!bot.isLoggedIn) {
      return {
        accountId: account.accountId,
        status: "not_logged_in",
        error: "Bot not logged in",
      };
    }

    // Get bot user info
    const self = bot.userSelf();
    if (!self) {
      return {
        accountId: account.accountId,
        status: "error",
        error: "Bot user not found",
      };
    }

    return {
      accountId: account.accountId,
      status: "ok",
      botName: self.name(),
      botId: self.id,
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error(`[probe] Error probing account ${account.accountId}: ${err.message}`);

    return {
      accountId: account.accountId,
      status: "error",
      error: err.message,
    };
  }
}

/**
 * Probe all WeChat accounts
 */
export async function probeAllWeChatAccounts(): Promise<WeChatProbeResult[]> {
  const cfg = loadConfig();
  const { listWeChatAccountIds } = await import("./accounts.js");

  const accountIds = listWeChatAccountIds(cfg);
  const results: WeChatProbeResult[] = [];

  for (const accountId of accountIds) {
    const result = await probeWeChat(accountId);
    results.push(result);
  }

  return results;
}
