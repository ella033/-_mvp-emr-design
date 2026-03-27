// 질가산 등급 타입 정의
export interface QualityGrade {
  value: number;
  label: string;
  rate: number; // 가산율
}

// 질가산 등급 상수
// 나중에 서버 API로 가져올 때는 이 부분을 함수로 변경하면 됩니다:
// export const getQualityGrades = async (): Promise<QualityGrade[]> => {
//   const response = await fetch('/api/quality-grades');
//   const data = await response.json();
//   return data;
// }
export const QUALITY_GRADES: QualityGrade[] = [
  { value: 1, label: "1 등급", rate: 8 },
  { value: 2, label: "2 등급", rate: 6 },
  { value: 3, label: "3 등급", rate: 4 },
  { value: 4, label: "4 등급", rate: 3 },
  { value: 5, label: "5 등급", rate: 2 },
  { value: 6, label: "6 등급", rate: 1 },
];

// 질가산 등급을 "N 등급 (가산 M%)" 형식으로 변환하는 헬퍼 함수
export const formatQualityGrade = (grade: number | null | undefined): string => {
  if (grade === null || grade === undefined) return "-";
  const gradeObj = QUALITY_GRADES.find((g) => g.value === grade);
  if (!gradeObj) return `${grade} 등급`;
  return `${gradeObj.label} (가산 ${gradeObj.rate}%)`;
};

// 인증 여부 타입 정의
export interface CertificationStatus {
  value: boolean;
  label: string;
  rate: number; // 가산율
}

// 인증 여부 상수
// 나중에 서버 API로 가져올 때는 이 부분을 함수로 변경하면 됩니다:
// export const getCertificationStatuses = async (): Promise<CertificationStatus[]> => {
//   const response = await fetch('/api/certification-statuses');
//   const data = await response.json();
//   return data;
// }
export const CERTIFICATION_STATUSES: CertificationStatus[] = [
  {
    value: true,
    label: "인증",
    rate: 4,
  },
  {
    value: false,
    label: "미인증",
    rate: 0,
  },
];

// 인증 여부를 "인증 (가산4%)" / "미인증 (가산없음)" 형식으로 변환하는 헬퍼 함수
export const formatCertified = (
  isCertified: boolean | null | undefined,
  addOnRate?: number
): string => {
  if (isCertified === null || isCertified === undefined) return "-";
  
  const status = CERTIFICATION_STATUSES.find((s) => s.value === isCertified);
  if (!status) return "-";
  
  // 가산율이 제공되면 동적으로 표시, 없으면 객체의 rate 사용
  const rate = addOnRate ?? status.rate;
  if (rate > 0) {
    return `${status.label} (가산${rate}%)`;
  }
  return `${status.label} (가산없음)`;
};

// boolean 값으로 CertificationStatus 객체 찾기
export const getCertificationStatus = (value: boolean): CertificationStatus | undefined => {
  return CERTIFICATION_STATUSES.find((s) => s.value === value);
};

// CertificationStatus를 문자열로 직렬화 (Select value용)
export const serializeCertificationStatus = (status: CertificationStatus): string => {
  return String(status.value); // "true" 또는 "false"
};

// 문자열을 CertificationStatus로 역직렬화 (Select value에서)
export const deserializeCertificationStatus = (value: string): CertificationStatus | null => {
  const boolValue = value === "true";
  return getCertificationStatus(boolValue) || null;
};

