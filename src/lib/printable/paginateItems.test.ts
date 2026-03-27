import { describe, it, expect } from 'vitest';
import {
  paginateItems,
  type PrintableItem,
  type MeasurementEntry,
} from './PrintableDocument';

// ── 헬퍼 ────────────────────────────────────────────────

/** block 아이템 생성 헬퍼 */
function block(id: string): PrintableItem {
  return { id, kind: 'block', render: () => null };
}

/** table 아이템 생성 헬퍼 */
function table(id: string, rowCount: number): PrintableItem {
  return {
    id,
    kind: 'table',
    render: () => null,
    table: {
      props: {},
      bodyRows: Array.from({ length: rowCount }, () => null),
    },
  };
}

/** page-break 아이템 생성 헬퍼 */
function pageBreak(id: string): PrintableItem {
  return { id, kind: 'page-break', render: () => null };
}

/** 측정 엔트리 생성 헬퍼 (block) */
function measureBlock(id: string, height: number): MeasurementEntry {
  return { id, height };
}

/** 측정 엔트리 생성 헬퍼 (table) */
function measureTable(
  id: string,
  height: number,
  opts: { headHeight?: number; footHeight?: number; rowHeights: number[] }
): MeasurementEntry {
  return {
    id,
    height,
    table: {
      headHeight: opts.headHeight ?? 0,
      footHeight: opts.footHeight ?? 0,
      rowHeights: opts.rowHeights,
    },
  };
}

// ── 테스트 ──────────────────────────────────────────────

describe('paginateItems', () => {
  it('아이템 없으면 빈 페이지 1개 반환', () => {
    const result = paginateItems({
      items: [],
      measurements: { entries: [], headerHeight: 0, footerHeight: 0 },
      contentHeight: 500,
    });

    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('page-1');
    expect(result[0]!.blocks).toHaveLength(0);
  });

  it('한 페이지에 모든 블록이 들어가는 경우', () => {
    const items = [block('b1'), block('b2')];
    const entries = [measureBlock('b1', 100), measureBlock('b2', 100)];

    const result = paginateItems({
      items,
      measurements: { entries, headerHeight: 0, footerHeight: 0 },
      contentHeight: 500,
    });

    expect(result).toHaveLength(1);
    expect(result[0]!.blocks).toHaveLength(2);
    expect(result[0]!.blocks[0]).toMatchObject({ type: 'block', itemId: 'b1' });
    expect(result[0]!.blocks[1]).toMatchObject({ type: 'block', itemId: 'b2' });
  });

  it('블록이 페이지를 넘으면 다음 페이지로 분할', () => {
    const items = [block('b1'), block('b2'), block('b3')];
    const entries = [
      measureBlock('b1', 300),
      measureBlock('b2', 300),
      measureBlock('b3', 100),
    ];

    const result = paginateItems({
      items,
      measurements: { entries, headerHeight: 0, footerHeight: 0 },
      contentHeight: 502, // 500 + SUB_PIXEL_TOLERANCE
    });

    expect(result).toHaveLength(2);
    expect(result[0]!.blocks).toHaveLength(1);
    expect(result[0]!.blocks[0]).toMatchObject({ itemId: 'b1' });
    expect(result[1]!.blocks).toHaveLength(2);
    expect(result[1]!.blocks[0]).toMatchObject({ itemId: 'b2' });
    expect(result[1]!.blocks[1]).toMatchObject({ itemId: 'b3' });
  });

  it('page-break 강제 분할', () => {
    const items = [block('b1'), pageBreak('pb1'), block('b2')];
    const entries = [measureBlock('b1', 100), measureBlock('b2', 100)];

    const result = paginateItems({
      items,
      measurements: { entries, headerHeight: 0, footerHeight: 0 },
      contentHeight: 500,
    });

    expect(result).toHaveLength(2);
    expect(result[0]!.blocks).toHaveLength(1);
    expect(result[0]!.blocks[0]).toMatchObject({ itemId: 'b1' });
    expect(result[1]!.blocks).toHaveLength(1);
    expect(result[1]!.blocks[0]).toMatchObject({ itemId: 'b2' });
  });

  it('테이블 행 분할 - 한 페이지에 모든 행이 들어가는 경우', () => {
    const items = [table('t1', 3)];
    const entries = [
      measureTable('t1', 200, {
        headHeight: 30,
        footHeight: 20,
        rowHeights: [50, 50, 50],
      }),
    ];

    const result = paginateItems({
      items,
      measurements: { entries, headerHeight: 0, footerHeight: 0 },
      contentHeight: 502, // SUB_PIXEL_TOLERANCE 보정
    });

    expect(result).toHaveLength(1);
    expect(result[0]!.blocks).toHaveLength(1);
    const tableBlock = result[0]!.blocks[0]!;
    expect(tableBlock.type).toBe('table');
    if (tableBlock.type === 'table') {
      expect(tableBlock.startRow).toBe(0);
      expect(tableBlock.endRow).toBe(3);
      expect(tableBlock.showFooter).toBe(true);
    }
  });

  it('테이블 행 분할 - 페이지 경계에서 행이 나뉘는 경우', () => {
    const items = [table('t1', 5)];
    const entries = [
      measureTable('t1', 350, {
        headHeight: 30,
        footHeight: 20,
        rowHeights: [60, 60, 60, 60, 60],
      }),
    ];

    // 가용 높이: 202 - footerSpacing(0) - SUB_PIXEL_TOLERANCE(2) = 200
    // head(30) + row0(60) + row1(60) = 150 < 200 OK
    // head(30) + row0(60) + row1(60) + row2(60) = 210 > 200 → 분할
    const result = paginateItems({
      items,
      measurements: { entries, headerHeight: 0, footerHeight: 0 },
      contentHeight: 202,
    });

    expect(result.length).toBeGreaterThanOrEqual(2);

    // 첫 페이지: 일부 행만 포함
    const firstBlock = result[0]!.blocks[0]!;
    expect(firstBlock.type).toBe('table');
    if (firstBlock.type === 'table') {
      expect(firstBlock.startRow).toBe(0);
      expect(firstBlock.endRow).toBeLessThan(5);
    }

    // 마지막 페이지: 나머지 행 포함, showFooter가 true
    const lastPage = result[result.length - 1]!;
    const lastBlock = lastPage.blocks[lastPage.blocks.length - 1]!;
    if (lastBlock.type === 'table') {
      expect(lastBlock.endRow).toBe(5);
      expect(lastBlock.showFooter).toBe(true);
    }
  });

  it('footerSpacingPx가 가용 높이를 줄인다', () => {
    const items = [block('b1'), block('b2')];
    const entries = [measureBlock('b1', 200), measureBlock('b2', 200)];

    // footerSpacing 없이: 402 - 2(tolerance) = 400 → b1(200) + b2(200) = 1페이지
    const withoutSpacing = paginateItems({
      items,
      measurements: { entries, headerHeight: 0, footerHeight: 0 },
      contentHeight: 402,
    });
    expect(withoutSpacing).toHaveLength(1);

    // footerSpacing 200px → 402 - 200 - 2 = 200 → b1만 1페이지, b2는 2페이지
    const withSpacing = paginateItems({
      items,
      measurements: { entries, headerHeight: 0, footerHeight: 0 },
      contentHeight: 402,
      footerSpacingPx: 200,
    });
    expect(withSpacing).toHaveLength(2);
  });

  it('측정값 없는 아이템은 무시', () => {
    const items = [block('b1'), block('b2')];
    // b2에 대한 측정값 없음
    const entries = [measureBlock('b1', 100)];

    const result = paginateItems({
      items,
      measurements: { entries, headerHeight: 0, footerHeight: 0 },
      contentHeight: 500,
    });

    expect(result).toHaveLength(1);
    expect(result[0]!.blocks).toHaveLength(1);
    expect(result[0]!.blocks[0]).toMatchObject({ itemId: 'b1' });
  });

  it('테이블 페이지네이션 정보(tablePageIndex, tableTotalPages)가 설정됨', () => {
    const items = [table('t1', 4)];
    const entries = [
      measureTable('t1', 300, {
        headHeight: 30,
        footHeight: 0,
        rowHeights: [80, 80, 80, 80],
      }),
    ];

    // 가용: 152 - 2 = 150. head(30) + row0(80) = 110 OK. + row1(80) = 190 > 150 → 분할
    const result = paginateItems({
      items,
      measurements: { entries, headerHeight: 0, footerHeight: 0 },
      contentHeight: 152,
    });

    expect(result.length).toBeGreaterThanOrEqual(2);

    let tableBlockCount = 0;
    for (const page of result) {
      for (const blk of page.blocks) {
        if (blk.type === 'table') {
          tableBlockCount++;
          expect(blk.tablePageIndex).toBeDefined();
          expect(blk.tableTotalPages).toBeDefined();
        }
      }
    }
    expect(tableBlockCount).toBeGreaterThanOrEqual(2);
  });
});
