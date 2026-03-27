import { beforeEach, describe, expect, it, vi } from "vitest";
import { DocumentsService } from "./documents-service";
import { ApiClient } from "@/lib/api/api-client";

vi.mock("@/lib/api/api-client", () => ({
  ApiClient: {
    get: vi.fn(),
  },
}));

describe("DocumentsService.getExternalPrescriptionData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("원내 주사 미출력 옵션을 true로 고정하여 요청한다", async () => {
    vi.mocked(ApiClient.get).mockResolvedValueOnce({ ok: true });

    await DocumentsService.getExternalPrescriptionData("encounter-1");

    expect(ApiClient.get).toHaveBeenCalledWith(
      "/documents/encounters/encounter-1/external-prescription?isInpatientInjectionsExcluded=true"
    );
  });
});
