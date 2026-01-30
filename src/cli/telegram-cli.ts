import type { Command } from "commander";
import { loadConfig } from "../config/config.js";
import { telegramOnboardingAdapter } from "../channels/plugins/onboarding/telegram.js";
import { createClackPrompter } from "../wizard/clack-prompter.js";
import { defaultRuntime } from "../runtime.js";
import { formatDocsLink } from "../terminal/links.js";
import { theme } from "../terminal/theme.js";

/**
 * Register Telegram CLI commands
 *
 * Provides quick setup commands for Telegram bot configuration
 */
export function registerTelegramCli(program: Command) {
  const telegram = program
    .command("telegram")
    .description("Telegram bot setup and configuration")
    .addHelpText(
      "after",
      () => `\n${theme.muted("Docs:")} ${formatDocsLink("/telegram", "docs.clawd.bot/telegram")}\n`,
    );

  telegram
    .command("setup")
    .description("Quick setup for Telegram bot (interactive)")
    .option("--account <id>", "Account ID for multi-bot setups (default: default account)")
    .option("--skip-allowlist", "Skip allowlist configuration")
    .action(async (opts) => {
      await runTelegramSetup({ account: opts.account, skipAllowlist: opts.skipAllowlist });
    });

  telegram
    .command("test")
    .description("Test Telegram bot token")
    .option("--token <token>", "Bot token to test (uses config if not provided)")
    .option("--account <id>", "Account ID to test (default: default account)")
    .action(async (opts) => {
      await runTelegramTest({ token: opts.token, account: opts.account });
    });
}

async function runTelegramSetup(params: { account?: string; skipAllowlist?: boolean }) {
  try {
    const cfg = loadConfig();

    defaultRuntime.log("\n🤖 Telegram Bot Setup\n");
    defaultRuntime.log("This will help you configure your Telegram bot token.\n");

    const prompter = createClackPrompter();

    const result = await telegramOnboardingAdapter.configure({
      cfg,
      runtime: defaultRuntime,
      prompter,
      accountOverrides: { telegram: params.account },
      shouldPromptAccountIds: Boolean(params.account),
      forceAllowFrom: !params.skipAllowlist,
    });

    // Show success message
    defaultRuntime.log("\n✅ Telegram bot configured successfully!\n");

    if (result.accountId) {
      defaultRuntime.log(`Account ID: ${result.accountId}`);
    }

    defaultRuntime.log(
      `\n${theme.muted("Docs:")} ${formatDocsLink("/telegram", "docs.clawd.bot/telegram")}\n`,
    );
  } catch (err) {
    defaultRuntime.error(`\n❌ Setup failed: ${String(err)}\n`);
    throw err;
  }
}

async function runTelegramTest(params: { token?: string; account?: string }) {
  const { testTelegramToken } = await import("../telegram/bot-api.js");
  const { resolveDefaultTelegramAccountId, resolveTelegramAccount } =
    await import("../telegram/accounts.js");

  defaultRuntime.log("\n🔍 Testing Telegram Bot Token\n");

  let tokenToTest = params.token;

  if (!tokenToTest) {
    const cfg = loadConfig();
    const accountId = params.account ?? resolveDefaultTelegramAccountId(cfg);
    const account = resolveTelegramAccount({ cfg, accountId });
    tokenToTest = account.token;

    if (!tokenToTest) {
      defaultRuntime.error(
        `❌ No token found for account: ${accountId}\n` +
          `Provide --token <token> or ensure the account is configured.\n`,
      );
      throw new Error("No token found");
    }

    defaultRuntime.log(`Using token from account: ${accountId}`);
  }

  // Mask token for display
  const { maskToken } = await import("../telegram/token-validation.js");
  defaultRuntime.log(`Testing token: ${maskToken(tokenToTest)}\n`);

  // Test the token
  const result = await testTelegramToken(tokenToTest);

  if (result.valid && result.bot) {
    defaultRuntime.log("✅ Token is valid!\n");
    defaultRuntime.log("Bot Information:");
    defaultRuntime.log(
      `  Name: ${result.bot.firstName}${result.bot.lastName ? " " + result.bot.lastName : ""}`,
    );
    if (result.bot.username) {
      defaultRuntime.log(`  Username: @${result.bot.username}`);
    }
    defaultRuntime.log(`  ID: ${result.bot.id}`);
    defaultRuntime.log("");
    defaultRuntime.log("Capabilities:");
    defaultRuntime.log(`  Can join groups: ${result.bot.canJoinGroups ? "Yes" : "No"}`);
    defaultRuntime.log(
      `  Can read all group messages: ${result.bot.canReadAllGroupMessages ? "Yes" : "No"}`,
    );
    defaultRuntime.log(
      `  Supports inline queries: ${result.bot.supportsInlineQueries ? "Yes" : "No"}`,
    );
  } else {
    defaultRuntime.error("❌ Token validation failed!\n");
    defaultRuntime.error(`Error: ${result.error}\n`);
    if (result.errorType === "network") {
      defaultRuntime.log("💡 Tip: Check your internet connection.\n");
    } else if (result.errorType === "timeout") {
      defaultRuntime.log("💡 Tip: Telegram API may be slow or unreachable. Try again later.\n");
    } else if (result.errorType === "unauthorized") {
      defaultRuntime.log("💡 Tip: Make sure the token is correct and not expired.\n");
      defaultRuntime.log("💡 Tip: Get a new token from @BotFather on Telegram.\n");
    }
    throw new Error(result.error);
  }
}
