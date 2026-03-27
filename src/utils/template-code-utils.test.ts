import { describe, it, expect, vi } from 'vitest';
import { TemplateCodeType } from '@/constants/common/common-enum';
import type { TemplateCode } from '@/types/template-code-types';
import {
  filterTemplatesByType,
  sortTemplatesByQuickMenu,
  filterAndSortTemplates,
  filterQuickMenuTemplates,
  stripHtmlTags,
} from './template-code-utils';

// Helper to create a minimal TemplateCode
function makeTemplate(
  overrides: Partial<TemplateCode> & { type: TemplateCodeType[]; isQuickMenu: boolean }
): TemplateCode {
  return {
    id: 1,
    hospitalId: 1,
    code: 'T001',
    content: 'test content',
    createId: 1,
    createDateTime: '2025-01-01T00:00:00',
    updateId: null,
    updateDateTime: null,
    deleteId: null,
    deleteDateTime: null,
    ...overrides,
  } as TemplateCode;
}

describe('filterTemplatesByType', () => {
  const templates: TemplateCode[] = [
    makeTemplate({ id: 1, type: [TemplateCodeType.증상], isQuickMenu: false }),
    makeTemplate({ id: 2, type: [TemplateCodeType.전체], isQuickMenu: false }),
    makeTemplate({ id: 3, type: [TemplateCodeType.임상메모], isQuickMenu: false }),
    makeTemplate({ id: 4, type: [TemplateCodeType.증상, TemplateCodeType.임상메모], isQuickMenu: false }),
    makeTemplate({ id: 5, type: [] as TemplateCodeType[], isQuickMenu: false, code: 'T005', content: 'no type' } as unknown as TemplateCode & { type: TemplateCodeType[]; isQuickMenu: boolean }),
  ];

  it('returns all templates when filtering by 전체', () => {
    const result = filterTemplatesByType(templates, TemplateCodeType.전체);
    expect(result).toHaveLength(templates.length);
  });

  it('returns templates matching the specific type', () => {
    const result = filterTemplatesByType(templates, TemplateCodeType.증상);
    const ids = result.map((t) => t.id);
    // id=1 (증상), id=2 (전체), id=4 (증상+임상메모) should match
    expect(ids).toContain(1);
    expect(ids).toContain(2);
    expect(ids).toContain(4);
    expect(ids).not.toContain(3);
  });

  it('includes templates with type=전체 regardless of filter', () => {
    const result = filterTemplatesByType(templates, TemplateCodeType.특정내역);
    const ids = result.map((t) => t.id);
    expect(ids).toContain(2); // type includes 전체
  });

  it('includes templates with null type', () => {
    const nullTypeTemplate = makeTemplate({
      id: 99,
      type: null as unknown as TemplateCodeType[],
      isQuickMenu: false,
    });
    const result = filterTemplatesByType(
      [nullTypeTemplate],
      TemplateCodeType.증상
    );
    expect(result).toHaveLength(1);
  });

  it('returns empty array for empty input', () => {
    expect(filterTemplatesByType([], TemplateCodeType.증상)).toEqual([]);
  });
});

describe('sortTemplatesByQuickMenu', () => {
  it('sorts quick menu items first', () => {
    const templates: TemplateCode[] = [
      makeTemplate({ id: 1, isQuickMenu: false, type: [TemplateCodeType.증상] }),
      makeTemplate({ id: 2, isQuickMenu: true, type: [TemplateCodeType.증상] }),
      makeTemplate({ id: 3, isQuickMenu: false, type: [TemplateCodeType.증상] }),
      makeTemplate({ id: 4, isQuickMenu: true, type: [TemplateCodeType.증상] }),
    ];
    const result = sortTemplatesByQuickMenu(templates);
    expect(result[0]!.isQuickMenu).toBe(true);
    expect(result[1]!.isQuickMenu).toBe(true);
    expect(result[2]!.isQuickMenu).toBe(false);
    expect(result[3]!.isQuickMenu).toBe(false);
  });

  it('does not mutate the original array', () => {
    const templates: TemplateCode[] = [
      makeTemplate({ id: 1, isQuickMenu: false, type: [TemplateCodeType.증상] }),
      makeTemplate({ id: 2, isQuickMenu: true, type: [TemplateCodeType.증상] }),
    ];
    const original = [...templates];
    sortTemplatesByQuickMenu(templates);
    expect(templates[0]!.id).toBe(original[0]!.id);
    expect(templates[1]!.id).toBe(original[1]!.id);
  });

  it('handles empty array', () => {
    expect(sortTemplatesByQuickMenu([])).toEqual([]);
  });

  it('preserves relative order of same-priority items', () => {
    const templates: TemplateCode[] = [
      makeTemplate({ id: 1, isQuickMenu: true, type: [TemplateCodeType.증상] }),
      makeTemplate({ id: 2, isQuickMenu: true, type: [TemplateCodeType.증상] }),
    ];
    const result = sortTemplatesByQuickMenu(templates);
    expect(result[0]!.id).toBe(1);
    expect(result[1]!.id).toBe(2);
  });
});

describe('filterAndSortTemplates', () => {
  it('filters by type and sorts by quick menu', () => {
    const templates: TemplateCode[] = [
      makeTemplate({ id: 1, type: [TemplateCodeType.증상], isQuickMenu: false }),
      makeTemplate({ id: 2, type: [TemplateCodeType.임상메모], isQuickMenu: true }),
      makeTemplate({ id: 3, type: [TemplateCodeType.증상], isQuickMenu: true }),
      makeTemplate({ id: 4, type: [TemplateCodeType.전체], isQuickMenu: false }),
    ];
    const result = filterAndSortTemplates(templates, TemplateCodeType.증상);
    // Should include id=1 (증상), id=3 (증상+quick), id=4 (전체)
    // Quick menu first: id=3, then id=1, id=4
    expect(result[0]!.id).toBe(3);
    expect(result.map((t) => t.id)).not.toContain(2);
  });

  it('returns all sorted when type is 전체', () => {
    const templates: TemplateCode[] = [
      makeTemplate({ id: 1, type: [TemplateCodeType.증상], isQuickMenu: false }),
      makeTemplate({ id: 2, type: [TemplateCodeType.임상메모], isQuickMenu: true }),
    ];
    const result = filterAndSortTemplates(templates, TemplateCodeType.전체);
    expect(result).toHaveLength(2);
    expect(result[0]!.isQuickMenu).toBe(true);
  });
});

describe('filterQuickMenuTemplates', () => {
  const templates: TemplateCode[] = [
    makeTemplate({ id: 1, type: [TemplateCodeType.증상], isQuickMenu: true }),
    makeTemplate({ id: 2, type: [TemplateCodeType.증상], isQuickMenu: false }),
    makeTemplate({ id: 3, type: [TemplateCodeType.전체], isQuickMenu: true }),
    makeTemplate({ id: 4, type: [TemplateCodeType.임상메모], isQuickMenu: true }),
  ];

  it('returns only quick menu items matching the type', () => {
    const result = filterQuickMenuTemplates(templates, TemplateCodeType.증상);
    const ids = result.map((t) => t.id);
    expect(ids).toContain(1); // 증상 + quickMenu
    expect(ids).toContain(3); // 전체 + quickMenu
    expect(ids).not.toContain(2); // not quickMenu
    expect(ids).not.toContain(4); // wrong type
  });

  it('includes items with type=전체 when filtering by any type', () => {
    const result = filterQuickMenuTemplates(templates, TemplateCodeType.임상메모);
    const ids = result.map((t) => t.id);
    expect(ids).toContain(3); // 전체 + quickMenu
    expect(ids).toContain(4); // 임상메모 + quickMenu
  });

  it('returns empty array when no quick menu items match', () => {
    const noQuick = [
      makeTemplate({ id: 1, type: [TemplateCodeType.증상], isQuickMenu: false }),
    ];
    expect(filterQuickMenuTemplates(noQuick, TemplateCodeType.증상)).toEqual([]);
  });

  it('returns empty array for empty input', () => {
    expect(filterQuickMenuTemplates([], TemplateCodeType.증상)).toEqual([]);
  });
});

describe('stripHtmlTags', () => {
  it('returns empty string for empty input', () => {
    expect(stripHtmlTags('')).toBe('');
  });

  it('returns empty string for falsy input', () => {
    expect(stripHtmlTags(null as unknown as string)).toBe('');
    expect(stripHtmlTags(undefined as unknown as string)).toBe('');
  });

  it('returns plain text unchanged', () => {
    expect(stripHtmlTags('hello world')).toBe('hello world');
  });

  it('strips simple HTML tags', () => {
    expect(stripHtmlTags('<p>hello</p>')).toBe('hello');
  });

  it('strips nested HTML tags', () => {
    expect(stripHtmlTags('<div><p><strong>bold</strong> text</p></div>')).toBe(
      'bold text'
    );
  });

  it('handles self-closing tags', () => {
    expect(stripHtmlTags('hello<br/>world')).toBe('hello world');
  });

  it('collapses multiple spaces into one', () => {
    expect(stripHtmlTags('<p>hello</p>  <p>world</p>')).toBe('hello world');
  });

  it('decodes HTML entities in SSR mode', () => {
    // Temporarily make window undefined to test SSR branch
    const originalWindow = globalThis.window;
    // @ts-expect-error - deliberately removing window for SSR test
    delete globalThis.window;

    try {
      expect(stripHtmlTags('&amp; &lt; &gt; &quot; &#39;')).toBe('& < > " \'');
      expect(stripHtmlTags('hello&nbsp;world')).toBe('hello world');
    } finally {
      globalThis.window = originalWindow;
    }
  });

  it('handles complex HTML content', () => {
    const html =
      '<div class="container"><h1>Title</h1><p>Some <em>emphasized</em> text</p></div>';
    const result = stripHtmlTags(html);
    expect(result).toBe('Title Some emphasized text');
  });

  it('trims leading and trailing whitespace', () => {
    expect(stripHtmlTags('  <p>hello</p>  ')).toBe('hello');
  });
});
