import { describe, it, expect, vi, beforeEach } from 'vitest';
import { openDocumentPage } from './document-navigation';
import type { Encounter } from '@/types/chart/encounter-types';

describe('openDocumentPage', () => {
  const mockOpen = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('open', mockOpen);
    mockOpen.mockClear();
  });

  it('올바른 URL로 새 창을 연다', () => {
    const encounter = { id: 100, patientId: 200 } as Encounter;
    openDocumentPage('doc-1', encounter);

    expect(mockOpen).toHaveBeenCalledWith(
      '/document?documentId=doc-1&patientId=200&encounterId=100',
      '_blank'
    );
  });

  it('다른 documentId와 encounter로 호출하면 해당 값이 URL에 반영된다', () => {
    const encounter = { id: 999, patientId: 555 } as Encounter;
    openDocumentPage('form-abc', encounter);

    expect(mockOpen).toHaveBeenCalledWith(
      '/document?documentId=form-abc&patientId=555&encounterId=999',
      '_blank'
    );
  });

  it('window.open을 _blank 타겟으로 호출한다', () => {
    const encounter = { id: 1, patientId: 2 } as Encounter;
    openDocumentPage('x', encounter);

    expect(mockOpen).toHaveBeenCalledTimes(1);
    expect(mockOpen.mock.calls[0][1]).toBe('_blank');
  });
});
