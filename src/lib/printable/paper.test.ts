import { describe, it, expect } from "vitest";
import {
  PAPER_SIZES,
  resolvePaperSize,
  type PaperPreset,
  type PaperSize,
} from "./paper";

describe("PAPER_SIZES", () => {
  it("defines all expected presets", () => {
    const presets: PaperPreset[] = [
      "A4",
      "A4_LANDSCAPE",
      "A3",
      "A3_LANDSCAPE",
      "LETTER",
      "LEGAL",
    ];

    for (const preset of presets) {
      expect(PAPER_SIZES[preset]).toBeDefined();
      expect(PAPER_SIZES[preset].width).toBeGreaterThan(0);
      expect(PAPER_SIZES[preset].height).toBeGreaterThan(0);
    }
  });

  it("A4 is 210x297mm", () => {
    expect(PAPER_SIZES.A4).toEqual({ name: "A4", width: 210, height: 297 });
  });

  it("A4_LANDSCAPE is 297x210mm (A4 rotated)", () => {
    expect(PAPER_SIZES.A4_LANDSCAPE.width).toBe(PAPER_SIZES.A4.height);
    expect(PAPER_SIZES.A4_LANDSCAPE.height).toBe(PAPER_SIZES.A4.width);
  });

  it("A3 is 297x420mm", () => {
    expect(PAPER_SIZES.A3).toEqual({ name: "A3", width: 297, height: 420 });
  });

  it("A3_LANDSCAPE is 420x297mm (A3 rotated)", () => {
    expect(PAPER_SIZES.A3_LANDSCAPE.width).toBe(PAPER_SIZES.A3.height);
    expect(PAPER_SIZES.A3_LANDSCAPE.height).toBe(PAPER_SIZES.A3.width);
  });

  it("LETTER is 215.9x279.4mm", () => {
    expect(PAPER_SIZES.LETTER.width).toBe(215.9);
    expect(PAPER_SIZES.LETTER.height).toBe(279.4);
  });

  it("LEGAL is 215.9x355.6mm", () => {
    expect(PAPER_SIZES.LEGAL.width).toBe(215.9);
    expect(PAPER_SIZES.LEGAL.height).toBe(355.6);
  });
});

describe("resolvePaperSize", () => {
  // ── Default behavior ──────────────────────────────────

  it("returns A4 when no argument provided", () => {
    expect(resolvePaperSize()).toEqual(PAPER_SIZES.A4);
  });

  it("returns A4 when undefined is passed", () => {
    expect(resolvePaperSize(undefined)).toEqual(PAPER_SIZES.A4);
  });

  // ── String preset resolution ──────────────────────────

  it("resolves 'A4' preset", () => {
    expect(resolvePaperSize("A4")).toEqual(PAPER_SIZES.A4);
  });

  it("resolves 'A4_LANDSCAPE' preset", () => {
    expect(resolvePaperSize("A4_LANDSCAPE")).toEqual(PAPER_SIZES.A4_LANDSCAPE);
  });

  it("resolves 'A3' preset", () => {
    expect(resolvePaperSize("A3")).toEqual(PAPER_SIZES.A3);
  });

  it("resolves 'A3_LANDSCAPE' preset", () => {
    expect(resolvePaperSize("A3_LANDSCAPE")).toEqual(PAPER_SIZES.A3_LANDSCAPE);
  });

  it("resolves 'LETTER' preset", () => {
    expect(resolvePaperSize("LETTER")).toEqual(PAPER_SIZES.LETTER);
  });

  it("resolves 'LEGAL' preset", () => {
    expect(resolvePaperSize("LEGAL")).toEqual(PAPER_SIZES.LEGAL);
  });

  it("falls back to A4 for unknown string preset", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(resolvePaperSize("UNKNOWN" as any)).toEqual(PAPER_SIZES.A4);
  });

  // ── Custom PaperSize object ───────────────────────────

  it("returns custom PaperSize object as-is", () => {
    const custom: PaperSize = { width: 100, height: 200 };
    expect(resolvePaperSize(custom)).toBe(custom);
  });

  it("returns custom PaperSize with name as-is", () => {
    const custom: PaperSize = { name: "Custom", width: 150, height: 300 };
    expect(resolvePaperSize(custom)).toBe(custom);
  });

  it("returns custom PaperSize with zero dimensions", () => {
    const custom: PaperSize = { width: 0, height: 0 };
    expect(resolvePaperSize(custom)).toBe(custom);
  });
});
