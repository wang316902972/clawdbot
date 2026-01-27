import { describe, expect, it } from "vitest";

import type { ClawdbotConfig } from "../config/config.js";
import {
  listWeChatAccountIds,
  resolveDefaultWeChatAccountId,
  resolveWeChatAccount,
} from "./accounts.js";

describe("WeChat accounts", () => {
  const createMockConfig = (overrides?: Partial<ClawdbotConfig>): ClawdbotConfig => ({
    agents: {},
    messages: {},
    channels: {
      wechat: overrides?.channels?.wechat ?? {},
    },
    ...overrides,
  });

  describe("listWeChatAccountIds", () => {
    it("should return default account when no accounts configured", () => {
      const cfg = createMockConfig();
      const ids = listWeChatAccountIds(cfg);
      expect(ids).toEqual(["default"]);
    });

    it("should return configured account IDs", () => {
      const cfg = createMockConfig({
        channels: {
          wechat: {
            accounts: {
              account1: { enabled: true },
              account2: { enabled: true },
            },
          },
        },
      });
      const ids = listWeChatAccountIds(cfg);
      expect(ids).toEqual(["account1", "account2"]);
    });

    it("should filter out empty account IDs", () => {
      const cfg = createMockConfig({
        channels: {
          wechat: {
            accounts: {
              "": { enabled: true },
              account1: { enabled: true },
              "  ": { enabled: true },
            },
          },
        },
      });
      const ids = listWeChatAccountIds(cfg);
      expect(ids).toEqual(["account1"]);
    });

    it("should normalize account IDs", () => {
      const cfg = createMockConfig({
        channels: {
          wechat: {
            accounts: {
              "Account-One": { enabled: true },
              "account_two": { enabled: true },
            },
          },
        },
      });
      const ids = listWeChatAccountIds(cfg);
      expect(ids).toEqual(["account-one", "account_two"]);
    });

    it("should sort account IDs alphabetically", () => {
      const cfg = createMockConfig({
        channels: {
          wechat: {
            accounts: {
              zulu: { enabled: true },
              alpha: { enabled: true },
              bravo: { enabled: true },
            },
          },
        },
      });
      const ids = listWeChatAccountIds(cfg);
      expect(ids).toEqual(["alpha", "bravo", "zulu"]);
    });
  });

  describe("resolveDefaultWeChatAccountId", () => {
    it("should return 'default' when it exists", () => {
      const cfg = createMockConfig({
        channels: {
          wechat: {
            accounts: {
              default: { enabled: true },
              other: { enabled: true },
            },
          },
        },
      });
      const defaultId = resolveDefaultWeChatAccountId(cfg);
      expect(defaultId).toBe("default");
    });

    it("should return first account when 'default' does not exist", () => {
      const cfg = createMockConfig({
        channels: {
          wechat: {
            accounts: {
              account1: { enabled: true },
              account2: { enabled: true },
            },
          },
        },
      });
      const defaultId = resolveDefaultWeChatAccountId(cfg);
      expect(defaultId).toBe("account1");
    });

    it("should return 'default' when no accounts configured", () => {
      const cfg = createMockConfig();
      const defaultId = resolveDefaultWeChatAccountId(cfg);
      expect(defaultId).toBe("default");
    });
  });

  describe("resolveWeChatAccount", () => {
    it("should resolve account with all fields", () => {
      const cfg = createMockConfig({
        channels: {
          wechat: {
            accounts: {
              test: {
                name: "Test Account",
                enabled: true,
                botName: "TestBot",
                puppet: "wechaty-puppet-wechat",
                dmPolicy: "pairing",
                allowFrom: ["wxid_abc123"],
                groupPolicy: "allowlist",
                textChunkLimit: 2000,
              },
            },
          },
        },
      });

      const account = resolveWeChatAccount({ cfg, accountId: "test" });
      expect(account.accountId).toBe("test");
      expect(account.name).toBe("Test Account");
      expect(account.enabled).toBe(true);
      expect(account.botName).toBe("TestBot");
      expect(account.puppet).toBe("wechaty-puppet-wechat");
      expect(account.dmPolicy).toBe("pairing");
      expect(account.allowFrom).toEqual(["wxid_abc123"]);
      expect(account.groupPolicy).toBe("allowlist");
      expect(account.textChunkLimit).toBe(2000);
    });

    it("should merge account config with base config", () => {
      const cfg = createMockConfig({
        channels: {
          wechat: {
            dmPolicy: "allowlist",
            allowFrom: ["wxid_base1"],
            accounts: {
              test: {
                name: "Test Account",
                allowFrom: ["wxid_account1"],
              },
            },
          },
        },
      });

      const account = resolveWeChatAccount({ cfg, accountId: "test" });
      expect(account.dmPolicy).toBe("allowlist");
      expect(account.allowFrom).toEqual(["wxid_account1"]);
    });

    it("should use default account when accountId not provided", () => {
      const cfg = createMockConfig({
        channels: {
          wechat: {
            accounts: {
              default: {
                name: "Default Account",
                enabled: true,
              },
            },
          },
        },
      });

      const account = resolveWeChatAccount({ cfg });
      expect(account.accountId).toBe("default");
      expect(account.name).toBe("Default Account");
    });

    it("should handle disabled accounts", () => {
      const cfg = createMockConfig({
        channels: {
          wechat: {
            enabled: false,
            accounts: {
              test: {
                enabled: true,
              },
            },
          },
        },
      });

      const account = resolveWeChatAccount({ cfg, accountId: "test" });
      expect(account.enabled).toBe(true);
    });

    it("should normalize account IDs", () => {
      const cfg = createMockConfig({
        channels: {
          wechat: {
            accounts: {
              "Test-Account": {
                name: "Test",
                enabled: true,
              },
            },
          },
        },
      });

      const account = resolveWeChatAccount({
        cfg,
        accountId: "Test-Account",
      });
      expect(account.accountId).toBe("test-account");
    });

    it("should trim string fields", () => {
      const cfg = createMockConfig({
        channels: {
          wechat: {
            accounts: {
              test: {
                name: "  Test Account  ",
                botName: " TestBot ",
                puppet: " wechaty-puppet-wechat ",
              },
            },
          },
        },
      });

      const account = resolveWeChatAccount({ cfg, accountId: "test" });
      expect(account.name).toBe("Test Account");
      expect(account.botName).toBe("TestBot");
      expect(account.puppet).toBe("wechaty-puppet-wechat");
    });
  });
});
