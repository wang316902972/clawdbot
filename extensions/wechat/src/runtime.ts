import type { PluginRuntime } from "clawdbot/plugin-sdk";

let wechatRuntime: PluginRuntime | null = null;

export function setWeChatRuntime(runtime: PluginRuntime) {
  wechatRuntime = runtime;
}

export function getWeChatRuntime(): PluginRuntime {
  if (!wechatRuntime) {
    throw new Error("WeChat runtime not initialized");
  }
  return wechatRuntime;
}
