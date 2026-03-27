export interface ExternalCauseCode {
  code: string;
  content: string;
}

export const EXTERNAL_CAUSE_CODE_OPTIONS: ExternalCauseCode[] = [
  {
    code: "",
    content: "없음",
  },
  {
    code: "C",
    content: "의·치·한 협진",
  },
  {
    code: "D",
    content: "임신·출산 중 타 상병",
  },
  {
    code: "E",
    content: "정신과 입원 중 타과 진료",
  },
  {
    code: "F",
    content: "산정특례자 타 상병",
  },
  {
    code: "H",
    content: "진찰 없이 검사 실시",
  },
  {
    code: "I",
    content: "희귀질환 환자 타 상병",
  },
  {
    code: "J",
    content: "촉탁의 원외처방",
  },
  {
    code: "K",
    content: "산재, 자보 입원 중 타 상병",
  },
  {
    code: "M",
    content: "혈액투석 및 타 상병",
  },
  {
    code: "N",
    content: "잠복결핵 검진비 지원",
  },
  {
    code: "O",
    content: "의료급여 정액수가 예외항목",
  },
  {
    code: "Q",
    content: "잠복결핵 환자 타 상병",
  },
  {
    code: "R",
    content: "HPV 예방접종 및 진찰",
  },
  {
    code: "S",
    content: "장기기증자 요양급여비",
  },
  {
    code: "T",
    content: "난임진료 환자 타상병",
  },
  {
    code: "V",
    content: "상해 원인(운송사고)",
  },
  {
    code: "W",
    content: "상해 원인(외적 노출 요인)",
  },
  {
    code: "X",
    content: "상해 원인(기타 및 의도적 원인)",
  },
  {
    code: "Y",
    content: "상해 원인(합병증 및 사후 요인)",
  },
];
