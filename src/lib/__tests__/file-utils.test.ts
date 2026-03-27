import { describe, it, expect, vi, beforeEach } from "vitest";

// ================================ Mocks (hoisted) ================================

const { mockFileApi } = vi.hoisted(() => ({
  mockFileApi: {
    downloadV2: vi.fn((uuid: string) => `/v2/file-uploads/${uuid}`),
  },
}));

vi.mock("@/lib/api/api-routes", () => ({
  fileApi: mockFileApi,
}));

vi.mock("@/lib/config", () => ({
  config: {
    apiProxyPath: "/api",
  },
}));

// ================================ Imports ================================

import { getFileUrl, blobToBase64 } from "../file-utils";

// ================================ getFileUrl ================================

describe("getFileUrl", () => {
  beforeEach(() => {
    mockFileApi.downloadV2.mockClear();
  });

  it("returns full download URL when uuid is provided", () => {
    const result = getFileUrl("abc-123");
    expect(result).toBe("/api/v2/file-uploads/abc-123");
    expect(mockFileApi.downloadV2).toHaveBeenCalledWith("abc-123");
  });

  it("returns undefined when uuid is undefined", () => {
    expect(getFileUrl(undefined)).toBeUndefined();
  });

  it("returns undefined when uuid is empty string", () => {
    expect(getFileUrl("")).toBeUndefined();
  });

  it("builds URL using config.apiProxyPath and fileApi.downloadV2", () => {
    const result = getFileUrl("test-uuid-456");
    expect(result).toBe("/api/v2/file-uploads/test-uuid-456");
  });
});

// ================================ blobToBase64 ================================

describe("blobToBase64", () => {
  it("converts a text blob to a base64 data URL", async () => {
    const blob = new Blob(["hello world"], { type: "text/plain" });
    const result = await blobToBase64(blob);
    expect(result).toMatch(/^data:text\/plain;base64,/);
  });

  it("converts an empty blob to a base64 data URL", async () => {
    const blob = new Blob([], { type: "application/octet-stream" });
    const result = await blobToBase64(blob);
    expect(typeof result).toBe("string");
  });

  it("converts a binary blob to a base64 data URL", async () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    const blob = new Blob([bytes], { type: "image/png" });
    const result = await blobToBase64(blob);
    expect(result).toMatch(/^data:image\/png;base64,/);
  });

  it("rejects when FileReader encounters an error", async () => {
    // Create a blob and override FileReader to simulate error
    const blob = new Blob(["test"]);

    const OriginalFileReader = globalThis.FileReader;
    const mockError = new Error("Read failed");

    class MockFileReader {
      onloadend: (() => void) | null = null;
      onerror: ((err: any) => void) | null = null;
      result: string | null = null;

      readAsDataURL() {
        // Simulate async error
        setTimeout(() => {
          if (this.onerror) {
            this.onerror(mockError);
          }
        }, 0);
      }
    }

    globalThis.FileReader = MockFileReader as any;

    try {
      await expect(blobToBase64(blob)).rejects.toEqual(mockError);
    } finally {
      globalThis.FileReader = OriginalFileReader;
    }
  });
});
