// Prescription search types shared by the Elasticsearch service

export type PrescriptionSearchCategory =
  | "disease"
  | "bundle"
  | "userCode"
  | "medicalLibrary"
  | "drugLibrary"
  | "materialLibrary";

export interface PrescriptionSearchItem {
  category: PrescriptionSearchCategory;
  id: number | string;
  original_id?: number | string;
  name: string;
  nameEn?: string;
  code?: string;
  type?: number | string;
  typePrescriptionLibraryId?: number | string;
  itemType?: string;
  codeType?: string;
  receiptPrintLocation?: string;
  details?: any[];
  medicalLibrary?: {
    koreanName?: string;
    classificationNo?: string;
    assessmentName?: string;
    nameEn?: string;
    examCategory?: string;
    examDetailCategory?: string;
    radiationCategory?: string | null;
    surgeryType?: string;
    organCategory?: string;
    sectionCategory?: string;
    subCategory?: string;
  };
  drugLibrary?: {
    productName?: string;
    classificationNo?: string;
    administrationRoute?: string;
    manufacturerName?: string;
    specification?: string;
    unit?: string;
    specializationType?: string;
    drugEquivalence?: string;
    substituteType?: string;
    sameDrugCode?: string;
    claimSpecification?: string;
  };
  materialLibrary?: {
    productName?: string;
  };
  [key: string]: any;
}

export interface PrescriptionSearchAllResponse {
  items: PrescriptionSearchItem[];
  totalCount: {
    all: number;
    disease: number;
    bundle: number;
    userCode: number;
    medicalLibrary: number;
    drugLibrary: number;
    materialLibrary: number;
  };
  nextCursor: {
    disease: number;
    bundle: number;
    userCode: number;
    medicalLibrary: number;
    drugLibrary: number;
    materialLibrary: number;
  };
  hasNextPage: boolean;
}

export type ElasticsearchPrescriptionSearchItem = PrescriptionSearchItem;
export type ElasticsearchPrescriptionSearchAllResponse = PrescriptionSearchAllResponse;
