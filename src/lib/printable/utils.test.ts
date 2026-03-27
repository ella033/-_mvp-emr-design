import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { mmToPx, mmValue, resolveMargin, createRepeatedRenderer } from "./utils";

// ── mmToPx ──────────────────────────────────────────────

describe("mmToPx", () => {
  const DPI = 96;
  const MM_PER_INCH = 25.4;

  it("converts 0mm to 0px", () => {
    expect(mmToPx(0)).toBe(0);
  });

  it("converts 25.4mm (1 inch) to 96px", () => {
    expect(mmToPx(25.4)).toBeCloseTo(96, 5);
  });

  it("converts 210mm (A4 width) correctly", () => {
    expect(mmToPx(210)).toBeCloseTo((210 / MM_PER_INCH) * DPI, 5);
  });

  it("handles fractional values", () => {
    expect(mmToPx(12.7)).toBeCloseTo(48, 5); // half inch
  });

  it("handles negative values", () => {
    expect(mmToPx(-25.4)).toBeCloseTo(-96, 5);
  });
});

// ── mmValue ─────────────────────────────────────────────

describe("mmValue", () => {
  it("formats integer as mm string", () => {
    expect(mmValue(210)).toBe("210mm");
  });

  it("formats 0 as mm string", () => {
    expect(mmValue(0)).toBe("0mm");
  });

  it("formats fractional value as mm string", () => {
    expect(mmValue(215.9)).toBe("215.9mm");
  });

  it("formats negative value as mm string", () => {
    expect(mmValue(-10)).toBe("-10mm");
  });
});

// ── resolveMargin ───────────────────────────────────────

describe("resolveMargin", () => {
  it("returns default margins (15mm each) when undefined", () => {
    const result = resolveMargin(undefined);
    expect(result.top).toBe(15);
    expect(result.right).toBe(15);
    expect(result.bottom).toBe(15);
    expect(result.left).toBe(15);
  });

  it("returns default margins when empty object", () => {
    const result = resolveMargin({});
    expect(result.top).toBe(15);
    expect(result.right).toBe(15);
    expect(result.bottom).toBe(15);
    expect(result.left).toBe(15);
  });

  it("overrides only specified margins", () => {
    const result = resolveMargin({ top: 10, left: 20 });
    expect(result.top).toBe(10);
    expect(result.right).toBe(15); // default
    expect(result.bottom).toBe(15); // default
    expect(result.left).toBe(20);
  });

  it("overrides all margins", () => {
    const result = resolveMargin({
      top: 5,
      right: 10,
      bottom: 15,
      left: 20,
    });
    expect(result.top).toBe(5);
    expect(result.right).toBe(10);
    expect(result.bottom).toBe(15);
    expect(result.left).toBe(20);
  });

  it("handles zero margin values", () => {
    const result = resolveMargin({ top: 0, right: 0, bottom: 0, left: 0 });
    expect(result.top).toBe(0);
    expect(result.right).toBe(0);
    expect(result.bottom).toBe(0);
    expect(result.left).toBe(0);
  });

  it("includes px conversions for all margins", () => {
    const result = resolveMargin({ top: 25.4, right: 25.4, bottom: 25.4, left: 25.4 });
    expect(result.px.top).toBeCloseTo(96, 5);
    expect(result.px.right).toBeCloseTo(96, 5);
    expect(result.px.bottom).toBeCloseTo(96, 5);
    expect(result.px.left).toBeCloseTo(96, 5);
  });

  it("px defaults match mm defaults converted", () => {
    const result = resolveMargin();
    expect(result.px.top).toBeCloseTo(mmToPx(15), 5);
    expect(result.px.right).toBeCloseTo(mmToPx(15), 5);
    expect(result.px.bottom).toBeCloseTo(mmToPx(15), 5);
    expect(result.px.left).toBeCloseTo(mmToPx(15), 5);
  });
});

// ── createRepeatedRenderer ──────────────────────────────

describe("createRepeatedRenderer", () => {
  it("returns null when renderer is undefined", () => {
    const render = createRepeatedRenderer(undefined);
    expect(render()).toBeNull();
  });

  it("returns null when renderer function returns null", () => {
    const render = createRepeatedRenderer(() => null);
    expect(render()).toBeNull();
  });

  it("returns null when renderer function returns undefined", () => {
    const render = createRepeatedRenderer(() => undefined);
    expect(render()).toBeNull();
  });

  it("wraps string ReactNode in span with display:contents", () => {
    const render = createRepeatedRenderer("Hello");
    const result = render("key-1");
    expect(result).not.toBeNull();
    // String renderer gets wrapped in a span
    expect(result).toMatchObject({
      type: "span",
      props: {
        children: "Hello",
        style: { display: "contents" },
      },
    });
  });

  it("wraps number ReactNode in span with display:contents", () => {
    const render = createRepeatedRenderer(42);
    const result = render("key-1");
    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      type: "span",
      props: {
        children: 42,
        style: { display: "contents" },
      },
    });
  });

  it("clones valid React element with provided key", () => {
    const element = createElement("div", null, "Content");
    const render = createRepeatedRenderer(element);
    const result = render("my-key");
    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      type: "div",
      key: "my-key",
    });
  });

  it("clones element keeping original key when no key provided", () => {
    const element = createElement("div", { key: "original" }, "Content");
    const render = createRepeatedRenderer(element);
    const result = render();
    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      key: "original",
    });
  });

  it("handles renderer as a function returning React element", () => {
    const render = createRepeatedRenderer(() =>
      createElement("p", null, "Dynamic"),
    );
    const result = render("fn-key");
    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      type: "p",
      key: "fn-key",
    });
  });

  it("handles renderer as a function returning string", () => {
    const render = createRepeatedRenderer(() => "function text");
    const result = render("fn-key");
    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      type: "span",
      props: {
        children: "function text",
        style: { display: "contents" },
      },
    });
  });

  it("can be called multiple times with different keys", () => {
    const element = createElement("header", null, "Header");
    const render = createRepeatedRenderer(element);

    const r1 = render("k1");
    const r2 = render("k2");
    const r3 = render("k3");

    expect(r1).toMatchObject({ key: "k1" });
    expect(r2).toMatchObject({ key: "k2" });
    expect(r3).toMatchObject({ key: "k3" });
  });
});
