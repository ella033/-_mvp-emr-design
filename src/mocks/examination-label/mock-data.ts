/**
 * 검사 라벨 출력 Mock 데이터
 *
 * GET /specimen-libraries 응답과 동일한 형식으로 데모·테스트용 데이터를 제공합니다.
 * MSW 등으로 API를 모킹할 때 이 데이터를 사용할 수 있습니다.
 */

import type { PatientInfo, Specimen, SpecimenPrintItem } from "@/lib/label-printer";
import type { SpecimenLibrary } from "@/types/specimen-libraries-type";

/** Mock 환자 정보 (스크린샷 예시와 동일) */
export const MOCK_PATIENT_DATA: PatientInfo = {
  chartNumber: "12345-12",
  patientName: "이정민",
  age: 30,
  gender: "F",
  birthDate: "1996-01-02",
};

/**
 * Mock 검체 라이브러리 목록 (GET /specimen-libraries 응답 형식)
 * 데모·MSW 모킹 시 사용
 */
export const MOCK_SPECIMEN_LIBRARIES: SpecimenLibrary[] = [
  { id: 1, code: "14", name: "Lymph node", nameEn: "Lymph node" },
  { id: 2, code: "100", name: "Serum", nameEn: "Serum" },
  { id: 3, code: "200", name: "WB(EDTA)", nameEn: "WB(EDTA)" },
  { id: 4, code: "201", name: "EDTA Plasma", nameEn: "EDTA Plasma" },
  { id: 5, code: "210", name: "WB(Heparin)", nameEn: "WB(Heparin)" },
  { id: 6, code: "240", name: "Sod. Citrate", nameEn: "Sod. Citrate" },
  { id: 7, code: "250", name: "PB Slide", nameEn: "PB Slide" },
  { id: 8, code: "300", name: "Urine(random)", nameEn: "Urine(random)" },
  { id: 9, code: "360", name: "24hr-Urine", nameEn: "24hr-Urine" },
  { id: 10, code: "450", name: "C.S.F", nameEn: "C.S.F" },
  { id: 11, code: "451", name: "Other Fluid", nameEn: "Other Fluid" },
  { id: 12, code: "500", name: "Stool", nameEn: "Stool" },
  { id: 13, code: "520", name: "WB(혈액 배양용기 2개)", nameEn: "" },
  { id: 14, code: "530", name: "Sputum", nameEn: "Sputum" },
  { id: 15, code: "552", name: "Vaginal (Wet)", nameEn: "Vaginal (Wet)" },
  { id: 16, code: "800", name: "혈액여지", nameEn: "" },
  { id: 17, code: "891", name: "전용용기혈장", nameEn: "" },
  { id: 18, code: "910", name: "NMP22", nameEn: "NMP22" },
  { id: 19, code: "912", name: "Whole Blood", nameEn: "Whole Blood" },
  { id: 20, code: "970", name: "중금속용기(전혈)", nameEn: "" },
  { id: 21, code: "995", name: "Serum+SB(E.D.T.A)", nameEn: "" },
  { id: 22, code: "998", name: "Serum+Random Urine", nameEn: "" },
  { id: 23, code: "999", name: "other", nameEn: "other" },
];

/** Mock 환자의 처방된 검체 목록 (encounter 기반) */
export const MOCK_PATIENT_SPECIMENS: SpecimenPrintItem[] = [
  { specimenCode: "100", specimenName: "Serum", quantity: 1 },
  { specimenCode: "200", specimenName: "WB(EDTA)", quantity: 1 },
];

/**
 * Mock: encounterId로 검체 정보 조회
 */
export function getMockSpecimensByEncounter(_encounterId: string): {
  patient: PatientInfo;
  specimens: SpecimenPrintItem[];
} {
  return {
    patient: MOCK_PATIENT_DATA,
    specimens: [...MOCK_PATIENT_SPECIMENS],
  };
}

/**
 * Mock: 검체 마스터 목록을 Specimen[] 형식으로 반환 (드롭다운용)
 * API 응답(SpecimenLibrary[])을 라벨 프린트 다이얼로그에서 쓰는 형태로 변환
 */
export function getMockSpecimenMaster(): Specimen[] {
  return MOCK_SPECIMEN_LIBRARIES.map((item) => ({
    specimenCode: item.code,
    specimenName: item.name,
  }));
}
