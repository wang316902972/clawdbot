import { describe, expect, it } from "vitest";

import {
  isWeChatGroupTarget,
  isWeChatUserTarget,
  normalizeWeChatTarget,
} from "./normalize.js";

describe("WeChat normalization", () => {
  describe("normalizeWeChatTarget", () => {
    it("should normalize wxid user IDs", () => {
      expect(normalizeWeChatTarget("wxid_abc123def456")).toBe("wxid_abc123def456");
      expect(normalizeWeChatTarget("WXID_ABC123DEF456")).toBe("wxid_abc123def456");
      expect(normalizeWeChatTarget(" wxid_abc123def456 ")).toBe("wxid_abc123def456");
    });

    it("should normalize usernames", () => {
      expect(normalizeWeChatTarget("username_123")).toBe("username_123");
      expect(normalizeWeChatTarget(" user-test ")).toBe("user-test");
      expect(normalizeWeChatTarget("simple")).toBe("simple");
    });

    it("should normalize group IDs", () => {
      expect(normalizeWeChatTarget("12345678900@chatroom")).toBe(
        "12345678900@chatroom",
      );
      expect(normalizeWeChatTarget("98765432100@CHATROOM")).toBe(
        "98765432100@chatroom",
      );
      expect(normalizeWeChatTarget(" 12345678900@chatroom ")).toBe(
        "12345678900@chatroom",
      );
    });

    it("should strip wechat: prefix", () => {
      expect(normalizeWeChatTarget("wechat:wxid_abc123")).toBe("wxid_abc123");
      expect(normalizeWeChatTarget("WECHAT:wxid_abc123")).toBe("wxid_abc123");
      expect(normalizeWeChatTarget("wechat:123@chatroom")).toBe(
        "123@chatroom",
      );
    });

    it("should return null for invalid input", () => {
      expect(normalizeWeChatTarget("")).toBeNull();
      expect(normalizeWeChatTarget("   ")).toBeNull();
    });
  });

  describe("isWeChatUserTarget", () => {
    it("should identify wxid user IDs", () => {
      expect(isWeChatUserTarget("wxid_abc123def456")).toBe(true);
      expect(isWeChatUserTarget("wx_ABC1234567890")).toBe(true);
      expect(isWeChatUserTarget("wxid_a1b2c3d4e5f6")).toBe(true);
    });

    it("should reject non-wxid IDs", () => {
      expect(isWeChatUserTarget("12345678900@chatroom")).toBe(false);
      expect(isWeChatUserTarget("username")).toBe(false);
      expect(isWeChatUserTarget("")).toBe(false);
    });

    it("should handle prefixes", () => {
      expect(isWeChatUserTarget("wechat:wxid_abc123")).toBe(true);
    });
  });

  describe("isWeChatGroupTarget", () => {
    it("should identify group IDs", () => {
      expect(isWeChatGroupTarget("12345678900@chatroom")).toBe(true);
      expect(isWeChatGroupTarget("98765432100@chatroom")).toBe(true);
      expect(isWeChatGroupTarget("1234567890123@chatroom")).toBe(true);
    });

    it("should reject non-group IDs", () => {
      expect(isWeChatGroupTarget("wxid_abc123def456")).toBe(false);
      expect(isWeChatGroupTarget("username")).toBe(false);
      expect(isWeChatGroupTarget("123@chatroom")).toBe(false); // Too short
      expect(isWeChatGroupTarget("")).toBe(false);
    });

    it("should handle prefixes", () => {
      expect(isWeChatGroupTarget("wechat:12345678900@chatroom")).toBe(true);
    });
  });
});
