// ================================ 약품 기본 정보 ================================
export interface DrugApprovalInfo {
  ITEM_SEQ: string;
  ITEM_NAME: string;
  ENTP_NAME: string;
  ITEM_PERMIT_DATE: string;
  EDI_CODE: string;
  ENTP_NO: string;
  CANCEL_DATE: string | null;
  CANCEL_NAME: string;
  ITEM_ENG_NAME: string;
  ENTP_ENG_NAME: string;
  BIZRNO: string;
}

// ================================ 약품 상세 정보 ================================
export interface DrugDetailInfo {
  CNSGN_MANUF: string;
  ETC_OTC_CODE: string;
  CHART: string;
  BAR_CODE: string;
  MATERIAL_NAME: string;
  EE_DOC_ID: string;
  UD_DOC_ID: string;
  NB_DOC_ID: string;
  INSERT_FILE: string;
  STORAGE_METHOD: string;
  VALID_TERM: string;
  REEXAM_TARGET: string | null;
  REEXAM_DATE: string | null;
  PACK_UNIT: string;
  PERMIT_KIND_NAME: string;
  MAKE_MATERIAL_FLAG: string;
  NEWDRUG_CLASS_NAME: string;
  INDUTY_TYPE: string;
  CHANGE_DATE: string;
  NARCOTIC_KIND_CODE: string | null;
  GBN_NAME: string;
  TOTAL_CONTENT: string;
  EE_DOC_DATA: string;
  UD_DOC_DATA: string;
  NB_DOC_DATA: string;
  PN_DOC_DATA: string | null;
  MAIN_ITEM_INGR: string;
  INGR_NAME: string;
  ATC_CODE: string;
  MAIN_INGR_ENG: string;
  RARE_DRUG_YN: string | null;
}

// ================================ 약품 생산 정보 ================================
export interface DrugProductInfo {
  ENTP_SEQ: string;
  INDUTY: string;
  PRDLST_STDR_CODE: string;
  SPCLTY_PBLC: string;
  PRDUCT_TYPE: string;
  PRDUCT_PRMISN_NO: string;
  ITEM_INGR_NAME: string;
  ITEM_INGR_CNT: string;
  BIG_PRDT_IMG_URL: string;
  PERMIT_KIND_CODE: string;
}

// ================================ 약품 전체 정보 ================================
export interface Drug
  extends DrugApprovalInfo,
    DrugDetailInfo,
    DrugProductInfo {
  ingredients?: DrugIngredient[];
}

// ================================ 약품 성분 정보 ================================
export interface DrugIngredient {
  ENTRPS_PRMISN_NO: string;
  ENTRPS: string;
  PRDUCT: string;
  MTRAL_SN: string;
  MTRAL_CODE: string;
  MTRAL_NM: string;
  QNT: string;
  INGD_UNIT_CD: string;
  ITEM_SEQ: string;
  MAIN_INGR_ENG: string;
  BIZRNO: string;
  CPNT_CTNT_CONT: string | null;
}

// ================================ 약품 정보 응답 타입 ================================
interface ApiResponse<T> {
  header: {
    resultCode: string;
    resultMsg: string;
  };
  body: {
    pageNo: number;
    totalCount: number;
    numOfRows: number;
    items: T[];
  };
}

// ================================ 약품 기본 정보 응답 타입 ================================
export interface DrugApprovalDetails
  extends ApiResponse<DrugApprovalInfo & DrugDetailInfo> {}

// ================================ 약품 성분 정보 응답 타입 ================================
export interface DrugIngredientDetails extends ApiResponse<DrugIngredient> {}

// ================================ 약품 생산 정보 응답 타입 ================================
export interface DrugApprovals
  extends ApiResponse<DrugApprovalInfo & DrugProductInfo> {}
