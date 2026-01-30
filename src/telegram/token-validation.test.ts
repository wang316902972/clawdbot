import { describe, it, expect } from "vitest";
import {
  formatValidationError,
  looksLikeTelegramToken,
  maskToken,
  validateTelegramTokenFormat,
} from "./token-validation.js";

describe("validateTelegramTokenFormat", () => {
  it("accepts valid token format", () => {
    const result = validateTelegramTokenFormat("123456789:ABCdefGHIjklMNOpqrsTUVwxyz-12345678");
    expect(result.valid).toBe(true);
  });

  it("accepts token with hyphens", () => {
    const result = validateTelegramTokenFormat("123456789:ABC-defGHI_jklMNOpqrsTUVwxyz1234567");
    expect(result.valid).toBe(true);
  });

  it("accepts token with underscores", () => {
    const result = validateTelegramTokenFormat("123456789:ABC_defGHI-jklMNOpqrsTUVwxyz1234567");
    expect(result.valid).toBe(true);
  });

  it("rejects empty token", () => {
    const result = validateTelegramTokenFormat("");
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toBe("Token is empty");
      expect(result.hint).toContain("@BotFather");
    }
  });

  it("rejects token without colon", () => {
    const result = validateTelegramTokenFormat("123456789ABCdefGHIjklMNOpqrsTUVwxyz1234567890");
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain("missing colon");
    }
  });

  it("rejects token with non-numeric bot ID", () => {
    const result = validateTelegramTokenFormat("ABC123:ABCdefGHIjklMNOpqrsTUVwxyz-12345678");
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toBe("Invalid bot ID format");
    }
  });

  it("rejects token with short token string", () => {
    const result = validateTelegramTokenFormat("123456789:ABC");
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain("Invalid token string length");
      expect(result.error).toContain("expected 35");
    }
  });

  it("rejects token with long token string", () => {
    const longToken = "A".repeat(40);
    const result = validateTelegramTokenFormat(`123456789:${longToken}`);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain("Invalid token string length");
    }
  });

  it("rejects token with invalid characters in token string", () => {
    const result = validateTelegramTokenFormat("123456789:ABC.defGHI/jklMNOpqrsTUVwxyz-12abcd");
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toBe("Invalid characters in token string");
    }
  });

  it("trims whitespace before validation", () => {
    const result = validateTelegramTokenFormat("  123456789:ABCdefGHIjklMNOpqrsTUVwxyz-12345678  ");
    expect(result.valid).toBe(true);
  });
});

describe("looksLikeTelegramToken", () => {
  it("returns true for valid token", () => {
    expect(looksLikeTelegramToken("123456789:ABCdefGHIjklMNOpqrsTUVwxyz-12345678")).toBe(true);
  });

  it("returns false for token without colon", () => {
    expect(looksLikeTelegramToken("123456789ABCdefGHIjklMNOpqrsTUVwxyz1234567890")).toBe(false);
  });

  it("returns false for token with wrong length", () => {
    expect(looksLikeTelegramToken("123456789:ABC")).toBe(false);
  });

  it("returns false for token with invalid characters", () => {
    expect(looksLikeTelegramToken("123456789:ABC.defGHI/jklMN")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(looksLikeTelegramToken("")).toBe(false);
  });
});

describe("maskToken", () => {
  it("masks token with default visible characters", () => {
    const token = "123456789:ABCdefGHIjklMNOpqrsTUVwxyz-12345678";
    const masked = maskToken(token);
    expect(masked).toBe("6789:***ABCd...5678***");
  });

  it("masks token with custom visible characters", () => {
    const token = "123456789:ABCdefGHIjklMNOpqrsTUVwxyz-12345678";
    const masked = maskToken(token, 6);
    expect(masked).toBe("456789:***ABCdef...345678***");
  });

  it("handles empty token", () => {
    expect(maskToken("")).toBe("(empty)");
  });

  it("handles invalid token without colon", () => {
    expect(maskToken("invalid")).toBe("(invalid)");
  });

  it("handles short token string", () => {
    const token = "123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZ12345";
    const masked = maskToken(token);
    expect(masked).toBe("6789:***ABCD...2345***");
  });
});

describe("formatValidationError", () => {
  it("returns empty string for valid result", () => {
    const result = { valid: true };
    expect(formatValidationError(result)).toBe("");
  });

  it("formats error message with hint", () => {
    const result: ReturnType<typeof validateTelegramTokenFormat> = {
      valid: false,
      error: "Test error",
      hint: "Test hint",
    };
    const formatted = formatValidationError(result);
    expect(formatted).toContain("❌ Test error");
    expect(formatted).toContain("💡 Test hint");
    expect(formatted).toContain("Example:");
  });

  it("includes example in formatted error", () => {
    const result: ReturnType<typeof validateTelegramTokenFormat> = {
      valid: false,
      error: "Any error",
      hint: "Any hint",
    };
    const formatted = formatValidationError(result);
    expect(formatted).toContain("123456789:ABCdefGHIjklMNOpqrsTUVwxyz-12345678");
  });
});
