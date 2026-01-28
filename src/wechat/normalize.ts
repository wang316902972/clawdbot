/**
 * WeChat target normalization utilities.
 *
 * WeChat IDs come in different formats:
 * - User IDs: wxid_abc123def456 (internal WeChat IDs)
 * - Usernames: username_string (custom WeChat IDs)
 * - Group IDs: 12345678900@chatroom (group chat IDs)
 */

const WECHAT_USER_ID_RE = /^wx_[a-zA-Z0-9]{10,}$/;
const WECHAT_GROUP_ID_RE = /^\d{10,}@chatroom$/;

function stripWeChatTargetPrefixes(value: string): string {
  let candidate = value.trim();
  for (;;) {
    const before = candidate;
    candidate = candidate.replace(/^wechat:/i, "").trim();
    if (candidate === before) return candidate;
  }
}

/**
 * Check if value looks like a WeChat group ID (e.g. "98765432100@chatroom").
 */
export function isWeChatGroupTarget(value: string): boolean {
  const candidate = stripWeChatTargetPrefixes(value);
  return WECHAT_GROUP_ID_RE.test(candidate);
}

/**
 * Check if value looks like a WeChat user ID (e.g. "wxid_abc123def456").
 */
export function isWeChatUserTarget(value: string): boolean {
  const candidate = stripWeChatTargetPrefixes(value);
  return WECHAT_USER_ID_RE.test(candidate);
}

/**
 * Normalize a WeChat target (user or group) to a canonical form.
 *
 * Rules:
 * - User IDs (wxid_*): returned as-is (lowercase, trimmed)
 * - Usernames: returned as-is (trimmed)
 * - Group IDs (*@chatroom): returned as-is (lowercase, trimmed)
 * - Invalid input: returns null
 *
 * Examples:
 * - "wxid_abc123" -> "wxid_abc123"
 * - "username" -> "username"
 * - "12345678900@chatroom" -> "12345678900@chatroom"
 * - "wechat:wxid_abc123" -> "wxid_abc123"
 * - "" -> null
 */
export function normalizeWeChatTarget(value: string): string | null {
  const candidate = stripWeChatTargetPrefixes(value);
  if (!candidate) return null;

  // Check for group ID
  if (isWeChatGroupTarget(candidate)) {
    return candidate.toLowerCase();
  }

  // Check for user ID
  if (isWeChatUserTarget(candidate)) {
    return candidate.toLowerCase();
  }

  // Treat as username (any other non-empty string)
  const normalized = candidate.trim();
  return normalized.length > 0 ? normalized : null;
}
