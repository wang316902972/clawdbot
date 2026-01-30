/**
 * Telegram Bot Token validation utilities.
 *
 * Token format: `BOT_ID:TOKEN_STRING`
 * - BOT_ID: Numeric ID (one or more digits)
 * - TOKEN_STRING: 35 characters from [A-Za-z0-9_-]
 * - Example: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz-12345678`
 */

export type TokenValidationResult =
  | { valid: true }
  | {
      valid: false;
      error: string;
      hint: string;
    };

/**
 * Validates Telegram Bot Token format.
 *
 * Format: `^\d+:[A-Za-z0-9_-]{35}$`
 *
 * @param token - The token to validate
 * @returns Validation result with error details if invalid
 */
export function validateTelegramTokenFormat(token: string): TokenValidationResult {
  const trimmed = token.trim();

  if (!trimmed) {
    return {
      valid: false,
      error: "Token is empty",
      hint: "Please enter a Telegram bot token from @BotFather",
    };
  }

  // Check for colon separator
  const colonIndex = trimmed.indexOf(":");
  if (colonIndex === -1) {
    return {
      valid: false,
      error: "Invalid token format: missing colon separator",
      hint: 'Token format should be: "123456:ABC..." (bot ID, colon, token string)',
    };
  }

  // Split into bot ID and token string
  const [botId, tokenString] = trimmed.split(":");

  // Validate bot ID (must be numeric)
  if (!botId || !/^\d+$/.test(botId)) {
    return {
      valid: false,
      error: "Invalid bot ID format",
      hint: "Bot ID must be numeric (e.g., '123456789' in '123456789:ABC...')",
    };
  }

  // Validate token string length
  if (!tokenString) {
    return {
      valid: false,
      error: "Missing token string",
      hint: "Token must include both bot ID and token string separated by colon",
    };
  }

  if (tokenString.length !== 35) {
    return {
      valid: false,
      error: `Invalid token string length: ${tokenString.length} characters (expected 35)`,
      hint: "Token string must be exactly 35 characters after the colon",
    };
  }

  // Validate token string characters
  if (!/^[A-Za-z0-9_-]+$/.test(tokenString)) {
    return {
      valid: false,
      error: "Invalid characters in token string",
      hint: "Token string can only contain letters, numbers, hyphens, and underscores",
    };
  }

  return { valid: true };
}

/**
 * Checks if a string looks like a Telegram Bot Token (fast check).
 *
 * This is a lighter check than validateTelegramTokenFormat() for use in
 * scenarios where you just want to know if something resembles a token.
 *
 * @param token - The string to check
 * @returns True if the string looks like a token
 */
export function looksLikeTelegramToken(token: string): boolean {
  const trimmed = token.trim();
  // Simple check: has colon, numeric part before it, reasonable length
  return /^\d+:[A-Za-z0-9_-]{35}$/.test(trimmed);
}

/**
 * Masks a Telegram bot token for safe logging/display.
 *
 * @param token - The token to mask
 * @param visibleChars - Number of characters to show at start and end (default: 4)
 * @returns Masked token (e.g., "1234***...***1234")
 */
export function maskToken(token: string, visibleChars = 4): string {
  const trimmed = token.trim();
  if (!trimmed) return "(empty)";

  const colonIndex = trimmed.indexOf(":");
  if (colonIndex === -1) return "(invalid)";

  const botId = trimmed.slice(0, colonIndex);
  const tokenString = trimmed.slice(colonIndex + 1);

  const visibleBotId = botId.slice(-visibleChars);
  const visibleToken =
    tokenString.length > visibleChars * 2
      ? tokenString.slice(0, visibleChars) + "..." + tokenString.slice(-visibleChars)
      : tokenString;

  return `${visibleBotId}:***${visibleToken}***`;
}

/**
 * Formats a validation error for user display.
 *
 * @param result - Validation result
 * @returns Formatted error message (empty string if valid)
 */
export function formatValidationError(result: TokenValidationResult): string {
  if (result.valid) return "";

  const invalidResult = result as Extract<TokenValidationResult, { valid: false }>;
  return [
    `❌ ${invalidResult.error}`,
    "",
    "💡 " + invalidResult.hint,
    "",
    "Example: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz-12345678",
  ].join("\n");
}
