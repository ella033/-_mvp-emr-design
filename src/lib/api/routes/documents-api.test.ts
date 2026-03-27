import { describe, expect, it } from "vitest";
import { documentsApi } from "./documents-api";

describe("documentsApi.externalPrescription", () => {
  it("isInpatientInjectionsExcluded=true 옵션이 있으면 쿼리를 포함한다", () => {
    const route = documentsApi.externalPrescription("encounter-1", {
      isInpatientInjectionsExcluded: true,
    });

    expect(route).toBe(
      "/documents/encounters/encounter-1/external-prescription?isInpatientInjectionsExcluded=true"
    );
  });

  it("옵션이 없으면 기존 경로를 유지한다", () => {
    const route = documentsApi.externalPrescription("encounter-1");

    expect(route).toBe("/documents/encounters/encounter-1/external-prescription");
  });
});
