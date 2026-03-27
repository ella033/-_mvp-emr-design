import { describe, it, expect } from 'vitest';
import {
  FormRenderType,
  FormIssuanceStatus,
  DocumentRenderViewType,
} from './document-enums';

describe('FormRenderType', () => {
  it('Pdf = 1', () => {
    expect(FormRenderType.Pdf).toBe(1);
  });

  it('Component = 2', () => {
    expect(FormRenderType.Component).toBe(2);
  });

  it('값이 2개만 존재한다', () => {
    const numericValues = Object.values(FormRenderType).filter(
      (v) => typeof v === 'number'
    );
    expect(numericValues).toHaveLength(2);
  });
});

describe('FormIssuanceStatus', () => {
  it('Draft = 0', () => {
    expect(FormIssuanceStatus.Draft).toBe(0);
  });

  it('Issued = 1', () => {
    expect(FormIssuanceStatus.Issued).toBe(1);
  });

  it('Canceled = 2', () => {
    expect(FormIssuanceStatus.Canceled).toBe(2);
  });

  it('값이 3개만 존재한다', () => {
    const numericValues = Object.values(FormIssuanceStatus).filter(
      (v) => typeof v === 'number'
    );
    expect(numericValues).toHaveLength(3);
  });
});

describe('DocumentRenderViewType', () => {
  it('Idle = "idle"', () => {
    expect(DocumentRenderViewType.Idle).toBe('idle');
  });

  it('Loading = "loading"', () => {
    expect(DocumentRenderViewType.Loading).toBe('loading');
  });

  it('Error = "error"', () => {
    expect(DocumentRenderViewType.Error).toBe('error');
  });

  it('Pdf = "pdf"', () => {
    expect(DocumentRenderViewType.Pdf).toBe('pdf');
  });

  it('Component = "component"', () => {
    expect(DocumentRenderViewType.Component).toBe('component');
  });

  it('값이 5개만 존재한다', () => {
    const values = Object.values(DocumentRenderViewType);
    expect(values).toHaveLength(5);
  });
});
