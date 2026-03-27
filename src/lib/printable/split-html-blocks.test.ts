import { describe, it, expect } from "vitest";
import { splitHtmlIntoBlocks } from "./split-html-blocks";

describe("splitHtmlIntoBlocks", () => {
  // ── Null / empty / invalid inputs ──────────────────────

  it("returns [] for empty string", () => {
    expect(splitHtmlIntoBlocks("")).toEqual([]);
  });

  it("returns [] for whitespace-only string", () => {
    expect(splitHtmlIntoBlocks("   \n\t  ")).toEqual([]);
  });

  it("returns [] for null input", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(splitHtmlIntoBlocks(null as any)).toEqual([]);
  });

  it("returns [] for undefined input", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(splitHtmlIntoBlocks(undefined as any)).toEqual([]);
  });

  it("returns [] for non-string input", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(splitHtmlIntoBlocks(123 as any)).toEqual([]);
  });

  // ── Single block elements ─────────────────────────────

  it("returns single <p> element as-is", () => {
    const html = "<p>Hello world</p>";
    const result = splitHtmlIntoBlocks(html);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe("<p>Hello world</p>");
  });

  it("returns single <div> element as-is", () => {
    const html = "<div>Content</div>";
    const result = splitHtmlIntoBlocks(html);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe("<div>Content</div>");
  });

  it("returns single heading element", () => {
    const html = "<h1>Title</h1>";
    const result = splitHtmlIntoBlocks(html);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe("<h1>Title</h1>");
  });

  // ── Multiple block elements ───────────────────────────

  it("splits multiple <p> elements into separate blocks", () => {
    const html = "<p>First</p><p>Second</p><p>Third</p>";
    const result = splitHtmlIntoBlocks(html);
    expect(result).toHaveLength(3);
    expect(result[0]).toBe("<p>First</p>");
    expect(result[1]).toBe("<p>Second</p>");
    expect(result[2]).toBe("<p>Third</p>");
  });

  it("splits mixed block elements", () => {
    const html = "<h1>Title</h1><p>Paragraph</p><ul><li>Item</li></ul>";
    const result = splitHtmlIntoBlocks(html);
    expect(result).toHaveLength(3);
    expect(result[0]).toBe("<h1>Title</h1>");
    expect(result[1]).toBe("<p>Paragraph</p>");
    expect(result[2]).toBe("<ul><li>Item</li></ul>");
  });

  it("splits headings h1-h6", () => {
    const html = "<h1>H1</h1><h2>H2</h2><h3>H3</h3>";
    const result = splitHtmlIntoBlocks(html);
    expect(result).toHaveLength(3);
  });

  // ── Text nodes ────────────────────────────────────────

  it("wraps bare text nodes in <p> tags", () => {
    const html = "Just some text";
    const result = splitHtmlIntoBlocks(html);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe("<p>Just some text</p>");
  });

  it("handles text node between elements", () => {
    const html = "<p>Before</p>Middle text<p>After</p>";
    const result = splitHtmlIntoBlocks(html);
    expect(result).toHaveLength(3);
    expect(result[0]).toBe("<p>Before</p>");
    expect(result[1]).toBe("<p>Middle text</p>");
    expect(result[2]).toBe("<p>After</p>");
  });

  // ── Empty elements filtering ──────────────────────────

  it("filters out empty text nodes between elements", () => {
    const html = "<p>First</p>   <p>Second</p>";
    const result = splitHtmlIntoBlocks(html);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe("<p>First</p>");
    expect(result[1]).toBe("<p>Second</p>");
  });

  // ── Nested elements ───────────────────────────────────

  it("preserves nested HTML within blocks", () => {
    const html = "<p>Text with <strong>bold</strong> and <em>italic</em></p>";
    const result = splitHtmlIntoBlocks(html);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(
      "<p>Text with <strong>bold</strong> and <em>italic</em></p>",
    );
  });

  it("preserves table structure as single block", () => {
    const html =
      "<table><thead><tr><th>Header</th></tr></thead><tbody><tr><td>Cell</td></tr></tbody></table>";
    const result = splitHtmlIntoBlocks(html);
    expect(result).toHaveLength(1);
    expect(result[0]).toContain("<table>");
  });

  // ── Whitespace handling ───────────────────────────────

  it("trims leading and trailing whitespace from input", () => {
    const html = "  <p>Content</p>  ";
    const result = splitHtmlIntoBlocks(html);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe("<p>Content</p>");
  });

  // ── Complex TipTap-like HTML ──────────────────────────

  it("handles blockquote elements", () => {
    const html = "<blockquote>Quote text</blockquote><p>After</p>";
    const result = splitHtmlIntoBlocks(html);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe("<blockquote>Quote text</blockquote>");
    expect(result[1]).toBe("<p>After</p>");
  });

  it("handles ordered and unordered lists as blocks", () => {
    const html =
      "<ul><li>Item 1</li><li>Item 2</li></ul><ol><li>Step 1</li></ol>";
    const result = splitHtmlIntoBlocks(html);
    expect(result).toHaveLength(2);
  });
});
