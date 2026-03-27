import { describe, it, expect } from "vitest";
import {
  getEnumFromDescription,
  getEnumFromDescriptionOrThrow,
  isValidEnumDescription,
  getAllEnumDescriptions,
} from "../enum-utils";

const TestMapping = { 활성: 1, 비활성: 0, 대기: 2 } as const;

describe("getEnumFromDescription", () => {
  it("returns the mapped value for a valid description", () => {
    expect(getEnumFromDescription(TestMapping, "활성", 0)).toBe(1);
  });

  it("returns the mapped value for another valid description", () => {
    expect(getEnumFromDescription(TestMapping, "대기", 0)).toBe(2);
  });

  it("returns default value for an unknown description", () => {
    expect(getEnumFromDescription(TestMapping, "삭제", 99)).toBe(99);
  });

  it("returns default when description maps to falsy value (0)", () => {
    // Note: current implementation uses || so 0 falls through to default
    expect(getEnumFromDescription(TestMapping, "비활성", 99)).toBe(99);
  });
});

describe("getEnumFromDescriptionOrThrow", () => {
  it("returns the mapped value for a valid description", () => {
    expect(getEnumFromDescriptionOrThrow(TestMapping, "활성", "TestEnum")).toBe(
      1
    );
  });

  it("returns the mapped value for '대기'", () => {
    expect(getEnumFromDescriptionOrThrow(TestMapping, "대기", "TestEnum")).toBe(
      2
    );
  });

  it("throws an error for an unknown description", () => {
    expect(() =>
      getEnumFromDescriptionOrThrow(TestMapping, "삭제", "TestEnum")
    ).toThrow("Not Found - Type: TestEnum, Description: 삭제");
  });
});

describe("isValidEnumDescription", () => {
  it("returns true for a valid description", () => {
    expect(isValidEnumDescription(TestMapping, "활성")).toBe(true);
  });

  it("returns true for '비활성'", () => {
    expect(isValidEnumDescription(TestMapping, "비활성")).toBe(true);
  });

  it("returns false for an unknown description", () => {
    expect(isValidEnumDescription(TestMapping, "삭제")).toBe(false);
  });

  it("returns false for an empty string", () => {
    expect(isValidEnumDescription(TestMapping, "")).toBe(false);
  });
});

describe("getAllEnumDescriptions", () => {
  it("returns all description keys", () => {
    const descriptions = getAllEnumDescriptions(TestMapping);
    expect(descriptions).toEqual(["활성", "비활성", "대기"]);
  });

  it("returns the correct number of descriptions", () => {
    expect(getAllEnumDescriptions(TestMapping)).toHaveLength(3);
  });

  it("returns an empty array for an empty mapping", () => {
    expect(getAllEnumDescriptions({})).toEqual([]);
  });
});
