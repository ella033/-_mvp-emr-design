export enum PrescriptionType {
  medical = 1,
  drug = 2,
  material = 3,
}

export enum PrescriptionSubType {
  action = 1,
  examine = 2,
}

export enum InOut {
  In = 1, // 원내
  Out = 2, // 원외
  External = 3, // 수탁
}

/** 란구분 (처방전 컬럼 구분) */
export enum ColumnType {
  None = 0, // 없음
  Column1 = 1, // 1란 (내복약)
  Column2 = 2, // 2란 (외용약/주사제)
}
export const InOutLabel: Record<InOut, string> = {
  [InOut.In]: "원내",
  [InOut.Out]: "원외",
  [InOut.External]: "수탁",
};

export enum DecimalPoint {
  Default = 1,
  RoundUp = 2,
  RoundDown = 3,
  RoundHalf = 4,
  RoundHalfUp = 5,
}

export enum ConsignmentAgency {
  위탁진료_없음 = 0,
  위탁진료_상급종합병원 = 1,
  위탁진료_종합병원 = 2,
  위탁진료_병원 = 3,
  위탁진료_의원 = 4,
  시설공동사용_상급종합병원 = 5,
  시설공동사용_종합병원 = 6,
  시설공동사용_병원 = 7,
  시설공동사용_의원 = 8,
  개방병원_상급종합병원 = 9,
  개방병원_종합병원 = 10,
  개방병원_병원 = 11,
}
