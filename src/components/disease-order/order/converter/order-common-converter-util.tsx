import {
  GetItemTypeCategoryIcon,
  getPrescriptionDetailType,
  처방상세구분,
} from "@/types/master-data/item-type";
import {
  COMMAND_DIVIDE_LINE,
  COMMAND_PREFIX,
} from "../order-action-row/order-action-command";
import ScheduledOrderMemoCell from "@/app/medical/_components/panels/(patient-diagnosis-prescription)/scheduled-order/scheduled-order-memo-cell";
import type { AuthUserType } from "@/types/auth-types";
import type { User } from "@/types/user-types";
import { formatDate } from "@/lib/date-utils";
import type { MyTreeGridRowCellType } from "@/components/yjg/my-tree-grid/my-tree-grid-type";
import { BundlePriceType } from "@/constants/bundle-price-type";
import { toKRW } from "@/lib/patient-utils";
import { CodeType, PaymentMethod, ReceiptPrintLocation, 보험구분상세 } from "@/constants/common/common-enum";
import { InOut, InOutLabel, PrescriptionType } from "@/constants/master-data-enum";
import { InputType, InputSource, type Order } from "@/types/chart/order-types";
import { SpecimenDetail } from "@/types/chart/specimen-detail-code-type";
import { SpecificDetail } from "@/types/chart/specific-detail-code-type";
import { ItemTypeCode } from "@/constants/library-option/item-type-option";

export const getPaymentMethod = ({
  priceType,
  isNormalPrice,
  paymentMethod,
  insuranceType,
}: {
  priceType?: BundlePriceType;
  isNormalPrice?: boolean;
  paymentMethod?: PaymentMethod;
  insuranceType?: 보험구분상세;
}) => {
  if (priceType === BundlePriceType.직접입력) {
    return PaymentMethod.수납없음;
  }

  if (isNormalPrice && insuranceType === 보험구분상세.일반) {
    return PaymentMethod.일반가;
  }

  return paymentMethod ?? PaymentMethod.보험가;
}

export const getPriceView = (
  {
    paymentMethod,
    insurancePrice,
    generalPrice,
    actualPrice,
  }: {
    paymentMethod?: PaymentMethod;
    insurancePrice?: number;
    generalPrice?: number;
    actualPrice?: number;
  }
) => {
  let price = insurancePrice ?? 0;
  if (actualPrice && insurancePrice && actualPrice > 0 && actualPrice < insurancePrice) {
    price = actualPrice;
  }
  if (paymentMethod === PaymentMethod.수납없음) {
    price = 0;
  }
  if (paymentMethod === PaymentMethod.일반가) {
    price = generalPrice ?? 0;
  }
  return toKRW(price);
}

export const getBundlePriceView = (
  {
    bundlePriceType,
    bundlePrice,
  }: {
    bundlePriceType?: BundlePriceType;
    bundlePrice?: number;
  }
): string => {
  if (bundlePriceType === BundlePriceType.직접입력) {
    return toKRW(bundlePrice ?? 0);
  }
  return "단가합산";
}

export const getIsClaim = (
  typePrescriptionLibraryId?: number,
  insuranceType?: 보험구분상세,
  orderIsClaim?: boolean,
): boolean => {
  if (typePrescriptionLibraryId === 0 || insuranceType === 보험구분상세.일반) {
    return false;
  }
  return orderIsClaim ?? true;
}

export const getRowType = (
  hasChildren: boolean,
  parentRowKey: string | null,
  category?: string
) => {
  if (category && category === "bundle") {
    return "package";
  }

  if (hasChildren) {
    return parentRowKey === null ? "package" : "fixed-package";
  } else {
    return parentRowKey === null ? "item" : "fixed-item";
  }
};

export const getDirectChildrenOrders = (
  parentOrder: Order,
  allOrders: Order[]
): Order[] => {
  if (!parentOrder.sortNumber) return [];

  return allOrders.filter(
    (order) => order.parentSortNumber === parentOrder.sortNumber
  );
};

export const getInputType = (userCode?: string, category?: string): InputType => {
  if (userCode === COMMAND_PREFIX) {
    return InputType.지시오더;
  } else if (userCode === COMMAND_DIVIDE_LINE) {
    return InputType.구분선;
  }
  if (category && category === "bundle") {
    return InputType.묶음헤더;
  }

  return InputType.일반;
};

export const getIconBtn = (
  hasChildren: boolean,
  size: "xs" | "sm" | "default" | "lg" | "xl",
  userCode: string,
  itemType: string,
  claimCode: string,
  isScheduledOrder: boolean,
  scheduledOrderMemo?: string
) => {
  if (userCode === COMMAND_DIVIDE_LINE) {
    return null;
  }

  if (isScheduledOrder) {
    return (
      <GetItemTypeCategoryIcon
        size={size}
        category="scheduled-order"
        tooltip={scheduledOrderMemo || ""}
      />
    );
  }

  if (hasChildren) {
    return <GetItemTypeCategoryIcon size={size} category="bundle" />;
  }

  return (
    <GetItemTypeCategoryIcon
      size={size}
      itemType={itemType}
      claimCode={claimCode}
      category={userCode === COMMAND_PREFIX ? "command" : undefined}
    />
  );
};

export type OrderCellModel = {
  inputType: InputType;
  inputSource: InputSource;
  itemType: string;
  codeType: CodeType;
  isSystemExternalLab: boolean; // 수탁검사여부
  userCode: string;
  claimCode: string;
  name: string;
  dose: number;
  times: number;
  days: number;
  isPowder: boolean;
  usage?: string;
  specification?: string; // 규격
  unit?: string; // 단위
  exceptionCode?: string;
  specimenDetail?: SpecimenDetail[];
  specificDetail?: SpecificDetail[];
  isClaim?: boolean;
  paymentMethod?: PaymentMethod;
  prescriptionType?: PrescriptionType;
  typePrescriptionLibraryId?: number;
  prescriptionLibraryId?: number;
  userCodeId?: number;
  classificationCode: string;
  oneTwoType?: number;
  inOutType: InOut;
  drugAtcCode?: string;
  relativeValueScore?: number;
  insurancePrice: number; // 보험가
  generalPrice: number; // 일반가
  actualPrice?: number; // 실거래가
  additionalPrice?: number; // 가산금(약가만 해당)
  bundlePrice?: number;
  bundleItemId?: number;
  parentBundleItemId?: number;
  receiptPrintLocation?: ReceiptPrintLocation;
  insuranceType?: 보험구분상세;
  isNormalPrice?: boolean;
  priceType?: BundlePriceType;
};

export const getOrderCells = (
  model: OrderCellModel
): MyTreeGridRowCellType[] => {
  const type = getPrescriptionDetailType(model.itemType);
  const isClaim = getIsClaim(model.typePrescriptionLibraryId, model.insuranceType, model.isClaim);
  const paymentMethod = getPaymentMethod({
    priceType: model.priceType,
    isNormalPrice: model.isNormalPrice,
    paymentMethod: model.paymentMethod,
    insuranceType: model.insuranceType,
  });
  const price = getPriceView({
    paymentMethod,
    insurancePrice: model.insurancePrice,
    generalPrice: model.generalPrice,
    actualPrice: model.actualPrice,
  });

  return [
    {
      headerKey: "inputType",
      value: model.inputType,
    },
    {
      headerKey: "inputSource",
      value: model.inputSource,
    },
    {
      headerKey: "userCode",
      value: model.userCode,
    },
    {
      headerKey: "claimCode",
      value: model.claimCode,
    },
    {
      headerKey: "name",
      value: model.name,
    },
    {
      headerKey: "price",
      value: price,
    },
    {
      headerKey: "prescriptionType",
      value: model.prescriptionType,
    },
    {
      // 과거 prescriptionType과 typePrescriptionLibraryId를 복합키로 사용하였으나 prescriptionLibraryId로 대체됨.
      headerKey: "typePrescriptionLibraryId",
      value: model.typePrescriptionLibraryId,
    },
    {
      // 라이브러리의 키 값
      headerKey: "prescriptionLibraryId",
      value: model.prescriptionLibraryId,
    },
    {
      headerKey: "userCodeId",
      value: model.userCodeId,
    },
    {
      headerKey: "itemType",
      value: model.itemType,
    },
    {
      headerKey: "codeType",
      value: model.codeType,
    },
    {
      headerKey: "classificationCode",
      value: model.classificationCode,
    },
    {
      headerKey: "oneTwoType",
      value: model.oneTwoType,
    },
    {
      headerKey: "drugAtcCode",
      value: model.drugAtcCode,
    },
    {
      headerKey: "relativeValueScore",
      value: model.relativeValueScore,
    },
    {
      headerKey: "insurancePrice",
      value: toKRW(model.insurancePrice),
    },
    {
      headerKey: "generalPrice",
      value: toKRW(model.generalPrice),
    },
    {
      headerKey: "actualPrice",
      value: toKRW(model.actualPrice),
    },
    {
      // 가산금: 라이브러리에서는 additionalPrice로 명칭하고 order에서는 incentivePrice로 사용함.
      headerKey: "incentivePrice",
      value: toKRW(model.additionalPrice),
    },
    {
      headerKey: "bundleItemId",
      value: model.bundleItemId,
    },
    {
      headerKey: "parentBundleItemId",
      value: model.parentBundleItemId,
    },
    {
      headerKey: "dose",
      value: model.dose,
      inputType: "textNumber",
      textNumberOption: {
        min: 0,
        max: 1000000000,
        pointPos: 8,
      },
    },
    {
      headerKey: "times",
      value: model.times,
      inputType: "textNumber",
      textNumberOption: {
        min: 0,
        max: 999,
        pointPos: 0,
      },
    },
    {
      headerKey: "days",
      value: model.days,
      inputType: "textNumber",
      textNumberOption: {
        min: 0,
        pointPos: 0,
      },
    },
    {
      headerKey: "usage",
      value: model.usage,
      inputType: "usage",
    },
    {
      headerKey: "specificationAndUnit",
      value: `${model.specification || ""} ${model.unit || ""}`,
    },
    {
      headerKey: "specification",
      value: model.specification,
    },
    {
      headerKey: "unit",
      value: model.unit,
    },
    {
      headerKey: "specificDetail",
      value: model.specificDetail ? JSON.stringify(model.specificDetail) : null,
      inputType: "specific-detail",
    },
    {
      headerKey: "isClaim",
      value: isClaim,
      inputType: "is-claim",
    },
    {
      headerKey: "paymentMethod",
      value: paymentMethod,
      inputType: "payment-method",
    },
    {
      headerKey: "receiptPrintLocation",
      value: model.receiptPrintLocation,
    },
    ...getMedicationOrderCells(type, model),
    ...getExamOrderCells(type, model),
  ];
};

const getMedicationOrderCells = (
  type: 처방상세구분,
  model: OrderCellModel
): MyTreeGridRowCellType[] => {
  if (type !== 처방상세구분.약 && type !== 처방상세구분.주사) return [];

  return [
    {
      headerKey: "isPowder",
      value: model.isPowder,
      inputType: model.itemType === ItemTypeCode.투약료_내복약 ? "checkbox" : undefined,
    },
    {
      headerKey: "inOutType",
      value: model.inOutType === InOut.In ? true : false,
      inputType: "checkbox",
    },
    {
      headerKey: "exceptionCode",
      value: model.exceptionCode,
      inputType: "exception-code",
    },
  ];
};

const getExamOrderCells = (
  type: 처방상세구분,
  model: OrderCellModel
): MyTreeGridRowCellType[] => {
  if (type !== 처방상세구분.검사) return [];
  return [
    {
      headerKey: "specimenDetail",
      value: model.specimenDetail ? JSON.stringify(model.specimenDetail) : null,
      inputType: model.itemType === ItemTypeCode.검사료_위탁검사 || model.isSystemExternalLab ? "specimen-detail-external" : "specimen-detail",
    },
    {
      headerKey: "inOutType",
      value: model.itemType === ItemTypeCode.검사료_위탁검사 || model.isSystemExternalLab ? InOutLabel[InOut.External] : true,
    },
  ];
};

export const getCustomOrderCells = (inputType: InputType, userCode: string, name: string): MyTreeGridRowCellType[] => {
  return [
    {
      headerKey: "inputType",
      value: inputType,
    },
    {
      headerKey: "inputSource",
      value: InputSource.없음,
    },
    {
      headerKey: "userCode",
      value: userCode,
    },
    {
      headerKey: "name",
      value: name,
    },
  ];
};

export type BundleOrderCellModel = {
  inputSource: InputSource;
  userCode: string;
  name: string;
  bundlePrice?: number;
  bundleItemId?: number;
  bundlePriceType?: BundlePriceType;
  receiptPrintLocation?: number;
};

export const getBundleOrderCells = (
  model: BundleOrderCellModel
): MyTreeGridRowCellType[] => {

  const priceView = getBundlePriceView({
    bundlePriceType: model.bundlePriceType,
    bundlePrice: model.bundlePrice,
  });

  return [
    {
      headerKey: "inputType",
      value: InputType.묶음헤더,
    },
    {
      headerKey: "inputSource",
      value: model.inputSource,
    },
    {
      headerKey: "userCode",
      value: model.userCode,
    },
    {
      headerKey: "name",
      value: model.name,
    },
    {
      headerKey: "price",
      value: priceView,
    },
    {
      headerKey: "bundleItemId",
      value: model.bundleItemId,
    },
    {
      headerKey: "bundlePriceType",
      value: model.bundlePriceType,
    },
    {
      headerKey: "bundlePrice",
      value: model.bundlePrice,
    },
    {
      headerKey: "receiptPrintLocation",
      value: model.receiptPrintLocation,
    },
  ];
};

export const getScheduledOrderCells = (
  rowKey: string,
  user: AuthUserType | User,
  onCellDataChange: (
    rowKey: string,
    headerKey: string,
    value: string | number | boolean
  ) => void
): MyTreeGridRowCellType[] => {
  return [
    {
      headerKey: "scheduledOrderApplyDate",
      value: "",
      inputType: "myDateTime",
    },
    {
      headerKey: "scheduledOrderMemo",
      value: "",
      customRender: (
        <ScheduledOrderMemoCell
          memo={""}
          onMemoChangeAction={(value) => {
            onCellDataChange(rowKey, "scheduledOrderMemo", value);
          }}
        />
      ),
    },
    {
      headerKey: "scheduledOrderCreateDate",
      value: formatDate(new Date(), "-"),
    },
    {
      headerKey: "scheduledOrderCreateName",
      value: user.name,
    },
    {
      headerKey: "scheduledOrderCreateId",
      value: user.id,
    }
  ];
};
