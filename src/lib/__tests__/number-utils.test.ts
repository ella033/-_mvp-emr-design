import { describe, it, expect } from "vitest";
import { formatNumberWithComma, parseNumberInput } from "../number-utils";

describe("formatNumberWithComma", () => {
  it("formats number 1000 with comma", () => {
    expect(formatNumberWithComma(1000)).toBe("1,000");
  });

  it("formats number 1000000 with commas", () => {
    expect(formatNumberWithComma(1000000)).toBe("1,000,000");
  });

  it("formats string '1000' with comma", () => {
    expect(formatNumberWithComma("1000")).toBe("1,000");
  });

  it("formats zero as '0'", () => {
    expect(formatNumberWithComma(0)).toBe("0");
  });

  it("formats negative numbers", () => {
    expect(formatNumberWithComma(-1000)).toBe("-1,000");
  });

  it("formats decimal numbers", () => {
    expect(formatNumberWithComma(1234.56)).toBe("1,234.56");
  });

  it("returns empty string for null", () => {
    expect(formatNumberWithComma(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(formatNumberWithComma(undefined)).toBe("");
  });

  it("returns empty string for empty string", () => {
    expect(formatNumberWithComma("")).toBe("");
  });

  it("returns empty string for non-numeric string", () => {
    expect(formatNumberWithComma("abc")).toBe("");
  });

  it("handles string with existing commas", () => {
    expect(formatNumberWithComma("1,000,000")).toBe("1,000,000");
  });

  it("formats small numbers without commas", () => {
    expect(formatNumberWithComma(999)).toBe("999");
  });
});

describe("parseNumberInput", () => {
  it("parses '1,000' to 1000", () => {
    expect(parseNumberInput("1,000")).toBe(1000);
  });

  it("parses '1,000,000' to 1000000", () => {
    expect(parseNumberInput("1,000,000")).toBe(1000000);
  });

  it("parses plain number string", () => {
    expect(parseNumberInput("500")).toBe(500);
  });

  it("returns 0 for empty string", () => {
    expect(parseNumberInput("")).toBe(0);
  });

  it("returns 0 for non-numeric string", () => {
    expect(parseNumberInput("abc")).toBe(0);
  });

  it("parses negative number string", () => {
    expect(parseNumberInput("-1,000")).toBe(-1000);
  });

  it("parses decimal string with commas", () => {
    expect(parseNumberInput("1,234.56")).toBe(1234.56);
  });
});
