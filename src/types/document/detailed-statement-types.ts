export interface DetailedStatementHeader {
  patientNo: string;
  patientName: string;
  treatmentPeriod: {
    startDate: string;
    endDate: string;
  };
  roomType: string;
  patientCategory: string;
  patientCategoryDescription: string;
  remarks: string | null;
}

export interface DetailedStatementItemPayment {
  insuredCopay: number;
  insuredFullPay: number;
  insurerPay: number;
  uninsured: number;
}

export interface DetailedStatementItem {
  category: string;
  serviceDate: string;
  code: string;
  name: string;
  unitPrice: number;
  quantity: number;
  days: number;
  totalAmount: number;
  payment: DetailedStatementItemPayment;
  bundleItemId?: number;
  isBundle?: boolean;
  isBundleChild?: boolean;
}

export interface DetailedStatementSummaryAmounts {
  totalAmount: number;
  insuredCopay: number;
  insuredFullPay: number;
  insurerPay: number;
  uninsured: number;
}

export interface DetailedStatementSummary {
  subtotal: DetailedStatementSummaryAmounts;
  adjustment: DetailedStatementSummaryAmounts;
  grandTotal: DetailedStatementSummaryAmounts;
}

export interface DetailedStatementIssuance {
  issueDate: string;
  applicantName: string;
  applicantRelation: string;
  facilityName: string;
  representativeName: string;
}

export interface DetailedStatementResponse {
  header: DetailedStatementHeader;
  items: DetailedStatementItem[];
  summary: DetailedStatementSummary;
  issuance: DetailedStatementIssuance;
}
