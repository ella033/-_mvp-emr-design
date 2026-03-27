import { describe, it, expect } from "vitest";
import {
  cloneSetting,
  serializeSetting,
  recordToLocal,
  buildDto,
  getPrinterLabel,
  shouldShowTraySelect,
  isLabelType,
  getLabelOptions,
  isLabelOptionsValid,
  detectContentType,
  generateFileName,
  createTestPdfBase64,
  CLEAR_VALUE,
  LABEL_TYPE_CODES,
} from "./basic-printer-settings";
import type { LocalSetting } from "./basic-printer-settings";

const baseLocalSetting: LocalSetting = {
  outputTypeCode: "LABEL",
  printerId: "p1",
  paperTrayCode: null,
  paperTypeCode: null,
  usePrescriptionForm: false,
  labelSizeCode: null,
  orientation: null,
  duplexMode: null,
  copies: 1,
  isEnabled: true,
  options: { labelWidthMm: 40, labelHeightMm: 30, autoCut: true, top2bottom: false },
};

describe("basic-printer-settings model", () => {
  describe("cloneSetting", () => {
    it("동일한 값을 가진 새 객체를 반환한다", () => {
      const cloned = cloneSetting(baseLocalSetting);
      expect(cloned).not.toBe(baseLocalSetting);
      expect(cloned).toEqual(baseLocalSetting);
      expect(cloned.options).not.toBe(baseLocalSetting.options);
      expect(cloned.options).toEqual(baseLocalSetting.options);
    });
  });

  describe("serializeSetting", () => {
    it("동일 설정이면 동일한 문자열을 반환한다", () => {
      const a = serializeSetting(baseLocalSetting);
      const b = serializeSetting(cloneSetting(baseLocalSetting));
      expect(a).toBe(b);
    });
    it("options가 바뀌면 다른 문자열을 반환한다", () => {
      const withOpts = { ...baseLocalSetting, options: { labelWidthMm: 50 } };
      expect(serializeSetting(baseLocalSetting)).not.toBe(serializeSetting(withOpts));
    });
  });

  describe("recordToLocal", () => {
    it("null record면 code만 채운 기본 로컬 설정을 반환한다", () => {
      const local = recordToLocal(null, "EXAM_LABEL");
      expect(local.outputTypeCode).toBe("EXAM_LABEL");
      expect(local.printerId).toBeNull();
      expect(local.copies).toBe(1);
      expect(local.isEnabled).toBe(true);
      expect(local.usePrescriptionForm).toBe(false);
    });
    it("record가 있으면 해당 값으로 채운다", () => {
      const local = recordToLocal(
        {
          outputTypeCode: "X",
          printerId: "pid",
          paperTrayCode: "tray",
          paperTypeCode: "A4",
          usePrescriptionForm: true,
          labelSizeCode: null,
          orientation: null,
          duplexMode: null,
          copies: 2,
          isEnabled: false,
          options: { a: 1 },
        } as any,
        "CODE"
      );
      expect(local.outputTypeCode).toBe("CODE");
      expect(local.printerId).toBe("pid");
      expect(local.copies).toBe(2);
      expect(local.isEnabled).toBe(false);
      expect(local.usePrescriptionForm).toBe(true);
      expect(local.options).toEqual({ a: 1 });
    });
  });

  describe("buildDto", () => {
    it("LocalSetting을 PrinterSettingItemDto 형태로 변환한다", () => {
      const dto = buildDto(baseLocalSetting);
      expect(dto.outputTypeCode).toBe(baseLocalSetting.outputTypeCode);
      expect(dto.printerId).toBe(baseLocalSetting.printerId);
      expect(dto.usePrescriptionForm).toBe(false);
      // LABEL 타입이므로 buildDto가 density 등 기본값을 병합한다
      expect(dto.options).toEqual({
        ...baseLocalSetting.options,
        density: 10, // DEFAULT_LABEL_OPTIONS.density
      });
    });
  });

  describe("getPrinterLabel", () => {
    it("displayName이 있으면 '별칭 (name)' 형식으로 반환한다", () => {
      expect(
        getPrinterLabel({ id: "1", name: "Printer1", displayName: "내 프린터" } as any)
      ).toBe("내 프린터 (Printer1)");
    });
    it("displayName이 없으면 name만 반환한다", () => {
      expect(getPrinterLabel({ id: "1", name: "Printer1" } as any)).toBe("Printer1");
    });
  });

  describe("shouldShowTraySelect", () => {
    it("printerId와 suggestedTrays가 있으면 true", () => {
      expect(shouldShowTraySelect("p1", ["Tray1"])).toBe(true);
    });
    it("printerId가 없으면 false", () => {
      expect(shouldShowTraySelect(null, ["Tray1"])).toBe(false);
    });
    it("suggestedTrays가 비어 있으면 false", () => {
      expect(shouldShowTraySelect("p1", [])).toBe(false);
    });
  });

  describe("isLabelType", () => {
    it("LABEL이면 true", () => {
      expect(isLabelType("LABEL")).toBe(true);
    });
    it("EXAM_LABEL이면 true", () => {
      expect(isLabelType("EXAM_LABEL")).toBe(true);
    });
    it("그 외 코드면 false", () => {
      expect(isLabelType("CERTIFICATE")).toBe(false);
      expect(isLabelType("")).toBe(false);
    });
  });

  describe("getLabelOptions", () => {
    it("options에서 labelWidthMm, labelHeightMm, density, autoCut, top2bottom을 읽는다", () => {
      const opts = getLabelOptions(baseLocalSetting);
      expect(opts.labelWidthMm).toBe(40);
      expect(opts.labelHeightMm).toBe(30);
      expect(opts.density).toBe(10); // options에 없으면 기본 10
      expect(opts.autoCut).toBe(true);
      expect(opts.top2bottom).toBe(false);
    });
    it("options가 없으면 기본값(40, 25, 10, true, false)을 반환한다", () => {
      const opts = getLabelOptions({ ...baseLocalSetting, options: null });
      expect(opts.labelWidthMm).toBe(40);
      expect(opts.labelHeightMm).toBe(25);
      expect(opts.density).toBe(10);
      expect(opts.autoCut).toBe(true);
      expect(opts.top2bottom).toBe(false);
    });
  });

  describe("isLabelOptionsValid", () => {
    it("가로·세로가 양수 숫자면 true", () => {
      expect(isLabelOptionsValid({ labelWidthMm: 40, labelHeightMm: 30, density: 10, autoCut: false, top2bottom: false })).toBe(true);
    });
    it("labelWidthMm가 0 이하면 false", () => {
      expect(isLabelOptionsValid({ labelWidthMm: 0, labelHeightMm: 30, density: 10, autoCut: false, top2bottom: false })).toBe(false);
      // null은 DEFAULT_LABEL_OPTIONS.labelWidthMm(=40)으로 대체되므로 true
      expect(isLabelOptionsValid({ labelWidthMm: null, labelHeightMm: 30, density: 10, autoCut: false, top2bottom: false })).toBe(true);
    });
    it("labelHeightMm가 0 이하면 false", () => {
      expect(isLabelOptionsValid({ labelWidthMm: 40, labelHeightMm: 0, density: 10, autoCut: false, top2bottom: false })).toBe(false);
    });
  });

  describe("detectContentType", () => {
    it("URL 확장자에 따라 contentType과 extension을 반환한다", () => {
      expect(detectContentType("https://x/file.pdf")).toEqual({
        contentType: "application/pdf",
        extension: "pdf",
      });
      expect(detectContentType("https://x/file.PNG")).toEqual({
        contentType: "image/png",
        extension: "png",
      });
      expect(detectContentType("https://x/file.jpg")).toEqual({
        contentType: "image/jpeg",
        extension: "jpg",
      });
    });
  });

  describe("generateFileName", () => {
    it("테스트명과 확장자로 오늘 날짜(YYYYMMDD)를 포함한 파일명을 반환한다", () => {
      const name = generateFileName("라벨", "pdf");
      expect(name).toMatch(/^라벨-\d{8}\.pdf$/);
    });
  });

  describe("createTestPdfBase64", () => {
    it("유효한 PDF base64 문자열을 반환한다", () => {
      const b64 = createTestPdfBase64("테스트");
      expect(typeof b64).toBe("string");
      expect(b64.length).toBeGreaterThan(0);
      const decoded = atob(b64);
      expect(decoded).toContain("%PDF");
    });
  });

  describe("constants", () => {
    it("CLEAR_VALUE와 LABEL_TYPE_CODES가 정의되어 있다", () => {
      expect(CLEAR_VALUE).toBe("__NONE__");
      expect(LABEL_TYPE_CODES).toContain("LABEL");
      expect(LABEL_TYPE_CODES).toContain("EXAM_LABEL");
    });
  });
});
