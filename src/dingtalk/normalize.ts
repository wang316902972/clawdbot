export function normalizeDingTalkTarget(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return trimmed;
}

export function isDingTalkUserTarget(target: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(target) && !target.includes("$");
}

export function isDingTalkGroupTarget(target: string): boolean {
  return /^[a-zA-Z0-9_-]+\$[a-zA-Z0-9_-]+$/.test(target);
}

export function looksLikeDingTalkTargetId(value: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(value) || /^[a-zA-Z0-9_-]+\$[a-zA-Z0-9_-]+$/.test(value);
}
