import type { MyTreeGridRowType } from "@/components/yjg/my-tree-grid/my-tree-grid-type";
import { InOut, PrescriptionType } from "@/constants/master-data-enum";
import type { AuthUserType } from "@/types/auth-types";
import type { User } from "@/types/user-types";
import {
  getIconBtn,
  getOrderCells,
  getRowType,
  getScheduledOrderCells,
} from "./order-common-converter-util";
import { InputSource, InputType } from "@/types/chart/order-types";
import { SpecificDetail } from "@/types/chart/specific-detail-code-type";
import { getRowKey } from "@/components/yjg/my-tree-grid/my-tree-grid-util";
import { 보험구분상세 } from "@/constants/common/common-enum";
import { getPrescriptionDetailType, 처방상세구분 } from "@/types/master-data/item-type";
import type { SpecimenDetail } from "@/types/chart/specimen-detail-code-type";
import { ItemTypeCode } from "@/constants/library-option/item-type-option";

function getInOutType(prescriptionType: PrescriptionType, type: 처방상세구분) {
  if (prescriptionType === PrescriptionType.drug && type === 처방상세구분.주사) return InOut.In;
  return InOut.Out;
}

function getExceptionCode(prescriptionType: PrescriptionType, type: 처방상세구분) {
  const inoutType = getInOutType(prescriptionType, type);
  if (inoutType === InOut.In && prescriptionType === PrescriptionType.drug && type === 처방상세구분.주사) return "52"; // 원내 주사제(52) : 주사제를 원내 투약하는 경우
  return "";
}

export const convertOrderLibraryToMyTreeGridType = (
  size: "xs" | "sm" | "default" | "lg" | "xl",
  onCellDataChange: (
    rowKey: string,
    headerKey: string,
    value: string | number | boolean
  ) => void,
  data: any,
  user: AuthUserType | User,
  isScheduledOrder: boolean = false,
  scheduledOrderMemo: string = "",
  insuranceType?: 보험구분상세,
): MyTreeGridRowType | null => {
  if (!data || typeof data !== "object" || data.category === "bundle")
    return null;

  console.log(
    "[TEST][orderLibrary]",
    "data:",
    data,
    "user:",
    user,
    "isScheduledOrder:",
    isScheduledOrder,
    "scheduledOrderMemo:",
    scheduledOrderMemo,
    "insuranceType:",
    insuranceType,
  );

  const type = getPrescriptionDetailType(data.itemType);

  const orgData = { type: "order-library", data: data };
  // 함수내에서만 사용하는 변수
  const libraryDetail =
    data.category === "userCode"
      ? data.library.details?.[0]
      : data.details?.[0];
  const rowKey = getRowKey("order-library");
  let itemType = data.itemType;
  let codeType = data.codeType;
  // 수정되는 정보
  let name = `${data.medicalLibrary?.assessmentName ? `${data.name} (${data.medicalLibrary?.assessmentName})` : data.name}`;
  let dose = 1;
  let times = 1;
  let days = 1;
  let usage = "";
  let specification = "";
  let unit = "";
  let specimenDetail: SpecimenDetail[] = [];
  let specificDetail: SpecificDetail[] = [];
  let typePrescriptionLibraryId = data.typePrescriptionLibraryId;
  let prescriptionLibraryId = data.id;
  let userCodeId = null;
  let userCode = data.code || "";
  let claimCode = libraryDetail?.claimCode || "";
  let classificationCode = "";
  let oneTwoType = libraryDetail?.oneTwoType || 0;
  let inOutType = getInOutType(data.type, type);
  let exceptionCode = getExceptionCode(data.type, type);
  let drugAtcCode = libraryDetail?.activeIngredientCode || "";
  let relativeValueScore = libraryDetail?.relativeValueScore || "";
  let insurancePrice = libraryDetail?.price || 0; // 보험가
  let additionalPrice = libraryDetail?.additionalPrice || 0; // 가산금
  let generalPrice = 0; // 일반가
  let actualPrice = 0; // 실거래가
  let isSystemExternalLab = data.isSystemExternalLab || data.itemType === ItemTypeCode.검사료_위탁검사 ? true : false;
  let receiptPrintLocation = undefined;
  let isNormalPrice = false;
  let paymentMethod = undefined;

  switch (data.category) {
    case "userCode":
      prescriptionLibraryId = data.library.id;
      userCodeId = data.id;
      isNormalPrice = data.isNormalPrice;
      generalPrice = Number(data.details?.[0]?.normalPrice) || 0;
      actualPrice = Number(data.details?.[0]?.actualPrice) || 0;
      paymentMethod = data.paymentMethod;
      specificDetail = data.specificDetail || [];

      if (data.type === PrescriptionType.medical) {
        const medicalLibrary = data.library.medicalLibrary;
        classificationCode = medicalLibrary.classificationNo || "";
      } else if (data.type === PrescriptionType.drug) {
        const drugUserCode = data.drugUserCode;
        const drugLibrary = data.library.drugLibrary;
        dose = Number(drugUserCode?.dose || 1);
        days = Number(drugUserCode?.days || 1);
        times = Number(drugUserCode?.times || 1);
        usage = drugUserCode?.usage;
        inOutType = drugUserCode?.inOutType;
        exceptionCode = drugUserCode?.exceptionCode || getExceptionCode(data.type, type);
        specification = drugUserCode?.specification || (drugLibrary?.specification || "");
        unit = drugUserCode?.unit || (drugLibrary?.unit || "");
        classificationCode = drugLibrary.classificationNo || "";
      } else if (data.type === PrescriptionType.material) {
        const materialUserCode = data.materialUserCode;
        const materialLibrary = data.library.materialLibrary;
        dose = Number(materialUserCode.dose || 0);
        specification = materialUserCode.specification || (materialLibrary?.specification || "");
        unit = materialUserCode.unit || materialLibrary.unit || "";
      }

      receiptPrintLocation = data.receiptPrintLocation || undefined;
      if (Array.isArray(data.specimenDetail) && data.specimenDetail.length > 0) {
        specimenDetail = data.specimenDetail;
      } else if (isSystemExternalLab) {
        specimenDetail = [{
          code: data.externalLabExamination?.spcCode ?? "",
          name: data.externalLabExamination?.spcName ?? "",
        }];
      }

      break;

    case "medicalLibrary":
      classificationCode = data.medicalLibrary.classificationNo || "";
      break;

    case "drugLibrary":
      classificationCode = data.drugLibrary.classificationNo || "";
      specification = data.drugLibrary.specification || "";
      unit = data.drugLibrary.unit || "";
      break;

    case "materialLibrary":
      specification = data.materialLibrary.specification || "";
      unit = data.materialLibrary.unit || "";
      break;

    default:
      break;
  }

  // 예약처방에서 설정한 dose/days/times가 있으면 우선 적용
  if (isScheduledOrder) {
    if (data._scheduledDose != null) dose = Number(data._scheduledDose);
    if (data._scheduledDays != null) days = Number(data._scheduledDays);
    if (data._scheduledTimes != null) times = Number(data._scheduledTimes);
  }

  return {
    rowKey,
    parentRowKey: null,
    type: getRowType(false, null, data.category),
    orgData,
    iconBtn: getIconBtn(
      false,
      size,
      userCode,
      itemType,
      claimCode,
      isScheduledOrder,
      scheduledOrderMemo
    ),
    className: isScheduledOrder ? "bg-[var(--yellow-4)]" : "",
    cells: [
      ...getOrderCells({
        inputType: InputType.일반,
        inputSource: isScheduledOrder ? InputSource.예약처방 : InputSource.없음,
        itemType,
        codeType,
        isSystemExternalLab,
        userCode,
        claimCode,
        name,
        dose,
        times,
        days,
        isPowder: false,
        usage,
        specification,
        unit,
        exceptionCode,
        specimenDetail,
        specificDetail,
        paymentMethod,
        prescriptionType: data.type,
        typePrescriptionLibraryId,
        prescriptionLibraryId,
        userCodeId,
        classificationCode,
        oneTwoType,
        inOutType,
        drugAtcCode,
        relativeValueScore,
        insurancePrice,
        generalPrice,
        actualPrice,
        additionalPrice,
        receiptPrintLocation,
        insuranceType,
        isNormalPrice,

      }),
      ...getScheduledOrderCells(rowKey, user, onCellDataChange),
    ],
  };
};
