export enum PaperType {
  None = 0,
  A4 = 1,
  A5 = 3,
  B5 = 4,
  Letter = 5,
  Legal = 6,
  Envelope = 7,
  Label = 8,
  Chart = 9,
  Receipt = 10,
  Other = 99,
}

export const paperTypeLabel: Record<PaperType, string> = {
  [PaperType.None]: "없음",
  [PaperType.A4]: "A4",
  [PaperType.A5]: "A5",
  [PaperType.B5]: "B5",
  [PaperType.Letter]: "Letter",
  [PaperType.Legal]: "Legal",
  [PaperType.Envelope]: "Envelope",
  [PaperType.Label]: "Label",
  [PaperType.Chart]: "Chart",
  [PaperType.Receipt]: "Receipt",
  [PaperType.Other]: "기타",
};

export enum OutputType {
  None = 0,
  OutpatientPrescription = 1,
  OrderSheet = 2,
  Chart = 3,
  MedicalBill = 4,
  MedicalBillDetail = 5,
  MedicalDocument = 6,
  PatientLabel = 7,
  Other = 99,
}

export const outputTypeLabel: Record<OutputType, string> = {
  [OutputType.None]: "없음",
  [OutputType.OutpatientPrescription]: "원외처방전",
  [OutputType.OrderSheet]: "오더지",
  [OutputType.Chart]: "차트",
  [OutputType.MedicalBill]: "진료비영수증",
  [OutputType.MedicalBillDetail]: "진료비세부내역서",
  [OutputType.MedicalDocument]: "진단서/소견서/의뢰서",
  [OutputType.PatientLabel]: "환자라벨",
  [OutputType.Other]: "기타",
};