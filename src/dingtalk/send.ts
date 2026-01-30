import { loadConfig, writeConfigFile } from "../config/config.js";
import { logVerbose } from "../globals.js";
import { recordChannelActivity } from "../infra/channel-activity.js";
import { redactSensitiveText } from "../logging/redact.js";
import { createSubsystemLogger } from "../logging/subsystem.js";
import { resolveDingTalkAccount } from "./accounts.js";

const logger = createSubsystemLogger("dingtalk");

type DingTalkSendOpts = {
  accountId?: string;
  verbose?: boolean;
  plainText?: string;
  maxBytes?: number;
};

type DingTalkSendResult = {
  ok: boolean;
  messageId?: string;
  error?: string;
};

let accessTokenCache: Map<string, { token: string; expiresAt: number }> = new Map();

async function getAccessToken(appKey: string, appSecret: string): Promise<string> {
  const cacheKey = `${appKey}:${appSecret}`;
  const cached = accessTokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.token;
  }

  const url = `https://oapi.dingtalk.com/gettoken?appkey=${appKey}&appsecret=${appSecret}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.errcode !== 0) {
    throw new Error(`Failed to get DingTalk access token: ${data.errmsg}`);
  }

  accessTokenCache.set(cacheKey, {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  });

  return data.access_token;
}

async function sendDingTalkMessage(
  accessToken: string,
  conversationId: string,
  content: string,
  msgType: "text" | "markdown" = "text",
): Promise<{ messageId: string }> {
  const url = "https://api.dingtalk.com/v1.0/robot/groupMessages/send";

  const body = {
    msgtype: msgType,
    conversationId,
    [msgType]: msgType === "text" ? { content } : { title: "消息", text: content },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type-": "application/json",
      "x-acs-dingtalk-access-token": accessToken,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (data.code !== 0) {
    throw new Error(`Failed to send DingTalk message: ${data.message}`);
  }

  return { messageId: data.messageId || Date.now().toString() };
}

export async function sendMessageDingTalk(
  target: string,
  text: string,
  options: DingTalkSendOpts = {},
): Promise<DingTalkSendResult> {
  const cfg = loadConfig();
  const account = resolveDingTalkAccount({
    cfg,
    accountId: options.accountId,
  });

  if (!account.enabled) {
    return {
      ok: false,
      error: `DingTalk account ${account.accountId} is not enabled`,
    };
  }

  if (!account.appKey || !account.appSecret) {
    return {
      ok: false,
      error: `DingTalk account ${account.accountId} is not configured with appKey/appSecret`,
    };
  }

  const verbose = options.verbose ?? false;
  if (verbose) logVerbose(`[dingtalk] Sending to ${target}`);

  try {
    const accessToken = await getAccessToken(account.appKey, account.appSecret);
    const { messageId } = await sendDingTalkMessage(accessToken, target, text);

    if (verbose) logVerbose(`[dingtalk] Sent message ${messageId}`);

    recordChannelActivity({
      channel: "dingtalk",
      accountId: account.accountId,
      direction: "outbound",
      at: Date.now(),
    });

    return {
      ok: true,
      messageId,
    };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error(
      `Failed to send DingTalk message to ${redactSensitiveText(target)}: ${error.message}`,
    );
    return {
      ok: false,
      error: error.message,
    };
  }
}

export async function sendTextDingTalk(
  target: string,
  text: string,
  options?: DingTalkSendOpts,
): Promise<DingTalkSendResult> {
  return sendMessageDingTalk(target, text, options);
}

export async function sendMediaDingTalk(
  target: string,
  mediaUrl: string,
  options?: DingTalkSendOpts,
): Promise<DingTalkSendResult> {
  const cfg = loadConfig();
  const account = resolveDingTalkAccount({
    cfg,
    accountId: options?.accountId,
  });

  const { loadWebMedia } = await import("../web/media.js");
  const { fileName, buffer: _buffer } = await loadWebMedia(
    mediaUrl,
    options?.maxBytes ?? (account.mediaMaxMb ? account.mediaMaxMb * 1024 * 1024 : undefined),
  );

  const text = options?.plainText || `[图片: ${fileName}]`;
  return sendMessageDingTalk(target, text, options);
}

export async function createDingTalkLoginTool(
  _accountId: string,
): Promise<{ name: string; description: string; input_schema: any }> {
  return {
    name: "dingtalk_login",
    description: "Login to DingTalk (QR code scan required)",
    input_schema: {
      type: "object",
      properties: {
        confirm: {
          type: "boolean",
          description: "Confirm to start DingTalk login",
        },
      },
      required: ["confirm"],
    },
  };
}

/**
 * Validate DingTalk credentials without saving them
 */
export async function validateDingTalkCredentials(
  appKey: string,
  appSecret: string,
): Promise<{
  valid: boolean;
  accessToken?: string;
  expiresAt?: number;
  error?: string;
  errcode?: number;
}> {
  try {
    const url = `https://oapi.dingtalk.com/gettoken?appkey=${appKey}&appsecret=${appSecret}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.errcode === 0) {
      return {
        valid: true,
        accessToken: data.access_token,
        expiresAt: Date.now() + (data.expires_in - 60) * 1000,
      };
    } else {
      return {
        valid: false,
        error: data.errmsg,
        errcode: data.errcode,
      };
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Configuration result type
 */
type ConfigureDingTalkResult = {
  success: boolean;
  message: string;
  accountId?: string;
  validated?: boolean;
  details?: {
    appKey?: string;
    agentId?: string;
    accessTokenExpiresAt?: number;
  };
  error?: string;
  errorCode?: number;
};

/**
 * Handle DingTalk configuration request from Agent tool
 */
export async function handleConfigureDingTalk(
  params: {
    appKey: string;
    appSecret: string;
    agentId?: string;
    accountId?: string;
    name?: string;
  },
  contextAccountId: string = "default",
): Promise<ConfigureDingTalkResult> {
  // Input validation
  const appKey = params.appKey?.trim();
  const appSecret = params.appSecret?.trim();
  const accountId = params.accountId?.trim() || contextAccountId;
  const name = params.name?.trim();
  const agentId = params.agentId?.trim();

  if (!appKey || !appSecret) {
    return {
      success: false,
      message: "Missing required parameters",
      error: "appKey and appSecret are required",
    };
  }

  // Validate credentials
  const validation = await validateDingTalkCredentials(appKey, appSecret);
  if (!validation.valid) {
    return {
      success: false,
      message: "Failed to validate DingTalk credentials",
      error: validation.error || "Unknown validation error",
      errorCode: validation.errcode,
    };
  }

  // Load and update config
  const cfg = loadConfig();

  // Build the account config
  const accountConfig: any = {
    enabled: true,
    appKey,
    appSecret,
  };

  if (agentId) accountConfig.agentId = agentId;
  if (name) accountConfig.name = name;

  // Merge with existing config
  const updatedConfig = {
    ...cfg,
    channels: {
      ...cfg.channels,
      dingtalk: {
        ...(cfg.channels?.dingtalk as object | undefined),
        accounts: {
          ...(cfg.channels?.dingtalk as any)?.accounts,
          [accountId]: accountConfig,
        },
      },
    },
  };

  // Write config
  try {
    await writeConfigFile(updatedConfig);

    // Pre-populate token cache
    if (validation.accessToken && validation.expiresAt) {
      accessTokenCache.set(`${appKey}:${appSecret}`, {
        token: validation.accessToken,
        expiresAt: validation.expiresAt,
      });
    }

    return {
      success: true,
      message: "DingTalk account configured successfully",
      accountId,
      validated: true,
      details: {
        appKey: appKey.slice(0, 4) + "****" + appKey.slice(-4),
        agentId,
        accessTokenExpiresAt: validation.expiresAt,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to write configuration",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Create the configure_dingtalk Agent tool
 */
export async function createConfigureDingTalkTool(
  _accountId: string,
): Promise<{ name: string; description: string; input_schema: any }> {
  return {
    name: "configure_dingtalk",
    description: "Configure DingTalk application credentials (appKey, appSecret, agentId)",
    input_schema: {
      type: "object",
      properties: {
        appKey: {
          type: "string",
          description: "DingTalk application AppKey",
        },
        appSecret: {
          type: "string",
          description: "DingTalk application AppSecret",
        },
        agentId: {
          type: "string",
          description: "DingTalk robot AgentId (optional)",
        },
        accountId: {
          type: "string",
          description: "Account identifier (default: 'default')",
        },
        name: {
          type: "string",
          description: "Display name for the account",
        },
      },
      required: ["appKey", "appSecret"],
    },
  };
}
