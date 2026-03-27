import { describe, it, expect, vi } from "vitest";
import {
  validateProductData,
  validateId,
  validatePasswordComplexity,
} from "../validation";

// Mock ApiError from @/lib/api/api-proxy
vi.mock("@/lib/api/api-proxy", () => ({
  ApiError: class ApiError extends Error {
    public status: number;
    constructor(message: string, status: number) {
      super(message);
      this.name = "ApiError";
      this.status = status;
    }
  },
}));

describe("validateProductData", () => {
  it("returns no errors for valid product data", () => {
    const product = { name: "Test Product", price: 100, category: "Food" };
    expect(validateProductData(product)).toEqual([]);
  });

  it("returns error when name is missing", () => {
    const product = { price: 100, category: "Food" };
    const errors = validateProductData(product);
    expect(errors).toContain("Name is required");
  });

  it("returns error when name is not a string", () => {
    const product = { name: 123, price: 100, category: "Food" };
    const errors = validateProductData(product);
    expect(errors).toContain("Name is required");
  });

  it("returns error when price is missing", () => {
    const product = { name: "Test", category: "Food" };
    const errors = validateProductData(product);
    expect(errors).toContain("Valid price is required");
  });

  it("returns error when price is zero", () => {
    const product = { name: "Test", price: 0, category: "Food" };
    const errors = validateProductData(product);
    expect(errors).toContain("Valid price is required");
  });

  it("returns error when price is negative", () => {
    const product = { name: "Test", price: -10, category: "Food" };
    const errors = validateProductData(product);
    expect(errors).toContain("Valid price is required");
  });

  it("returns error when category is missing", () => {
    const product = { name: "Test", price: 100 };
    const errors = validateProductData(product);
    expect(errors).toContain("Category is required");
  });

  it("returns multiple errors for empty object", () => {
    const errors = validateProductData({});
    expect(errors).toHaveLength(3);
    expect(errors).toContain("Name is required");
    expect(errors).toContain("Valid price is required");
    expect(errors).toContain("Category is required");
  });
});

describe("validateId", () => {
  it("returns string id for valid string input", () => {
    expect(validateId("123", "userId")).toBe("123");
  });

  it("returns string id for valid number input", () => {
    expect(validateId(42, "userId")).toBe("42");
  });

  it("throws for empty string", () => {
    expect(() => validateId("", "userId")).toThrow("userId is required");
  });

  it("throws for whitespace-only string", () => {
    expect(() => validateId("   ", "userId")).toThrow("userId cannot be empty");
  });

  it("throws for NaN number", () => {
    expect(() => validateId(NaN, "userId")).toThrow(
      "userId must be a valid positive number"
    );
  });

  it("throws for zero", () => {
    expect(() => validateId(0, "userId")).toThrow(
      "userId must be a valid positive number"
    );
  });

  it("throws for negative number", () => {
    expect(() => validateId(-1, "userId")).toThrow(
      "userId must be a valid positive number"
    );
  });
});

describe("validatePasswordComplexity", () => {
  it("returns false for lowercase only (1 type)", () => {
    expect(validatePasswordComplexity("abc")).toBe(false);
  });

  it("returns false for upper + lower only (2 types)", () => {
    expect(validatePasswordComplexity("abcDEF")).toBe(false);
  });

  it("returns true for lower + upper + digits (3 types)", () => {
    expect(validatePasswordComplexity("abcDEF123")).toBe(true);
  });

  it("returns true for lower + digits + special (3 types)", () => {
    expect(validatePasswordComplexity("abc123!@#")).toBe(true);
  });

  it("returns true for all 4 types", () => {
    expect(validatePasswordComplexity("Ab1!")).toBe(true);
  });

  it("returns false for digits only (1 type)", () => {
    expect(validatePasswordComplexity("123456")).toBe(false);
  });

  it("returns false for special chars only (1 type)", () => {
    expect(validatePasswordComplexity("!@#$%^")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(validatePasswordComplexity("")).toBe(false);
  });

  it("returns true for upper + digits + special (3 types)", () => {
    expect(validatePasswordComplexity("ABC123!@#")).toBe(true);
  });
});
