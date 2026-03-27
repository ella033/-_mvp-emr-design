import { describe, expect, it } from "vitest";
import { comparePositionString } from "../sort-position";

describe("comparePositionString", () => {
  describe("basic ordering: digits → uppercase → lowercase", () => {
    it("digits before uppercase", () => {
      expect(comparePositionString("1", "A")).toBeLessThan(0);
      expect(comparePositionString("9", "A")).toBeLessThan(0);
      expect(comparePositionString("0", "Z")).toBeLessThan(0);
    });

    it("uppercase before lowercase", () => {
      expect(comparePositionString("A", "a")).toBeLessThan(0);
      expect(comparePositionString("Z", "a")).toBeLessThan(0);
      expect(comparePositionString("Z", "z")).toBeLessThan(0);
    });

    it("digits before lowercase", () => {
      expect(comparePositionString("0", "a")).toBeLessThan(0);
      expect(comparePositionString("9", "z")).toBeLessThan(0);
    });
  });

  describe("same strings", () => {
    it("returns 0 for identical strings", () => {
      expect(comparePositionString("abc", "abc")).toBe(0);
      expect(comparePositionString("ABC", "ABC")).toBe(0);
      expect(comparePositionString("123", "123")).toBe(0);
      expect(comparePositionString("aB1", "aB1")).toBe(0);
    });
  });

  describe("different lengths", () => {
    it("shorter string comes first when it is a prefix", () => {
      expect(comparePositionString("ab", "abc")).toBeLessThan(0);
      expect(comparePositionString("A", "AB")).toBeLessThan(0);
      expect(comparePositionString("1", "12")).toBeLessThan(0);
    });

    it("longer string comes after when it extends the prefix", () => {
      expect(comparePositionString("abc", "ab")).toBeGreaterThan(0);
    });
  });

  describe("number strings", () => {
    it("sorts number strings by character code", () => {
      expect(comparePositionString("123", "ABC")).toBeLessThan(0);
      expect(comparePositionString("3", "6")).toBeLessThan(0);
      expect(comparePositionString("6", "9")).toBeLessThan(0);
    });
  });

  describe("mixed case comparisons", () => {
    it("A1 < a1 (uppercase before lowercase at first char)", () => {
      expect(comparePositionString("A1", "a1")).toBeLessThan(0);
    });

    it("a1 > A1", () => {
      expect(comparePositionString("a1", "A1")).toBeGreaterThan(0);
    });

    it("Z < z", () => {
      expect(comparePositionString("Z", "z")).toBeLessThan(0);
    });

    it("z > Z", () => {
      expect(comparePositionString("z", "Z")).toBeGreaterThan(0);
    });
  });

  describe("empty strings", () => {
    it("empty string comes before any non-empty string", () => {
      expect(comparePositionString("", "a")).toBeLessThan(0);
      expect(comparePositionString("", "A")).toBeLessThan(0);
      expect(comparePositionString("", "1")).toBeLessThan(0);
    });

    it("non-empty string comes after empty string", () => {
      expect(comparePositionString("a", "")).toBeGreaterThan(0);
    });

    it("two empty strings are equal", () => {
      expect(comparePositionString("", "")).toBe(0);
    });
  });

  describe("full sorting example from docstring", () => {
    it('sorts as "3" < "6" < "9" < "C" < "U" < "V0" < "a" < "d"', () => {
      const input = ["d", "U", "9", "a", "3", "V0", "C", "6"];
      const sorted = input.sort(comparePositionString);
      expect(sorted).toEqual(["3", "6", "9", "C", "U", "V0", "a", "d"]);
    });
  });
});
