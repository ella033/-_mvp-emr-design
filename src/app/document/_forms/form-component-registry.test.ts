import { describe, it, expect } from 'vitest';
import { resolveFormComponent } from './form-component-registry';

describe('resolveFormComponent', () => {
  describe('버전 키 매칭', () => {
    it('MedicalRecordContent@1을 반환한다', () => {
      const result = resolveFormComponent({ componentPath: 'MedicalRecordContent', version: 1 });
      expect(result).not.toBeNull();
    });

    it('NewMedicalRecordContent@1을 반환한다', () => {
      const result = resolveFormComponent({ componentPath: 'NewMedicalRecordContent', version: 1 });
      expect(result).not.toBeNull();
    });

    it('PrescriptionContent@1을 반환한다', () => {
      const result = resolveFormComponent({ componentPath: 'PrescriptionContent', version: 1 });
      expect(result).not.toBeNull();
    });

    it('VisitReportContent@1을 반환한다', () => {
      const result = resolveFormComponent({ componentPath: 'VisitReportContent', version: 1 });
      expect(result).not.toBeNull();
    });

    it('VariableRowHeightTestContent@1을 반환한다', () => {
      const result = resolveFormComponent({ componentPath: 'VariableRowHeightTestContent', version: 1 });
      expect(result).not.toBeNull();
    });
  });

  describe('componentPath만으로 폴백 매칭', () => {
    it('버전 키가 없을 때 componentPath 키로 폴백한다', () => {
      const result = resolveFormComponent({ componentPath: 'MedicalRecordContent', version: 999 });
      expect(result).not.toBeNull();
    });

    it('NewMedicalRecordContent 버전 없는 키로 폴백한다', () => {
      const result = resolveFormComponent({ componentPath: 'NewMedicalRecordContent', version: 99 });
      expect(result).not.toBeNull();
    });
  });

  describe('등록되지 않은 컴포넌트', () => {
    it('존재하지 않는 componentPath이면 null을 반환한다', () => {
      const result = resolveFormComponent({ componentPath: 'UnknownComponent', version: 1 });
      expect(result).toBeNull();
    });

    it('빈 문자열 componentPath이면 null을 반환한다', () => {
      const result = resolveFormComponent({ componentPath: '', version: 1 });
      expect(result).toBeNull();
    });
  });

  describe('동일 컴포넌트 참조 일관성', () => {
    it('버전 키와 폴백 키가 같은 컴포넌트를 반환한다', () => {
      const withVersion = resolveFormComponent({ componentPath: 'MedicalRecordContent', version: 1 });
      const fallback = resolveFormComponent({ componentPath: 'MedicalRecordContent', version: 999 });
      expect(withVersion).toBe(fallback);
    });
  });
});
