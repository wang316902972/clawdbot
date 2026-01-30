import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getWebhookInfo, testTelegramToken } from "./bot-api.js";

describe("testTelegramToken", () => {
  let originalFetch: typeof fetch;
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("successfully validates a valid token", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ok: true,
          result: {
            id: 123456789,
            is_bot: true,
            first_name: "TestBot",
            username: "test_bot",
            can_join_groups: true,
            can_read_all_group_messages: false,
            supports_inline_queries: false,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const result = await testTelegramToken("123456789:ABCdefGHIjklMNOpqrsTUVwxyz-12345678");

    expect(result.valid).toBe(true);
    expect(result.bot).toBeDefined();
    expect(result.bot?.id).toBe(123456789);
    expect(result.bot?.username).toBe("test_bot");
    expect(result.bot?.firstName).toBe("TestBot");
  });

  it("returns error for invalid token (401)", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: false, description: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await testTelegramToken("invalid_token");

    expect(result.valid).toBe(false);
    expect(result.errorType).toBe("unauthorized");
    expect(result.error).toContain("invalid");
  });

  it("returns error for forbidden bot (403)", async () => {
    fetchSpy.mockResolvedValueOnce(new Response(null, { status: 403 }));

    const result = await testTelegramToken("forbidden_token");

    expect(result.valid).toBe(false);
    expect(result.errorType).toBe("forbidden");
    expect(result.error).toContain("blocked");
  });

  it("returns error for not found bot (404)", async () => {
    fetchSpy.mockResolvedValueOnce(new Response(null, { status: 404 }));

    const result = await testTelegramToken("not_found_token");

    expect(result.valid).toBe(false);
    expect(result.errorType).toBe("unauthorized");
    expect(result.error).toContain("not found");
  });

  it("handles network error", async () => {
    fetchSpy.mockRejectedValueOnce(new Error("Failed to fetch"));

    const result = await testTelegramToken("network_error_token");

    expect(result.valid).toBe(false);
    expect(result.errorType).toBe("network");
    expect(result.error).toContain("Network error");
  });

  it("handles timeout", async () => {
    fetchSpy.mockImplementationOnce(
      () =>
        new Promise((_, reject) =>
          setTimeout(() => {
            const error = new Error("The operation was aborted.");
            error.name = "AbortError";
            reject(error);
          }, 100),
        ),
    );

    const result = await testTelegramToken("timeout_token", 50);

    expect(result.valid).toBe(false);
    expect(result.errorType).toBe("timeout");
    expect(result.error).toContain("timed out");
  });

  it("handles Telegram API error response", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ok: false,
          description: "Bot was blocked by the user",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const result = await testTelegramToken("blocked_token");

    expect(result.valid).toBe(false);
    expect(result.errorType).toBe("unauthorized");
    expect(result.error).toBe("Bot was blocked by the user");
  });

  it("uses default timeout of 10 seconds", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ok: true,
          result: {
            id: 123456789,
            is_bot: true,
            first_name: "TestBot",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const startTime = Date.now();
    await testTelegramToken("valid_token");
    const elapsedTime = Date.now() - startTime;

    expect(elapsedTime).toBeLessThan(1000); // Should complete quickly
  });
});

describe("getWebhookInfo", () => {
  let originalFetch: typeof fetch;
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("successfully retrieves webhook info", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ok: true,
          result: {
            url: "https://example.com/webhook",
            has_custom_certificate: false,
            pending_update_count: 0,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const result = await getWebhookInfo("123456789:ABCdefGHIjklMNOpqrsTUVwxyz-12345678");

    expect(result.success).toBe(true);
    expect(result.webhookUrl).toBe("https://example.com/webhook");
    expect(result.hasCustomCertificate).toBe(false);
    expect(result.pendingUpdateCount).toBe(0);
  });

  it("handles webhook not set", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ok: true,
          result: {
            url: "",
            has_custom_certificate: false,
            pending_update_count: 5,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const result = await getWebhookInfo("valid_token");

    expect(result.success).toBe(true);
    expect(result.webhookUrl).toBe("");
  });

  it("handles API error", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ok: false,
          description: "Unauthorized: invalid token",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const result = await getWebhookInfo("invalid_token");

    expect(result.success).toBe(false);
    expect(result.error).toContain("Unauthorized");
  });

  it("handles network error", async () => {
    fetchSpy.mockRejectedValueOnce(new Error("Network error"));

    const result = await getWebhookInfo("network_error_token");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Network error");
  });

  it("handles timeout", async () => {
    fetchSpy.mockImplementationOnce(
      () =>
        new Promise((_, reject) =>
          setTimeout(() => {
            const error = new Error("The operation was aborted.");
            error.name = "AbortError";
            reject(error);
          }, 100),
        ),
    );

    const result = await getWebhookInfo("timeout_token", 50);

    expect(result.success).toBe(false);
    expect(result.error).toContain("timed out after 50ms");
  });
});
