import { describe, it, expect, vi, beforeEach } from "vitest";
import { showDrugInfo } from "../business-utils";

describe("showDrugInfo", () => {
  const mockOpen = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.open
    vi.stubGlobal("open", mockOpen);
    // Set window dimensions for popup position calculations
    Object.defineProperty(window, "innerHeight", {
      value: 900,
      writable: true,
    });
    Object.defineProperty(window, "screenX", {
      value: 100,
      writable: true,
    });
    Object.defineProperty(window, "screenY", {
      value: 50,
      writable: true,
    });
    Object.defineProperty(window, "outerWidth", {
      value: 1920,
      writable: true,
    });
    Object.defineProperty(window, "outerHeight", {
      value: 1080,
      writable: true,
    });
  });

  it("opens popup with correct URL for valid drug code", () => {
    showDrugInfo("ABC123");

    expect(mockOpen).toHaveBeenCalledOnce();
    const [url, target] = mockOpen.mock.calls[0];
    expect(url).toBe(
      "https://cp.druginfo.co.kr/ubcare/?type=BasicMonograph&uid=00000000&webFlag=1&id=ABC123"
    );
    expect(target).toBe("_blank");
  });

  it("passes popup features with correct dimensions", () => {
    showDrugInfo("DRUG001");

    const [, , features] = mockOpen.mock.calls[0];
    // width=920, height=min(920, 900*0.7)=630
    expect(features).toContain("width=920");
    expect(features).toContain("height=630");
    expect(features).toContain("scrollbars=yes");
    expect(features).toContain("resizable=yes");
  });

  it("calculates popup position centered on screen", () => {
    showDrugInfo("DRUG002");

    const [, , features] = mockOpen.mock.calls[0];
    // left = screenX + (outerWidth - width) / 2 = 100 + (1920 - 920) / 2 = 600
    // top = screenY + (outerHeight - height) / 2 = 50 + (1080 - 630) / 2 = 275
    expect(features).toContain("left=600");
    expect(features).toContain("top=275");
  });

  it("does not open popup when claimCode is undefined", () => {
    showDrugInfo(undefined);

    expect(mockOpen).not.toHaveBeenCalled();
  });

  it("does not open popup when claimCode is empty string", () => {
    showDrugInfo("");

    expect(mockOpen).not.toHaveBeenCalled();
  });
});
