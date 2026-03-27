import type { MyTreeGridRowType } from "@/components/yjg/my-tree-grid/my-tree-grid-type";
import type { OrderGridConvertToGridRowTypesParams } from "@/components/disease-order/order/order-grid-convert-params";
import { CodeType } from "@/constants/common/common-enum";
import { GetCustomOrderRow } from "@/components/disease-order/order/order-action-row/order-action-command";
import { InOut, PrescriptionType } from "@/constants/master-data-enum";
import type { Bundle } from "@/types/master-data/bundle/bundle-type";
import type { BundleItemOrder } from "@/types/master-data/bundle/bundle-item-order-type";
import {
  getIconBtn,
  getRowType,
  getOrderCells,
  getIsClaim,
  getPaymentMethod,
  getInputType,
} from "./order-common-converter-util";
import { InputSource, InputType, type OrderBase } from "@/types/chart/order-types";
import { getRowKey } from "@/components/yjg/my-tree-grid/my-tree-grid-util";
import { 보험구분상세 } from "@/constants/common/common-enum";
import { ItemTypeCode } from "@/constants/library-option/item-type-option";

const getSpecification = (order: BundleItemOrder): string => {
  switch (order.type) {
    case PrescriptionType.drug:
      return order.prescriptionLibrary?.drugLibrary?.specification || "";
    case PrescriptionType.material:
      return order.prescriptionLibrary?.materialLibrary?.specification || "";
    default:
      return "";
  }
};

const getUnit = (order: BundleItemOrder): string => {
  switch (order.type) {
    case PrescriptionType.drug:
      return order.prescriptionLibrary?.drugLibrary?.unit || "";
    case PrescriptionType.material:
      return order.prescriptionLibrary?.materialLibrary?.unit || "";
    default:
      return "";
  }
};

const getClassificationCode = (order: BundleItemOrder): string => {
  switch (order.type) {
    case PrescriptionType.medical:
      return (
        order.prescriptionLibrary?.medicalLibrary?.classificationNo || ""
      );
    case PrescriptionType.drug:
      return order.prescriptionLibrary?.drugLibrary?.classificationNo || "";
    default:
      return "";
  }
};

export const convertBundleItemOrdersToMyTreeGridType = (
  params: OrderGridConvertToGridRowTypesParams
): MyTreeGridRowType[] => {
  const {
    parentRowKey = null,
    data: orders,
    size,
    onCellDataChange,
    bundle,
    insuranceType,
  } = params;

  return orders
    .map((order) =>
      convertBundleItemOrderToMyTreeGridType(
        parentRowKey,
        order,
        size!,
        onCellDataChange!,
        bundle,
        insuranceType,
      )
    )
    .filter((order) => order !== null);
};

export const convertBundleItemOrderToMyTreeGridType = (
  parentRowKey: string | null,
  order: BundleItemOrder,
  size: "xs" | "sm" | "default" | "lg" | "xl",
  onCellDataChange: (
    rowKey: string,
    headerKey: string,
    value: string | number | boolean
  ) => void,
  bundle?: Bundle,
  insuranceType?: 보험구분상세
): MyTreeGridRowType | null => {
  if (!order || typeof order !== "object") return null;
  const rowKey = getRowKey("bundle-item-order");
  const libraryDetail = order.prescriptionLibrary?.details?.[0];
  const prescriptionUserCode = order.prescriptionUserCode;
  const itemType = order.itemType ?? "";
  const codeType = order.prescriptionLibrary?.codeType || CodeType.없음;
  const userCode = order.userCode ?? "";
  const claimCode = order.claimCode ?? "";
  const name = order.name ?? "";
  const dose = order.dose ?? 0;
  const times = order.times ?? 0;
  const days = order.days ?? 0;
  const isPowder = order.isPowder;
  const usage = order.usage ?? "";
  const specification = getSpecification(order);
  const unit = getUnit(order);
  const exceptionCode = order.exceptionCode ?? "";

  const specificDetail = order.specificDetail;
  const isClaim = order.isClaim;
  const prescriptionType = order.type;
  const typePrescriptionLibraryId = order.typePrescriptionLibraryId;
  const prescriptionLibraryId = order.prescriptionLibraryId;
  const userCodeId = order.userCodeId || undefined;
  const classificationCode = getClassificationCode(order);
  const oneTwoType = libraryDetail?.oneTwoType;
  const inOutType = order.inOutType || InOut.Out;
  const drugAtcCode = order.drugAtcCode || libraryDetail?.activeIngredientCode || undefined;
  const relativeValueScore = libraryDetail?.relativeValueScore || undefined;
  const insurancePrice = libraryDetail?.price || 0;
  const additionalPrice = libraryDetail?.additionalPrice || 0;
  const bundleItemId = order.bundleItemId;
  const parentBundleItemId = bundle?.id;
  const orgData = { type: "bundle-item-order", data: order };

  // 사용자코드를 따라가는 묶음 오더
  console.log("[TEST] prescriptionUserCode", order);
  const specimenDetail = prescriptionUserCode?.specimenDetail ?? order.specimenDetail;
  const isSystemExternalLab = prescriptionUserCode?.isSystemExternalLab || order.itemType === ItemTypeCode.검사료_위탁검사 ? true : false;
  const receiptPrintLocation = prescriptionUserCode?.receiptPrintLocation || undefined;
  const generalPrice = Number(prescriptionUserCode?.details?.[0]?.normalPrice) || 0;
  const actualPrice = Number(prescriptionUserCode?.details?.[0]?.actualPrice) || 0;
  const priceType = bundle?.priceType;
  const isNormalPrice = prescriptionUserCode?.isNormalPrice;
  const paymentMethod = order.paymentMethod;

  return {
    rowKey,
    parentRowKey: parentRowKey,
    type: getRowType(false, parentRowKey),
    orgData,
    iconBtn: getIconBtn(
      false,
      size,
      userCode,
      itemType,
      claimCode,
      false
    ),
    cells: getOrderCells({
      inputType: InputType.일반,
      inputSource: InputSource.없음,
      itemType,
      codeType,
      isSystemExternalLab,
      userCode,
      claimCode,
      name,
      dose,
      times,
      days,
      isPowder,
      usage,
      specification,
      unit,
      exceptionCode,
      specimenDetail,
      isClaim,
      paymentMethod,
      specificDetail,
      prescriptionType,
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
      bundleItemId,
      parentBundleItemId,
      receiptPrintLocation,
      insuranceType,
      isNormalPrice,
      priceType,
    }),
    customRender: GetCustomOrderRow(
      rowKey,
      size,
      userCode,
      name,
      onCellDataChange
    ),
  };
};

export const convertMedicalBundleItemOrdersToMyTreeGridType = (
  bundleItemOrders: BundleItemOrder[],
): MyTreeGridRowType[] => {
  return bundleItemOrders.map((order, index) => {
    const rowKey = `row-key-${index}`;
    return {
      rowKey,
      parentRowKey: null,
      type: "item",
      orgData: {
        type: "bundle-item-order",
        data: order,
      },
      isHighlight: false,
      cells: [
        {
          headerKey: "userCode",
          value: order.userCode,
        },
        {
          headerKey: "claimCode",
          value: order.claimCode,
        },
        {
          headerKey: "name",
          value: order.name,
        },
        {
          headerKey: "dose",
          value: order.dose,
        },
        {
          headerKey: "times",
          value: order.times,
        },
        {
          headerKey: "days",
          value: order.days,
        }
      ]
    }
  });
};

export const convertIndividualBundleItemOrderToOrderBase = (
  order: BundleItemOrder,
  insuranceType?: 보험구분상세
): OrderBase => {
  const libraryDetail = order.prescriptionLibrary?.details?.[0];
  const prescriptionUserCode = order.prescriptionUserCode;
  const paymentMethod = getPaymentMethod({
    isNormalPrice: prescriptionUserCode?.isNormalPrice,
    paymentMethod: order.paymentMethod,
    insuranceType,
  });

  return {
    userCode: order.userCode ?? "",
    claimCode: order.claimCode ?? "",
    name: order.name ?? "",
    classificationCode: getClassificationCode(order),
    itemType: order.itemType ?? "",
    codeType: order.prescriptionLibrary?.codeType || CodeType.없음,
    inOutType: order.inOutType || InOut.Out,
    oneTwoType: libraryDetail?.oneTwoType ?? 0,
    drugAtcCode: order.drugAtcCode || libraryDetail?.activeIngredientCode || undefined,
    relativeValueScore: libraryDetail?.relativeValueScore || undefined,
    insurancePrice: libraryDetail?.price ?? 0,
    generalPrice: Number(prescriptionUserCode?.details?.[0]?.normalPrice) ?? 0,
    actualPrice: Number(prescriptionUserCode?.details?.[0]?.actualPrice) ?? undefined,
    incentivePrice: libraryDetail?.additionalPrice ?? undefined,
    dose: order.dose ?? 0,
    days: order.days ?? 0,
    times: order.times ?? 0,
    isPowder: order.isPowder,
    usage: order.usage ?? "",
    specification: getSpecification(order),
    unit: getUnit(order),
    exceptionCode: order.exceptionCode ?? "",
    paymentMethod,
    isSelfPayRate30: libraryDetail?.isSelfPayRate30 || false,
    isSelfPayRate50: libraryDetail?.isSelfPayRate50 || false,
    isSelfPayRate80: libraryDetail?.isSelfPayRate80 || false,
    isSelfPayRate90: libraryDetail?.isSelfPayRate90 || false,
    isSelfPayRate100: libraryDetail?.isSelfPayRate100 || false,
    isClaim: getIsClaim(order.typePrescriptionLibraryId, insuranceType, order.isClaim),
    specificDetail: order.specificDetail,
    specimenDetail: order.specimenDetail,
    userCodeId: order.userCodeId ?? undefined,
    type: order.type as PrescriptionType | undefined,
    typePrescriptionLibraryId: order.typePrescriptionLibraryId,
    prescriptionLibraryId: order.prescriptionLibraryId,
    inputType: getInputType(order.userCode),
    inputSource: InputSource.없음,
  };
};