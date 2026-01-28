// Account management
export {
  listWeChatAccountIds,
  resolveDefaultWeChatAccountId,
  resolveWeChatAccount,
  type ResolvedWeChatAccount,
} from "./accounts.js";

// Normalization
export {
  normalizeWeChatTarget,
  isWeChatUserTarget,
  isWeChatGroupTarget,
} from "./normalize.js";

// Send messages
export {
  sendMessageWeChat,
  sendTextWeChat,
  sendMediaWeChat,
  createWeChatLoginTool,
} from "./send.js";

// Monitor
export {
  startWeChatMonitor,
  stopWeChatMonitor,
  monitorWeChatProvider,
} from "./monitor.js";

// Probe
export {
  probeWeChat,
  probeAllWeChatAccounts,
  type WeChatProbeResult,
} from "./probe.js";
