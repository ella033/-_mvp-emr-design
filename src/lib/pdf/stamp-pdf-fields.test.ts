import { describe, it, expect, vi, beforeEach } from 'vitest';

// pdf-lib mock
const mockDrawText = vi.fn();
const mockGetPages = vi.fn();
const mockGetSize = vi.fn().mockReturnValue({ width: 595.28, height: 841.89 });
const mockSave = vi.fn();
const mockEmbedFont = vi.fn().mockResolvedValue({
  widthOfTextAtSize: (_text: string, _size: number) => 50,
});
const mockRegisterFontkit = vi.fn();
const mockLoad = vi.fn();

vi.mock('pdf-lib', () => ({
  PDFDocument: {
    load: (...args: unknown[]) => mockLoad(...args),
    create: vi.fn(),
  },
  rgb: (r: number, g: number, b: number) => ({ r, g, b }),
}));

vi.mock('@pdf-lib/fontkit', () => ({ default: {} }));

// fetch mock for font loading
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

import { stampFieldsOnPdf } from './stamp-pdf-fields';

function createMockPage() {
  return {
    getSize: mockGetSize,
    drawText: mockDrawText,
  };
}

beforeEach(() => {
  vi.clearAllMocks();

  mockFetch.mockResolvedValue({
    ok: true,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
  });

  const page = createMockPage();
  mockGetPages.mockReturnValue([page]);
  mockSave.mockResolvedValue(new Uint8Array([37, 80, 68, 70])); // %PDF

  mockLoad.mockResolvedValue({
    registerFontkit: mockRegisterFontkit,
    embedFont: mockEmbedFont,
    getPages: mockGetPages,
    save: mockSave,
  });
});

describe('stampFieldsOnPdf', () => {
  it('빈 필드 배열이면 원본 PDF를 그대로 반환한다', async () => {
    const inputBytes = new ArrayBuffer(16);
    const result = await stampFieldsOnPdf({
      pdfBytes: inputBytes,
      fields: [],
      values: {},
    });

    expect(result).toBeInstanceOf(Blob);
    expect(result.type).toBe('application/pdf');
    expect(mockDrawText).not.toHaveBeenCalled();
  });

  it('필드 1개를 stamp하면 drawText가 호출된다', async () => {
    const field = {
      id: 1,
      key: 'issuanceNo',
      name: '발급번호',
      type: 1 as any,
      pageNumber: 1,
      x: 100,
      y: 50,
      width: 200,
      height: 30,
      fontSize: 18,
      fontWeight: 'normal' as const,
      textAlign: 'left' as const,
      order: 0,
      dataSource: null,
      defaultValue: null,
      options: null,
    };

    const result = await stampFieldsOnPdf({
      pdfBytes: new ArrayBuffer(16),
      fields: [field],
      values: { issuanceNo: 'ABC-2026-001' },
    });

    expect(result).toBeInstanceOf(Blob);
    expect(mockDrawText).toHaveBeenCalledTimes(1);
    expect(mockDrawText).toHaveBeenCalledWith(
      'ABC-2026-001',
      expect.objectContaining({
        size: expect.any(Number),
      }),
    );
  });

  it('값이 빈 문자열이면 drawText를 호출하지 않는다', async () => {
    const field = {
      id: 1,
      key: 'issuanceNo',
      name: '발급번호',
      type: 1 as any,
      pageNumber: 1,
      x: 100,
      y: 50,
      width: 200,
      height: 30,
      fontSize: 18,
      fontWeight: 'normal' as const,
      textAlign: 'left' as const,
      order: 0,
      dataSource: null,
      defaultValue: null,
      options: null,
    };

    await stampFieldsOnPdf({
      pdfBytes: new ArrayBuffer(16),
      fields: [field],
      values: { issuanceNo: '' },
    });

    expect(mockDrawText).not.toHaveBeenCalled();
  });
});
