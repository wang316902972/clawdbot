/**
 * Telegram Bot API testing utilities.
 *
 * Provides functions to test Telegram bot tokens and verify their validity.
 */

export interface TelegramBotInfo {
  id: number;
  isBot: boolean;
  firstName: string;
  username?: string;
  lastName?: string;
  canJoinGroups: boolean;
  canReadAllGroupMessages: boolean;
  supportsInlineQueries: boolean;
}

export interface TokenTestResult {
  valid: boolean;
  bot?: TelegramBotInfo;
  error?: string;
  errorType?: "network" | "unauthorized" | "forbidden" | "timeout" | "unknown";
}

/**
 * Tests a Telegram bot token by calling the getMe API endpoint.
 *
 * @param token - The bot token to test
 * @param timeoutMs - Timeout in milliseconds (default: 10000)
 * @returns Promise with test result
 *
 * @example
 * ```typescript
 * const result = await testTelegramToken("123456789:ABCdefGHIjklMNOpqrsTUVwxyz-12345678");
 * if (result.valid) {
 *   console.log(`Bot: @${result.bot.username} (${result.bot.firstName})`);
 * } else {
 *   console.error(`Error: ${result.error}`);
 * }
 * ```
 */
export async function testTelegramToken(
  token: string,
  timeoutMs = 10000,
): Promise<TokenTestResult> {
  const url = `https://api.telegram.org/bot${token}/getMe`;

  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Clawdbot/1.0",
      },
    });

    clearTimeout(timeoutId);

    // Check for HTTP errors
    if (!response.ok) {
      if (response.status === 401) {
        return {
          valid: false,
          error: "Token is invalid or revoked",
          errorType: "unauthorized",
        };
      }

      if (response.status === 403) {
        return {
          valid: false,
          error: "Bot was blocked by Telegram",
          errorType: "forbidden",
        };
      }

      if (response.status === 404) {
        return {
          valid: false,
          error: "Bot not found (invalid token)",
          errorType: "unauthorized",
        };
      }

      return {
        valid: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        errorType: "unknown",
      };
    }

    // Parse response
    const data = await response.json();

    // Check for Telegram API errors
    if (!data.ok) {
      return {
        valid: false,
        error: data.description || "Unknown API error",
        errorType: "unauthorized",
      };
    }

    // Success! Return bot info with field name conversion
    const apiBot = data.result as {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
      last_name?: string;
      can_join_groups: boolean;
      can_read_all_group_messages: boolean;
      supports_inline_queries: boolean;
    };

    return {
      valid: true,
      bot: {
        id: apiBot.id,
        isBot: apiBot.is_bot,
        firstName: apiBot.first_name,
        username: apiBot.username,
        lastName: apiBot.last_name,
        canJoinGroups: apiBot.can_join_groups,
        canReadAllGroupMessages: apiBot.can_read_all_group_messages,
        supportsInlineQueries: apiBot.supports_inline_queries,
      },
    };
  } catch (error) {
    // Handle network errors
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return {
          valid: false,
          error: `Request timed out after ${timeoutMs}ms`,
          errorType: "timeout",
        };
      }

      if (error.message.includes("fetch")) {
        return {
          valid: false,
          error: `Network error: ${error.message}`,
          errorType: "network",
        };
      }

      return {
        valid: false,
        error: error.message,
        errorType: "unknown",
      };
    }

    return {
      valid: false,
      error: "Unknown error occurred",
      errorType: "unknown",
    };
  }
}

/**
 * Gets webhook information for a bot.
 *
 * @param token - The bot token
 * @param timeoutMs - Timeout in milliseconds (default: 10000)
 * @returns Promise with webhook info
 */
export async function getWebhookInfo(
  token: string,
  timeoutMs = 10000,
): Promise<{
  success: boolean;
  webhookUrl?: string;
  hasCustomCertificate?: boolean;
  pendingUpdateCount?: number;
  error?: string;
}> {
  const url = `https://api.telegram.org/bot${token}/getWebhookInfo`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Clawdbot/1.0",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();

    if (!data.ok) {
      return {
        success: false,
        error: data.description || "Unknown API error",
      };
    }

    return {
      success: true,
      webhookUrl: data.result.url,
      hasCustomCertificate: data.result.has_custom_certificate,
      pendingUpdateCount: data.result.pending_update_count,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return {
          success: false,
          error: `Request timed out after ${timeoutMs}ms`,
        };
      }
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Unknown error occurred",
    };
  }
}
