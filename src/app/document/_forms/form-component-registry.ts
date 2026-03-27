import type { ComponentType } from 'react';
import { VisitReportContent as VisitReportV1 } from '@/app/document/_templates/VisitReport/v1';
import { VariableRowHeightTestContent as VariableRowHeightTestV1 } from '@/app/document/_templates/VariableRowHeightTest/v1';
import { PrescriptionContent as PrescriptionV1 } from '@/app/document/_templates/Prescription/v1';
import { MedicalRecordContent as MedicalRecordV1 } from '@/app/document/_templates/MedicalRecord/v1';
import { NewMedicalRecordContent as NewMedicalRecordV1 } from '@/app/document/_templates/NewMedicalRecord/v1';

interface ResolveFormComponentParams {
  componentPath: string;
  version: number;
}

type RegistryKey = string;

const formComponentRegistry: Record<RegistryKey, ComponentType> = {
  // NOTE: 백엔드에서 내려오는 componentPath 값이 확정되면 여기 키를 맞춰 추가하세요.
  // 진료기록사본(구)
  'MedicalRecordContent@1': MedicalRecordV1,
  'MedicalRecordContent': MedicalRecordV1,

  // 진료기록사본
  'NewMedicalRecordContent@1': NewMedicalRecordV1,
  'NewMedicalRecordContent': NewMedicalRecordV1,

  // TODO: 아래 서식들은 개발용(dev) 임시 서식들이며, 추후 실제 서식으로 교체 시 삭제 예정입니다.
  // [DEV ONLY]
  // VisitReport
  'VisitReportContent@1': VisitReportV1,
  'VisitReportContent': VisitReportV1,

  // VariableRowHeightTest
  'VariableRowHeightTestContent@1': VariableRowHeightTestV1,
  'VariableRowHeightTestContent': VariableRowHeightTestV1,

  // Prescription
  'PrescriptionContent@1': PrescriptionV1,
  'PrescriptionContent': PrescriptionV1,
};

export function resolveFormComponent({
  componentPath,
  version,
}: ResolveFormComponentParams): ComponentType | null {
  const versionedKey = `${componentPath}@${version}`;
  const component = formComponentRegistry[versionedKey] ?? formComponentRegistry[componentPath];
  return component ?? null;
}
