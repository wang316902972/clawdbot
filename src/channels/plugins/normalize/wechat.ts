import { isWeChatGroupTarget, isWeChatUserTarget, normalizeWeChatTarget } from "../../../wechat/normalize.js";

export function normalizeWeChatMessagingTarget(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  return normalizeWeChatTarget(trimmed) ?? undefined;
}

export function looksLikeWeChatTargetId(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (/^wechat:/i.test(trimmed)) return true;
  if (isWeChatUserTarget(trimmed)) return true;
  if (isWeChatGroupTarget(trimmed)) return true;
  // Match usernames or wxid patterns
  return /^wx_[a-zA-Z0-9]{10,}$/.test(trimmed) || /^[a-zA-Z0-9_-]{3,}$/.test(trimmed);
}
