export type TreatmentPeriodDto = {
  startDate: string;
  endDate: string;
};

export type HeaderDto = {
  patientNo: string;
  patientName: string;
  treatmentPeriod: TreatmentPeriodDto;
  visitType: string;
  isInterimBill: boolean;
  nightVisit: boolean;
  holidayVisit: boolean;
  department: string;
  drgNo: string | null;
  roomType: string | null;
  patientCategory: string;
  receiptNo: string;
};

export type PaymentAmountDto = {
  insuredCopay: number;
  insuredFullPay: number;
  insurerPayment: number;
  uninsured: number;
};

export type HospitalizationRoomDto = {
  singleRoom: PaymentAmountDto;
  twoThreePersonRoom: PaymentAmountDto;
  fourPlusPersonRoom: PaymentAmountDto;
};

export type BasicItemsDto = {
  consultation: PaymentAmountDto;
  hospitalization: HospitalizationRoomDto;
  meals: PaymentAmountDto;
  medicationService: PaymentAmountDto;
  medicationDrug: PaymentAmountDto;
  injectionService: PaymentAmountDto;
  injectionDrug: PaymentAmountDto;
  anesthesia: PaymentAmountDto;
  procedureSurgery: PaymentAmountDto;
  labTest: PaymentAmountDto;
  imaging: PaymentAmountDto;
  radiationTherapy: PaymentAmountDto;
  medicalSupplies: PaymentAmountDto;
  rehabilitation: PaymentAmountDto;
  mentalHealth: PaymentAmountDto;
  bloodProducts: PaymentAmountDto;
};

export type ElectiveItemsDto = {
  ct: PaymentAmountDto;
  mri: PaymentAmountDto;
  pet: PaymentAmountDto;
  ultrasound: PaymentAmountDto;
  prostheticsOrthodontics: PaymentAmountDto;
  certificates: PaymentAmountDto;
  selectiveCoverage: PaymentAmountDto;
  seniorFixedRate: PaymentAmountDto;
  longTermCareFixed: PaymentAmountDto;
  palliativeCareFixed: PaymentAmountDto;
  drgPackage: PaymentAmountDto;
  other: PaymentAmountDto;
};

export type ItemsDto = {
  basic: BasicItemsDto;
  elective: ElectiveItemsDto;
  totals: PaymentAmountDto;
};

export type SummaryDto = {
  totalMedicalExpense: number;
  insurerPayment: number;
  patientPayment: number;
  ceilingExcess: number;
  previouslyPaid: number;
  amountDue: number;
};

export type PaymentDto = {
  card: number;
  cashReceipt: number;
  cash: number;
  total: number;
  outstanding: number;
  cashReceiptIdentifier: string | null;
  cashReceiptApprovalNo: string | null;
};

export type IssuanceDto = {
  issueDate: string;
  facilityType: string;
  businessRegistrationNo: string;
  facilityName: string;
  phone: string;
  address: string;
  representativeName: string;
};

export type MedicalBillReceiptResponseDto = {
  header: HeaderDto;
  items: ItemsDto;
  summary: SummaryDto;
  payment: PaymentDto;
  issuance: IssuanceDto;
};
