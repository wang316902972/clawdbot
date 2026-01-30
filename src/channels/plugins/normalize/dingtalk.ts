import { normalizeDingTalkTarget } from "../../../dingtalk/normalize.js";

export function normalizeDingTalkMessagingTarget(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  return normalizeDingTalkTarget(trimmed) || undefined;
}

export function looksLikeDingTalkTargetId(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (/^dingtalk:/i.test(trimmed)) return true;
  return /^[a-zA-Z0-9_-]+$/.test(trimmed) || /^[a-zA-Z0-9_-]+\$[a-zA-Z0-9_-]+$/.test(trimmed);
}
