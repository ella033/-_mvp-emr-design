export interface ExternalLabExamination {
  id: string;
  examinationCode: string;
  ubCode?: string; // 표준코드
  claimCode: string | null;
  name: string;
  ename: string;
  type: string;
  spcCode: string;
  spcName: string;
  description: string | null;
  library: {
    id: string;
    code: string;
    name: string;
  };
  prescriptionLibrary: {
    id: number;
    type: number;
    typePrescriptionLibraryId: number;
    name: string;
    itemType: string;
    codeType: number;
    receiptPrintLocation: number;
    isSystemExternalLab: boolean;
  } | null;
  prescriptionLibraryDetail: {
    type: number;
    typePrescriptionLibraryId: number;
    applyDate: string;
    claimCode: string;
    price: number;
    isSelfPayRate30: boolean;
    isSelfPayRate50: boolean;
    isSelfPayRate80: boolean;
    isSelfPayRate90: boolean;
    isSelfPayRate100: boolean;
    oneTwoType: number;
    relativeValueScore: string;
    salaryStandard: string | null;
    additionalPrice: number | null;
    activeIngredientCode: string | null;
    withdrawalPrevention: string | null;
    prescriptionLibrary: {
      id: number;
      type: number;
      typePrescriptionLibraryId: number;
      name: string;
      itemType: string;
      codeType: number;
      receiptPrintLocation: number;
    };
  } | null;
  createDateTime: string;
  updateDateTime: string | null;
}

export interface ExternalLabExaminationsResponse {
  items: ExternalLabExamination[];
  nextCursor: string | null;
  hasNextPage: boolean;
  totalCount: number;
}

